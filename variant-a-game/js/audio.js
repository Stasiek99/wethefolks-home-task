(function () {
  'use strict';

  const CONFIG = window.GutRunConfig.audio;

  const FILES = {
    music: 'assets/music/background_music/Funny Game Loop.mp3',
    crash: 'assets/music/crash/Cartoon Crash Boing.mp3',
    fail: 'assets/music/endcard_fail/Fail.mp3',
    cheer: 'assets/music/endcard_win/Celebrative Happy Woohoo Cheer 2.mp3',
    applause: 'assets/music/endcard_win/applause.mp3',
  };

  const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'keydown'];

  const SILENCE_THRESHOLD = 0.002;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  let context = null;
  let master = null;
  let muted = readMuted();
  let wantMusic = false;
  let music = null;
  let suspendedByPause = false;
  let musicLoop = null;

  const buffers = {};
  const loadErrors = [];
  const active = new Set();

  function readMuted() {
    try {
      return window.localStorage.getItem(CONFIG.muteStorageKey) === '1';
    } catch (error) {
      return false;
    }
  }

  function writeMuted(value) {
    try {
      window.localStorage.setItem(CONFIG.muteStorageKey, value ? '1' : '0');
    } catch (error) {
      console.warn('[GutRun] mute state not saved:', error && error.message);
    }
  }

  function findLoopWindow(buffer) {
    let first = buffer.length;
    let last = 0;

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);

      let head = 0;
      while (head < data.length && Math.abs(data[head]) < SILENCE_THRESHOLD) head++;

      let tail = data.length - 1;
      while (tail > head && Math.abs(data[tail]) < SILENCE_THRESHOLD) tail--;

      first = Math.min(first, head);
      last = Math.max(last, tail);
    }

    return { start: first / buffer.sampleRate, end: (last + 1) / buffer.sampleRate };
  }

  function decode(arrayBuffer) {
    return new Promise((resolve, reject) => {
      const result = context.decodeAudioData(arrayBuffer, resolve, reject);
      if (result && result.catch) result.catch(reject);
    });
  }

  function load(name) {
    return fetch(encodeURI(FILES[name]))
      .then((response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.arrayBuffer();
      })
      .then(decode)
      .then((buffer) => {
        buffers[name] = buffer;
        if (name === 'music') musicLoop = findLoopWindow(buffer);
        if (name === 'music' && wantMusic) startMusic();
      })
      .catch((error) => {
        const reason = (error && (error.message || error.name)) || String(error);
        loadErrors.push(name + ': ' + reason);
        console.warn('[GutRun] audio "' + name + '" not available:', reason);
      });
  }

  function resumeContext() {
    const resumed = context.resume();
    if (resumed && resumed.catch) resumed.catch(() => {});
  }

  function playSilence() {
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(1, 1, 22050);
    source.connect(context.destination);
    source.start(0);
  }

  function unlock() {
    if (!context || suspendedByPause || context.state === 'running') return;
    playSilence();
    resumeContext();
  }

  function watchForUnlock() {
    UNLOCK_EVENTS.forEach((type) => document.addEventListener(type, unlock, { capture: true, passive: true }));
  }

  function pause() {
    if (!context || context.state !== 'running') return;
    suspendedByPause = true;
    context.suspend();
  }

  function resume() {
    if (!suspendedByPause) return;
    suspendedByPause = false;
    resumeContext();
  }

  function createVoice(name, { volume, loop }) {
    const buffer = buffers[name];
    if (!context || !buffer) return null;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    if (loop && musicLoop) {
      source.loopStart = musicLoop.start;
      source.loopEnd = musicLoop.end;
    }

    const gain = context.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(master);

    const voice = { name, source, gain };
    active.add(voice);
    source.onended = () => {
      active.delete(voice);
      source.disconnect();
      gain.disconnect();
      if (music === voice) music = null;
    };

    source.start(0, loop && musicLoop ? musicLoop.start : 0);
    return voice;
  }

  function play(name, volume = CONFIG.sfxVolume) {
    return createVoice(name, { volume, loop: false });
  }

  function startMusic() {
    wantMusic = true;
    if (music) return;
    music = createVoice('music', { volume: CONFIG.musicVolume, loop: true });
  }

  function stopMusic() {
    wantMusic = false;
    if (!music) return;

    const voice = music;
    music = null;
    const now = context.currentTime;
    voice.gain.gain.setTargetAtTime(0, now, CONFIG.musicFade);
    voice.source.stop(now + CONFIG.musicFade * 5);
  }

  function stopAll() {
    wantMusic = false;
    music = null;
    active.forEach((voice) => voice.source.stop());
  }

  function setMuted(value) {
    muted = Boolean(value);
    writeMuted(muted);
    if (context) master.gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, 0.02);
    window.dispatchEvent(new CustomEvent('audio:mute', { detail: { muted } }));
  }

  function init() {
    if (!AudioContextClass) {
      console.warn('[GutRun] Web Audio is not supported, the ad plays without sound');
      return;
    }

    if (navigator.audioSession) navigator.audioSession.type = 'playback';

    context = new AudioContextClass({ latencyHint: 'interactive' });
    master = context.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(context.destination);

    watchForUnlock();
    Object.keys(FILES).forEach(load);
  }

  window.addEventListener('game:start', startMusic);
  window.addEventListener('game:fail', () => {
    if (!context) return;
    stopMusic();
    play('crash');
  });
  window.addEventListener('game:win', () => {
    if (context) stopMusic();
  });
  window.addEventListener('endcard:show', (event) => {
    if (!context) return;
    if (event.detail.kind === 'fail') {
      play('fail');
    } else {
      play('cheer');
      play('applause', CONFIG.applauseVolume);
    }
  });
  window.addEventListener('game:reset', stopAll);

  window.GameAudio = {
    init,
    pause,
    resume,
    setMuted,
    toggleMute: () => setMuted(!muted),
    get muted() {
      return muted;
    },
    snapshot: () => ({
      state: context ? context.state : 'unsupported',
      loaded: Object.keys(buffers),
      errors: loadErrors,
      voices: active.size,
      names: Array.from(active, (voice) => voice.name),
      music: Boolean(music),
      loopWindow: musicLoop,
      muted,
      gain: master ? Number(master.gain.value.toFixed(3)) : null,
    }),
  };
})();

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

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  let context = null;
  let master = null;
  let muted = readMuted();
  let wantMusic = false;
  let music = null;

  const buffers = {};
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
        if (name === 'music' && wantMusic) startMusic();
      })
      .catch((error) => {
        console.warn('[GutRun] audio "' + name + '" not available:', error && error.message);
      });
  }

  function unlock() {
    if (!context || context.state === 'running') return;
    const resumed = context.resume();
    if (resumed && resumed.catch) resumed.catch(() => {});
  }

  function watchForUnlock() {
    const onGesture = () => unlock();
    UNLOCK_EVENTS.forEach((type) => document.addEventListener(type, onGesture, { capture: true, passive: true }));

    context.addEventListener('statechange', () => {
      if (context.state !== 'running') return;
      UNLOCK_EVENTS.forEach((type) => document.removeEventListener(type, onGesture, { capture: true }));
    });
  }

  function createVoice(name, { volume, loop }) {
    const buffer = buffers[name];
    if (!context || !buffer) return null;

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

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

    source.start();
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
    setMuted,
    toggleMute: () => setMuted(!muted),
    get muted() {
      return muted;
    },
    snapshot: () => ({
      state: context ? context.state : 'unsupported',
      loaded: Object.keys(buffers),
      voices: active.size,
      names: Array.from(active, (voice) => voice.name),
      music: Boolean(music),
      muted,
      gain: master ? Number(master.gain.value.toFixed(3)) : null,
    }),
  };
})();

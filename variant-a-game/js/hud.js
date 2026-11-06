(function () {
  'use strict';

  const REPORT_INTERVAL = 1000;
  const LONG_FRAME = 25;

  function init() {
    if (!window.GutRun.DEBUG) return;

    const hud = document.createElement('div');
    hud.className = 'hud';
    document.querySelector('.viewport').append(hud);

    let frames = 0;
    let worst = 0;
    let longFrames = 0;
    let last = 0;
    let windowStart = performance.now();

    function report(fps) {
      const game = window.Game.snapshot();
      const audio = window.GameAudio.snapshot();
      const lines = [
        'fps ' + fps.toFixed(0) + ' | worst ' + worst.toFixed(0) + ' ms | frames > ' + LONG_FRAME + ' ms: ' + longFrames,
        'game ' + game.state + (game.paused ? ' (paused)' : '') + ' | dpr ' + window.devicePixelRatio,
        'audio ' + audio.state + ' | buffers ' + audio.loaded.length + '/5 | voices ' + audio.names.join(',') + ' | muted ' + audio.muted,
      ];
      if (audio.errors.length) lines.push('audio errors: ' + audio.errors.join('; '));
      hud.textContent = lines.join('\n');
    }

    function tick(now) {
      requestAnimationFrame(tick);

      if (last) {
        const delta = now - last;
        frames++;
        if (delta > worst) worst = delta;
        if (delta > LONG_FRAME) longFrames++;
      }
      last = now;

      const elapsed = now - windowStart;
      if (elapsed >= REPORT_INTERVAL) {
        report((frames * 1000) / elapsed);
        frames = 0;
        worst = 0;
        windowStart = now;
      }
    }

    requestAnimationFrame(tick);
  }

  window.Hud = { init };
})();

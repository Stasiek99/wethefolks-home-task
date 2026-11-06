(function () {
  'use strict';

  const SAFETY_MS = 5000;

  function whenStart(part, enabled, play) {
    if (!enabled) {
      play();
      return;
    }

    let started = false;

    function start() {
      started = true;
      play();
    }

    window.addEventListener('message', function (event) {
      if (event.source !== window.parent) return;
      if (!event.data || event.data.type !== 'fireplace:start') return;
      start();
    });

    window.setTimeout(function () {
      if (!started) start();
    }, SAFETY_MS);

    window.parent.postMessage({ type: 'fireplace:ready', part }, '*');
  }

  window.Sync = { whenStart };
})();

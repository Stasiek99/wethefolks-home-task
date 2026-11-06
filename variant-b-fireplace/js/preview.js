(function () {
  'use strict';

  const SAFETY_MS = 5000;

  const frames = Array.from(document.querySelectorAll('.js-frame'));
  const replay = document.querySelector('.js-replay');
  const ready = new Set();
  let started = false;

  function startAll() {
    started = true;
    frames.forEach(function (frame) {
      frame.contentWindow.postMessage({ type: 'fireplace:start' }, '*');
    });
  }

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'fireplace:ready') return;
    const known = frames.some(function (frame) {
      return frame.contentWindow === event.source;
    });
    if (!known) return;

    ready.add(event.data.part);
    if (!started && ready.size === frames.length) startAll();
  });

  window.setTimeout(function () {
    if (!started) startAll();
  }, SAFETY_MS);

  replay.addEventListener('click', startAll);
})();

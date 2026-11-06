(function () {
  'use strict';

  const SAFETY_MS = 5000;

  const frames = Array.from(document.querySelectorAll('.js-frame'));
  const replay = document.querySelector('.js-replay');
  const query = new URLSearchParams(window.location.search);
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

  frames.forEach(function (frame) {
    const params = new URLSearchParams({ sync: '1' });
    if (query.has('debug')) params.set('debug', '1');
    frame.src = frame.dataset.src + '?' + params;
  });
})();

(function () {
  'use strict';

  const TOGGLE_KEY = 'o';

  function init(ad, part) {
    const overlay = document.createElement('div');
    overlay.className = 'debug debug--' + part;
    ad.append(overlay);

    window.addEventListener('keydown', function (event) {
      if (event.key.toLowerCase() !== TOGGLE_KEY) return;
      overlay.hidden = !overlay.hidden;
    });
  }

  window.Debug = { init };
})();

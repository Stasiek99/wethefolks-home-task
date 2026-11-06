(function () {
  'use strict';

  const LABEL_MUTE = 'Ton ausschalten';
  const LABEL_UNMUTE = 'Ton einschalten';

  function init() {
    const button = document.querySelector('.js-mute');

    function render(muted) {
      button.classList.toggle('mute-toggle--muted', muted);
      button.setAttribute('aria-label', muted ? LABEL_UNMUTE : LABEL_MUTE);
    }

    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('click', () => window.GameAudio.toggleMute());
    window.addEventListener('audio:mute', (event) => render(event.detail.muted));

    render(window.GameAudio.muted);
  }

  window.Mute = { init };
})();

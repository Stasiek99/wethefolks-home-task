(function () {
  'use strict';

  const clickTag = window.clickTag || 'https://example.com/landing';

  const params = new URLSearchParams(window.location.search);
  const DEBUG = params.get('debug') === '1';

  window.GutRun = { clickTag, DEBUG };

  window.Game.init();
  window.GameAudio.init();
  window.Mute.init();
  window.Visibility.init();

  const decoded = Array.from(document.images, (img) => img.decode().catch(() => {}));
  Promise.all(decoded).then(() => window.Intro.play());

  window.addEventListener('game:fail', () => console.info('[GutRun] fail'));
  window.addEventListener('game:win', () => console.info('[GutRun] win'));
})();

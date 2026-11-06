(function () {
  'use strict';

  const clickTag = window.clickTag || 'https://example.com/landing';

  function decoded(root) {
    const images = Array.from(root.querySelectorAll('img'));
    return Promise.all(
      images.map(function (img) {
        return img.decode().catch(function () {});
      })
    );
  }

  function init() {
    const ad = document.querySelector('.js-ad');
    const part = ad.dataset.part;
    const params = new URLSearchParams(window.location.search);
    const sync = params.has('sync');

    ad.href = clickTag;

    if (params.has('debug')) window.Debug.init(ad, part);

    const timeline = window.Intro.build(ad, part);
    const motion = window.Motion.init(timeline);

    decoded(ad).then(function () {
      window.Sync.whenStart(part, sync, motion.play);
    });
  }

  init();
})();

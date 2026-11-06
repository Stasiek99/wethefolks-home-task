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
    const sync = new URLSearchParams(window.location.search).has('sync');

    ad.href = clickTag;

    const timeline = window.Intro.build(ad, part);

    decoded(ad).then(function () {
      window.Sync.whenStart(part, sync, function () {
        timeline.restart();
      });
    });
  }

  init();
})();

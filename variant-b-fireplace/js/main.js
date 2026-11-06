(function () {
  'use strict';

  const clickTag = window.clickTag || 'https://example.com/landing';

  function init() {
    const ad = document.querySelector('.js-ad');
    ad.href = clickTag;
  }

  init();
})();

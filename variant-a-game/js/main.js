(function () {
  'use strict';

  const clickTag = window.clickTag || 'https://example.com/landing';

  const params = new URLSearchParams(window.location.search);
  const DEBUG = params.get('debug') === '1';

  window.GutRun = { clickTag, DEBUG };
})();

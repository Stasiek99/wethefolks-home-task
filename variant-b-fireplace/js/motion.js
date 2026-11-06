(function () {
  'use strict';

  const query = window.matchMedia('(prefers-reduced-motion: reduce)');

  function init(timeline) {
    let resumeOnShow = false;

    function showFinal() {
      timeline.pause().seek('idle');
      gsap.ticker.sleep();
    }

    function play() {
      if (query.matches) {
        showFinal();
        return;
      }
      gsap.ticker.wake();
      timeline.restart();
    }

    timeline.eventCallback('onComplete', function () {
      gsap.ticker.sleep();
    });

    query.addEventListener('change', function () {
      if (query.matches) showFinal();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (timeline.isActive()) {
          timeline.pause();
          resumeOnShow = true;
        }
        return;
      }
      if (resumeOnShow) {
        resumeOnShow = false;
        timeline.resume();
      }
    });

    return { play };
  }

  window.Motion = { init };
})();

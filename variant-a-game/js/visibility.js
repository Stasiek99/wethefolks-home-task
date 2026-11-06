(function () {
  'use strict';

  const MIN_VISIBLE_RATIO = 0.25;

  const reasons = new Set();
  let paused = false;

  function apply() {
    const shouldPause = reasons.size > 0;
    if (shouldPause === paused) return;
    paused = shouldPause;

    if (paused) {
      gsap.globalTimeline.pause();
      window.Game.pause();
      window.GameAudio.pause();
    } else {
      window.Game.resume();
      gsap.globalTimeline.resume();
      window.GameAudio.resume();
    }
  }

  function setReason(reason, active) {
    if (active) reasons.add(reason);
    else reasons.delete(reason);
    apply();
  }

  function init() {
    document.addEventListener('visibilitychange', () => setReason('tab', document.hidden));
    window.addEventListener('pagehide', () => setReason('page', true));
    window.addEventListener('pageshow', () => setReason('page', false));

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          const latest = entries[entries.length - 1];
          setReason('viewport', latest.intersectionRatio < MIN_VISIBLE_RATIO);
        },
        { threshold: [0, MIN_VISIBLE_RATIO] }
      );
      observer.observe(document.querySelector('.viewport'));
    }

    setReason('tab', document.hidden);
  }

  window.Visibility = {
    init,
    get reasons() {
      return Array.from(reasons);
    },
  };
})();

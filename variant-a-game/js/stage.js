(function () {
  'use strict';

  const DESIGN_W = 360;
  const DESIGN_H = 640;

  const root = document.documentElement;

  function getViewportSize() {
    const vv = window.visualViewport;
    if (vv && vv.width && vv.height) {
      return { w: vv.width, h: vv.height };
    }
    return { w: window.innerWidth, h: window.innerHeight };
  }

  let rafId = 0;

  function applyScale() {
    rafId = 0;
    const { w, h } = getViewportSize();
    if (!w || !h) return;
    const scale = Math.min(w / DESIGN_W, h / DESIGN_H);
    root.style.setProperty('--scale', scale.toFixed(5));
    window.dispatchEvent(new CustomEvent('stage:resize', { detail: { scale, w, h } }));
  }

  function scheduleScale() {
    if (!rafId) rafId = requestAnimationFrame(applyScale);
  }

  window.addEventListener('resize', scheduleScale, { passive: true });
  window.addEventListener('orientationchange', scheduleScale, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', scheduleScale, { passive: true });
  }

  applyScale();

  window.Stage = { DESIGN_W, DESIGN_H };
})();

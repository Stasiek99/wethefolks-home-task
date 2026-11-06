(function () {
  'use strict';

  const BG_ZOOM_FROM = 1.1;
  const BG_ZOOM_DURATION = 4.6;
  const BG_FADE_DURATION = 0.9;

  const LOGO_ORIGIN = '160px 125px';
  const SKYSCRAPER_STAGGER = { left: 0, right: 0.12 };

  function layers(root, names) {
    return names.map(function (name) {
      return root.querySelector('.ad__layer--' + name);
    });
  }

  function backgroundTweens(timeline, root) {
    const bg = root.querySelector('.ad__layer--bg');
    const seams = Array.from(root.querySelectorAll('.ad__layer--seam'));

    gsap.set(bg, { scale: BG_ZOOM_FROM, opacity: 0 });
    gsap.set(seams, { opacity: 0 });

    timeline
      .to(bg, { scale: 1, duration: BG_ZOOM_DURATION, ease: 'power2.out' }, 0)
      .to([bg].concat(seams), { opacity: 1, duration: BG_FADE_DURATION, ease: 'power1.out' }, 0);
  }

  function skyscraper(root, part) {
    const timeline = gsap.timeline({ paused: true });
    const stagger = SKYSCRAPER_STAGGER[part];
    const els = layers(root, ['logo', 'box', 'copy', 'cta']);
    const logo = els[0];
    const box = els[1];
    const copy = els[2];
    const cta = els[3];

    backgroundTweens(timeline, root);

    gsap.set(logo, { opacity: 0, scale: 0.8, transformOrigin: LOGO_ORIGIN });
    gsap.set(box, { opacity: 0, y: 80 });
    gsap.set(copy, { opacity: 0, y: 24 });
    gsap.set(cta, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' });

    timeline
      .to(logo, { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.6)' }, 0.5 + stagger)
      .to(box, { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 1.5 + stagger)
      .to(copy, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 2.1 + stagger)
      .to(cta, { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(2)' }, 2.7 + stagger);

    return timeline;
  }

  function top(root) {
    const timeline = gsap.timeline({ paused: true });
    const lines = Array.from(root.querySelectorAll('.ad__layer--line'));

    backgroundTweens(timeline, root);

    gsap.set(lines, { opacity: 0, y: 30 });

    timeline.to(lines, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.28 }, 0.9);

    return timeline;
  }

  function build(root, part) {
    return part === 'top' ? top(root) : skyscraper(root, part);
  }

  window.Intro = { build };
})();

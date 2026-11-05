(function () {
  'use strict';

  const mm = gsap.matchMedia();

  let idleTweens = [];

  function query(selector) {
    return document.querySelector(selector);
  }

  function startIdle(player, gesture) {
    const float = gsap.to(player, {
      y: -5,
      duration: 1.1,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    const tap = gsap.timeline({ repeat: -1, repeatDelay: 0.9 });
    tap
      .set(gesture, { transformOrigin: '45% 12%' })
      .to(gesture, { scale: 0.9, duration: 0.18, ease: 'power2.out' })
      .to(gesture, { scale: 1, duration: 0.45, ease: 'back.out(3)' });

    idleTweens = [float, tap];
  }

  function play() {
    const logo = query('.js-logo');
    const headline = query('.js-headline');
    const player = query('.js-player');
    const gesture = query('.js-gesture');

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(logo, { y: -24, autoAlpha: 0, duration: 0.5 })
        .from(headline, { y: 20, autoAlpha: 0, duration: 0.6 }, '-=0.25')
        .from(player, { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2.4)' }, '-=0.2')
        .from(gesture, { y: 14, autoAlpha: 0, duration: 0.5 }, '-=0.2')
        .add(() => startIdle(player, gesture));

      return () => {
        idleTweens.forEach((t) => t.kill());
        idleTweens = [];
      };
    });
  }

  function dismiss() {
    const player = query('.js-player');
    const gesture = query('.js-gesture');

    idleTweens.forEach((t) => t.kill());
    idleTweens = [];

    gsap.to(player, { y: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(gesture, { autoAlpha: 0, scale: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
  }

  function resume() {
    const player = query('.js-player');
    const gesture = query('.js-gesture');

    gsap.set(gesture, { autoAlpha: 1, scale: 1 });
    gsap.set(player, { y: 0 });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      startIdle(player, gesture);
    }
  }

  window.Intro = { play, dismiss, resume };
})();

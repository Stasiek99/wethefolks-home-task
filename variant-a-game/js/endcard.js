(function () {
  'use strict';

  const TIMING = window.GutRunConfig.endcard;

  const stage = document.querySelector('.stage');
  const cards = {
    fail: document.querySelector('.js-endcard-fail'),
    win: document.querySelector('.js-endcard-win'),
  };

  let activeCard = null;
  let showTimer = null;
  let motion = null;

  function clickOut() {
    window.open(window.GutRun.clickTag, '_blank', 'noopener');
  }

  function all(card, selector) {
    return card.querySelectorAll(selector);
  }

  function one(card, selector) {
    return card.querySelector(selector);
  }

  function buildFail(card) {
    const bubble = one(card, '.js-end-bubble');
    const bacteria = all(card, '.js-end-bacterium');
    const poo = one(card, '.js-end-poo');
    const headline = one(card, '.js-end-headline');
    const buttons = all(card, '.endcard__button');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: TIMING.fade, ease: 'power1.out' })
      .add(() => stage.classList.add('stage--ended'))
      .from(bubble, { scale: 0.55, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.8)' }, 0.1)
      .from(poo, { y: -70, autoAlpha: 0, duration: 0.8, ease: 'bounce.out' }, 0.3)
      .from(bacteria, { scale: 0, autoAlpha: 0, duration: 0.45, stagger: 0.08, ease: 'back.out(2.4)' }, 0.4)
      .from(headline, { y: 24, autoAlpha: 0, duration: 0.55 }, 0.8)
      .from(buttons, { y: 20, autoAlpha: 0, duration: 0.5, stagger: 0.12, ease: 'back.out(1.6)' }, 1.0);

    gsap.to(poo, {
      rotation: 2.5,
      duration: 1.4,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 10,
      delay: tl.duration(),
    });

    bacteria.forEach((bacterium, index) => {
      gsap.to(bacterium, {
        y: index % 2 ? 5 : -5,
        duration: 1.5 + index * 0.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 9,
        delay: tl.duration() + index * 0.1,
      });
    });
  }

  function buildWin(card) {
    const bubble = one(card, '.js-end-bubble');
    const poo = one(card, '.js-end-poo');
    const confetti = one(card, '.js-end-confetti');
    const headline = one(card, '.js-end-headline');
    const cta = one(card, '.js-end-cta');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: TIMING.fade, ease: 'power1.out' })
      .add(() => stage.classList.add('stage--ended'))
      .from(bubble, { scale: 0.55, autoAlpha: 0, duration: 0.55, ease: 'back.out(1.8)' }, 0.1)
      .from(poo, { y: 80, autoAlpha: 0, duration: 0.7, ease: 'back.out(2)' }, 0.3)
      .from(confetti, { scale: 0.1, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.2)' }, 0.35)
      .from(headline, { y: 24, autoAlpha: 0, duration: 0.55 }, 0.8)
      .from(cta, { y: 20, autoAlpha: 0, duration: 0.5, ease: 'back.out(1.6)' }, 1.0);

    gsap.to(poo, {
      y: -6,
      duration: 0.7,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 20,
      delay: tl.duration(),
    });

    gsap.to(confetti, {
      y: 5,
      duration: 1.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: 8,
      delay: tl.duration(),
    });
  }

  const BUILDERS = { fail: buildFail, win: buildWin };

  function hide() {
    if (showTimer) {
      showTimer.kill();
      showTimer = null;
    }
    if (motion) {
      motion.revert();
      motion = null;
    }

    stage.classList.remove('stage--ended');

    if (activeCard) {
      activeCard.classList.remove('endcard--active');
      activeCard.setAttribute('aria-hidden', 'true');
      activeCard = null;
    }
  }

  function show(kind) {
    hide();

    activeCard = cards[kind];
    activeCard.classList.add('endcard--active');
    activeCard.setAttribute('aria-hidden', 'false');

    motion = gsap.matchMedia();
    motion.add('(prefers-reduced-motion: no-preference)', () => BUILDERS[kind](activeCard));
    motion.add('(prefers-reduced-motion: reduce)', () => {
      stage.classList.add('stage--ended');
    });
  }

  function schedule(kind, delay) {
    if (showTimer) showTimer.kill();
    showTimer = gsap.delayedCall(delay, () => {
      showTimer = null;
      show(kind);
    });
  }

  function replay() {
    hide();
    window.Game.reset();
    window.Intro.resume();
  }

  document.querySelectorAll('.js-end-cta').forEach((button) => button.addEventListener('click', clickOut));
  document.querySelector('.js-end-replay').addEventListener('click', replay);

  window.addEventListener('game:fail', () => schedule('fail', TIMING.failDelay));
  window.addEventListener('game:win', () => schedule('win', TIMING.winDelay));

  window.Endcard = { show, hide };
})();

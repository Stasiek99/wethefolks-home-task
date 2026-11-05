(function () {
  'use strict';

  const CONFIG = window.GutRunConfig;
  const { player: PLAYER, physics: PHYSICS, scroll: SCROLL, bounds: BOUNDS, rewind: REWIND } = CONFIG;

  const STATE = Object.freeze({
    READY: 'ready',
    REWIND: 'rewind',
    RUNNING: 'running',
    FAIL: 'fail',
    WIN: 'win',
  });

  const MAX_FRAME_TIME = 0.05;

  let state = STATE.READY;
  let gutX = SCROLL.startX;
  let y = PLAYER.startY;
  let velocityY = 0;

  let rafId = 0;
  let lastTime = 0;
  let accumulator = 0;
  let rewindTween = null;

  let gutEl = null;
  let setPlayerY = null;
  let renderDebug = () => {};

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent('game:' + name, { detail }));
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function render() {
    gutEl.style.setProperty('--gut-x', gutX.toFixed(2) + 'px');
    setPlayerY(y - PLAYER.startY);
    renderDebug();
  }

  function progress() {
    return Math.min(1, Math.max(0, (SCROLL.runStartX - gutX) / (SCROLL.runStartX - SCROLL.endX)));
  }

  function scrollSpeed() {
    return SCROLL.speedStart + (SCROLL.speedEnd - SCROLL.speedStart) * progress();
  }

  function update(dt) {
    gutX -= scrollSpeed() * dt;

    velocityY = Math.min(velocityY + PHYSICS.gravity * dt, PHYSICS.maxFallSpeed);
    y += velocityY * dt;

    const hitboxTop = y + PLAYER.hitbox.y;
    const hitboxBottom = hitboxTop + PLAYER.hitbox.h;
    if (hitboxTop < BOUNDS.top || hitboxBottom > BOUNDS.bottom) {
      finish(STATE.FAIL);
      return;
    }

    if (gutX <= SCROLL.endX) {
      gutX = SCROLL.endX;
      finish(STATE.WIN);
    }
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);

    const dt = Math.min((now - lastTime) / 1000, MAX_FRAME_TIME);
    lastTime = now;
    accumulator += dt;

    while (accumulator >= PHYSICS.step && state === STATE.RUNNING) {
      update(PHYSICS.step);
      accumulator -= PHYSICS.step;
    }
    render();
  }

  function stopLoop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function finish(result) {
    state = result;
    stopLoop();
    render();
    emit(result === STATE.WIN ? 'win' : 'fail', { progress: progress() });
  }

  function beginRun() {
    state = STATE.RUNNING;
    velocityY = PHYSICS.startVelocity;
    accumulator = 0;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    state = STATE.REWIND;
    window.Intro.dismiss();
    emit('start');

    const position = { x: gutX };
    rewindTween = gsap.to(position, {
      x: SCROLL.runStartX,
      duration: prefersReducedMotion() ? 0 : REWIND.duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        gutX = position.x;
        render();
      },
      onComplete: () => {
        gutX = SCROLL.runStartX;
        render();
        beginRun();
      },
    });
  }

  function jump() {
    velocityY = PHYSICS.jumpVelocity;
  }

  function onPointerDown(event) {
    if (event.button > 0) return;

    if (state === STATE.READY) start();
    else if (state === STATE.RUNNING) jump();
  }

  function reset() {
    if (rewindTween) rewindTween.kill();
    rewindTween = null;
    stopLoop();

    state = STATE.READY;
    gutX = SCROLL.startX;
    y = PLAYER.startY;
    velocityY = 0;
    render();
  }

  function createDebugOverlay(stage) {
    const overlay = document.createElement('div');
    overlay.className = 'debug';

    const hitbox = document.createElement('div');
    hitbox.className = 'debug__hitbox';
    hitbox.style.width = PLAYER.hitbox.w + 'px';
    hitbox.style.height = PLAYER.hitbox.h + 'px';

    const limits = [BOUNDS.top, BOUNDS.bottom].map((lineY) => {
      const line = document.createElement('div');
      line.className = 'debug__limit';
      line.style.top = lineY + 'px';
      return line;
    });

    overlay.append(hitbox, ...limits);
    stage.append(overlay);

    return () => {
      hitbox.style.transform = `translate(${PLAYER.x + PLAYER.hitbox.x}px, ${y + PLAYER.hitbox.y}px)`;
    };
  }

  function init() {
    const stage = document.querySelector('.stage');
    gutEl = document.querySelector('.playfield__gut');
    setPlayerY = gsap.quickSetter(document.querySelector('.js-player'), 'y', 'px');

    if (window.GutRun.DEBUG) renderDebug = createDebugOverlay(stage);

    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    render();
  }

  window.Game = {
    init,
    reset,
    get state() {
      return state;
    },
  };
})();

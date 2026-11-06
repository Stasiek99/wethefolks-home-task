(function () {
  'use strict';

  const CONFIG = window.GutRunConfig;
  const { player: PLAYER, physics: PHYSICS, scroll: SCROLL, bounds: BOUNDS, rewind: REWIND } = CONFIG;

  const PLAYER_SHAPE = window.GutRunHitboxes.player.rects;
  const SHAPE_TOP = Math.min(...PLAYER_SHAPE.map(([, ry]) => ry));
  const SHAPE_BOTTOM = Math.max(...PLAYER_SHAPE.map(([, ry, , rh]) => ry + rh));

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

  let worldEl = null;
  let setPlayerY = null;
  let renderDebug = () => {};

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent('game:' + name, { detail }));
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function render() {
    worldEl.style.setProperty('--gut-x', gutX.toFixed(2) + 'px');
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

    if (y + SHAPE_TOP < BOUNDS.top || y + SHAPE_BOTTOM > BOUNDS.bottom) {
      finish(STATE.FAIL, { reason: 'bounds' });
      return;
    }

    const obstacle = window.Obstacles.hit(gutX, playerRects());
    if (obstacle) {
      finish(STATE.FAIL, { reason: 'obstacle', sprite: obstacle.sprite });
      return;
    }

    if (gutX <= SCROLL.endX && window.Obstacles.allPassed(gutX, PLAYER.x)) {
      gutX = SCROLL.endX;
      finish(STATE.WIN);
    }
  }

  function playerRects() {
    return PLAYER_SHAPE.map(([rx, ry, rw, rh]) => ({
      x0: PLAYER.x + rx,
      y0: y + ry,
      x1: PLAYER.x + rx + rw,
      y1: y + ry + rh,
    }));
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

  function finish(result, detail) {
    state = result;
    stopLoop();
    render();
    emit(result === STATE.WIN ? 'win' : 'fail', { progress: progress(), ...detail });
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
    emit('reset');
  }

  function createDebugOverlay(stage) {
    const overlay = document.createElement('div');
    overlay.className = 'debug';

    const hitboxes = PLAYER_SHAPE.map(([rx, ry, rw, rh]) => {
      const box = document.createElement('div');
      box.className = 'debug__hitbox';
      box.style.left = PLAYER.x + rx + 'px';
      box.style.width = rw + 'px';
      box.style.height = rh + 'px';
      box.dataset.offset = ry;
      return box;
    });

    const limits = [BOUNDS.top, BOUNDS.bottom].map((lineY) => {
      const line = document.createElement('div');
      line.className = 'debug__limit';
      line.style.top = lineY + 'px';
      return line;
    });

    overlay.append(...hitboxes, ...limits);
    stage.append(overlay);

    return () => {
      hitboxes.forEach((box) => {
        box.style.top = y + Number(box.dataset.offset) + 'px';
      });
    };
  }

  function init() {
    const stage = document.querySelector('.stage');
    worldEl = document.querySelector('.js-world');
    setPlayerY = gsap.quickSetter(document.querySelector('.js-player'), 'y', 'px');

    window.Obstacles.build(worldEl, { debug: window.GutRun.DEBUG });
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
    snapshot: () => ({ state, y, velocityY, gutX }),
  };
})();

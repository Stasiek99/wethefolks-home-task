(function () {
  'use strict';

  const CONFIG = window.GutRunConfig;
  const { player: PLAYER, physics: PHYSICS, scroll: SCROLL, bounds: BOUNDS, rewind: REWIND } = CONFIG;

  const PLAYER_SHAPE = window.GutRunHitboxes.player.rects;
  const SHAPE_TOP = Math.min(...PLAYER_SHAPE.map(([, ry]) => ry));
  const SHAPE_BOTTOM = Math.max(...PLAYER_SHAPE.map(([, ry, , rh]) => ry + rh));

  const PLAYER_RECTS = PLAYER_SHAPE.map(([rx, ry, rw, rh]) => ({
    x0: PLAYER.x + rx,
    x1: PLAYER.x + rx + rw,
    offsetY: ry,
    height: rh,
    y0: 0,
    y1: 0,
  }));
  const PLAYER_LEFT = Math.min(...PLAYER_RECTS.map((rect) => rect.x0));
  const PLAYER_RIGHT = Math.max(...PLAYER_RECTS.map((rect) => rect.x1));

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
  let prevGutX = gutX;
  let prevY = y;

  let rafId = 0;
  let lastTime = 0;
  let accumulator = 0;
  let rewindTween = null;
  let paused = false;

  let worldEl = null;
  let setPlayerY = null;
  let renderDebug = () => {};

  function emit(name, detail) {
    window.dispatchEvent(new CustomEvent('game:' + name, { detail }));
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function render(alpha = 1) {
    const blend = state === STATE.RUNNING ? alpha : 1;
    const drawX = prevGutX + (gutX - prevGutX) * blend;
    const drawY = prevY + (y - prevY) * blend;

    worldEl.style.transform = 'translate3d(' + drawX.toFixed(2) + 'px,0,0)';
    setPlayerY(drawY - PLAYER.startY);
    renderDebug(drawY);
  }

  function progress() {
    return Math.min(1, Math.max(0, (SCROLL.runStartX - gutX) / (SCROLL.runStartX - SCROLL.endX)));
  }

  function scrollSpeed() {
    return SCROLL.speedStart + (SCROLL.speedEnd - SCROLL.speedStart) * progress();
  }

  function syncPlayerRects() {
    for (let i = 0; i < PLAYER_RECTS.length; i++) {
      const rect = PLAYER_RECTS[i];
      rect.y0 = y + rect.offsetY;
      rect.y1 = rect.y0 + rect.height;
    }
  }

  function update(dt) {
    prevGutX = gutX;
    prevY = y;
    gutX -= scrollSpeed() * dt;

    velocityY = Math.min(velocityY + PHYSICS.gravity * dt, PHYSICS.maxFallSpeed);
    y += velocityY * dt;

    if (y + SHAPE_TOP < BOUNDS.top || y + SHAPE_BOTTOM > BOUNDS.bottom) {
      finish(STATE.FAIL, { reason: 'bounds' });
      return;
    }

    syncPlayerRects();
    const obstacle = window.Obstacles.hit(gutX, PLAYER_RECTS, PLAYER_LEFT, PLAYER_RIGHT);
    if (obstacle) {
      finish(STATE.FAIL, { reason: 'obstacle', sprite: obstacle.sprite });
      return;
    }

    if (gutX <= SCROLL.endX && window.Obstacles.allPassed(gutX, PLAYER.x)) {
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
    render(accumulator / PHYSICS.step);
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
    prevGutX = gutX;
    prevY = y;
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
    if (paused || event.button > 0) return;

    if (state === STATE.READY) start();
    else if (state === STATE.RUNNING) jump();
  }

  function pause() {
    if (paused) return;
    paused = true;
    if (state === STATE.RUNNING) stopLoop();
  }

  function resume() {
    if (!paused) return;
    paused = false;
    if (state !== STATE.RUNNING) return;

    accumulator = 0;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
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

    return (drawY) => {
      hitboxes.forEach((box) => {
        box.style.top = drawY + Number(box.dataset.offset) + 'px';
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
    pause,
    resume,
    get state() {
      return state;
    },
    snapshot: () => ({ state, y, velocityY, gutX, paused }),
  };
})();

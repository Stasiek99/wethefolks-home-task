window.GutRunConfig = Object.freeze({
  player: Object.freeze({
    x: 55.5,
    startY: 258.5,
    w: 42,
    h: 41,
    hitbox: Object.freeze({ x: 5, y: 9, w: 32, h: 30 }),
  }),

  physics: Object.freeze({
    gravity: 1300,
    jumpVelocity: -380,
    startVelocity: -220,
    maxFallSpeed: 620,
    step: 1 / 120,
  }),

  scroll: Object.freeze({
    startX: -1027,
    runStartX: 0,
    endX: -2168,
    speedStart: 100,
    speedEnd: 130,
  }),

  bounds: Object.freeze({
    top: 223.5,
    bottom: 585.5,
  }),

  rewind: Object.freeze({
    duration: 0.6,
  }),
});

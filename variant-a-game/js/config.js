window.GutRunConfig = Object.freeze({
  playfield: Object.freeze({
    top: 168.5,
  }),

  player: Object.freeze({
    x: 55.5,
    startY: 258.5,
    w: 42,
    h: 41
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

  endcard: Object.freeze({
    failDelay: 0.7,
    winDelay: 0.9,
    fade: 0.3,
  }),

  course: Object.freeze([
    { sprite: 'bac1', x: 430, y: 296 },
    { sprite: 'txt3', x: 550, y: 504 },
    { sprite: 'txt2', x: 670, y: 236 },
    { sprite: 'txt1', x: 790, y: 474 },
    { sprite: 'txt7', x: 910, y: 266 },
    { sprite: 'txt4', x: 1030, y: 470 },
    { sprite: 'bac2', x: 1150, y: 250 },
    { sprite: 'bac3', x: 1270, y: 520 },
    { sprite: 'txt5', x: 1390, y: 392 },
    { sprite: 'bac6', x: 1510, y: 519.5 },
    { sprite: 'txt6', x: 1630, y: 236 },
    { sprite: 'bac5', x: 1750, y: 522 },
    { sprite: 'txt9', x: 1870, y: 236 },
    { sprite: 'bac4', x: 1990, y: 236 },
    { sprite: 'txt8', x: 2110, y: 420 },
  ].map(Object.freeze)),
});

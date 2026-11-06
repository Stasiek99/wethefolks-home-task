(function () {
  'use strict';

  const CONFIG = window.GutRunConfig;
  const HITBOXES = window.GutRunHitboxes;
  const PLAYFIELD_TOP = CONFIG.playfield.top;

  let obstacles = [];
  let lastRight = 0;

  function build(world, { debug }) {
    const debugLayer = debug ? document.createElement('div') : null;
    if (debugLayer) debugLayer.className = 'debug';

    obstacles = CONFIG.course.map((entry) => {
      const shape = HITBOXES[entry.sprite];
      const kind = entry.sprite.startsWith('bac') ? 'bacterium' : 'text';

      const img = document.createElement('img');
      img.className = `sprite obstacle obstacle--${kind}`;
      img.src = `assets/01_game/${entry.sprite}.png`;
      img.alt = '';
      img.draggable = false;
      img.style.left = entry.x + 'px';
      img.style.top = entry.y - PLAYFIELD_TOP + 'px';
      img.style.width = shape.w + 'px';
      img.style.height = shape.h + 'px';
      world.append(img);

      const rects = shape.rects.map(([rx, ry, rw, rh]) => ({
        x0: entry.x + rx,
        y0: entry.y + ry,
        x1: entry.x + rx + rw,
        y1: entry.y + ry + rh,
      }));

      if (debugLayer) {
        rects.forEach((r) => {
          const box = document.createElement('div');
          box.className = 'debug__hitbox debug__hitbox--obstacle';
          box.style.left = r.x0 + 'px';
          box.style.top = r.y0 - PLAYFIELD_TOP + 'px';
          box.style.width = r.x1 - r.x0 + 'px';
          box.style.height = r.y1 - r.y0 + 'px';
          debugLayer.append(box);
        });
      }

      return { sprite: entry.sprite, x: entry.x, y: entry.y, w: shape.w, h: shape.h, rects };
    });

    if (debugLayer) world.append(debugLayer);
    lastRight = Math.max(...obstacles.map((o) => o.x + o.w));
    return obstacles;
  }

  function hit(gutX, playerRects, left, right) {
    for (let i = 0; i < obstacles.length; i++) {
      const o = obstacles[i];
      const screenLeft = o.x + gutX;
      if (screenLeft > right || screenLeft + o.w < left) continue;

      for (let j = 0; j < o.rects.length; j++) {
        const r = o.rects[j];
        const x0 = r.x0 + gutX;
        const x1 = r.x1 + gutX;
        for (let k = 0; k < playerRects.length; k++) {
          const p = playerRects[k];
          if (p.x0 < x1 && p.x1 > x0 && p.y0 < r.y1 && p.y1 > r.y0) return o;
        }
      }
    }
    return null;
  }

  function allPassed(gutX, playerLeft) {
    return lastRight + gutX < playerLeft;
  }

  window.Obstacles = {
    build,
    hit,
    allPassed,
    get list() {
      return obstacles;
    },
  };
})();

#!/usr/bin/env python3
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOP_LIMIT, BOTTOM_LIMIT = 223.5, 585.5
END_X = 2168
PLAYER_X = 55.5
SAFETY = 8
MIN_GAP = 100
MIN_OVERLAP = 45


def load():
    with open(os.path.join(ROOT, 'js', 'hitboxes.js')) as f:
        text = f.read()
    hitboxes = json.loads(text[text.index('{'):text.rindex('}') + 1])
    with open(os.path.join(ROOT, 'js', 'config.js')) as f:
        config = f.read()
    course = [
        {'sprite': s, 'x': float(x), 'y': float(y)}
        for s, x, y in re.findall(r"\{ sprite: '(\w+)', x: ([\d.]+), y: ([\d.]+) \}", config)
    ]
    return hitboxes, course


def main():
    hitboxes, course = load()
    shape = hitboxes['player']['rects']
    p_top = min(r[1] for r in shape)
    p_bottom = max(r[1] + r[3] for r in shape)
    low = TOP_LIMIT - p_top + SAFETY
    high = BOTTOM_LIMIT - p_bottom - SAFETY

    def gaps(o):
        rects = hitboxes[o['sprite']]['rects']
        occ_top = min(o['y'] + r[1] for r in rects)
        occ_bottom = max(o['y'] + r[1] + r[3] for r in rects)
        found = [(low, occ_top - p_bottom - SAFETY), (occ_bottom - p_top + SAFETY, high)]
        return [g for g in found if g[1] - g[0] >= 0]

    problems = []
    all_gaps = [gaps(o) for o in course]

    sprites = [o['sprite'] for o in course]
    if len(set(sprites)) != len(sprites) or len(sprites) != 15:
        problems.append(f'expected 15 distinct obstacles, found {len(sprites)} ({len(set(sprites))} distinct)')

    wide = []
    for o, g in zip(course, all_gaps):
        w = [x for x in g if x[1] - x[0] >= MIN_GAP]
        if not w:
            problems.append(f"{o['sprite']}: no gap of at least {MIN_GAP}px")
        wide.append(w or g)

    n = len(course)
    best = [[(float('-inf'), -1)] * len(w) for w in wide]
    best[0] = [(float('inf'), -1)] * len(wide[0])
    for i in range(1, n):
        for k, b in enumerate(wide[i]):
            cands = []
            for j, a in enumerate(wide[i - 1]):
                overlap = min(a[1], b[1]) - max(a[0], b[0])
                cands.append((min(best[i - 1][j][0], overlap), j))
            best[i][k] = max(cands)
    k = max(range(len(wide[-1])), key=lambda q: best[-1][q][0])
    worst = best[-1][k][0]
    if worst < MIN_OVERLAP:
        problems.append(f'smallest overlap between consecutive gaps is {worst:.0f}px (need {MIN_OVERLAP})')

    last = max(o['x'] + hitboxes[o['sprite']]['w'] for o in course)
    if last - END_X >= PLAYER_X:
        problems.append(f'the last obstacle ends at {last:.0f}, the player is at {END_X + PLAYER_X:.0f} when the gut ends')

    widths = [max(b - a for a, b in g) for g in all_gaps]
    print(f'obstacles: {n}   widest gaps: min {min(widths):.0f}px   smallest overlap: {worst:.0f}px')
    for p in problems:
        print('PROBLEM:', p)
    print('course is fair' if not problems else 'course needs work')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main())

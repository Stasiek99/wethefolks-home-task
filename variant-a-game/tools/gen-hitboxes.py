#!/usr/bin/env python3
import json
import os
import sys

from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets', '01_game')
OUT = os.path.join(ROOT, 'js', 'hitboxes.js')

BAND = 8
MERGE_TOL = 6

TEXT_BAND = 4
TEXT_MERGE_TOL = 3
TEXT_INSET_X = 2

SHAPES = {
    'player': 4,
    'bac1': 6, 'bac2': 4, 'bac3': 4, 'bac4': 4, 'bac5': 6, 'bac6': 6,
}

TEXT = ['txt%d' % i for i in range(1, 10)]


def solid_mask(path, erode):
    alpha = Image.open(path).convert('RGBA').getchannel('A')
    mask = alpha.point(lambda a: 255 if a > 128 else 0)
    if erode:
        mask = mask.filter(ImageFilter.MinFilter(2 * erode + 1))
    return mask


def bands(mask, band):
    w, h = mask.size
    px = mask.load()
    out = []
    for y0 in range(0, h, band):
        y1 = min(y0 + band, h)
        xs = [x for y in range(y0, y1) for x in range(w) if px[x, y]]
        if xs:
            out.append([min(xs), y0, max(xs) + 1, y1])
    return out


def merge(rects, tol):
    merged = []
    for x0, y0, x1, y1 in rects:
        if merged and abs(merged[-1][0] - x0) <= tol and abs(merged[-1][2] - x1) <= tol \
                and merged[-1][3] == y0:
            m = merged[-1]
            m[0], m[2], m[3] = min(m[0], x0), max(m[2], x1), y1
        else:
            merged.append([x0, y0, x1, y1])
    return merged


def css(v):
    return round(v / 2 * 2) / 2


def text_rects(path):
    rects = merge(bands(solid_mask(path, 0), TEXT_BAND), TEXT_MERGE_TOL)
    return [[x0 + TEXT_INSET_X, y0, x1 - TEXT_INSET_X, y1] for x0, y0, x1, y1 in rects if x1 - x0 > 2 * TEXT_INSET_X]


def main():
    data = {}
    sources = [(n, e, False) for n, e in SHAPES.items()] + [(n, 0, True) for n in TEXT]
    for name, erode, is_text in sources:
        path = os.path.join(ASSETS, name + '.png')
        w, h = Image.open(path).size
        rects = text_rects(path) if is_text else merge(bands(solid_mask(path, erode), BAND), MERGE_TOL)
        data[name] = {
            'w': w / 2,
            'h': h / 2,
            'rects': [[css(x0), css(y0), css(x1 - x0), css(y1 - y0)] for x0, y0, x1, y1 in rects],
        }

    body = json.dumps(data, indent=2)
    with open(OUT, 'w', newline='\n') as f:
        f.write('window.GutRunHitboxes = ' + body + ';\n')

    for name, d in data.items():
        print(f'{name:7s} {d["w"]:>6}x{d["h"]:<6} rects={len(d["rects"])}')
    print('wrote', os.path.relpath(OUT, ROOT))


if __name__ == '__main__':
    sys.exit(main())

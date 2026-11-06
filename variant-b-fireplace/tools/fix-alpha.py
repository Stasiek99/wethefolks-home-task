#!/usr/bin/env python3
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')

BOX_ALPHA = 0.8
COPY_LEVELS = 10


def with_transparency(path, alphas):
    image = Image.open(path)
    if image.mode != 'P':
        sys.exit(path + ': expected a palette PNG, got ' + image.mode)
    if 'transparency' in image.info:
        print('skip (already has alpha): ' + path)
        return
    table = bytes(alphas.get(i, 255) for i in range(len(image.getpalette()) // 3))
    image.save(path, optimize=True, transparency=table)
    print('fixed: ' + path)


def main():
    with_transparency(os.path.join(ROOT, 'box.png'), {0: 0, 1: round(BOX_ALPHA * 255)})
    with_transparency(os.path.join(ROOT, 'cta.png'), {0: 0})
    ramp = {i: round(i * 255 / COPY_LEVELS) for i in range(COPY_LEVELS + 1)}
    for side in ('left', 'right'):
        with_transparency(os.path.join(ROOT, side, 'hl.png'), ramp)


if __name__ == '__main__':
    main()

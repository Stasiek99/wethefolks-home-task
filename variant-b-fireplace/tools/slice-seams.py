#!/usr/bin/env python3
import os

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets')

SCALE = 2
SEAM_W = 64
SEAM_H = 250
LEFT_X = 0
TOP_X = 324
RIGHT_X = 1360
SKYSCRAPER_W = 320
TOP_W = 1032

STRIPS = [
    ('left/seam.jpg', LEFT_X + SKYSCRAPER_W - SEAM_W),
    ('top/seam-start.jpg', TOP_X),
    ('top/seam-end.jpg', TOP_X + TOP_W - SEAM_W),
    ('right/seam.jpg', RIGHT_X),
]


def main():
    source = Image.open(os.path.join(ROOT, 'bg-big.jpg')).convert('RGB')
    for name, x in STRIPS:
        box = (x * SCALE, 0, (x + SEAM_W) * SCALE, SEAM_H * SCALE)
        path = os.path.join(ROOT, name)
        source.crop(box).save(path, quality=85, optimize=True, progressive=True)
        print(name, os.path.getsize(path), 'bytes')


if __name__ == '__main__':
    main()

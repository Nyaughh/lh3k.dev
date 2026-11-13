"""Draws the page's doodles from little fm's hand-drawn pencil doodles.

    python tools/make-doodles.py <folder holding little fm's components/*.ts>

little fm keeps each drawing as rows of pencil density (see its
components/user-doodles.ts). This reads those rows and writes PNGs to
assets/doodles/:

  <name>.png        a sticker: pink pencil line, white inside closed shapes
  <name>-ink.png    the plain pencil line in plum, for the project cards

Needs Pillow.
"""

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SOURCE = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'doodles'
STICKERS = ['flower', 'heart', 'star', 'notes', 'strawberry']
INK = ['cat', 'alienFace', 'spiral', 'notes', 'star']
PINK = (255, 105, 158)
PLUM = (90, 42, 60)
SCALE = 3          # the drawings are 128 units tall; this makes 384px
CAT_HEAD = (0, 0, 226, 200)   # the cat is drawn whole; the card shows its head
RUN = re.compile(r'M(\d+) (\d+)h(\d+)v1H\d+Z')


def load(name):
    text = (SOURCE / name).read_text(encoding='utf-8')
    start = text.index('= {') + 2
    return json.JSONDecoder().raw_decode(text, start)[0]   # ignores `as const;`


def density(art):
    """The drawing as a greyscale image: 255 where the pencil pressed hardest."""
    image = Image.new('L', (art['width'], art['height']), 0)
    pixels = image.load()
    for part in art['paths']:
        level = round(part['opacity'] * 255)
        for x, y, width in RUN.findall(part['d']):
            for i in range(int(x), int(x) + int(width)):
                pixels[i, int(y)] = max(pixels[i, int(y)], level)
    return image


def grow(image, by):
    return image.resize((image.width * by, image.height * by), Image.LANCZOS)


def line(art, colour, strength):
    """The pencil line alone, in one colour."""
    alpha = grow(density(art), SCALE).point(lambda v: min(255, int(v * strength)))
    picture = Image.new('RGBA', alpha.size, colour + (0,))
    picture.putalpha(alpha)
    return picture


def inside(art):
    """White for every spot the line closes off, so shapes read as stickers."""
    pad = 6
    drawn = density(art).point(lambda v: 255 if v > 40 else 0)
    canvas = Image.new('L', (drawn.width + pad * 2, drawn.height + pad * 2), 0)
    canvas.paste(drawn, (pad, pad))
    closed = canvas.filter(ImageFilter.MaxFilter(5))      # bridge pencil gaps
    ImageDraw.floodfill(closed, (0, 0), 128)              # 128 = outside
    solid = closed.point(lambda v: 0 if v == 128 else 255)
    solid = solid.filter(ImageFilter.MinFilter(5))        # back to the line's edge
    solid = solid.crop((pad, pad, pad + drawn.width, pad + drawn.height))
    return grow(solid, SCALE).filter(ImageFilter.GaussianBlur(1.2))


def main():
    drawings = {**load('user-doodles.ts'), **load('user-themed-doodles.ts')}
    OUT.mkdir(parents=True, exist_ok=True)
    for name in STICKERS:
        art = drawings[name]
        fill = Image.new('RGBA', (art['width'] * SCALE, art['height'] * SCALE), (255, 255, 255, 0))
        fill.putalpha(inside(art))
        fill.alpha_composite(line(art, PINK, 2.2))
        fill.save(OUT / f'{name}.png', optimize=True)
    for name in INK:
        file = re.sub(r'(?<!^)(?=[A-Z])', '-', name).lower()
        picture = line(drawings[name], PLUM, 2.0)
        if name == 'cat':
            picture = line(drawings[name], PLUM, 3.0).crop(tuple(v * SCALE for v in CAT_HEAD))
            picture = picture.resize((picture.width // 2, picture.height // 2), Image.LANCZOS)
        picture.save(OUT / f'{file}-ink.png', optimize=True)
    print('wrote', len(STICKERS) + len(INK), 'doodles to', OUT)


main()

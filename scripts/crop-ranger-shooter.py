#!/usr/bin/env python3
"""Generate space-ranger-shooter.png: mirrored crop + simple blaster."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "chinese-hero.jpg"
OUT = ROOT / "assets" / "space-ranger-shooter.png"
SIZE = 192

# Muzzle tip relative to output canvas (0–1); synced with js/star-fx.js MUZZLE_ANCHOR
MUZZLE_ANCHOR = {"x": 0.52, "y": 0.24}


def draw_blaster(draw: ImageDraw.ImageDraw, cx: int, cy: int) -> None:
    """Simple green/white space blaster in raised hand, pointing up-right."""
    # grip at hand
    draw.rounded_rectangle((cx - 8, cy + 2, cx + 10, cy + 22), radius=4, fill="#6ee7b7", outline="#047857", width=2)
    # barrel toward upper-right
    draw.polygon(
        [
            (cx + 8, cy + 2),
            (cx + 36, cy - 16),
            (cx + 42, cy - 8),
            (cx + 12, cy + 10),
        ],
        fill="#ecfdf5",
        outline="#34d399",
    )
    # muzzle tip
    draw.ellipse((cx + 34, cy - 22, cx + 46, cy - 10), fill="#fde68a", outline="#fbbf24", width=2)


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    # astronaut only — tighter crop, drop 士 companion
    crop = im.crop((int(w * 0.58), int(h * 0.08), int(w * 0.96), int(h * 0.88)))
    crop = ImageOps.mirror(crop)

    cw, ch = crop.size
    side = max(cw, ch)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - cw) // 2 + 4
    oy = (side - ch) // 2
    canvas.paste(crop, (ox, oy))

    canvas = canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    # raised hand area (pointing toward star bar)
    blaster_cx = int(SIZE * 0.26)
    blaster_cy = int(SIZE * 0.40)
    draw = ImageDraw.Draw(canvas)
    draw_blaster(draw, blaster_cx, blaster_cy)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, optimize=True)
    print(f"Wrote {OUT} ({SIZE}x{SIZE})")
    print(f"MUZZLE_ANCHOR = {MUZZLE_ANCHOR}")


if __name__ == "__main__":
    main()

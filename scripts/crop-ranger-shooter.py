#!/usr/bin/env python3
"""Generate space-ranger-shooter.png: mirrored crop + simple blaster."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "chinese-hero-poster.jpg"
OUT = ROOT / "assets" / "space-ranger-shooter.png"
SIZE = 192

# Muzzle tip relative to output canvas (0–1); synced with js/star-fx.js MUZZLE_ANCHOR
MUZZLE_ANCHOR = {"x": 0.94, "y": 0.38}

# Raised-hand grip centre on final 192×192 canvas (mirrored → gun arm upper-right)
BLASTER_CX_RATIO = 0.74
BLASTER_CY_RATIO = 0.48


def draw_glove(draw: ImageDraw.ImageDraw, cx: int, cy: int) -> None:
    """White glove behind blaster so the raised hand reads clearly."""
    draw.ellipse((cx - 12, cy - 4, cx + 14, cy + 18), fill="#f8fafc", outline="#cbd5e1", width=2)
    for i, dx in enumerate((-4, 2, 8)):
        draw.rounded_rectangle(
            (cx + dx - 2, cy - 12 + i * 2, cx + dx + 6, cy - 2 + i * 2),
            radius=2,
            fill="#f8fafc",
            outline="#cbd5e1",
            width=1,
        )


def draw_blaster(draw: ImageDraw.ImageDraw, cx: int, cy: int) -> tuple[int, int]:
    """Simple green/white space blaster in raised hand, pointing up-right."""
    draw_glove(draw, cx, cy)
    draw.rounded_rectangle(
        (cx - 5, cy + 2, cx + 11, cy + 18),
        radius=4,
        fill="#6ee7b7",
        outline="#047857",
        width=2,
    )
    draw.polygon(
        [
            (cx + 9, cy),
            (cx + 34, cy - 20),
            (cx + 40, cy - 12),
            (cx + 12, cy + 6),
        ],
        fill="#ecfdf5",
        outline="#34d399",
    )
    mx0, my0, mx1, my1 = cx + 32, cy - 26, cx + 44, cy - 14
    draw.ellipse((mx0, my0, mx1, my1), fill="#fde68a", outline="#fbbf24", width=2)
    return ((mx0 + mx1) // 2, (my0 + my1) // 2)


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    # Astronaut sits centre-right on poster; include both arms, drop 士 / title glyphs
    crop = im.crop((int(w * 0.42), int(h * 0.05), int(w * 0.92), int(h * 0.95)))
    crop = ImageOps.mirror(crop)

    cw, ch = crop.size
    side = max(cw, ch)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    ox = (side - cw) // 2
    oy = (side - ch) // 2
    canvas.paste(crop, (ox, oy))
    canvas = canvas.resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    blaster_cx = int(SIZE * BLASTER_CX_RATIO)
    blaster_cy = int(SIZE * BLASTER_CY_RATIO)
    draw = ImageDraw.Draw(canvas)
    muzzle = draw_blaster(draw, blaster_cx, blaster_cy)

    anchor = {"x": round(muzzle[0] / SIZE, 2), "y": round(muzzle[1] / SIZE, 2)}

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, optimize=True)
    print(f"Wrote {OUT} ({SIZE}x{SIZE})")
    print(f"MUZZLE_ANCHOR = {anchor}")


if __name__ == "__main__":
    main()

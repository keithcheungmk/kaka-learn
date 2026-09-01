#!/usr/bin/env python3
"""Crop display hero from full poster (removes letterbox + inner frame border)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
POSTER = ROOT / "assets" / "chinese-hero-poster.jpg"
OUT = ROOT / "assets" / "chinese-hero.jpg"

# Inset from full poster (1100×640) to colourful art edge-to-edge
CROP = (139, 120, 996, 587)  # L, T, R exclusive, B exclusive


def main() -> None:
    im = Image.open(POSTER).convert("RGB")
    L, T, R, B = CROP
    cropped = im.crop((L, T, R, B))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(OUT, quality=92, optimize=True)
    print(f"Wrote {OUT} ({cropped.size[0]}×{cropped.size[1]})")


if __name__ == "__main__":
    main()

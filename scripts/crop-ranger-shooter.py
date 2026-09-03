#!/usr/bin/env python3
"""Generate space-ranger-shooter.png from kaka-ranger-solo.png (KAKA RANGER).

飛星由握拳位射出（方案 b：唔手畫槍）。輸出 192×192 透明 PNG；
MUZZLE_ANCHOR 係拳頭中心（0–1），必須同 js/star-fx.js 同步。
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "kaka-ranger-solo.png"
OUT = ROOT / "assets" / "space-ranger-shooter.png"
META = ROOT / "assets" / "space-ranger-shooter.meta.json"
SIZE = 192

# 拳頭中心（viewer 左邊握拳）—— 喺 kaka-ranger-solo.png 全圖上量度，0–1
FIST_ANCHOR_SRC = {"x": 0.20, "y": 0.67}


def square_fit(im: Image.Image, size: int) -> tuple[Image.Image, dict]:
    """等比縮放 + 透明底置中，回傳 canvas 同映射資訊。"""
    im = im.convert("RGBA")
    bbox = im.getchannel("A").getbbox()
    if not bbox:
        raise ValueError(f"{SRC} 冇透明內容")
    cropped = im.crop(bbox)
    cw, ch = cropped.size
    scale = min(size / cw, size / ch)
    nw, nh = max(1, int(round(cw * scale))), max(1, int(round(ch * scale)))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - nw) // 2
    oy = (size - nh) // 2
    canvas.paste(resized, (ox, oy))
    return canvas, {
        "bbox": bbox,
        "scale": scale,
        "offset": (ox, oy),
        "src_size": im.size,
        "cropped_size": (cw, ch),
    }


def map_anchor(src: dict, fit: dict) -> dict[str, float]:
    sw, sh = fit["src_size"]
    bx0, by0, bx1, by1 = fit["bbox"]
    bw, bh = bx1 - bx0, by1 - by0
    # 全圖 0–1 → 裁切後像素
    px = bx0 + src["x"] * sw
    py = by0 + src["y"] * sh
    # → 縮放後 canvas
    cx = fit["offset"][0] + (px - bx0) * fit["scale"]
    cy = fit["offset"][1] + (py - by0) * fit["scale"]
    return {"x": round(cx / SIZE, 3), "y": round(cy / SIZE, 3)}


def main() -> None:
    im = Image.open(SRC)
    canvas, fit = square_fit(im, SIZE)
    anchor = map_anchor(FIST_ANCHOR_SRC, fit)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, optimize=True)
    META.write_text(
        json.dumps(
            {
                "source": str(SRC.relative_to(ROOT)),
                "fist_anchor_src": FIST_ANCHOR_SRC,
                "muzzle_anchor": anchor,
                "size": SIZE,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUT} ({SIZE}x{SIZE})")
    print(f"MUZZLE_ANCHOR = {anchor}")


if __name__ == "__main__":
    main()

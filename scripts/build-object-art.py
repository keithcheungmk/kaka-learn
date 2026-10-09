#!/usr/bin/env python3
"""屋企／日常用品／英文衣物物件插圖：白底生成圖 → 去背 → 裁邊 → 512px 透明 webp。

用法：
    python3 scripts/build-object-art.py <生成圖資料夾>

生成圖原檔唔入 repo；輸出 assets/object-art/<wordId>.webp。
改完記得：python3 scripts/check-invariants.py --update-image-lock
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "object-art"
SIZE = 512
MARGIN = 0.04

SOURCES = {
    # 屋企
    "zhuozi": "obj-zhuozi.jpg",
    "yigui": "sample-yigui.jpg",
    "xuegui": "sample-xuegui.jpg",
    "xiyiji": "obj-xiyiji.jpg",
    "fengshan": "sample-fengshan.jpg",
    "lengqi": "obj-lengqi.jpg",
    "chouti": "obj-chouti.jpg",
    "ditan": "obj-ditan.jpg",
    "yangtai": "obj-yangtai.jpg",
    "xishoutai": "obj-xishoutai.jpg",
    "shuifang": "obj-shuifang.jpg",
    "zhentou": "obj-zhentou.jpg",
    "beizi": "obj-beizi.jpg",
    "chufang": "obj-chufang.jpg",
    "mensuo": "obj-mensuo3.jpg",
    "shuilongtou": "obj-shuilongtou.jpg",
    # 日常用品
    "maojin": "obj-maojin.jpg",
    "yagao": "obj-yagao.jpg",
    "shuihu": "obj-shuihu.jpg",
    "xitoushui": "obj-xitoushui.jpg",
    "muyulu": "obj-muyulu.jpg",
    "shuzi": "obj-shuzi.jpg",
    "zhijin": "obj-zhijin.jpg",
    "beizi_cup": "obj-beizi-cup.jpg",
    "chazi": "obj-chazi.jpg",
    # 英文 Clothes（Emoji 成對撞圖）
    "clothes_shirt": "clothes-shirt.jpg",
    "clothes_jacket": "clothes-jacket.jpg",
    "clothes_coat": "clothes-coat.jpg",
    "clothes_scarf": "clothes-scarf.jpg",
    "clothes_dress": "clothes-dress.jpg",
    "clothes_skirt": "clothes-skirt.jpg",
    "clothes_pants": "clothes-pants.jpg",
    "clothes_shorts": "clothes-shorts.jpg",
}


# 生成圖底下有淺灰影；物件本身唔係白色邊先可以用高容差，白色物件（雪櫃、洗衣機）維持 14。
SHADOW_TOL = {
    "beizi": 50, "chufang": 50, "shuifang": 50, "yangtai": 40, "yigui": 50,
    "chouti": 50, "zhuozi": 50, "zhentou": 50, "zhijin": 30, "xishoutai": 30,
    "muyulu": 30, "xitoushui": 30, "mensuo": 50, "beizi_cup": 30, "ditan": 40,
}
# 邊緣冇白色部分嘅物件：連住背景嘅中性灰（影）一併去走。
NEUTRAL_SHADOW = {"beizi", "chufang", "shuifang", "yangtai", "yigui", "chouti", "zhuozi", "mensuo"}


def strip_neutral_shadow(img):
    """由四邊 flood fill 走低飽和度嘅灰白位；有顏色（木、米、黃）嘅位會擋住。"""
    from collections import deque

    import numpy as np
    from PIL import Image, ImageFilter

    a = np.array(img)
    h, w = a.shape[:2]
    rgb = a[:, :, :3].astype(int)
    grey = (rgb.max(axis=2) - rgb.min(axis=2) < 22) & (rgb.mean(axis=2) > 120)
    removable = grey | (a[:, :, 3] == 0)
    seen = np.zeros((h, w), bool)
    q = deque()
    for y in range(h):
        for x in (0, w - 1):
            if removable[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    for x in range(w):
        for y in (0, h - 1):
            if removable[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and removable[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((ny, nx))
    alpha = np.where(seen, 0, 255).astype(np.uint8)
    alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(1.0)))
    a[:, :, 3] = np.minimum(a[:, :, 3], alpha)
    return Image.fromarray(a)


def load_cutout():
    spec = importlib.util.spec_from_file_location("cutout_bg", ROOT / "scripts" / "cutout-bg.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.cutout


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    from PIL import Image

    src_dir = Path(sys.argv[1]).expanduser()
    cutout = load_cutout()
    OUT.mkdir(parents=True, exist_ok=True)
    for word_id, name in SOURCES.items():
        src = src_dir / name
        if not src.exists():
            raise SystemExit(f"揾唔到 {src}")
        img, frac = cutout(src, tol=SHADOW_TOL.get(word_id, 14), feather=1.0)
        if frac < 0.15:
            raise SystemExit(f"{word_id} 去背唔成功（透明只有 {frac:.0%}），要重新生成白底圖")
        if word_id in NEUTRAL_SHADOW:
            img = strip_neutral_shadow(img)
        img = img.crop(img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())
        side = int(max(img.size) * (1 + 2 * MARGIN))
        canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        canvas.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
        canvas = canvas.resize((SIZE, SIZE), Image.LANCZOS)
        dst = OUT / f"{word_id}.webp"
        canvas.save(dst, "WEBP", quality=86, method=6)
        print(f"  ✓ {word_id:<12} ← {name}（透明 {frac:.0%}，{dst.stat().st_size // 1024}KB）")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""去背：把「連住圖片邊界」嗰片單色背景變透明。

用途：`assets/dino/` 有幾張恐龍係白底，喺深色卡上面會見到白框，
同已經去咗背嘅甲龍、三角龍唔一致。

點解用 flood fill 而唔用「亮度門檻」或者 `border-radius`：

- **亮度門檻**會連恐龍身上淺色部分、行星暗面一齊蝕走。
- **圓形遮罩**會切走土星環、恐龍條尾。
- **Flood fill 由四邊入**：只有連住邊界嘅背景先變透明，
  恐龍隻眼／牙嗰啲被包住嘅白色、行星暗面都保得住。

已經有透明通道嘅圖唔會被覆蓋（會取兩者較細嘅 alpha）。

用法：
    python3 scripts/cutout-bg.py assets/dino/sulong.jpg --out /tmp/preview.png   # 試做
    python3 scripts/cutout-bg.py assets/dino/*.jpg --write                        # 就地改
    python3 scripts/cutout-bg.py assets/dino/*.jpg --write --to-png               # 順手改埋副檔名

改完記得：
    python3 scripts/check-invariants.py --update-image-lock
"""

from __future__ import annotations

import argparse
import sys
from collections import deque
from pathlib import Path


def cutout(path: Path, tol: float, feather: float):
    import numpy as np
    from PIL import Image, ImageFilter

    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    h, w = a.shape[:2]
    rgb = a[:, :, :3].astype(int)

    corners = np.array([rgb[0, 0], rgb[0, w - 1], rgb[h - 1, 0], rgb[h - 1, w - 1]])
    bg = corners.mean(axis=0)
    like_bg = np.sqrt(((rgb - bg) ** 2).sum(axis=2)) <= tol

    seen = np.zeros((h, w), bool)
    q: deque = deque()

    def push(y, x):
        if like_bg[y, x] and not seen[y, x]:
            seen[y, x] = True
            q.append((y, x))

    for x in range(w):
        push(0, x)
        push(h - 1, x)
    for y in range(h):
        push(y, 0)
        push(y, w - 1)

    while q:
        y, x = q.popleft()
        if y > 0: push(y - 1, x)
        if y < h - 1: push(y + 1, x)
        if x > 0: push(y, x - 1)
        if x < w - 1: push(y, x + 1)

    alpha = np.where(seen, 0, 255).astype(np.uint8)
    if feather > 0:
        alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(feather)))
    # 本身已經透明嘅位保持透明
    a[:, :, 3] = np.minimum(a[:, :, 3], alpha)
    return Image.fromarray(a), float((a[:, :, 3] == 0).mean())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('paths', nargs='+')
    ap.add_argument('--write', action='store_true', help='就地覆寫（預設淨係試做）')
    ap.add_argument('--to-png', action='store_true', help='順手把副檔名改做 .png（要自己更新 words.js 嘅 photo 路徑）')
    ap.add_argument('--out', help='試做時嘅輸出檔（單一檔案用）')
    ap.add_argument('--tol', type=float, default=28, help='背景色容差，JPEG 壓縮雜訊多就調大（預設 28）')
    ap.add_argument('--feather', type=float, default=1.0, help='邊緣柔化半徑，0 = 唔柔化（預設 1）')
    args = ap.parse_args()

    try:
        import numpy  # noqa: F401
        from PIL import Image  # noqa: F401
    except ImportError:
        print('要 pillow 同 numpy：pip install pillow numpy')
        return 1

    for raw in args.paths:
        p = Path(raw)
        if not p.exists():
            print(f'  ✗ 揾唔到 {p}')
            return 1
        img, frac = cutout(p, args.tol, args.feather)
        if frac < 0.02:
            print(f'  · {p} 冇乜背景可以去（透明只有 {frac * 100:.1f}%），跳過')
            continue
        if args.write:
            dst = p.with_suffix('.png') if args.to_png else p
            img.save(dst, 'PNG', optimize=True)
            if dst != p:
                p.unlink()
            print(f'  ✓ {p} → {dst}（透明 {frac * 100:.1f}%，{dst.stat().st_size // 1024}KB）')
        else:
            out = Path(args.out) if args.out else Path('/tmp') / (p.stem + '-cutout.png')
            img.save(out, 'PNG', optimize=True)
            print(f'  · 試做 {p} → {out}（透明 {frac * 100:.1f}%）')

    if args.write:
        print('\n記得跑：python3 scripts/check-invariants.py --update-image-lock')
    return 0


if __name__ == '__main__':
    sys.exit(main())

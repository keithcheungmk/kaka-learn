#!/usr/bin/env python3
"""將生成場景圖壓成 4:3 WebP，放入 assets/common-sense/scenes/。"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "common-sense" / "scenes"
SRC = Path("/opt/cursor/artifacts/assets")

# dest stem -> source filename
MAP = {
    "red-light": "cs-safe-red-light-v2.jpg",
    "green-light": "cs-safe-green-light.jpg",
    "stranger-candy": "cs-safe-stranger-candy-v2.jpg",
    "mall-help": "cs-safe-mall-help.jpg",
    "fire-alarm": "cs-safe-fire-alarm.jpg",
    "lift-door": "cs-safe-lift.jpg",
    "hot-soup": "cs-safe-hot-soup-v3.jpg",
    "no-run-road": "cs-safe-no-run.jpg",
    "seatbelt": "cs-safe-seatbelt.jpg",
    "call-adult": "cs-safe-call-adult.jpg",
    "home-tw": "cs-transport-home-tw.jpg",
    "school-ssp": "cs-transport-school-ssp.jpg",
    "dad-st": "cs-transport-dad-st.jpg",
    "heihei-mos": "cs-transport-heihei-mos.jpg",
    "disney": "cs-transport-theme-park-v2.jpg",
    "tst-mk": "cs-transport-tst-mk.jpg",
    "call-mtr": "cs-transport-metro.jpg",
    "no-run-car": "cs-transport-no-run-v2.jpg",
    "priority": "cs-transport-priority.jpg",
    "yellow-line": "cs-transport-yellow-line.jpg",
    "please": "cs-manners-please.jpg",
    "sorry": "cs-manners-sorry.jpg",
    "wash-before-eat": "cs-manners-wash-hands.jpg",
    "cover-cough": "cs-manners-cover-cough.jpg",
    "queue": "cs-manners-queue.jpg",
    "return-toy": "cs-manners-return-toy.jpg",
    "sneeze": "cs-manners-sneeze.jpg",
    "dry-hands": "cs-manners-dry-hands.jpg",
    "shoes-off": "cs-manners-shoes-off.jpg",
    "rain-umbrella": "cs-weather-rain.jpg",
    "typhoon": "cs-weather-typhoon.jpg",
    "cold-coat": "cs-weather-cold-coat.jpg",
    "hot-no-coat": "cs-weather-hot-day.jpg",
    "four-seasons": "cs-weather-four-seasons.jpg",
    "summer-hot": "cs-weather-summer.jpg",
    "winter-cold": "cs-weather-winter.jpg",
    "sun-hat": "cs-weather-sun-hat.jpg",
    "wet-floor": "cs-weather-wet-floor.jpg",
    "adult-warning": "cs-weather-listen-adult.jpg",
    "new-year": "cs-fest-new-year.jpg",
    "lantern": "cs-fest-lantern.jpg",
    "ching-ming": "cs-fest-ching-ming.jpg",
    "dragon-boat": "cs-fest-dragon-boat.jpg",
    "mid-autumn": "cs-fest-moon-cake.jpg",
    "moon-watch": "cs-fest-moon-watch.jpg",
    "christmas": "cs-fest-christmas.jpg",
    "birthday": "cs-fest-birthday.jpg",
    "lai-see-safe": "cs-fest-lai-see-safe.jpg",
    "new-year-day": "cs-fest-new-year-day.jpg",
    "paper": "cs-recycle-paper.jpg",
    "plastic": "cs-recycle-plastic.jpg",
    "metal": "cs-recycle-metal.jpg",
    "glass": "cs-recycle-glass.jpg",
    "banana": "cs-recycle-banana.jpg",
    "reuse-bag": "cs-recycle-reuse-bag.jpg",
    "lights-off": "cs-recycle-lights-off.jpg",
    "park-flower": "cs-recycle-park-flower.jpg",
    "straw": "cs-recycle-straw.jpg",
    "clean-paper": "cs-recycle-clean-paper.jpg",
    "milk-from-cow": "cs-food-milk-cow.jpg",
    "bread-wheat": "cs-food-bread-wheat.jpg",
    "rice": "cs-food-rice.jpg",
    "wash-eat": "cs-manners-wash-hands.jpg",
    "drink-water": "cs-food-water.jpg",
    "fruit": "cs-food-fruit.jpg",
    "candy-not-meal": "cs-food-candy.jpg",
    "breakfast": "cs-food-breakfast.jpg",
    "brush-tell": "cs-food-brush.jpg",
    "sit-share": "cs-food-sit-eat.jpg",
    "yisheng": "cs-career-yisheng.jpg",
    "hushi": "cs-career-hushi.jpg",
    "xiaofangyuan": "cs-career-xiaofangyuan.jpg",
    "jingcha": "cs-career-jingcha.jpg",
    "laoshi_job": "cs-career-laoshi.jpg",
    "siji": "cs-career-siji.jpg",
    "chushi": "cs-career-chushi.jpg",
    "youchai": "cs-career-youchai.jpg",
    "shouhuoyuan": "cs-career-shouhuoyuan.jpg",
    "jiuhuyuan": "cs-career-jiuhuyuan.jpg",
}


def convert(src: Path, dest: Path, size=(900, 675)) -> None:
    im = Image.open(src).convert("RGB")
    sw, sh = im.size
    target = 4 / 3
    if sw / sh > target:
        nw = int(sh * target)
        left = (sw - nw) // 2
        im = im.crop((left, 0, left + nw, sh))
    else:
        nh = int(sw / target)
        top = (sh - nh) // 2
        im = im.crop((0, top, sw, top + nh))
    im = im.resize(size, Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    quality = 78
    im.save(dest, "WEBP", quality=quality, method=6)
    while dest.stat().st_size > 400_000 and quality > 48:
        quality -= 6
        im.save(dest, "WEBP", quality=quality, method=6)
    print(f"{dest.relative_to(ROOT)} {dest.stat().st_size} q={quality}")


def main() -> None:
    missing = []
    for dest_name, src_name in MAP.items():
        src = SRC / src_name
        if not src.exists():
            alt = SRC / src_name.replace(".jpg", ".png")
            src = alt if alt.exists() else src
        if not src.exists():
            missing.append(src_name)
            continue
        convert(src, OUT / f"{dest_name}.webp")
    if missing:
        raise SystemExit("missing: " + ", ".join(missing))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Download batch-2 港式美食 photos from Wikimedia Commons and resize for cards.

選相準則：必須 cooked / ready to serve（碟上、茶餐廳／點心舖）。
唔要：街市生肉、超市包裝、價牌、路人、只係食材。
"""

from __future__ import annotations

import argparse
import json
import re
import time
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "food-hk"
MANIFEST = OUT_DIR / "manifest.json"
MAX_SIDE = 960

NEW_ITEMS = {
    "gan_chao_niuhe": {
        "file": "gan-chao-niuhe.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dry_Fried_Beef_Ho_Fun_-_Ho_Chiak_2023-12-08.jpg/960px-Dry_Fried_Beef_Ho_Fun_-_Ho_Chiak_2023-12-08.jpg",
        "title": "File:Dry Fried Beef Ho Fun - Ho Chiak 2023-12-08.jpg",
        "license": "CC BY-SA 4.0",
        "artist": "Ho Chiak",
    },
    "chashao_fan": {
        "file": "chashao-fan.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Gfp-bbq-pork-over-rice.jpg/960px-Gfp-bbq-pork-over-rice.jpg",
        "title": "File:Gfp-bbq-pork-over-rice.jpg",
        "license": "CC BY-SA 3.0",
        "artist": "Wikimedia Commons",
    },
    "dan_ta": {
        "file": "dan-ta.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Hong_Kong_Sweet_Dynasty_egg_tarts.jpg/960px-Hong_Kong_Sweet_Dynasty_egg_tarts.jpg",
        "title": "File:Hong Kong Sweet Dynasty egg tarts.jpg",
        "license": "CC BY-SA 4.0",
        "artist": "Wikimedia Commons",
    },
    "xi_duoshi": {
        "file": "xi-duoshi.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/French_toast_-_Hong_Kong_-_20180421_151601.jpg/960px-French_toast_-_Hong_Kong_-_20180421_151601.jpg",
        "title": "File:French toast - Hong Kong - 20180421 151601.jpg",
        "license": "CC BY-SA 4.0",
        "artist": "Wikimedia Commons",
    },
    "xia_jiao": {
        "file": "xia-jiao.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Har_Gow_at_Canal_Luna_restaurant%2C_InterContinental_Guangzhou_Exhibition_Center_%2820180923125523%29.jpg/960px-Har_Gow_at_Canal_Luna_restaurant%2C_InterContinental_Guangzhou_Exhibition_Center_%2820180923125523%29.jpg",
        "title": "File:Har Gow at Canal Luna restaurant, InterContinental Guangzhou Exhibition Center (20180923125523).jpg",
        "license": "CC BY-SA 4.0",
        "artist": "Wikimedia Commons",
    },
    "niunan_mian": {
        "file": "niunan-mian.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Beef_brisket_flat_rice_noodle_-_CK_Bistro.jpg/960px-Beef_brisket_flat_rice_noodle_-_CK_Bistro.jpg",
        "title": "File:Beef brisket flat rice noodle - CK Bistro.jpg",
        "license": "CC BY-SA 4.0",
        "artist": "Wikimedia Commons",
    },
    "dong_ningcha": {
        "file": "dong-ningcha.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/A_Hong_Kong_Style_Ice_Lemon_Tea_in_Cheung_Chau.jpg/960px-A_Hong_Kong_Style_Ice_Lemon_Tea_in_Cheung_Chau.jpg",
        "title": "File:A Hong Kong Style Ice Lemon Tea in Cheung Chau.jpg",
        "license": "CC BY-SA 4.0",
        "artist": "Wikimedia Commons",
    },
    "hainan_ji_fan": {
        "file": "hainan-ji-fan.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Hainanese_chicken_rice_%28in_Macau%29.jpg/960px-Hainanese_chicken_rice_%28in_Macau%29.jpg",
        "title": "File:Hainanese chicken rice (in Macau).jpg",
        "license": "CC BY 2.0",
        "artist": "Wikimedia Commons",
    },
    "nuomi_ji": {
        "file": "nuomi-ji.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lo_mai_gai_2.JPG/960px-Lo_mai_gai_2.JPG",
        "title": "File:Lo mai gai 2.JPG",
        "license": "CC BY-SA 3.0",
        "artist": "Wikimedia Commons",
    },
    "gongzai_mian": {
        "file": "gongzai-mian.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Nissin_Cup_Noodle_%28Original%29_-_01.jpg/960px-Nissin_Cup_Noodle_%28Original%29_-_01.jpg",
        "title": "File:Nissin Cup Noodle (Original) - 01.jpg",
        "license": "CC BY-SA 3.0",
        "artist": "Evan-Amos",
    },
    "jian_niang_sanbao": {
        "file": "jian-niang-sanbao.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Li_Wah_Dim_Sum_-_Stuffed_Pepper_%285339811613%29.jpg/960px-Li_Wah_Dim_Sum_-_Stuffed_Pepper_%285339811613%29.jpg",
        "title": "File:Li Wah Dim Sum - Stuffed Pepper (5339811613).jpg",
        "license": "CC BY 2.0",
        "artist": "Wikimedia Commons",
    },
}


def fetch(url: str) -> bytes:
    clean = re.sub(r"\?.*$", "", url)
    req = Request(clean, headers={"User-Agent": "kaka-learn-food-fetch/1.0"})
    with urlopen(req, timeout=60) as r:
        return r.read()


def save_jpg(data: bytes, dest: Path) -> tuple[int, int]:
    im = Image.open(BytesIO(data)).convert("RGB")
    w, h = im.size
    if max(w, h) > MAX_SIDE:
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=85, optimize=True)
    return im.size


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", nargs="*", metavar="ID", help="Re-download these word ids")
    ap.add_argument("--force-all", action="store_true")
    args = ap.parse_args()
    force = set(args.force or [])
    if args.force_all:
        force = set(NEW_ITEMS)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    manifest.pop("fengzhao", None)

    for wid, meta in NEW_ITEMS.items():
        dest = OUT_DIR / meta["file"]
        if dest.exists() and dest.stat().st_size > 1000 and wid not in force:
            print(f"Skip {wid} (exists)")
            continue
        print(f"Fetching {wid} → {dest.name} …", end=" ", flush=True)
        time.sleep(1.2)
        raw = fetch(meta["url"])
        w, h = save_jpg(raw, dest)
        manifest[wid] = {
            "title": meta["title"],
            "thumb": meta["url"],
            "url": meta["url"],
            "width": w,
            "height": h,
            "license": meta["license"],
            "artist": meta["artist"],
        }
        print(f"OK ({w}x{h})")

    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {MANIFEST}")


if __name__ == "__main__":
    main()

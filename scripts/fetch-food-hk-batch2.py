#!/usr/bin/env python3
"""Download batch-2 港式美食 photos from Wikimedia Commons and resize for cards."""

from __future__ import annotations

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
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Charsiu_rice_-_Cambridge%2C_MA.jpg/960px-Charsiu_rice_-_Cambridge%2C_MA.jpg",
        "title": "File:Charsiu rice - Cambridge, MA.jpg",
        "license": "CC BY-SA 4.0",
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
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Hong_Kong_french_toast_and_bottled_milk_tea.jpg/960px-Hong_Kong_french_toast_and_bottled_milk_tea.jpg",
        "title": "File:Hong Kong french toast and bottled milk tea.jpg",
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
    "fengzhao": {
        "file": "fengzhao.jpg",
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Uncooked_chicken_feet_at_a_Hong_Kong_market.jpg/960px-Uncooked_chicken_feet_at_a_Hong_Kong_market.jpg",
        "title": "File:Uncooked chicken feet at a Hong Kong market.jpg",
        "license": "CC BY-SA 2.0",
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
        "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/HK_%E5%8D%97%E5%8D%80_Southern_District_%E7%80%91%E5%B8%83%E7%81%A3_Waterfall_Bay_%E8%8F%AF%E8%B2%B4%E9%82%A8_Wah_Kwai_Estate_%E8%8F%AF%E8%B2%B4%E5%9D%8A%E5%95%86%E5%A0%B4_Noble_Square_shopping_mall_shop_ParknShop_Supermarket_%E7%85%8E%E9%87%80%E4%B8%89%E5%AF%B6_Fried_Stuffed_Three_Treasures_March_2022_Px3.jpg/960px-thumbnail.jpg",
        "title": "File:HK 南區 … 煎釀三寶 Fried Stuffed Three Treasures March 2022 Px3.jpg",
        "license": "CC BY-SA 4.0",
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
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    for wid, meta in NEW_ITEMS.items():
        dest = OUT_DIR / meta["file"]
        if dest.exists() and dest.stat().st_size > 1000:
            print(f"Skip {wid} (exists)")
            continue
        print(f"Fetching {wid} → {dest.name} …", end=" ", flush=True)
        time.sleep(1.5)
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

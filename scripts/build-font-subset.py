#!/usr/bin/env python3
"""Build self-hosted Noto Sans HK + Fredoka subsets for kaka-learn.

Reads Han characters from js/words.js + js/phonics-words.js (+ basic UI strings),
downloads Google Fonts sources once into scripts/font-src/, emits woff2 under
assets/fonts/ and a charset manifest for check-invariants.py.

Usage:
    python3 scripts/build-font-subset.py
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "scripts" / "font-src"
OUT_DIR = ROOT / "assets" / "fonts"
CHARSET_JSON = OUT_DIR / "charset.json"

NOTO_HK_ZIP_URL = (
    "https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/20_NotoSansHK.zip"
)
FREDOKA_URL = (
    "https://github.com/google/fonts/raw/main/ofl/fredoka/Fredoka%5Bwdth%2Cwght%5D.ttf"
)

UI_EXTRA = (
    "卡卡學習太空戰士學院認字字母數理聽配砌今日累積幣枚返去揀主題書玩法"
    "希希換小朋友我的進度已過未過小遊戲樂園近日要練"
)


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def collect_han_chars() -> str:
    chars: set[str] = set()
    for rel in ("js/words.js", "js/phonics-words.js"):
        src = read(ROOT / rel)
        src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
        src = re.sub(r"(?m)^\s*//.*$", "", src)
        for m in re.finditer(r"term:\s*'([^']*)'", src):
            chars.update(m.group(1))
        for m in re.finditer(r"say:\s*'([^']*)'", src):
            chars.update(m.group(1))
    chars.update(UI_EXTRA)
    latin = set("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
    latin.update("，。！？：；、（）／…—·")
    all_chars = sorted(chars | latin)
    return "".join(all_chars)


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1000:
        return
    print(f"Downloading {url} …")
    urllib.request.urlretrieve(url, dest)


def ensure_noto_hk_files() -> tuple[Path, Path]:
    zip_path = SRC_DIR / "20_NotoSansHK.zip"
    download(NOTO_HK_ZIP_URL, zip_path)
    medium = SRC_DIR / "NotoSansHK-Medium.otf"
    bold = SRC_DIR / "NotoSansHK-Bold.otf"
    if medium.exists() and bold.exists():
        return medium, bold
    with zipfile.ZipFile(zip_path) as zf:
        for name in zf.namelist():
            base = Path(name).name
            if base in ("NotoSansHK-Medium.otf", "NotoSansHK-Bold.otf"):
                target = SRC_DIR / base
                target.write_bytes(zf.read(name))
    if not medium.exists() or not bold.exists():
        raise FileNotFoundError("NotoSansHK zip 入面搵唔到 Medium/Bold OTF")
    return medium, bold


def subset_ttf(src: Path, out: Path, text: str) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        sys.executable,
        "-m",
        "fontTools.subset",
        str(src),
        f"--output-file={out}",
        "--flavor=woff2",
        f"--text={text}",
        "--layout-features=*",
        "--glyph-names",
        "--symbol-cmap",
        "--legacy-cmap",
        "--notdef-glyph",
        "--notdef-outline",
        "--recommended-glyphs",
        "--name-IDs=*",
        "--name-legacy",
        "--name-languages=*",
    ]
    subprocess.run(cmd, check=True)


def main() -> None:
    text = collect_han_chars()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "subset-chars.txt").write_text(text, encoding="utf-8")

    noto_medium, noto_bold = ensure_noto_hk_files()
    manifest: dict = {
        "han": sorted(c for c in text if "\u4e00" <= c <= "\u9fff"),
        "files": {},
    }

    for w, src in ((500, noto_medium), (700, noto_bold)):
        name = f"noto-sans-hk-{w}.woff2"
        out = OUT_DIR / name
        subset_ttf(src, out, text)
        manifest["files"][name] = out.stat().st_size
        print(f"Wrote {out} ({out.stat().st_size // 1024}KB)")

    fred_src = SRC_DIR / "Fredoka-variable.ttf"
    download(FREDOKA_URL, fred_src)
    fred_out = OUT_DIR / "fredoka.woff2"
    subset_ttf(fred_src, fred_out, text)
    manifest["files"]["fredoka.woff2"] = fred_out.stat().st_size
    print(f"Wrote {fred_out} ({fred_out.stat().st_size // 1024}KB)")

    CHARSET_JSON.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Charset: {len(manifest['han'])} Han + Latin; manifest → {CHARSET_JSON}")


if __name__ == "__main__":
    main()

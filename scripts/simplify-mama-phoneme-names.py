#!/usr/bin/env python3
"""Simplify mama phonics MP3 names: 02_MLS_E_A.mp3 → a.mp3.

Keith 確認呢批係媽媽跟課程錄嘅家庭原聲；檔名先跟教材編號。
App 字母音只要細楷 a–z（q 用 QU 嗰個檔）。

Usage:
  python3 scripts/simplify-mama-phoneme-names.py
  python3 scripts/simplify-mama-phoneme-names.py --src "mama phonic recording" --apply
  python3 scripts/simplify-mama-phoneme-names.py --self-test
"""
from __future__ import annotations

import argparse
import re
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = ROOT / "mama phonic recording"

NAME_RE = re.compile(r"^(?P<num>\d+)_MLS_E_(?P<sound>.+)\.mp3$", re.IGNORECASE)

# Single-letter / qu → App 用嘅 a–z 檔名
LETTER_SIMPLE = {chr(c): chr(c) for c in range(ord("a"), ord("z") + 1)}
LETTER_SIMPLE["qu"] = "q"

# 雙字母／長元音：去掉教材前綴，留短名俾之後 Mission
OTHER_SIMPLE = {
    "ck": "ck",
    "ff": "ff",
    "zz": "zz",
    "sh": "sh",
    "th": "th",
    "ch": "ch",
    "ng": "ng",
    "ai": "ai",
    "ee": "ee",
    "igh": "igh",
    "oa": "oa",
    "oo_long": "oo-long",
    "oo-long": "oo-long",
    "oo_short": "oo-short",
    "oo-short": "oo-short",
    "ar": "ar",
}


def normalize_sound(token: str) -> str:
    return token.strip().lower().replace("-", "_")


def simple_name(sound: str) -> str | None:
    key = normalize_sound(sound)
    if key in LETTER_SIMPLE:
        return f"{LETTER_SIMPLE[key]}.mp3"
    if key in OTHER_SIMPLE:
        return f"{OTHER_SIMPLE[key]}.mp3"
    return None


def parse_source_name(filename: str) -> tuple[str, str] | None:
    m = NAME_RE.match(filename)
    if not m:
        return None
    dest = simple_name(m.group("sound"))
    if not dest:
        return None
    return m.group("sound"), dest


def plan_renames(src: Path) -> tuple[list[tuple[Path, Path]], list[str]]:
    planned: list[tuple[Path, Path]] = []
    skipped: list[str] = []
    if not src.is_dir():
        raise FileNotFoundError(f"找不到資料夾：{src}")
    used: dict[str, Path] = {}
    for path in sorted(src.glob("*.mp3")):
        parsed = parse_source_name(path.name)
        if not parsed:
            skipped.append(f"skip  {path.name}  （唔識檔名）")
            continue
        _sound, dest_name = parsed
        dest = path.with_name(dest_name)
        if dest_name in used:
            skipped.append(f"skip  {path.name}  （同 {used[dest_name].name} 都會變成 {dest_name}）")
            continue
        used[dest_name] = path
        if path.name == dest_name:
            continue
        planned.append((path, dest))
    return planned, skipped


def apply_renames(planned: list[tuple[Path, Path]]) -> None:
    """Two-phase rename，避免 a.mp3 撞名。"""
    mid: list[tuple[Path, Path, Path]] = []
    for src, dest in planned:
        tmp = src.with_name(f".kaka-rename-{dest.name}")
        src.rename(tmp)
        mid.append((src, tmp, dest))
    for _src, tmp, dest in mid:
        if dest.exists():
            tmp.rename(_src)
            raise FileExistsError(f"目標已存在，已還原：{dest.name}")
        tmp.rename(dest)


def missing_letters(src: Path) -> list[str]:
    have: set[str] = set()
    for path in src.glob("*.mp3"):
        stem = path.stem.lower()
        parsed = parse_source_name(path.name)
        if parsed:
            stem = Path(parsed[1]).stem.lower()
        if stem == "q" or (len(stem) == 1 and stem.isalpha()):
            have.add(stem)
    return [ch for ch in (chr(c) for c in range(ord("a"), ord("z") + 1)) if ch not in have]


def print_plan(planned: list[tuple[Path, Path]], skipped: list[str], missing: list[str]) -> None:
    print("字母（App 用 a–z）：")
    letters = [(s, d) for s, d in planned if len(d.stem) == 1]
    others = [(s, d) for s, d in planned if len(d.stem) != 1]
    for src, dest in letters:
        print(f"  {src.name:28} → {dest.name}")
    if others:
        print("雙字母／長元音（之後 Mission 先用）：")
        for src, dest in others:
            print(f"  {src.name:28} → {dest.name}")
    for line in skipped:
        print(line)
    if missing:
        print("未見字母檔：", ", ".join(missing))
    print(f"會改名：{len(planned)}  跳過：{len(skipped)}")


class MappingTests(unittest.TestCase):
    def test_letter_and_digraph_names(self):
        cases = {
            "02_MLS_E_A.mp3": "a.mp3",
            "01_MLS_E_S.mp3": "s.mp3",
            "1_MLS_E_J.mp3": "j.mp3",
            "8_MLS_E_QU.mp3": "q.mp3",
            "12_MLS_E_K.mp3": "k.mp3",
            "13_MLS_E_CK.mp3": "ck.mp3",
            "17_MLS_E_OO_long.mp3": "oo-long.mp3",
            "18_MLS_E_OO_short.mp3": "oo-short.mp3",
            "15_MLS_E_IGH.mp3": "igh.mp3",
            "9_MLS_E_SH.mp3": "sh.mp3",
        }
        for src, dest in cases.items():
            parsed = parse_source_name(src)
            self.assertIsNotNone(parsed, src)
            self.assertEqual(parsed[1], dest, src)

    def test_apply_renames_letters(self):
        with tempfile.TemporaryDirectory() as raw:
            folder = Path(raw)
            (folder / "02_MLS_E_A.mp3").write_bytes(b"A")
            (folder / "8_MLS_E_QU.mp3").write_bytes(b"Q")
            (folder / "12_MLS_E_K.mp3").write_bytes(b"K")
            planned, skipped = plan_renames(folder)
            self.assertEqual(skipped, [])
            apply_renames(planned)
            self.assertTrue((folder / "a.mp3").exists())
            self.assertTrue((folder / "q.mp3").exists())
            self.assertTrue((folder / "k.mp3").exists())
            self.assertEqual((folder / "a.mp3").read_bytes(), b"A")
            self.assertEqual(missing_letters(folder), [chr(c) for c in range(ord("a"), ord("z") + 1) if chr(c) not in "akq"])


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Simplify mama MLS_E phoneme MP3 filenames")
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC, help="資料夾（預設 mama phonic recording）")
    parser.add_argument("--apply", action="store_true", help="真係改名；冇呢個旗就只預覽")
    parser.add_argument("--self-test", action="store_true", help="跑對應表測試")
    args = parser.parse_args(argv)

    if args.self_test:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(MappingTests)
        result = unittest.TextTestRunner(verbosity=2).run(suite)
        return 0 if result.wasSuccessful() else 1

    src = args.src if args.src.is_absolute() else ROOT / args.src
    try:
        planned, skipped = plan_renames(src)
    except FileNotFoundError as err:
        print(err, file=sys.stderr)
        print("呢個 Cloud Agent 睇唔到你部 Mac 嘅資料夾。", file=sys.stderr)
        print("本機喺 kaka-learn 根目錄跑：", file=sys.stderr)
        print('  python3 scripts/simplify-mama-phoneme-names.py --apply', file=sys.stderr)
        return 2

    missing = missing_letters(src)
    print_plan(planned, skipped, missing)
    if not args.apply:
        print("預覽完。要改名再加 --apply")
        return 0
    apply_renames(planned)
    print("已改名。")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""為中文一般主題詞語生成普通話錄音（macOS Tingting zh_CN）。

讀 js/words.js + js/words-mandarin.js（紅輯／橙輯唔包），每個詞一個
assets/chinese-mandarin/<wordId>.m4a，並寫 manifest.json。
需要：macOS `say`（Tingting）、ffmpeg／ffprobe、opencc-python-reimplemented（繁轉簡只用於語音輸入）。
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from opencc import OpenCC

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "chinese-mandarin"
EXCLUDED_TOPICS = {"red_series", "orange_series"}

DUMP_JS = r"""
const fs = require('fs');
globalThis.window = globalThis;
globalThis.document = { createElement: () => ({}) };
new Function(fs.readFileSync('js/words.js', 'utf8'))();
new Function(fs.readFileSync('js/words-mandarin.js', 'utf8'))();
const W = window.KakaWords, M = window.KakaMandarin;
const excluded = new Set(JSON.parse(process.argv[1]));
const seen = new Map();
for (const t of W.TOPICS.filter((t) => !excluded.has(t.id))) {
  for (const w of W.wordsForTopic(t.id)) {
    if (!seen.has(w.id)) seen.set(w.id, { id: w.id, term: w.term, mandarinTerm: M.mandarinTerm(w), speech: M.speechText(w) });
  }
}
process.stdout.write(JSON.stringify([...seen.values()]));
"""


def run(args: list[str]) -> str:
    result = subprocess.run(args, capture_output=True, text=True, cwd=ROOT)
    if result.returncode != 0:
        raise SystemExit(f"{args[0]} failed: {result.stderr.strip()}")
    return result.stdout


def main() -> int:
    if not re.search(r"^Tingting\s+.*zh_CN", run(["say", "-v", "?"]), flags=re.M):
        raise SystemExit("需要 macOS Tingting（zh_CN）聲音")
    words = json.loads(run(["node", "-e", DUMP_JS, json.dumps(sorted(EXCLUDED_TOPICS))]))
    to_simplified = OpenCC("t2s")
    OUT.mkdir(parents=True, exist_ok=True)
    items = []
    with tempfile.TemporaryDirectory() as tmp:
        for word in words:
            speech = to_simplified.convert(word["speech"])
            aiff = Path(tmp) / f"{word['id']}.aiff"
            out = OUT / f"{word['id']}.m4a"
            run(["say", "-v", "Tingting", "-r", "145", "-o", str(aiff), speech])
            run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(aiff),
                "-af", "loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=0.18",
                "-ac", "1", "-ar", "24000", "-c:a", "aac", "-b:a", "48k", "-movflags", "+faststart", str(out),
            ])
            duration = float(run([
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(out),
            ]).strip())
            size = out.stat().st_size
            if not (0.25 < duration < 6) or size > 400_000:
                raise SystemExit(f"錄音異常：{word['id']} {duration:.2f}s {size}B")
            items.append({**word, "speechText": speech, "duration": round(duration, 3), "bytes": size})
    stale = {p.stem for p in OUT.glob("*.m4a")} - {w["id"] for w in words}
    for stem in sorted(stale):
        (OUT / f"{stem}.m4a").unlink()
    manifest = {
        "version": 1,
        "source": "macOS Tingting",
        "locale": "zh_CN",
        "kind": "synthetic-word-recordings",
        "excludedTopics": sorted(EXCLUDED_TOPICS),
        "items": items,
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(i["bytes"] for i in items)
    print(f"Built {len(items)} Mandarin word recordings ({total / 1_000_000:.2f} MB) → {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

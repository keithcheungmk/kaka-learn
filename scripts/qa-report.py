#!/usr/bin/env python3
"""Pre-fill QA review report for merge checks (target <5 min machine time).

Runs check-invariants.py + smoke-shots.py --no-shots, scopes diff impact,
and prints a markdown report matching docs/qa-check.md format.

Usage:
    python3 -m http.server 5173 &   # required for smoke-shots
    python3 scripts/qa-report.py
    python3 scripts/qa-report.py --base main
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(cmd: list[str], cwd: Path = ROOT) -> tuple[int, str]:
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    out = (p.stdout or "") + (p.stderr or "")
    return p.returncode, out.strip()


def git_diff_files(base: str) -> list[str]:
    code, out = run(["git", "diff", "--name-only", f"{base}...HEAD"])
    if code != 0:
        code, out = run(["git", "diff", "--name-only", "HEAD~1"])
    return [ln.strip() for ln in out.splitlines() if ln.strip()]


def scope_impact(files: list[str]) -> dict[str, bool]:
    f = " ".join(files)
    return {
        "chinese": any(x in f for x in ("js/app.js", "js/words.js", "js/star-fx.js", "css/styles.css", "index.html")),
        "phonics": "phonics" in f,
        "math": "math" in f,
        "assets": "assets/" in f,
        "docs_only": all(p.startswith("docs/") or p.endswith(".md") for p in files) if files else False,
    }


def review_hints(files: list[str], impact: dict[str, bool]) -> list[str]:
    hints: list[str] = []
    if not files:
        hints.append("無 diff；只驗 invariants + smoke 回歸。")
    if any("words.js" in p for p in files):
        hints.append("只改字詞：驗受影響主題學習／玩法一屏即可；唔使三入口 E2E。")
    if any("star-fx" in p or "space-ranger" in p for p in files):
        hints.append("太空戰士：驗一個玩法屏 + 槍口射星（用 smoke 截圖，禁 computerUse）。")
    if any(p == "index.html" for p in files):
        hints.append("主頁改動：驗四入口可開 + 新連結（如有）。")
    if impact["math"] and not impact["chinese"]:
        hints.append("數理專用：確認認字／字母隊仍可進入。")
    if not hints:
        hints.append("按 diff 模組抽樣 1–2 個相關畫面（最多 2 張 smoke 圖）。")
    return hints


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate pre-filled QA report")
    ap.add_argument("--base", default="main", help="Git base branch for diff scope")
    args = ap.parse_args()

    inv_code, inv_out = run([sys.executable, "scripts/check-invariants.py"])
    smoke_code, smoke_out = run([sys.executable, "scripts/smoke-shots.py", "--no-shots"])

    files = git_diff_files(args.base)
    impact = scope_impact(files)
    hints = review_hints(files, impact)

    inv_ok = inv_code == 0 and "可以 merge" in inv_out
    smoke_ok = smoke_code == 0 and ("一屏入晒" in smoke_out or "冇 404" in smoke_out)

    tech = "OK" if inv_ok and smoke_ok else "問題"
    conclusion = "可以 merge" if inv_ok and smoke_ok else "有問題"

    impact_lines = [
        f"- 認字：{'有' if impact['chinese'] else '冇'}",
        f"- 字母隊：{'有' if impact['phonics'] else '冇'}",
        f"- 數理：{'有' if impact['math'] else '冇'}",
    ]

    print("```text")
    print(f"結論：{conclusion}（機器檢查；檢查 agent 補視覺 ≤5 行，總時限 ≤10 分鐘）")
    print()
    print("改咗咩：")
    if files:
        for p in files[:12]:
            print(f"- {p}")
        if len(files) > 12:
            print(f"- …共 {len(files)} 個檔案")
    else:
        print("- （未能取得 diff；請手動 git diff --stat）")
    print()
    print("影響：")
    for ln in impact_lines:
        print(ln)
    print()
    print("檢查重點：")
    print(f"- 視覺：（檢查 agent 填寫；{' '.join(hints[:2])}）")
    print("- 幼齡：（檢查 agent 填寫）")
    print(f"- 技術：{tech}")
    print()
    print("要修：")
    if not inv_ok:
        print("- invariants 未通過（見下方輸出）")
    if not smoke_ok:
        print("- smoke-shots 未通過（見下方輸出）")
    if inv_ok and smoke_ok:
        print("- 無（機器部分）")
    print("```")
    print()
    print("--- check-invariants ---")
    print(inv_out[-2000:] if len(inv_out) > 2000 else inv_out)
    print()
    print("--- smoke-shots ---")
    print(smoke_out[-2000:] if len(smoke_out) > 2000 else smoke_out)
    print()
    print("--- review hints ---")
    for h in hints:
        print(f"- {h}")

    return 0 if inv_ok and smoke_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())

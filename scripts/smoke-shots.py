#!/usr/bin/env python3
"""視覺煙霧測試：自動行一次三個入口，影 iPad 尺寸截圖，順手捉 404 同 console error。

檢查 agent 用法（docs/qa-check.md 嘅 A、B 節可以自動化嘅部分）：

    python3 -m http.server 5173 &
    python3 scripts/smoke-shots.py            # 圖出喺 .smoke/
    python3 scripts/smoke-shots.py --url http://localhost:5173 --out /tmp/shots

需要 playwright（`pip install playwright && playwright install chromium`）。
冇裝就會講一聲然後跳過，唔會阻住其他檢查。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

IPAD = {"width": 1024, "height": 768}

FLOWS = [
    ("home", None),
    ("chinese", "#btn-start-topics"),
    ("phonics", "#btn-start-phonics"),
    ("math", "#btn-start-math"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:5173")
    ap.add_argument("--out", default=".smoke")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("冇裝 playwright，跳過視覺煙霧測試。")
        print("  pip install playwright && playwright install chromium")
        return 0

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    failed: list[str] = []
    problems = 0

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport=IPAD, device_scale_factor=2)
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("requestfailed", lambda r: failed.append(r.url))

        for name, selector in FLOWS:
            page.goto(args.url, wait_until="domcontentloaded")
            page.wait_for_timeout(400)
            if selector:
                el = page.query_selector(selector)
                if not el:
                    print(f"  ✗ {name}: 揾唔到入口 {selector}")
                    problems += 1
                    continue
                el.click()
                page.wait_for_timeout(900)
            shot = out / f"{name}.png"
            page.screenshot(path=str(shot))
            # 空白畫面偵測：睇當前 screen 有冇可見內容
            text = page.evaluate("() => (document.querySelector('.screen.active')?.innerText || '').trim().length")
            if text < 5:
                print(f"  ✗ {name}: 畫面似乎係空白（可見文字 {text} 個字）")
                problems += 1
            else:
                print(f"  ✓ {name}: {shot}")
        browser.close()

    # 濾走 Google Fonts（離線環境正常會失敗）
    real_failed = [u for u in failed if "fonts.g" not in u]
    for u in dict.fromkeys(real_failed):
        print(f"  ✗ 載入失敗：{u}")
        problems += 1
    for e in dict.fromkeys(errors):
        if "ERR_TUNNEL" in e or "fonts.g" in e:
            continue
        print(f"  ✗ console error：{e[:120]}")
        problems += 1

    print(f"\n結論：{'可以交檢查 agent 睇圖' if not problems else f'有 {problems} 個問題'}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())

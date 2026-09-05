#!/usr/bin/env python3
"""視覺煙霧測試 + iPad 版面回歸。

兩件事：
  1. 自動行三個入口同認字嘅完整流程，影 iPad 尺寸截圖，捉 404／console error／白屏。
  2. **溢出檢查**：遊戲畫面喺 5 種 iPad 尺寸都唔准要捲。
     （4 歲喺砌一砌拖字嗰陣要捲畫面 = 學習體驗直接爛，所以呢個係 blocker。）

用法：
    python3 -m http.server 5173 &
    python3 scripts/smoke-shots.py                 # 影圖 + 檢查，圖出喺 .smoke/
    python3 scripts/smoke-shots.py --no-shots      # 淨係做溢出檢查（CI 用，快啲）

需要 playwright；冇裝就會講一聲然後跳過，唔會阻住其他檢查。
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# 只許呢幾頁捲：純瀏覽、唔涉拖曳（主頁四入口掣可超出一屏）
SCROLLABLE = {
    "screen-profiles",
    "screen-home",
    "screen-topics",
    "screen-books",
    "screen-phonics-topics",
    "screen-phonics-sounds",
    "screen-progress",
}

IPADS = {
    "iPadPro12.9-直": (1024, 1366),
    "iPadPro12.9-橫": (1366, 1024),
    "iPadPro11-直": (834, 1194),
    "iPadPro11-橫": (1194, 834),
    "iPad10.9-橫": (1180, 820),
}

# 手機：一屏入唔晒係容許嘅（會準捲），但一定唔可以重疊或者剪走內容。
# Keith 用 iPhone 試過，砌一砌嘅「聽呢個詞」掣曾經疊住淡色格 —— 就係喺呢度捉。
PHONES = {
    "iPhone-直": (393, 852),
    "iPhone-直細": (390, 660),
}


def walk(pg, url, shots: Path | None, tag: str):
    """行一次認字全程 + 另外兩個入口，回傳每一步嘅量度結果。"""
    seen = []

    def probe(step):
        info = pg.evaluate(
            """() => {
              const s = document.querySelector('.screen.active');
              const d = document.documentElement;
              // 重疊偵測：同一屏嘅直屬子元素兩兩相交（要 x、y 都相交先算）
              const kids = [...s.children].filter(
                (e) => e.offsetHeight > 0 && getComputedStyle(e).position !== 'absolute'
              );
              const R = (e) => {
                const b = e.getBoundingClientRect();
                return { n: (e.id || e.className || '').split(' ')[0],
                         x1: b.left, x2: b.right, y1: b.top, y2: b.bottom };
              };
              const bs = kids.map(R);
              const overlaps = [];
              for (let i = 0; i < bs.length; i++) {
                for (let j = i + 1; j < bs.length; j++) {
                  const a = bs[i], c = bs[j];
                  const ox = Math.min(a.x2, c.x2) - Math.max(a.x1, c.x1);
                  const oy = Math.min(a.y2, c.y2) - Math.max(a.y1, c.y1);
                  if (ox > 2 && oy > 2) overlaps.push(a.n + ' 疊住 ' + c.n);
                }
              }
              const scrollable = s.scrollHeight - s.clientHeight > 2;
              const ranger = document.querySelector('.space-ranger.space-ranger--visible');
              const rangerHits = [];
              let rangerFaceOk = true;
              if (ranger) {
                const rs = getComputedStyle(ranger);
                if (rs.visibility !== 'hidden' && Number(rs.opacity) > 0.05) {
                  const rb = ranger.getBoundingClientRect();
                  const tiles = [...document.querySelectorAll(
                    '.build-pool .build-tile:not(.is-used), .card-grid .word-card, .math-num-bubble'
                  )];
                  for (const t of tiles) {
                    const tb = t.getBoundingClientRect();
                    if (tb.width < 8 || tb.height < 8) continue;
                    const ox = Math.min(rb.right, tb.right) - Math.max(rb.left, tb.left);
                    const oy = Math.min(rb.bottom, tb.bottom) - Math.max(rb.top, tb.top);
                    if (ox > 4 && oy > 4 && (ox * oy) / (tb.width * tb.height) > 0.1) {
                      rangerHits.push((t.textContent || t.className || 'tile').trim().slice(0, 8));
                    }
                  }
                  const img = ranger.querySelector('.space-ranger-img, img');
                  if (img) {
                    const compact = (getComputedStyle(img).transform || '').replace(/ /g, '');
                    rangerFaceOk = compact.startsWith('matrix(-1,') || compact.startsWith('matrix3d(-1,');
                  }
                }
              }
              return {
                id: s ? s.id : null,
                over: Math.max(
                  scrollable ? s.scrollHeight - s.clientHeight : 0,
                  Math.max(d.scrollHeight, document.body.scrollHeight) - window.innerHeight
                ),
                clipped: getComputedStyle(s).overflow === 'hidden' && scrollable,
                overlaps,
                rangerHits,
                rangerFaceOk,
                text: (s && s.innerText || '').trim().length,
              };
            }"""
        )
        seen.append(
            (
                step,
                info["id"],
                info["over"],
                info["text"],
                info["overlaps"],
                info["clipped"],
                info.get("rangerHits") or [],
                info.get("rangerFaceOk", True),
            )
        )
        if shots:
            pg.screenshot(path=str(shots / f"{tag}-{step}.png"))

    pg.goto(url, wait_until="domcontentloaded")
    pg.wait_for_timeout(400)
    probe("揀小朋友")

    pg.click("#btn-profile-kaka")
    pg.wait_for_timeout(400)
    probe("主頁")

    pg.click("#btn-home-progress")
    pg.wait_for_timeout(500)
    probe("我的進度")
    pg.click("#btn-back-progress")
    pg.wait_for_timeout(300)

    pg.click("#btn-start-topics")
    pg.wait_for_timeout(600)
    probe("揀主題")

    for el in pg.query_selector_all("#screen-topics button"):
        if "動物園" in (el.inner_text() or ""):
            el.click()
            break
    pg.wait_for_timeout(600)
    probe("學習頁")

    for _ in range(60):
        if pg.is_visible("#btn-learn-play"):
            break
        pg.click("#btn-learn-next")
        pg.wait_for_timeout(50)
    pg.click("#btn-learn-play")
    pg.wait_for_timeout(500)
    probe("揀玩法")

    for btn, step in [("#btn-mode-build", "砌一砌"), ("#btn-mode-listen", "聽一聽"), ("#btn-mode-match", "配一配")]:
        pg.click(btn)
        pg.wait_for_timeout(800)
        probe(step)
        back = {"#btn-mode-build": "#btn-back-build", "#btn-mode-listen": "#btn-back-listen", "#btn-mode-match": "#btn-back-match"}[btn]
        pg.click(back)
        pg.wait_for_timeout(400)

    for entry, step in [("#btn-start-phonics", "字母隊"), ("#btn-start-math", "數理")]:
        pg.goto(url, wait_until="domcontentloaded")
        pg.wait_for_timeout(300)
        pg.click("#btn-profile-kaka")
        pg.wait_for_timeout(300)
        pg.click(entry)
        pg.wait_for_timeout(800)
        probe(step)
        if entry == "#btn-start-phonics":
            # Phase A hub：建議下一站或 Blend Words 第一張（舊 flat grid 已 hidden）
            if pg.locator("#btn-phonics-suggested-next").count():
                pg.click("#btn-phonics-suggested-next")
            else:
                pg.click("#phonics-hub-blend .topic-card:first-child")
            pg.wait_for_timeout(500)
            probe("字母音清單")

    return seen


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:5173")
    ap.add_argument("--out", default=".smoke")
    ap.add_argument("--no-shots", action="store_true", help="唔影圖，淨係做檢查")
    args = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("冇裝 playwright，跳過視覺煙霧測試。")
        print("  pip install playwright && playwright install chromium")
        return 0

    shots = None if args.no_shots else Path(args.out)
    if shots:
        shots.mkdir(parents=True, exist_ok=True)

    problems = 0
    errors: list[str] = []
    failed: list[str] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        targets = [(n, wh, False) for n, wh in IPADS.items()] + [(n, wh, True) for n, wh in PHONES.items()]
        for name, (w, h), phone in targets:
            page = browser.new_page(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True)
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("requestfailed", lambda r: failed.append(r.url))
            try:
                rows = walk(page, args.url, shots, name)
            except Exception as e:  # noqa: BLE001
                print(f"  ✗ {name}: 行唔完流程（{type(e).__name__}: {e}）")
                problems += 1
                page.close()
                continue

            bad = []
            for step, sid, over, text, overlaps, clipped, ranger_hits, ranger_face_ok in rows:
                if text < 5:
                    bad.append(f"{step}（{sid}）似乎白屏")
                if not phone and over > 2 and sid not in SCROLLABLE:
                    bad.append(f"{step}（{sid}）要捲 {over}px")
                if clipped:
                    bad.append(f"{step}（{sid}）內容被剪走 {over}px（鎖死唔捲但入唔晒）")
                for o in overlaps:
                    bad.append(f"{step}（{sid}）元素重疊：{o}")
                for hit in ranger_hits:
                    bad.append(f"{step}（{sid}）太空戰士蓋住字磚／選項「{hit}」")
                if ranger_face_ok is False:
                    bad.append(f"{step}（{sid}）太空戰士 img 未朝右（要 scaleX(-1)）")
            if bad:
                problems += len(bad)
                print(f"  ✗ {name}")
                for b in bad:
                    print(f"      {b}")
            else:
                fit = "準捲但冇重疊冇剪走" if phone else "全部一屏入晒"
                print(f"  ✓ {name}：{len(rows)} 個畫面{fit}")
            page.close()
        browser.close()

    for u in dict.fromkeys(x for x in failed if "fonts.g" not in x):
        print(f"  ✗ 載入失敗：{u}")
        problems += 1
    for e in dict.fromkeys(errors):
        if "ERR_TUNNEL" in e or "fonts.g" in e:
            continue
        print(f"  ✗ console error：{e[:120]}")
        problems += 1

    if problems:
        print(f"\n結論：有 {problems} 個問題。遊戲畫面要捲 = blocker（KAKA 拖字會捲親）。")
        return 1
    print(f"\n結論：{len(IPADS)} 種 iPad 尺寸一屏入晒、{len(PHONES)} 種手機尺寸冇重疊冇剪走，"
          "冇 404、冇 console error。")
    if shots:
        print(f"截圖喺 {shots}/，交檢查 agent 睇視覺同幼齡適切度。")
    return 0


if __name__ == "__main__":
    sys.exit(main())

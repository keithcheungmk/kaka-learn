#!/usr/bin/env python3
"""視覺煙霧測試 + 家庭裝置版面回歸。

兩件事：
  1. 自動行三個入口同認字嘅完整流程，影截圖，捉 404／console error／白屏。
  2. **溢出檢查**：遊戲畫面喺 iPad 尺寸都唔准要捲。
     （4 歲喺砌一砌拖字嗰陣要捲畫面 = 學習體驗直接爛，所以呢個係 blocker。）

預設只跑 **家庭目標裝置**（慳時間／token；Keith 2026-09-07）：
  - iPad Pro 11" 直／橫（834×1194／1194×834）
  - iPhone 16 Pro Max 直（430×932）
舊嘅 12.9"／10.9"／細機用 `--all` 先跑。

用法：
    python3 -m http.server 5173 &
    python3 scripts/smoke-shots.py                 # 家庭裝置 + 影圖 → .smoke/
    python3 scripts/smoke-shots.py --no-shots      # 家庭裝置、淨檢查（CI 預設）
    python3 scripts/smoke-shots.py --all --no-shots  # 舊全尺寸回歸

需要 playwright；冇裝就會講一聲然後跳過，唔會阻住其他檢查。
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

# 只許呢幾頁捲：純瀏覽、唔涉拖曳（中文入口頁可超出一屏）
SCROLLABLE = {
    "screen-profiles",
    "screen-home",
    "screen-english-hub",
    "screen-topics",
    "screen-word-games",
    "screen-books",
    "screen-phonics-topics",
    "screen-phonics-sounds",
    "screen-progress",
    "screen-math-galaxy",  # Browsing hub for planet and life-skill destinations; the actual math activities remain no-scroll.
    "screen-math-earth-addition-select",  # Level/method browsing; keep the actual fruit manipulation screen no-scroll.
    "screen-math-moon-subtraction-select",  # Level/method browsing; keep the actual fruit manipulation screen no-scroll.
    "screen-chinese-connect",
    "screen-story-demo",  # Little Fox book shelf: browsing may scroll; play screen may not.
    "screen-story-series",  # Selecting a story series is a browsing screen.
}

# 家庭目標裝置（預設／CI）——對齊 Keith 部 iPad Pro 11" 同 iPhone 16 Pro Max
FAMILY_IPADS = {
    "iPadPro11-直": (834, 1210),
    "iPadPro11-橫": (1210, 834),
}
FAMILY_PHONES = {
    "iPhone16ProMax-直": (430, 932),
}

# 擴充裝置（只喺 --all）
EXTRA_IPADS = {
    "iPadPro12.9-直": (1024, 1366),
    "iPadPro12.9-橫": (1366, 1024),
    "iPad10.9-橫": (1180, 820),
}
EXTRA_PHONES = {
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
              if (!s) {
                return {
                  id: document.querySelector('.four-shell, main')?.id || 'standalone',
                  portrait: window.innerHeight > window.innerWidth,
                  over: Math.max(d.scrollWidth - d.clientWidth, d.scrollHeight - d.clientHeight, 0),
                  clipped: false,
                  overlaps: [],
                  rangerHits: [],
                  rangerFaceOk: true,
                  text: (document.body?.innerText || '').trim().length,
                };
              }
              const app = document.querySelector('#app');
              const showingOrientationNotice = d.classList.contains('math-canvas-mode')
                && matchMedia('(orientation: portrait)').matches
                && app
                && getComputedStyle(app, '::after').content !== 'none';
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
                portrait: window.innerHeight > window.innerWidth,
                over: showingOrientationNotice ? 0 : Math.max(
                  scrollable ? s.scrollHeight - s.clientHeight : 0,
                  Math.max(d.scrollHeight, document.body.scrollHeight) - window.innerHeight
                ),
                clipped: !showingOrientationNotice && getComputedStyle(s).overflow === 'hidden' && scrollable,
                overlaps: showingOrientationNotice ? [] : overlaps,
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
                info.get("portrait", False),
            )
        )
        if shots:
            # The shared screen fade starts at opacity 0; capture the settled UI.
            pg.wait_for_timeout(400)
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

    hub_text = pg.text_content("#topics-hub-entries") or ""
    for name in ("卡卡日記故事", "卡卡學寫字", "認字遊戲"):
        if name not in hub_text:
            raise RuntimeError(f"Chinese hub must show the big entry {name!r}")
    if "四格講故事" in hub_text:
        raise RuntimeError("Chinese hub must not duplicate the four-panel story entry")
    if "常識樂園" in hub_text:
        raise RuntimeError("Chinese hub must not label an entry as 常識樂園")
    if pg.is_visible("#topic-grid"):
        raise RuntimeError("Emoji topic categories must not remain below the three Chinese entries")
    pg.click("#btn-topics-word-games")
    pg.wait_for_selector("#screen-word-games.active #topic-grid")
    if not pg.is_visible("#screen-word-games #topics-word-wall"):
        raise RuntimeError("Recognition entry must open the separate page containing the original category wall")
    clicked = False
    for el in pg.query_selector_all("#topic-grid .topic-card"):
        if "動物園" in (el.inner_text() or ""):
            el.click()
            clicked = True
            break
    if not clicked:
        raise RuntimeError("Emoji wall must open 動物園 with the existing learn flow")
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

    for btn, step in [("#btn-mode-build", "砌一砌")]:
        pg.click(btn)
        pg.wait_for_timeout(800)
        probe(step)
        back = {"#btn-mode-build": "#btn-back-build"}[btn]
        pg.click(back)
        pg.wait_for_timeout(400)

    pg.wait_for_selector("#btn-mode-chinese-connect", state="visible")
    pg.click("#btn-mode-chinese-connect")
    pg.wait_for_selector("#screen-chinese-connect.active #chinese-connect-pictures .connect-picture-main")
    pg.wait_for_timeout(500)
    probe("中文連一連")
    pg.click("#btn-back-chinese-connect")
    pg.wait_for_timeout(400)

    for entry, step in [("#btn-start-english", "英文學習入口"), ("#btn-start-math", "數理")]:
        pg.goto(url, wait_until="domcontentloaded")
        pg.wait_for_timeout(300)
        pg.click("#btn-profile-kaka")
        pg.wait_for_timeout(300)
        pg.click(entry)
        pg.wait_for_timeout(800)
        probe(step)
        if entry == "#btn-start-math":
            # 數學已由星球流程改成遊戲樂園：逐條進入四個主路線，
            # 檢查實際遊戲畫面喺家庭裝置上無捲動／重疊，再返樂園。
            pg.click("#screen-math-galaxy.active .math-route-numbers")
            pg.wait_for_selector("#screen-math-relations-play.active #math-relations-distance-choices button", state="visible")
            pg.wait_for_timeout(400)
            probe("數學・數字探險")
            pg.click("#btn-back-math-relations-play")

            pg.click("#screen-math-galaxy.active .math-route-addition")
            pg.wait_for_selector("#screen-math-earth-addition-select.active .addition-level-card:not(.is-locked)", state="visible")
            probe("數學・加法關卡")
            pg.click("#screen-math-earth-addition-select.active .addition-level-card:not(.is-locked)")
            pg.wait_for_selector("#screen-math-earth-addition-play.active #addition-slot")
            probe("數學・加法果園")
            pg.click("#btn-back-math-addition-play")
            pg.click("#btn-back-math-addition-select")

            pg.click("#screen-math-galaxy.active .math-route-subtraction")
            pg.wait_for_selector("#screen-math-moon-subtraction-select.active .subtraction-level-card:not(.is-locked)", state="visible")
            probe("數學・減法關卡")
            pg.click("#screen-math-moon-subtraction-select.active .subtraction-level-card:not(.is-locked)")
            pg.wait_for_selector("#screen-math-moon-subtraction-play.active #subtraction-slot")
            probe("數學・減法籃球場")
            pg.click("#btn-back-math-subtraction-play")
            pg.click("#btn-back-math-subtraction-select")

            pg.click("#screen-math-galaxy.active .math-route-clock")
            pg.wait_for_selector("#screen-math-venus-learn.active #math-venus-learn-face")
            probe("數學・時鐘遊樂屋")
            pg.click("#btn-back-math-venus-learn")
        if entry == "#btn-start-english":
            pg.wait_for_selector("#screen-english-hub.active #btn-english-story")
            pg.wait_for_function("""() => {
              const images = [...document.querySelectorAll('#screen-english-hub.active .english-hub-art')];
              return images.length === 3 && images.every(image => image.complete && image.naturalWidth > 0);
            }""")
            probe("英文學習入口")
            pg.click("#btn-english-words")
            pg.wait_for_selector('#screen-phonics-topics.active[data-english-track="sight"]')
            if not pg.is_visible("#phonics-sight-grid") or pg.is_visible("#phonics-topic-grid"):
                raise RuntimeError("Topic Words screen must show only its word-topic grid")
            probe("主題詞語")
            pg.click("#btn-back-phonics-topics")
            pg.wait_for_selector("#screen-english-hub.active")
            pg.click("#btn-english-phonics")
            pg.wait_for_selector('#screen-phonics-topics.active[data-english-track="phonics"]')
            if pg.is_visible("#phonics-sight-grid") or not pg.is_visible("#phonics-topic-grid"):
                raise RuntimeError("Phonics screen must show only its phonics-topic grid")
            probe("Phonics 主題入口")
            pg.click("#phonics-topic-grid .topic-card:first-child")
            pg.wait_for_timeout(500)
            probe("字母音清單")

    # Story English / Magic Marker: keep its series shelf and actual
    # read-and-fill screen inside the same family-device layout regression.
    pg.goto(url, wait_until="domcontentloaded")
    pg.wait_for_timeout(300)
    pg.click("#btn-profile-kaka")
    pg.wait_for_timeout(300)
    pg.click("#btn-start-english")
    pg.click("#btn-english-story")
    pg.wait_for_selector("#screen-story-series.active [data-series-id='magic-marker']")
    pg.wait_for_selector("#screen-story-series.active [data-series-id='family-stories-en']")
    series_ids = pg.evaluate(
        "() => [...document.querySelectorAll('#story-series-grid [data-series-id]')].map((el) => el.dataset.seriesId)"
    )
    if series_ids != ["carter", "magic-marker", "wacky-ricky", "family-stories-en"]:
        raise RuntimeError(f"Story series list must keep Little Fox cards then family stories, got {series_ids!r}")
    family_href = pg.get_attribute("#screen-story-series.active [data-series-id='family-stories-en']", "href") or ""
    if "family-storybook-en.html" not in family_href:
        raise RuntimeError("Family stories series card must open family-storybook-en.html")
    probe("英文故事書系列")
    pg.click("#btn-back-story-series")
    pg.wait_for_selector("#screen-english-hub.active")
    pg.click("#btn-english-story")
    pg.wait_for_selector("#screen-story-series.active [data-series-id='magic-marker']")
    pg.click("#screen-story-series.active [data-series-id='magic-marker']")
    pg.wait_for_selector("#screen-story-demo.active [data-book-id='mm001']")
    probe("Magic Marker 書架")
    pg.click("#screen-story-demo.active [data-book-id='mm001']")
    pg.wait_for_selector("#screen-story-play.active .story-challenge-page")
    pg.wait_for_function("document.querySelector('.story-challenge-page')?.complete")
    probe("MM001 Read & Fill")
    # Finish the page audio deterministically; the test concerns the gated
    # audio -> answer interaction, not the real-time duration of the recording.
    pg.evaluate("document.querySelector('audio[data-story-demo]').dispatchEvent(new Event('ended'))")
    pg.wait_for_function("!document.querySelector('.story-fill-tile')?.disabled")
    answer = pg.locator(".story-fill-blank").get_attribute("data-blank")
    pg.locator(".story-fill-tile").evaluate_all("(tiles, word) => tiles.find(tile => tile.dataset.word === word).click()", answer)
    pg.click("#btn-story-submit")
    pg.wait_for_selector("#btn-story-next", timeout=15000)
    probe("MM001 答對與星星")
    pg.click("#btn-story-next")
    pg.wait_for_selector("#screen-story-play.active .story-challenge-page")
    pg.wait_for_function("document.querySelector('.story-challenge-page')?.complete")
    probe("MM001 下一頁")
    pg.click("#btn-back-story-play")
    pg.wait_for_selector("#screen-story-demo.active [data-book-id='mm002']")
    pg.click("#screen-story-demo.active [data-book-id='mm002']")
    pg.wait_for_selector("#screen-story-play.active .story-challenge-page")
    pg.wait_for_function("document.querySelector('.story-challenge-page')?.complete")
    probe("MM002 Read & Fill")
    pg.click("#btn-back-story-play")
    pg.wait_for_selector("#screen-story-demo.active [data-book-id='mm020']")
    pg.click("#screen-story-demo.active [data-book-id='mm020']")
    pg.wait_for_selector("#screen-story-play.active .story-challenge-page")
    pg.wait_for_function("document.querySelector('.story-challenge-page')?.complete")
    probe("MM020 Read & Fill")
    pg.evaluate("document.querySelector('audio[data-story-demo]').dispatchEvent(new Event('ended'))")
    pg.wait_for_function("!document.querySelector('.story-fill-tile')?.disabled")
    answer = pg.locator(".story-fill-blank").get_attribute("data-blank")
    pg.locator(".story-fill-tile").evaluate_all("(tiles, word) => tiles.find(tile => tile.dataset.word === word).click()", answer)
    pg.click("#btn-story-submit")
    pg.wait_for_selector("#btn-story-next", timeout=15000)
    probe("MM020 答對與星星")
    pg.click("#btn-back-story-play")
    pg.wait_for_selector("#screen-story-demo.active [data-book-id='mm073']")
    pg.click("#screen-story-demo.active [data-book-id='mm073']")
    pg.wait_for_selector("#screen-story-play.active .story-challenge-page")
    pg.wait_for_function("document.querySelector('.story-challenge-page')?.complete")
    probe("MM073 Read & Fill")
    pg.evaluate("document.querySelector('audio[data-story-demo]').dispatchEvent(new Event('ended'))")
    pg.wait_for_function("!document.querySelector('.story-fill-tile')?.disabled")
    answer = pg.locator(".story-fill-blank").get_attribute("data-blank")
    pg.locator(".story-fill-tile").evaluate_all("(tiles, word) => tiles.find(tile => tile.dataset.word === word).click()", answer)
    pg.click("#btn-story-submit")
    pg.wait_for_selector("#btn-story-next", timeout=15000)
    probe("MM073 答對與星星")

    # English family stories are a separate shell, parallel to Little Fox.
    pg.goto(url.rstrip("/") + "/family-storybook-en.html", wait_until="domcontentloaded")
    pg.wait_for_selector("#story-grid [data-story='rainbow-umbrella']")
    pg.wait_for_selector("#story-grid [data-story='park-kite']")
    if pg.is_visible("#reader"):
        raise RuntimeError("EN family story library must start on the picker, not a reader")
    pg.click("#story-grid [data-story='rainbow-umbrella']")
    pg.wait_for_selector("#reader:not(.hidden)")
    heading = pg.text_content("#brand-title") or ""
    if "Going Home: The Rain Stops" not in heading:
        raise RuntimeError(f"EN family story title must be place: story, got {heading!r}")
    back_href = pg.get_attribute("#back-english", "href") or ""
    if "screen-english-hub" in back_href and "family-storybook-en" not in back_href:
        raise RuntimeError("Reading-page ← English must stay on the EN family library, not the English hub")
    pg.click("#back-english")
    pg.wait_for_selector("#library:not(.hidden) #story-grid [data-story='park-kite']")
    if pg.is_visible("#reader") and "hidden" not in (pg.get_attribute("#reader", "class") or ""):
        raise RuntimeError("← English must return to the EN family story library")

    # Legacy standalone Cantonese four-panel page; it is no longer duplicated in the Chinese hub.
    pg.goto(url + "#screen-topics", wait_until="domcontentloaded")
    pg.wait_for_selector("#screen-topics.active")
    site_root = url.split("#", 1)[0].split("?", 1)[0].rstrip("/")
    if site_root.endswith("/index.html"):
        site_root = site_root[:-len("/index.html")]
    four_panel_url = site_root + "/four-panel-story.html"
    pg.goto(four_panel_url, wait_until="domcontentloaded")
    pg.wait_for_timeout(300)
    probe("獨立・四格講故事")
    pg.wait_for_selector("#level-grid [data-start='rainbow-umbrella']")
    if pg.is_visible("#play") and "hidden" not in (pg.get_attribute("#play", "class") or ""):
        raise RuntimeError("Four-panel mode must start on the level wall")
    thumbs = pg.evaluate("() => document.querySelectorAll('#level-grid .level-thumb img').length")
    if thumbs != 4:
        raise RuntimeError(f"Level card must show 4 panels, got {thumbs}")
    wall_preview = pg.evaluate(
        """() => {
          const files = [...document.querySelectorAll('#level-grid .level-thumb img')]
            .map((img) => (img.getAttribute('src') || '').split('/').pop());
          const numbers = [...document.querySelectorAll('#level-grid .level-thumb b')]
            .map((el) => el.textContent.trim());
          const hit = document.querySelector('#level-grid .wall-hit');
          if (!hit) return { ok: false };
          hit.click();
          const lit = hit.closest('.level-thumb')?.classList.contains('is-lit');
          const stillWall = !document.querySelector('#wall')?.classList.contains('hidden');
          return {
            ok: true,
            lit,
            stillWall,
            files,
            numbers,
            hasBeat: !!document.querySelector('#level-grid .wall-hit[data-beat]'),
          };
        }"""
    )
    if not wall_preview.get("ok") or wall_preview.get("lit") is not True:
        raise RuntimeError("Level-wall comic thumbs must light up when tapped")
    if wall_preview.get("stillWall") is not True:
        raise RuntimeError("Wall thumb taps must not start the level")
    if wall_preview.get("numbers"):
        raise RuntimeError(f"Going Home wall must not print 1–4 order badges, got {wall_preview.get('numbers')}")
    if wall_preview.get("hasBeat"):
        raise RuntimeError("Going Home wall thumbs must not label the story beats")
    if wall_preview.get("files") == [
        "rainbow-umbrella-p01.webp",
        "rainbow-umbrella-p02.webp",
        "rainbow-umbrella-p04.webp",
        "rainbow-umbrella-p06.webp",
    ]:
        raise RuntimeError("Going Home wall must shuffle preview pictures so it does not leak the order")
    start_label = pg.text_content("[data-start='rainbow-umbrella']") or ""
    if start_label.strip() != "點此開始":
        raise RuntimeError(f"Level start button must be 「點此開始」, got {start_label!r}")
    if "兒" in start_label or "儿" in start_label:
        raise RuntimeError("Level start button must not keep the stray 兒")
    pg.click("[data-start='rainbow-umbrella']")
    pg.wait_for_selector("#warmup:not(.hidden) #warmup-pool")
    if pg.is_visible("#play") and "hidden" not in (pg.get_attribute("#play", "class") or ""):
        raise RuntimeError("Going Home must start with the sort warmup, not the recorder")
    warmup_probe = pg.evaluate(
        """() => {
          const pool = [...document.querySelectorAll('#warmup-pool .warmup-pic img')].map((img) => img.getAttribute('src') || '');
          const first = document.querySelector('#warmup-pool .warmup-pic:not(.is-placed)');
          if (!first) return { ok: false, reason: 'missing-warmup' };
          const panelIndex = Number(first.dataset.panel);
          const wrongSlotIndex = panelIndex === 3 ? 0 : 3;
          first.click();
          document.querySelector(`#warmup-slots .warmup-slot[data-slot="${wrongSlotIndex}"]`)?.click();
          return {
            ok: true,
            poolCount: pool.length,
            selected: !!document.querySelector('#warmup-pool .warmup-pic.is-selected'),
            feedback: document.querySelector('#warmup-feedback')?.textContent || '',
            hasCross: /[✕✘❌]/.test(document.body.innerText),
            playHidden: document.querySelector('#play')?.classList.contains('hidden'),
            objectFits: [...document.querySelectorAll('#warmup-pool .warmup-pic img')].map(
              (img) => getComputedStyle(img).objectFit
            ),
          };
        }"""
    )
    if not warmup_probe.get("ok"):
        raise RuntimeError("Warmup must show tappable pictures and 1–4 slots")
    if warmup_probe.get("poolCount") != 4:
        raise RuntimeError(f"Warmup pool must have 4 pictures, got {warmup_probe.get('poolCount')}")
    if warmup_probe.get("selected") is not True:
        raise RuntimeError("Wrong slot must keep the selected picture")
    if "再試吓" not in (warmup_probe.get("feedback") or "") and "呢格" not in (warmup_probe.get("feedback") or ""):
        raise RuntimeError("Wrong slot must give a gentle hint")
    if warmup_probe.get("hasCross"):
        raise RuntimeError("Warmup must not show a red cross")
    if warmup_probe.get("playHidden") is not True:
        raise RuntimeError("A wrong sort must not unlock recording")
    if not warmup_probe.get("objectFits") or any(fit != "contain" for fit in warmup_probe.get("objectFits") or []):
        raise RuntimeError(f"Warmup pictures must use object-fit:contain, got {warmup_probe.get('objectFits')}")
    placed = pg.evaluate(
        """() => {
          const order = [
            ['rainbow-umbrella-p01.webp', '0'],
            ['rainbow-umbrella-p02.webp', '1'],
            ['rainbow-umbrella-p04.webp', '2'],
            ['rainbow-umbrella-p06.webp', '3'],
          ];
          for (const [file, slot] of order) {
            const pic = [...document.querySelectorAll('#warmup-pool .warmup-pic img')]
              .find((img) => (img.getAttribute('src') || '').endsWith(file))
              ?.closest('.warmup-pic');
            if (!pic) return { ok: false, file };
            if (!pic.classList.contains('is-selected')) pic.click();
            const cell = document.querySelector(`#warmup-slots .warmup-slot[data-slot="${slot}"]`);
            if (!cell) return { ok: false, file };
            cell.click();
          }
          return {
            ok: true,
            nextVisible: !document.querySelector('#btn-warmup-next')?.classList.contains('hidden'),
            feedback: document.querySelector('#warmup-feedback')?.textContent || '',
          };
        }"""
    )
    if not placed.get("ok"):
        raise RuntimeError(f"Could not place warmup pictures in order ({placed.get('file')})")
    if placed.get("nextVisible") is not True:
        raise RuntimeError("Correct sort must unlock the next step")
    still_warmup = pg.evaluate(
        """() => ({
          warmup: !document.querySelector('#warmup')?.classList.contains('hidden'),
          path: document.querySelector('#path')?.classList.contains('hidden'),
        })"""
    )
    if still_warmup.get("warmup") is not True or still_warmup.get("path") is not True:
        raise RuntimeError("Finished sort must wait for 下一步; must not auto-jump to the path")
    next_box = pg.evaluate(
        """() => {
          const el = document.querySelector('#btn-warmup-next');
          const r = el?.getBoundingClientRect();
          return r ? { w: r.width, h: r.height } : null;
        }"""
    )
    if not next_box or next_box["h"] > 52 or next_box["w"] > 180:
        raise RuntimeError(f"下一步 must stay a compact button, got {next_box}")
    pg.click("#btn-warmup-next")
    pg.wait_for_selector("#path:not(.hidden) #btn-listen-model")
    path_copy = pg.evaluate(
        """() => ({
          listen: document.querySelector('#btn-listen-model')?.textContent.trim(),
          tell: document.querySelector('#btn-go-tell')?.textContent.trim(),
        })"""
    )
    if path_copy["listen"] != "🔊 聽範讀":
        raise RuntimeError(f"Path must offer 聽範讀, got {path_copy['listen']!r}")
    if path_copy["tell"] != "🎤 去講":
        raise RuntimeError(f"Path must offer 去講, got {path_copy['tell']!r}")
    pg.click("#btn-listen-model")
    pg.wait_for_selector("#listen:not(.hidden) #listen-board")
    listen_count = pg.evaluate("() => document.querySelectorAll('#listen-board .comic-panel img').length")
    if listen_count != 4:
        raise RuntimeError(f"Model listen must show 4 panels, got {listen_count}")
    listen_fits = pg.evaluate(
        """() => [...document.querySelectorAll('#listen-board .comic-panel img')]
          .map((img) => getComputedStyle(img).objectFit)"""
    )
    if any(fit != "contain" for fit in listen_fits):
        raise RuntimeError(f"Listen comic panels must use object-fit:contain, got {listen_fits}")
    if not pg.is_visible("#btn-listen-tell"):
        raise RuntimeError("Model listen must keep a 去講 skip")
    pg.click("#btn-listen-tell")
    pg.wait_for_selector("#play:not(.hidden) #btn-record")
    panels = pg.evaluate("() => document.querySelectorAll('#comic-board .comic-panel img').length")
    if panels != 4:
        raise RuntimeError(f"Play screen must show 4 comic panels, got {panels}")
    play_fits = pg.evaluate(
        """() => [...document.querySelectorAll('#comic-board .comic-panel img')]
          .map((img) => getComputedStyle(img).objectFit)"""
    )
    if any(fit != "contain" for fit in play_fits):
        raise RuntimeError(f"Play comic panels must use object-fit:contain, got {play_fits}")
    preview = pg.evaluate(
        """() => {
          const hit = document.querySelector('#comic-board .comic-hit[data-beat="第一"]');
          if (!hit) return { ok: false, reason: 'missing-hit' };
          hit.click();
          const lit = document.querySelector('#comic-board .comic-panel[data-beat="第一"]')?.classList.contains('is-lit');
          const reviewing = document.querySelector('#play')?.classList.contains('is-reviewing');
          const kidHidden = document.querySelector('#kid-panels')?.classList.contains('hidden');
          return { ok: true, lit, reviewing, kidHidden };
        }"""
    )
    if not preview.get("ok"):
        raise RuntimeError("Play screen must expose tappable comic hits before recording")
    if preview.get("lit") is not True:
        raise RuntimeError("Comic panels must light up before recording finishes")
    if preview.get("reviewing") is True:
        raise RuntimeError("Preview taps must not enter the parent/kid check step")
    if preview.get("kidHidden") is not True:
        raise RuntimeError("Preview taps must not reveal scoring checks")
    privacy = pg.text_content("#privacy-note") or ""
    if "唔會上傳" not in privacy or "呢部機" not in privacy:
        raise RuntimeError("Play screen must show local-only microphone copy")
    metrics = pg.evaluate(
        """() => {
          const d = document.documentElement;
          return {
            overflowX: d.scrollWidth - d.clientWidth,
            overflowY: d.scrollHeight - d.clientHeight,
            recordH: document.querySelector('#btn-record')?.getBoundingClientRect().height || 0,
          };
        }"""
    )
    if metrics["overflowX"] > 2:
        raise RuntimeError(f"Four-panel play screen overflows horizontally by {metrics['overflowX']}px")
    if pg.viewport_size["width"] > 700 and metrics["overflowY"] > 2:
        raise RuntimeError(f"Four-panel iPad play screen must not page-scroll, overflowY={metrics['overflowY']}")
    if metrics["recordH"] < 44:
        raise RuntimeError("Record button touch target must be at least 44px")
    pg.evaluate("() => window.KakaFourPanel?.revealClosedLoopForTest?.()")
    pg.wait_for_selector("#kid-panels:not(.hidden) .kid-panel-btn")
    pg.wait_for_selector("#kid-self:not(.hidden) .kid-self-btn")
    pg.wait_for_selector("#parent-checks:not(.hidden)")
    kid_copy = pg.evaluate(
        """() => ({
          panels: [...document.querySelectorAll('#kid-panel-grid .kid-panel-btn')].map((el) => el.textContent.trim()),
          self: [...document.querySelectorAll('#kid-self .kid-self-btn')].map((el) => el.textContent.trim()),
          parent: document.querySelector('.parent-frame')?.textContent || '',
          retry: document.querySelector('#retry-note')?.textContent || '',
          completeDisabled: document.querySelector('#btn-complete')?.disabled ?? true,
        })"""
    )
    if kid_copy["panels"] != ["第一", "然後", "後來", "最後"]:
        raise RuntimeError(f"Kid panel checks must be the four beats, got {kid_copy['panels']}")
    if kid_copy["self"] != ["我講齊喇", "我講大聲", "我講完喇"]:
        raise RuntimeError(f"Kid self-check labels mismatch: {kid_copy['self']}")
    if "小朋友話自己做到喇" not in kid_copy["parent"]:
        raise RuntimeError("Parent checks must be framed as confirming the kid self-check")
    if "再講一次呀" not in kid_copy["retry"]:
        raise RuntimeError("Disagree path must keep the gentle retry line")
    if kid_copy["completeDisabled"] is not True:
        raise RuntimeError("Complete must stay locked until parent also agrees")
    review_metrics = pg.evaluate(
        """() => {
          const d = document.documentElement;
          const targets = [...document.querySelectorAll('.kid-panel-btn, .kid-self-btn, #btn-rerecord')];
          return {
            overflowX: d.scrollWidth - d.clientWidth,
            overflowY: d.scrollHeight - d.clientHeight,
            minTap: Math.min(...targets.map((el) => Math.min(el.getBoundingClientRect().width, el.getBoundingClientRect().height))),
          };
        }"""
    )
    if review_metrics["overflowX"] > 2:
        raise RuntimeError(f"Four-panel review overflows horizontally by {review_metrics['overflowX']}px")
    if pg.viewport_size["width"] > 700 and review_metrics["overflowY"] > 2:
        raise RuntimeError(f"Four-panel iPad review must not page-scroll, overflowY={review_metrics['overflowY']}")
    if review_metrics["minTap"] < 44:
        raise RuntimeError(f"Closed-loop tap targets must be at least 44px, got {review_metrics['minTap']}")
    # Standalone four-panel page has no .screen.active; keep overflow/tap checks above.
    back_label = (pg.text_content("#back-link") or "").strip()
    if back_label != "← 選路":
        raise RuntimeError(f"Play back must return one level to the path, got {back_label!r}")
    pg.click("#back-link")
    pg.wait_for_selector("#path:not(.hidden) #btn-go-tell")
    pg.click("#back-link")
    pg.wait_for_selector("#warmup:not(.hidden) #warmup-pool")
    pg.click("#back-link")
    pg.wait_for_selector("#wall:not(.hidden) [data-start='rainbow-umbrella']")
    with pg.expect_navigation():
        pg.click("#back-link")
    pg.wait_for_selector("#screen-topics.active #btn-topics-hanzi-write")
    if pg.is_visible("#btn-topics-four-panel"):
        raise RuntimeError("Chinese topic page must not restore the removed four-panel duplicate entry")
    if pg.is_visible("#screen-profiles") and "active" in (pg.get_attribute("#screen-profiles", "class") or ""):
        raise RuntimeError("Four-panel wall ← 中文 must not dump on the profile picker")
    if pg.is_visible("#screen-home") and "active" in (pg.get_attribute("#screen-home", "class") or ""):
        raise RuntimeError("Four-panel wall ← 中文 must return one level to Chinese topics, not home")

    # 卡卡學寫字：中文主題入口 → 選章 → 選字 → 寫「一」→ 過關
    pg.wait_for_selector("#screen-topics.active #btn-topics-hanzi-write")
    hanzi_href = pg.get_attribute("#btn-topics-hanzi-write", "href") or ""
    if "hanzi-write-demo.html" not in hanzi_href:
        raise RuntimeError("Chinese hub must open the independent hanzi-write demo")
    probe("中文・卡卡學寫字入口")
    with pg.expect_navigation():
        pg.click("#btn-topics-hanzi-write")
    pg.wait_for_selector("#view-adventure:not(.hidden) [data-chapter-id='ch1'], #view-profile:not(.hidden) #btn-profile-kaka")
    if pg.is_visible("#view-adventure:not(.hidden)"):
        pg.click("#back-link")
        pg.wait_for_selector("#view-profile:not(.hidden) #btn-profile-kaka")
    if pg.is_visible("#view-write:not(.hidden)"):
        raise RuntimeError("Hanzi demo must not start on the writing screen")
    pg.click("#view-profile:not(.hidden) #btn-profile-kaka")
    pg.wait_for_selector("#view-adventure:not(.hidden) [data-chapter-id='ch1']")
    ch1_label = (pg.text_content("[data-chapter-id='ch1'] .chapter-label") or "").strip()
    if ch1_label != "第1章":
        raise RuntimeError(f"Chapter tile must show 「第1章」, got {ch1_label!r}")
    if "即將開放" in (pg.text_content("#chapter-grid") or ""):
        raise RuntimeError("Locked chapter tiles must not repeat 即將開放")
    if not pg.query_selector("#chapter-grid .chapter-card.is-locked .chapter-lock"):
        raise RuntimeError("Locked chapters must show a padlock overlay")
    if pg.query_selector("#btn-start-adventure"):
        raise RuntimeError("Chapter picker must not keep 由第一章開始")
    if not pg.query_selector("#btn-speak-chapters"):
        raise RuntimeError("Chapter picker must have a speaker button")
    pg.click("[data-chapter-id='ch1']")
    if pg.query_selector("#view-warmup, #warmup-grid, #btn-warmup-listen"):
        raise RuntimeError("Hanzi chapter entry must skip the old 聽粵語指圖 gate")
    pg.wait_for_selector("#view-chars:not(.hidden) #level-bank")
    if "0／6" not in (pg.text_content("#level-bank") or ""):
        raise RuntimeError("Character list must show 0／6 progress")
    first_chip = pg.query_selector("#level-bank [data-char-id='yi']")
    if not first_chip:
        raise RuntimeError("Chapter 1 must list 一")
    first_chip.click()
    pg.wait_for_selector("#view-write:not(.hidden) #hanzi-target svg")
    heading = pg.text_content("#write-heading") or ""
    if "一" not in heading:
        raise RuntimeError(f"Write screen must ask for 一, got {heading!r}")
    meaning = (pg.text_content("#write-meaning") or "").strip()
    if "一" not in meaning:
        raise RuntimeError(f"Write screen must pair the character with a meaning buddy, got {meaning!r}")
    if pg.evaluate("() => document.querySelector('#write-meaning')?.hidden === true"):
        raise RuntimeError("Write meaning buddy must stay visible beside the 九宮格")
    meaning_tap = pg.evaluate(
        """() => {
          const box = document.querySelector('#write-meaning')?.getBoundingClientRect();
          return Math.min(box?.width || 0, box?.height || 0);
        }"""
    )
    if meaning_tap < 44:
        raise RuntimeError(f"Meaning buddy tap target must be at least 44px, got {meaning_tap}")
    if not pg.locator(".mizi-board, .jiugong-board").count():
        raise RuntimeError("Write screen must show a 九宮格")
    grid_svg = pg.inner_html(".jiugong-grid") or ""
    if "x1=\"2\" y1=\"2\" x2=\"98\" y2=\"98\"" in grid_svg:
        raise RuntimeError("九宮格 must not include 米字 diagonal lines")
    if "34.33" not in grid_svg or "67.67" not in grid_svg:
        raise RuntimeError("九宮格 must use 3×3 lines at one-third")
    vocab_text = pg.text_content("#write-vocab") or ""
    if "一個" not in vocab_text:
        raise RuntimeError(f"Write screen must show related vocab, got {vocab_text!r}")
    vocab_tap = pg.evaluate(
        """() => {
          const chip = document.querySelector('#write-vocab .vocab-chip');
          const box = chip?.getBoundingClientRect();
          return Math.min(box?.width || 0, box?.height || 0);
        }"""
    )
    if vocab_tap < 44:
        raise RuntimeError(f"Vocab chip tap target must be at least 44px, got {vocab_tap}")
    rewrite = (pg.text_content("#btn-rewrite") or "").strip()
    if rewrite != "再寫一次":
        raise RuntimeError(f"Rewrite button must be 「再寫一次」, got {rewrite!r}")
    if pg.is_visible("#btn-write-rest") or pg.is_visible("#rest-overlay"):
        raise RuntimeError("Write screen must not offer 休息一下")
    stamp_probe = pg.evaluate(
        """() => {
          const api = window.KakaHanziWrite;
          const id = api?.currentLevel?.()?.id;
          api?.setSuccessCount?.(id, 2);
          api?.renderWriteStamps?.(2);
          const host = document.querySelector('#write-stamps');
          const stamps = [...document.querySelectorAll('#write-stamps .write-stamp')];
          const board = document.querySelector('.mizi-board')?.getBoundingClientRect();
          const last = stamps[stamps.length - 1]?.getBoundingClientRect();
          const first = stamps[0]?.getBoundingClientRect();
          const visibleLead = document.querySelector('#write-lead');
          const visibleProgress = document.querySelector('#write-progress');
          const progressBox = visibleProgress?.getBoundingClientRect();
          const progressHidden = !visibleProgress || visibleProgress.classList.contains('is-aux')
            || (progressBox && (progressBox.width <= 2 || progressBox.height <= 2));
          return {
            count: stamps.length,
            lit: stamps.filter((el) => el.classList.contains('is-on')).length,
            minSize: Math.min(...stamps.map((el) => {
              const box = el.getBoundingClientRect();
              return Math.min(box.width, box.height);
            })),
            rightGap: last ? window.innerWidth - last.right : 99,
            bottomGap: last ? window.innerHeight - last.bottom : 99,
            coversBoard: !!(board && first && last
              && last.right > board.left + 4
              && first.left < board.right - 4
              && last.bottom > board.top + 4
              && first.top < board.bottom - 4),
            leadText: visibleLead?.textContent || '',
            progressHidden,
            hostHidden: host?.hidden === true,
          };
        }"""
    )
    if stamp_probe.get("count") != 6:
        raise RuntimeError(f"Write screen must show 6 stamp stars, got {stamp_probe.get('count')}")
    if stamp_probe.get("lit") != 2:
        raise RuntimeError(f"Stamp stars must mirror success count, lit={stamp_probe.get('lit')}")
    if stamp_probe.get("minSize", 0) < 44:
        raise RuntimeError(f"Stamp stars must be at least 44px, got {stamp_probe.get('minSize')}")
    if stamp_probe.get("rightGap", 99) > 28 or stamp_probe.get("bottomGap", 99) > 28:
        raise RuntimeError(f"Stamp stars must sit at bottom-right, gaps={stamp_probe}")
    if stamp_probe.get("coversBoard"):
        raise RuntimeError("Stamp stars must not cover the 九宮格")
    if "／" in (stamp_probe.get("leadText") or "") or "2／6" in (stamp_probe.get("leadText") or ""):
        raise RuntimeError("Write lead must not show 2／6 number copy")
    if not stamp_probe.get("progressHidden"):
        raise RuntimeError("Top 已寫 n／6 text must stay auxiliary, not the main progress")
    before_miss = pg.evaluate(
        """() => {
          const api = window.KakaHanziWrite;
          return {
            count: api?.successCount?.(api.currentLevel().id),
            lit: document.querySelectorAll('#write-stamps .write-stamp.is-on').length,
          };
        }"""
    )
    write_metrics = pg.evaluate(
        """() => {
          const d = document.documentElement;
          const start = document.querySelector('#btn-rewrite')?.getBoundingClientRect();
          window.KakaHanziWrite?.showActiveStrokeGuide?.(0);
          const guide = document.querySelector('.hanzi-guide-stroke, #hanzi-guide path');
          const target = document.querySelector('.hanzi-target');
          const guideHost = document.querySelector('.hanzi-guide');
          const targetZ = Number(target ? getComputedStyle(target).zIndex : 0);
          const guideZ = Number(guideHost ? getComputedStyle(guideHost).zIndex : 0);
          const size = Math.min(target?.clientWidth || 320, target?.clientHeight || 320);
          const drawingW = window.KakaHanziWrite?.drawingWidthFor?.(size) || 0;
          const meaningBox = document.querySelector('#write-meaning')?.getBoundingClientRect();
          const boardBox = document.querySelector('.mizi-board')?.getBoundingClientRect();
          const coversBoard = !!(meaningBox && boardBox
            && meaningBox.right > boardBox.left + 4
            && meaningBox.left < boardBox.right - 4
            && meaningBox.bottom > boardBox.top + 4
            && meaningBox.top < boardBox.bottom - 4);
          return {
            overflowX: d.scrollWidth - d.clientWidth,
            overflowY: d.scrollHeight - d.clientHeight,
            tap: Math.min(start?.width || 0, start?.height || 0),
            coversBoard,
            writerKids: document.querySelector('#hanzi-target')?.childElementCount || 0,
            guideFill: guide?.getAttribute('fill') || '',
            guideStroke: guide?.getAttribute('stroke') || '',
            guideDash: guide?.getAttribute('stroke-dasharray') || '',
            guideHidden: !guide,
            guideFillIsNone: (guide?.getAttribute('fill') || '') === 'none',
            guideInWriter: !!guide?.closest('#hanzi-target'),
            inkAboveGuide: !!(guide?.closest('#hanzi-target') || targetZ > guideZ),
            drawingWidth: drawingW,
            drawingInk: window.KakaHanziWrite?.DRAWING_INK || '',
          };
        }"""
    )
    if write_metrics.get("coversBoard"):
        raise RuntimeError("Meaning buddy must not cover the 九宮格 write canvas")
    if write_metrics["overflowX"] > 2:
        raise RuntimeError(f"Hanzi write screen overflows horizontally by {write_metrics['overflowX']}px")
    if pg.viewport_size["width"] > 700 and write_metrics["overflowY"] > 2:
        raise RuntimeError(f"Hanzi iPad write screen must not page-scroll, overflowY={write_metrics['overflowY']}")
    if write_metrics["tap"] < 44:
        raise RuntimeError("Hanzi rewrite button must be at least 44px")
    if write_metrics.get("guideHidden"):
        raise RuntimeError("Write screen must show a visible orange stroke guide")
    if not write_metrics.get("guideFillIsNone"):
        raise RuntimeError(f"Quiz stroke guide must be hollow (fill=none), got {write_metrics.get('guideFill')!r}")
    if write_metrics.get("guideStroke") != "#ff8a1a":
        raise RuntimeError(f"Active stroke guide must be #ff8a1a, got {write_metrics.get('guideStroke')!r}")
    if not write_metrics.get("guideDash"):
        raise RuntimeError("Quiz stroke guide must use a dashed outline")
    if not write_metrics.get("inkAboveGuide"):
        raise RuntimeError("Child ink layer must paint above the dashed stroke guide")
    if not write_metrics.get("guideInWriter"):
        raise RuntimeError("Quiz stroke guide must sit inside the writer SVG so finger ink paints after it")
    if write_metrics.get("drawingWidth", 0) < 56:
        raise RuntimeError(f"drawingWidth too thin for iPad finger: {write_metrics.get('drawingWidth')}")
    if write_metrics.get("drawingInk") != "#16325c":
        raise RuntimeError(f"Live ink must contrast the orange guide, got {write_metrics.get('drawingInk')!r}")
    colors = pg.evaluate(
        """() => ({
          orange: window.KakaHanziWrite?.GUIDE_ORANGE,
          hint: window.KakaHanziWrite?.WRITE_HINT,
        })"""
    )
    if colors.get("orange") != "#ff8a1a":
        raise RuntimeError(f"Guide color must be kid-visible orange, got {colors.get('orange')!r}")
    if "橙色" not in (colors.get("hint") or ""):
        raise RuntimeError("Write hint must name the orange guide line")
    pg.evaluate("() => window.KakaHanziWrite?.onQuizMiss?.()")
    miss = (pg.text_content("#write-status") or "").strip()
    if "再試一次" not in miss:
        raise RuntimeError(f"A miss must update status to 再試一次, got {miss!r}")
    after_miss = pg.evaluate(
        """() => {
          const api = window.KakaHanziWrite;
          return {
            count: api?.successCount?.(api.currentLevel().id),
            lit: document.querySelectorAll('#write-stamps .write-stamp.is-on').length,
          };
        }"""
    )
    if after_miss.get("count") != before_miss.get("count") or after_miss.get("lit") != before_miss.get("lit"):
        raise RuntimeError(f"A miss must not dim earned stars, before={before_miss!r} after={after_miss!r}")
    after_tick = pg.evaluate(
        """() => {
          const api = window.KakaHanziWrite;
          const before = api?.successCount?.(api.currentLevel().id);
          api?.onWriteSuccess?.();
          const stamps = [...document.querySelectorAll('#write-stamps .write-stamp')];
          return {
            before,
            count: api?.successCount?.(api.currentLevel().id),
            lit: stamps.filter((el) => el.classList.contains('is-on')).length,
            flashed: document.querySelector('.mizi-board')?.classList.contains('is-success') === true,
            overlay: document.querySelector('#pass-overlay')?.classList.contains('hidden') === false,
            status: document.querySelector('#write-status')?.textContent || '',
            cheer: document.querySelector('#write-status')?.classList.contains('is-cheer') === true,
          };
        }"""
    )
    if after_tick.get("count") != (after_tick.get("before") or 0) + 1 or after_tick.get("lit") != after_tick.get("count"):
        raise RuntimeError(f"A successful write must light one more star, got {after_tick!r}")
    if not after_tick.get("flashed"):
        raise RuntimeError("A successful write must flash the 九宮格")
    if after_tick.get("overlay"):
        raise RuntimeError("A mid-character success must not open the pass overlay")
    if after_tick.get("count") == 3:
        if "這個是" not in (after_tick.get("status") or "") or not after_tick.get("cheer"):
            raise RuntimeError(f"The 3rd success must show a written meaning cheer, got {after_tick!r}")
        if "過關" in (after_tick.get("status") or ""):
            raise RuntimeError("The 3rd success must not talk about 過關")
    hint_levels = pg.evaluate(
        """() => {
          const api = window.KakaHanziWrite;
          return {
            at0: api?.hintLevelFor?.(0),
            at2: api?.hintLevelFor?.(2),
            at4: api?.hintLevelFor?.(4),
          };
        }"""
    )
    if hint_levels.get("at0") != 1 or hint_levels.get("at2") != 2 or hint_levels.get("at4") != 3:
        raise RuntimeError(f"Hint fade must be 1/2/3 by success count, got {hint_levels!r}")
    pg.evaluate("() => window.KakaHanziWrite?.onLevelPassed?.()")
    pg.wait_for_selector("#pass-overlay:not(.hidden) #pass-title")
    pass_title = (pg.text_content("#pass-title") or "").strip()
    if pass_title != "寫得好！再學下一個字。":
        raise RuntimeError(f"Pass title must encourage the next character, got {pass_title!r}")
    if "過關" in pass_title or "關卡" in pass_title:
        raise RuntimeError(f"Pass title must not say 過關／關卡, got {pass_title!r}")
    gloss = (pg.text_content("#pass-gloss") or "").strip()
    if "這個是一二三的『一』" not in gloss:
        raise RuntimeError(f"Pass overlay must show written gloss, got {gloss!r}")
    stars = (pg.text_content("#pass-stars") or "").strip()
    if "★" not in stars:
        raise RuntimeError(f"Pass screen must show stars, got {stars!r}")
    next_btn = pg.locator("#btn-next-level")
    if not next_btn.is_visible() or (next_btn.text_content() or "").strip() != "下一個字":
        raise RuntimeError("Pass screen primary action must be 下一個字")
    next_class = pg.get_attribute("#btn-next-level", "class") or ""
    back_class = pg.get_attribute("#btn-back-chars", "class") or ""
    if "primary-btn" not in next_class:
        raise RuntimeError("下一個字 must be the large primary button")
    if "pass-secondary" not in back_class:
        raise RuntimeError("返回字表 must stay a secondary action")
    if "返回字表" not in (pg.text_content("#btn-back-chars") or ""):
        raise RuntimeError("Pass screen must offer 返回字表")
    if "返主頁" not in (pg.text_content("#btn-pass-home") or ""):
        raise RuntimeError("Pass screen must offer 返主頁")
    with pg.expect_navigation():
        pg.click("#btn-pass-home")
    pg.wait_for_selector("#screen-topics.active #btn-topics-hanzi-write")
    if pg.is_visible("#screen-home") and "active" in (pg.get_attribute("#screen-home", "class") or ""):
        raise RuntimeError("Hanzi 返主頁 must return to Chinese topics, not home")

    # 卡卡常識樂園：主頁頂層 → 包牆 → 學習牆 → 隨機 10 題 → 10／10 慶祝＋幣
    pg.goto(url, wait_until="domcontentloaded")
    pg.wait_for_timeout(300)
    pg.click("#btn-profile-kaka")
    pg.wait_for_timeout(200)
    pg.wait_for_selector("#screen-home.active #btn-start-common-sense")
    cs_href = pg.get_attribute("#btn-start-common-sense", "href") or ""
    if "common-sense.html" not in cs_href:
        raise RuntimeError("Home must open 卡卡常識樂園 as a standalone top-level subject")
    if "卡卡常識樂園" not in (pg.text_content("#screen-home.active") or ""):
        raise RuntimeError("Home must show the 卡卡常識樂園 subject card")
    probe("主頁・常識入口")
    with pg.expect_navigation():
        pg.click("#btn-start-common-sense")
    pg.wait_for_selector("#view-packs:not(.hidden) #btn-pack-heroes")
    soon = pg.evaluate("() => [...document.querySelectorAll('.pack-soon')].map((el) => el.textContent).join(' ')")
    hub_text = pg.evaluate("() => document.querySelector('#view-packs')?.innerText || ''")
    if soon.strip() or "即將推出" in hub_text or "情緒小達人" in hub_text:
        raise RuntimeError("Common-sense hub must hide unimplemented packs, not show coming soon")
    if not pg.query_selector("#btn-pack-comics"):
        raise RuntimeError("Common-sense hub must link to playable 面試四格")
    pg.click("#btn-pack-heroes")
    pg.wait_for_selector("#view-learn:not(.hidden) #btn-start-quiz")
    cards = pg.evaluate("() => document.querySelectorAll('#learn-grid .learn-card').length")
    if cards != 10:
        raise RuntimeError(f"Learn wall must show all 10 careers at once, got {cards}")
    start_h = pg.evaluate("() => document.querySelector('#btn-start-quiz')?.getBoundingClientRect().height || 0")
    if start_h < 44:
        raise RuntimeError("開始答題 must be at least 44px tall")
    learn_overflow_x = pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
    if learn_overflow_x > 2:
        raise RuntimeError(f"Learn wall overflows horizontally by {learn_overflow_x}px")
    pg.click("#btn-start-quiz")
    pg.wait_for_selector("#view-quiz:not(.hidden) #quiz-choices .choice")
    gate = pg.evaluate(
        """() => ({
          listening: document.querySelector('#quiz-choices')?.classList.contains('is-listening'),
          lockedApi: Boolean(window.KakaCommonSense?.isChoicesLocked?.()),
          unlockMs: window.KakaCommonSense?.ASK_UNLOCK_MS,
        })"""
    )
    if gate["unlockMs"] != 2000:
        raise RuntimeError("Quiz ask gate must unlock after about 2 seconds")
    if gate["listening"] or gate["lockedApi"]:
        pg.evaluate("() => document.querySelector('#quiz-choices .choice')?.click()")
        gated = pg.evaluate(
            """() => ({
              progress: document.querySelector('#status-pill')?.textContent || '',
              feedback: document.querySelector('#quiz-feedback')?.textContent || '',
              playing: document.querySelectorAll('#quiz-choices .choice.is-playing').length,
            })"""
        )
        if "已答啱 0／10" not in gated["progress"]:
            raise RuntimeError("Tapping an answer during the ask gate must not score yet")
        if "啱喇" in gated["feedback"] or "唔係呢個喎" in gated["feedback"] or gated["playing"]:
            raise RuntimeError("Ask gate must delay judging; do not play-then-judge while still locked")
    choice_n = pg.evaluate("() => document.querySelectorAll('#quiz-choices .choice').length")
    if choice_n != 4:
        raise RuntimeError(f"Quiz must show 4 choices, got {choice_n}")
    speak_n = pg.evaluate("() => document.querySelectorAll('#quiz-choices .choice-speak').length")
    if speak_n != 4:
        raise RuntimeError(f"Each answer needs a speaker control, got {speak_n}")
    quiz_metrics = pg.evaluate(
        """() => {
          const d = document.documentElement;
          const choices = [...document.querySelectorAll('#quiz-choices .choice')];
          const speaks = [...document.querySelectorAll('#quiz-choices .choice-speak')];
          const frame = document.querySelector('.quiz-frame')?.getBoundingClientRect();
          const img = document.querySelector('#quiz-img');
          return {
            overflowX: d.scrollWidth - d.clientWidth,
            overflowY: d.scrollHeight - d.clientHeight,
            minTap: Math.min(...choices.map((el) => Math.min(el.getBoundingClientRect().width, el.getBoundingClientRect().height))),
            speakTap: Math.min(...speaks.map((el) => Math.min(el.getBoundingClientRect().width, el.getBoundingClientRect().height))),
            progress: document.querySelector('#status-pill')?.textContent || '',
            frameRatio: frame && frame.height ? frame.width / frame.height : 0,
            frameH: frame?.height || 0,
            objectFit: img ? getComputedStyle(img).objectFit : '',
            fillW: frame && img ? img.getBoundingClientRect().width / frame.width : 0,
            fillH: frame && img ? img.getBoundingClientRect().height / frame.height : 0,
          };
        }"""
    )
    if quiz_metrics["overflowX"] > 2:
        raise RuntimeError(f"Common-sense quiz overflows horizontally by {quiz_metrics['overflowX']}px")
    if pg.viewport_size["width"] > 700 and quiz_metrics["overflowY"] > 2:
        raise RuntimeError(f"Common-sense iPad quiz must not page-scroll, overflowY={quiz_metrics['overflowY']}")
    if quiz_metrics["minTap"] < 44:
        raise RuntimeError(f"Quiz choices must be at least 44px, got {quiz_metrics['minTap']}")
    if quiz_metrics["speakTap"] < 44:
        raise RuntimeError(f"Answer speaker must be at least 44px, got {quiz_metrics['speakTap']}")
    if abs(quiz_metrics["frameRatio"] - (4 / 3)) > 0.12:
        raise RuntimeError(f"Quiz image frame must be ~4:3, got {quiz_metrics['frameRatio']:.3f}")
    if quiz_metrics["objectFit"] != "contain":
        raise RuntimeError(f"Quiz image must use object-fit:contain, got {quiz_metrics['objectFit']!r}")
    if quiz_metrics["fillW"] < 0.92 or quiz_metrics["fillH"] < 0.92:
        raise RuntimeError(
            f"Quiz image must fill the 4:3 frame, fillW={quiz_metrics['fillW']:.3f} fillH={quiz_metrics['fillH']:.3f}"
        )
    if pg.viewport_size["width"] <= 700 and quiz_metrics["frameH"] > (pg.viewport_size["height"] * 0.36) + 2:
        raise RuntimeError(f"Phone quiz image taller than ~1/3 screen, height={quiz_metrics['frameH']}")
    if "已答啱 0／10" not in quiz_metrics["progress"]:
        raise RuntimeError(f"Quiz progress must start at 已答啱 0／10, got {quiz_metrics['progress']!r}")
    pg.click("#quiz-choices .choice-speak")
    after_speak = pg.evaluate("() => document.querySelector('#status-pill')?.textContent || ''")
    if "已答啱 0／10" not in after_speak:
        raise RuntimeError("Tapping an answer speaker must not select that answer")
    pg.evaluate("() => { window.__KAKA_TEST__ = true; }")
    pg.evaluate("() => window.KakaCommonSense.answerCurrentWrong()")
    wrong_state = pg.evaluate(
        """() => ({
          progress: document.querySelector('#status-pill')?.textContent || '',
          feedback: document.querySelector('#quiz-feedback')?.textContent || '',
          disabledWrong: [...document.querySelectorAll('#quiz-choices .choice.is-wrong')].length,
        })"""
    )
    if "已答啱 0／10" not in wrong_state["progress"]:
        raise RuntimeError("Wrong answers must not increment 已答啱 N／10")
    if "唔係呢個喎" not in wrong_state["feedback"]:
        raise RuntimeError("Wrong answers need the gentle retry hint")
    if wrong_state["disabledWrong"] < 1:
        raise RuntimeError("Wrong choice should stay marked so the child can retry")
    for _ in range(10):
        ok = pg.evaluate("() => window.KakaCommonSense.answerCurrentCorrect()")
        if not ok:
            raise RuntimeError("Could not click the correct common-sense answer")
    pg.wait_for_selector("#view-finish:not(.hidden) #finish-msg")
    finish_msg = pg.text_content("#finish-msg") or ""
    if "攞到一個 AEON 幣" not in finish_msg and "今日已攞" not in finish_msg:
        raise RuntimeError(f"Finish screen must award a coin or say 今日已攞, got {finish_msg!r}")
    if pg.is_visible("#view-quiz") and "hidden" not in (pg.get_attribute("#view-quiz", "class") or ""):
        raise RuntimeError("10／10 must auto-open the celebration screen")
    pg.click("#btn-play-again")
    pg.wait_for_selector("#view-quiz:not(.hidden) #quiz-choices .choice")
    replay = pg.evaluate(
        """() => ({
          viewHidden: document.querySelector('#view-learn')?.classList.contains('hidden'),
          progress: document.querySelector('#status-pill')?.textContent || '',
          choices: document.querySelectorAll('#quiz-choices .choice').length,
        })"""
    )
    if not replay["viewHidden"]:
        raise RuntimeError("再開一次 must start a new quiz, not return to the learn wall")
    if "已答啱 0／10" not in replay["progress"]:
        raise RuntimeError(f"再開一次 must reshuffle a fresh 10-question round, got {replay['progress']!r}")
    if replay["choices"] != 4:
        raise RuntimeError(f"Replay quiz must show 4 choices, got {replay['choices']}")
    for _ in range(10):
        ok = pg.evaluate("() => window.KakaCommonSense.answerCurrentCorrect()")
        if not ok:
            raise RuntimeError("Could not finish the replay common-sense round")
    pg.wait_for_selector("#view-finish:not(.hidden) #finish-msg")
    replay_msg = pg.text_content("#finish-msg") or ""
    if "今日已攞" not in replay_msg:
        raise RuntimeError(f"Same-day replay must say 今日已攞, got {replay_msg!r}")
    if "攞到一個 AEON 幣" in replay_msg:
        raise RuntimeError("Same-day replay must not imply another coin")
    back_label = pg.text_content("#back-link") or ""
    if "學習牆" not in back_label:
        raise RuntimeError(f"Finish top-bar must return to the learn wall, got {back_label!r}")
    pg.click("#back-link")
    pg.wait_for_selector("#view-learn:not(.hidden) #btn-start-quiz")
    pg.click("#back-link")
    pg.wait_for_selector("#view-packs:not(.hidden) #btn-pack-heroes")
    if not pg.query_selector("#btn-pack-body"):
        raise RuntimeError("Common-sense hub must show playable 身體同五感")
    pg.click("#btn-pack-body")
    pg.wait_for_selector("#view-learn:not(.hidden) #btn-start-quiz")
    body_cards = pg.evaluate("() => document.querySelectorAll('#learn-grid .learn-card').length")
    if body_cards != 8:
        raise RuntimeError(f"Body-senses learn wall must show 8 cards, got {body_cards}")
    pg.click("#btn-start-quiz")
    pg.wait_for_selector("#view-quiz:not(.hidden) #quiz-choices .choice")
    pg.evaluate("() => { window.__KAKA_TEST__ = true; }")
    pg.evaluate("() => window.KakaCommonSense.answerCurrentWrong()")
    body_wrong = pg.evaluate(
        """() => ({
          progress: document.querySelector('#status-pill')?.textContent || '',
          feedback: document.querySelector('#quiz-feedback')?.textContent || '',
          why: document.querySelector('#quiz-why-text')?.textContent || '',
          whyHidden: document.querySelector('#quiz-why')?.classList.contains('hidden'),
        })"""
    )
    if "已答啱 0／8" not in body_wrong["progress"]:
        raise RuntimeError("Body-senses wrong answers must not increment progress")
    if "唔係呢個喎" not in body_wrong["feedback"]:
        raise RuntimeError("Body-senses wrong answers need the gentle retry hint")
    if body_wrong["why"].strip() or not body_wrong["whyHidden"]:
        raise RuntimeError("Wrong answers must not play the long 點解")
    pg.evaluate("() => window.KakaCommonSense.answerCurrentCorrect()")
    body_why = pg.evaluate(
        """() => {
          const next = document.querySelector('#btn-quiz-next');
          const box = next?.getBoundingClientRect();
          const d = document.documentElement;
          return {
            why: document.querySelector('#quiz-why-text')?.textContent || '',
            nextLabel: next?.textContent || '',
            hidden: document.querySelector('#quiz-why')?.classList.contains('hidden'),
            tap: box ? Math.min(box.width, box.height) : 0,
            overflowX: d.scrollWidth - d.clientWidth,
            overflowY: d.scrollHeight - d.clientHeight,
            progress: document.querySelector('#status-pill')?.textContent || '',
          };
        }"""
    )
    if body_why["hidden"] or len(body_why["why"].strip()) < 4:
        raise RuntimeError("Correct body-senses answers must show the 點解 subtitle")
    if "下一題" not in body_why["nextLabel"]:
        raise RuntimeError("Why panel must offer 下一題 to skip")
    if body_why["tap"] < 44:
        raise RuntimeError(f"下一題 must be at least 44px, got {body_why['tap']}")
    if "已答啱 1／8" not in body_why["progress"]:
        raise RuntimeError(f"Correct why step should already count, got {body_why['progress']!r}")
    if body_why["overflowX"] > 2:
        raise RuntimeError(f"Body-senses why panel overflows horizontally by {body_why['overflowX']}px")
    if pg.viewport_size["width"] > 700 and body_why["overflowY"] > 2:
        raise RuntimeError(f"Body-senses iPad why panel must not page-scroll, overflowY={body_why['overflowY']}")
    pg.click("#btn-quiz-next")
    pg.wait_for_function("() => (document.querySelector('#status-pill')?.textContent || '').includes('已答啱 1／8') && document.querySelector('#quiz-why')?.classList.contains('hidden')")
    probe("常識・身體同五感點解")
    pg.click("#back-link")
    pg.wait_for_selector("#view-learn:not(.hidden) #btn-start-quiz")
    pg.click("#back-link")
    pg.wait_for_selector("#view-packs:not(.hidden) #btn-pack-heroes")
    pg.click("#btn-pack-transport")
    pg.wait_for_selector("#view-learn:not(.hidden) #cs-mtr-map")
    map_text = pg.text_content("#cs-mtr-map") or ""
    for pin in ("荃灣西", "馬鞍山", "沙田", "深水埗", "迪士尼", "尖沙咀", "旺角"):
        if pin not in map_text:
            raise RuntimeError(f"Transport learn wall map must pin {pin}")
    if pg.viewport_size["width"] > 1000:
        hidden_pins = pg.evaluate(
            """() => {
              const vh = window.innerHeight;
              return [...document.querySelectorAll('#cs-mtr-map li')]
                .filter((li) => {
                  const r = li.getBoundingClientRect();
                  return r.bottom > vh + 2 || r.top < -2;
                })
                .map((li) => (li.textContent || '').trim());
            }"""
        )
        if hidden_pins:
            raise RuntimeError(f"iPad landscape map pins must stay on-screen, clipped {hidden_pins}")
    pg.click("#back-link")
    pg.wait_for_selector("#view-packs:not(.hidden) #btn-pack-food")
    pg.click("#btn-pack-food")
    pg.wait_for_selector("#view-learn:not(.hidden) #cs-food-comics")
    food_text = pg.text_content("#cs-food-comics") or ""
    if "牛奶" not in food_text or "麵包" not in food_text:
        raise RuntimeError("Food learn wall must show milk and bread comic strips")
    strips = pg.evaluate("() => [...document.querySelectorAll('#cs-food-comics .comic-strip')].map((el) => el.querySelector('h3')?.textContent || '')")
    if len(strips) != 2:
        raise RuntimeError(f"Food comics must have milk and bread stories, got {strips}")
    panels = pg.evaluate("() => [...document.querySelectorAll('#cs-food-comics .comic-strip')].map((el) => el.querySelectorAll('li').length)")
    if any(n < 4 or n > 6 for n in panels):
        raise RuntimeError(f"Food comics must have 4–6 panels each, got {panels}")
    pg.click("#back-link")
    pg.wait_for_selector("#view-packs:not(.hidden) #btn-pack-comics")
    with pg.expect_navigation():
        pg.click("#btn-pack-comics")
    pg.wait_for_selector("#wall:not(.hidden) [data-start='rain-no-umbrella']")
    for start_id in ("rain-no-umbrella", "mtr-need-seat", "park-ball-lost"):
        if not pg.query_selector(f"[data-start='{start_id}']"):
            raise RuntimeError(f"Interview comics wall missing {start_id}")
    wall_bg = pg.evaluate(
        """() => {
          const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
          const bodyBg = getComputedStyle(document.body).backgroundColor;
          document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
          const bottom = document.elementFromPoint(24, window.innerHeight - 24);
          const bottomBg = bottom ? getComputedStyle(bottom).backgroundColor : '';
          document.scrollingElement.scrollTop = 0;
          return { htmlBg, bodyBg, bottomBg };
        }"""
    )
    for key, value in wall_bg.items():
        if "9, 15, 48" in value or "16, 26, 67" in value:
            raise RuntimeError(f"Interview wall must use the light hub background, {key}={value}")
    pg.click("[data-start='rain-no-umbrella']")
    pg.wait_for_selector("#play:not(.hidden) .comic-hit")
    preview = pg.evaluate(
        """() => {
          const hit = document.querySelector('#comic-board .comic-hit');
          hit.click();
          return {
            preview: document.querySelectorAll('#comic-board .comic-panel.is-preview').length,
            status: document.querySelector('#status-note')?.textContent || '',
          };
        }"""
    )
    if preview["preview"] < 1:
        raise RuntimeError("Interview comics panels must react before recording")
    interview_fits = pg.evaluate(
        """() => [...document.querySelectorAll('#comic-board .cs-media img, #comic-board .comic-panel img')]
          .map((img) => getComputedStyle(img).objectFit)"""
    )
    if not interview_fits or any(fit != "contain" for fit in interview_fits):
        raise RuntimeError(f"Interview comic panels must use object-fit:contain, got {interview_fits}")

    def prompt_clipped():
        box = pg.evaluate(
            """() => {
              const el = document.querySelector('#btn-prompt');
              if (!el) return { missing: true };
              const r = el.getBoundingClientRect();
              return {
                missing: false,
                left: r.left,
                right: r.right,
                top: r.top,
                bottom: r.bottom,
                width: r.width,
                height: r.height,
                vw: window.innerWidth,
                vh: window.innerHeight,
                text: (el.textContent || '').trim(),
              };
            }"""
        )
        if box.get("missing"):
            return "missing 🔊 提示"
        if "提示" not in box["text"]:
            return f"prompt label {box['text']!r}"
        if box["width"] < 44 or box["height"] < 44:
            return f"prompt too small {box['width']}x{box['height']}"
        if box["left"] < 2 or box["right"] > box["vw"] - 2 or box["top"] < 2 or box["bottom"] > box["vh"] + 2:
            return f"prompt clipped {box}"
        return ""

    clipped = prompt_clipped()
    if clipped:
        raise RuntimeError(f"Interview play 提示 must stay fully tappable, {clipped}")
    original = pg.viewport_size
    pg.set_viewport_size({"width": 1280, "height": original["height"]})
    pg.wait_for_timeout(120)
    clipped_1280 = prompt_clipped()
    pg.set_viewport_size(original)
    if clipped_1280:
        raise RuntimeError(f"Interview play 提示 must stay fully tappable at 1280, {clipped_1280}")
    pg.click("#back-link")
    pg.wait_for_selector("#wall:not(.hidden) [data-start='rain-no-umbrella']")
    with pg.expect_navigation():
        pg.click("#back-link")
    pg.wait_for_selector("#view-packs:not(.hidden) #btn-pack-heroes")
    with pg.expect_navigation():
        pg.click("#back-link")
    pg.wait_for_selector("#screen-home.active #btn-start-common-sense")
    if pg.is_visible("#screen-profiles") and "active" in (pg.get_attribute("#screen-profiles", "class") or ""):
        raise RuntimeError("Common-sense hub ← 主頁 must not dump on the profile picker")

    return seen


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://localhost:5173")
    ap.add_argument("--out", default=".smoke")
    ap.add_argument("--no-shots", action="store_true", help="唔影圖，淨係做檢查")
    ap.add_argument(
        "--all",
        action="store_true",
        help="連 12.9\"／10.9\"／細機一齊跑（預設只跑家庭裝置：iPad Pro 11 + iPhone 16 Pro Max）",
    )
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

    ipads = {**FAMILY_IPADS, **EXTRA_IPADS} if args.all else dict(FAMILY_IPADS)
    phones = {**FAMILY_PHONES, **EXTRA_PHONES} if args.all else dict(FAMILY_PHONES)
    # 手機：一屏入唔晒係容許嘅（會準捲），但一定唔可以重疊或者剪走內容。

    problems = 0
    errors: list[str] = []
    failed: list[str] = []
    not_found: list[str] = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        targets = [(n, wh, False) for n, wh in ipads.items()] + [(n, wh, True) for n, wh in phones.items()]
        mode = "全尺寸" if args.all else "家庭裝置（iPad Pro 11 + iPhone 16 Pro Max）"
        print(f"smoke-shots：{mode}（{len(targets)} 個 viewport）")
        for name, (w, h), phone in targets:
            page = browser.new_page(viewport={"width": w, "height": h}, is_mobile=True, has_touch=True)
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("requestfailed", lambda r: failed.append(r.url))
            page.on("response", lambda r: not_found.append(r.url) if r.status == 404 else None)
            try:
                rows = walk(page, args.url, shots, name)
            except Exception as e:  # noqa: BLE001
                print(f"  ✗ {name}: 行唔完流程（{type(e).__name__}: {e}）")
                problems += 1
                page.close()
                continue

            bad = []
            for step, sid, over, text, overlaps, clipped, ranger_hits, ranger_face_ok, portrait in rows:
                if text < 5:
                    bad.append(f"{step}（{sid}）似乎白屏")
                if not phone and not portrait and over > 2 and sid not in SCROLLABLE:
                    bad.append(f"{step}（{sid}）要捲 {over}px")
                if clipped and not portrait:
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
        if "404" in e and not any(not url.endswith("/version.json") for url in not_found):
            # 原始碼 preview 用 http.server，冇 build-site.sh 產生嘅可選版本戳；
            # 其他 404（圖片、程式或字體）仍然照常視為錯誤。
            continue
        print(f"  ✗ console error：{e[:120]}")
        problems += 1

    if problems:
        print(f"\n結論：有 {problems} 個問題。遊戲畫面要捲 = blocker（KAKA 拖字會捲親）。")
        return 1
    print(f"\n結論：{len(ipads)} 種 iPad 尺寸一屏入晒、{len(phones)} 種手機尺寸冇重疊冇剪走，"
          "冇 404、冇 console error。")
    if shots:
        print(f"截圖喺 {shots}/，交檢查 agent 睇視覺同幼齡適切度。")
    # Reuse Python Playwright's bundled Node package/browser revision. No extra
    # npm install, workflow permission or production dependency is required.
    import playwright
    driver = Path(playwright.__file__).parent / "driver"
    env = dict(os.environ, PTH_PLAYWRIGHT=str(driver / "package"),
               PTH_TEST_URL=args.url.rstrip("/") + "/pth-demo.html")
    print("PTH：七组測驗、固定詞音、Profile、錯誤重試及家庭 viewport 回歸", flush=True)
    result = subprocess.run([str(driver / "node"), str(Path(__file__).with_name("test-pth-browser.cjs"))], env=env)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Focused Listen & Find iPad layout + hit-region alignment checks. Mute speech."""
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[1]
URL = os.environ.get("KAKA_TEST_URL", "http://127.0.0.1:5173")
SHOT_DIR = Path(os.environ.get("KAKA_TEST_SHOT_DIR", "/opt/cursor/artifacts"))

VIEWPORTS = [
    ("iPadPro11-landscape", 1210, 834, "landscape"),
    ("iPad-1180-landscape", 1180, 820, "landscape"),
    ("iPad-1080-landscape", 1080, 810, "landscape"),
    ("iPad-1024-landscape", 1024, 768, "landscape"),
    ("iPadPro11-portrait", 834, 1210, "portrait"),
    ("iPhone16ProMax-portrait", 430, 932, "portrait"),
]

EXPECTED_CENTERS = {
    "apple": (19, 22),
    "banana": (38, 22),
    "orange": (25, 70),
    "grapes": (19, 46),
    "pear": (38, 45),
    "strawberry": (51, 71),
    "pineapple": (61, 30),
    "watermelon": (81, 58),
}


def mute_speech(page):
    page.evaluate(
        """() => {
          const speech = window.KakaSpeech || {};
          speech.speakEnglishTerm = (text, opts = {}) => { opts.onEnd?.(); };
          speech.cancelAllSpeech = () => {};
          speech.warmAudio = () => {};
          speech.warmEnglishVoice = () => {};
          window.KakaSpeech = speech;
        }"""
    )


def open_ready(page):
    page.goto(f"{URL}/index.html", wait_until="domcontentloaded")
    mute_speech(page)
    page.click("#btn-profile-kaka")
    page.click("#btn-start-english")
    page.wait_for_selector("#screen-english-hub.active")
    page.click("#btn-english-listen-find")
    page.wait_for_selector("#screen-listen-find.active")
    mute_speech(page)
    page.wait_for_function(
        "() => { const img = document.querySelector('.listen-find-scene'); return img && img.complete && img.naturalWidth > 0; }"
    )


def assert_start_card_tappable(name, page):
    data = page.evaluate(
        """() => {
          const btn = document.querySelector('#btn-listen-find-start');
          const overlay = document.querySelector('#listen-find-overlay');
          const stage = document.querySelector('.listen-find-stage');
          const btnRect = btn.getBoundingClientRect();
          const overlayRect = overlay.getBoundingClientRect();
          const insideStage = !!overlay.closest('.listen-find-stage');
          const screen = document.querySelector('#screen-listen-find');
          const pad = getComputedStyle(screen);
          return {
            insideStage,
            overlayHidden: overlay.hidden,
            btn: { top: btnRect.top, bottom: btnRect.bottom, left: btnRect.left, right: btnRect.right, height: btnRect.height, width: btnRect.width },
            overlay: { top: overlayRect.top, bottom: overlayRect.bottom, height: overlayRect.height },
            viewport: { width: window.innerWidth, height: window.innerHeight },
            padding: { top: pad.paddingTop, right: pad.paddingRight, bottom: pad.paddingBottom, left: pad.paddingLeft },
          };
        }"""
    )
    errors = []
    if data["insideStage"]:
        errors.append("start overlay is still inside the clipped stage")
    if data["overlayHidden"]:
        errors.append("start overlay hidden before play")
    btn = data["btn"]
    if btn["top"] < -1 or btn["left"] < -1:
        errors.append(f"start button clipped top/left {btn}")
    if btn["bottom"] > data["viewport"]["height"] + 1 or btn["right"] > data["viewport"]["width"] + 1:
        errors.append(f"start button clipped bottom/right {btn} in {data['viewport']}")
    if btn["height"] < 44 or btn["width"] < 120:
        errors.append(f"start button too small {btn}")
    if data["overlay"]["height"] < btn["height"]:
        errors.append("overlay shorter than the start button")
    for side in ("top", "right", "bottom", "left"):
        if not data["padding"][side].endswith("px"):
            errors.append(f"missing padding {side}")
    if errors:
        raise AssertionError(f"{name} ready: " + "; ".join(errors))


def open_play(page):
    open_ready(page)
    page.click("#btn-listen-find-start")
    page.wait_for_selector("#screen-listen-find.is-playing")
    page.wait_for_function(
        """() => {
          const img = document.querySelector('.listen-find-scene');
          const wall = document.querySelector('#listen-find-wall');
          if (!img || !wall || !window.KakaListenFind) return false;
          window.KakaListenFind.layoutScene();
          const painted = window.KakaListenFind.containRect(img);
          const imgRect = img.getBoundingClientRect();
          const wallRect = wall.getBoundingClientRect();
          return wallRect.width > 80
            && Math.abs(wallRect.left - (imgRect.left + painted.left)) < 2.5
            && Math.abs(wallRect.top - (imgRect.top + painted.top)) < 2.5;
        }"""
    )


def measure(page):
    return page.evaluate(
        """() => {
          const screen = document.querySelector('#screen-listen-find');
          const intro = document.querySelector('.listen-find-intro');
          const topbar = document.querySelector('.listen-find-topbar');
          const title = document.querySelector('.listen-find-title');
          const progress = document.querySelector('#listen-find-progress');
          const back = document.querySelector('#btn-listen-find-back');
          const poster = document.querySelector('.listen-find-poster');
          const img = document.querySelector('.listen-find-scene');
          const wall = document.querySelector('#listen-find-wall');
          const side = document.querySelector('.listen-find-side');
          const listen = document.querySelector('#btn-listen-find-listen');
          const game = document.querySelector('.listen-find-game');
          const painted = window.KakaListenFind.containRect(img);
          const imgRect = img.getBoundingClientRect();
          const wallRect = wall.getBoundingClientRect();
          const posterRect = poster.getBoundingClientRect();
          const sideRect = side.getBoundingClientRect();
          const listenRect = listen.getBoundingClientRect();
          const fruits = [...document.querySelectorAll('.listen-find-target')].map((el) => {
            const rect = el.getBoundingClientRect();
            return {
              fruit: el.dataset.fruit,
              nx: ((rect.left + rect.width / 2) - wallRect.left) / wallRect.width * 100,
              ny: ((rect.top + rect.height / 2) - wallRect.top) / wallRect.height * 100,
              w: rect.width,
              h: rect.height,
            };
          });
          const style = getComputedStyle(img);
          const gameStyle = getComputedStyle(game);
          return {
            playing: screen.classList.contains('is-playing'),
            introHidden: getComputedStyle(intro).display === 'none',
            topbar: {
              back: !!back && getComputedStyle(back).display !== 'none',
              title: (title?.textContent || '').trim(),
              progress: (progress?.textContent || '').trim(),
            },
            overflowX: screen.scrollWidth - screen.clientWidth,
            overflowY: screen.scrollHeight - screen.clientHeight,
            objectFit: style.objectFit,
            columns: gameStyle.gridTemplateColumns,
            rows: gameStyle.gridTemplateRows,
            poster: { width: posterRect.width, height: posterRect.height, top: posterRect.top, left: posterRect.left },
            img: { width: imgRect.width, height: imgRect.height, left: imgRect.left, top: imgRect.top },
            painted,
            wall: { width: wallRect.width, height: wallRect.height, left: wallRect.left, top: wallRect.top },
            side: { width: sideRect.width, height: sideRect.height, top: sideRect.top, left: sideRect.left },
            listen: { width: listenRect.width, height: listenRect.height },
            fruits,
            viewport: { width: window.innerWidth, height: window.innerHeight },
          };
        }"""
    )


def assert_layout(name, mode, data):
    errors = []
    if not data["playing"]:
        errors.append("missing is-playing")
    if not data["introHidden"]:
        errors.append("intro still visible during play")
    if data["topbar"]["title"] != "Listen & Find":
        errors.append(f"title {data['topbar']['title']!r}")
    if "8" not in data["topbar"]["progress"]:
        errors.append(f"progress {data['topbar']['progress']!r}")
    if not data["topbar"]["back"]:
        errors.append("back button missing")
    if data["objectFit"] != "contain":
        errors.append(f"object-fit {data['objectFit']}")
    if data["overflowX"] > 2:
        errors.append(f"horizontal overflow {data['overflowX']}")
    if data["viewport"]["width"] >= 700 and data["overflowY"] > 4:
        errors.append(f"iPad vertical overflow {data['overflowY']}")
    if data["listen"]["height"] < 52 or data["listen"]["width"] < 120:
        errors.append(f"listen button too small {data['listen']}")

    wall = data["wall"]
    img = data["img"]
    painted = data["painted"]
    if wall["width"] < 280 or wall["height"] < 150:
        errors.append(f"scene too small {wall}")
    if abs(wall["width"] - painted["width"]) > 2 or abs(wall["height"] - painted["height"]) > 2:
        errors.append(f"wall size != painted image {wall} vs {painted}")
    expected_left = img["left"] + painted["left"]
    expected_top = img["top"] + painted["top"]
    if abs(wall["left"] - expected_left) > 2 or abs(wall["top"] - expected_top) > 2:
        errors.append(f"wall origin {wall['left']},{wall['top']} vs painted {expected_left},{expected_top}")

    aspect = wall["width"] / wall["height"] if wall["height"] else 0
    if abs(aspect - (1672 / 941)) > 0.04:
        errors.append(f"wall aspect {aspect:.3f} cropped?")

    bottom_bar = data["side"]["top"] >= data["poster"]["top"] + data["poster"]["height"] - 16
    short_landscape = data["viewport"]["height"] <= 620
    if mode == "landscape" and not short_landscape:
        if bottom_bar:
            errors.append("landscape used a bottom bar instead of a slim side panel")
        if not (175 <= data["side"]["width"] <= 220):
            errors.append(f"landscape side width {data['side']['width']}")
        if data["side"]["left"] < data["poster"]["left"] + data["poster"]["width"] - 8:
            errors.append("landscape side is not to the right of the scene")
        if wall["width"] < data["viewport"]["width"] * 0.55:
            errors.append(f"landscape scene not large enough {wall['width']} in {data['viewport']['width']}")
    else:
        if not bottom_bar:
            errors.append("portrait/short controls are not a bottom bar")
        if data["side"]["height"] > 168:
            errors.append(f"portrait bar too bulky {data['side']['height']}")
        cell = data["poster"]
        fit_w = min(cell["width"], cell["height"] * 1672 / 941)
        if wall["width"] < fit_w * 0.9:
            errors.append(f"scene not using contain-fit space {wall['width']} vs {fit_w:.1f}")

    for fruit, (ex, ey) in EXPECTED_CENTERS.items():
        found = next((item for item in data["fruits"] if item["fruit"] == fruit), None)
        if not found:
            errors.append(f"missing {fruit}")
            continue
        if abs(found["nx"] - ex) > 1.6 or abs(found["ny"] - ey) > 1.6:
            errors.append(f"{fruit} center {found['nx']:.1f},{found['ny']:.1f} expected {ex},{ey}")

    if errors:
        raise AssertionError(f"{name}: " + "; ".join(errors))


def tap_hits_fruit(page, fruit):
    hit = page.evaluate(
        """(fruit) => {
          const el = document.querySelector(`.listen-find-target[data-fruit="${fruit}"]`);
          const rect = el.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const under = document.elementFromPoint(x, y);
          return !!(under && (under.dataset.fruit === fruit || under.closest?.(`[data-fruit="${fruit}"]`)));
        }""",
        fruit,
    )
    if not hit:
        raise AssertionError(f"{fruit} center is not under the hit region")


def main():
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    ready_viewports = [
        ("iPhone16ProMax-landscape-ready", 932, 430),
        ("iPadPro11-landscape-ready", 1210, 834),
        ("iPadPro11-portrait-ready", 834, 1210),
    ]
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--mute-audio"])
        for name, width, height in ready_viewports:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                has_touch=True,
                device_scale_factor=2,
            )
            page = context.new_page()
            open_ready(page)
            assert_start_card_tappable(name, page)
            if name == "iPhone16ProMax-landscape-ready":
                page.screenshot(path=str(SHOT_DIR / "listen_find_iphone_landscape_ready.png"), full_page=False)
            context.close()
        for name, width, height, mode in VIEWPORTS:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                has_touch=True,
                device_scale_factor=2,
            )
            page = context.new_page()
            open_play(page)
            data = measure(page)
            assert_layout(name, mode, data)
            tap_hits_fruit(page, "apple")
            tap_hits_fruit(page, "pineapple")
            tap_hits_fruit(page, "watermelon")
            if name in ("iPadPro11-landscape", "iPadPro11-portrait"):
                page.screenshot(path=str(SHOT_DIR / f"listen-find-{name}.png"), full_page=False)
            page.set_viewport_size({"width": height, "height": width})
            page.wait_for_function(
                """() => {
                  window.KakaListenFind.layoutScene();
                  const img = document.querySelector('.listen-find-scene');
                  const wall = document.querySelector('#listen-find-wall');
                  const painted = window.KakaListenFind.containRect(img);
                  const imgRect = img.getBoundingClientRect();
                  const wallRect = wall.getBoundingClientRect();
                  return wallRect.width > 80
                    && Math.abs(wallRect.left - (imgRect.left + painted.left)) < 2.5
                    && Math.abs(wallRect.top - (imgRect.top + painted.top)) < 2.5;
                }"""
            )
            rotated = "portrait" if mode == "landscape" else "landscape"
            rotated_data = measure(page)
            assert_layout(f"{name}-rotated", rotated, rotated_data)
            tap_hits_fruit(page, "banana")
            context.close()
        browser.close()
    print(f"listen-find layout: {len(VIEWPORTS)} viewports passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

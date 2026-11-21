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
    "fruit-shop": {
        "apple": (19, 22),
        "banana": (38, 22),
        "orange": (25, 70),
        "grapes": (19, 46),
        "pear": (38, 45),
        "strawberry": (51, 71),
        "pineapple": (61, 30),
        "watermelon": (81, 58),
    },
    "farm": {
        "cow": (54, 36),
        "pig": (38, 77),
        "horse": (73, 32),
        "chicken": (52, 71),
        "duck": (68, 71),
        "sheep": (35, 51),
        "goat": (89, 50),
        "rabbit": (83, 81),
    },
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


def open_picker(page):
    page.goto(f"{URL}/index.html", wait_until="domcontentloaded")
    mute_speech(page)
    page.click("#btn-profile-kaka")
    page.click("#btn-start-english")
    page.wait_for_selector("#screen-english-hub.active")
    page.click("#btn-english-listen-find")
    page.wait_for_selector("#screen-listen-find.active")
    page.wait_for_selector("#screen-listen-find.is-picking")
    mute_speech(page)
    page.wait_for_function(
        """() => {
          const imgs = [...document.querySelectorAll('.listen-find-chapter img')];
          return imgs.length === 2 && imgs.every((img) => img.complete && img.naturalWidth > 0);
        }"""
    )
    page.wait_for_timeout(450)


def wait_scene_ready(page):
    page.wait_for_function(
        """() => {
          const img = document.querySelector('.listen-find-scene');
          const wall = document.querySelector('#listen-find-wall');
          if (!img || !wall || !window.KakaListenFind) return false;
          if (!img.complete || img.naturalWidth <= 0) return false;
          window.KakaListenFind.layoutScene();
          const painted = window.KakaListenFind.containRect(img);
          const imgRect = img.getBoundingClientRect();
          const wallRect = wall.getBoundingClientRect();
          return wallRect.width > 80
            && Math.abs(wallRect.left - (imgRect.left + painted.left)) < 2.5
            && Math.abs(wallRect.top - (imgRect.top + painted.top)) < 2.5;
        }"""
    )


def pick_and_start(page, chapter):
    mute_speech(page)
    page.click(f'[data-listen-find-chapter="{chapter}"]')
    page.wait_for_function("() => !document.querySelector('#screen-listen-find').classList.contains('is-picking')")
    page.wait_for_selector("#btn-listen-find-start")
    wait_scene_ready(page)
    page.click("#btn-listen-find-start")
    page.wait_for_selector("#screen-listen-find.is-playing")
    wait_scene_ready(page)


def open_play(page, chapter="fruit-shop"):
    open_picker(page)
    pick_and_start(page, chapter)


def measure(page):
    return page.evaluate(
        """() => {
          const screen = document.querySelector('#screen-listen-find');
          const intro = document.querySelector('.listen-find-intro');
          const picker = document.querySelector('#listen-find-picker');
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
              fruit: el.dataset.target,
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
            picking: screen.classList.contains('is-picking'),
            introHidden: getComputedStyle(intro).display === 'none',
            pickerHidden: getComputedStyle(picker).display === 'none',
            sceneSrc: img.getAttribute('src') || '',
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


def assert_layout(name, mode, data, chapter="fruit-shop"):
    errors = []
    expected = EXPECTED_CENTERS[chapter]
    if not data["playing"]:
        errors.append("missing is-playing")
    if data["picking"]:
        errors.append("picker still open during play")
    if not data["introHidden"]:
        errors.append("intro still visible during play")
    if not data["pickerHidden"]:
        errors.append("picker still visible during play")
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
    if chapter == "fruit-shop" and "fruit-shop-scene.webp" not in data["sceneSrc"]:
        errors.append(f"fruit shop art missing {data['sceneSrc']}")
    if chapter == "farm" and "farm-scene.webp" not in data["sceneSrc"]:
        errors.append(f"farm art missing {data['sceneSrc']}")

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

    for fruit, (ex, ey) in expected.items():
        found = next((item for item in data["fruits"] if item["fruit"] == fruit), None)
        if not found:
            errors.append(f"missing {fruit}")
            continue
        if abs(found["nx"] - ex) > 1.6 or abs(found["ny"] - ey) > 1.6:
            errors.append(f"{fruit} center {found['nx']:.1f},{found['ny']:.1f} expected {ex},{ey}")

    if errors:
        raise AssertionError(f"{name}: " + "; ".join(errors))


def tap_hits_target(page, word):
    hit = page.evaluate(
        """(word) => {
          const el = document.querySelector(`.listen-find-target[data-target="${word}"]`);
          const rect = el.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const under = document.elementFromPoint(x, y);
          return !!(under && (under.dataset.target === word || under.closest?.(`[data-target="${word}"]`)));
        }""",
        word,
    )
    if not hit:
        raise AssertionError(f"{word} center is not under the hit region")


def play_full_round(page, chapter):
    found = set()
    for step in range(8):
        word = page.evaluate("() => window.KakaListenFind.getCurrentWord()")
        if word not in EXPECTED_CENTERS[chapter]:
            raise AssertionError(f"unexpected farm word {word!r}")
        if word in found:
            raise AssertionError(f"repeated word {word!r}")
        found.add(word)
        page.locator(f'.listen-find-target[data-target="{word}"]').click(force=True)
        page.wait_for_function(
            "(count) => document.querySelector('#listen-find-progress').textContent.startsWith(count + ' /')",
            arg=step + 1,
        )
        if step < 7:
            page.wait_for_function("() => window.KakaListenFind.isActive() && window.KakaListenFind.getCurrentWord()")
    if found != set(EXPECTED_CENTERS[chapter]):
        raise AssertionError(f"farm round words {found}")
    page.wait_for_selector("#btn-listen-find-again")


def main():
    SHOT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--mute-audio"])
        for name, width, height, mode in VIEWPORTS:
            context = browser.new_context(
                viewport={"width": width, "height": height},
                has_touch=True,
                device_scale_factor=2,
            )
            page = context.new_page()
            open_play(page, "fruit-shop")
            data = measure(page)
            assert_layout(name, mode, data, "fruit-shop")
            tap_hits_target(page, "apple")
            tap_hits_target(page, "pineapple")
            tap_hits_target(page, "watermelon")
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
            assert_layout(f"{name}-rotated", rotated, rotated_data, "fruit-shop")
            tap_hits_target(page, "banana")
            context.close()

        for name, width, height, mode in (
            ("iPadPro11-landscape", 1210, 834, "landscape"),
            ("iPadPro11-portrait", 834, 1210, "portrait"),
        ):
            context = browser.new_context(
                viewport={"width": width, "height": height},
                has_touch=True,
                device_scale_factor=2,
            )
            page = context.new_page()
            open_picker(page)
            if name == "iPadPro11-landscape":
                page.screenshot(path=str(SHOT_DIR / "listen-find-chapter-picker.png"), full_page=False)
            pick_and_start(page, "farm")
            data = measure(page)
            assert_layout(f"farm-{name}", mode, data, "farm")
            tap_hits_target(page, "cow")
            tap_hits_target(page, "rabbit")
            tap_hits_target(page, "chicken")
            page.screenshot(path=str(SHOT_DIR / f"listen-find-farm-{name}.png"), full_page=False)
            if name == "iPadPro11-landscape":
                play_full_round(page, "farm")
            context.close()
        browser.close()
    print(f"listen-find layout: {len(VIEWPORTS)} viewports passed, farm play checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Focused MM073 family-device smoke: shelf, page, answer, and saved star."""

from __future__ import annotations

from pathlib import Path

from playwright.sync_api import sync_playwright

TARGETS = {
    "ipad-pro-11-portrait": (834, 1210),
    "ipad-pro-11-landscape": (1210, 834),
    "iphone-16-pro-max": (430, 932),
}
URL = "http://127.0.0.1:5173"
OUT = Path("/private/tmp/magic-marker-mm073-qa")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for name, (width, height) in TARGETS.items():
            page = browser.new_page(
                viewport={"width": width, "height": height},
                is_mobile=True,
                has_touch=True,
                reduced_motion="reduce",
            )
            failures: list[str] = []
            page.on("pageerror", lambda error: failures.append(str(error)))
            page.on("response", lambda response: failures.append(response.url)
                    if response.status == 404 and not response.url.endswith("/version.json") else None)
            page.add_init_script("HTMLMediaElement.prototype.play = function () { return Promise.resolve(); }")
            page.goto(URL, wait_until="domcontentloaded")
            page.locator("#btn-profile-kaka").evaluate("(button) => button.click()")
            page.wait_for_selector("#screen-home.active")
            page.locator("#btn-start-english").evaluate("(button) => button.click()")
            page.locator("#btn-english-story").evaluate("(button) => button.click()")
            page.wait_for_selector("#screen-story-series.active")
            page.locator("[data-series-id='magic-marker']").evaluate("(button) => button.click()")
            page.wait_for_selector("#screen-story-demo.active [data-book-id='mm073']")
            assert page.locator("#screen-story-demo.active [data-book-id^='mm']").count() == 73
            page.locator("[data-book-id='mm073']").evaluate("(button) => button.click()")
            page.wait_for_selector("#screen-story-play.active .story-challenge-page")
            page.wait_for_function("document.querySelector('.story-challenge-page')?.complete")
            page.wait_for_timeout(400)
            page.screenshot(path=str(OUT / f"{name}-page.png"))
            before = page.evaluate("window.KakaStorage.loadState().totalStars")
            page.evaluate("document.querySelector('audio[data-story-demo]').dispatchEvent(new Event('ended'))")
            page.wait_for_function("!document.querySelector('.story-fill-tile')?.disabled")
            answer = page.locator(".story-fill-blank").get_attribute("data-blank")
            page.locator(".story-fill-tile").evaluate_all(
                "(tiles, word) => tiles.find(tile => tile.dataset.word === word).click()",
                answer,
            )
            page.locator("#btn-story-submit").evaluate("(button) => button.click()")
            page.wait_for_selector("#btn-story-next", timeout=20000)
            page.wait_for_timeout(400)
            page.screenshot(path=str(OUT / f"{name}-star.png"))
            after = page.evaluate("window.KakaStorage.loadState()")
            assert after["totalStars"] == before + 1, (name, before, after["totalStars"])
            assert after["passedKeys"].get("story|mm073|page-2"), name
            if name == "ipad-pro-11-landscape":
                page.locator("#btn-back-story-play").evaluate("(button) => button.click()")
                page.wait_for_selector("#screen-story-demo.active [data-book-id='mm073']")
                page.locator("[data-book-id='mm073']").evaluate("(button) => button.click()")
                page.wait_for_selector("#screen-story-play.active .story-challenge-page")
                page.wait_for_function("document.querySelector('.story-challenge-page')?.complete")
                page.evaluate("document.querySelector('audio[data-story-demo]').dispatchEvent(new Event('ended'))")
                page.wait_for_function("!document.querySelector('.story-fill-tile')?.disabled")
                page.locator(".story-fill-tile").evaluate_all(
                    "(tiles, word) => tiles.find(tile => tile.dataset.word === word).click()",
                    answer,
                )
                page.locator("#btn-story-submit").evaluate("(button) => button.click()")
                page.wait_for_selector("#btn-story-next")
                assert page.evaluate("window.KakaStorage.loadState().totalStars") == after["totalStars"], name
            layout = page.evaluate("""() => {
                const screen = document.querySelector('#screen-story-play');
                const book = document.querySelector('.story-challenge-page');
                const box = book.getBoundingClientRect();
                return {
                    clipped: screen.scrollHeight > screen.clientHeight + 2,
                    horizontal: document.documentElement.scrollWidth > innerWidth + 2,
                    bookVisible: box.width > 100 && box.height > 100,
                };
            }""")
            assert not layout["horizontal"] and layout["bookVisible"], (name, layout)
            if width > height:
                assert not layout["clipped"], (name, layout)
            assert not failures, (name, failures)
            print(f"{name}: MM073 page, answer, star, layout, and assets passed", flush=True)
            page.close()
        browser.close()


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""檢查角色情緒／動作／運動詞卡在家庭目標 viewport 的載入與版面。"""

from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:8033/index.html"
TOPICS = [("emotions", "情緒"), ("actions", "常見動作"), ("sports", "運動")]
VIEWPORTS = [("iPad 橫", 1210, 834), ("iPad 直", 834, 1210), ("iPhone", 430, 932)]


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for label, width, height in VIEWPORTS:
            page = browser.new_page(viewport={"width": width, "height": height}, is_mobile=True, has_touch=True)
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(URL, wait_until="domcontentloaded")
            page.click("#btn-profile-kaka")
            page.click("#btn-start-topics")
            for topic_id, title in TOPICS:
                page.locator("#screen-topics button").filter(has_text=title).first.click()
                expected = page.evaluate(
                    "id => window.KakaWords.getTopicById(id).wordIds.length", topic_id
                )
                for index in range(expected):
                    page.wait_for_function(
                        """() => {
                          const img = document.querySelector('#learn-illust .character-word-illustration');
                          return img && img.complete && img.naturalWidth > 0;
                        }"""
                    )
                    overflow = page.evaluate(
                        """() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)
                                  - document.documentElement.clientWidth"""
                    )
                    if overflow > 2:
                        raise AssertionError(f"{label} / {title} / 第 {index + 1} 張橫向溢出 {overflow}px")
                    if index + 1 < expected:
                        page.click("#btn-learn-next")
                page.click("#btn-back-learn")
            if errors:
                raise AssertionError(f"{label} JavaScript errors: {errors}")
            print(f"✓ {label}：情緒 6、動作 23、運動 10 張插圖載入；無橫向溢出／頁面錯誤")
            page.close()
        browser.close()


if __name__ == "__main__":
    main()

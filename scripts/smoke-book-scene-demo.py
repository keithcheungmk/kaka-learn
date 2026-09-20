#!/usr/bin/env python3
"""Touch-browser smoke test for the red-series sentence demo."""
from __future__ import annotations

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright


VIEWPORTS = {
    "ipad-landscape": (1210, 834),
    "ipad-portrait": (834, 1210),
    "iphone": (430, 932),
}


def verify_layout(page, name: str, require_no_vertical_scroll: bool) -> None:
    metrics = page.evaluate("""() => {
      const doc = document.documentElement;
      const body = document.body;
      const board = document.querySelector('.scene-board').getBoundingClientRect();
      const panel = document.querySelector('.scene-task-panel').getBoundingClientRect();
      const boxes = Object.fromEntries(['.scene-topbar','.book-tabs','.scene-game','.scene-meta','.scene-game h2','.scene-help','.scene-board','.scene-task-panel','#word-bank','#scene-submit'].map((selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return [selector, { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) }];
      }));
      return {
        width: window.innerWidth,
        docWidth: doc.scrollWidth,
        bodyWidth: body.scrollWidth,
        docHeight: doc.scrollHeight,
        bodyHeight: body.scrollHeight,
        viewportHeight: window.innerHeight,
        overlap: Math.min(board.right, panel.right) - Math.max(board.left, panel.left) > 2
          && Math.min(board.bottom, panel.bottom) - Math.max(board.top, panel.top) > 2,
        boxes,
      };
    }""")
    assert metrics["docWidth"] <= metrics["width"] + 2, f"{name}: html 橫向溢出 {metrics}"
    assert metrics["bodyWidth"] <= metrics["width"] + 2, f"{name}: body 橫向溢出 {metrics}"
    assert not metrics["overlap"], f"{name}: 書頁與操作區重疊 {metrics}"
    if require_no_vertical_scroll:
        assert metrics["docHeight"] <= metrics["viewportHeight"] + 2, f"{name}: iPad 畫面需要上下捲 {metrics}"


def run(url: str, out: Path | None) -> None:
    failures: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for name, (width, height) in VIEWPORTS.items():
            context = browser.new_context(viewport={"width": width, "height": height}, is_mobile=True, has_touch=True)
            page = context.new_page()
            console_errors: list[str] = []
            failed_requests: list[str] = []
            page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
            page.on("requestfailed", lambda request: failed_requests.append(request.url))
            page.goto(url, wait_until="domcontentloaded")
            page.wait_for_function("document.querySelector('#scene-book-title').textContent === '分果果'")
            page.wait_for_selector('#scene-listen:not([hidden])')
            page.evaluate("window.KakaStorage.setActiveProfile('kaka')")
            page.evaluate("""() => {
              window.__starFlights = 0;
              window.__starObserver = new MutationObserver((records) => {
                for (const record of records) {
                  for (const node of record.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('.fly-star')) window.__starFlights += 1;
                  }
                }
              });
              window.__starObserver.observe(document.body, { childList: true });
              window.KakaSpeech = {
                warmVoices() {},
                speakTerm(text, options = {}) { window.__lastSentence = text; options.onEnd?.(); },
                speakWordThenEncourage(text, options = {}) { window.__lastSentence = text; window.__answerEnd = options.onEnd; },
              };
            }""")

            verify_layout(page, name, require_no_vertical_scroll=name.startswith("ipad"))
            assert page.locator('#scene-preview-nav').is_hidden(), f"{name}: 正式題不應顯示預覽翻頁"
            assert page.locator('#scene-preview-note').is_hidden(), f"{name}: 正式題不應顯示待核提示"
            assert page.locator('#scene-board img').evaluate('(image) => image.complete && image.naturalWidth > 0'), f"{name}: 頁圖未載入"
            assert page.locator('#scene-study-sentence').inner_text() == '爸爸一個橙。媽媽一個蘋果。', f"{name}: 學習階段未顯示整版原句"

            page.locator('#scene-listen').click()
            assert page.evaluate('window.__lastSentence') == '爸爸一個橙。媽媽一個蘋果。', f"{name}: 播放句子同題目不一致"
            page.locator('#scene-start-quiz').click()
            verify_layout(page, f"{name}-quiz", require_no_vertical_scroll=name.startswith("ipad"))
            assert page.locator('.answer-slot').count() == 4, f"{name}: 整個跨頁應有四個詞組槽"
            assert page.locator('.word-card').count() == 8, f"{name}: 正確詞組／干擾項數目錯"

            # 誤選干擾詞不佔槽；錯序可判錯、清格後用拖＋點完成。
            page.locator('.word-card.is-distractor').first.click()
            assert page.locator('.answer-slot.is-filled').count() == 0, f"{name}: 干擾項不應佔槽"
            page.locator('.word-card[data-word="一個橙"]').click()
            page.locator('.word-card[data-word="爸爸"]').click()
            page.locator('.word-card[data-word="媽媽"]').click()
            page.locator('.word-card[data-word="一個蘋果"]').click()
            page.locator('#scene-submit').click()
            assert '次序未啱' in page.locator('#scene-feedback').inner_text(), f"{name}: 錯序未提示"
            assert page.locator('#star-count').inner_text().startswith('0/10'), f"{name}: 錯序不應加星"
            for slot in range(4):
                page.locator(f'.answer-slot[data-slot="{slot}"]').click()
            page.locator('.word-card[data-word="爸爸"]').drag_to(page.locator('.answer-slot[data-slot="0"]'))
            page.locator('.word-card[data-word="一個橙"]').click()
            page.locator('.word-card[data-word="媽媽"]').click()
            page.locator('.word-card[data-word="一個蘋果"]').click()
            page.locator('#scene-submit').click()
            assert page.locator('#scene-progress').inner_text().startswith('第 1 / 3 版'), f"{name}: 正確朗讀完成前不得換版"
            assert page.locator('#scene-listen').is_disabled(), f"{name}: 語音期間仍可重播取消進度"
            assert page.locator('#book-tabs [data-book="rb_yusan"]').is_disabled(), f"{name}: 語音期間仍可切書"
            page.wait_for_function("document.querySelector('#star-count').textContent.startsWith('1/10')")
            assert page.evaluate('window.__starFlights') >= 2, f"{name}: 第一粒星沒有飛出 Ranger"
            assert page.evaluate("typeof window.__answerEnd") == 'undefined', f"{name}: 星星未全數落地不應開始朗讀"
            page.wait_for_function("document.querySelector('#star-count').textContent.startsWith('4/10')")
            assert page.evaluate('window.__starFlights') == 8, f"{name}: 四組詞語應各射出一粒星"
            page.wait_for_function("typeof window.__answerEnd === 'function'")
            assert page.locator('#scene-progress').inner_text().startswith('第 1 / 3 版'), f"{name}: 朗讀完成前不得換版"
            page.evaluate('window.__answerEnd(); window.__answerEnd = null')
            page.wait_for_function("document.querySelector('#scene-progress').textContent.includes('第 2 / 3 版')")

            # 未核實書只供翻閱，不會誤用舊字卡出題。
            page.locator('#book-tabs [data-book="rb_yusan"]').click()
            assert page.locator('#scene-preview-note').is_visible(), f"{name}: 待核書應顯示預覽說明"
            assert page.locator('#star-count').inner_text() == '書頁預覽', f"{name}: 預覽書不應顯示虛假的星星進度"
            assert page.locator('#scene-submit').is_hidden(), f"{name}: 待核書不應有測驗按鈕"
            assert page.locator('#word-bank').is_hidden(), f"{name}: 待核書不應顯示假選項"
            page.locator('#scene-preview-next').click()
            assert page.locator('#scene-progress').inner_text().startswith('原頁 2 /'), f"{name}: 預覽翻頁失效"
            page.locator('#book-tabs [data-book="rb_fenguo"]').click()
            assert page.locator('#scene-progress').inner_text().startswith('第 2 / 3 版'), f"{name}: 切書後頁數進度未保留"
            assert page.locator('#star-count').inner_text().startswith('4/10'), f"{name}: 切書後星星未保留"
            page.reload(wait_until='domcontentloaded')
            page.wait_for_function("document.querySelector('#scene-progress').textContent.includes('第 2 / 3 版')")
            assert page.locator('#star-count').inner_text().startswith('4/10'), f"{name}: 重新載入後進度未保留"

            # 兩個小朋友的同一本書各自保存星星和頁數。
            page.evaluate("window.KakaStorage.setActiveProfile('heihei')")
            page.reload(wait_until='domcontentloaded')
            assert page.locator('#star-count').inner_text().startswith('0/10'), f"{name}: 禧禧不應共用卡卡星星"
            assert page.locator('#scene-progress').inner_text().startswith('第 1 / 3 版'), f"{name}: 禧禧不應共用卡卡頁數"
            page.evaluate("window.KakaStorage.setActiveProfile('kaka')")
            page.reload(wait_until='domcontentloaded')
            assert page.locator('#star-count').inner_text().startswith('4/10'), f"{name}: 切回卡卡後進度不應消失"
            page.evaluate("""() => {
              window.__starFlights = 0;
              window.__starObserver = new MutationObserver((records) => {
                for (const record of records) {
                  for (const node of record.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('.fly-star')) window.__starFlights += 1;
                  }
                }
              });
              window.__starObserver.observe(document.body, { childList: true });
              window.KakaSpeech = {
                warmVoices() {},
                speakTerm(text, options = {}) { window.__lastSentence = text; options.onEnd?.(); },
                speakWordThenEncourage(text, options = {}) { window.__lastSentence = text; window.__answerEnd = options.onEnd; },
              };
            }""")

            # 完成餘下跨頁：4 + 4 + 2 星；正確句子讀完才轉版。
            page.locator('#scene-start-quiz').click()
            page.evaluate('window.__starFlights = 0')
            for word in ['婆婆', '一隻香蕉', '哥哥', '一個梨']:
                page.locator(f'.word-card[data-word="{word}"]').click()
            page.locator('#scene-submit').click()
            page.wait_for_function("typeof window.__answerEnd === 'function'")
            page.evaluate('window.__answerEnd(); window.__answerEnd = null')
            page.wait_for_function("document.querySelector('#star-count').textContent.startsWith('8/10')")
            second_round_flights = page.evaluate('window.__starFlights')
            assert second_round_flights == 8, f"{name}: 第二版四組詞語應各射出一粒星，實際 DOM 飛星數 {second_round_flights}"
            page.wait_for_function("document.querySelector('#scene-progress').textContent.includes('第 3 / 3 版')")
            assert page.locator('#scene-board img').get_attribute('src').endswith('分果果-p6-left.webp'), f"{name}: 未排除p6右頁不完整句"
            page.locator('#scene-start-quiz').click()
            page.evaluate('window.__starFlights = 0')
            for word in ['姐姐', '一個芒果']:
                page.locator(f'.word-card[data-word="{word}"]').click()
            page.locator('#scene-submit').click()
            page.wait_for_function("typeof window.__answerEnd === 'function'")
            page.evaluate('window.__answerEnd(); window.__answerEnd = null')
            page.wait_for_function("document.querySelector('#star-count').textContent.startsWith('10/10')")
            assert page.evaluate('window.__starFlights') == 4, f"{name}: 最後兩組詞語應各射出一粒星"
            assert page.locator('#scene-complete').is_visible(), f"{name}: 三個跨頁完成後未顯示完成頁"
            verify_layout(page, f"{name}-complete", require_no_vertical_scroll=name.startswith("ipad"))
            page.locator('#scene-replay').click()
            assert page.locator('#star-count').inner_text().startswith('0/10'), f"{name}: 再玩一次沒有重設本輪星星"
            assert page.locator('#scene-progress').inner_text().startswith('第 1 / 3 版'), f"{name}: 再玩一次沒有回到第一跨頁"
            page.locator('#scene-start-quiz').click()
            verify_layout(page, f"{name}-quiz-start", require_no_vertical_scroll=name.startswith("ipad"))

            # 《誰在叫》PDF p5：字卡頁 p4 不出題；同一跨頁兩句的重複詞各自可選。
            page.locator('#book-tabs [data-book="rb_shuijiao"]').click()
            assert page.locator('#scene-progress').inner_text().startswith('第 1 / 1 版'), f"{name}: 《誰在叫》應顯示單一已核實跨頁"
            assert page.locator('#scene-study-sentence').inner_text() == '吱，吱，吱，誰在叫？鳥在叫。喵，喵，喵，誰在叫？貓在叫。', f"{name}: 跨頁原句抄錄錯誤"
            assert page.locator('#scene-board img').get_attribute('src').endswith('誰在叫-p5.webp'), f"{name}: 不應把 PDF p4 字卡／封面作遊戲頁"
            page.locator('#scene-start-quiz').click()
            verify_layout(page, f"{name}-shuijiao-quiz", require_no_vertical_scroll=name.startswith("ipad"))
            assert page.locator('.answer-slot').count() == 10, f"{name}: 《誰在叫》完整跨頁應有十個詞組槽"
            assert page.locator('.word-card').count() == 14, f"{name}: 《誰在叫》應有十個答案詞組加四個干擾詞"
            assert page.locator('.word-card[data-word="吱，"]').count() == 3, f"{name}: 鳥的三個重複聲音選項須保留獨立卡片"
            assert page.locator('.word-card[data-word="喵，"]').count() == 3, f"{name}: 貓的三個重複聲音選項須保留獨立卡片"
            if out and name in {"ipad-landscape", "iphone"}:
                out.mkdir(parents=True, exist_ok=True)
                page.evaluate("window.scrollTo(0, 0)")
                page.screenshot(path=str(out / f"{name}.png"), full_page=name == "iphone")
            page.locator('.word-card.is-distractor').first.click()
            assert page.locator('.answer-slot.is-filled').count() == 0, f"{name}: 語音干擾項不應佔答案格"
            page.evaluate('window.__starFlights = 0')
            calling_chunks = ['吱，', '吱，', '吱，', '誰在叫？', '鳥在叫。', '喵，', '喵，', '喵，', '誰在叫？', '貓在叫。']
            for chunk in calling_chunks:
                page.locator(f'.word-card[data-word="{chunk}"]:not(:disabled)').first.click()
            placed_chunks = page.locator('.answer-slot').all_inner_texts()
            assert placed_chunks == calling_chunks, f"{name}: 重複詞組次序未能完整放入 {placed_chunks}"
            assert page.locator('#scene-submit').is_enabled(), f"{name}: 十個詞組都已填入但檢查按鈕仍 disabled；feedback={page.locator('#scene-feedback').inner_text()}"
            page.locator('#scene-submit').click()
            assert '答對了' in page.locator('#scene-feedback').inner_text(), f"{name}: 正確句子未被接受；feedback={page.locator('#scene-feedback').inner_text()}"
            page.wait_for_function("document.querySelector('#star-count').textContent.startsWith('1/10')")
            assert page.locator('#scene-progress').inner_text().startswith('第 1 / 1 版'), f"{name}: 未完成十粒星飛行前不可結束任務"
            page.wait_for_function("document.querySelector('#star-count').textContent.startsWith('10/10')")
            assert page.evaluate('window.__starFlights') == 20, f"{name}: 十個重複／不同答案詞組應各射出一粒星"
            page.wait_for_function("typeof window.__answerEnd === 'function'")
            assert page.locator('#scene-complete').is_hidden(), f"{name}: 朗讀完成前不可顯示完成頁"
            page.evaluate('window.__answerEnd(); window.__answerEnd = null')
            assert page.locator('#scene-complete').is_visible(), f"{name}: 《誰在叫》十粒星後應完成"
            verify_layout(page, f"{name}-shuijiao-complete", require_no_vertical_scroll=name.startswith("ipad"))

            # 《信》gentle：無干擾、唔使開始小測／檢查掣，砌齊自動讀句。
            page.locator('#book-tabs [data-book="rb_xin"]').click()
            page.wait_for_function("document.querySelector('#scene-book-title').textContent === '信'")
            page.evaluate("""() => {
              window.__starFlights = 0;
              window.__starObserver?.disconnect?.();
              window.__starObserver = new MutationObserver((records) => {
                for (const record of records) {
                  for (const node of record.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches('.fly-star')) window.__starFlights += 1;
                  }
                }
              });
              window.__starObserver.observe(document.body, { childList: true });
              window.KakaSpeech = {
                warmVoices() {},
                speakTerm(text, options = {}) { window.__lastSentence = text; options.onEnd?.(); },
                speakWordThenEncourage(text, options = {}) { window.__lastSentence = text; window.__answerEnd = options.onEnd; },
              };
            }""")
            assert page.locator('#scene-start-quiz').is_hidden(), f"{name}: 《信》gentle 不應有開始小測"
            assert page.locator('#scene-submit').is_hidden(), f"{name}: 《信》gentle 不應有檢查掣"
            assert page.locator('#scene-study').is_hidden(), f"{name}: 《信》gentle 不應預先顯示答案句"
            assert page.locator('.word-card').count() == 2, f"{name}: 《信》字池只有正確詞組"
            assert page.locator('.word-card.is-distractor').count() == 0, f"{name}: 《信》不可有干擾字"
            page.locator('#scene-listen').click()
            assert page.evaluate('window.__lastSentence') == '爺爺的信媽媽的信', f"{name}: 《信》讀音掣應讀本版句"
            page.locator('.word-card[data-word="媽媽的信"]').click()
            page.locator('.word-card[data-word="爺爺的信"]').click()
            assert '次序未啱' in page.locator('#scene-feedback').inner_text(), f"{name}: 《信》錯序仍要溫柔提示"
            for slot in range(2):
                page.locator(f'.answer-slot[data-slot="{slot}"]').click()
            page.locator('.word-card[data-word="爺爺的信"]').click()
            page.locator('.word-card[data-word="媽媽的信"]').click()
            page.wait_for_function("typeof window.__answerEnd === 'function' || document.querySelector('#scene-feedback').textContent.includes('砌好喇')")
            assert '砌好喇' in page.locator('#scene-feedback').inner_text(), f"{name}: 《信》砌齊應自動完成"
            page.wait_for_function("typeof window.__answerEnd === 'function'")
            assert page.evaluate('window.__lastSentence') == '爺爺的信媽媽的信', f"{name}: 砌齊後應朗讀本版句"
            page.evaluate('window.__answerEnd(); window.__answerEnd = null')
            page.wait_for_function("document.querySelector('#scene-progress').textContent.includes('第 2 / 4 版')")
            verify_layout(page, f"{name}-xin-gentle", require_no_vertical_scroll=name.startswith("ipad"))

            if console_errors:
                failures.extend(f"{name}: console {error}" for error in console_errors)
            if failed_requests:
                failures.extend(f"{name}: request failed {request}" for request in failed_requests)
            print(f"✓ {name} ({width}×{height})")
            context.close()
        browser.close()
    if failures:
        raise AssertionError("\n".join(failures))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default="http://127.0.0.1:5179/book-scene-demo.html")
    parser.add_argument("--out", default="/tmp/red-series-sentence-smoke")
    parser.add_argument("--no-shots", action="store_true")
    arguments = parser.parse_args()
    run(arguments.url, None if arguments.no_shots else Path(arguments.out))
    print("紅輯句子遊戲 smoke：3 個家庭 viewport 通過")


if __name__ == "__main__":
    main()

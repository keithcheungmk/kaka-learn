import os
from playwright.sync_api import sync_playwright

URL = os.environ.get('KAKA_TEST_URL', 'http://127.0.0.1:5173') + '/hanzi-write-demo.html'
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--mute-audio'])
    for width, height in [(834,1210), (1210,834), (430,932)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(URL, wait_until='domcontentloaded')
        page.evaluate("() => { for (const k of ['speakTerm','speakThen','warmAudio','unlockSpeech','playCorrectCue']) window.KakaSpeech[k] = () => {}; }")
        page.click('#btn-profile-kaka')
        page.click('#btn-family-names')
        assert page.locator('.family-card').count() == 4
        for index in range(4):
            before = page.evaluate('() => KakaStorage.loadState().totalStars')
            page.locator('.family-card').nth(index).click()
            page.wait_for_selector('#hanzi-target svg')
            for char_index in range(3):
                page.evaluate('() => KakaHanziWrite.onWriteSuccess()')
                if char_index < 2:
                    assert page.is_hidden('#pass-overlay')
                    page.click('#btn-next-char')
                    page.wait_for_selector('#hanzi-target svg')
            assert page.evaluate('() => KakaStorage.loadState().totalStars') == before + 1
            assert page.is_visible('#pass-overlay')
            assert page.locator('#pass-overlay button:visible').count() == 1
            assert page.locator('#btn-next-level').inner_text() == '返回家人'
            page.click('#btn-next-level')
            assert page.is_visible('#view-family')
        before = page.evaluate('() => KakaStorage.loadState().totalStars')
        page.locator('.family-card').first.click()
        for char_index in range(3):
            page.evaluate('() => KakaHanziWrite.onWriteSuccess()')
            if char_index < 2:
                page.click('#btn-next-char')
        assert page.evaluate('() => KakaStorage.loadState().totalStars') == before
        assert page.locator('#pass-overlay button:visible').count() == 1
        assert page.evaluate('() => document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        print(f'{width}x{height}: four names and next actions OK')
        context.close()
    browser.close()

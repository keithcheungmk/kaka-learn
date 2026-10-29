import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--mute-audio'])
    for name, width, height in [('iPad直', 834, 1210), ('iPad橫', 1210, 834), ('iPhone直', 430, 932)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True)
        page = context.new_page()
        page.goto(os.environ.get('KAKA_TEST_URL', 'http://127.0.0.1:5173') + '/hanzi-write-demo.html', wait_until='domcontentloaded')
        page.evaluate("() => { for (const k of ['speakTerm','speakThen','warmAudio','unlockSpeech','playCorrectCue']) window.KakaSpeech[k] = () => {}; }")
        page.click('#btn-profile-kaka')
        page.click("[data-chapter-id='ch1']")
        page.click("[data-char-id='yi']")
        page.wait_for_selector('#hanzi-target svg')
        page.evaluate("() => { const a=window.KakaHanziWrite; a.setSuccessCount('yi',6); a.openWrite(0); }")
        assert page.locator('#write-stamps .is-on').count() == 0, f'{name}: replay stars'
        for i in range(1,7):
            page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
            assert page.is_visible('#pass-overlay') == (i == 6), f'{name}: overlay at {i}'
            assert page.evaluate("() => window.KakaHanziWrite.successCount('yi')") == 6
        assert page.locator('#pass-overlay button:visible').count() == 1
        assert page.locator('#btn-next-level').inner_text() == '下一個字'
        page.click('#btn-next-level')
        assert page.evaluate('() => window.KakaHanziWrite.currentLevel().char') == '二'
        page.evaluate("() => { const a=window.KakaHanziWrite; a.setSuccessCount('er', 3); a.openWrite(1); }")
        assert page.locator('#write-stamps .is-on').count() == 3
        page.evaluate("() => { const a=window.KakaHanziWrite; a.openWrite(9); a.onLevelPassed({firstClear:false}); }")
        assert page.locator('#pass-overlay button:visible').count() == 1
        assert page.locator('#btn-next-level').inner_text() == '返回字表'
        page.click('#btn-next-level')
        assert page.is_visible('#view-chars')
        print(f'{name}: replay, saved progress, next and last character passed')
        context.close()
    browser.close()

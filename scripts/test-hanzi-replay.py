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
        page.click('#back-link')
        page.evaluate('() => { Math.random = () => 0; }')
        page.click('#btn-life-writing')
        assert page.is_visible('#view-write'), f'{name}: topic must start directly'
        word = page.locator('#write-meaning .write-meaning-char').inner_text()
        assert word == '洗手'
        assert page.evaluate('() => window.KAKA_LIFE_WORD_CHARS.洗.strokes.length') == 9
        assert page.evaluate('() => window.KAKA_LIFE_WORD_CHARS.拍.strokes.length') == 8
        assert page.locator('#write-heading').inner_text() == word
        page.wait_for_function("() => { const img = document.querySelector('#write-meaning img'); return img && img.complete && img.naturalWidth > 0; }")
        if name == 'iPad橫' and os.environ.get('KAKA_TEST_SCREENSHOT'):
            page.screenshot(path=os.environ['KAKA_TEST_SCREENSHOT'])
        for step in range(6):
            expected = word[step % 2]
            assert page.evaluate('() => window.KakaHanziWrite.currentLevel().char') == expected
            page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
            assert page.is_visible('#pass-overlay') == (step == 5), f'{name}: word completed too early at {step}'
        assert page.locator('#pass-overlay button:visible').count() == 1
        assert page.locator('#btn-next-level').inner_text() == '下一個詞語'
        assert page.evaluate('(w) => window.KakaStorage.isKeyPassed("hanzi-write", "life-word-" + w)', word)
        page.click('#btn-next-level')
        assert page.is_visible('#view-write')
        assert page.locator('#write-meaning .write-meaning-char').inner_text() == '拍手'
        for _ in range(6):
            page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
        stars = page.evaluate('() => window.KakaStorage.loadState().totalStars')
        page.click('#btn-next-level')
        assert page.locator('#write-meaning .write-meaning-char').inner_text() == word
        for _ in range(6):
            page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
        assert page.evaluate('() => window.KakaStorage.loadState().totalStars') == stars, f'{name}: replay awarded another star'
        page.evaluate('() => { Math.random = () => 0.999; }')
        page.click('#btn-next-level')
        assert page.locator('#write-meaning .write-meaning-char').inner_text() == '大口'
        print(f'{name}: replay, saved progress, next and last character passed')
        context.close()
    browser.close()

import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--mute-audio'])
    for name, width, height in [('iPad直', 834, 1210), ('iPad橫', 1210, 834), ('iPhone直', 430, 932)]:
        context = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True)
        page = context.new_page()
        page.goto(os.environ.get('KAKA_TEST_URL', 'http://127.0.0.1:5173') + '/hanzi-write-demo.html', wait_until='domcontentloaded')
        page.evaluate("""() => {
          window.__spoken = []; window.__cues = 0;
          window.KakaSpeech.speakTerm = (text, opts = {}) => { window.__spoken.push(text); if (opts.onEnd) setTimeout(opts.onEnd, 0); };
          for (const k of ['speakThen','warmAudio','unlockSpeech']) window.KakaSpeech[k] = () => {};
          window.KakaSpeech.playCorrectCue = () => { window.__cues++; };
        }""")
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
        page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
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
            assert page.locator('#write-meaning').is_disabled(), f'{name}: feedback must lock input'
            if step % 2 == 1:
                assert page.locator('#write-heading').evaluate('(el) => el.classList.contains("life-word-celebrate")')
                assert page.locator('#write-heading span').count() == 2
            if step == 0:
                page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
                assert page.evaluate('() => window.KakaHanziWrite.currentLevel().char') == '手'
            page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
            if step == 0:
                assert page.evaluate("() => window.__spoken.at(-1).includes('洗手') && window.__spoken.at(-1).includes('洗') && window.__spoken.at(-1).includes('手')")
            if step % 2 == 1:
                assert page.evaluate("() => window.__spoken.at(-1).includes('洗手')")
                assert page.evaluate('() => window.__spoken.at(-1)').find('三遍' if step == 5 else '再寫一次') >= 0
            assert page.is_visible('#pass-overlay') == (step == 5), f'{name}: word completed too early at {step}'
        assert page.evaluate('() => window.__cues') >= 6
        assert page.locator('#pass-overlay button:visible').count() == 1
        assert page.locator('#btn-next-level').inner_text() == '下一個詞語'
        assert page.evaluate('(w) => window.KakaStorage.isKeyPassed("hanzi-write", "life-word-" + w)', word)
        page.click('#btn-next-level')
        page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        assert page.is_visible('#view-write')
        assert page.locator('#write-meaning .write-meaning-char').inner_text() == '拍手'
        for _ in range(6):
            page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
            page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        stars = page.evaluate('() => window.KakaStorage.loadState().totalStars')
        page.click('#btn-next-level')
        page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        assert page.locator('#write-meaning .write-meaning-char').inner_text() == word
        for _ in range(6):
            page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
            page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        assert page.evaluate('() => window.KakaStorage.loadState().totalStars') == stars, f'{name}: replay awarded another star'
        page.evaluate('() => { Math.random = () => 0.999; }')
        page.click('#btn-next-level')
        assert page.locator('#write-meaning .write-meaning-char').inner_text() == '刷牙'
        page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        assert page.locator('#star-pill').is_hidden()
        page.click('#life-word-picker')
        assert page.is_visible('#life-picker-dialog')
        assert page.locator('.life-picker-item').count() == 6
        page.wait_for_function("() => [...document.querySelectorAll('.life-picker-item img')].every(img => img.complete && img.naturalWidth > 0)")
        assert page.evaluate('() => Object.fromEntries(Object.entries(window.KAKA_LIFE_WORD_CHARS).filter(([c]) => "吃飯喝水看書刷".includes(c)).map(([c,d]) => [c,d.strokes.length]))') == {'吃': 6, '飯': 12, '喝': 12, '水': 4, '看': 9, '書': 10, '刷': 8}
        page.click('#life-picker-close')
        assert page.is_hidden('#life-picker-dialog')
        page.evaluate('() => window.KakaStorage.markTopicPassed("hanzi-write", "life-word-大口")')
        before = page.evaluate('() => window.KakaStorage.loadState().totalStars')
        page.click('#life-word-picker')
        page.click('[data-word="吃飯"]')
        page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        assert page.locator('#write-meaning .write-meaning-char').inner_text() == '吃飯'
        for _ in range(6):
            page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
            page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        assert page.evaluate('() => window.KakaStorage.loadState().totalStars') == before, f'{name}: renamed word awarded twice'
        page.click('#btn-next-level')
        page.wait_for_function("() => !document.querySelector('#write-meaning').disabled")
        assert page.locator('#write-meaning .write-meaning-char').inner_text() != '吃飯'
        page.evaluate("() => { window.__pendingFeedback = null; window.KakaSpeech.speakTerm = (text, opts = {}) => { window.__pendingFeedback = opts.onEnd; }; }")
        page.evaluate('() => window.KakaHanziWrite.onWriteSuccess()')
        page.wait_for_function('() => typeof window.__pendingFeedback === "function"')
        page.click('#back-link')
        assert page.is_visible('#view-adventure')
        page.evaluate('() => window.__pendingFeedback()')
        assert page.is_visible('#view-adventure'), f'{name}: stale voice callback changed screens'
        print(f'{name}: replay, saved progress, next and last character passed')
        context.close()
    browser.close()

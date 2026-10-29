import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--mute-audio'])
 page=b.new_page(viewport={'width':1210,'height':834},has_touch=True)
 page.goto(os.environ.get('KAKA_TEST_URL', 'http://127.0.0.1:5173') + '/hanzi-write-demo.html',wait_until='domcontentloaded')
 page.evaluate("() => { for (const k of ['speakTerm','speakThen','warmAudio','unlockSpeech','playCorrectCue']) window.KakaSpeech[k] = () => {}; }")
 page.click('#btn-profile-kaka'); page.click('#btn-family-names'); page.locator('.family-card').first.click()
 def ready():
  page.wait_for_selector('#hanzi-target svg',timeout=30000)
  page.wait_for_function("document.querySelector('#write-status').textContent.includes('跟著橙色線')",timeout=30000)
 def stroke(c,i):
  pts=page.evaluate('''([c,i])=>{const svg=document.querySelector('#hanzi-target svg'); const m=svg.querySelector('g').getScreenCTM();return window.KAKA_FAMILY_NAME_CHARS[c].medians[i].map(([x,y])=>{const p=svg.createSVGPoint();p.x=x;p.y=y;const q=p.matrixTransform(m);return {x:q.x,y:q.y}})}''',[c,i])
  page.mouse.move(pts[0]['x'],pts[0]['y']);page.mouse.down()
  for pt in pts[1:]: page.mouse.move(pt['x'],pt['y'],steps=5)
  page.mouse.up();page.wait_for_timeout(200)
 ready()
 for i in range(11): stroke('張',i)
 page.wait_for_selector('#btn-next-char:visible',timeout=8000);print('張: traced 11 strokes, accepted')
 page.click('#btn-next-char');ready()
 for i in range(10): stroke('峻',i)
 page.wait_for_selector('#btn-next-char:visible',timeout=8000);page.click('#btn-next-char');ready()
 for i in range(5): stroke('浩',i)
 stroke('浩',6)
 assert '再試一次' in page.locator('#write-status').inner_text(),page.locator('#write-status').inner_text()
 print('浩: old stroke 6 rejected')
 for i in range(5,10): stroke('浩',i)
 page.wait_for_selector('#pass-overlay:visible',timeout=8000);print('浩: corrected stroke order accepted')
 b.close()

from playwright.sync_api import sync_playwright
import os
URL=os.environ.get('KAKA_TEST_URL','http://127.0.0.1:5301').rstrip('/')+'/family-storybook.html?story=zhuhai-two-day'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--mute-audio'])
 for name,w,h in [('iPad portrait',834,1210),('iPad landscape',1210,834),('iPhone',430,932)]:
  page=b.new_page(viewport={'width':w,'height':h},has_touch=True)
  page.add_init_script("""(() => {
    delete window.speechSynthesis; delete window.SpeechSynthesisUtterance;
    Object.defineProperty(window, 'AudioContext', {value: undefined, configurable: false});
    Object.defineProperty(window, 'webkitAudioContext', {value: undefined, configurable: false});
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {value: function() { return Promise.resolve(); }, configurable: false});
  })();""")
  page.goto(URL,wait_until='domcontentloaded')
  assert page.evaluate("typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined' && typeof speechSynthesis === 'undefined' && typeof SpeechSynthesisUtterance === 'undefined' && HTMLMediaElement.prototype.play.toString().includes('Promise.resolve')")
  # Deep link enters reader automatically.
  page.wait_for_selector('#scene-image',state='visible')
  for i in range(8):
   info=page.evaluate('(i)=>window.FAMILY_STORIES.find(x=>x.id===\"zhuhai-two-day\").pages[i]',i)
   img=page.locator('#scene-image'); img.wait_for(state='visible')
   page.wait_for_function("() => {const i = document.querySelector('#scene-image'); return i.complete && i.naturalWidth > 0}")
   assert 'zhuhai-two-day-p' in img.get_attribute('src')
   assert page.locator('#page-reading').inner_text()==info['sentence']
   if not page.locator('#guardian-unlock').is_visible(): page.locator('#speak-sentence').click()
   page.locator('#guardian-unlock').click()
   for word in info['focusWords']:
    page.get_by_role('button',name=word,exact=True).click()
   page.locator('#submit-page').click()
   page.locator('#next-page').wait_for(state='visible')
   assert page.locator('#next-page').is_enabled()
   if i<7: page.locator('#next-page').click()
  assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth+2')
  page.locator('#next-page').click();page.wait_for_selector('#completion:not(.hidden)')
  print(name,'all eight pages passed silently')
  page.close()
 b.close()

const {chromium}=require(process.env.PTH_PLAYWRIGHT || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.PTH_TEST_URL||'http://127.0.0.1:5187/pth-demo.html';
const groups=['bpmf','dtnl','gkh','jqx','zhchshr','zcs','yw'];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PTH_CHROME?{executablePath:process.env.PTH_CHROME}:{})});
 const errors=[];
 for(const [width,height] of [[1210,834],[834,1210],[430,932]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('.lesson');await page.selectOption('#profileSelect','kaka');
  for(const group of groups){
   await page.click('[data-tab="learn"]');await page.click(`[data-group="${group}"]`);
   assert.equal(await page.locator('.example-item').count(),group==='yw'?6:['gkh','jqx','zcs'].includes(group)?9:12);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   const contrast=await page.locator('.example-pinyin').first().evaluate(el=>{
    const lum=c=>{const a=c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return a[0]*.2126+a[1]*.7152+a[2]*.0722;};
    const a=lum(getComputedStyle(el).color),b=lum(getComputedStyle(el.parentElement).backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   });assert.ok(contrast>=4.5,`contrast ${contrast}`);
   if(process.env.PTH_SHOTS&&width===1210&&group==='jqx'){fs.mkdirSync(process.env.PTH_SHOTS,{recursive:true});await page.screenshot({path:`${process.env.PTH_SHOTS}/pth-learn.png`,fullPage:true});}
   await page.click('#startQuiz');assert.equal(await page.locator('#questionNo').textContent(),'1');
   const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,button:document.querySelector('#submitAnswer').getBoundingClientRect().bottom}));
   assert.ok(layout.width<=width+2);if(width>900)assert.ok(layout.height<=height+2&&layout.button<=height,JSON.stringify(layout));
   if(process.env.PTH_SHOTS&&width===1210&&group==='jqx')await page.screenshot({path:`${process.env.PTH_SHOTS}/pth-quiz.png`});
   const qs=await page.evaluate(async g=>(await import('./js/pth-content.js?v=20261004')).buildQuestions(g,0),group);
   for(let i=0;i<(width===1210?10:1);i++){
    const q=qs[i];assert.equal(await page.locator('#questionNo').textContent(),String(i+1));
    if(q.type==='listen'){assert.ok(await page.locator('.option').first().isDisabled());assert.equal(await page.locator('#quizPinyin').isVisible(),false);await page.click('#challengeAudio');await page.waitForFunction(()=>!document.querySelector('.option').disabled);}
    if(i===0){await page.locator(`.option:not([data-answer="${q.answer}"])`).first().click();await page.click('#submitAnswer');assert.match(await page.locator('#feedback').textContent(),/再試/);assert.equal(await page.locator('#progressBadge').textContent(),'0/10 ⭐');}
    await page.click(`.option[data-answer="${q.answer}"]`);
    if(i===0){await page.click('#challengeAudio');assert.ok(await page.locator('#submitAnswer').isDisabled(),'replay must finish before submit');await page.waitForFunction(()=>document.querySelector('#sharedAudio').ended);await page.waitForFunction(()=>!document.querySelector('#submitAnswer').disabled);}
    await page.evaluate(a=>{document.querySelector('#submitAnswer').click();document.querySelector(`[data-answer="${a}"]`).click();document.querySelector('#submitAnswer').click();},q.answer);
    await page.waitForFunction(()=>!document.querySelector('#submitAnswer').disabled);
    assert.equal(await page.locator('#progressBadge').textContent(),`${i+1}/10 ⭐`);await page.click('#submitAnswer');
   }
   if(width===1210){assert.match(await page.locator('#completeText').textContent(),/10 題/);assert.match(await page.locator(`#groupNav [data-group="${group}"]`).textContent(),/⭐/);}
   console.log(`PASS ${group} ${width}: ${width===1210?10:1} questions, retry, rapid-tap guard`);
  }
  if(width===1210){
   assert.equal(await page.locator('#starsTotal').textContent(),'累積 70 粒星');
   await page.selectOption('#profileSelect','heihei');await page.click('[data-tab="stars"]');assert.equal(await page.locator('#starsTotal').textContent(),'累積 0 粒星');
   await page.selectOption('#profileSelect','kaka');await page.reload();await page.waitForSelector('.lesson');await page.click('[data-tab="stars"]');assert.equal(await page.locator('#starsTotal').textContent(),'累積 70 粒星');
   await page.click('[data-tab="learn"]');await page.click('[data-group="bpmf"]');
   await page.locator('[data-play-video]').nth(0).click();await pause(150);await page.locator('[data-play-video]').nth(1).click();await pause(150);
   assert.equal(await page.evaluate(()=>[...document.querySelectorAll('video')].filter(v=>!v.paused).length),1);
   await page.click('[data-word-audio="m-1"]');await pause(150);assert.equal(await page.evaluate(()=>[...document.querySelectorAll('video')].filter(v=>!v.paused).length),0);
   await page.click('[data-tab="stars"]');assert.ok(await page.$eval('#sharedAudio',a=>a.paused));
   for(const group of groups){await page.click('[data-tab="learn"]');await page.click(`[data-group="${group}"]`);for(const button of await page.locator('[data-word-audio]').all()){await button.click();await page.waitForFunction(()=>document.querySelector('#sharedAudio').ended,{},{timeout:15000});}}
   console.log('PASS 69 clips decoded/ended; media exclusivity, tab stop, profiles, reload');
   await page.click('[data-tab="quiz"]');await page.click('#resetProgress');
   const qs=await page.evaluate(async()=>(await import('./js/pth-content.js?v=20261004')).buildQuestions('yw',1));
   await page.evaluate(i=>localStorage.setItem('kaka-pth-v2:kaka:round:yw',JSON.stringify({seed:1,index:i})),qs.findIndex(q=>q.type==='listen'));
   await page.click('[data-tab="learn"]');await page.click('[data-group="yw"]');await page.click('#startQuiz');
   await page.route('**/words/mandarin-v2/*.m4a',r=>r.abort());await page.click('#challengeAudio');await page.waitForFunction(()=>document.querySelector('#wordAudioStatus').textContent.includes('未能播放'));
   assert.ok(await page.locator('#wordAudioStatus').isVisible());assert.ok(await page.locator('.option').first().isDisabled());
   await page.unroute('**/words/mandarin-v2/*.m4a');await page.click('#challengeAudio');await page.waitForFunction(()=>!document.querySelector('.option').disabled);
   console.log('PASS visible quiz audio failure and retry recovery; no silent listening award');
  }
  console.log(`PASS viewport ${width}x${height}, 7 groups and contrast`);await context.close();
 }
 await browser.close();assert.deepEqual(errors,[]);console.log('PTH browser regression passed');
})().catch(e=>{console.error(e);process.exit(1);});

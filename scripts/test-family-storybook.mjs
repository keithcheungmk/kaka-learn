#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const html = read('family-storybook.html');
const js = read('js/family-storybook.js');
const css = read('css/family-storybook.css');
const celebrateCss = read('css/celebrate-finish.css');

assert.match(html, /id="replay-story"/);
assert.match(html, /再玩一次/);
assert.match(html, /返回故事書目/);
assert.match(html, /id="story-finish-actions"/);
assert.match(html, /id="completion-line"/);
assert.match(html, /你好叻啊，完成咗啦，獎勵你一個金幣！/);
assert.match(html, /class="play-finish completion hidden"/);
assert.match(js, /function replayCurrentStory/);
assert.match(js, /root:\s*completion/);
assert.doesNotMatch(js, /scrollHeight/);
const afterHeard = js.match(/function afterPageHeard\([^)]*\) \{[\s\S]*?\n  \}/)?.[0] || '';
assert.match(afterHeard, /function afterPageHeard/);
assert.doesNotMatch(afterHeard, /audioLocked\s*=\s*true/);
assert.doesNotMatch(afterHeard, /speakStory\(/);
assert.match(celebrateCss, /position:\s*fixed/);
assert.match(css, /min-height:\s*52px/);
assert.match(js, /!story\.hidden && !story\.retired/);
assert.match(css, /\.word-choice[\s\S]*transform:\s*none/);
assert.doesNotMatch(css, /\.word-choice:not\(:disabled\):hover[^}]*transform:\s*translateY/);
assert.doesNotMatch(css, /@keyframes\s+[^{]*(shake|bounce|pulse|flash|wiggle)/i);
assert.match(js, /if \(!state\.wordPool\) \{[\s\S]*?state\.wordPool = shuffle\(/);
assert.match(js, /const pool = state\.wordPool/);
assert.equal([...js.matchAll(/\bshuffle\(/g)].length, 3, 'shuffle 只可以喺填詞池同熱身圖／字首次入頁各叫一次');
assert.doesNotMatch(js, /addEventListener\('click'[\s\S]{0,500}shuffle\(/);
assert.match(js, /imageOrder: shuffle\(/);
assert.match(js, /wordOrder: shuffle\(/);
assert.match(js, /function speakPlacedChip/);
assert.match(js, /speakThen\(word, \{ muted, lang: 'zh-HK' \}/);
assert.match(js, /playCorrectCue\(\{ muted \}\)/);
assert.match(js, /speakPlacedChip\(word, word === activeSlots\[index\]\)/);
assert.match(html, /id="activity"[\s\S]*id="next-page"[\s\S]*id="completion"/);
assert.match(css, /\.storybook-shell\.is-reading[\s\S]*\.reader-controls/);
assert.match(css, /align-items:\s*stretch/);
assert.match(css, /\.activity \.reader-controls/);

const context = { window: {} };
vm.runInNewContext(read('data/family-stories/manifest.js'), context);
const hiddenIds = ['park-kite', 'red-balloon', 'zhuhai-aquarium', 'chimelong-safari'];
for (const id of hiddenIds) {
  const retired = context.window.FAMILY_STORIES.find((item) => item.id === id);
  assert.ok(retired, `要保留 ${id} 喺 catalog`);
  assert.ok(retired.hidden || retired.retired, `${id} 要 hidden/retired，唔好出現喺書架`);
}
const playable = context.window.FAMILY_STORIES.filter((item) => !item.hidden && !item.retired);
assert.equal(playable.length, 18);
assert.equal(context.window.FAMILY_STORIES.length, 26);
const zhuhai = context.window.FAMILY_STORIES.find((item) => item.id === 'zhuhai-two-day');
assert.ok(zhuhai, '珠海兩日遊要出現在書架');
assert.equal(zhuhai.pages.length, 8);
assert.ok(zhuhai.pages.every(page => page.focusWords.length === 2 && !page.dialogue));
assert.match(zhuhai.pages[5].sentence, /頭盔.*保護裝備/);
assert.match(zhuhai.pages[7].sentence, /山姆超市.*香港/);
const farm = context.window.FAMILY_STORIES.find((item) => item.id === 'zhongshan-happy-farm');
assert.ok(farm, '要有中山開心農莊');
assert.equal(farm.pages.length, 8);
assert.equal(farm.hidden, undefined);
assert.ok(farm.characters.includes('蛙蛙'));
assert.ok(farm.characters.includes('禧禧'));
assert.doesNotMatch(JSON.stringify(farm), /娃娃/);
assert.equal(farm.pages[3].focusWords[0], '拖拉機');
assert.ok(Array.isArray(farm.warmupPairs) && farm.warmupPairs.length === 3, '農莊要有三對圖字熱身');
assert.equal(JSON.stringify(Array.from(farm.warmupPairs, (pair) => pair.word)), JSON.stringify(['拖拉機', '白鴿', '葡萄']));
const farmFocus = new Set(farm.pages.flatMap((page) => page.focusWords));
for (const pair of farm.warmupPairs) {
  assert.ok(farmFocus.has(pair.word), `熱身詞 ${pair.word} 要喺該篇填空 focusWords`);
  assert.match(pair.image, new RegExp(`scenes/${farm.id}-p0[0-9]\\.webp$`));
}
assert.equal(context.window.FAMILY_STORIES.filter((item) => item.id !== 'zhongshan-happy-farm' && item.warmupPairs).length, 0);
assert.match(html, /id="warmup"/);
assert.match(html, /圖字配對熱身/);
assert.doesNotMatch(html, /图字|配对|热身/);
const warmupHtml = html.split('id="warmup"')[1].split('id="reader"')[0];
assert.doesNotMatch(warmupHtml, /檢查|Check|生命|愛心|lives|heart/i);
assert.match(js, /function beginWarmup/);
assert.match(js, /function pickWarmup/);
assert.match(js, /function leaveWarmup/);
assert.match(js, /speakPlacedChip\(word, true\)/);
assert.match(js, /type === 'image'[\s\S]{0,80}speakPlacedChip\(word, false\)/);
assert.match(js, /className = 'warmup-listen'/);
assert.match(js, /stopPropagation\(\)/);
assert.match(js, /唔係呢個，再試吓/);
assert.match(js, /← 書目/);
assert.match(js, /← 熱身/);
assert.match(js, /, 2200\)/);
assert.match(css, /#warmup-feedback\.success/);
const pickFn = js.match(/function pickWarmup[\s\S]*?\n  function leaveWarmup/)?.[0] || '';
assert.equal((pickFn.match(/warmupState\.selected = null/g) || []).length, 1, '錯配要留住原先選中');
assert.match(js, /if \(current && storyWarmupPairs\(current\)\)/);
assert.match(js, /is-warmup[\s\S]*leaveWarmup/);
assert.match(js, /get\('story'\)/);
assert.match(css, /aspect-ratio:\s*4\s*\/\s*3/);
assert.match(css, /object-fit:\s*cover/);
const warmupFns = js.match(/function beginWarmup[\s\S]*function leaveWarmup[\s\S]*?\n  \}/)?.[0] || '';
assert.doesNotMatch(warmupFns, /finishedKey|earnCoin|tryEarnStar|KakaCelebrate/);
const story = context.window.FAMILY_STORIES.find((item) => item.id === 'xiyu-fullmoon-party');
assert.ok(story, '要有浠榆滿月派對');
assert.equal(story.pages[2].dialogue.speaker, '爸爸');
assert.match(story.pages[2].sentence, /爸爸/);
assert.equal(JSON.stringify(story.pages[4].focusWords), JSON.stringify(['樓梯', '上上落落']));
assert.match(story.pages[4].sentence, /上上落落/);
assert.doesNotMatch(story.pages[4].sentence, /走上走下/);
assert.ok(story.characters.includes('爸爸'));
const tianye = context.window.FAMILY_STORIES.find((item) => item.id === 'tianye-happy-day');
assert.ok(tianye, '要有田野部落開心日');
assert.equal(tianye.pages.length, 8);
assert.equal(tianye.title, '田野部落開心日');
assert.equal(tianye.date, '2026-10-25');
assert.ok(tianye.characters.includes('浠榆妹妹'));
assert.ok(tianye.characters.includes('護士姐姐'));
assert.match(tianye.pages[0].sentence, /浠榆妹妹/);
assert.doesNotMatch(JSON.stringify(tianye), /希恩/);
assert.equal(JSON.stringify(tianye.pages[7].focusWords), JSON.stringify(['細心', '溫柔', '安全']));
assert.match(tianye.pages[7].sentence, /學會/);
assert.doesNotMatch(tianye.pages[7].sentence, /學識/);
assert.doesNotMatch(tianye.pages[7].sentence, /學懂/);
assert.match(tianye.pages[7].sentence, /細心照顧妹妹/);
assert.match(tianye.pages[7].sentence, /溫柔餵動物/);
assert.match(tianye.pages[7].sentence, /安全開車開船/);
assert.equal(tianye.pages[7].dialogue.text, '細心照顧妹妹。溫柔餵動物。和爸爸安全開車開船。');
assert.match(tianye.pages[2].sentence, /開車去田野部落農莊/);
assert.equal(tianye.hidden, undefined);
assert.equal(tianye.warmupPairs, undefined);
const samZoo = context.window.FAMILY_STORIES.find((item) => item.id === 'sam-supermarket-zoo');
assert.ok(samZoo, '要有山姆超市和室內動物園');
assert.equal(samZoo.title, '山姆超市和室內動物園');
assert.equal(samZoo.date, '2026-10-24');
assert.equal(samZoo.series, '卡卡日記');
assert.equal(samZoo.pages.length, 8);
assert.ok(samZoo.characters.includes('浠榆妹妹'));
assert.ok(samZoo.characters.includes('禧禧'));
assert.ok(samZoo.characters.includes('虹姑姑'));
assert.doesNotMatch(JSON.stringify(samZoo), /希恩/);
assert.doesNotMatch(JSON.stringify(samZoo), /小鸡|选购|质量|认真储币|白鸽/);
assert.match(samZoo.pages[0].sentence, /浠榆妹妹/);
assert.equal(samZoo.pages[0].dialogue.text, '我很想念你們！');
assert.doesNotMatch(JSON.stringify(samZoo), /你哋|掛住|學識/);
assert.match(samZoo.pages[1].sentence, /山姆超市/);
assert.match(samZoo.pages[1].sentence, /毛公仔/);
assert.match(samZoo.pages[2].sentence, /儲幣幣/);
assert.match(samZoo.pages[3].sentence, /室內動物園/);
assert.match(samZoo.pages[3].sentence, /羊駝/);
assert.match(samZoo.pages[4].sentence, /手推車/);
assert.match(samZoo.pages[5].sentence, /小鸚鵡/);
assert.doesNotMatch(samZoo.pages[5].sentence, /白鴿/);
assert.match(samZoo.pages[6].sentence, /小馬/);
assert.match(samZoo.pages[6].sentence, /小雞/);
assert.equal(JSON.stringify(samZoo.pages[7].focusWords), JSON.stringify(['慢慢揀', '溫柔', '儲幣幣']));
assert.match(samZoo.pages[7].sentence, /學會/);
assert.doesNotMatch(samZoo.pages[7].sentence, /學識/);
assert.match(samZoo.pages[7].sentence, /超市慢慢揀/);
assert.match(samZoo.pages[7].sentence, /溫柔餵動物/);
assert.match(samZoo.pages[7].sentence, /認真儲幣幣/);
assert.equal(samZoo.pages[7].dialogue.text, '超市慢慢揀。溫柔餵動物。認真儲幣幣。');
assert.equal(samZoo.hidden, undefined);
assert.equal(samZoo.warmupPairs, undefined);
const kaiTak = context.window.FAMILY_STORIES.find((item) => item.id === 'kai-tak-cruise-terminal');
assert.ok(kaiTak, '要有啟德郵輪碼頭的一天');
assert.equal(kaiTak.title, '啟德郵輪碼頭的一天');
assert.equal(kaiTak.place, '香港啟德郵輪碼頭');
assert.equal(kaiTak.date, '2026-11-15');
assert.equal(kaiTak.series, '卡卡日記');
assert.equal(kaiTak.hidden, false);
assert.equal(kaiTak.pages.length, 6);
assert.equal(JSON.stringify(kaiTak.characters), JSON.stringify(['卡卡', '禧禧', '謙謙']));
assert.ok(playable.some((item) => item.id === 'kai-tak-cruise-terminal'), '新日記要出現喺書架');
assert.equal(playable.at(-1).id, 'kai-tak-cruise-terminal');
assert.match(kaiTak.summary, /2026年11月15日/);
assert.match(kaiTak.pages[0].sentence, /2026年11月15日/);
assert.match(kaiTak.pages[0].sentence, /郵輪碼頭/);
assert.equal(JSON.stringify(kaiTak.pages[0].focusWords), JSON.stringify(['郵輪碼頭', '大海']));
assert.equal(kaiTak.pages[0].dialogue.text, '郵輪好大啊！');
assert.equal(JSON.stringify(kaiTak.pages[1].focusWords), JSON.stringify(['空中花園', '滑板車']));
assert.equal(kaiTak.pages[1].dialogue.speaker, '禧禧');
assert.equal(kaiTak.pages[1].dialogue.text, '我們一起玩滑板車吧！');
assert.equal(JSON.stringify(kaiTak.pages[2].focusWords), JSON.stringify(['泡泡', '分享']));
assert.match(kaiTak.pages[2].sentence, /分享/);
assert.equal(kaiTak.pages[2].dialogue.text, '我們一起分享玩具吧！');
assert.equal(JSON.stringify(kaiTak.pages[3].focusWords), JSON.stringify(['野餐', '水果']));
assert.match(kaiTak.pages[3].sentence, /菠蘿/);
assert.equal(kaiTak.pages[3].dialogue.speaker, '謙謙');
assert.equal(JSON.stringify(kaiTak.pages[4].focusWords), JSON.stringify(['餐廳', '遊樂場']));
assert.equal(kaiTak.pages[4].dialogue.speaker, '禧禧');
assert.equal(JSON.stringify(kaiTak.pages[5].focusWords), JSON.stringify(['回家', '睡着了']));
assert.match(kaiTak.pages[5].sentence, /睡着了/);
assert.doesNotMatch(JSON.stringify(kaiTak), /眠著|傑叔叔|爸爸|媽媽|你哋|冇|喺|睇咩|玩得好開心/);
assert.equal(kaiTak.warmupPairs, undefined);
for (const [index, page] of kaiTak.pages.entries()) {
  assert.equal(page.tiles.join('').replace(/[，。！？、\s]/g, ''), page.sentence.replace(/[，。！？、\s]/g, ''), `第 ${index + 1} 頁詞磚要重組句子`);
  assert.ok(fs.existsSync(path.join(root, page.image)), `要有第 ${index + 1} 頁插圖`);
}

const oralRe = /[哋唔嚟咗喺冇睇攞俾啲咁喇啦喎㗎咩嘢嘅哦]|係咪|你哋|我哋|佢哋|掛住|揸車|沖涼|好味|落樓|食雪糕/;
assert.match(html, /id="parent-review-entry"/);
assert.match(html, />家長檢視</);
assert.match(html, /快速查看全部插圖和文字，不用聽語音、不用答題。/);
assert.match(html, />開始檢視</);
assert.match(html, /id="parent-confirm-cancel"/);
assert.match(html, /家長檢視中，只看書圖，不會計算獎勵幣/);
assert.match(html, />離開檢視</);
assert.match(html, /id="parent-preview"/);
assert.match(html, /id="parent-page-jump"/);
assert.match(html, /id="parent-daily-report"/);
assert.match(html, /js\/storage\.js/);
assert.match(js, /故事／點這裏開始/);
assert.match(js, /今日可攞幣/);
assert.match(js, /今日幣✓/);
assert.match(js, /earnStoryCoin/);
assert.match(js, /renderParentDailyReport/);
assert.match(js, /檢視全書/);
assert.match(js, /get\('view'\) === 'parent'/);
assert.match(js, /if \(parentMode\) \{\s*showParentPreview\(\);\s*return;\s*\}/);
assert.match(js, /function completeStory\(\) \{\s*if \(parentMode\) return;/);
assert.match(css, /\.coin-tag\.is-open/);
assert.match(css, /\.parent-daily-report/);
assert.match(js, /本頁學詞：/);
assert.match(js, /speakStory\(pageReadingText\(current\.pages\[index\]\)\)/);
assert.match(js, /leaveParentPreview\(\)/);
assert.match(js, /exitParentMode/);
assert.doesNotMatch(js, /localStorage\.setItem\([^)]*parent/);
assert.match(css, /\.parent-page-frame img[\s\S]*object-fit:\s*contain/);
assert.doesNotMatch(css, /\.parent-page-frame img[\s\S]*object-fit:\s*cover/);
assert.match(css, /\.parent-review-entry[\s\S]*background:\s*none/);
const parentBlock = js.slice(js.indexOf('function parentViewRequested'), js.indexOf('speech.warmVoices'));
assert.match(parentBlock, /function renderParentPreview/);
assert.doesNotMatch(parentBlock, /finishedKey|completeStory|earnCoin|tryEarnStar|localStorage\.setItem/);
assert.doesNotMatch(parentBlock, /unlockPage:\s*true/);
assert.doesNotMatch(parentBlock, /beginWarmup|renderWordTask|showReader\(/);
assert.doesNotMatch(read('family-storybook-en.html'), /家長檢視|parent-preview|view=parent/);
assert.doesNotMatch(read('js/family-storybook-en.js'), /家長檢視|parentMode|view=parent|檢視全書/);
const parentUi = [
  html.match(/id="parent-review-banner"[\s\S]*?<\/div>/)?.[0] || '',
  html.match(/id="parent-confirm"[\s\S]*?<\/div>\s*<\/div>/)?.[0] || '',
].join('\n');
assert.match(parentUi, /快速查看全部插圖和文字/);
assert.doesNotMatch(parentUi, oralRe);
for (const item of context.window.FAMILY_STORIES) {
  const blob = [
    item.title,
    item.summary,
    ...(item.extensionWords || []),
    ...item.pages.flatMap((page) => [
      page.sentence,
      page.dialogue?.text,
      ...(page.tiles || []),
      ...(page.learn || []),
      ...(page.focusWords || []),
      ...(page.distractors || []),
    ]),
  ].join('\n');
  assert.doesNotMatch(blob, oralRe, `${item.id} 故事學習欄位要用書面中文`);
}

console.log('test-family-storybook: ok');

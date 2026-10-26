#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const html = read('hanzi-write-demo.html');
const css = read('css/hanzi-write-demo.css');
const js = read('js/hanzi-write-demo.js');
const data = read('data/hanzi-write-chars.js');
const index = read('index.html');
const storage = read('js/storage.js');

assert.match(index, /id="btn-topics-hanzi-write"/, '中文主題頁要有學寫字入口');
assert.match(index, /hanzi-write-demo\.html/, '入口要連去獨立頁');
assert.match(index, /卡卡學寫字/);
assert.match(index, /paper-bridge-p01\.webp/, '寫字卡要重用卡卡同禧禧一齊坐桌現有插圖');
assert.doesNotMatch(index.split('id="screen-topics"')[1].split('id="screen-topic-group"')[0], /xiezi-write\.webp/, '寫字入口唔好再用單人特寫裁切');
assert.match(index, /family-height-lineup\.webp/, '故事卡要重用家庭合照');
assert.match(index, /rainbow-umbrella-p02\.webp/, '四格卡要重用現有雨傘插圖');
assert.match(index, /kan-shu\.webp/, '課本溫習卡要重用看書插圖');
assert.match(index, /kaixin\.webp/, '今日好學卡要重用開心插圖');
assert.match(index, /home-tw\.webp/, '日常生活卡要重用屋邨插圖');
assert.match(index, /zhongshan-zoo-day-p01\.webp/, '動物卡要重用動物園插圖');
assert.match(index, /id="btn-topics-group-starter"/);
assert.match(index, /id="screen-topic-group"/);
assert.doesNotMatch(index, /id="topic-grid"/, '揀主題唔好再留 emoji 小卡牆');
assert.match(index, /aria-label="獨立開啟卡卡學寫字"/);
assert.doesNotMatch(index, /four-panel-entry-thumbs/);
assert.doesNotMatch(index, /hanzi-write-entry-rocket/);
assert.doesNotMatch(index, /卡卡認字 Demo/);

for (const rel of [
  'hanzi-write-demo.html',
  'css/hanzi-write-demo.css',
  'js/hanzi-write-demo.js',
  'data/hanzi-write-chars.js',
  'vendor/hanzi-writer/hanzi-writer.min.js',
  'vendor/hanzi-writer/LICENSE',
]) {
  assert.ok(fs.existsSync(path.join(root, rel)), `缺少 ${rel}`);
}

assert.match(html, /卡卡學寫字｜寫字・筆順/);
assert.match(html, /id="brand-title">卡卡學寫字</);
assert.match(html, /id="brand-kicker">寫字・筆順</);
assert.match(html, /你是誰？/);
assert.match(html, /選一章/);
assert.match(html, /選一個字/);
assert.match(html, /寫「一」/);
assert.match(html, /id="level-bank"/);
assert.match(html, /id="chapter-grid"/);
assert.match(html, /id="btn-speak-chapters"/);
assert.match(html, /id="btn-chapter-help"/);
assert.match(html, /id="chapter-help"/);
assert.match(html, /六次/);
assert.doesNotMatch(html, /btn-start-adventure/);
assert.match(html, /id="view-chars"/);
assert.match(html, /id="write-meaning"/);
assert.match(html, /write-meaning-emoji/);
assert.doesNotMatch(html, /聽粵語，再指圖/);
assert.doesNotMatch(html, /id="view-warmup"/);
assert.doesNotMatch(html, /btn-warmup-listen/);
assert.match(html, /九宮格/);
assert.match(html, /jiugong-grid/);
assert.match(html, /34\.33/);
assert.match(html, /67\.67/);
assert.match(html, /id="write-vocab"/);
assert.match(html, /id="pass-vocab"/);
assert.match(html, /相關詞/);
assert.doesNotMatch(html, /米字格/);
assert.doesNotMatch(html, /x1="2" y1="2" x2="98" y2="98"/);
assert.doesNotMatch(html, /x1="98" y1="2" x2="2" y2="98"/);
assert.match(html, /再寫一次/);
assert.match(html, /過關啦！/);
assert.match(html, /id="pass-gloss"/);
assert.match(html, /id="hanzi-guide"/);
assert.doesNotMatch(html, /id="btn-write-rest"/);
assert.doesNotMatch(html, /休息一下/);
assert.doesNotMatch(html, /id="rest-overlay"/);
assert.doesNotMatch(html, /btn-rest-continue/);
assert.doesNotMatch(html, /btn-rest-leave/);
assert.match(html, /返回字表/);
assert.match(html, /id="btn-pass-rewrite"/);
assert.match(html, /返主頁/);
assert.match(html, /即將開放/);
assert.match(html, /\?v=hanzi-write-stamp-stars/);
assert.match(html, /id="write-stamps"/);
assert.match(html, /class="write-stamps"/);
assert.match(html, /write-progress is-aux/);
assert.doesNotMatch(html, /id="write-progress"[^>]*>已寫/);
assert.match(html, /不會上傳/);
assert.match(html, /vendor\/hanzi-writer\/hanzi-writer\.min\.js/);
assert.match(html, /nav-back\.js/);
assert.match(html, /js\/storage\.js/);
assert.match(html, /profile-kaka\.jpg/);
assert.match(html, /profile-heihei\.jpg/);
assert.match(html, /href="index.html#screen-topics"/);
assert.doesNotMatch(html, /卡卡認字 Demo/);
assert.doesNotMatch(html, /cdn\.jsdelivr|unpkg|googleapis/);
assert.doesNotMatch(html, /巴斯光年|Buzz|迪士尼|Disney|Lightyear/i);

assert.match(css, /100dvh/);
assert.match(css, /mizi-board/);
assert.match(css, /jiugong-grid/);
assert.match(css, /vocab-chip/);
assert.doesNotMatch(css, /stroke-dasharray: 3 2/);
assert.match(css, /level-bank/);
assert.match(css, /chapter-grid/);
assert.match(css, /chapter-art/);
assert.match(css, /chapter-lock/);
assert.match(css, /chapter-star/);
assert.match(css, /\[hidden\]\s*\{\s*display:\s*none\s*!important/);
assert.match(css, /write-meaning/);
assert.match(css, /write-meaning-emoji/);
assert.match(css, /\.write-stamps/);
assert.match(css, /\.write-stamp/);
assert.match(css, /right:\s*max\(/);
assert.match(css, /bottom:\s*max\(/);
assert.match(css, /clamp\(44px/);
assert.match(css, /\.mizi-board\.is-success/);
assert.match(css, /hw-success-flash/);
assert.match(css, /hw-stamp-pop/);
assert.match(css, /\.write-progress\.is-aux/);
assert.doesNotMatch(css, /warmup-grid/);
assert.match(css, /\.hanzi-guide/);
assert.match(css, /stroke-dasharray/);
assert.match(css, /hanzi-guide-stroke/);
assert.match(css, /vector-effect: non-scaling-stroke/);
assert.match(css, /\.pass-gloss/);
assert.doesNotMatch(css, /\.rest-btn/);
assert.match(css, /min-height: var\(--tap\)/);
assert.doesNotMatch(css, /min-height:\s*0/);

assert.match(js, /HanziWriter\.create/);
assert.match(js, /charDataLoader/);
assert.match(js, /earnCoinForMode/);
assert.match(js, /tryEarnStar/);
assert.match(js, /COIN_MODE = 'hanzi-write'/);
assert.match(js, /NEED_SUCCESSES = 6/);
assert.match(js, /HINT_FULL/);
assert.match(js, /HINT_FAINT/);
assert.match(js, /HINT_BLANK/);
assert.match(js, /function hintLevelFor/);
assert.match(js, /hanziWriteProgress/);
assert.match(js, /warmups: raw\.warmups/);
assert.match(js, /GUIDE_ORANGE = '#ff8a1a'/);
assert.match(js, /OUTLINE_INK = '#8aa0c8'/);
assert.match(js, /highlightColor: GUIDE_ORANGE/);
assert.match(js, /strokeColor: GUIDE_ORANGE/);
assert.match(js, /outlineColor:/);
assert.match(js, /跟著橙色線/);
assert.match(js, /onMistake/);
assert.match(js, /RETRY_HINT = '再試一次。跟著橙色線寫。'/);
assert.match(js, /function onQuizMiss/);
assert.match(js, /function speakGlossThenCheer/);
assert.match(js, /function showPassGloss/);
assert.match(js, /function showActiveStrokeGuide/);
assert.match(js, /function makeStartDot/);
assert.match(js, /HanziWriter\.getScalingTransform/);
assert.match(js, /GUIDE_DASH = '16 10'/);
assert.match(js, /stroke-dasharray', GUIDE_DASH/);
assert.match(js, /fill', 'none'/);
assert.match(js, /vector-effect', 'non-scaling-stroke'/);
assert.match(js, /function drawingWidthFor/);
assert.match(js, /function placeGuideInWriter/);
assert.match(js, /group\.appendChild\(path\)/);
assert.doesNotMatch(js, /insertBefore\(path, ink\)/);
assert.match(js, /DRAWING_TARGET_PX = 26/);
assert.match(js, /DRAWING_INK = '#16325c'/);
assert.match(js, /drawingWidth: drawingWidthFor\(size\)/);
assert.match(js, /drawingColor: DRAWING_INK/);
assert.match(js, /function flashMissBoard/);
assert.match(js, /function flashSuccessBoard/);
assert.match(js, /function celebrateWriteTick/);
assert.match(js, /function renderWriteStamps/);
assert.match(js, /playCorrectCue/);
assert.match(js, /celebrateWriteTick\(next\)/);
assert.match(js, /const next = setSuccessCount\(level.id, Math.min\(NEED_SUCCESSES, prev \+ 1\)\)/);
const writeChromeFn = js.match(/function refreshWriteChrome\(\) \{[\s\S]*?\n  \}/)?.[0] || '';
assert.match(writeChromeFn, /renderWriteStamps\(done\)/);
assert.doesNotMatch(writeChromeFn, /已寫 \$\{done\}／\$\{NEED_SUCCESSES\}/);
assert.doesNotMatch(js.match(/function onQuizMiss\(\) \{[\s\S]*?\n  \}/)?.[0] || '', /setSuccessCount/);
assert.doesNotMatch(js, /function showRestOffer/);
assert.doesNotMatch(js, /function restFromWrite/);
assert.doesNotMatch(js, /btn-write-rest/);
assert.doesNotMatch(js, /rest-overlay/);
assert.doesNotMatch(js, /休息一下/);
assert.match(js, /function vocabFor/);
assert.match(js, /function renderVocab/);
assert.match(js, /function renderMeaning/);
assert.match(js, /write-vocab/);
assert.match(js, /pass-vocab/);
assert.match(js, /write-meaning/);
assert.match(js, /聽「\$\{item\.word\}」/);
assert.match(js, /function openChapter/);
assert.match(js, /chapterId = chapter\.id;\n    goChars\(\);/);
assert.match(js, /chapter-lock/);
assert.match(js, /function chapterStarCount/);
assert.match(js, /揀一章嚟寫/);
assert.doesNotMatch(js, /稍後才可以寫/);
assert.doesNotMatch(js, /btn-start-adventure/);
assert.doesNotMatch(js, /聽粵語，再指圖/);
assert.doesNotMatch(js, /function openWarmup/);
assert.doesNotMatch(js, /function isWarmupDone/);
assert.doesNotMatch(js, /WARMUP_SIZE/);
assert.doesNotMatch(js, /drawingWidth: 14/);
assert.doesNotMatch(js, /drawingWidth: 8/);
assert.doesNotMatch(js, /drawingColor: '#e56700'/);
assert.doesNotMatch(js, /fill-opacity', '0\.92'/);
assert.doesNotMatch(js, /path\.setAttribute\('fill', GUIDE_ORANGE\)/);
assert.match(css, /\.hanzi-target \{\s*z-index: 3;/);
assert.match(css, /\.hanzi-guide \{[\s\S]*z-index: 1;/);
assert.match(css, /\.mizi-board\.is-miss/);
assert.match(js, /speech\.speakThen/);
assert.match(js, /\$\{gloss\}。\$\{PASS_CHEER\}/);
assert.match(js, /PASS_CHEER = '過關啦'/);
assert.match(js, /function firstPlayableIndex/);
assert.match(js, /goBackOr\(PARENT_HREF\)/);
assert.match(js, /btn-pass-home[\s\S]*goBackOr\(PARENT_HREF\)/);
assert.match(js, /view === 'write'/);
assert.doesNotMatch(js, /outlineColor: '#ffb14a'/);
assert.doesNotMatch(js, /outlineColor: '#d7c4b5'/);
assert.doesNotMatch(js, /radicalColor: '#c0392b'/);
assert.match(js, /setActiveProfile/);
assert.doesNotMatch(js, /https?:\/\//);
assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|FormData/);
assert.doesNotMatch(js, /webkitSpeechRecognition|SpeechRecognition/);
assert.doesNotMatch(js, /卡卡認字 Demo/);

assert.match(storage, /'hanzi-write'/);
assert.match(storage, /'hanzi-write-ch1'/);
assert.match(storage, /hanziWriteProgress/);

const context = { window: {} };
vm.runInNewContext(data, context);
const chars = context.window.KAKA_HANZI_WRITE_CHARS;
const bank = context.window.KAKA_HANZI_WRITE_BANK;
const catalog = context.window.KAKA_HANZI_WRITE_LEVELS;
const chapters = context.window.KAKA_HANZI_WRITE_CHAPTERS;
assert.ok(bank, '要有 KAKA_HANZI_WRITE_BANK');
assert.equal(catalog, bank, 'LEVELS 要 alias BANK');
assert.equal(bank.length, 30, '第 1-3 章合共三十個字');
assert.equal(chapters.length, 10, '十章目錄');
assert.equal(chapters.filter((c) => c.open).length, 3, '只開放三章');
assert.ok(chapters.slice(3).every((c) => c.title === '即將開放' && !c.open), '4-10 章即將開放');
const CHAPTER_ART = {
  ch1: 'assets/character-words/actions/xiezi-write.webp',
  ch2: 'assets/common-sense/scenes/home-tw.webp',
  ch3: 'assets/character-words/actions/chuan-yifu.webp',
  ch4: 'assets/family-stories/scenes/zhongshan-zoo-day-p01.webp',
  ch5: 'assets/character-words/actions/kan-shu.webp',
  ch6: 'assets/family-stories/scenes/tianye-happy-day-p06.webp',
  ch7: 'assets/family-stories/scenes/garden-flowers-p01.webp',
  ch8: 'assets/common-sense/scenes/rain-umbrella.webp',
  ch9: 'assets/family-stories/scenes/tianye-happy-day-p03.webp',
  ch10: 'assets/common-sense/scenes/moon-watch.webp',
};
assert.ok(chapters.every((c) => c.art && !c.art.includes('hanzi-write/chapters/') && fs.existsSync(path.join(root, c.art))), '每章要用現有網站插圖，唔好新黏土物件包');
assert.deepEqual(Object.fromEntries(chapters.map((c) => [c.id, c.art])), CHAPTER_ART, '章節圖要對齊現有角色／場景資產');
assert.ok(!fs.existsSync(path.join(root, 'assets/hanzi-write/chapters/ch1.webp')), '唔好再放黏土物件章節圖');

const starFn = js.match(/function chapterStarCount\(done, total\) \{[\s\S]*?\n  \}/);
assert.ok(starFn, '要有 chapterStarCount');
const starBox = {};
vm.runInNewContext(`${starFn[0]}; this.chapterStarCount = chapterStarCount;`, starBox);
assert.equal(starBox.chapterStarCount(0, 10), 0);
assert.equal(starBox.chapterStarCount(2, 10), 1);
assert.equal(starBox.chapterStarCount(10, 10), 5);

const ch1 = ['一', '二', '三', '十', '人', '大', '小', '口', '日', '月'];
const ch2 = ['手', '目', '耳', '心', '爸', '媽', '哥', '弟', '姐', '妹'];
const ch3 = ['頭', '面', '鼻', '牙', '腳', '肚', '背', '皮', '衣', '帽'];
assert.equal(Array.from(bank.filter((b) => b.chapterId === 'ch1').map((b) => b.char)).join(''), ch1.join(''));
assert.equal(Array.from(bank.filter((b) => b.chapterId === 'ch2').map((b) => b.char)).join(''), ch2.join(''));
assert.equal(Array.from(bank.filter((b) => b.chapterId === 'ch3').map((b) => b.char)).join(''), ch3.join(''));

const keepIds = { 一: 'yi', 大: 'da', 小: 'xiao', 月: 'yue' };
for (const [char, id] of Object.entries(keepIds)) {
  assert.equal(bank.find((b) => b.char === char)?.id, id, `${char} 要保持舊 id`);
}

for (const item of bank) {
  const glyph = chars[item.char];
  assert.ok(glyph, `要有繁體「${item.char}」筆順`);
  assert.ok(item.glossYue, `${item.char} 要有 glossYue`);
  assert.ok(item.emoji, `${item.char} 要有指圖 emoji`);
  assert.ok(item.hint, `${item.char} 要有 hint`);
  assert.ok(Array.isArray(glyph.strokes) && glyph.strokes.length > 0, `${item.char} 要有 strokes`);
  assert.equal(glyph.medians.length, glyph.strokes.length, `${item.char} median 對數`);
  assert.ok(Array.isArray(item.vocab), `${item.char} 要有相關詞`);
  assert.ok(item.vocab.length >= 2 && item.vocab.length <= 4, `${item.char} 相關詞要 2–4 個`);
  for (const vocab of item.vocab) {
    assert.ok(vocab.word && vocab.word.includes(item.char), `${item.char} 相關詞「${vocab.word}」要含本字`);
    assert.ok(vocab.say, `${item.char} 相關詞要有粵語 say`);
  }
  assert.equal(item.edbStrokeCount, glyph.strokes.length, `${item.char} 筆畫數要對齊 EDB／常用字字形表`);
  for (const stroke of glyph.strokes) {
    assert.match(stroke, /^M /, `${item.char} stroke 要係 SVG path`);
  }
}

assert.ok(!('风' in chars), '唔好用簡體風');
assert.ok(!('妈' in chars), '唔好用簡體媽');
assert.ok(!('脚' in chars), '唔好用簡體腳');
assert.ok(!('头' in chars), '唔好用簡體頭');
assert.ok('星' in chars, '保留舊「星」筆順');
assert.ok('媽' in chars && chars['媽'].strokes.length === 13, '媽要用繁體十三筆');
assert.ok('腳' in chars && chars['腳'].strokes.length === 13, '腳要用繁體十三筆');
assert.ok('頭' in chars && chars['頭'].strokes.length === 16, '頭要用繁體十六筆');

const hintFn = js.match(/function hintLevelFor\(successes\) \{[\s\S]*?\n  \}/);
assert.ok(hintFn, '要有 hintLevelFor');
const sandbox = { HINT_BLANK: 3, HINT_FAINT: 2, HINT_FULL: 1 };
vm.runInNewContext(`${hintFn[0]}; this.hintLevelFor = hintLevelFor;`, sandbox);
assert.equal(sandbox.hintLevelFor(0), 1);
assert.equal(sandbox.hintLevelFor(1), 1);
assert.equal(sandbox.hintLevelFor(2), 2);
assert.equal(sandbox.hintLevelFor(3), 2);
assert.equal(sandbox.hintLevelFor(4), 3);
assert.equal(sandbox.hintLevelFor(5), 3);

console.log('test-hanzi-write-demo: ok');

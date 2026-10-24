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
assert.match(index, /寫字・筆順/);
assert.match(index, /aria-label="獨立開啟卡卡學寫字"/);
assert.match(index, /星、月、一.*十二個字/);
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
assert.match(html, /開始冒險/);
assert.match(html, /寫「星」/);
assert.match(html, /十二個字/);
assert.match(html, /id="level-bank"/);
assert.match(html, /米字格/);
assert.match(html, /再寫一次/);
assert.match(html, /下一個/);
assert.match(html, /過關啦！/);
assert.match(html, /id="pass-gloss"/);
assert.match(html, /id="hanzi-guide"/);
assert.match(html, /id="btn-write-rest"/);
assert.match(html, /休息一下/);
assert.match(html, /下一關/);
assert.match(html, /id="btn-pass-rewrite"/);
assert.match(html, /返主頁/);
assert.match(html, /\?v=hanzi-write-qa24/);
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
assert.match(css, /background: #e8eef8/);
assert.match(css, /level-bank/);
assert.match(css, /\.hanzi-guide/);
assert.match(css, /\.pass-gloss/);
assert.match(css, /\.rest-btn/);
assert.match(css, /min-height: 56px/);
assert.match(css, /min-height: var\(--tap\)/);
assert.doesNotMatch(css, /min-height:\s*0/);

assert.match(js, /HanziWriter\.create/);
assert.match(js, /charDataLoader/);
assert.match(js, /earnCoinForMode/);
assert.match(js, /tryEarnStar/);
assert.match(js, /COIN_MODE = 'hanzi-write'/);
assert.match(js, /GUIDE_ORANGE = '#ff8a1a'/);
assert.match(js, /OUTLINE_INK = '#8aa0c8'/);
assert.match(js, /highlightColor: GUIDE_ORANGE/);
assert.match(js, /strokeColor: GUIDE_ORANGE/);
assert.match(js, /outlineColor: OUTLINE_INK/);
assert.match(js, /跟著橙色線/);
assert.match(js, /onMistake/);
assert.match(js, /RETRY_HINT = '再試一次。跟著橙色線寫。'/);
assert.match(js, /function onQuizMiss/);
assert.match(js, /function speakGlossThenCheer/);
assert.match(js, /function showPassGloss/);
assert.match(js, /function showActiveStrokeGuide/);
assert.match(js, /HanziWriter\.getScalingTransform/);
assert.match(js, /fill-opacity', '0\.92'/);
assert.match(js, /function restFromWrite/);
assert.match(js, /btn-write-rest[\s\S]*restFromWrite/);
assert.match(js, /speech\.speakThen/);
assert.match(js, /\$\{gloss\}。\$\{PASS_CHEER\}/);
assert.match(js, /PASS_CHEER = '過關啦'/);
assert.match(js, /function firstPlayableIndex/);
assert.match(js, /levelIndex < levels\(\)\.length - 1/);
assert.match(js, /十二關都寫完喇/);
assert.match(js, /goBackOr\(PARENT_HREF\)/);
assert.match(js, /btn-pass-home[\s\S]*goBackOr\(PARENT_HREF\)/);
assert.doesNotMatch(js, /outlineColor: '#ffb14a'/);
assert.doesNotMatch(js, /outlineColor: '#d7c4b5'/);
assert.doesNotMatch(js, /radicalColor: '#c0392b'/);
assert.match(js, /setActiveProfile/);
assert.doesNotMatch(js, /https?:\/\//);
assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|FormData/);
assert.doesNotMatch(js, /webkitSpeechRecognition|SpeechRecognition/);
assert.doesNotMatch(js, /卡卡認字 Demo/);

assert.match(storage, /'hanzi-write'/);

const context = { window: {} };
vm.runInNewContext(data, context);
const chars = context.window.KAKA_HANZI_WRITE_CHARS;
const bank = context.window.KAKA_HANZI_WRITE_BANK;
const catalog = context.window.KAKA_HANZI_WRITE_LEVELS;
assert.ok(bank, '要有 KAKA_HANZI_WRITE_BANK');
assert.equal(catalog, bank, 'LEVELS 要 alias BANK');
assert.equal(bank.length, 12, '字庫要有十二關');

const titles = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const expected = [
  { id: 'xing', char: '星', gloss: '呢個係星星月亮嘅星', strokes: 9 },
  { id: 'yue', char: '月', gloss: '呢個係月亮嘅月', strokes: 4 },
  { id: 'yi', char: '一', gloss: '呢個係一二三嘅一', strokes: 1 },
  { id: 'da', char: '大', gloss: '呢個係大細嘅大', strokes: 3 },
  { id: 'xiao', char: '小', gloss: '呢個係大細嘅小', strokes: 3 },
  { id: 'huo', char: '火', gloss: '呢個係着火嘅火', strokes: 4 },
  { id: 'shan', char: '山', gloss: '呢個係高山嘅山', strokes: 3 },
  { id: 'tian', char: '天', gloss: '呢個係天空嘅天', strokes: 4 },
  { id: 'hua', char: '花', gloss: '呢個係一朵花嘅花', strokes: 7 },
  { id: 'yu', char: '雨', gloss: '呢個係落雨嘅雨', strokes: 8 },
  { id: 'feng', char: '風', gloss: '呢個係吹風嘅風', strokes: 9 },
  { id: 'tai', char: '太', gloss: '呢個係太陽嘅太', strokes: 4 },
];

for (const [i, want] of expected.entries()) {
  const level = bank[i];
  assert.equal(level.id, want.id, `第${i + 1}關 id`);
  assert.equal(level.char, want.char, `第${i + 1}關字`);
  assert.equal(level.say, want.char, `第${i + 1}關 say`);
  assert.equal(level.glossYue, want.gloss, `第${i + 1}關 glossYue`);
  assert.equal(level.title, `第${titles[i]}關`);
  assert.ok(level.hint, `${want.char} 要有 hint`);
  const glyph = chars[want.char];
  assert.ok(glyph, `要有繁體「${want.char}」筆順`);
  assert.equal(glyph.strokes.length, want.strokes, `${want.char} 筆畫數`);
  assert.ok(Array.isArray(glyph.medians), `${want.char} 要有 medians`);
  assert.equal(glyph.medians.length, want.strokes, `${want.char} median 對數`);
  for (const stroke of glyph.strokes) {
    assert.match(stroke, /^M /, `${want.char} stroke 要係 SVG path`);
  }
}

assert.ok(!('风' in chars), '唔好用簡體風');
assert.equal(bank[0].id, 'xing', '第一關保持 xing，唔斷舊進度');
assert.equal(bank[1].id, 'yue', '第二關保持 yue，唔斷舊進度');

console.log('test-hanzi-write-demo: ok');

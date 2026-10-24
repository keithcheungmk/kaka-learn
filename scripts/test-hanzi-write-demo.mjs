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

assert.match(index, /id="btn-topics-hanzi-write"/, '中文主題頁要有認字 Demo 入口');
assert.match(index, /hanzi-write-demo\.html/, '入口要連去獨立頁');
assert.match(index, /卡卡認字 Demo/);

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

assert.match(html, /你是誰？/);
assert.match(html, /開始冒險/);
assert.match(html, /寫「星」/);
assert.match(html, /米字格/);
assert.match(html, /再寫一次/);
assert.match(html, /下一個/);
assert.match(html, /過關啦！/);
assert.match(html, /下一關/);
assert.match(html, /返主頁/);
assert.match(html, /不會上傳/);
assert.match(html, /vendor\/hanzi-writer\/hanzi-writer\.min\.js/);
assert.match(html, /nav-back\.js/);
assert.match(html, /js\/storage\.js/);
assert.match(html, /profile-kaka\.jpg/);
assert.match(html, /profile-heihei\.jpg/);
assert.match(html, /href="index.html#screen-topics"/);
assert.doesNotMatch(html, /cdn\.jsdelivr|unpkg|googleapis/);
assert.doesNotMatch(html, /巴斯光年|Buzz|迪士尼|Disney|Lightyear/i);

assert.match(css, /100dvh/);
assert.match(css, /mizi-board/);
assert.match(css, /min-height: var\(--tap\)/);
assert.doesNotMatch(css, /min-height:\s*0/);

assert.match(js, /HanziWriter\.create/);
assert.match(js, /charDataLoader/);
assert.match(js, /earnCoinForMode/);
assert.match(js, /tryEarnStar/);
assert.match(js, /COIN_MODE = 'hanzi-write'/);
assert.match(js, /GUIDE_ORANGE = '#ff8a1a'/);
assert.match(js, /highlightColor: GUIDE_ORANGE/);
assert.match(js, /strokeColor: GUIDE_ORANGE/);
assert.match(js, /跟著橙色線/);
assert.match(js, /onMistake/);
assert.match(js, /RETRY_HINT = '再試一次。跟著橙色線寫。'/);
assert.match(js, /function onQuizMiss/);
assert.match(js, /goBackOr\(PARENT_HREF\)/);
assert.match(js, /btn-pass-home[\s\S]*goBackOr\(PARENT_HREF\)/);
assert.doesNotMatch(js, /outlineColor: '#d7c4b5'/);
assert.doesNotMatch(js, /radicalColor: '#c0392b'/);
assert.match(js, /setActiveProfile/);
assert.doesNotMatch(js, /https?:\/\//);
assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|FormData/);
assert.doesNotMatch(js, /webkitSpeechRecognition|SpeechRecognition/);

assert.match(storage, /'hanzi-write'/);

const context = { window: {} };
vm.runInNewContext(data, context);
const chars = context.window.KAKA_HANZI_WRITE_CHARS;
const catalog = context.window.KAKA_HANZI_WRITE_LEVELS;
assert.ok(chars['星'], '要有繁體「星」筆順');
assert.equal(chars['星'].strokes.length, 9);
assert.ok(Array.isArray(chars['星'].medians));
assert.equal(catalog[0].char, '星');
assert.ok(chars['月'], '下一關要有「月」');

console.log('test-hanzi-write-demo: ok');

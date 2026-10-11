#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const html = read('four-panel-story.html');
const css = read('css/four-panel-story.css');
const js = read('js/four-panel-story.js');
const dataSrc = read('data/four-panel-stories.js');
const index = read('index.html');
const familyHtml = read('family-storybook.html');
const familyJs = read('js/family-storybook.js');

assert.match(index, /id="btn-topics-four-panel"/, '中文主題頁要有四格講故事入口');
assert.match(index, /four-panel-story\.html/, '入口要連去獨立頁');
assert.doesNotMatch(familyHtml, /四格講故事/, '唔好混入中文故事填空頁');
assert.doesNotMatch(familyJs, /MediaRecorder|getUserMedia/, '填空故事唔好錄音');

const context = { window: {} };
vm.runInNewContext(dataSrc, context);
const levels = context.window.FOUR_PANEL_STORIES;
assert.equal(levels.length, 1, 'MVP 只開一本');
const book = levels[0];
assert.equal(book.id, 'rainbow-umbrella');
assert.equal(book.place, '回家路上');
assert.equal(book.startLabel, '點此兒開始');
assert.equal(book.prompt, '第一、然後、後來、最後，同我講個故事啦');
assert.equal(book.panels.length, 4, '每本固定四格');
assert.equal(book.panels.map((panel) => panel.beat).join('|'), '第一|然後|後來|最後');
assert.equal(
  book.panels.map((panel) => path.basename(panel.image)).join('|'),
  'rainbow-umbrella-p01.webp|rainbow-umbrella-p02.webp|rainbow-umbrella-p04.webp|rainbow-umbrella-p06.webp',
  '四格用 p01 落雨、p02 開傘、p04 水窪、p06 返屋企',
);
for (const panel of book.panels) {
  assert.ok(fs.existsSync(path.join(root, panel.image)), `${panel.image} 要存在`);
}
assert.match(book.modelStory, /第一.+然後.+後來.+最後/s, '示範故事要有四段時間詞');

assert.match(html, /錄音只留喺呢部機/, '要有本機錄音說明');
assert.match(html, /唔會上傳/, '要講明唔上傳');
assert.match(html, /講齊四格？/);
assert.match(html, /有然後／最後？/);
assert.match(html, /敢講完？/);
assert.match(html, /再錄一次/);
assert.match(html, /id="btn-record"/);
assert.match(html, /id="playback"/);
assert.match(html, /id="kid-panels"/);
assert.match(html, /id="kid-self"/);
assert.match(html, /我講齊喇/);
assert.match(html, /我講大聲/);
assert.match(html, /我講完喇/);
assert.match(html, /再講一次呀/);
assert.match(html, /小朋友話自己做到喇/);
assert.match(html, /js\/speech\.js/);
assert.ok(
  html.indexOf('id="playback"') < html.indexOf('id="kid-panels"')
    && html.indexOf('id="kid-panels"') < html.indexOf('id="kid-self"')
    && html.indexOf('id="kid-self"') < html.indexOf('id="model-box"')
    && html.indexOf('id="model-box"') < html.indexOf('id="parent-checks"'),
  '閉環評分要插喺回放同示範／家長／完成之間',
);
assert.match(js, /MediaRecorder/);
assert.match(js, /getUserMedia/);
assert.match(js, /tryEarnStar/);
assert.match(js, /markTopicPassed/);
assert.match(js, /bothSidesAgree/);
assert.match(js, /RETRY_LINE = '再講一次呀'/);
assert.match(js, /MAX_MS = 90 \* 1000/);
assert.match(html, /nav-back\.js/);
assert.match(html, /href="index.html#screen-topics"/);
assert.match(js, /leavePlay\(\)/);
assert.match(js, /goBackOr\('index\.html#screen-topics'\)/);
assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|FormData|webkitSpeechRecognition|SpeechRecognition/);
assert.doesNotMatch(js, /2\/5|五星|半星|half-star/);
assert.match(css, /overflow-y:\s*auto/, '講故事側欄可以內部捲，等示範同家長勾唔被剪走');
assert.match(css, /\.kid-panel-btn\.is-on/, '四格要撳得亮');
assert.match(css, /\.kid-self-btn\.is-on/, '自己檢查掣要撳得亮');

console.log('PASS: four-panel-story — 回家路上四格、本機錄音、小朋友自己檢查＋家長確認、獨立於填空故事。');

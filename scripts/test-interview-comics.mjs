#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const html = read('interview-comics.html');
const js = read('js/interview-comics.js');
const css = read('css/interview-comics.css');
const hub = read('common-sense.html');
const fourHtml = read('four-panel-story.html');
const fourJs = read('js/four-panel-story.js');
const index = read('index.html');

assert.match(hub, /interview-comics\.html/, '常識 hub 要連去面試四格');
assert.match(html, /← 常識/);
assert.match(html, /common-sense\.html/);
assert.match(html, /nav-back\.js/);
assert.doesNotMatch(html, /← 中文|中文樂園/);
assert.doesNotMatch(js, /← 中文|中文樂園|screen-topics/);
assert.match(js, /HUB_HREF = 'common-sense\.html'/);
assert.match(js, /goBackOr\(HUB_HREF\)/);
assert.match(js, /earnCoinForMode/);
assert.match(js, /onComicHit/);
assert.match(js, /is-preview/);
assert.match(js, /MediaRecorder/);
assert.match(js, /getUserMedia/);
assert.match(js, /bothSidesAgree/);
assert.match(js, /RETRY_LINE = '再講一次呀'/);
assert.match(js, /KakaInterviewComics/);
assert.doesNotMatch(js, /fetch\(|XMLHttpRequest|FormData|webkitSpeechRecognition|SpeechRecognition/);
assert.doesNotMatch(js, /2\/5|五星|半星|half-star/);
assert.match(css, /is-preview/);
assert.match(css, /html,\s*\nbody/);
assert.match(css, /background-color:\s*#eaf7ff/);
assert.match(css, /color-scheme:\s*light/);
assert.match(css, /height:\s*auto/);
assert.match(css, /#btn-prompt/);
assert.match(css, /flex-shrink:\s*0/);
assert.doesNotMatch(css, /\.cs-comics html/);
assert.doesNotMatch(css, /#090f30|#101a43/);
assert.match(html, /extend-box/);
assert.match(html, /id="btn-prompt"/);

const topicsStart = index.indexOf('id="screen-topics"');
const topics = topicsStart >= 0 ? index.slice(topicsStart) : '';
assert.doesNotMatch(topics, /interview-comics\.html/, '中文主題頁唔好放面試四格捷徑');
assert.match(fourHtml, /four-panel-story/);
assert.match(fourJs, /FOUR_PANEL_STORIES|rainbow-umbrella/);
assert.doesNotMatch(fourJs, /rain-no-umbrella/);

const context = { window: {} };
vm.runInNewContext(read('data/interview-comics.js'), context);
const levels = context.window.INTERVIEW_COMICS;
assert.equal(levels.length, 3);
assert.equal(levels.map((l) => l.id).join('|'), 'rain-no-umbrella|mtr-need-seat|park-ball-lost');
assert.equal(
  levels.map((l) => l.coinMode).join('|'),
  'common-sense-comic-rain|common-sense-comic-mtr|common-sense-comic-park',
);
for (const book of levels) {
  assert.equal(book.startLabel, '點此開始');
  assert.doesNotMatch(book.startLabel, /兒|儿/);
  assert.equal(book.panels.length, 4);
  assert.equal(book.panels.map((p) => p.beat).join('|'), '第一|然後|後來|最後');
  assert.match(book.modelStory, /第一.+然後.+後來.+最後/s);
  assert.ok(book.extendPrompt);
  assert.ok(book.extendHints.length >= 2);
  for (const panel of book.panels) {
    assert.ok(fs.existsSync(path.join(root, panel.image)), panel.image);
  }
}
assert.equal(context.window.INTERVIEW_COMICS_SOON.length, 3);

console.log('PASS: interview-comics — B1–B3 可玩、入口只喺常識 hub、重用錄音檢查、預覽撳格、獨立幣位。');

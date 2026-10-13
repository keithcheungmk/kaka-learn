#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const index = read('index.html');
const homeStart = index.indexOf('id="screen-home"');
const homeEnd = index.indexOf('</section>', homeStart);
const home = homeStart >= 0 ? index.slice(homeStart, homeEnd) : '';
const topicsStart = index.indexOf('id="screen-topics"');
const topics = topicsStart >= 0 ? index.slice(topicsStart) : '';
const html = read('common-sense.html');
const css = read('css/common-sense.css');
const js = read('js/common-sense.js');
const storage = read('js/storage.js');

assert.match(home, /id="btn-start-common-sense"/, '主頁要有常識頂層入口');
assert.match(home, /卡卡常識樂園/, '主頁卡名要係卡卡常識樂園');
assert.match(home, /common-sense\.html/, '主頁入口要連去獨立常識頁');
assert.match(home, /assets\/home-subjects\/common-sense\.webp/, '主頁常識卡要有插圖');
assert.doesNotMatch(topics, /卡卡常識樂園/, '常識唔可以掛喺中文主題頁');
assert.doesNotMatch(topics, /btn-start-common-sense/, '中文主題頁唔好放常識入口');

assert.match(html, /id="view-packs"/);
assert.match(html, /id="view-learn"/);
assert.match(html, /id="view-quiz"/);
assert.match(html, /id="view-finish"/);
assert.match(html, /開始答題/);
assert.match(html, /A · 社區小英雄/);
assert.match(html, /B · 面試四格/);
assert.match(html, /即將推出/);
assert.match(html, /href="index.html#screen-home"/);
assert.match(html, /id="btn-play-again"/);
assert.match(html, /再開一次/);
assert.match(html, /id="btn-back-packs"/);
assert.match(html, /nav-back\.js/);
assert.match(html, /js\/speech\.js/);
assert.match(html, /assets\/kaka-ranger-celebrate\.png/);
assert.doesNotMatch(html, /有講|稍後再講|拖一拖/);
assert.doesNotMatch(js, /draggable|ondrop|DragEvent|有講|稍後/);

assert.match(js, /earnCoinForMode/);
assert.match(js, /common-sense-heroes/);
assert.match(js, /已答啱/);
assert.match(js, /今輪玩完喇！攞到一個 AEON 幣！/);
assert.match(js, /HOME_HREF = 'index\.html#screen-home'/);
assert.match(js, /goBackOr\(HOME_HREF\)/);
assert.match(js, /btn-play-again[\s\S]{0,160}startQuiz/);
assert.doesNotMatch(js, /btn-play-again[\s\S]{0,160}goLearn/);
assert.match(storage, /EXTRA_COIN_MODES/);
assert.match(storage, /common-sense-heroes/);
assert.match(storage, /COIN_MODES = \['listen', 'match', 'build'\]/);

assert.match(css, /--answer-ink/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /min-height:\s*52px/);

const context = { window: {} };
vm.runInNewContext(read('data/common-sense-heroes.js'), context);
const pack = context.window.COMMON_SENSE_HEROES;
assert.equal(pack.packId, 'community-heroes');
assert.equal(pack.coinMode, 'common-sense-heroes');
assert.equal(pack.roundSize, 10);
assert.equal(pack.careers.length, 10);

const hanLen = (text) => (String(text || '').match(/[\u4e00-\u9fff]/g) || []).length;
const ids = pack.careers.map((c) => c.id);
assert.equal(
  ids.join('|'),
  'yisheng|hushi|xiaofangyuan|jingcha|laoshi_job|siji|chushi|youchai|shouhuoyuan|jiuhuyuan',
);

const doctor = pack.careers.find((c) => c.id === 'yisheng');
const medic = pack.careers.find((c) => c.id === 'jiuhuyuan');
const chef = pack.careers.find((c) => c.id === 'chushi');
const nurse = pack.careers.find((c) => c.id === 'hushi');
assert.match(chef.wallLine, /煮飯煮餸/);
assert.match(chef.correct, /煮飯煮餸/);
assert.match(chef.audio, /煮飯煮餸/);
assert.ok(nurse.wrong.some((w) => /煮飯煮餸/.test(w)), '護士錯選要用廚師煮飯煮餸');
assert.doesNotMatch(JSON.stringify(pack), /餾/);
assert.equal((JSON.stringify(pack).match(/煮餸/g) || []).length, 4);
assert.match(doctor.correct, /醫院/);
assert.match(doctor.correct, /睇症|醫/);
assert.match(medic.correct, /救護車/);
assert.ok(doctor.wrong.includes(medic.correct), '醫生題要用救護員職責做錯選');
assert.ok(medic.wrong.some((w) => /醫院/.test(w) && /睇症|醫病/.test(w)), '救護員題要用醫生職責做錯選');
assert.doesNotMatch(doctor.correct, /救護車/);
assert.doesNotMatch(medic.correct, /長期睇症|幫人睇症、醫好身體/);

for (const career of pack.careers) {
  assert.ok(fs.existsSync(path.join(root, career.image)), `${career.image} 要存在`);
  assert.equal(career.wrong.length, 3, `${career.name} 要有 3 個錯選`);
  const choices = [career.correct, ...career.wrong];
  for (const choice of choices) {
    const n = hanLen(choice);
    assert.ok(n >= 8 && n <= 16, `${career.name} 選項「${choice}」字數 ${n} 要喺 8–16`);
  }
  assert.ok(hanLen(career.audio) > hanLen(career.correct), `${career.name} 錄音稿要長過掣面`);
  assert.match(career.ask, /呢個係/);
  assert.match(career.ask, /做啲咩/);
}

assert.doesNotMatch(js, /揀一個職業再入/);
assert.match(js, /sampleRound|shuffle/);

console.log('PASS: common-sense — 主頁頂層入口、學習牆 10 職業、四選一加長選項、醫生≠救護員、10／10 幣。');

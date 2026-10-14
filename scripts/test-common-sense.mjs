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
const catalogSrc = read('data/common-sense-catalog.js');

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
assert.match(html, /id="learn-extras"/);
assert.match(html, /開始答題/);
assert.match(html, /即將推出/);
assert.match(html, /面試四格/);
assert.match(html, /href="index.html#screen-home"/);
assert.match(html, /id="btn-play-again"/);
assert.match(html, /再開一次/);
assert.match(html, /id="btn-back-packs"/);
assert.match(html, /nav-back\.js/);
assert.match(html, /js\/speech\.js/);
assert.match(html, /assets\/kaka-ranger-celebrate\.png/);
assert.match(html, /common-sense-catalog\.js/);
assert.match(catalogSrc, /interview-comics\.html/);
assert.doesNotMatch(html, /有講|稍後再講|拖一拖/);
assert.doesNotMatch(js, /draggable|ondrop|DragEvent|有講|稍後/);
assert.doesNotMatch(html, /返中文/);
assert.doesNotMatch(js, /返中文/);

assert.match(js, /earnCoinForMode/);
assert.match(js, /common-sense-heroes/);
assert.match(js, /已答啱/);
assert.match(js, /今輪玩完喇！攞到一個 AEON 幣！/);
assert.match(js, /今日已攞/);
assert.match(js, /HOME_HREF = 'index\.html#screen-home'/);
assert.match(js, /goBackOr\(HOME_HREF\)/);
assert.match(js, /next === 'finish'[\s\S]{0,180}← 學習牆/);
assert.match(js, /view === 'quiz' \|\| view === 'finish'/);
assert.match(js, /btn-play-again[\s\S]{0,160}startQuiz/);
assert.doesNotMatch(js, /btn-play-again[\s\S]{0,160}goLearn/);
assert.match(js, /btn-back-packs[\s\S]{0,80}goPacks/);
assert.match(js, /type === 'map'/);
assert.match(js, /type === 'process'/);
assert.match(storage, /EXTRA_COIN_MODES/);
assert.match(storage, /common-sense-heroes/);
assert.match(storage, /common-sense-transport/);
assert.match(storage, /common-sense-food/);
assert.match(storage, /common-sense-comic-rain/);
assert.match(storage, /COIN_MODES = \['listen', 'match', 'build'\]/);

assert.match(css, /--answer-ink/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /min-height:\s*52px/);
assert.match(css, /\.cs-map/);
assert.match(css, /\.cs-process/);
assert.match(html, /quiz-frame/);
assert.match(css, /\.quiz-frame/);
assert.match(css, /aspect-ratio:\s*4\s*\/\s*3/);
assert.match(css, /object-fit:\s*contain/);
assert.doesNotMatch(css, /\.quiz-hero img[\s\S]{0,180}object-fit:\s*cover/);
assert.match(css, /\.choice-speak/);
assert.match(js, /choice-speak/);
assert.match(js, /dataset\.answer/);
assert.match(js, /stopPropagation/);
assert.match(js, /speakBtn[\s\S]{0,220}speak\(text\)/);

const context = { window: {} };
vm.runInNewContext(catalogSrc, context);
for (const rel of [
  'data/common-sense-heroes.js',
  'data/common-sense-safe-outing.js',
  'data/common-sense-manners-hygiene.js',
  'data/common-sense-transport-hk.js',
  'data/common-sense-weather-seasons.js',
  'data/common-sense-festivals-hk.js',
  'data/common-sense-recycle-green.js',
  'data/common-sense-food-health.js',
]) {
  vm.runInNewContext(read(rel), context);
}

const catalog = context.window.COMMON_SENSE_CATALOG;
const packs = context.window.COMMON_SENSE_PACKS;
const playableA = [
  'community-heroes',
  'safe-outing',
  'manners-hygiene',
  'transport-hk',
  'weather-seasons',
  'festivals-hk',
  'recycle-green',
  'food-health',
];
const soonA = [
  'emotions',
  'animals-plants',
  'body-senses',
  'family-roles',
  'school-day',
  'time-sense',
  'color-shape-life',
];

const hanLen = (text) => (String(text || '').match(/[\u4e00-\u9fff]/g) || []).length;
const metaById = Object.fromEntries((catalog.packs || []).map((p) => [p.packId, p]));

for (const id of playableA) {
  assert.equal(metaById[id].status, 'playable', `${id} 要可玩`);
  const pack = packs[id];
  assert.ok(pack, `${id} 要有題庫`);
  assert.equal(pack.roundSize, 10);
  const items = pack.items || pack.careers || [];
  assert.equal(items.length, 10, `${id} 要有 10 個學習項`);
  assert.ok(pack.lifeAnchor?.title, `${id} 要有生活錨點`);
  assert.ok(pack.coinMode.startsWith('common-sense-'), `${id} 獨立 modeKey`);
  assert.match(storage, new RegExp(pack.coinMode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  for (const entry of items) {
    assert.ok(fs.existsSync(path.join(root, entry.image)), `${entry.image} 要存在`);
    if (id !== 'community-heroes' && !(id === 'manners-hygiene' && entry.id === 'morning')) {
      assert.match(entry.image, /assets\/common-sense\/scenes\/.+\.webp$/, `${id}/${entry.id} 答題圖要係 4:3 場景，唔好用抽象 icon`);
    }
    assert.equal(entry.wrong.length, 3, `${id}/${entry.id} 要有 3 個錯選`);
    for (const choice of [entry.correct, ...entry.wrong]) {
      const n = hanLen(choice);
      assert.ok(n >= 8 && n <= 16, `${id}/${entry.id} 「${choice}」字數 ${n} 要 8–16`);
    }
    assert.ok(hanLen(entry.audio) > hanLen(entry.correct), `${id}/${entry.id} 錄音稿要長過掣面`);
  }
}

for (const id of soonA) {
  assert.equal(metaById[id].status, 'soon', `${id} 通宵可灰`);
  assert.match(metaById[id].blurb, /即將推出/);
}

const comicsMeta = metaById['interview-comics'];
assert.equal(comicsMeta.status, 'playable');
assert.equal(comicsMeta.href, 'interview-comics.html');
assert.equal(comicsMeta.buttonId, 'btn-pack-comics');
assert.equal(metaById['community-heroes'].buttonId, 'btn-pack-heroes');

const heroes = packs['community-heroes'];
assert.equal(heroes.packId, 'community-heroes');
assert.equal(heroes.coinMode, 'common-sense-heroes');
const doctor = heroes.careers.find((c) => c.id === 'yisheng');
const medic = heroes.careers.find((c) => c.id === 'jiuhuyuan');
const chef = heroes.careers.find((c) => c.id === 'chushi');
const nurse = heroes.careers.find((c) => c.id === 'hushi');
assert.match(chef.wallLine, /煮飯煮餸/);
assert.match(chef.correct, /煮飯煮餸/);
assert.match(chef.audio, /煮飯煮餸/);
assert.ok(nurse.wrong.some((w) => /煮飯煮餸/.test(w)), '護士錯選要用廚師煮飯煮餸');
assert.doesNotMatch(JSON.stringify(heroes.careers), /餾/);
assert.equal((JSON.stringify(heroes.careers).match(/煮餸/g) || []).length, 4);
assert.match(doctor.correct, /醫院/);
assert.match(medic.correct, /救護車/);
assert.ok(doctor.wrong.includes(medic.correct));
assert.doesNotMatch(doctor.ask, /邊個係/);
assert.match(doctor.ask, /做啲咩/);

const transport = packs['transport-hk'];
const map = (transport.sections || []).find((s) => s.type === 'map');
assert.ok(map, 'P3 要有地圖區');
assert.equal(map.src, 'assets/common-sense/mtr-family-map.svg');
assert.ok(fs.existsSync(path.join(root, map.src)));
const pinNames = map.pins.map((p) => p.name).join('|');
assert.match(pinNames, /荃灣西/);
assert.match(pinNames, /馬鞍山/);
assert.match(pinNames, /沙田/);
assert.match(pinNames, /深水埗/);
assert.match(pinNames, /迪士尼/);
assert.match(pinNames, /尖沙咀/);
assert.match(pinNames, /旺角/);
assert.match(map.caption, /非官方/);
const asks = transport.items.map((i) => i.ask + i.correct).join('\n');
assert.match(asks, /荃灣西/);
assert.match(asks, /深水埗/);
assert.match(asks, /沙田/);
assert.match(asks, /馬鞍山/);
assert.match(asks, /迪士尼/);
assert.doesNotMatch(asks, /羅湖邊境站.*正確|正確定義/);

const food = packs['food-health'];
const process = (food.sections || []).find((s) => s.type === 'process');
assert.ok(process, 'P7 要有食物過程區');
assert.equal(process.strips.length, 2);
assert.equal(process.strips[0].title, '牛奶');
assert.equal(process.strips[1].title, '麵包');
for (const strip of process.strips) {
  assert.ok(strip.steps.length >= 2 && strip.steps.length <= 4);
  for (const step of strip.steps) {
    assert.ok(fs.existsSync(path.join(root, step.image)), step.image);
  }
}
const foodAsk = food.items.map((i) => i.ask + i.correct).join('\n');
assert.match(foodAsk, /牛奶/);
assert.match(foodAsk, /麵包|麵粉|小麥/);
assert.match(foodAsk, /洗手/);

assert.doesNotMatch(js, /揀一個職業再入/);
assert.match(js, /sampleRound|shuffle/);

console.log('PASS: common-sense — P0–P7 可玩、P3 地圖釘、P7 過程卡、P9 灰態、獨立 modeKey、8–16 字選項。');

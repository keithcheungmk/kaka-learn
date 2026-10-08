#!/usr/bin/env node
/**
 * 中文詞語牆普通話：每個一般主題詞語都要有預錄音同 manifest；普通話講法只可以寫俾存在嘅詞。
 * 用法：node scripts/test-chinese-mandarin.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const context = { window: {}, document: { createElement: () => ({}) }, console };
context.window = context;
vm.createContext(context);
vm.runInContext(read('js/words.js'), context);
vm.runInContext(read('js/words-mandarin.js'), context);
const W = context.KakaWords;
const M = context.KakaMandarin;

const manifest = JSON.parse(read('assets/chinese-mandarin/manifest.json'));
const excluded = new Set(manifest.excludedTopics);
const generalWords = new Map();
for (const topic of W.TOPICS.filter((t) => !excluded.has(t.id))) {
  for (const word of W.wordsForTopic(topic.id)) generalWords.set(word.id, word);
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('chinese mandarin tests');

test('紅輯／橙輯唔入第一期', () => {
  assert.deepEqual([...excluded].sort(), ['orange_series', 'red_series']);
});

test('每個一般主題詞語都有普通話錄音同 manifest', () => {
  const items = new Map(manifest.items.map((item) => [item.id, item]));
  assert.equal(items.size, manifest.items.length, 'manifest 有重複 id');
  for (const [id, word] of generalWords) {
    const item = items.get(id);
    assert.ok(item, `${id}（${word.term}）缺 manifest`);
    assert.equal(item.term, word.term, `${id} manifest 詞形過期，要重跑 build-chinese-mandarin-audio.py`);
    assert.equal(item.mandarinTerm, M.mandarinTerm(word), `${id} 普通話講法過期，要重跑錄音`);
    assert.equal(item.speech, M.speechText(word), `${id} 讀法過期，要重跑錄音`);
    const file = path.join(root, M.audioSrc(word));
    assert.ok(fs.existsSync(file), `${id} 缺 ${M.audioSrc(word)}`);
    assert.ok(fs.statSync(file).size <= 400000, `${id} 錄音超過 400KB`);
  }
  assert.equal(items.size, generalWords.size, 'manifest 有多餘詞語');
});

test('普通話講法／讀法只寫俾存在嘅一般詞語', () => {
  for (const id of [...Object.keys(M.MANDARIN_TERMS), ...Object.keys(M.SPEECH_ONLY)]) {
    assert.ok(generalWords.has(id), `${id} 唔係一般主題詞語`);
  }
  for (const [id, entry] of Object.entries(M.MANDARIN_TERMS)) {
    assert.notEqual(entry.cmn, generalWords.get(id).term, `${id} 普通話同原詞一樣，唔使列`);
    assert.match(entry.cmn, /^[\u4e00-\u9fff]+$/, `${id} 普通話詞要係純漢字`);
  }
});

test('常見粵普差異詞必須有普通話講法', () => {
  const required = {
    danche: '自行車', dishi: '出租車', xuegao: '冰淇淋', shuzai: '土豆',
    wuzi: '家', shuxiong: '考拉', qiyiguo: '獼猴桃', shan: '衣服',
  };
  for (const [id, cmn] of Object.entries(required)) assert.equal(M.mandarinTerm(generalWords.get(id)), cmn);
  assert.equal(M.differs(generalWords.get('bashi')), false, '巴士跟學校課本，唔改');
});

test('詞語牆有粵／普切換掣，普通話唔會靜靜用粵語 TTS 代替', () => {
  const html = read('index.html');
  assert.match(html, /data-chinese-voice="yue"/);
  assert.match(html, /data-chinese-voice="cmn"/);
  assert.ok(html.indexOf('js/words-mandarin.js') < html.indexOf('js/app.js'), 'words-mandarin.js 要喺 app.js 之前載入');
  const app = read('js/app.js');
  const playFn = app.slice(app.indexOf('function playMandarinWord'), app.indexOf('function playMandarinWord') + 900);
  assert.ok(playFn.length > 100, '缺 playMandarinWord');
  assert.ok(!/speakTerm|speakThen/.test(playFn), '普通話播放唔可以 fallback 去粵語 TTS');
});

console.log(`\n${passed} passed`);

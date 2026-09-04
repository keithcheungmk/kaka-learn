#!/usr/bin/env node
/**
 * storage.js 單元測試（P0-2 前安全網 + Profile 隔離）
 * 用法：node scripts/test-storage.mjs
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function makeLocalStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

function loadStorage() {
  const code = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
  const localStorage = makeLocalStorage();
  const context = {
    localStorage,
    window: {},
    console,
    Date,
    Math,
    JSON,
    setTimeout,
    clearTimeout,
  };
  vm.createContext(context);
  vm.runInContext(code, context);
  return { S: context.window.KakaStorage, localStorage };
}

function freshStorage() {
  const { S } = loadStorage();
  S.loadState(); // touch defaults
  return S;
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    throw err;
  }
}

console.log('storage.js tests');

test('舊資料遷移：冇 economyVersion → coinsTotal = floor(totalStars/10)，歸入卡卡', () => {
  const { S, localStorage } = loadStorage();
  localStorage.setItem(
    'kaka-learn-v1',
    JSON.stringify({
      pin: '1234',
      muted: false,
      deerFocus: true,
      totalStars: 47,
      starsToday: 3,
      starsDate: S.todayKey(),
      enabledWordIds: null,
      voiceURI: null,
      autoSpeak: true,
      coinHintSeen: false,
      coinsDate: S.todayKey(),
      coinsToday: {},
      coinsTotal: 0,
      roundProgress: {},
    }),
  );
  const state = S.loadState();
  assert.equal(state.coinsTotal, 4);
  assert.equal(state.economyVersion, 2);
  S.setActiveProfile('kaka');
  assert.equal(S.loadState().coinsTotal, 4);
  S.setActiveProfile('heihei');
  assert.equal(S.loadState().coinsTotal, 0);
  assert.equal(Object.keys(S.loadState().wordStats || {}).length, 0);
});

test('economyVersion 1 → 2：補 wordStats，coinsTotal 唔變', () => {
  const { S, localStorage } = loadStorage();
  localStorage.setItem(
    'kaka-learn-v1',
    JSON.stringify({
      pin: '1234',
      muted: false,
      deerFocus: true,
      totalStars: 10,
      starsToday: 0,
      starsDate: S.todayKey(),
      enabledWordIds: null,
      voiceURI: null,
      autoSpeak: true,
      coinHintSeen: false,
      coinsDate: S.todayKey(),
      coinsToday: { listen: 1 },
      coinsTotal: 7,
      roundProgress: { 'listen|animals|': ['gou'] },
      economyVersion: 1,
    }),
  );
  S.setActiveProfile('kaka');
  const state = S.loadState();
  assert.equal(state.coinsTotal, 7);
  assert.equal(state.economyVersion, 2);
  assert.ok(state.wordStats && typeof state.wordStats === 'object');
  assert.equal(state.coinsToday.listen, 1);
});

test('earnCoinForMode：同一玩法一日只派一次', () => {
  const S = freshStorage();
  S.setActiveProfile('kaka');
  const a = S.earnCoinForMode('listen');
  assert.equal(a.gained, true);
  assert.equal(a.state.coinsTotal, 1);
  const b = S.earnCoinForMode('listen');
  assert.equal(b.gained, false);
  assert.equal(b.already, true);
  assert.equal(b.state.coinsTotal, 1);
  const c = S.earnCoinForMode('match');
  assert.equal(c.gained, true);
  assert.equal(c.state.coinsTotal, 2);
});

test('recordWordResult：答錯清零 streak，答啱累積', () => {
  const S = freshStorage();
  S.recordWordResult('gou', true);
  S.recordWordResult('gou', true);
  let s = S.loadState().wordStats.gou;
  assert.equal(s.right, 2);
  assert.equal(s.streak, 2);
  S.recordWordResult('gou', false);
  s = S.loadState().wordStats.gou;
  assert.equal(s.wrong, 1);
  assert.equal(s.streak, 0);
  S.recordWordResult('gou', true);
  s = S.loadState().wordStats.gou;
  assert.equal(s.right, 3);
  assert.equal(s.streak, 1);
});

test('Phonics Phase 3A：認音／拼合／拆音分開記錄，recent 最多 10 次', () => {
  const S = freshStorage();
  S.setActiveProfile('kaka');
  S.recordPhonicsSkillResult('recognition', 'm', false);
  S.recordPhonicsSkillResult('recognition', 'm', true);
  S.recordPhonicsSkillResult('blending', 'ap_map', true);
  S.recordPhonicsSkillResult('segmenting', 'ap_map', false);
  for (let i = 0; i < 12; i += 1) S.recordPhonicsSkillResult('recognition', 'a', i % 2 === 0);

  const skills = S.loadState().phonicsSkillStats;
  assert.equal(skills.recognition.m.right, 1);
  assert.equal(skills.recognition.m.wrong, 1);
  assert.equal(skills.recognition.m.streak, 1);
  assert.equal(skills.blending.ap_map.right, 1);
  assert.equal(skills.segmenting.ap_map.wrong, 1);
  assert.equal(skills.recognition.a.recent.length, 10);
  assert.equal(skills.recognition.a.lastAttemptDay, S.todayKey());
});

test('Phonics Phase 3A：無效能力不寫入，舊 Profile 自動補空資料', () => {
  const { S, localStorage } = loadStorage();
  localStorage.setItem(
    'kaka-learn-v1',
    JSON.stringify({
      schemaVersion: 3,
      activeProfileId: 'kaka',
      profiles: { kaka: { totalStars: 5 }, heihei: {} },
    }),
  );
  let state = S.loadState();
  assert.equal(state.phonicsLearningVersion, 1);
  assert.deepEqual(Object.keys(state.phonicsSkillStats), ['recognition', 'blending', 'segmenting']);
  S.recordPhonicsSkillResult('not-a-skill', 'm', true);
  state = S.loadState();
  assert.equal(state.phonicsSkillStats['not-a-skill'], undefined);
});

test('summarizeMastery：識字同最需要練排序', () => {
  const S = freshStorage();
  S.recordWordResult('gou', false);
  S.recordWordResult('gou', false);
  S.recordWordResult('mao', true);
  S.recordWordResult('mao', true);
  S.recordWordResult('mao', true);
  const out = S.summarizeMastery(['gou', 'mao', 'yu']);
  assert.equal(out.mastered, 1);
  assert.equal(out.needPractice.length, 1);
  assert.equal(out.needPractice[0].id, 'gou');
});

test('resetStars：清空幣同 wordStats', () => {
  const S = freshStorage();
  S.tryEarnStar();
  S.earnCoinForMode('build');
  S.recordWordResult('gou', true);
  S.recordPhonicsSkillResult('recognition', 'm', true);
  const next = S.resetStars();
  assert.equal(next.coinsTotal, 0);
  assert.equal(next.totalStars, 0);
  assert.equal(Object.keys(next.wordStats).length, 0);
  assert.equal(Object.keys(next.phonicsSkillStats.recognition).length, 0);
});

test('Profile 隔離：卡卡賺幣唔入禧禧', () => {
  const S = freshStorage();
  S.setActiveProfile('kaka');
  S.earnCoinForMode('listen');
  S.recordWordResult('gou', false);
  S.markTopicPassed('zoo');
  assert.equal(S.loadState().coinsTotal, 1);
  assert.equal(S.isKeyPassed('zoo'), true);

  S.setActiveProfile('heihei');
  assert.equal(S.loadState().coinsTotal, 0);
  assert.equal(S.loadState().wordStats.gou, undefined);
  assert.equal(S.isKeyPassed('zoo'), false);
  S.earnCoinForMode('match');
  assert.equal(S.loadState().coinsTotal, 1);

  S.setActiveProfile('kaka');
  assert.equal(S.loadState().coinsTotal, 1);
  assert.equal(S.loadState().coinsToday.listen, 1);
  assert.equal(S.loadState().coinsToday.match || 0, 0);
  assert.equal(S.loadState().wordStats.gou.wrong, 1);
});

test('Phonics Phase 3A：卡卡／禧禧能力紀錄完全隔離', () => {
  const S = freshStorage();
  S.setActiveProfile('kaka');
  S.recordPhonicsSkillResult('recognition', 'm', true);
  S.recordPhonicsSkillResult('blending', 'ap_map', false);

  S.setActiveProfile('heihei');
  assert.equal(S.loadState().phonicsSkillStats.recognition.m, undefined);
  assert.equal(S.loadState().phonicsSkillStats.blending.ap_map, undefined);
  S.recordPhonicsSkillResult('segmenting', 'ap_map', true);

  S.setActiveProfile('kaka');
  assert.equal(S.loadState().phonicsSkillStats.segmenting.ap_map, undefined);
  assert.equal(S.loadState().phonicsSkillStats.recognition.m.right, 1);
});

test('Profile 選擇重新載入後保留，兩邊輪次進度唔互串', () => {
  const { S, localStorage } = loadStorage();
  S.setActiveProfile('heihei');
  S.saveRoundProgress('listen|zoo|', ['gou', 'mao']);
  const saved = localStorage.getItem('kaka-learn-v1');

  const reloaded = loadStorage();
  reloaded.localStorage.setItem('kaka-learn-v1', saved);
  assert.equal(reloaded.S.getActiveProfileId(), 'heihei');
  assert.deepEqual([...reloaded.S.loadRoundProgress('listen|zoo|')], ['gou', 'mao']);

  reloaded.S.setActiveProfile('kaka');
  assert.deepEqual([...reloaded.S.loadRoundProgress('listen|zoo|')], []);
  reloaded.S.saveRoundProgress('listen|zoo|', ['yu']);
  reloaded.S.setActiveProfile('heihei');
  assert.deepEqual([...reloaded.S.loadRoundProgress('listen|zoo|')], ['gou', 'mao']);
});

test('Profile root 正規化：缺欄位會補預設，未知欄位唔污染資料', () => {
  const { S, localStorage } = loadStorage();
  localStorage.setItem(
    'kaka-learn-v1',
    JSON.stringify({
      schemaVersion: 3,
      activeProfileId: 'heihei',
      profiles: {
        kaka: { totalStars: 12, unexpected: 'drop-me' },
        heihei: { coinsTotal: 4, wordStats: null },
      },
    }),
  );
  const state = S.loadState();
  assert.equal(S.getActiveProfileId(), 'heihei');
  assert.equal(state.coinsTotal, 4);
  assert.deepEqual(Object.keys(state.wordStats), []);
  assert.deepEqual(Object.keys(state.phonicsSkillStats), ['recognition', 'blending', 'segmenting']);
  assert.equal(state.unexpected, undefined);
  S.setActiveProfile('kaka');
  assert.equal(S.loadState().totalStars, 12);
});

test('損壞 localStorage：安全重設而唔拋錯', () => {
  const { S, localStorage } = loadStorage();
  localStorage.setItem('kaka-learn-v1', '{not-json');
  assert.doesNotThrow(() => S.loadState());
  assert.equal(S.loadState().totalStars, 0);
  assert.equal(S.hasActiveProfile(), false);
});

test('coinLog：派幣寫入今日，歷史骨架有 14 日', () => {
  const S = freshStorage();
  S.setActiveProfile('kaka');
  S.earnCoinForMode('listen');
  S.earnCoinForMode('build');
  const hist = S.coinHistory(14);
  assert.equal(hist.length, 14);
  assert.equal(hist[13].isToday, true);
  assert.equal(hist[13].count, 2);
  assert.equal(hist[0].count, 0);
});

console.log(`\n${passed} passed`);
process.exit(0);

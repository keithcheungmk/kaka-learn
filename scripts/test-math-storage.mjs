#!/usr/bin/env node
/** math-storage.js 單元測試：舊資料遷移、Profile 持久化及隔離。 */
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
  };
}

function loadMathStorage() {
  const code = fs.readFileSync(path.join(root, 'js/math-storage.js'), 'utf8');
  const localStorage = makeLocalStorage();
  const context = { localStorage, window: {}, console, Date, JSON };
  vm.createContext(context);
  vm.runInContext(code, context);
  return { S: context.window.KakaMathStorage, localStorage };
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

console.log('math-storage.js tests');

test('舊單一資料歸入卡卡，禧禧由零開始', () => {
  const { S, localStorage } = loadMathStorage();
  localStorage.setItem(
    'kaka-math-v1',
    JSON.stringify({
      starsToday: 6,
      totalStars: 42,
      starsDate: S.todayKey(),
      currentPlanetId: 'compare-qty',
      litPlanetIds: ['count'],
      interviewUnlocked: true,
    }),
  );
  assert.equal(S.loadState().totalStars, 42);
  assert.deepEqual([...S.loadState().litPlanetIds], ['count']);
  S.setActiveProfile('heihei');
  assert.equal(S.loadState().totalStars, 0);
  assert.deepEqual([...S.loadState().litPlanetIds], []);
});

test('Profile 選擇重新載入後保留', () => {
  const { S, localStorage } = loadMathStorage();
  S.setActiveProfile('heihei');
  S.tryEarnStar();
  S.lightPlanet('count');
  const saved = localStorage.getItem('kaka-math-v1');

  const reloaded = loadMathStorage();
  reloaded.localStorage.setItem('kaka-math-v1', saved);
  assert.equal(reloaded.S.loadState().totalStars, 1);
  assert.deepEqual([...reloaded.S.loadState().litPlanetIds], ['count']);
});

test('卡卡／禧禧數理進度完全隔離', () => {
  const { S } = loadMathStorage();
  S.setActiveProfile('kaka');
  S.tryEarnStar();
  S.lightPlanet('count');
  S.setActiveProfile('heihei');
  S.tryEarnStar();
  S.tryEarnStar();
  S.lightPlanet('compare-qty');
  assert.equal(S.loadState().totalStars, 2);
  assert.deepEqual([...S.loadState().litPlanetIds], ['compare-qty']);
  S.setActiveProfile('kaka');
  assert.equal(S.loadState().totalStars, 1);
  assert.deepEqual([...S.loadState().litPlanetIds], ['count']);
});

test('損壞資料會安全重設', () => {
  const { S, localStorage } = loadMathStorage();
  localStorage.setItem('kaka-math-v1', 'broken-json');
  assert.doesNotThrow(() => S.loadState());
  assert.equal(S.loadState().totalStars, 0);
});

console.log(`\n${passed} passed`);

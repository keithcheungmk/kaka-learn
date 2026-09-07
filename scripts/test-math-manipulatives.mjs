#!/usr/bin/env node
/** math-manipulatives.js：board spec、狀態機、邊界。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/math-manipulatives.js'), 'utf8');
const context = { window: {}, Math, Date, Error, Map, Set, document: null };
vm.createContext(context);
vm.runInContext(code, context);
const M = context.window.KakaMathManipulatives;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('math-manipulatives.js tests');

test('createBoard 確保 available >= target + 2', () => {
  const b = M.createBoard({ target: 3, available: 4 });
  assert.equal(b.target, 3);
  assert.equal(b.available, 5);
  assert.equal(b.pieces.length, 5);
  assert.equal(new Set(b.pieces.map((p) => p.emoji)).size, 1);
});

test('place → 滿 → complete；invalid full 唔改 count', () => {
  const spec = M.createBoard({ target: 2, available: 4, emoji: '⭐' });
  const s = M.createBoardState(spec);
  const first = s.placeFromPool(spec.pieces[0].id);
  assert.equal(first.ok, true);
  assert.equal(first.count, 1);
  assert.equal(first.complete, false);
  const second = s.placeFromPool(spec.pieces[1].id);
  assert.equal(second.complete, true);
  const third = s.placeFromPool(spec.pieces[2].id);
  assert.equal(third.ok, false);
  assert.equal(third.reason, 'full');
  assert.equal(s.filledCount(), 2);
});

test('同一 id 唔可以同時喺 pool 同 slot', () => {
  const spec = M.createBoard({ target: 3, available: 5, emoji: '💎' });
  const s = M.createBoardState(spec);
  const id = spec.pieces[0].id;
  s.placeFromPool(id);
  assert.equal(s.locate(id).home, 'slot');
  assert.equal(s.pool.includes(id), false);
  s.returnToPool(id);
  assert.equal(s.locate(id).home, 'pool');
  assert.equal(s.slots.includes(id), false);
});

test('returnToPool 後可以再 place', () => {
  const spec = M.createBoard({ target: 2, available: 4, emoji: '🔥' });
  const s = M.createBoardState(spec);
  const id = spec.pieces[0].id;
  s.placeFromPool(id);
  s.returnToPool(id);
  const again = s.placeFromPool(id);
  assert.equal(again.ok, true);
  assert.equal(again.count, 1);
});

test('prefersReducedMotion 喺無 matchMedia 時回 false', () => {
  assert.equal(M.prefersReducedMotion(), false);
});

test('MATH_EMOJI_SETS 每組至少一個 emoji', () => {
  Object.entries(M.MATH_EMOJI_SETS).forEach(([key, list]) => {
    assert(list.length >= 1, `${key} empty`);
  });
});

console.log(`\n${passed} passed`);

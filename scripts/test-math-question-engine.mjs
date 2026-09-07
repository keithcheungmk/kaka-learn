#!/usr/bin/env node
/** 水星數感題目引擎：題型覆蓋、答案邊界及錯因。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/math-question-engine.js'), 'utf8');
const context = { window: {}, Math, Date, Error, Set };
vm.createContext(context);
vm.runInContext(code, context);
const Q = context.window.KakaMathQuestionEngine;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('math-question-engine.js tests');

test('每輪固定六題並覆蓋五種核心數感', () => {
  const mission = Q.generateMission({ random: () => 0.42 });
  assert.equal(mission.length, 6);
  assert.deepEqual([...new Set(mission.map((q) => q.type))].sort(),
    ['conservation', 'numberMatch', 'oneMoreLess', 'oneToOne', 'subitize'].sort());
});

test('連續生成一千輪全部答案和選項都在 0 至 10', () => {
  for (let i = 0; i < 1000; i += 1) {
    Q.generateMission().forEach((q) => {
      assert(q.answer >= 0 && q.answer <= 10);
      assert.equal(q.options.length, 3);
      assert.equal(new Set(q.options).size, 3);
      assert(q.options.includes(q.answer));
      q.options.forEach((n) => assert(n >= 0 && n <= 10));
      if (q.type === 'subitize') assert(q.answer <= 5);
    });
  }
});

test('多一少一不會超出 0 至 10', () => {
  for (const random of [() => 0, () => 0.999999]) {
    const q = Q.makeQuestion('oneMoreLess', random);
    assert(q.shown >= 0 && q.shown <= 10);
    assert(q.answer >= 0 && q.answer <= 10);
  }
});

test('錯一個分類為 offByOne，守恆錯誤有專屬分類', () => {
  const count = Q.makeQuestion('oneToOne', () => 0.3);
  assert.equal(Q.classifyError(count, count.answer + 1), 'offByOne');
  const conservation = Q.makeQuestion('conservation', () => 0.3);
  assert.equal(Q.classifyError(conservation, conservation.answer + 2), 'quantityConservation');
});

test('第二次提示比第一次更具體', () => {
  const q = Q.makeQuestion('oneMoreLess', () => 0.2);
  assert.notEqual(Q.hintFor(q, 1), Q.hintFor(q, 2));
});

console.log(`\n${passed} passed`);

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'js/math-number-line-data.js'), 'utf8');
const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(source, context);
const D = context.window.KakaMathNumberLineData;
assert.ok(D, 'data module missing');

function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

for (let i = 0; i < 1000; i += 1) {
  const random = seeded(i + 1);
  const mission = D.generateMission({ random, mode: i % 3 === 0 ? 'first' : 'replay' });
  assert.equal(mission.length, 10, `mission length ${mission.length}`);
  assert.equal(mission[0].type, 'position');
  assert.equal(mission[1].type, 'order');
  assert.equal(mission[2].type, 'measure');
  assert.equal(mission[3].type, 'move');
  assert.equal(mission[3].direction, 'right');
  assert.equal(mission[4].type, 'move');
  assert.equal(mission[4].direction, 'left');
  assert.equal(mission[5].type, 'compose');
  assert.equal(mission[6].type, 'compose');
  assert.equal(mission[5].goal, mission[6].goal);
  assert.equal(mission[7].type, 'makeTen');
  assert.ok(mission[7].start >= 5 && mission[7].start <= 7);
  assert.equal(mission[8].type, 'makeTen');
  assert.ok(mission[8].start === 8 || mission[8].start === 9);
  assert.equal(mission[9].type, 'inverse');
  assert.equal(mission[9].target, mission[8].start);
  assert.equal(mission[9].distance, mission[8].distance);

  mission.forEach((q) => {
    if (Number.isInteger(q.start)) assert.ok(q.start >= 0 && q.start <= 10);
    if (Number.isInteger(q.target)) assert.ok(q.target >= 0 && q.target <= 10);
    if (Number.isInteger(q.goal)) assert.ok(q.goal >= 0 && q.goal <= 10);
    if (q.type === 'move') {
      const expected = q.direction === 'right' ? q.start + q.distance : q.start - q.distance;
      assert.equal(q.target, expected);
      assert.ok(q.target >= 0 && q.target <= 10);
    }
  });

  // validate helpers
  const q3 = mission[2];
  assert.equal(D.validateAnswer(q3, { marker: q3.target, distanceChoice: q3.distance }).ok, true);
  assert.equal(D.validateAnswer(q3, { marker: q3.target, distanceChoice: q3.distance + 1 }).ok, false);

  const q4 = mission[3];
  assert.equal(D.validateAnswer(q4, { marker: q4.target }).ok, true);
  assert.equal(D.validateAnswer(q4, { marker: q4.start }).ok, false);

  const goal = mission[5].goal;
  const stop = Math.max(1, Math.floor(goal / 2));
  assert.equal(D.validateAnswer(mission[5], { firstStop: stop, marker: goal }).ok, true);
  assert.equal(D.validateAnswer(mission[5], { firstStop: stop, marker: goal - 1 }).ok, false);
  assert.equal(D.validateAnswer(mission[5], { firstStop: stop, marker: goal + 1 }).ok, false);

  mission[6].forbiddenStop = stop;
  const other = stop === 1 ? 2 : 1;
  if (other < goal) {
    assert.equal(D.validateAnswer(mission[6], { firstStop: stop, marker: goal }).ok, false);
    assert.equal(D.validateAnswer(mission[6], { firstStop: other, marker: goal }).ok, true);
  }

  assert.equal(D.validateAnswer(mission[8], { marker: 10, distanceChoice: mission[8].distance }).ok, true);
  assert.equal(D.validateAnswer(mission[9], { marker: mission[9].target }).ok, true);
}

// step count sanity: start not counted as first step
const move = { type: 'move', start: 2, distance: 3, direction: 'right', target: 5, skillId: 'x', spokenCorrect: '' };
assert.equal(D.validateAnswer(move, { marker: 5 }).ok, true);
assert.equal(D.validateAnswer(move, { marker: 4 }).ok, false);

console.log('test-math-number-line: ok');

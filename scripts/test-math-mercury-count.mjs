import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataSource = fs.readFileSync(path.join(root, 'js/math-mercury-count-data.js'), 'utf8');
const gameSource = fs.readFileSync(path.join(root, 'js/math-mercury-count-game.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'js/math-app.js'), 'utf8');
const skillSource = fs.readFileSync(path.join(root, 'js/math-skills.js'), 'utf8');
const context = { window: {}, console, Math, RangeError };
vm.createContext(context);
vm.runInContext(dataSource, context);
const D = context.window.KakaMathMercuryCountData;
assert.ok(D, 'Mercury quantity-count data module should initialize');

function seeded(seed) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

assert.deepEqual([...D.LEARN_STEPS.map((step) => step.count)], [1, 2, 3]);
assert.equal(D.stageForCompletedRounds(0).max, 3);
assert.equal(D.stageForCompletedRounds(0).skillId, 'count.oneToOne.1to5');
assert.equal(D.stageForCompletedRounds(1).max, 5);
assert.equal(D.stageForCompletedRounds(1).skillId, 'count.oneToOne.1to5');
assert.equal(D.stageForCompletedRounds(3).max, 10);
assert.equal(D.stageForCompletedRounds(3).skillId, 'count.oneToOne.1to10');
assert.equal(D.completedRoundsFromState({ numberRelationsProgress: { completedRounds: 12 } }), 0,
  'legacy number-line progress must not skip the new beginner counting stage');
assert.equal(D.completedRoundsFromState({ mercuryCountProgress: { completedRounds: 2 } }), 2);
assert.equal(D.completedRoundsFromState({ mercuryCountProgress: { completedRounds: -1 } }), 0);
assert.throws(() => D.makeQuestion({ count: 0, max: 3 }), RangeError);

for (const completedRounds of [0, 1, 3]) {
  const expectedMax = D.stageForCompletedRounds(completedRounds).max;
  for (let seed = 1; seed <= 250; seed += 1) {
    const mission = D.generateMission({ completedRounds, random: seeded(seed) });
    assert.equal(mission.length, 5);
    mission.forEach((question) => {
      assert.equal(question.type, 'count-objects');
      assert.ok(question.count >= 1 && question.count <= expectedMax);
      assert.equal(question.answer, question.count);
      assert.equal(question.choices.length, 3);
      assert.equal(new Set(question.choices).size, 3);
      assert.ok(question.choices.includes(question.answer), 'answer must always be present');
      assert.ok(question.choices.every((choice) => choice >= 1 && choice <= expectedMax));
      assert.match(question.prompt, new RegExp(question.object.name));
      assert.match(question.speak, new RegExp(question.object.name));
      assert.ok(question.spokenCorrect.includes(question.object.name));
    });
  }
}

const skillsContext = { window: {}, console };
vm.createContext(skillsContext);
vm.runInContext(skillSource, skillsContext);
const planetIds = skillsContext.window.KakaMathSkills.MATH_PLANETS.map((planet) => planet.id);
assert.deepEqual([...planetIds], ['number-relations', 'time', 'compare-size', 'moon']);
assert.doesNotMatch(appSource, /window\.KakaNumberBondsGame\.init/);
assert.doesNotMatch(appSource, /window\.KakaMathNumberLineGame/);
assert.match(gameSource, /value !== question\.answer/);
assert.match(gameSource, /busy = false;\s*setChoiceButtonsDisabled\(false\)/);
assert.match(gameSource, /再數一次。逐粒由一開始，慢慢數就得。/);
assert.match(gameSource, /next\.disabled = true/);
assert.match(gameSource, /speak\(question\.spokenCorrect/);
assert.doesNotMatch(gameSource, /spokenCorrect.*?setTimeout\(advance/s);

console.log('test-math-mercury-count: ok');

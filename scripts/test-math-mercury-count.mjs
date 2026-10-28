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
for (const step of D.LEARN_STEPS) {
  assert.ok(step.prompt.includes(step.object.name));
  assert.ok(step.speak.includes(step.object.name));
}
assert.equal(D.stageForCompletedRounds(0).max, 10);
assert.equal(D.stageForCompletedRounds(0).min, 5);
assert.equal(D.stageForCompletedRounds(1).max, 15);
assert.equal(D.stageForCompletedRounds(3).max, 20);
assert.equal(D.stageForCompletedRounds(3).skillId, 'count.oneToOne.1to20');
assert.equal(D.completedRoundsFromState({ numberRelationsProgress: { completedRounds: 12 } }), 0,
  'legacy number-line progress must not skip the new beginner counting stage');
assert.equal(D.completedRoundsFromState({ mercuryCountProgress: { completedRounds: 2 } }), 2);
assert.equal(D.completedRoundsFromState({ mercuryCountProgress: { completedRounds: -1 } }), 0);
assert.throws(() => D.makeQuestion({ count: 0, max: 3 }), RangeError);

for (const completedRounds of [0, 1, 3]) {
  const expectedMax = D.stageForCompletedRounds(completedRounds).max;
  for (let seed = 1; seed <= 250; seed += 1) {
    const mission = D.generateMission({ completedRounds, random: seeded(seed) });
    assert.equal(mission.length, 10);
    mission.forEach((question) => {
      assert.equal(question.type, 'count-objects');
      assert.ok(question.count >= 5 && question.count <= expectedMax);
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
assert.match(gameSource, /一齊五個一組數/);
assert.match(gameSource, /next\.disabled = true/);
assert.match(gameSource, /speak\(question\.spokenCorrect/);
assert.doesNotMatch(gameSource, /spokenCorrect.*?setTimeout\(advance/s);

// A partial group must never claim it contains five objects.
class FakeElement {
  constructor() { this.children = []; this.attributes = {}; this.listeners = {}; this.classList = { add() {}, remove() {} }; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; }
  addEventListener(type, listener) { this.listeners[type] = listener; }
  querySelectorAll() { return this.children; }
}
const elements = new Map();
context.document = {
  getElementById(id) { if (!elements.has(id)) elements.set(id, new FakeElement()); return elements.get(id); },
  createElement() { return new FakeElement(); },
};
context.setTimeout = () => 0;
vm.runInContext(gameSource, context);
D.generateMission = () => [D.makeQuestion({ count: 14, max: 20 })];
let speechDone;
context.window.KakaMathMercuryCountGame.init({
  showMathScreen() {}, isMuted: () => false,
  speech: { speakThen(_text, _options, done) { speechDone = done; } },
});
context.window.KakaMathMercuryCountGame.openMission();
const groups = elements.get('math-relations-line').children;
assert.deepEqual(groups.map((group) => group.children[0].textContent), ['一組 5 個', '一組 5 個', '剩低嗰組']);
assert.deepEqual(groups.map((group) => group.children.length - 1), [5, 5, 4]);
const choices = elements.get('math-relations-distance-choices').children;
const wrongChoice = choices.find((choice) => choice.textContent !== '14');
wrongChoice.listeners.click();
assert.ok(choices.every((choice) => choice.disabled), 'choices stay disabled while counting aloud');
speechDone();
assert.ok(choices.every((choice) => !choice.disabled), 'choices become available after the explanation');
const correctChoice = choices.find((choice) => choice.textContent === '14');
correctChoice.listeners.click();
assert.ok(choices.filter((choice) => choice !== correctChoice).every((choice) => choice.hidden), 'wrong choices leave room for feedback');
assert.equal(elements.get('btn-math-relations-explain-next').disabled, true);
speechDone();
assert.equal(elements.get('btn-math-relations-explain-next').disabled, false, 'next is enabled after spoken feedback');

console.log('test-math-mercury-count: ok');

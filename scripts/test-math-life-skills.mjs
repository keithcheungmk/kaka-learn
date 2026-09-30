import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const context = { window: {}, console, Math, RangeError };
vm.createContext(context);
vm.runInContext(read('js/math-life-skills-data.js'), context);
const data = context.window.KakaMathLifeSkillsData;
assert.deepEqual([...data.ACTIVITIES.map(({ id }) => id)], ['quantity-compare', 'number-bonds', 'shape-patterns', 'little-shop', 'measure-compare']);
assert.equal(data.SHAPES.length, 10);
assert.ok(data.ACTIVITIES.every((activity) => activity.planet && activity.skillId && activity.subtitle));

function seeded(seed) {
  let value = seed % 2147483647; if (value <= 0) value += 2147483646;
  return () => { value = value * 16807 % 2147483647; return (value - 1) / 2147483646; };
}
for (const activity of data.ACTIVITIES) {
  for (let seed = 1; seed <= 200; seed += 1) {
    const mission = data.makeMission(activity.id, { random: seeded(seed) });
    assert.equal(mission.length, 5);
    mission.forEach((question, index) => {
      assert.equal(question.round, index); assert.equal(question.activityId, activity.id);
      assert.equal(question.skillId, activity.skillId);
      assert.ok(question.choices.length >= 2 && question.choices.some((choice) => String(choice.id) === String(question.answer)), `${activity.id} has valid answer`);
      assert.ok(question.prompt && question.explain, `${activity.id} has clear child-facing copy`);
      if (question.kind === 'compare') {
        assert.ok(question.left >= 2 && question.left <= (index < 2 ? 5 : 10));
        assert.ok(question.right >= 1 && question.right <= (index < 2 ? 5 : 10));
        assert.equal(question.answer, question.left === question.right ? 'same' : question.left > question.right ? 'left' : 'right');
      }
      if (question.kind === 'bonds') {
        assert.ok(question.total === 5 || question.total === 10 || (question.total >= 5 && question.total <= 10));
        assert.ok(question.part >= 1 && question.part < question.total);
        assert.equal(question.part + Number(question.answer), question.total);
        assert.ok(question.choices.every((choice) => String(Number(choice.id)) === choice.id), 'bond answers are one missing quantity, not competing valid equations');
      }
      if (question.kind === 'shape' || question.kind === 'pattern') assert.ok(question.choices.every((choice) => data.SHAPES.some((shape) => shape.id === choice.id)));
      if (question.kind === 'shop') {
        assert.ok(question.price >= 2 && question.wallet >= 1 && question.wallet <= 10);
        assert.equal(question.answer, question.wallet >= question.price ? 'enough' : 'more');
      }
      if (question.kind === 'measure') {
        assert.ok(['長短', '輕重', '水量'].includes(question.attribute));
        assert.equal(question.answer, question.left === question.right ? 'same' : question.left > question.right ? 'left' : 'right');
      }
    });
  }
}
const shapeMission = data.makeMission('shape-patterns', { random: seeded(24) });
assert.deepEqual([...shapeMission.map((q) => q.kind)], ['shape', 'shape', 'shape', 'pattern', 'pattern']);
assert.throws(() => data.makeMission('retired-planet'), RangeError);
assert.match(read('index.html'), /id="math-extra-mission-grid"/);
assert.match(read('index.html'), /id="screen-math-life-skill"/);
assert.match(read('js/math-app.js'), /KakaMathLifeSkillsGame\.init/);
assert.match(read('js/math-life-skills-game.js'), /speakThen\(`答啱喇！\$\{question\.explain\}/, 'spoken explanation precedes enabling the next question');
assert.match(read('js/math-life-skills-game.js'), /function selectCompareItem/);
assert.match(read('js/math-life-skills-game.js'), /math-life-answer-number/);
assert.match(read('js/math-life-skills-game.js'), /question\.part/);
assert.match(read('css/math.css'), /\.math-life-ten-cell\.is-empty/);
assert.match(read('index.html'), /class="math-life-skill-answer-panel"/);
assert.match(read('index.html'), /math-life-skill-board-wrap/);
assert.match(read('css/math.css'), /grid-template-areas: "header header" "planet planet" "prompt prompt" "board answers"/);
assert.match(read('css/math.css'), /:has\(#screen-math-life-skill\.active\)/, 'new math screens opt out of clipped fixed-height canvas');
console.log('test-math-life-skills: ok');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const context = { window: {}, Math, RangeError };
vm.createContext(context);
vm.runInContext(read('js/math-strategies-data.js'), context);
const data = context.window.KakaMathStrategiesData;
assert.deepEqual([...data.METHODS.map(({ id }) => id)], ['make-ten', 'break-ten', 'flat-ten', 'think-add-subtract']);

function seeded(seed) {
  let value = seed % 2147483647; if (value <= 0) value += 2147483646;
  return () => { value = value * 16807 % 2147483647; return (value - 1) / 2147483647; };
}

for (const method of data.METHODS) {
  for (let seed = 1; seed <= 200; seed += 1) {
    const rounds = data.makeRound(method.id, { random: seeded(seed) });
    assert.equal(rounds.length, 10, `${method.id} has a full ten-question round`);
    assert.equal(new Set(rounds.map(({ a, b }) => `${a}:${b}`)).size, 10, `${method.id} questions are unique`);
    rounds.forEach((question, index) => {
      assert.equal(question.round, index);
      assert.equal(question.methodId, method.id);
      assert.ok(question.steps.length >= 3 && question.explanation && question.prompt);
      assert.ok(question.concretePrompt && question.emoji && question.itemName && question.measure, 'each prompt is grounded in a countable fruit scene');
      assert.ok(question.a >= 0 && question.a <= 20 && question.b >= 0 && question.b <= 20 && question.answer >= 0 && question.answer <= 20);
      if (method.id === 'make-ten') {
        assert.equal(question.equation, `${question.a}＋${question.b}＝？`);
        assert.ok(question.a + question.b > 10 && question.a + question.b <= 18, 'make-ten uses carrying addition within 20');
      } else {
        assert.equal(question.equation, `${question.a}－${question.b}＝？`);
        assert.ok(question.a >= 11 && question.a <= 19 && question.b > question.a % 10 && question.b <= 9, 'subtraction needs regrouping');
        assert.equal(question.a - question.b, question.answer);
      }
    });
  }
}
assert.throws(() => data.makeRound('unknown-method'), RangeError);
assert.match(read('index.html'), /id="math-strategy-method-grid-addition"/);
assert.match(read('index.html'), /id="math-strategy-method-grid-subtraction"/);
assert.match(read('index.html'), /id="screen-math-strategy"/);
assert.match(read('js/math-app.js'), /KakaMathStrategiesGame\.init/);
assert.match(read('js/math-strategies-game.js'), /答啱喇/);
assert.match(read('js/math-strategies-game.js'), /speakThen\(`\$\{question\.concretePrompt\} \$\{\$\('math-strategy-action-copy'\)\.textContent\}`/);
assert.match(read('js/math-strategies-game.js'), /speakThen\(message, \(\) => \{ \$\('btn-math-strategy-next'\)\.hidden = false; \}\)/, 'encouragement is read before enabling the next question');
assert.equal((read('js/math-strategies-game.js').match(/tryEarnStar/g) || []).length, 1, 'a completed ten-question round awards exactly once');
assert.doesNotMatch(read('js/math-strategies-game.js'), /playMathStarReward|KakaStarFx/, 'reward animation stays in the shared app layer');
assert.match(read('css/math.css'), /:has\(#screen-math-strategy\.active\)/, 'strategy game can grow and scroll instead of being clipped');
console.log('test-math-strategies: ok');

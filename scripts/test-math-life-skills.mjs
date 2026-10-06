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
    const mission = data.makeMission(activity.id, { random: seeded(seed), length: 5 });
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
      if (question.kind === 'shop-payment') {
        assert.ok(question.price >= 1 && question.price <= 12);
        assert.ok(question.coins.length >= 2 && question.coins.length <= 7);
        assert.ok(question.coins.every((coin) => [1, 2, 5, 10].includes(coin.value)));
        assert.equal(question.wallet, question.coins.length);
        const canPayExactly = (coins, remaining) => remaining === 0 || coins.some((coin, index) => coin.value <= remaining && canPayExactly(coins.filter((_, i) => i !== index), remaining - coin.value));
        assert.ok(canPayExactly(question.coins, question.price), `shop purse can pay $${question.price}`);
        assert.equal(question.answer, 'pay');
      }
      if (question.kind === 'measure') {
        assert.ok(['長短', '輕重', '水量'].includes(question.attribute));
        assert.equal(question.answer, question.left === question.right ? 'same' : question.left > question.right ? 'left' : 'right');
      }
    });
  }
}
const shapeMission = data.makeMission('shape-patterns', { random: seeded(24), length: 5 });
assert.deepEqual([...shapeMission.map((q) => q.kind)], ['shape', 'shape', 'shape', 'pattern', 'pattern']);
for (let seed = 1; seed <= 200; seed += 1) {
  const shopMission = data.makeMission('little-shop', { random: seeded(seed), length: 10 });
  assert.equal(shopMission.length, 10);
  assert.ok(shopMission.every((question) => question.kind === 'shop-payment'), 'fruit shop goes straight to payment practice');
}
assert.throws(() => data.makeMission('retired-planet'), RangeError);
assert.match(read('index.html'), /id="math-extra-mission-grid"/);
assert.match(read('index.html'), /id="screen-math-life-skill"/);
assert.match(read('js/math-app.js'), /KakaMathLifeSkillsGame\.init/);
assert.match(read('js/math-life-skills-game.js'), /speakThen\(`答啱喇！\$\{explanation\}你好叻！`, \(\) => \{ if \(nextButton\) nextButton\.hidden = false; \}\);/, 'spoken explanation and praise finish before enabling the next question');
assert.match(read('js/math-life-skills-game.js'), /function selectCompareItem/);
assert.match(read('js/math-life-skills-game.js'), /math-life-answer-number/);
assert.match(read('js/math-life-skills-game.js'), /question\.part/);
assert.match(read('css/math.css'), /\.math-life-ten-cell\.is-empty/);
assert.match(read('js/math-life-skills-game.js'), /question\.kind === 'shop-payment' \? '🧺 完成付款'/);
assert.match(read('js/math-life-skills-game.js'), /而家有\$\$\{total\}，仲差/);
assert.match(read('css/math.css'), /math-life-skill-feedback:not\(:empty\)/);
assert.match(read('index.html'), /class="math-life-skill-answer-panel"/);
assert.match(read('index.html'), /math-life-skill-board-wrap/);
assert.match(read('index.html'), /class="math-life-shop-stage"/);
assert.match(read('index.html'), /class="math-life-shop-poster"[^>]*aria-hidden="true"/);
assert.match(read('css/math.css'), /math-life-skill-screen\[data-activity="little-shop"\] \.math-life-shop-poster-image[\s\S]*?opacity: \.55/);
assert.match(read('css/math.css'), /grid-template-areas: "header" "stage"/);
assert.match(read('css/math.css'), /grid-template-areas: "product wallet" "product tray"/);
assert.match(read('js/math-life-skills-game.js'), /👛 卡卡的小錢包/);
assert.match(read('js/math-life-skills-game.js'), /updateShopPayment\(question, returning \? null : index\)/);
assert.match(read('css/math.css'), /math-life-skill-screen\[data-activity="little-shop"\] \.math-life-payment-tray[\s\S]*?border-radius: 50% \/ 38%/);
assert.match(read('css/math.css'), /math-life-coin-land/);
assert.match(read('css/math.css'), /math-life-skill-screen\[data-activity="little-shop"\] \.math-life-skill-board-heading \{ display: none; \}/);
assert.match(read('index.html'), /fruit-shop-scene\.jpg/);
assert.doesNotMatch(read('js/math-life-skills-data.js'), /shop-recognize/);
assert.doesNotMatch(read('js/math-life-skills-game.js'), /shop-recognize|renderShopIntro|is-shop-intro/);
assert.match(read('css/math.css'), /:has\(#screen-math-life-skill\.active\)/, 'new math screens opt out of clipped fixed-height canvas');
console.log('test-math-life-skills: ok');

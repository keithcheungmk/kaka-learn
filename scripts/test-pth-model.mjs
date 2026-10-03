import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { sounds, groups, groupNames, initialOf, buildQuestions } from '../js/pth-content.js';

assert.equal(sounds.length, 23);
assert.equal(groups.length, 7);
assert.deepEqual(groups, Object.keys(groupNames));
for (const [pinyin, expected] of [
  ['zhǐ zhāng', 'zh'], ['chē zi', 'ch'], ['shé', 'sh'],
  ['zǎo shang', 'z'], ['cǎi hóng', 'c'], ['sī xiàn', 's'],
  [' SHŪ běn ', 'sh'], ['á', ''], ['', ''], [null, ''],
  ['yè zi', 'y'], ['wà zi', 'w'],
]) assert.equal(initialOf(pinyin), expected, String(pinyin));

const keys = new Set();
for (const sound of sounds) {
  assert.ok(existsSync(new URL(`../${sound.video}`, import.meta.url)), sound.video);
  assert.equal(sound.examples.length, 3);
  assert.equal(sound.word, sound.examples[0].word);
  for (const word of sound.examples) {
    assert.equal(word.initial, sound.id, word.word);
    assert.equal(initialOf(word.pinyin), sound.id, word.word);
    assert.ok(word.say && word.emoji && word.imageLabel);
    assert.equal(word.id, word.audioKey);
    assert.ok(!keys.has(word.audioKey), word.audioKey);
    keys.add(word.audioKey);
  }
}
assert.equal(keys.size, 69);
assert.equal(sounds.find(s => s.id === 's').examples[1].word, '絲線');
assert.equal(sounds.find(s => s.id === 'zh').syllables[1][1], 'zh');
assert.ok(sounds.filter(s => s.group === 'yw').every(s => s.kind === 'letter'));

for (const group of groups) {
  for (const seed of [0, 1, 42, 'resume-this-round']) {
    const questions = buildQuestions(group, seed);
    assert.equal(questions.length, 10, group);
    assert.equal(new Set(questions.map(q => q.id)).size, 10, group);
    assert.deepEqual(questions, buildQuestions(group, seed), 'Seed must reproduce a resumed round');
    assert.deepEqual(new Set(questions.map(q => q.type)), new Set(['listen', 'picture']));
    for (const question of questions) {
      assert.equal(question.answer, initialOf(question.word.pinyin));
      assert.ok(sounds.some(s => s.group === group && s.examples.includes(question.word)));
      assert.ok(question.prompt && question.hint.includes(question.answer));
      if (group === 'yw') assert.ok(question.prompt.includes('拼音字母'));
    }
    for (const sound of sounds.filter(s => s.group === group)) {
      assert.ok(questions.some(q => q.word.id === sound.examples[0].id), `Missing basic word ${sound.id}`);
    }
    const occurrences = new Map();
    for (const question of questions) {
      const seen = occurrences.get(question.word.id) || [];
      assert.ok(!seen.includes(question.type), 'Repeated words must use a different task');
      occurrences.set(question.word.id, [...seen, question.type]);
    }
  }
}
assert.throws(() => buildQuestions('missing'), RangeError);
console.log('PTH content model: 23 videos, 69 aligned words, 7 groups × 10 distinct tasks passed.');

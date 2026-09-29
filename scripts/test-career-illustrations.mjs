import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const context = { window: {} };
vm.createContext(context);
vm.runInContext(readFileSync('js/words.js', 'utf8'), context);

const { WORDS, TOPICS, wordIllustHtml } = context.window.KakaWords;
const jobs = TOPICS.find((topic) => topic.id === 'jobs');
assert.ok(jobs, '職業主題存在');
assert.equal(jobs.wordIds.length, 45, '職業主題應有 45 個詞');

for (const id of jobs.wordIds) {
  const word = WORDS.find((item) => item.id === id);
  assert.ok(word, '找不到職業詞：' + id);
  const html = wordIllustHtml(word);
  const path = 'assets/careers/' + id + '.webp';
  assert.ok(html.includes('career-illustration'), word.term + ' 未使用角色插圖');
  assert.ok(html.includes(path), word.term + ' 插圖路徑不符');
  assert.ok(!html.includes('emoji-face'), word.term + ' 仍顯示職業 Emoji');
  assert.ok(statSync(resolve(path)).size <= 400_000, path + ' 超出單檔大小上限');
}

const animal = WORDS.find((word) => word.id === 'gou');
const animalHtml = wordIllustHtml(animal);
assert.ok(animalHtml.includes('emoji-face'), '非職業詞仍然使用原有 Emoji');
assert.ok(!animalHtml.includes('career-illustration'), '職業圖不應影響其他主題');
console.log('通過：45 個職業都有角色插圖；非職業 Emoji 保持原狀。');

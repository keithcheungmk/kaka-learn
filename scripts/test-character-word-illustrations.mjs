import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('js/words.js', 'utf8'), context, { filename: 'js/words.js' });
const { WORDS, TOPICS, wordIllustHtml, CHARACTER_WORD_ILLUSTRATIONS } = context.window.KakaWords;
const topicById = new Map(TOPICS.map((topic) => [topic.id, topic]));

assert.equal(topicById.get('emotions').wordIds.length, 6, '情緒 topic 保留六個原有詞');
assert.equal(topicById.get('actions').wordIds.length, 23, '常見動作 topic 覆蓋 23 個動作');
assert.equal(topicById.get('sports').wordIds.length, 10, '運動 topic 有 10 個活動');

for (const topicId of ['emotions', 'actions', 'sports']) {
  const topic = topicById.get(topicId);
  assert.ok(topic, `missing topic ${topicId}`);
  for (const id of topic.wordIds) {
    const word = WORDS.find((item) => item.id === id);
    assert.ok(word, `${topicId} references missing word ${id}`);
    assert.ok(CHARACTER_WORD_ILLUSTRATIONS[id], `${id} needs a character illustration`);
    assert.match(wordIllustHtml(word), /character-word-illustration/);
  }
}

for (const [id, asset] of Object.entries(CHARACTER_WORD_ILLUSTRATIONS)) {
  assert.ok(fs.existsSync(asset), `${id}: missing ${asset}`);
  assert.ok(fs.statSync(asset).size <= 400 * 1024, `${asset} exceeds 400KB`);
}

const uniqueTopics = ['actions', 'sports'].flatMap((id) => topicById.get(id).wordIds);
const terms = uniqueTopics.map((id) => WORDS.find((word) => word.id === id).term);
assert.equal(new Set(terms).size, terms.length, '動作與運動主題不應重複相同詞形');
for (const term of ['吃飯', '喝水', '洗手', '刷牙', '穿衣服', '脫衣服', '看書', '聽音樂', '說話', '踢足球', '游泳', '騎單車']) {
  assert.ok(terms.includes(term), `missing standard written term: ${term}`);
}

const unrelated = WORDS.find((word) => word.id === 'mao');
assert.match(wordIllustHtml(unrelated), /emoji-face/);
assert.doesNotMatch(wordIllustHtml(unrelated), /character-word-illustration/);

console.log('情緒、常見動作、運動詞彙及角色插圖測試通過。');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(repo, 'js/phonics-words.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(repo, 'js/emoji-art.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(repo, 'js/emoji-spelling-data.js'), 'utf8'), context);

const api = context.window.KakaEmojiSpellingData;
const topics = api.getTopics();
const art = context.window.KakaEmojiArt;
function assertArtwork(emoji, asset, label) {
  if (asset) {
    assert.ok(asset.startsWith('./assets/') && fs.existsSync(path.join(repo, asset)), `${label} 的專用插圖檔存在`);
    return;
  }
  for (const part of art.graphemes(emoji)) {
    const id = art.codeName(part);
    assert.ok(fs.existsSync(path.join(repo, 'assets/openmoji', `${id}.svg`)) || api.needsNativeEmoji(id), `${label} 的 ${id} 有 SVG 或原生 emoji fallback`);
  }
}
assert.equal(topics.length, 32, '所有有圖像的 Phonics 主題及節日子主題納入題庫');
assert.equal(topics.reduce((sum, topic) => sum + topic.words.length, 0), 333, '全部 333 個現有圖詞納入題庫');
assert.equal(topics.some((topic) => topic.id === 'letters_rev'), false, '獨立字母音練習不混入詞語拼字遊戲');

for (const topic of topics) {
  assert.ok(topic.titleEn, `${topic.id} 有可顯示的英文主題名`);
  assertArtwork(topic.cover, topic.coverPhoto, `${topic.id} 封面`);
  assert.equal(new Set(topic.words.map((word) => word.id)).size, topic.words.length, `${topic.id} 詞語 id 唯一`);
  for (const word of topic.words) {
    assert.ok(word.emoji, `${word.word} 有圖像提示`);
    assertArtwork(word.emoji, word.photo || word.objectArt, word.word);
    assert.deepEqual([...word.letters].join(''), word.word.toLowerCase().replace(/[^a-z]/g, ''), `${word.word} 轉為正確字母槽`);
  }
  const seen = new Set();
  let offset = 0;
  for (let round = 0; round < Math.ceil(topic.words.length / 10); round += 1) {
    const plan = api.planRound(topic.words, offset, 10);
    assert.equal(plan.length, 10, `${topic.id} 每輪都有十題`);
    plan.forEach((word) => seen.add(word.id));
    offset = (offset + 10) % topic.words.length;
  }
  assert.equal(seen.size, topic.words.length, `${topic.id} 多輪遊玩能覆蓋後面的所有詞語`);
}
assert.ok(topics.find((topic) => topic.id === 'sight_jobs_world').words.every((word) => word.photo), '職業沿用已製作的卡卡／禧禧圖片');

let simulatedWords = 0;
for (const topic of topics) {
  for (const word of topic.words) {
    const pool = api.makeLetterPool(word.word);
    const slots = api.createAnswerSlots(word.letters.length);
    const used = new Set();
    for (const letter of word.letters) {
      const tile = pool.find((candidate) => candidate.answer && candidate.letter === letter && !used.has(candidate.key));
      assert.ok(tile, `${word.word} 的每個答案字母都有可選字塊`);
      used.add(tile.key);
      slots[api.nextEmptySlot(slots)] = tile;
    }
    assert.equal(api.isCorrectAnswer(slots, word.word), true, `${word.word} 可由圖庫字塊完成拼字`);
    simulatedWords += 1;
  }
}

const christmas = topics.find((topic) => topic.id === 'festival_christmas');
assert.ok(christmas, '香港節日的子主題一併納入');
const santa = christmas.words.find((word) => word.word === 'Santa Claus');
assert.deepEqual([...santa.wordBreaks], [5], '多詞詞語保留清楚的空格提示');
assert.deepEqual([...santa.letters].join(''), 'santaclaus', '多詞拼字只使用字母，不把空格變成選項');

let seed = 1821;
const random = () => {
  seed = (seed * 48271) % 2147483647;
  return seed / 2147483647;
};
const word = 'banana';
const expected = [...word];
const orders = new Set();
for (let run = 0; run < 120; run += 1) {
  const pool = api.makeLetterPool(word, random);
  assert.equal(pool.length, word.length + 4, '每題包含答案字母及四個干擾字母');
  assert.equal(pool.filter((tile) => tile.answer).length, word.length, '答案中重複的字母各自保留一格');
  assert.equal(new Set(pool.filter((tile) => !tile.answer).map((tile) => tile.letter)).size, 4, '干擾字母各不相同');
  assert.equal(pool.filter((tile) => !tile.answer).some((tile) => expected.includes(tile.letter)), false, '干擾字母不會與答案字母混淆');
  const answerOrder = pool.filter((tile) => tile.answer).map((tile) => tile.letter).join('');
  orders.add(answerOrder);
}
assert.ok(orders.size > 1, '正確字母在選擇池內會打亂，不固定以答案次序出現');

const slots = api.createAnswerSlots(6);
assert.equal(api.nextEmptySlot(slots), 0, '新題目會由第一個空格開始');
for (const [index, letter] of [...'banana'].entries()) slots[index] = { key: `tile-${index}`, letter };
assert.equal(api.nextEmptySlot(slots), -1, '填滿後沒有剩餘空格');
assert.equal(api.isCorrectAnswer(slots, 'banana'), true, '重複字母按次序拼出正確單字');
slots[2] = null;
assert.equal(api.nextEmptySlot(slots), 2, '移除一格後可以重新填入最早的空位');
slots[2] = { key: 'tile-retry', letter: 'n' };
assert.equal(api.isCorrectAnswer(slots, 'banana'), true, '重新填入後仍可完成正確答案');
assert.equal(api.isCorrectAnswer(slots, 'bananas'), false, '答案必須與目標長度和字母完全一致');

const markup = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(repo, 'js/emoji-spelling-app.js'), 'utf8');
const sightTrackMarkup = markup.match(/<div class="english-track english-track-sight">([\s\S]*?)<\/div>\s*<div class="english-track english-track-phonics">/)?.[1] || '';
assert.match(sightTrackMarkup, /id="btn-open-emoji-spelling"[\s\S]*?拖拉或點選字母拼字/, '圖像串字入口放在 Topic Words 之內並說明拖拉及點選操作');
assert.match(markup, /id="screen-emoji-spelling"/, '新遊戲有獨立畫面，不覆蓋 Phonics');
assert.match(markup, /id="emoji-spelling-finish"/, '完成畫面有獎勵提示');
assert.match(app, /flyStarFromRanger/, '每題答對會沿用英文 Phonics 星星動畫');
assert.match(app, /saveRoundProgress/, '中途離開後可由已完成題數繼續今輪');
assert.match(app, /pointerdown/, '支援觸控拖拉字母入答案格');
assert.match(app, /placeLetter\(tile\)/, '保留點選字母的非拖拉操作');
assert.match(app, /playTryAgainCue/, '答錯時有溫和重試音效');
assert.match(app, /speakEnglishTerm/, '單字卡及提示使用 KAKA 英文語音');

console.log('Emoji Spelling tests passed');
console.log(`  ✓ ${topics.length} categories and ${topics.reduce((sum, topic) => sum + topic.words.length, 0)} picture words`);
console.log(`  ✓ simulated a complete correct spelling for all ${simulatedWords} words`);
console.log('  ✓ picture coverage, compound word gaps, shuffled letter pools, slot undo/retry, touch drag, retry sound, and English star round');

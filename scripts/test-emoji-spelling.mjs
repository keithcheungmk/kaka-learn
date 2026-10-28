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
  assert.ok(art.graphemes(emoji).length > 0, `${label} 有可顯示的原生 emoji`);
}
assert.equal(topics.length, 32, '所有有圖像的 Phonics 主題及節日子主題納入題庫');
assert.equal(topics.reduce((sum, topic) => sum + topic.words.length, 0), 333, '全部 333 個現有圖詞納入題庫');
assert.equal(topics.flatMap(topic => topic.words).filter(word => word.phonicsChunks.length).length, 138, '138 個詞有待覆聽音塊配置');
assert.equal(topics.some((topic) => topic.id === 'letters_rev'), false, '獨立字母音練習不混入詞語拼字遊戲');

for (const topic of topics) {
  assert.ok(topic.titleEn, `${topic.id} 有可顯示的英文主題名`);
  assertArtwork(topic.cover, topic.coverPhoto, `${topic.id} 封面`);
  assert.equal(new Set(topic.words.map((word) => word.id)).size, topic.words.length, `${topic.id} 詞語 id 唯一`);
  for (const word of topic.words) {
    assert.ok(word.emoji, `${word.word} 有圖像提示`);
    assertArtwork(word.emoji, word.photo || word.objectArt, word.word);
    assert.deepEqual([...word.letters].join(''), word.word.toLowerCase().replace(/[^a-z]/g, ''), `${word.word} 轉為正確字母槽`);
    if (word.phonicsChunks.length && !word.phonicsLabels) assert.equal(word.phonicsChunks.map(chunk => chunk.replace(/^oo-(long|short)$/, 'oo')).join(''), word.word.toLowerCase().replace(/[^a-z]/g, ''), `${word.word} 音塊與拼字一致`);
    if (word.phonicsLabels) {
      assert.equal(word.phonicsLabels.length, word.phonicsChunks.length, `${word.word} 每個字形有一個音`);
      const written = [...word.phonicsLabels].join('') + (word.phonicsNotes.includes('e 不發音') ? 'e' : '');
      assert.equal(written, word.word.toLowerCase().replace(/[^a-z]/g, ''), `${word.word} 按字形次序顯示可發音字母及靜音 e`);
    }
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
const referenceCss = fs.readFileSync(path.join(repo, 'css/emoji-spelling-reference.css'), 'utf8');
const sightTrackMarkup = markup.match(/<div class="english-track english-track-sight">([\s\S]*?)<\/div>\s*<div class="english-track english-track-phonics">/)?.[1] || '';
assert.doesNotMatch(sightTrackMarkup, /id="btn-open-emoji-spelling"/, '避免重複入口');
const phonicsApp = fs.readFileSync(path.join(repo, 'js/phonics-app.js'), 'utf8');
assert.match(phonicsApp, /!topic.soundMissions[\s\S]{0,100}openTopicById/, '有圖詞的拼字主題開啟圖像拼字');
assert.match(phonicsApp, /openTopicById\?\.\(collection.id, topic.id\)/, '子分類保留返回上層');
const animal = topics.find(topic => topic.id === 'animal_spelling');
assert.equal(animal.words.find(word => word.sourceId === 'animal_goat').emoji, '🐐');
assert.equal(animal.words.find(word => word.sourceId === 'animal_monkey').emoji, '🐒');
assert.deepEqual([...animal.words.find(word => word.sourceId === 'animal_fish').phonicsChunks], ['f', 'i', 'sh']);
assert.equal(animal.words.find(word => word.sourceId === 'animal_monkey').phonicsChunks.length, 0);
for (const word of topics.flatMap(topic => topic.words)) for (const chunk of word.phonicsChunks.filter(chunk => chunk !== 'ice')) assert.ok(fs.existsSync(path.join(repo, 'assets/phonemes', `${chunk}.mp3`)), `${chunk} 音檔存在`);
assert.equal(api.makeLetterPool('cat', Math.random, 2).length, 5);
assert.deepEqual([...topics.find(topic => topic.id === 'sight_food').words.find(word => word.word === 'milk').phonicsChunks], ['m', 'i', 'l', 'k']);
assert.deepEqual([...topics.find(topic => topic.id === 'sight_food').words.find(word => word.word === 'rice').phonicsChunks], ['r', 'ice']);
assert.equal(topics.find(topic => topic.id === 'sight_toys').words.find(word => word.word === 'ball').phonicsChunks.length, 0, 'ball 不用錯誤短 a 硬拆');
assert.deepEqual([...topics.find(topic => topic.id === 'sight_food').words.find(word => word.word === 'cake').phonicsChunks], ['c', 'ai', 'k']);
assert.deepEqual([...topics.find(topic => topic.id === 'sight_food').words.find(word => word.word === 'cake').phonicsLabels], ['c', 'a', 'k']);
assert.deepEqual([...topics.find(topic => topic.id === 'sight_places').words.find(word => word.word === 'home').phonicsChunks], ['h', 'oa', 'm']);
assert.deepEqual([...topics.find(topic => topic.id === 'sight_places').words.find(word => word.word === 'home').phonicsLabels], ['h', 'o', 'm']);
assert.deepEqual([...topics.find(topic => topic.id === 'sight_places').words.find(word => word.word === 'home').phonicsNotes], ['e 不發音']);
assert.deepEqual([...topics.find(topic => topic.id === 'festival_halloween').words.find(word => word.word === 'mask').phonicsChunks], []);
assert.deepEqual([...topics.find(topic => topic.id === 'sight_numbers').words.find(word => word.word === 'two').phonicsChunks], [], 'two 不可漏掉 w 或假裝係規則拼讀');
assert.deepEqual([...topics.find(topic => topic.id === 'sight_numbers').words.find(word => word.word === 'nine').phonicsChunks], [], 'nine 的 i_e 跨越內部 n，不能直接排成獨立 grapheme tiles');
const wordById = (topic, sourceId) => topics.find(item => item.id === topic).words.find(word => word.sourceId === sourceId);
const audit = JSON.parse(fs.readFileSync(path.join(repo, 'docs/emoji-spelling-phonics-audit.json'), 'utf8'));
for (const item of audit.items) {
  const word = wordById(item.topicId, item.sourceId);
  assert.ok(word, `音塊審核項目 ${item.topicId}/${item.sourceId} 對應實際題目`);
  assert.equal(Boolean(word.phonicsChunks.length), item.status === 'candidate_pending_audio_audition', `${item.word} 審核表與遊戲音塊狀態一致`);
}
assert.deepEqual([...wordById('sight_food', 'sight_food_1').phonicsChunks], ['b', 'r', 'e', 'd']);
assert.deepEqual([...wordById('festival_mid_autumn', 'festival_mid_autumn_5').phonicsLabels], ['t', 'ea']);
assert.deepEqual([...wordById('sight_weather', 'sight_weather_9').phonicsChunks], ['s', 'n', 'oa']);
assert.deepEqual([...wordById('sight_actions', 'sight_actions_0').phonicsChunks], ['r', 'u', 'n']);
assert.deepEqual([...wordById('animal_spelling', 'animal_cow').phonicsChunks], ['c', 'ow']);
assert.deepEqual([...wordById('sight_fruit', 'sight_fruit_3').phonicsLabels], ['g', 'r', 'a', 'p']);
assert.deepEqual([...wordById('sight_body', 'sight_body_8').phonicsChunks], ['ar', 'm']);
assert.deepEqual([...wordById('sight_feelings', 'sight_feelings_5').phonicsLabels], ['sh', 'y']);
assert.deepEqual([...wordById('sight_actions', 'sight_actions_7').phonicsChunks], ['r', 'ee', 'd']);
assert.equal(wordById('sight_actions', 'sight_actions_7').spokenText, 'reed', 'read 的現在式發音需避開 TTS 誤讀成過去式');
assert.match(wordById('sight_shapes', 'sight_shapes_9').objectArt, /cone\.svg$/);
assert.equal(wordById('sight_weather', 'sight_weather_8').emoji, '🌧️');
assert.equal(wordById('sight_weather', 'sight_weather_9').emoji, '❄️');
assert.match(wordById('sight_school_items', 'sight_school_items_5').objectArt, /eraser\.svg$/);
assert.match(wordById('sight_school_items', 'sight_school_items_8').objectArt, /glue\.svg$/);

assert.match(markup, /id="screen-emoji-spelling"/, '新遊戲有獨立畫面，不覆蓋 Phonics');
assert.match(markup, /id="emoji-spelling-finish"/, '完成畫面有獎勵提示');
assert.match(app, /flyStarFromRanger/, '每題答對會沿用英文 Phonics 星星動畫');
assert.match(app, /saveRoundProgress/, '中途離開後可由已完成題數繼續今輪');
assert.match(app, /pointerdown/, '支援觸控拖拉字母入答案格');
assert.match(app, /placeLetter\(tile\)/, '保留點選字母的非拖拉操作');
assert.match(app, /sounds\.retry/, '答錯時有溫和重試音效');
assert.match(app, /speakEnglishTerm/, '單字卡及提示使用 KAKA 英文語音');
assert.match(app, /tile\.letter !== state\.round\[state\.index\]\.letters\[nextIndex\]/, '每次只接受下一格的正確字母');
assert.doesNotMatch(app, /KakaEmojiArt\.html\(/, '圖像串字的 emoji 使用裝置原生字型');
assert.match(referenceCss, /Apple Color Emoji/, 'iPhone／iPad 使用 Apple 原生 emoji 字型');

console.log('Emoji Spelling tests passed');
console.log(`  ✓ ${topics.length} categories and ${topics.reduce((sum, topic) => sum + topic.words.length, 0)} picture words`);
console.log(`  ✓ simulated a complete correct spelling for all ${simulatedWords} words`);
console.log('  ✓ picture coverage, compound word gaps, shuffled letter pools, slot undo/retry, touch drag, retry sound, and English star round');

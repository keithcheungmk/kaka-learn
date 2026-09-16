import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataSource = fs.readFileSync(path.join(repo, 'js/phonics-words.js'), 'utf8');
const appSource = fs.readFileSync(path.join(repo, 'js/phonics-app.js'), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(dataSource, context);

const topic = context.window.KakaPhonicsWords.getPhonicsTopicById('animal_spelling');
assert.ok(topic, '動物拼字主題存在');
assert.equal(topic.flow, 'blend', '動物主題使用音素＋拼字流程');
assert.deepEqual([...topic.modes], ['build'], '動物主題直接進入拼字任務');
assert.equal(topic.words.length, 20, '動物園擴充至 20 個動物字');

for (const item of topic.words) {
  assert.equal(item.letters.join(''), item.word, `${item.word} 音素格可以組回完整字`);
  assert.ok(item.emoji, `${item.word} 有圖像提示`);
  for (const phoneme of item.letters) {
    assert.ok(
      fs.existsSync(path.join(repo, 'assets/phonemes', `${phoneme}.mp3`)),
      `${item.word} 使用已存在的 ${phoneme} phoneme 錄音`,
    );
  }
}

for (const topicId of ['sight_food', 'sight_veg', 'sight_places']) {
  const vocabularyTopic = context.window.KakaPhonicsWords.getPhonicsTopicById(topicId);
  assert.equal(vocabularyTopic.flow, 'blend', `${topicId} 跟動物園使用融合拼字流程`);
  assert.deepEqual([...vocabularyTopic.modes], ['build'], `${topicId} 直接進入拼字任務`);
  assert.equal(vocabularyTopic.words.length, 10, `${topicId} 有 10 個詞`);
  for (const item of vocabularyTopic.words) {
    assert.equal(item.letters.join(''), item.word, `${item.word} 可以組回完整字`);
    for (const phoneme of item.letters) {
      assert.ok(fs.existsSync(path.join(repo, 'assets/phonemes', `${phoneme}.mp3`)), `${item.word} 使用已存在的 ${phoneme} 音檔`);
    }
  }
}

const recordedChunks = {
  a_e: 'a_e', i_e: 'i_e', ee: 'ee', igh: 'igh', 'ow-snow': 'ow-snow',
  ar: 'ar', or: 'or', ice: 'ice', ike: 'ike', ide: 'ide',
};
for (const [sound, file] of Object.entries(recordedChunks)) {
  assert.ok(
    fs.existsSync(path.join(repo, 'assets/phonemes/recorded', `${file}.m4a`)),
    `${sound} 有真人錄音資產`,
  );
}
const soundMissionSounds = context.window.KakaPhonicsWords.PHONICS_SOUND_MISSIONS
  .flatMap((mission) => mission.sounds);
for (const sound of ['a_e', 'i_e', 'ice', 'ike', 'ide', 'ow-snow']) {
  assert.ok(soundMissionSounds.includes(sound), `${sound} 出現於真人實錄音塊基地`);
}
assert.deepEqual(
  [...context.window.KakaPhonicsWords.getPhonicsTopicById('sight_food').words.find((word) => word.word === 'rice').soundChunks],
  ['r', 'ice'],
  'rice 保留完整拼字，學習卡以 r + ice 聽音',
);
assert.deepEqual(
  [...context.window.KakaPhonicsWords.getPhonicsTopicById('sight_food').words.find((word) => word.word === 'cake').soundChunks],
  ['c', 'a_e', 'k'],
  'cake 學習卡使用 a_e 真人音塊',
);

assert.match(appSource, /playLetterSound\(tile\.char/, '每放入一格播放 phoneme');
assert.match(appSource, /RECORDED_PHONEME_FILES/, '真人錄音優先於原有 phoneme 音檔');
assert.match(appSource, /word\.soundChunks \|\| word\.letters/, '學習卡可分開顯示聽音音塊與拼字格');
assert.match(appSource, /for \(const sound of word\.soundChunks\)/, '學習卡先順序播放真人音塊');
assert.match(appSource, /const blendSounds = completedRound\.target\.soundChunks \|\| completedRound\.chars/, '拼字完成按音塊連讀，再讀完整單字');
assert.match(appSource, /blendSounds\[index\]/, '完成後依次連讀音塊或 phoneme');
assert.match(appSource, /speakEnglishAndWait\(word/, '連音後播放完整英文單字');
assert.match(appSource, /flyStarFromRanger/, '答對後由 KAKA Ranger 射星');
assert.match(appSource, /saveRoundProgress/, '未完成回合保存進度');
assert.match(appSource, /profileId.*phonics.*mode/s, '記憶內的回合 key 包含目前 profile');
assert.match(appSource, /onPhonicsBuildTileTap/, '提供點按操作');
assert.match(appSource, /onPhonicsBuildPointerDown/, '提供拖拉操作');
assert.match(appSource, /cancelAllSpeech/, '切題前清除延遲及進行中的語音');
assert.doesNotMatch(appSource, /淡音素/, '字格提示使用清楚的「提示字形」描述');

console.log('phonics blend flow tests');
console.log('  ✓ 10 個動物字均可由 verified phoneme assets 組成');
console.log('  ✓ 每格 phoneme → 完成連音 → 完整單字 → KAKA 射星');
console.log('  ✓ 10 段真人錄音、snow 的 ow 與 rice／cake 音塊已接入');
console.log('  ✓ tap／drag、profile round progress、audio cancellation 均已接入');

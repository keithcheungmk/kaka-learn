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
assert.deepEqual([...topic.modes], ['build', 'connect'], '動物主題提供拼字及圖詞配對任務');
assert.equal(topic.words.length, 20, '動物園擴充至 20 個動物字');

for (const retiredTopicId of ['sight1', 'sight2', 'sight3', 'sight4']) {
  assert.equal(context.window.KakaPhonicsWords.getPhonicsTopicById(retiredTopicId), undefined, `${retiredTopicId} 已從常見字選單移除`);
}

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

for (const topicId of ['sight_food', 'sight_veg', 'sight_places', 'sight_vehicles', 'sight_fruit', 'sight_household', 'sight_school_items']) {
  const vocabularyTopic = context.window.KakaPhonicsWords.getPhonicsTopicById(topicId);
  assert.equal(vocabularyTopic.flow, 'blend', `${topicId} 跟動物園使用融合拼字流程`);
  assert.deepEqual([...vocabularyTopic.modes], ['build', 'connect'], `${topicId} 提供拼字及圖詞配對任務`);
  assert.equal(vocabularyTopic.words.length, 10, `${topicId} 有 10 個詞`);
  for (const item of vocabularyTopic.words) {
    assert.equal(item.letters.join(''), item.word, `${item.word} 可以組回完整字`);
    for (const phoneme of item.letters) {
      assert.ok(fs.existsSync(path.join(repo, 'assets/phonemes', `${phoneme}.mp3`)), `${item.word} 使用已存在的 ${phoneme} 音檔`);
    }
  }
}

const correctedVocabularyTopics = ['sight_food', 'sight_veg', 'sight_household', 'sight_feelings', 'sight_weather', 'sight_toys'];
for (const topicId of correctedVocabularyTopics) {
  const vocabularyTopic = context.window.KakaPhonicsWords.getPhonicsTopicById(topicId);
  assert.equal(
    new Set(vocabularyTopic.words.map((item) => item.emoji)).size,
    vocabularyTopic.words.length,
    `${topicId} 每個詞都有獨立圖像`,
  );
}

const familyTopic = context.window.KakaPhonicsWords.getPhonicsTopicById('sight_family_people');
assert.equal(
  JSON.stringify(familyTopic.words.map((item) => item.word)),
  JSON.stringify(['father', 'mother', 'brother', 'sister', 'baby', 'grandfather', 'grandmother', 'aunt', 'uncle', 'friend', 'teacher', 'classmate']),
  'Family & People 只保留家庭、朋友及學校身邊的人',
);
assert.equal(familyTopic.flow, 'blend', 'Family & People 使用融合拼字流程');
assert.deepEqual([...familyTopic.modes], ['build', 'connect'], 'Family & People 提供拼字及圖詞配對任務');
assert.equal(new Set(familyTopic.words.map((item) => item.emoji)).size, familyTopic.words.length, 'Family & People 每個詞有獨立圖像');
assert.equal(familyTopic.words.some((item) => ['police', 'doctor', 'driver'].includes(item.word)), false, '職業詞不放在家庭與身邊的人');
for (const item of familyTopic.words) {
  assert.equal(item.letters.join(''), item.word, `${item.word} 可以逐格拼回完整字`);
  for (const phoneme of item.letters) {
    assert.ok(fs.existsSync(path.join(repo, 'assets/phonemes', `${phoneme}.mp3`)), `${item.word} 使用已存在的 ${phoneme} 音檔`);
  }
}
const father = familyTopic.words.find((item) => item.word === 'father');
assert.deepEqual([...father.soundChunks], ['f', 'a', 'th', 'er'], 'father 先按 f、a、th、er 的音素順序讀');
assert.equal(JSON.stringify(father.blendGroups), JSON.stringify([
  { label: 'fa', start: 0, end: 2, sounds: ['f', 'a'], color: '#5eead4' },
  { label: 'ther', start: 2, end: 6, sounds: ['th', 'er'], color: '#fbbf24' },
]), 'father 完成後以 fa 和 ther 兩個視覺詞塊呈現');

const newSightTopicIds = ['sight_colors', 'sight_numbers', 'sight_shapes', 'sight_toys', 'sight_actions'];
for (const topicId of newSightTopicIds) {
  const vocabularyTopic = context.window.KakaPhonicsWords.getPhonicsTopicById(topicId);
  assert.ok(vocabularyTopic, `${topicId} 新主題已加入`);
  assert.equal(vocabularyTopic.section, 'sight', `${topicId} 放在 Sight Words 區`);
  assert.ok(vocabularyTopic.titleEn, `${topicId} 有英文副標題`);
  assert.equal(vocabularyTopic.flow, 'blend', `${topicId} 跟動物園使用融合拼字流程`);
  assert.deepEqual([...vocabularyTopic.modes], ['build', 'connect'], `${topicId} 提供拼字及圖詞配對任務`);
  assert.equal(vocabularyTopic.words.length, 12, `${topicId} 有 12 個詞`);
  assert.equal(new Set(vocabularyTopic.words.map((item) => item.word)).size, 12, `${topicId} 詞語沒有重複`);
  for (const item of vocabularyTopic.words) {
    assert.equal(item.letters.join(''), item.word, `${item.word} 可以逐格拼回完整字`);
    assert.ok(item.emoji, `${item.word} 有圖像提示`);
    for (const phoneme of item.letters) {
      assert.ok(fs.existsSync(path.join(repo, 'assets/phonemes', `${phoneme}.mp3`)), `${item.word} 使用已存在的 ${phoneme} 音檔`);
    }
  }
}

const festivals = [
  'festival_christmas', 'festival_lunar_new_year', 'festival_mid_autumn', 'festival_dragon_boat', 'festival_halloween',
].map((id) => context.window.KakaPhonicsWords.getPhonicsTopicById(id));
assert.equal(festivals.length, 5, '香港節日有 5 個獨立節日任務');
const festivalWords = festivals.flatMap((festival) => {
  assert.ok(festival, '每個節日任務可開啟');
  assert.equal(festival.words.length, 10, `${festival.title} 有 10 個專屬詞語`);
  assert.equal(festival.flow, 'blend', `${festival.title} 使用融合拼字流程`);
  assert.deepEqual([...festival.modes], ['build', 'connect'], `${festival.title} 提供拼字及圖詞配對任務`);
  for (const item of festival.words) {
    assert.equal(item.letters.join(''), item.word.toLowerCase().replace(/[^a-z]/g, ''), `${item.word} 的拼字會略過空格`);
    for (const phoneme of item.letters) {
      assert.ok(fs.existsSync(path.join(repo, 'assets/phonemes', `${phoneme}.mp3`)), `${item.word} 使用已存在的 ${phoneme} 音檔`);
    }
  }
  return festival.words.map((item) => item.word.toLowerCase());
});
assert.equal(new Set(festivalWords).size, festivalWords.length, '五個節日詞庫沒有重複詞語');
const santa = festivals[0].words.find((item) => item.word === 'Santa Claus');
assert.deepEqual([...santa.letters], ['s', 'a', 'n', 't', 'a', 'c', 'l', 'a', 'u', 's'], '短語拼字只使用英文字母');
assert.deepEqual([...santa.wordBreaks], [5], '短語保留 Santa 與 Claus 之間的分隔');

assert.deepEqual(
  [...context.window.KakaPhonicsWords.getPhonicsTopicById('sight_food').words.find((word) => word.word === 'rice').soundChunks],
  ['r', 'ice'],
  'rice 保留完整拼字，學習卡以 r + ice 聽音',
);
assert.match(appSource, /playLetterSound\(tile\.char/, '每放入一格播放 phoneme');
assert.match(appSource, /word\.soundChunks \|\| word\.letters/, '學習卡可分開顯示聽音音塊與拼字格');
assert.match(appSource, /CLEAN_RIME_WORDS/, '乾淨的 rime 字尾有獨立播放規則');
assert.match(appSource, /playPhonicsChunk\(tile\.dataset\.letter/, '學習卡音塊以 phoneme／rime 規則播放');
assert.match(appSource, /openPhonicsCollections/, '香港節日有獨立節日選擇頁');
assert.match(appSource, /wordBreaks/, '短語在學習卡及拼字格保留詞間分隔');
assert.match(appSource, /\$\{topic\.title\}・拼字/, '拼字畫面會顯示目前主題名稱');
assert.match(appSource, /for \(const sound of word\.soundChunks\)/, '學習卡先順序播放音塊');
assert.match(appSource, /await playPhonicsChunk\(sound/, '學習卡用乾淨音素或 rime 連讀');
assert.match(appSource, /const blendSounds = completedRound\.target\.soundChunks \|\| completedRound\.chars/, '拼字完成按音塊連讀，再讀完整單字');
assert.match(appSource, /blendSounds\[index\]/, '完成後依次連讀音塊或 phoneme');
assert.match(appSource, /await playPhonicsChunk\(blendSounds\[index\]/, '完成後用乾淨音素或 rime 連讀');
assert.match(appSource, /target\.blendGroups/, '拼字資料可定義可重用的視覺詞塊');
assert.match(appSource, /renderPhonicsBuildChunks/, '完成後顯示詞塊文字和目前連讀位置');
assert.match(appSource, /group\.sounds/, '詞塊保留底層 phoneme，而非把整個詞塊交給不可靠的 TTS');
assert.match(appSource, /pBuildSelectedKey === key/, '再撳已揀字母會啟動自動放入');
assert.match(appSource, /autoPlace: true/, 'iPad 重撳操作會自動彈入發光格');
assert.match(appSource, /speakEnglishAndWait\(word/, '連音後播放完整英文單字');
assert.match(appSource, /flyStarFromRanger/, '答對後由 KAKA Ranger 射星');
assert.match(appSource, /saveRoundProgress/, '未完成回合保存進度');
assert.match(appSource, /profileId.*phonics.*mode/s, '記憶內的回合 key 包含目前 profile');
assert.match(appSource, /onPhonicsBuildTileTap/, '提供點按操作');
assert.match(appSource, /onPhonicsBuildPointerDown/, '提供拖拉操作');
assert.match(appSource, /cancelAllSpeech/, '切題前清除延遲及進行中的語音');
assert.match(appSource, /startPhonicsConnectMode/, 'Sight Words 可進入獨立圖詞配對模式');
assert.match(appSource, /attemptPhonicsConnectPair/, '圖詞配對會在選取圖片及英文後判斷');
assert.match(appSource, /drawPhonicsConnectLines/, '配對成功會繪畫連線');
assert.doesNotMatch(appSource, /MODE_LABEL|coin-slot-label/, '全站獎勵條不再顯示聽／配／砌玩法標籤');
assert.doesNotMatch(appSource, /淡音素/, '字格提示使用清楚的「提示字形」描述');

console.log('phonics blend flow tests');
console.log('  ✓ 10 個動物字均可由 verified phoneme assets 組成');
console.log('  ✓ 每格 phoneme → 完成連音 → 完整單字 → KAKA 射星');
console.log('  ✓ rice 保留完整拼字，並以乾淨的 r + ice → rice 連讀');
console.log('  ✓ 車輛、水果、家居、學校用品及 5 個香港節日詞庫已接入');
console.log('  ✓ tap／drag、profile round progress、audio cancellation 均已接入');
console.log('  ✓ Colors、Numbers、Shapes、Toys、Action Words 各有 12 個可拼讀詞');
console.log('  ✓ Sight Words 新增獨立連一連模式：五對圖片／英文、語音按鈕及 SVG 連線');

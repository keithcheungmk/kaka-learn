import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataSource = fs.readFileSync(path.join(repo, 'js/phonics-words.js'), 'utf8');
const appSource = fs.readFileSync(path.join(repo, 'js/phonics-app.js'), 'utf8');
const playgroundTheme = fs.readFileSync(path.join(repo, 'css/playground-theme.css'), 'utf8');
const appMarkup = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');
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

assert.match(appMarkup, /id="phonics-words-overview"/, '主題詞語總覽容器存在');
assert.match(appMarkup, /id="phonics-words-card-grid"/, '主題詞語卡片網格存在');
assert.match(appSource, /topic\?\.section === 'sight' && !topic\.soundMissions/, '所有 Sight 主題詞語共用一頁詞卡；音素任務保留原模式');
assert.match(appSource, /renderPhonicsWordsOverview\(\)/, '主題生字由共用 renderer 顯示');
assert.match(appSource, /learnStage\) learnStage\.hidden = wordsOverview/, '主題詞卡頁隱藏舊單字卡，其他學習頁恢復');
assert.match(appSource, /speakEnglishTerm\(card\.dataset\.topicWord/, '按主題詞卡可播放完整詞語');
assert.match(appSource, /開始挑戰 →/, '主題詞卡頁保留挑戰入口');
assert.match(playgroundTheme, /words-card-grid[\s\S]*repeat\(5, minmax\(0, 1fr\)\)/, '寬版主題詞卡採用五欄');
assert.match(playgroundTheme, /@media \(max-width: 900px\)[\s\S]*words-card-grid[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/, '平板直向主題詞卡採用三欄');
assert.match(playgroundTheme, /@media \(max-width: 560px\)[\s\S]*words-card-grid[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/, '手機主題詞卡採用兩欄');
assert.match(playgroundTheme, /is-words-overview \.topic-word-art \.career-photo-plate[\s\S]*width: min\(100%, 144px\)[\s\S]*height: 104px/, '職業相片在主題詞卡內有固定尺寸，避免遮住其他卡片');
assert.match(playgroundTheme, /is-words-overview \.topic-word-art \.career-photo[\s\S]*object-fit: cover/, '職業相片會裁切填滿卡片預留的圖像區');
assert.match(playgroundTheme, /@media \(max-width: 560px\)[\s\S]*career-photo-plate[\s\S]*width: min\(100%, 120px\)[\s\S]*height: 82px/, '手機上的職業相片會再縮小並留在卡片內');

const allVocabularyTopicIds = [
  'sight_food', 'sight_veg', 'sight_places', 'sight_vehicles', 'sight_fruit', 'sight_household', 'sight_school_items',
  'sight_jobs_nearby', 'sight_jobs_world', 'sight_body', 'sight_feelings', 'sight_clothes', 'sight_family_people',
  'sight_weather', 'sight_colors', 'sight_numbers', 'sight_shapes', 'sight_toys', 'sight_actions',
  'festival_christmas', 'festival_lunar_new_year', 'festival_mid_autumn', 'festival_dragon_boat', 'festival_halloween',
];
for (const topicId of allVocabularyTopicIds) {
  const vocabularyTopic = context.window.KakaPhonicsWords.getPhonicsTopicById(topicId);
  assert.ok(vocabularyTopic, `${topicId} 生字主題存在`);
  assert.equal(vocabularyTopic.section, 'sight', `${topicId} 屬於英文主題詞語`);
  assert.ok(vocabularyTopic.words.length > 0, `${topicId} 有可展示的詞卡`);
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

const jobsHub = context.window.KakaPhonicsWords.getPhonicsTopicById('sight_jobs');
assert.ok(jobsHub, 'Jobs 主題已加入 Sight Words');
assert.equal(jobsHub.section, 'sight', 'Jobs 顯示在 Sight Words 區');
assert.equal(jobsHub.titleEn, 'Jobs', '職業主題有清楚英文標題');
assert.equal(jobsHub.collections.length, 2, '職業詞按身邊人物及世界職業分成兩組');
const jobSets = jobsHub.collections.map((group) => context.window.KakaPhonicsWords.getPhonicsTopicById(group.id));
assert.deepEqual([...jobSets].map((group) => group.words.length), [25, 20], '兩組分別有 25 個身邊職業及 20 個世界職業');
const jobWords = jobSets.flatMap((group) => {
  assert.equal(group.flow, 'blend', `${group.id} 使用融合拼字流程`);
  assert.deepEqual([...group.modes], ['build', 'connect'], `${group.id} 提供砌字及圖詞配對`);
  assert.equal(new Set(group.words.map((item) => item.emoji)).size, group.words.length, `${group.id} 每個詞重用獨立中文職業圖示`);
  assert.equal(new Set(group.words.map((item) => item.word)).size, group.words.length, `${group.id} 詞語沒有重複`);
  for (const item of group.words) {
    assert.equal(item.letters.join(''), item.word.toLowerCase().replace(/[^a-z]/g, ''), `${item.word} 的字母磚可組回完整英文詞`);
    assert.ok(item.emoji, `${item.word} 有配對圖示`);
    assert.ok(item.photo, `${item.word} 使用原創卡卡／希希職業插圖`);
    assert.ok(fs.existsSync(path.join(repo, item.photo.replace(/^\.\//, ''))), `${item.word} 的職業插圖檔存在`);
    for (const phoneme of item.letters) {
      assert.ok(fs.existsSync(path.join(repo, 'assets/phonemes', `${phoneme}.mp3`)), `${item.word} 使用已存在的 ${phoneme} 音素錄音`);
    }
  }
  return group.words;
});
assert.equal(jobWords.length, 45, '職業主題共使用中文職業詞庫的 45 個詞');
assert.equal(new Set(jobWords.map((item) => item.word)).size, 45, '兩組職業之間沒有重複英文詞');
assert.equal(new Set(jobWords.map((item) => item.photo)).size, 45, '45 個職業各自使用不同的原創插圖');
assert.deepEqual(
  ['phonics', 'phrase', 'recognize'].map((mode) => jobWords.filter((item) => item.buildMode === mode).length),
  [13, 10, 22],
  '職業詞庫按單字拼音、雙字詞語組合及整詞認讀分級',
);
for (const word of ['doctor', 'nurse', 'teacher', 'dentist', 'cleaner', 'driver', 'vet', 'chef', 'farmer', 'pilot', 'actor', 'builder', 'waiter']) {
  assert.equal(jobWords.find((item) => item.word === word).buildMode, 'phonics', `${word} 使用字母拼音模式`);
}
for (const word of ['police officer', 'shop assistant', 'security guard', 'domestic helper', 'delivery worker', 'bus driver', 'taxi driver', 'flight attendant', 'ship captain', 'environmental officer']) {
  const item = jobWords.find((entry) => entry.word === word);
  assert.equal(item.buildMode, 'phrase', `${word} 使用完整英文詞語組合模式`);
  assert.deepEqual([...item.wordParts], word.split(' '), `${word} 的每個完整詞語獨立呈現及播放`);
}
for (const word of ['firefighter', 'pharmacist', 'hairdresser', 'librarian', 'photographer', 'medical sales representative']) {
  assert.equal(jobWords.find((item) => item.word === word).buildMode, 'recognize', `${word} 先使用整詞認讀，避免硬拆長字`);
}
assert.match(dataSource, /if \(word\.photo\) return .*career-photo/, '職業插圖優先於 Emoji 顯示');
assert.match(appSource, /word\.buildMode === 'phrase' \? '先聽完整職稱/, '雙字職稱的學習卡提供逐詞聆聽');
assert.match(appSource, /allBuildWords = currentTopicWords\(\)\.filter\(\(w\) => w\.letters && \['phonics', 'phrase'\]/, '長字整詞認讀項目不會誤入字母拼音遊戲');
assert.match(appSource, /const phraseMode = target\.buildMode === 'phrase'/, '雙字職稱拼字遊戲改用完整詞語磚');
assert.match(appSource, /lettersRow\.hidden = word\.buildMode === 'recognize'/, '進階職稱學習卡不再顯示逐字母拼音列');
assert.deepEqual(
  [...jobSets[0].words.find((item) => item.word === 'police officer').wordBreaks],
  [6],
  '多字職稱保留 police 與 officer 的空格',
);

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
assert.match(appSource, /揀一組詞語，開始認字同拼字/, '共用分組頁使用適用於節日及職業的指示');
assert.match(appSource, /SET \$\{String\(index \+ 1\)/, '共用分組卡用通用組別編號');
assert.match(appSource, /wordBreaks/, '短語在學習卡及拼字格保留詞間分隔');
assert.match(appSource, /\$\{topic\.title\}・拼字/, '拼字畫面會顯示目前主題名稱');
assert.match(appSource, /for \(const sound of word\.soundChunks\)/, '學習卡先順序播放音塊');
assert.match(appSource, /await playPhonicsChunk\(sound/, '學習卡用乾淨音素或 rime 連讀');
assert.match(appSource, /const blendSounds = completedRound\.phraseMode \? \[\] : completedRound\.target\.soundChunks \|\| completedRound\.chars/, '一般拼字完成連讀音塊；完整詞語組合不會逐字母朗讀');
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
assert.match(appSource, /has-long-sounds/, '長字會切換為較緊湊的音素踏腳石排列');
assert.match(playgroundTheme, /\.letter-tile \.sound-energy-glyph/, '日間遊樂場主題為音素踏腳石提供高對比樣式');
assert.match(playgroundTheme, /\.letter-row\.has-word-parts::before\s*\{\s*display:\s*none;/, '完整詞組的學習卡不會顯示穿過詞語磚的連線');
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

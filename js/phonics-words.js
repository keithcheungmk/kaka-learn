/** SPACE RANGER PHONICS（49 音溫習 + CVC 詞族 + 常見字）
 *  獨立資料檔，唔改動 js/words.js 嘅任何現有內容。
 *  插圖同中文認字 app 一樣用系統 Emoji；字母統一用 Ranger Sound Energy 節點，
 *  唔用擬人方塊角色，避免表情搶走字形同讀音焦點。
 *
 *  聲音訓練基地：媽媽錄製的 49 音分成 3 大類、13 個短 Mission；每組先聽熟，再做辨音。
 *  常見字：整詞認讀（listen；有清楚 emoji 先開 match）；唔開 build。
 *  抽象字（a/is/the/to…）可以唔配圖；動作／顏色／數優先配清晰 emoji。
 */

/** 媽媽錄製的 49 個 Letters and Sounds 音素：先按類別搵音，再按小組練習。 */
const PHONICS_SOUND_SECTIONS = [
  {
    id: 'basic',
    title: '基礎單字母音',
    count: 25,
    blurb: '由常用音開始，愈早可以拼出簡單英文字。',
    groups: [
      { id: 'sound_01', label: '起步音', sounds: ['s', 'a', 't', 'p'] },
      { id: 'sound_02', label: '拼讀擴展', sounds: ['i', 'n', 'm', 'd'] },
      { id: 'sound_03', label: '短母音與 /k/', sounds: ['g', 'o', 'c', 'k'] },
      { id: 'sound_04', label: '新短母音', sounds: ['e', 'u', 'r'] },
      { id: 'sound_05', label: '常用輔音', sounds: ['h', 'b', 'f', 'l'] },
      { id: 'sound_06', label: '進階單字母音', sounds: ['j', 'v', 'w', 'x', 'y', 'z'] },
    ],
  },
  {
    id: 'consonants',
    title: '輔音組合',
    count: 10,
    blurb: '兩個字母一齊看，連成一個清楚聲音。',
    groups: [
      { id: 'sound_07', label: '相同音・不同拼法', sounds: ['ck', 'ff', 'll', 'ss', 'zz'] },
      { id: 'sound_08', label: '兩字母新聲音', sounds: ['ch', 'sh', 'th', 'ng', 'qu'] },
    ],
  },
  {
    id: 'vowels',
    title: '母音組合',
    count: 14,
    blurb: '認識長母音、滑音及 r 音組合。',
    groups: [
      { id: 'sound_09', label: '長母音組合', sounds: ['ai', 'ee', 'igh', 'oa'] },
      { id: 'sound_10', label: 'oo 長短音', sounds: ['oo-long', 'oo-short'] },
      { id: 'sound_11', label: 'r 音組合', sounds: ['ar', 'or', 'ur', 'er'] },
      { id: 'sound_12', label: '滑音組合', sounds: ['ow', 'oi'] },
      { id: 'sound_13', label: '其他母音組合', sounds: ['ear', 'air'] },
    ],
  },
];

const PHONICS_SOUND_MISSIONS = PHONICS_SOUND_SECTIONS.flatMap((section) => section.groups).map((mission) => ({
  ...mission,
  words: mission.sounds.map((sound) => ({
    id: `sound_${sound.replace('-', '_')}`,
    word: sound,
    kind: 'phoneme',
  })),
}));

const LETTER_REVISION = PHONICS_SOUND_MISSIONS.flatMap((mission) => mission.sounds);

/** 主題：字母溫習排最前；跟住 CVC 詞族；sight words */
const PHONICS_TOPICS = [
  {
    id: 'letters_rev',
    title: '字母音訓練基地',
    blurb: '3 大分類 · 13 個 Sound Missions · 49 音',
    cover: '🔤',
    modes: ['listen'],
    soundMissions: PHONICS_SOUND_MISSIONS,
    words: PHONICS_SOUND_MISSIONS.flatMap((mission) => mission.words),
  },
  {
    id: 'cvc_at',
    title: '拼一拼・-at',
    blurb: 'cat · hat · bat · rat · mat',
    cover: '🐱',
    modes: ['listen', 'match', 'build'],
    words: [
      { id: 'cat', word: 'cat', letters: ['c', 'a', 't'], emoji: '🐱', plate: '#1a4d3a' },
      { id: 'hat', word: 'hat', letters: ['h', 'a', 't'], emoji: '🎩', plate: '#3a3010' },
      { id: 'bat', word: 'bat', letters: ['b', 'a', 't'], emoji: '🦇', plate: '#1a1a22' },
      { id: 'rat', word: 'rat', letters: ['r', 'a', 't'], emoji: '🐀', plate: '#2a2a35' },
      { id: 'mat', word: 'mat', letters: ['m', 'a', 't'], emoji: '🟫', plate: '#402010' },
    ],
  },
  {
    id: 'cvc_an',
    title: '拼一拼・-an',
    blurb: 'can · pan · man · van · fan',
    cover: '🚐',
    modes: ['listen', 'match', 'build'],
    words: [
      { id: 'can', word: 'can', letters: ['c', 'a', 'n'], emoji: '🥫', plate: '#3a3a45' },
      { id: 'pan', word: 'pan', letters: ['p', 'a', 'n'], emoji: '🍳', plate: '#3a3010' },
      { id: 'man', word: 'man', letters: ['m', 'a', 'n'], emoji: '👨', plate: '#1a3050' },
      { id: 'van', word: 'van', letters: ['v', 'a', 'n'], emoji: '🚐', plate: '#102848' },
      { id: 'fan', word: 'fan', letters: ['f', 'a', 'n'], emoji: '🪭', plate: '#2a1840' },
    ],
  },
  {
    id: 'cvc_ap',
    title: '拼一拼・-ap',
    blurb: 'cap · map · tap · nap',
    cover: '🧢',
    modes: ['listen', 'match', 'build'],
    words: [
      { id: 'cap', word: 'cap', letters: ['c', 'a', 'p'], emoji: '🧢', plate: '#102848' },
      { id: 'map', word: 'map', letters: ['m', 'a', 'p'], emoji: '🗺️', plate: '#143828' },
      { id: 'tap', word: 'tap', letters: ['t', 'a', 'p'], emoji: '🚰', plate: '#0f3550' },
      { id: 'nap', word: 'nap', letters: ['n', 'a', 'p'], emoji: '😴', plate: '#1a2a4a' },
    ],
  },
  {
    id: 'cvc_in',
    title: '拼一拼・-in',
    blurb: 'pin · tin · bin · win',
    cover: '📌',
    modes: ['listen', 'match', 'build'],
    words: [
      { id: 'pin', word: 'pin', letters: ['p', 'i', 'n'], emoji: '📌', plate: '#401018' },
      { id: 'tin', word: 'tin', letters: ['t', 'i', 'n'], emoji: '🫙', plate: '#2a3548' },
      { id: 'bin', word: 'bin', letters: ['b', 'i', 'n'], emoji: '🗑️', plate: '#3a3a45' },
      { id: 'win', word: 'win', letters: ['w', 'i', 'n'], emoji: '🏆', plate: '#3a3010' },
    ],
  },
  {
    id: 'cvc_ig',
    title: '拼一拼・-ig',
    blurb: 'pig · dig · big · wig',
    cover: '🐷',
    modes: ['listen', 'match', 'build'],
    words: [
      { id: 'pig', word: 'pig', letters: ['p', 'i', 'g'], emoji: '🐷', plate: '#402030' },
      { id: 'dig', word: 'dig', letters: ['d', 'i', 'g'], emoji: '⛏️', plate: '#3a2818' },
      { id: 'big', word: 'big', letters: ['b', 'i', 'g'], emoji: '🐘', plate: '#243040' },
      { id: 'wig', word: 'wig', letters: ['w', 'i', 'g'], emoji: '💇', plate: '#281840' },
    ],
  },
  {
    id: 'cvc_ot',
    title: '拼一拼・-ot',
    blurb: 'pot · hot · cot',
    cover: '🍲',
    modes: ['listen', 'match', 'build'],
    words: [
      { id: 'pot', word: 'pot', letters: ['p', 'o', 't'], emoji: '🍲', plate: '#3a3010' },
      { id: 'hot', word: 'hot', letters: ['h', 'o', 't'], emoji: '🥵', plate: '#402010' },
      { id: 'cot', word: 'cot', letters: ['c', 'o', 't'], emoji: '🛏️', plate: '#1a2a4a' },
    ],
  },
  {
    id: 'cvc_og',
    title: '拼一拼・-og',
    blurb: 'dog · fog · log',
    cover: '🐶',
    modes: ['listen', 'match', 'build'],
    words: [
      { id: 'dog', word: 'dog', letters: ['d', 'o', 'g'], emoji: '🐶', plate: '#3a3010' },
      { id: 'fog', word: 'fog', letters: ['f', 'o', 'g'], emoji: '🌫️', plate: '#2a3a50' },
      { id: 'log', word: 'log', letters: ['l', 'o', 'g'], emoji: '🪵', plate: '#3a2818' },
    ],
  },
  {
    id: 'sight1',
    title: '常見字・1',
    blurb: 'I · a · is · my · see · the',
    cover: '👀',
    modes: ['listen', 'match'],
    words: [
      { id: 'sw_i', word: 'I', emoji: '🙋', plate: '#1a3a58' },
      { id: 'sw_a', word: 'a' },
      { id: 'sw_is', word: 'is' },
      { id: 'sw_my', word: 'my', emoji: '🧸', plate: '#3a2818' },
      { id: 'sw_see', word: 'see', emoji: '👀', plate: '#1a2a4a' },
      { id: 'sw_the', word: 'the' },
    ],
  },
  {
    id: 'sight2',
    title: '常見字・2',
    blurb: 'to · me · we · go · no · you',
    cover: '🚶',
    modes: ['listen', 'match'],
    words: [
      { id: 'sw_to', word: 'to' },
      { id: 'sw_me', word: 'me', emoji: '🪞', plate: '#2a3548' },
      { id: 'sw_we', word: 'we', emoji: '👥', plate: '#1a3050' },
      { id: 'sw_go', word: 'go', emoji: '🚶', plate: '#143828' },
      { id: 'sw_no', word: 'no', emoji: '🙅', plate: '#401018' },
      { id: 'sw_you', word: 'you', emoji: '👆', plate: '#3a3010' },
    ],
  },
  {
    id: 'sight3',
    title: '常見字・3・動作',
    blurb: 'look · up · down · run · jump · play',
    cover: '🏃',
    modes: ['listen', 'match'],
    words: [
      { id: 'sw_look', word: 'look', emoji: '🔍', plate: '#1a2a4a' },
      { id: 'sw_up', word: 'up', emoji: '⬆️', plate: '#102848' },
      { id: 'sw_down', word: 'down', emoji: '⬇️', plate: '#2a1840' },
      { id: 'sw_run', word: 'run', emoji: '🏃', plate: '#143828' },
      { id: 'sw_jump', word: 'jump', emoji: '🦘', plate: '#3a3010' },
      { id: 'sw_play', word: 'play', emoji: '⚽', plate: '#1a4d3a' },
    ],
  },
  {
    id: 'sight4',
    title: '常見字・4・顏色數',
    blurb: 'red · blue · yellow · green · one · two · three',
    cover: '🔴',
    modes: ['listen', 'match'],
    words: [
      { id: 'sw_red', word: 'red', emoji: '🔴', plate: '#401018' },
      { id: 'sw_blue', word: 'blue', emoji: '🔵', plate: '#102848' },
      { id: 'sw_yellow', word: 'yellow', emoji: '🟡', plate: '#3a3010' },
      { id: 'sw_green', word: 'green', emoji: '🟢', plate: '#143828' },
      { id: 'sw_one', word: 'one', emoji: '1️⃣', plate: '#1a3a58' },
      { id: 'sw_two', word: 'two', emoji: '2️⃣', plate: '#2a1840' },
      { id: 'sw_three', word: 'three', emoji: '3️⃣', plate: '#3a2818' },
    ],
  },
];

function getPhonicsTopicById(id) {
  return PHONICS_TOPICS.find((t) => t.id === id);
}

function isLetterItem(item) {
  return !!(item && (item.kind === 'letter' || item.kind === 'phoneme'));
}

/** 呢個主題入面所有詞出現過嘅字母（去重，做「砌一砌」字池） */
function phonicsLetterPool(topic) {
  const set = new Set();
  (topic?.words || []).forEach((w) => (w.letters || []).forEach((ch) => set.add(ch)));
  return [...set];
}

/** 產生卡片插圖 HTML（同中文 app 嘅 wordIllustHtml 一樣風格，方便共用視覺） */
function phonicsWordIllustHtml(word) {
  if (!word || !word.emoji) return '';
  return `<span class="emoji-plate" style="--plate:${word.plate || '#122848'}">
    <span class="emoji-face" aria-hidden="true">${window.KakaEmojiArt ? window.KakaEmojiArt.html(word.emoji) : word.emoji}</span>
  </span>`;
}

/** Ranger Sound Energy：只突出字形；互動狀態由 CSS 光環表達。 */
function letterTileHtml(ch) {
  return `<span class="sound-energy-glyph">${ch}</span>`;
}

window.KakaPhonicsWords = {
  LETTER_REVISION,
  PHONICS_SOUND_SECTIONS,
  PHONICS_SOUND_MISSIONS,
  PHONICS_TOPICS,
  getPhonicsTopicById,
  isLetterItem,
  phonicsLetterPool,
  phonicsWordIllustHtml,
  letterTileHtml,
};

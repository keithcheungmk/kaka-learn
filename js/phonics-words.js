/** SPACE RANGER PHONICS — Phase A curriculum model
 *  獨立資料檔，唔改動 js/words.js。
 *  graphemes = 音素拼寫單位（digraph／trigraph 唔拆開）；過渡期相容 letters。
 *  首頁分區：Sound Training / Blend Words / Tricky Words（+ Vocabulary Missions）。
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

/** 可解碼單字庫（graphemes 為音素單位；letters 過渡相容） */
const PHONICS_WORDS = [
  // Stage 1 — s a t p
  { id: 'sat', word: 'sat', graphemes: ['s', 'a', 't'], letters: ['s', 'a', 't'], meaningArt: { emoji: '🪑', plate: '#1a2a4a' }, introducedIn: 'blend_01' },
  { id: 'pat', word: 'pat', graphemes: ['p', 'a', 't'], letters: ['p', 'a', 't'], meaningArt: { emoji: '👋', plate: '#2a1840' }, introducedIn: 'blend_01' },
  { id: 'tap', word: 'tap', graphemes: ['t', 'a', 'p'], letters: ['t', 'a', 'p'], meaningArt: { emoji: '🚰', plate: '#0f3550' }, introducedIn: 'blend_01' },
  // Stage 2 — + i n m d
  { id: 'sit', word: 'sit', graphemes: ['s', 'i', 't'], letters: ['s', 'i', 't'], meaningArt: { emoji: '🪑', plate: '#143828' }, introducedIn: 'blend_02' },
  { id: 'pin', word: 'pin', graphemes: ['p', 'i', 'n'], letters: ['p', 'i', 'n'], meaningArt: { emoji: '📌', plate: '#401018' }, introducedIn: 'blend_02' },
  { id: 'tin', word: 'tin', graphemes: ['t', 'i', 'n'], letters: ['t', 'i', 'n'], meaningArt: { emoji: '🫙', plate: '#2a3548' }, introducedIn: 'blend_02' },
  { id: 'mat', word: 'mat', graphemes: ['m', 'a', 't'], letters: ['m', 'a', 't'], meaningArt: { emoji: '🟫', plate: '#402010' }, introducedIn: 'blend_02' },
  { id: 'map', word: 'map', graphemes: ['m', 'a', 'p'], letters: ['m', 'a', 'p'], meaningArt: { emoji: '🗺️', plate: '#143828' }, introducedIn: 'blend_02' },
  { id: 'nap', word: 'nap', graphemes: ['n', 'a', 'p'], letters: ['n', 'a', 'p'], meaningArt: { emoji: '😴', plate: '#1a2a4a' }, introducedIn: 'blend_02' },
  { id: 'man', word: 'man', graphemes: ['m', 'a', 'n'], letters: ['m', 'a', 'n'], meaningArt: { emoji: '👨', plate: '#1a3050' }, introducedIn: 'blend_02' },
  { id: 'pan', word: 'pan', graphemes: ['p', 'a', 'n'], letters: ['p', 'a', 'n'], meaningArt: { emoji: '🍳', plate: '#3a3010' }, introducedIn: 'blend_02' },
  { id: 'dip', word: 'dip', graphemes: ['d', 'i', 'p'], letters: ['d', 'i', 'p'], meaningArt: { emoji: '🥣', plate: '#3a2818' }, introducedIn: 'blend_02' },
  // Stage 3 — + g o c k
  { id: 'cat', word: 'cat', graphemes: ['c', 'a', 't'], letters: ['c', 'a', 't'], meaningArt: { emoji: '🐱', plate: '#1a4d3a' }, introducedIn: 'blend_03' },
  { id: 'can', word: 'can', graphemes: ['c', 'a', 'n'], letters: ['c', 'a', 'n'], meaningArt: { emoji: '🥫', plate: '#3a3a45' }, introducedIn: 'blend_03' },
  { id: 'cap', word: 'cap', graphemes: ['c', 'a', 'p'], letters: ['c', 'a', 'p'], meaningArt: { emoji: '🧢', plate: '#102848' }, introducedIn: 'blend_03' },
  { id: 'pot', word: 'pot', graphemes: ['p', 'o', 't'], letters: ['p', 'o', 't'], meaningArt: { emoji: '🍲', plate: '#3a3010' }, introducedIn: 'blend_03' },
  { id: 'cot', word: 'cot', graphemes: ['c', 'o', 't'], letters: ['c', 'o', 't'], meaningArt: { emoji: '🛏️', plate: '#1a2a4a' }, introducedIn: 'blend_03' },
  { id: 'dog', word: 'dog', graphemes: ['d', 'o', 'g'], letters: ['d', 'o', 'g'], meaningArt: { emoji: '🐶', plate: '#3a3010' }, introducedIn: 'blend_03' },
  { id: 'fog', word: 'fog', graphemes: ['f', 'o', 'g'], letters: ['f', 'o', 'g'], meaningArt: { emoji: '🌫️', plate: '#2a3a50' }, introducedIn: 'blend_05' },
  { id: 'log', word: 'log', graphemes: ['l', 'o', 'g'], letters: ['l', 'o', 'g'], meaningArt: { emoji: '🪵', plate: '#3a2818' }, introducedIn: 'blend_05' },
  { id: 'pig', word: 'pig', graphemes: ['p', 'i', 'g'], letters: ['p', 'i', 'g'], meaningArt: { emoji: '🐷', plate: '#402030' }, introducedIn: 'blend_03' },
  { id: 'dig', word: 'dig', graphemes: ['d', 'i', 'g'], letters: ['d', 'i', 'g'], meaningArt: { emoji: '⛏️', plate: '#3a2818' }, introducedIn: 'blend_03' },
  { id: 'big', word: 'big', graphemes: ['b', 'i', 'g'], letters: ['b', 'i', 'g'], meaningArt: { emoji: '🐘', plate: '#243040' }, introducedIn: 'blend_05' },
  // Stage 4 — + e u r
  { id: 'rat', word: 'rat', graphemes: ['r', 'a', 't'], letters: ['r', 'a', 't'], meaningArt: { emoji: '🐀', plate: '#2a2a35' }, introducedIn: 'blend_04' },
  // Stage 5 — + h b f l
  { id: 'hat', word: 'hat', graphemes: ['h', 'a', 't'], letters: ['h', 'a', 't'], meaningArt: { emoji: '🎩', plate: '#3a3010' }, introducedIn: 'blend_05' },
  { id: 'bat', word: 'bat', graphemes: ['b', 'a', 't'], letters: ['b', 'a', 't'], meaningArt: { emoji: '🦇', plate: '#1a1a22' }, introducedIn: 'blend_05' },
  { id: 'hot', word: 'hot', graphemes: ['h', 'o', 't'], letters: ['h', 'o', 't'], meaningArt: { emoji: '🥵', plate: '#402010' }, introducedIn: 'blend_05' },
  { id: 'bin', word: 'bin', graphemes: ['b', 'i', 'n'], letters: ['b', 'i', 'n'], meaningArt: { emoji: '🗑️', plate: '#3a3a45' }, introducedIn: 'blend_05' },
  { id: 'fan', word: 'fan', graphemes: ['f', 'a', 'n'], letters: ['f', 'a', 'n'], meaningArt: { emoji: '🪭', plate: '#2a1840' }, introducedIn: 'blend_05' },
  // Stage 6 — + j v w x y z
  { id: 'van', word: 'van', graphemes: ['v', 'a', 'n'], letters: ['v', 'a', 'n'], meaningArt: { emoji: '🚐', plate: '#102848' }, introducedIn: 'blend_06' },
  { id: 'win', word: 'win', graphemes: ['w', 'i', 'n'], letters: ['w', 'i', 'n'], meaningArt: { emoji: '🏆', plate: '#3a3010' }, introducedIn: 'blend_06' },
  { id: 'wig', word: 'wig', graphemes: ['w', 'i', 'g'], letters: ['w', 'i', 'g'], meaningArt: { emoji: '💇', plate: '#281840' }, introducedIn: 'blend_06' },
  // Stage 7 — digraph architecture sample (sh)
  { id: 'ship', word: 'ship', graphemes: ['sh', 'i', 'p'], letters: ['sh', 'i', 'p'], meaningArt: { emoji: '🚢', plate: '#0f3550' }, introducedIn: 'blend_07' },
];

/** 拼讀任務：按已學聲音累積；唔硬鎖 */
const PHONICS_STAGES = [
  {
    id: 'blend_01',
    order: 1,
    title: 'First Sound Mission',
    focusSounds: ['s', 'a', 't', 'p'],
    reviewSounds: [],
    wordIds: ['sat', 'pat', 'tap'],
    trickyWordIds: [],
  },
  {
    id: 'blend_02',
    order: 2,
    title: 'New Sound Mission',
    focusSounds: ['i', 'n', 'm', 'd'],
    reviewSounds: ['s', 'a', 't', 'p'],
    wordIds: ['sit', 'pin', 'tin', 'mat', 'map', 'nap', 'man', 'pan', 'dip'],
    trickyWordIds: ['sw_i'],
  },
  {
    id: 'blend_03',
    order: 3,
    title: 'Short Vowels & /k/',
    focusSounds: ['g', 'o', 'c', 'k'],
    reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd'],
    wordIds: ['cat', 'can', 'cap', 'pot', 'cot', 'dog', 'pig', 'dig'],
    trickyWordIds: [],
  },
  {
    id: 'blend_04',
    order: 4,
    title: 'New Short Vowels',
    focusSounds: ['e', 'u', 'r'],
    reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k'],
    wordIds: ['rat'],
    trickyWordIds: [],
  },
  {
    id: 'blend_05',
    order: 5,
    title: 'Useful Consonants',
    focusSounds: ['h', 'b', 'f', 'l'],
    reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r'],
    wordIds: ['hat', 'bat', 'hot', 'bin', 'fan', 'fog', 'log', 'big'],
    trickyWordIds: [],
  },
  {
    id: 'blend_06',
    order: 6,
    title: 'More Letter Sounds',
    focusSounds: ['j', 'v', 'w', 'x', 'y', 'z'],
    reviewSounds: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'e', 'u', 'r', 'h', 'b', 'f', 'l'],
    wordIds: ['van', 'win', 'wig'],
    trickyWordIds: [],
  },
  {
    id: 'blend_07',
    order: 7,
    title: 'Digraph Preview · sh',
    focusSounds: ['sh'],
    reviewSounds: ['i', 'p'],
    wordIds: ['ship'],
    trickyWordIds: [],
  },
];

/** Tricky Words：現階段未能純靠 phonics 解碼的字 */
const PHONICS_TRICKY_SETS = [
  {
    id: 'sight1',
    title: 'Tricky Words · 1',
    blurb: 'I · a · is · my · see · the',
    modes: ['listen', 'match'],
    wordIds: ['sw_i', 'sw_a', 'sw_is', 'sw_my', 'sw_see', 'sw_the'],
  },
  {
    id: 'sight2',
    title: 'Tricky Words · 2',
    blurb: 'to · me · we · go · no · you',
    modes: ['listen', 'match'],
    wordIds: ['sw_to', 'sw_me', 'sw_we', 'sw_go', 'sw_no', 'sw_you'],
  },
];

/** Vocabulary Missions：顏色／數字／動作 — 唔當 Tricky Words */
const PHONICS_VOCAB_SETS = [
  {
    id: 'sight3',
    title: 'Vocabulary · Actions',
    blurb: 'look · up · down · run · jump · play',
    modes: ['listen', 'match'],
    wordIds: ['sw_look', 'sw_up', 'sw_down', 'sw_run', 'sw_jump', 'sw_play'],
  },
  {
    id: 'sight4',
    title: 'Vocabulary · Colours & Numbers',
    blurb: 'red · blue · yellow · green · one · two · three',
    modes: ['listen', 'match'],
    wordIds: ['sw_red', 'sw_blue', 'sw_yellow', 'sw_green', 'sw_one', 'sw_two', 'sw_three'],
  },
];

/** Sight / vocab 字卡（無 graphemes） */
const PHONICS_SIGHT_WORDS = [
  { id: 'sw_i', word: 'I', emoji: '🙋', plate: '#1a3a58' },
  { id: 'sw_a', word: 'a' },
  { id: 'sw_is', word: 'is' },
  { id: 'sw_my', word: 'my', emoji: '🧸', plate: '#3a2818' },
  { id: 'sw_see', word: 'see', emoji: '👀', plate: '#1a2a4a' },
  { id: 'sw_the', word: 'the' },
  { id: 'sw_to', word: 'to' },
  { id: 'sw_me', word: 'me', emoji: '🪞', plate: '#2a3548' },
  { id: 'sw_we', word: 'we', emoji: '👥', plate: '#1a3050' },
  { id: 'sw_go', word: 'go', emoji: '🚶', plate: '#143828' },
  { id: 'sw_no', word: 'no', emoji: '🙅', plate: '#401018' },
  { id: 'sw_you', word: 'you', emoji: '👆', plate: '#3a3010' },
  { id: 'sw_look', word: 'look', emoji: '🔍', plate: '#1a2a4a' },
  { id: 'sw_up', word: 'up', emoji: '⬆️', plate: '#102848' },
  { id: 'sw_down', word: 'down', emoji: '⬇️', plate: '#2a1840' },
  { id: 'sw_run', word: 'run', emoji: '🏃', plate: '#143828' },
  { id: 'sw_jump', word: 'jump', emoji: '🦘', plate: '#3a3010' },
  { id: 'sw_play', word: 'play', emoji: '⚽', plate: '#1a4d3a' },
  { id: 'sw_red', word: 'red', emoji: '🔴', plate: '#401018' },
  { id: 'sw_blue', word: 'blue', emoji: '🔵', plate: '#102848' },
  { id: 'sw_yellow', word: 'yellow', emoji: '🟡', plate: '#3a3010' },
  { id: 'sw_green', word: 'green', emoji: '🟢', plate: '#143828' },
  { id: 'sw_one', word: 'one', emoji: '1️⃣', plate: '#1a3a58' },
  { id: 'sw_two', word: 'two', emoji: '2️⃣', plate: '#2a1840' },
  { id: 'sw_three', word: 'three', emoji: '3️⃣', plate: '#3a2818' },
];

const PHONICS_WORD_BY_ID = Object.create(null);
PHONICS_WORDS.forEach((w) => {
  PHONICS_WORD_BY_ID[w.id] = w;
});
PHONICS_SIGHT_WORDS.forEach((w) => {
  PHONICS_WORD_BY_ID[w.id] = w;
});

/** graphemes 優先；過渡期 fallback letters */
function wordGraphemes(word) {
  if (!word) return [];
  if (Array.isArray(word.graphemes) && word.graphemes.length) return word.graphemes;
  if (Array.isArray(word.letters) && word.letters.length) return word.letters;
  return [];
}

function getPhonicsWordById(id) {
  return PHONICS_WORD_BY_ID[id] || null;
}

function resolveWordList(ids) {
  return (ids || []).map((id) => getPhonicsWordById(id)).filter(Boolean);
}

function topicWordView(word) {
  if (!word) return null;
  const graphemes = wordGraphemes(word);
  const art = word.meaningArt || {};
  const emoji = word.emoji || art.emoji;
  const plate = word.plate || art.plate;
  const view = {
    id: word.id,
    word: word.word,
    kind: word.kind,
  };
  if (graphemes.length) {
    view.graphemes = graphemes;
    view.letters = graphemes.slice();
  }
  if (emoji) view.emoji = emoji;
  if (plate) view.plate = plate;
  return view;
}

function getPhonicsStageById(id) {
  return PHONICS_STAGES.find((s) => s.id === id) || null;
}

/** 舊詞族 id → 仍可進入（唔遺失內容）；內部指向對應字表 */
const LEGACY_CVC_TOPIC_WORDS = {
  cvc_at: ['cat', 'hat', 'bat', 'rat', 'mat'],
  cvc_an: ['can', 'pan', 'man', 'van', 'fan'],
  cvc_ap: ['cap', 'map', 'tap', 'nap'],
  cvc_in: ['pin', 'tin', 'bin', 'win'],
  cvc_ig: ['pig', 'dig', 'big', 'wig'],
  cvc_ot: ['pot', 'hot', 'cot'],
  cvc_og: ['dog', 'fog', 'log'],
};

function buildStageTopic(stage) {
  const words = resolveWordList(stage.wordIds).map(topicWordView);
  return {
    id: stage.id,
    title: stage.title,
    blurb: stage.focusSounds.join(' · '),
    cover: '',
    modes: ['listen', 'match', 'build'],
    hubZone: 'blend',
    stage,
    focusSounds: stage.focusSounds,
    reviewSounds: stage.reviewSounds || [],
    words,
  };
}

function buildSightTopic(set, hubZone) {
  const words = resolveWordList(set.wordIds).map(topicWordView);
  return {
    id: set.id,
    title: set.title,
    blurb: set.blurb,
    cover: '',
    modes: set.modes || ['listen', 'match'],
    hubZone,
    words,
  };
}

/** 相容層：舊 API 仍用 PHONICS_TOPICS / getPhonicsTopicById */
const PHONICS_TOPICS = [
  {
    id: 'letters_rev',
    title: '字母音訓練基地',
    blurb: '3 大分類 · 13 個 Sound Missions · 49 音',
    cover: '',
    modes: ['listen'],
    hubZone: 'sounds',
    soundMissions: PHONICS_SOUND_MISSIONS,
    words: PHONICS_SOUND_MISSIONS.flatMap((mission) => mission.words),
  },
  ...PHONICS_STAGES.map(buildStageTopic),
  ...PHONICS_TRICKY_SETS.map((set) => buildSightTopic(set, 'tricky')),
  ...PHONICS_VOCAB_SETS.map((set) => buildSightTopic(set, 'vocab')),
];

Object.entries(LEGACY_CVC_TOPIC_WORDS).forEach(([id, wordIds]) => {
  PHONICS_TOPICS.push({
    id,
    title: id.replace('cvc_', '拼一拼・-'),
    blurb: wordIds.join(' · '),
    cover: '',
    modes: ['listen', 'match', 'build'],
    hubZone: 'blend-legacy',
    legacy: true,
    words: resolveWordList(wordIds).map(topicWordView),
  });
});

function getPhonicsTopicById(id) {
  return PHONICS_TOPICS.find((t) => t.id === id) || null;
}

function isLetterItem(item) {
  return !!(item && (item.kind === 'letter' || item.kind === 'phoneme'));
}

/** 呢個主題入面所有詞出現過嘅 grapheme（去重，做「砌一砌」字池） */
function phonicsLetterPool(topic) {
  const set = new Set();
  (topic?.words || []).forEach((w) => wordGraphemes(w).forEach((ch) => set.add(ch)));
  return [...set];
}

/** 產生卡片插圖 HTML（同中文 app 嘅 wordIllustHtml 一樣風格） */
function phonicsWordIllustHtml(word) {
  if (!word) return '';
  const emoji = word.emoji || word.meaningArt?.emoji;
  const plate = word.plate || word.meaningArt?.plate || '#122848';
  if (!emoji) return '';
  return `<span class="emoji-plate" style="--plate:${plate}">
    <span class="emoji-face" aria-hidden="true">${window.KakaEmojiArt ? window.KakaEmojiArt.html(emoji) : emoji}</span>
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
  PHONICS_WORDS,
  PHONICS_STAGES,
  PHONICS_TRICKY_SETS,
  PHONICS_VOCAB_SETS,
  PHONICS_TOPICS,
  getPhonicsTopicById,
  getPhonicsStageById,
  getPhonicsWordById,
  wordGraphemes,
  isLetterItem,
  phonicsLetterPool,
  phonicsWordIllustHtml,
  letterTileHtml,
};

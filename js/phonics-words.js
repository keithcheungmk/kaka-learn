/** SPACE RANGER PHONICS（49 音溫習 + CVC 詞族 + 常見字）
 *  獨立資料檔，唔改動 js/words.js 嘅任何現有內容。
 *  插圖同中文認字 app 一樣用系統 Emoji；字母統一用 Ranger Sound Energy 節點，
 *  唔用擬人方塊角色，避免表情搶走字形同讀音焦點。
 *
 *  聲音訓練基地：媽媽錄製的 49 音；每組先聽熟，再做辨音。
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

/** 保留短語的顯示空格；拼字只取英文字母，並記下詞與詞之間的位置。 */
function spellingItem(id, word, emoji, plate) {
  const terms = String(word).trim().split(/\s+/);
  let length = 0;
  const wordBreaks = [];
  terms.slice(0, -1).forEach((term) => {
    length += Array.from(term).filter((ch) => /[a-z]/i.test(ch)).length;
    wordBreaks.push(length);
  });
  return {
    id,
    word,
    letters: Array.from(terms.join('').toLowerCase()).filter((ch) => /[a-z]/.test(ch)),
    wordBreaks,
    emoji,
    plate,
  };
}

function spellingTopic({ id, title, blurb, cover, parentId = null, words }) {
  return {
    id,
    title,
    blurb,
    cover,
    parentId,
    flow: 'blend',
    modes: ['build'],
    words: words.map(([word, emoji, plate], index) => spellingItem(`${id}_${index}`, word, emoji, plate)),
  };
}

const HK_FESTIVAL_TOPICS = [
  spellingTopic({
    id: 'festival_christmas', title: 'Christmas', blurb: '10 個聖誕英文詞語', cover: '🎄', parentId: 'hk_festivals',
    words: [
      ['Santa Claus', '🎅', '#401018'], ['reindeer', '🦌', '#3a2818'], ['sleigh', '🛷', '#1a3050'], ['stocking', '🧦', '#401018'], ['present', '🎁', '#2a1840'],
      ['tree', '🎄', '#143828'], ['ornament', '🔴', '#401018'], ['gingerbread', '🍪', '#3a2818'], ['snowman', '☃️', '#1a3050'], ['bell', '🔔', '#3a3010'],
    ],
  }),
  spellingTopic({
    id: 'festival_lunar_new_year', title: 'Lunar New Year', blurb: '10 個農曆新年英文詞語', cover: '🧧', parentId: 'hk_festivals',
    words: [
      ['red packet', '🧧', '#401018'], ['lion dance', '🦁', '#3a2818'], ['firecracker', '🧨', '#401018'], ['tangerine', '🍊', '#3a3010'], ['blossom', '🌸', '#402030'],
      ['couplet', '📜', '#401018'], ['lucky', '🍀', '#143828'], ['family', '👨‍👩‍👧‍👦', '#1a3050'], ['feast', '🍲', '#3a2818'], ['New Year', '🎊', '#401018'],
    ],
  }),
  spellingTopic({
    id: 'festival_mid_autumn', title: 'Mid-Autumn Festival', blurb: '10 個中秋節英文詞語', cover: '🥮', parentId: 'hk_festivals',
    words: [
      ['mooncake', '🥮', '#3a2818'], ['moon', '🌕', '#1a3050'], ['rabbit', '🐇', '#3a2418'], ['lantern', '🏮', '#401018'], ['pomelo', '🍊', '#3a3010'],
      ['tea', '🍵', '#143828'], ['cloud', '☁️', '#1a3050'], ['sky', '🌌', '#1a2a4a'], ['night', '🌃', '#1a2a4a'], ['harvest', '🌾', '#3a3010'],
    ],
  }),
  spellingTopic({
    id: 'festival_dragon_boat', title: 'Dragon Boat Festival', blurb: '10 個端午節英文詞語', cover: '🐉', parentId: 'hk_festivals',
    words: [
      ['dragon boat', '🐉', '#143828'], ['dumpling', '🥟', '#3a2818'], ['paddle', '🛶', '#1a3050'], ['race', '🏁', '#1a2a4a'], ['river', '🌊', '#0f3550'],
      ['team', '👥', '#1a3050'], ['drum', '🥁', '#401018'], ['flag', '🚩', '#401018'], ['water', '💧', '#0f3550'], ['winner', '🏆', '#3a3010'],
    ],
  }),
  spellingTopic({
    id: 'festival_halloween', title: 'Halloween', blurb: '10 個萬聖節英文詞語', cover: '🎃', parentId: 'hk_festivals',
    words: [
      ['pumpkin', '🎃', '#3a2818'], ['costume', '🥸', '#2a1840'], ['witch', '🧙', '#2a1840'], ['ghost', '👻', '#1a3050'], ['spider', '🕷️', '#1a1a22'],
      ['bat', '🦇', '#1a1a22'], ['candy', '🍬', '#401018'], ['mask', '🎭', '#2a1840'], ['trick', '🪄', '#2a1840'], ['treat', '🍭', '#401018'],
    ],
  }),
];

/** 主題：先由有意思的完整單字入手；字母音基地保留作針對性溫習。 */
const PHONICS_TOPICS = [
  {
    id: 'animal_spelling',
    title: '動物拼字園',
    blurb: '睇圖 · 聽音 · 逐格砌字 · 20 隻動物',
    cover: '🐱',
    section: 'sight',
    flow: 'blend',
    modes: ['build'],
    words: [
      { id: 'animal_cat', word: 'cat', letters: ['c', 'a', 't'], emoji: '🐱', plate: '#1a4d3a' },
      { id: 'animal_dog', word: 'dog', letters: ['d', 'o', 'g'], emoji: '🐶', plate: '#3a3010' },
      { id: 'animal_pig', word: 'pig', letters: ['p', 'i', 'g'], emoji: '🐷', plate: '#402030' },
      { id: 'animal_hen', word: 'hen', letters: ['h', 'e', 'n'], emoji: '🐔', plate: '#3a2818' },
      { id: 'animal_fox', word: 'fox', letters: ['f', 'o', 'x'], emoji: '🦊', plate: '#402010' },
      { id: 'animal_bat', word: 'bat', letters: ['b', 'a', 't'], emoji: '🦇', plate: '#1a1a22' },
      { id: 'animal_rat', word: 'rat', letters: ['r', 'a', 't'], emoji: '🐀', plate: '#2a2a35' },
      { id: 'animal_fish', word: 'fish', letters: ['f', 'i', 'sh'], emoji: '🐟', plate: '#0f3550' },
      { id: 'animal_frog', word: 'frog', letters: ['f', 'r', 'o', 'g'], emoji: '🐸', plate: '#143828' },
      { id: 'animal_duck', word: 'duck', letters: ['d', 'u', 'ck'], emoji: '🦆', plate: '#1a3050' },
      { id: 'animal_cow', word: 'cow', letters: ['c', 'ow'], emoji: '🐮', plate: '#2a3548' },
      { id: 'animal_owl', word: 'owl', letters: ['ow', 'l'], emoji: '🦉', plate: '#2a2440' },
      { id: 'animal_ant', word: 'ant', letters: ['a', 'n', 't'], emoji: '🐜', plate: '#3a2018' },
      { id: 'animal_bee', word: 'bee', letters: ['b', 'ee'], emoji: '🐝', plate: '#3a3010' },
      { id: 'animal_goat', word: 'goat', letters: ['g', 'oa', 't'], emoji: '🐑', plate: '#2a3a35' },
      { id: 'animal_lion', word: 'lion', letters: ['l', 'i', 'o', 'n'], emoji: '🦁', plate: '#3a2818' },
      { id: 'animal_bear', word: 'bear', letters: ['b', 'ear'], emoji: '🐻', plate: '#3a2418' },
      { id: 'animal_snail', word: 'snail', letters: ['s', 'n', 'ai', 'l'], emoji: '🐌', plate: '#16344a' },
      { id: 'animal_zebra', word: 'zebra', letters: ['z', 'e', 'b', 'r', 'a'], emoji: '🦓', plate: '#30303a' },
      { id: 'animal_monkey', word: 'monkey', letters: ['m', 'o', 'n', 'k', 'e', 'y'], emoji: '🐼', plate: '#3a2818' },
    ],
  },
  {
    id: 'sight_food', title: '食物', blurb: '睇圖 · 聽音 · 逐格砌字 · 10 種食物', cover: '🍎', section: 'sight', flow: 'blend', modes: ['build'],
    words: [
      ['rice', '🍚', ['r', 'ice']], ['bread', '🍞'], ['milk', '🥛'], ['egg', '🥚'], ['apple', '🍎'], ['banana', '🍌'], ['cake', '🍎'], ['fish', '🐟'], ['chicken', '🍗'], ['juice', '🧃'],
    ].map(([word, emoji, soundChunks], i) => ({ id: `sight_food_${i}`, word, letters: Array.from(word), soundChunks, emoji, plate: '#3a2818' })),
  },
  {
    id: 'sight_veg', title: '蔬菜', blurb: '睇圖 · 聽音 · 逐格砌字 · 10 種蔬菜', cover: '🥕', section: 'sight', flow: 'blend', modes: ['build'],
    words: [
      ['carrot', '🥕'], ['corn', '🌽'], ['tomato', '🍅'], ['potato', '🥔'], ['peas', '🌽'], ['beans', '🌽'], ['cabbage', '🥬'], ['onion', '🧅'], ['mushroom', '🍄'], ['cucumber', '🥒'],
    ].map(([word, emoji, soundChunks], i) => ({ id: `sight_veg_${i}`, word, letters: Array.from(word), soundChunks, emoji, plate: '#143828' })),
  },
  {
    id: 'sight_places', title: '地方', blurb: '睇圖 · 聽音 · 逐格砌字 · 10 個地方', cover: '🏫', section: 'sight', flow: 'blend', modes: ['build'],
    words: [
      ['home', '🏠'], ['school', '🏫'], ['park', '🌳'], ['shop', '🛍️'], ['hospital', '🏥'], ['library', '📚'], ['pool', '🏊'], ['beach', '🏖️'], ['zoo', '🦁'], ['classroom', '🧑‍🏫'],
    ].map(([word, emoji], i) => ({ id: `sight_places_${i}`, word, letters: Array.from(word), emoji, plate: '#1a3050' })),
  },
  {
    id: 'sight_vehicles', title: '車輛', blurb: '睇圖 · 聽音 · 逐格砌字 · 10 種車輛', cover: '🚕', section: 'sight', flow: 'blend', modes: ['build'],
    words: [
      ['car', '🚗'], ['bus', '🚌'], ['taxi', '🚕'], ['tram', '🚋'], ['train', '🚆'], ['truck', '🚚'], ['van', '🚐'], ['bike', '🚲'], ['ferry', '⛴️'], ['plane', '✈️'],
    ].map(([word, emoji], i) => ({ id: `sight_vehicles_${i}`, word, letters: Array.from(word), emoji, plate: '#1a3050' })),
  },
  {
    id: 'sight_fruit', title: '水果', blurb: '睇圖 · 聽音 · 逐格砌字 · 10 種水果', cover: '🍇', section: 'sight', flow: 'blend', modes: ['build'],
    words: [
      ['apple', '🍎'], ['banana', '🍌'], ['orange', '🍊'], ['grape', '🍇'], ['mango', '🥭'], ['melon', '🍈'], ['pear', '🍐'], ['peach', '🍑'], ['lemon', '🍋'], ['kiwi', '🥝'],
    ].map(([word, emoji], i) => ({ id: `sight_fruit_${i}`, word, letters: Array.from(word), emoji, plate: '#3a2818' })),
  },
  {
    id: 'sight_household', title: '家居用品', blurb: '睇圖 · 聽音 · 逐格砌字 · 10 件家居用品', cover: '🛋️', section: 'sight', flow: 'blend', modes: ['build'],
    words: [
      ['bed', '🛏️'], ['sofa', '🛋️'], ['table', '🪑'], ['chair', '🪑'], ['lamp', '💡'], ['clock', '🕰️'], ['cup', '☕'], ['plate', '🍽️'], ['spoon', '🥄'], ['towel', '🧺'],
    ].map(([word, emoji], i) => ({ id: `sight_household_${i}`, word, letters: Array.from(word), emoji, plate: '#1a3050' })),
  },
  {
    id: 'sight_school_items', title: '學校用品', blurb: '睇圖 · 聽音 · 逐格砌字 · 10 件學校用品', cover: '🎒', section: 'sight', flow: 'blend', modes: ['build'],
    words: [
      ['book', '📘'], ['bag', '🎒'], ['pen', '🖊️'], ['pencil', '✏️'], ['ruler', '📏'], ['eraser', '🧽'], ['crayon', '🖍️'], ['paper', '📄'], ['glue', '🧴'], ['scissors', '✂️'],
    ].map(([word, emoji], i) => ({ id: `sight_school_items_${i}`, word, letters: Array.from(word), emoji, plate: '#2a1840' })),
  },
  {
    id: 'hk_festivals', title: '香港節日', blurb: '5 個節日 · 50 個主題詞語', cover: '🎉', section: 'sight', collections: HK_FESTIVAL_TOPICS,
  },
  {
    id: 'letters_rev',
    title: '字母音訓練基地',
    blurb: '3 大分類 · 13 個 Sound Missions · 49 音',
    cover: '🔤',
    section: 'phonics',
    modes: ['listen'],
    soundMissions: PHONICS_SOUND_MISSIONS,
    words: PHONICS_SOUND_MISSIONS.flatMap((mission) => mission.words),
  },
  {
    id: 'cvc_at',
    title: '拼一拼・-at',
    blurb: 'cat · hat · bat · rat · mat',
    cover: '🐱',
    section: 'phonics',
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
];

function getPhonicsTopicById(id) {
  return PHONICS_TOPICS.find((t) => t.id === id) || HK_FESTIVAL_TOPICS.find((t) => t.id === id);
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

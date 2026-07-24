/** 卡卡字母隊 — English Phonics（Phase 1–2：字母溫習 + CVC 詞族 + 常見字）
 *  獨立資料檔，唔改動 js/words.js 嘅任何現有內容。
 *  插圖同中文認字 app 一樣用系統 Emoji；字母角色顏色係原創配色（見 LETTER_COLORS），
 *  唔跟任何現成教材／卡通嘅顏色配對。
 *
 *  Phase 2：字母溫習（a–z revision）+ 每個詞族一張主題卡 + 常見字第 2 批。
 *  選詞原則：優先有清晰 emoji；skip fat；digraphs 留 Phase 3。
 */

/** 每個字母固定原創顏色（「卡卡字母隊」角色配色表） */
const LETTER_COLORS = {
  // Phase 1
  c: '#fb7185',
  a: '#7cffb2',
  t: '#93a5fc',
  h: '#fbbf24',
  b: '#38bdf8',
  r: '#2dd4bf',
  m: '#c4b5fd',
  // Phase 2 CVC
  n: '#f9a8d4',
  p: '#fdba74',
  i: '#a5f3fc',
  g: '#86efac',
  d: '#fcd34d',
  w: '#ddd6fe',
  o: '#fda4af',
  f: '#67e8f9',
  v: '#bef264',
  l: '#fde68a',
  // 字母溫習（a–z 補齊）
  e: '#fca5a5',
  j: '#c4b5fd',
  k: '#5eead4',
  q: '#f0abfc',
  s: '#f9a8d4',
  u: '#93c5fd',
  x: '#fb923c',
  y: '#a3e635',
  z: '#f472b6',
};

/** 字母溫習順序（a–z；KAKA 已學過，用嚟 revision） */
const LETTER_REVISION = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

/** 主題：字母溫習排最前；跟住 CVC 詞族；sight words */
const PHONICS_TOPICS = [
  {
    id: 'letters_rev',
    title: '字母溫習',
    blurb: 'a–z · 撳住聽字母名',
    cover: '🔤',
    modes: ['listen'],
    words: LETTER_REVISION.map((ch) => ({
      id: `ltr_${ch}`,
      word: ch,
      kind: 'letter',
    })),
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
    modes: ['listen'],
    words: [
      { id: 'sw_i', word: 'I' },
      { id: 'sw_a', word: 'a' },
      { id: 'sw_is', word: 'is' },
      { id: 'sw_my', word: 'my' },
      { id: 'sw_see', word: 'see' },
      { id: 'sw_the', word: 'the' },
    ],
  },
  {
    id: 'sight2',
    title: '常見字・2',
    blurb: 'to · me · we · go · no · you',
    cover: '🚶',
    modes: ['listen'],
    words: [
      { id: 'sw_to', word: 'to' },
      { id: 'sw_me', word: 'me' },
      { id: 'sw_we', word: 'we' },
      { id: 'sw_go', word: 'go' },
      { id: 'sw_no', word: 'no' },
      { id: 'sw_you', word: 'you' },
    ],
  },
];

function getPhonicsTopicById(id) {
  return PHONICS_TOPICS.find((t) => t.id === id);
}

function isLetterItem(item) {
  return !!(item && item.kind === 'letter');
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
    <span class="emoji-face" aria-hidden="true">${word.emoji}</span>
  </span>`;
}

/** 「活字母」卡片 HTML：字母字身 + 固定原創顏色 + 簡單笑臉 */
function letterTileHtml(ch) {
  const color = LETTER_COLORS[ch] || '#5eead4';
  return `<span class="letter-glyph" style="--ltr-color:${color}">${ch}</span>
    <span class="letter-face" aria-hidden="true">
      <span class="eye eye-l"></span><span class="eye eye-r"></span><span class="mouth"></span>
    </span>`;
}

window.KakaPhonicsWords = {
  LETTER_COLORS,
  LETTER_REVISION,
  PHONICS_TOPICS,
  getPhonicsTopicById,
  isLetterItem,
  phonicsLetterPool,
  phonicsWordIllustHtml,
  letterTileHtml,
};

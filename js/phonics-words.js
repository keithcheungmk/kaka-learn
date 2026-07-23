/** 卡卡字母隊 — English Phonics（Phase 1：-at CVC 家族 + 常見字）
 *  獨立資料檔，唔改動 js/words.js 嘅任何現有內容。
 *  插圖同中文認字 app 一樣用系統 Emoji；字母角色顏色係原創配色（見 LETTER_COLORS），
 *  唔跟任何現成教材／卡通嘅顏色配對。
 */

/** 每個字母固定原創顏色（「卡卡字母隊」角色配色表） */
const LETTER_COLORS = {
  c: '#fb7185',
  a: '#7cffb2',
  t: '#93a5fc',
  h: '#fbbf24',
  b: '#38bdf8',
  r: '#2dd4bf',
  m: '#c4b5fd',
};

/** Phase 1 主題：CVC 拼一拼 + 常見字（sight words） */
const PHONICS_TOPICS = [
  {
    id: 'cvc_at',
    title: '拼一拼・CVC',
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
    id: 'sight1',
    title: '常見字・Sight Words',
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
];

function getPhonicsTopicById(id) {
  return PHONICS_TOPICS.find((t) => t.id === id);
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
  PHONICS_TOPICS,
  getPhonicsTopicById,
  phonicsLetterPool,
  phonicsWordIllustHtml,
  letterTileHtml,
};

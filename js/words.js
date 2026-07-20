/** 卡卡學習 — 固定 24 字詞表（繁體表面形）
 *  插圖採用系統 Emoji（iPhone／iPad 會顯示 Apple Color Emoji，清晰易認）
 */

const DEER_IDS = ['lu', 'meihualu', 'xunlu', 'tuolu', 'malu'];

/**
 * badge：少數鹿種共用 🦌 時嘅細標記，幫 KAKA 分辨
 * plate：卡片底色，加強視覺區分
 */
const WORDS = [
  { id: 'lu', term: '鹿', isDeer: true, emoji: '🦌', badge: '', plate: '#1a4d3a' },
  { id: 'meihualu', term: '梅花鹿', isDeer: true, emoji: '🦌', badge: '🌸', plate: '#4a3b1a' },
  { id: 'xunlu', term: '馴鹿', isDeer: true, emoji: '🦌', badge: '❄️', plate: '#1a2a4a' },
  { id: 'tuolu', term: '駝鹿', isDeer: true, emoji: '🫎', badge: '', plate: '#4a2a12' },
  { id: 'malu', term: '馬鹿', isDeer: true, emoji: '🦌', badge: '🍃', plate: '#2a4018' },
  { id: 'gou', term: '狗', isDeer: false, emoji: '🐶', badge: '', plate: '#3a3010' },
  { id: 'mao', term: '貓', isDeer: false, emoji: '🐱', badge: '', plate: '#4a2030' },
  { id: 'yu', term: '魚', isDeer: false, emoji: '🐟', badge: '', plate: '#0f3550' },
  { id: 'niao', term: '鳥', isDeer: false, emoji: '🐦', badge: '', plate: '#1a3050' },
  { id: 'tu', term: '兔', isDeer: false, emoji: '🐰', badge: '', plate: '#402038' },
  { id: 'yang', term: '羊', isDeer: false, emoji: '🐑', badge: '', plate: '#2a2a35' },
  { id: 'niu', term: '牛', isDeer: false, emoji: '🐮', badge: '', plate: '#3a3010' },
  { id: 'ma', term: '馬', isDeer: false, emoji: '🐴', badge: '', plate: '#2a2520' },
  { id: 'zhu', term: '豬', isDeer: false, emoji: '🐷', badge: '', plate: '#402030' },
  { id: 'xiong', term: '熊', isDeer: false, emoji: '🐻', badge: '', plate: '#3a2810' },
  { id: 'shizi', term: '獅子', isDeer: false, emoji: '🦁', badge: '', plate: '#3a3010' },
  { id: 'laohu', term: '老虎', isDeer: false, emoji: '🐯', badge: '', plate: '#402010' },
  { id: 'daxiang', term: '大象', isDeer: false, emoji: '🐘', badge: '', plate: '#243040' },
  { id: 'hou', term: '猴', isDeer: false, emoji: '🐵', badge: '', plate: '#3a2410' },
  { id: 'ji', term: '雞', isDeer: false, emoji: '🐔', badge: '', plate: '#402020' },
  { id: 'ya', term: '鴨', isDeer: false, emoji: '🦆', badge: '', plate: '#143828' },
  { id: 'wa', term: '蛙', isDeer: false, emoji: '🐸', badge: '', plate: '#143820' },
  { id: 'chong', term: '蟲', isDeer: false, emoji: '🐛', badge: '', plate: '#2a3810' },
  { id: 'long', term: '龍', isDeer: false, emoji: '🐲', badge: '', plate: '#0f3535' },
];

/** 主題：先學再開考 */
const TOPICS = [
  {
    id: 'deer',
    title: '鹿家族',
    blurb: '卡卡嘅強項！先認唔同嘅鹿',
    cover: '🦌',
    wordIds: ['lu', 'meihualu', 'xunlu', 'tuolu', 'malu'],
  },
  {
    id: 'pals',
    title: '可愛朋友',
    blurb: '狗貓魚鳥兔',
    cover: '🐶',
    wordIds: ['gou', 'mao', 'yu', 'niao', 'tu'],
  },
  {
    id: 'farm',
    title: '農場動物',
    blurb: '羊牛馬豬雞鴨',
    cover: '🐮',
    wordIds: ['yang', 'niu', 'ma', 'zhu', 'ji', 'ya'],
  },
  {
    id: 'zoo',
    title: '動物園',
    blurb: '熊、獅子、老虎、大象、猴',
    cover: '🦁',
    wordIds: ['xiong', 'shizi', 'laohu', 'daxiang', 'hou'],
  },
  {
    id: 'wonders',
    title: '奇趣生物',
    blurb: '蛙、蟲、龍',
    cover: '🐲',
    wordIds: ['wa', 'chong', 'long'],
  },
];

function getWordById(id) {
  return WORDS.find((w) => w.id === id);
}

function getTopicById(id) {
  return TOPICS.find((t) => t.id === id);
}

function wordsForTopic(topicId) {
  const topic = getTopicById(topicId);
  if (!topic) return [...WORDS];
  return topic.wordIds.map(getWordById).filter(Boolean);
}

/** 產生卡片插圖 HTML（大粒系統 Emoji） */
function wordIllustHtml(word) {
  const badge = word.badge
    ? `<span class="emoji-badge" aria-hidden="true">${word.badge}</span>`
    : '';
  return `<span class="emoji-plate" style="--plate:${word.plate || '#122848'}">
    <span class="emoji-face" aria-hidden="true">${word.emoji}</span>
    ${badge}
  </span>`;
}

window.KakaWords = {
  WORDS,
  DEER_IDS,
  TOPICS,
  getWordById,
  getTopicById,
  wordsForTopic,
  wordIllustHtml,
};

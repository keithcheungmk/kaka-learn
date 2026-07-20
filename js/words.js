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

function getWordById(id) {
  return WORDS.find((w) => w.id === id);
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

window.KakaWords = { WORDS, DEER_IDS, getWordById, wordIllustHtml };

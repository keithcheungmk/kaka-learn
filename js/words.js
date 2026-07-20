/** 卡卡學習 — 字詞表（繁體表面形）
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
  { id: 'tu', term: '兔子', isDeer: false, emoji: '🐰', badge: '', plate: '#402038' },
  { id: 'yang', term: '羊', isDeer: false, emoji: '🐑', badge: '', plate: '#2a2a35' },
  { id: 'niu', term: '牛', isDeer: false, emoji: '🐮', badge: '', plate: '#3a3010' },
  { id: 'ma', term: '馬', isDeer: false, emoji: '🐴', badge: '', plate: '#2a2520' },
  { id: 'zhu', term: '豬', isDeer: false, emoji: '🐷', badge: '', plate: '#402030' },
  { id: 'xiong', term: '熊', isDeer: false, emoji: '🐻', badge: '', plate: '#3a2810' },
  { id: 'shizi', term: '獅子', isDeer: false, emoji: '🦁', badge: '', plate: '#3a3010' },
  { id: 'laohu', term: '老虎', isDeer: false, emoji: '🐯', badge: '', plate: '#402010' },
  { id: 'daxiang', term: '大象', isDeer: false, emoji: '🐘', badge: '', plate: '#243040' },
  { id: 'hou', term: '猴子', isDeer: false, emoji: '🐵', badge: '', plate: '#3a2410' },
  { id: 'xiongmao', term: '熊貓', isDeer: false, emoji: '🐼', badge: '', plate: '#2a2a35' },
  { id: 'changjinglu', term: '長頸鹿', isDeer: false, emoji: '🦒', badge: '', plate: '#3a3010' },
  { id: 'banma', term: '斑馬', isDeer: false, emoji: '🦓', badge: '', plate: '#2a2a35' },
  { id: 'qie', term: '企鵝', isDeer: false, emoji: '🐧', badge: '', plate: '#1a3050' },
  { id: 'hema', term: '河馬', isDeer: false, emoji: '🦛', badge: '', plate: '#2a3548' },
  { id: 'xiniu', term: '犀牛', isDeer: false, emoji: '🦏', badge: '', plate: '#3a3a45' },
  { id: 'ji', term: '雞', isDeer: false, emoji: '🐔', badge: '', plate: '#402020' },
  { id: 'ya', term: '鴨', isDeer: false, emoji: '🦆', badge: '', plate: '#143828' },
  { id: 'wa', term: '青蛙', isDeer: false, emoji: '🐸', badge: '', plate: '#143820' },
  { id: 'chong', term: '昆蟲', isDeer: false, emoji: '🐛', badge: '', plate: '#2a3810' },
  { id: 'long', term: '龍', isDeer: false, emoji: '🐲', badge: '', plate: '#0f3535' },
  // 水果
  { id: 'pingguo', term: '蘋果', isDeer: false, emoji: '🍎', badge: '', plate: '#401820' },
  { id: 'xiangjiao', term: '香蕉', isDeer: false, emoji: '🍌', badge: '', plate: '#3a3410' },
  { id: 'cheng', term: '橙子', isDeer: false, emoji: '🍊', badge: '', plate: '#402410' },
  { id: 'putao', term: '葡萄', isDeer: false, emoji: '🍇', badge: '', plate: '#2a1840' },
  { id: 'xigua', term: '西瓜', isDeer: false, emoji: '🍉', badge: '', plate: '#143820' },
  { id: 'caomei', term: '草莓', isDeer: false, emoji: '🍓', badge: '', plate: '#401028' },
  // 蔬菜
  { id: 'fanqie', term: '番茄', isDeer: false, emoji: '🍅', badge: '', plate: '#401018' },
  { id: 'hongluobo', term: '紅蘿蔔', isDeer: false, emoji: '🥕', badge: '', plate: '#402010' },
  { id: 'yumi', term: '玉米', isDeer: false, emoji: '🌽', badge: '', plate: '#3a3010' },
  { id: 'baicai', term: '白菜', isDeer: false, emoji: '🥬', badge: '', plate: '#143820' },
  { id: 'qiezi', term: '茄子', isDeer: false, emoji: '🍆', badge: '', plate: '#281840' },
  { id: 'qingjiao', term: '青椒', isDeer: false, emoji: '🫑', badge: '', plate: '#143818' },
  // 數字 1–10
  { id: 'yi', term: '一', isDeer: false, emoji: '1️⃣', badge: '', plate: '#1a3050' },
  { id: 'er', term: '二', isDeer: false, emoji: '2️⃣', badge: '', plate: '#1a3050' },
  { id: 'san', term: '三', isDeer: false, emoji: '3️⃣', badge: '', plate: '#1a3050' },
  { id: 'si', term: '四', isDeer: false, emoji: '4️⃣', badge: '', plate: '#1a3050' },
  { id: 'wu', term: '五', isDeer: false, emoji: '5️⃣', badge: '', plate: '#1a3050' },
  { id: 'liu', term: '六', isDeer: false, emoji: '6️⃣', badge: '', plate: '#1a3050' },
  { id: 'qi', term: '七', isDeer: false, emoji: '7️⃣', badge: '', plate: '#1a3050' },
  { id: 'ba', term: '八', isDeer: false, emoji: '8️⃣', badge: '', plate: '#1a3050' },
  { id: 'jiu', term: '九', isDeer: false, emoji: '9️⃣', badge: '', plate: '#1a3050' },
  { id: 'shi', term: '十', isDeer: false, emoji: '🔟', badge: '', plate: '#1a3050' },
  // 顏色（橙色 同 水果「橙」分開，避免混淆）
  { id: 'hong', term: '紅色', isDeer: false, emoji: '🔴', badge: '', plate: '#401018' },
  { id: 'huang', term: '黃色', isDeer: false, emoji: '🟡', badge: '', plate: '#3a3410' },
  { id: 'lan', term: '藍色', isDeer: false, emoji: '🔵', badge: '', plate: '#102848' },
  { id: 'lv', term: '綠色', isDeer: false, emoji: '🟢', badge: '', plate: '#143820' },
  { id: 'bai', term: '白色', isDeer: false, emoji: '⚪', badge: '', plate: '#3a3a45' },
  { id: 'hei', term: '黑色', isDeer: false, emoji: '⚫', badge: '', plate: '#1a1a22' },
  { id: 'zi', term: '紫色', isDeer: false, emoji: '🟣', badge: '', plate: '#2a1840' },
  { id: 'fenhong', term: '粉紅', isDeer: false, emoji: '🩷', badge: '', plate: '#402038' },
  // 天氣
  { id: 'ri', term: '太陽', isDeer: false, emoji: '☀️', badge: '', plate: '#3a3010' },
  { id: 'yue', term: '月亮', isDeer: false, emoji: '🌙', badge: '', plate: '#1a2040' },
  { id: 'yun', term: '雲朵', isDeer: false, emoji: '☁️', badge: '', plate: '#2a3548' },
  { id: 'yu_rain', term: '下雨', isDeer: false, emoji: '🌧️', badge: '', plate: '#102848' },
  { id: 'xue', term: '雪花', isDeer: false, emoji: '❄️', badge: '', plate: '#2a3a50' },
  { id: 'feng', term: '大風', isDeer: false, emoji: '💨', badge: '', plate: '#243848' },
  { id: 'dian', term: '閃電', isDeer: false, emoji: '⚡', badge: '', plate: '#3a3410' },
  { id: 'caihong', term: '彩虹', isDeer: false, emoji: '🌈', badge: '', plate: '#2a1840' },
  // 交通
  { id: 'che', term: '汽車', isDeer: false, emoji: '🚗', badge: '', plate: '#102848' },
  { id: 'bashi', term: '巴士', isDeer: false, emoji: '🚌', badge: '', plate: '#3a3010' },
  { id: 'huoche', term: '火車', isDeer: false, emoji: '🚂', badge: '', plate: '#401820' },
  { id: 'feiji', term: '飛機', isDeer: false, emoji: '✈️', badge: '', plate: '#1a3050' },
  { id: 'chuan', term: '輪船', isDeer: false, emoji: '🚢', badge: '', plate: '#0f3550' },
  { id: 'danche', term: '單車', isDeer: false, emoji: '🚲', badge: '', plate: '#143828' },
  // 身體
  { id: 'yan', term: '眼睛', isDeer: false, emoji: '👀', badge: '', plate: '#2a3548' },
  { id: 'erduo', term: '耳朵', isDeer: false, emoji: '👂', badge: '', plate: '#3a2818' },
  { id: 'bi', term: '鼻子', isDeer: false, emoji: '👃', badge: '', plate: '#3a2818' },
  { id: 'kou', term: '嘴巴', isDeer: false, emoji: '👄', badge: '', plate: '#401028' },
  { id: 'shou', term: '手', isDeer: false, emoji: '✋', badge: '', plate: '#3a3010' },
  { id: 'jiao', term: '腳', isDeer: false, emoji: '🦶', badge: '', plate: '#3a2818' },
  { id: 'tou', term: '頭', isDeer: false, emoji: '🗣️', badge: '', plate: '#2a3548' },
  { id: 'xin', term: '心', isDeer: false, emoji: '❤️', badge: '', plate: '#401018' },
  // 家庭
  { id: 'baba', term: '爸爸', isDeer: false, emoji: '👨', badge: '', plate: '#1a3050' },
  { id: 'mama', term: '媽媽', isDeer: false, emoji: '👩', badge: '', plate: '#402038' },
  { id: 'yeye', term: '爺爺', isDeer: false, emoji: '👴', badge: '', plate: '#2a3548' },
  { id: 'popo', term: '婆婆', isDeer: false, emoji: '👵', badge: '', plate: '#3a2a40' },
  { id: 'gege', term: '哥哥', isDeer: false, emoji: '👦', badge: '', plate: '#102848' },
  { id: 'jiejie', term: '姐姐', isDeer: false, emoji: '👧', badge: '', plate: '#402038' },
  { id: 'baobao', term: '寶寶', isDeer: false, emoji: '👶', badge: '', plate: '#3a3010' },
  // 食物（非蔬果）
  { id: 'fan', term: '白飯', isDeer: false, emoji: '🍚', badge: '', plate: '#2a3548' },
  { id: 'mian', term: '湯麵', isDeer: false, emoji: '🍜', badge: '', plate: '#3a3010' },
  { id: 'bao', term: '麵包', isDeer: false, emoji: '🍞', badge: '', plate: '#3a2818' },
  { id: 'dan', term: '蛋', isDeer: false, emoji: '🥚', badge: '', plate: '#3a3a45' },
  { id: 'nai', term: '牛奶', isDeer: false, emoji: '🥛', badge: '', plate: '#2a3a50' },
  { id: 'dangao', term: '蛋糕', isDeer: false, emoji: '🎂', badge: '', plate: '#402038' },
  { id: 'shui', term: '水', isDeer: false, emoji: '💧', badge: '', plate: '#0f3550' },
  { id: 'guozhi', term: '果汁', isDeer: false, emoji: '🧃', badge: '', plate: '#402410' },
  { id: 'xuegao', term: '雪糕', isDeer: false, emoji: '🍦', badge: '', plate: '#402038' },
  { id: 'binggan', term: '餅乾', isDeer: false, emoji: '🍪', badge: '', plate: '#3a2818' },
  { id: 'tangguo', term: '糖果', isDeer: false, emoji: '🍬', badge: '', plate: '#2a1840' },
  { id: 'hanbao', term: '漢堡', isDeer: false, emoji: '🍔', badge: '', plate: '#3a3010' },
  { id: 'pisa', term: '披薩', isDeer: false, emoji: '🍕', badge: '', plate: '#401820' },
  { id: 'shutiao', term: '薯條', isDeer: false, emoji: '🍟', badge: '', plate: '#3a3010' },
  // 學校／用品
  { id: 'shu', term: '書本', isDeer: false, emoji: '📚', badge: '', plate: '#102848' },
  { id: 'gangbi', term: '鉛筆', isDeer: false, emoji: '✏️', badge: '', plate: '#3a3010' },
  { id: 'chi', term: '間尺', isDeer: false, emoji: '📏', badge: '', plate: '#2a3548' },
  { id: 'shubao', term: '書包', isDeer: false, emoji: '🎒', badge: '', plate: '#401820' },
  { id: 'qiu', term: '足球', isDeer: false, emoji: '⚽', badge: '', plate: '#143820' },
  { id: 'jimu', term: '積木', isDeer: false, emoji: '🧸', badge: '', plate: '#3a2818' },
  // 地方（屋用 wuzi，避免同數字「五」id wu 撞車）
  { id: 'wuzi', term: '屋企', isDeer: false, emoji: '🏠', badge: '', plate: '#1a3050' },
  { id: 'xuexiao', term: '學校', isDeer: false, emoji: '🏫', badge: '', plate: '#102848' },
  { id: 'gongyuan', term: '公園', isDeer: false, emoji: '🛝', badge: '', plate: '#143828' },
  { id: 'shangchang', term: '商場', isDeer: false, emoji: '🏬', badge: '', plate: '#401820' },
  { id: 'tushuguan', term: '圖書館', isDeer: false, emoji: '📖', badge: '', plate: '#1a3050' },
  { id: 'tingchechang', term: '停車場', isDeer: false, emoji: '🅿️', badge: '', plate: '#2a3548' },
  { id: 'shatian', term: '沙田', isDeer: false, emoji: '🏢', badge: '', plate: '#3a3010' },
  // 屋企用品／房間
  { id: 'chufang', term: '廚房', isDeer: false, emoji: '🍳', badge: '', plate: '#3a3010' },
  { id: 'shuifang', term: '睡房', isDeer: false, emoji: '🛏️', badge: '', plate: '#1a3050' },
  { id: 'keting', term: '客廳', isDeer: false, emoji: '🛋️', badge: '', plate: '#2a1840' },
  { id: 'cesuo', term: '廁所', isDeer: false, emoji: '🚽', badge: '', plate: '#2a3548' },
  { id: 'dianshi', term: '電視', isDeer: false, emoji: '📺', badge: '', plate: '#102848' },
  { id: 'xuegui', term: '雪櫃', isDeer: false, emoji: '🧊', badge: '', plate: '#0f3550' },
  { id: 'xiyiji', term: '洗衣機', isDeer: false, emoji: '🧺', badge: '', plate: '#1a3050' },
  { id: 'dianhua', term: '電話', isDeer: false, emoji: '📱', badge: '', plate: '#2a2a35' },
  { id: 'fengshan', term: '風扇', isDeer: false, emoji: '🌬️', badge: '', plate: '#243848' },
  { id: 'men', term: '大門', isDeer: false, emoji: '🚪', badge: '', plate: '#3a2818' },
  { id: 'chuanghu', term: '窗', isDeer: false, emoji: '🪟', badge: '', plate: '#0f3550' },
  { id: 'deng', term: '燈', isDeer: false, emoji: '💡', badge: '', plate: '#3a3410' },
  { id: 'yizi', term: '椅子', isDeer: false, emoji: '🪑', badge: '', plate: '#3a2818' },
  { id: 'chuangpu', term: '睡床', isDeer: false, emoji: '🛏️', badge: '💤', plate: '#1a2a4a' },
  { id: 'shafa', term: '梳化', isDeer: false, emoji: '🛋️', badge: '', plate: '#281840' },
];

/** 主題：先學再開考 */
const TOPICS = [
  {
    id: 'numbers',
    title: '數字',
    blurb: '一到十，卡卡已經識！',
    cover: '🔢',
    wordIds: ['yi', 'er', 'san', 'si', 'wu', 'liu', 'qi', 'ba', 'jiu', 'shi'],
  },
  {
    id: 'colors',
    title: '顏色',
    blurb: '紅色黃色藍色綠色白色黑色紫色粉紅',
    cover: '🎨',
    wordIds: ['hong', 'huang', 'lan', 'lv', 'bai', 'hei', 'zi', 'fenhong'],
  },
  {
    id: 'weather',
    title: '天氣',
    blurb: '太陽、月亮、雲朵、下雨、雪花、大風、閃電、彩虹',
    cover: '☀️',
    wordIds: ['ri', 'yue', 'yun', 'yu_rain', 'xue', 'feng', 'dian', 'caihong'],
  },
  {
    id: 'transport',
    title: '交通',
    blurb: '汽車、巴士、火車、飛機、輪船、單車',
    cover: '🚗',
    wordIds: ['che', 'bashi', 'huoche', 'feiji', 'chuan', 'danche'],
  },
  {
    id: 'body',
    title: '身體',
    blurb: '眼睛耳朵鼻子嘴巴手腳頭心',
    cover: '👀',
    wordIds: ['yan', 'erduo', 'bi', 'kou', 'shou', 'jiao', 'tou', 'xin'],
  },
  {
    id: 'family',
    title: '家庭',
    blurb: '爸爸媽媽爺爺婆婆哥哥姐姐寶寶',
    cover: '👨',
    wordIds: ['baba', 'mama', 'yeye', 'popo', 'gege', 'jiejie', 'baobao'],
  },
  {
    id: 'food',
    title: '食物',
    blurb: '白飯湯麵麵包蛋牛奶蛋糕同小食飲品',
    cover: '🍚',
    wordIds: [
      'fan', 'mian', 'bao', 'dan', 'nai', 'dangao',
      'shui', 'guozhi', 'xuegao', 'binggan', 'tangguo', 'hanbao', 'pisa', 'shutiao',
    ],
  },
  {
    id: 'school',
    title: '學校用品',
    blurb: '書本、鉛筆、間尺、書包、足球、積木',
    cover: '📚',
    wordIds: ['shu', 'gangbi', 'chi', 'shubao', 'qiu', 'jimu'],
  },
  {
    id: 'places',
    title: '地方',
    blurb: '屋企、學校、公園、商場、圖書館、停車場、沙田',
    cover: '🏠',
    wordIds: ['wuzi', 'xuexiao', 'gongyuan', 'shangchang', 'tushuguan', 'tingchechang', 'shatian'],
  },
  {
    id: 'home',
    title: '屋企',
    blurb: '廚房、睡房、客廳、廁所、電視、雪櫃、大門…',
    cover: '🛋️',
    wordIds: [
      'chufang', 'shuifang', 'keting', 'cesuo',
      'dianshi', 'xuegui', 'xiyiji', 'dianhua', 'fengshan',
      'men', 'chuanghu', 'deng', 'yizi', 'chuangpu', 'shafa',
    ],
  },
  {
    id: 'zoo',
    title: '動物園',
    blurb: '鹿家族、猴子同動物園朋友',
    cover: '🦁',
    wordIds: [
      'lu', 'meihualu', 'xunlu', 'tuolu', 'malu',
      'xiong', 'shizi', 'laohu', 'daxiang', 'hou',
      'xiongmao', 'changjinglu', 'banma', 'qie', 'hema', 'xiniu',
    ],
  },
  {
    id: 'pals',
    title: '可愛朋友',
    blurb: '狗貓魚鳥兔子',
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
    id: 'wonders',
    title: '奇趣生物',
    blurb: '青蛙、昆蟲、龍',
    cover: '🐲',
    wordIds: ['wa', 'chong', 'long'],
  },
  {
    id: 'fruit',
    title: '水果',
    blurb: '蘋果、香蕉、橙子、葡萄、西瓜、草莓',
    cover: '🍎',
    wordIds: ['pingguo', 'xiangjiao', 'cheng', 'putao', 'xigua', 'caomei'],
  },
  {
    id: 'veg',
    title: '蔬菜',
    blurb: '番茄、紅蘿蔔、玉米、白菜、茄子、青椒',
    cover: '🥕',
    wordIds: ['fanqie', 'hongluobo', 'yumi', 'baicai', 'qiezi', 'qingjiao'],
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

/** 開發時檢查：唔好有重複 id（例如屋同五撞 wu） */
(function assertUniqueWordIds() {
  const seen = Object.create(null);
  WORDS.forEach((w) => {
    if (seen[w.id]) {
      console.error('Duplicate word id:', w.id, seen[w.id], 'vs', w.term);
    }
    seen[w.id] = w.term;
  });
})();

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

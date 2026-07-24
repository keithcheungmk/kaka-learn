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
  { id: 'malu', term: '馬鹿', isDeer: true, emoji: '🦌', badge: '馬', plate: '#2a4018' },
  { id: 'gou', term: '狗', isDeer: false, emoji: '🐶', badge: '', plate: '#3a3010' },
  { id: 'mao', term: '貓', isDeer: false, emoji: '🐱', badge: '', plate: '#4a2030', en: { word: 'cat', letters: ['c', 'a', 't'] } },
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
  { id: 'luotuo', term: '駱駝', isDeer: false, emoji: '🐪', badge: '', plate: '#3a3010' },
  { id: 'daishu', term: '袋鼠', isDeer: false, emoji: '🦘', badge: '', plate: '#402010' },
  { id: 'shuxiong', term: '樹熊', isDeer: false, emoji: '🐨', badge: '', plate: '#2a2a35' },
  { id: 'huli', term: '狐狸', isDeer: false, emoji: '🦊', badge: '', plate: '#402410' },
  { id: 'eyu', term: '鱷魚', isDeer: false, emoji: '🐊', badge: '', plate: '#143820' },
  { id: 'she', term: '蛇', isDeer: false, emoji: '🐍', badge: '', plate: '#1a4d3a' },
  { id: 'maotouying', term: '貓頭鷹', isDeer: false, emoji: '🦉', badge: '', plate: '#3a2818' },
  { id: 'lang', term: '狼', isDeer: false, emoji: '🐺', badge: '', plate: '#2a2a35' },
  { id: 'haitun', term: '海豚', isDeer: false, emoji: '🐬', badge: '', plate: '#0f3550' },
  { id: 'haibao', term: '海豹', isDeer: false, emoji: '🦭', badge: '', plate: '#1a3050' },
  { id: 'kongque', term: '孔雀', isDeer: false, emoji: '🦚', badge: '', plate: '#143828' },
  { id: 'honghe', term: '紅鶴', isDeer: false, emoji: '🦩', badge: '', plate: '#401028' },
  { id: 'ji', term: '雞', isDeer: false, emoji: '🐔', badge: '', plate: '#402020' },
  { id: 'ya', term: '鴨', isDeer: false, emoji: '🦆', badge: '', plate: '#143828' },
  { id: 'wa', term: '青蛙', isDeer: false, emoji: '🐸', badge: '', plate: '#143820' },
  { id: 'chong', term: '昆蟲', isDeer: false, emoji: '🐛', badge: '', plate: '#2a3810' },
  { id: 'long', term: '龍', isDeer: false, emoji: '🐲', badge: '', plate: '#0f3535' },
  { id: 'bianfu', term: '蝙蝠', isDeer: false, emoji: '🦇', badge: '', plate: '#1a1a22', en: { word: 'bat', letters: ['b', 'a', 't'] } },
  { id: 'ciwei', term: '刺蝟', isDeer: false, emoji: '🦔', badge: '', plate: '#3a2818' },
  // 水果
  { id: 'pingguo', term: '蘋果', isDeer: false, emoji: '🍎', badge: '', plate: '#401820' },
  { id: 'xiangjiao', term: '香蕉', isDeer: false, emoji: '🍌', badge: '', plate: '#3a3410' },
  { id: 'cheng', term: '橙子', isDeer: false, emoji: '🍊', badge: '', plate: '#402410' },
  { id: 'putao', term: '葡萄', isDeer: false, emoji: '🍇', badge: '', plate: '#2a1840' },
  { id: 'xigua', term: '西瓜', isDeer: false, emoji: '🍉', badge: '', plate: '#143820' },
  { id: 'caomei', term: '草莓', isDeer: false, emoji: '🍓', badge: '', plate: '#401028' },
  { id: 'mangguo', term: '芒果', isDeer: false, emoji: '🥭', badge: '', plate: '#402410' },
  { id: 'boluo', term: '菠蘿', isDeer: false, emoji: '🍍', badge: '', plate: '#3a3410' },
  { id: 'tao', term: '桃', isDeer: false, emoji: '🍑', badge: '', plate: '#402038' },
  { id: 'ningmeng', term: '檸檬', isDeer: false, emoji: '🍋', badge: '', plate: '#3a3410' },
  { id: 'yingtao', term: '櫻桃', isDeer: false, emoji: '🍒', badge: '', plate: '#401018' },
  { id: 'qiyiguo', term: '奇異果', isDeer: false, emoji: '🥝', badge: '', plate: '#143820' },
  // 蔬菜
  { id: 'fanqie', term: '番茄', isDeer: false, emoji: '🍅', badge: '', plate: '#401018' },
  { id: 'hongluobo', term: '紅蘿蔔', isDeer: false, emoji: '🥕', badge: '', plate: '#402010' },
  { id: 'yumi', term: '玉米', isDeer: false, emoji: '🌽', badge: '', plate: '#3a3010' },
  { id: 'baicai', term: '白菜', isDeer: false, emoji: '🥬', badge: '', plate: '#143820' },
  { id: 'qiezi', term: '茄子', isDeer: false, emoji: '🍆', badge: '', plate: '#281840' },
  { id: 'qingjiao', term: '青椒', isDeer: false, emoji: '🫑', badge: '', plate: '#143818' },
  { id: 'shuzai', term: '薯仔', isDeer: false, emoji: '🥔', badge: '', plate: '#3a2818' },
  { id: 'yangcong', term: '洋蔥', isDeer: false, emoji: '🧅', badge: '', plate: '#402038' },
  { id: 'mogu', term: '蘑菇', isDeer: false, emoji: '🍄', badge: '', plate: '#401820' },
  { id: 'huanggua', term: '黃瓜', isDeer: false, emoji: '🥒', badge: '', plate: '#143820' },
  { id: 'wandou', term: '豌豆', isDeer: false, emoji: '🫛', badge: '', plate: '#143818' },
  { id: 'nangua', term: '南瓜', isDeer: false, emoji: '🎃', badge: '', plate: '#402010' },
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
  { id: 'chengse', term: '橙色', isDeer: false, emoji: '🟠', badge: '', plate: '#402410' },
  { id: 'kafeise', term: '咖啡色', isDeer: false, emoji: '🟤', badge: '', plate: '#3a2818' },
  // 天氣
  { id: 'ri', term: '太陽', isDeer: false, emoji: '☀️', badge: '', plate: '#3a3010' },
  { id: 'yue', term: '月亮', isDeer: false, emoji: '🌙', badge: '', plate: '#1a2040' },
  { id: 'yun', term: '雲朵', isDeer: false, emoji: '☁️', badge: '', plate: '#2a3548' },
  { id: 'yu_rain', term: '下雨', isDeer: false, emoji: '🌧️', badge: '', plate: '#102848' },
  { id: 'xue', term: '雪花', isDeer: false, emoji: '❄️', badge: '', plate: '#2a3a50' },
  { id: 'feng', term: '大風', isDeer: false, emoji: '💨', badge: '', plate: '#243848' },
  { id: 'dian', term: '閃電', isDeer: false, emoji: '⚡', badge: '', plate: '#3a3410' },
  { id: 'caihong', term: '彩虹', isDeer: false, emoji: '🌈', badge: '', plate: '#2a1840' },
  // 自然（單字為主）
  { id: 'xingxing', term: '星星', isDeer: false, emoji: '⭐', badge: '', plate: '#1a2040' },
  { id: 'tiankong', term: '天空', isDeer: false, emoji: '🌤️', badge: '', plate: '#102848' },
  { id: 'hua', term: '花', isDeer: false, emoji: '🌸', badge: '', plate: '#402038' },
  { id: 'cao', term: '草', isDeer: false, emoji: '🌱', badge: '', plate: '#143820' },
  { id: 'shu_tree', term: '樹', isDeer: false, emoji: '🌳', badge: '', plate: '#1a4d3a' },
  { id: 'hai', term: '海', isDeer: false, emoji: '🌊', badge: '', plate: '#0f3550' },
  { id: 'sha', term: '沙', isDeer: false, emoji: '🏜️', badge: '', plate: '#3a3410' },
  { id: 'huo', term: '火', isDeer: false, emoji: '🔥', badge: '', plate: '#401018' },
  { id: 'ye', term: '葉', isDeer: false, emoji: '🍃', badge: '', plate: '#143828' },
  // 交通
  { id: 'che', term: '汽車', isDeer: false, emoji: '🚗', badge: '', plate: '#102848' },
  { id: 'bashi', term: '巴士', isDeer: false, emoji: '🚌', badge: '', plate: '#3a3010' },
  { id: 'huoche', term: '火車', isDeer: false, emoji: '🚂', badge: '', plate: '#401820' },
  { id: 'feiji', term: '飛機', isDeer: false, emoji: '✈️', badge: '', plate: '#1a3050' },
  { id: 'chuan', term: '輪船', isDeer: false, emoji: '🚢', badge: '', plate: '#0f3550' },
  { id: 'danche', term: '單車', isDeer: false, emoji: '🚲', badge: '', plate: '#143828' },
  { id: 'dishi', term: '的士', isDeer: false, emoji: '🚕', badge: '', plate: '#3a3410' },
  { id: 'dianche', term: '電車', isDeer: false, emoji: '🚊', badge: '', plate: '#143828' },
  { id: 'ditie', term: '地鐵', isDeer: false, emoji: '🚇', badge: '', plate: '#1a3050' },
  { id: 'motuoche', term: '摩托車', isDeer: false, emoji: '🏍️', badge: '', plate: '#2a2a35' },
  { id: 'xiaofangche', term: '消防車', isDeer: false, emoji: '🚒', badge: '', plate: '#401018' },
  { id: 'jiuhuche', term: '救護車', isDeer: false, emoji: '🚑', badge: '', plate: '#2a3a50' },
  { id: 'jingche', term: '警察車', isDeer: false, emoji: '🚓', badge: '', plate: '#102848' },
  // 身體
  { id: 'yan', term: '眼睛', isDeer: false, emoji: '👀', badge: '', plate: '#2a3548' },
  { id: 'erduo', term: '耳朵', isDeer: false, emoji: '👂', badge: '', plate: '#3a2818' },
  { id: 'bi', term: '鼻子', isDeer: false, emoji: '👃', badge: '', plate: '#3a2818' },
  { id: 'kou', term: '嘴巴', isDeer: false, emoji: '👄', badge: '', plate: '#401028' },
  { id: 'shou', term: '手', isDeer: false, emoji: '✋', badge: '', plate: '#3a3010' },
  { id: 'jiao', term: '腳', isDeer: false, emoji: '🦶', badge: '', plate: '#3a2818' },
  { id: 'tou', term: '頭', isDeer: false, emoji: '🗣️', badge: '', plate: '#2a3548' },
  { id: 'xin', term: '心', isDeer: false, emoji: '❤️', badge: '', plate: '#401018' },
  // 情緒
  { id: 'kaixin', term: '開心', isDeer: false, emoji: '😊', badge: '', plate: '#3a3010' },
  { id: 'bukaixin', term: '不開心', isDeer: false, emoji: '😢', badge: '', plate: '#1a3050' },
  { id: 'shengqi', term: '生氣', isDeer: false, emoji: '😠', badge: '', plate: '#401018' },
  { id: 'haipa', term: '害怕', isDeer: false, emoji: '😨', badge: '', plate: '#2a1840' },
  { id: 'jingxi', term: '驚喜', isDeer: false, emoji: '😲', badge: '', plate: '#3a3410' },
  { id: 'haixiu', term: '害羞', isDeer: false, emoji: '🫣', badge: '', plate: '#402038' },
  // 身體感覺
  { id: 'lei', term: '累', isDeer: false, emoji: '😩', badge: '', plate: '#2a2a35' },
  { id: 'e_hungry', term: '餓', isDeer: false, emoji: '😋', badge: '', plate: '#402410' },
  { id: 'bao_full', term: '飽', isDeer: false, emoji: '😌', badge: '飽', plate: '#143828' },
  { id: 'ke_thirsty', term: '渴', isDeer: false, emoji: '🥤', badge: '', plate: '#0f3550' },
  { id: 'tong', term: '痛', isDeer: false, emoji: '😣', badge: '', plate: '#401820' },
  { id: 're_hot', term: '熱', isDeer: false, emoji: '🥵', badge: '', plate: '#402010' },
  { id: 'leng_cold', term: '冷', isDeer: false, emoji: '🥶', badge: '', plate: '#102848' },
  { id: 'xiang_scent', term: '香', isDeer: false, emoji: '👃', badge: '香', plate: '#402038' },
  { id: 'chou', term: '臭', isDeer: false, emoji: '🤢', badge: '💩', plate: '#2a3810' },
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
  { id: 'hanbao', term: '漢堡包', isDeer: false, emoji: '🍔', badge: '', plate: '#3a3010' },
  { id: 'pisa', term: '薄餅', isDeer: false, emoji: '🍕', badge: '', plate: '#401820' },
  { id: 'shutiao', term: '薯條', isDeer: false, emoji: '🍟', badge: '', plate: '#3a3010' },
  { id: 'sanwenzi', term: '三文治', isDeer: false, emoji: '🥪', badge: '', plate: '#3a3010' },
  { id: 'jirou', term: '雞肉', isDeer: false, emoji: '🍗', badge: '', plate: '#402010' },
  { id: 'niurou', term: '牛肉', isDeer: false, emoji: '🥩', badge: '牛', plate: '#401820' },
  { id: 'zhurou', term: '豬肉', isDeer: false, emoji: '🥓', badge: '豬', plate: '#402030' },
  { id: 'yangrou', term: '羊肉', isDeer: false, emoji: '🍖', badge: '羊', plate: '#3a2818' },
  { id: 'xia_shrimp', term: '蝦', isDeer: false, emoji: '🦐', badge: '', plate: '#401028' },
  { id: 'xie_crab', term: '蟹', isDeer: false, emoji: '🦀', badge: '', plate: '#401820' },
  // 海鮮：唔用 🦞（龍蝦），用雙 emoji 表達「好多種海味」
  { id: 'haixian', term: '海鮮', isDeer: false, emoji: '🦐🐟', emojiDuo: true, badge: '', plate: '#0f3550' },
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
  { id: 'yiyuan', term: '醫院', isDeer: false, emoji: '🏥', badge: '', plate: '#2a3a50' },
  { id: 'xiaofangju', term: '消防局', isDeer: false, emoji: '🚒', badge: '🏠', plate: '#401820' },
  { id: 'jingchaju', term: '警察局', isDeer: false, emoji: '🚓', badge: '🏠', plate: '#102848' },
  { id: 'jichang', term: '機場', isDeer: false, emoji: '🛫', badge: '', plate: '#1a3050' },
  { id: 'haitan', term: '海灘', isDeer: false, emoji: '🏖️', badge: '', plate: '#0f3550' },
  { id: 'canting', term: '餐廳', isDeer: false, emoji: '🍽️', badge: '', plate: '#3a3010' },
  { id: 'jieshi', term: '街市', isDeer: false, emoji: '🛒', badge: '', plate: '#143828' },
  { id: 'youlechang', term: '遊樂場', isDeer: false, emoji: '🎠', badge: '', plate: '#402038' },
  { id: 'chaoshi', term: '超市', isDeer: false, emoji: '🏪', badge: '', plate: '#3a3010' },
  { id: 'keshi', term: '課室', isDeer: false, emoji: '🏫', badge: '課', plate: '#1a3050' },
  { id: 'yongchi', term: '泳池', isDeer: false, emoji: '🏊', badge: '', plate: '#0f3550' },
  // 屋企：房間／傢俬／電器／設施（叫法跟朋友：沙發、冰箱、電風扇、床、窗戶、門）
  { id: 'chufang', term: '廚房', isDeer: false, emoji: '🍳', badge: '', plate: '#3a3010' },
  { id: 'shuifang', term: '睡房', isDeer: false, emoji: '🛏️', badge: '房', plate: '#1a3050' },
  { id: 'cesuo', term: '廁所', isDeer: false, emoji: '🚽', badge: '', plate: '#2a3548' },
  { id: 'yushi', term: '浴室', isDeer: false, emoji: '🚿', badge: '', plate: '#0f3550' },
  { id: 'dianshi', term: '電視', isDeer: false, emoji: '📺', badge: '', plate: '#102848' },
  { id: 'xuegui', term: '冰箱', isDeer: false, emoji: '🧊', badge: '', plate: '#0f3550' },
  { id: 'xiyiji', term: '洗衣機', isDeer: false, emoji: '🧺', badge: '', plate: '#1a3050' },
  { id: 'dianhua', term: '電話', isDeer: false, emoji: '📱', badge: '', plate: '#2a2a35' },
  { id: 'fengshan', term: '電風扇', isDeer: false, emoji: '🌬️', badge: '', plate: '#243848' },
  { id: 'men', term: '門', isDeer: false, emoji: '🚪', badge: '', plate: '#3a2818' },
  { id: 'chuanghu', term: '窗戶', isDeer: false, emoji: '🪟', badge: '', plate: '#0f3550' },
  { id: 'deng', term: '燈', isDeer: false, emoji: '💡', badge: '', plate: '#3a3410' },
  { id: 'yizi', term: '椅子', isDeer: false, emoji: '🪑', badge: '', plate: '#3a2818' },
  { id: 'zhuozi', term: '桌子', isDeer: false, emoji: '🪑', badge: '桌', plate: '#2a3548' },
  { id: 'yigui', term: '衣櫃', isDeer: false, emoji: '👕', badge: '', plate: '#1a3050' },
  { id: 'tuoxie', term: '拖鞋', isDeer: false, emoji: '🩴', badge: '', plate: '#402038' },
  { id: 'chuangpu', term: '床', isDeer: false, emoji: '🛏️', badge: '', plate: '#1a2a4a' },
  { id: 'shafa', term: '沙發', isDeer: false, emoji: '🛋️', badge: '', plate: '#281840' },
  { id: 'zhentou', term: '枕頭', isDeer: false, emoji: '🛏️', badge: '枕', plate: '#2a1840' },
  { id: 'beizi', term: '被子', isDeer: false, emoji: '🛏️', badge: '被', plate: '#401028' },
  { id: 'shizhong', term: '時鐘', isDeer: false, emoji: '⏰', badge: '', plate: '#3a3010' },
  { id: 'lengqi', term: '冷氣機', isDeer: false, emoji: '❄️', badge: '冷', plate: '#0f3550' },
  { id: 'mensuo', term: '門鎖', isDeer: false, emoji: '🔒', badge: '', plate: '#2a2a35' },
  { id: 'lajitong', term: '垃圾桶', isDeer: false, emoji: '🗑️', badge: '', plate: '#3a3a45' },
  { id: 'xiangkuang', term: '相框', isDeer: false, emoji: '🖼️', badge: '', plate: '#3a2818' },
  { id: 'ditan', term: '地毯', isDeer: false, emoji: '🟫', badge: '', plate: '#402010' },
  { id: 'xishoutai', term: '洗手台', isDeer: false, emoji: '🧼', badge: '台', plate: '#2a3a50' },
  { id: 'shuilongtou', term: '水龍頭', isDeer: false, emoji: '🚰', badge: '', plate: '#102848' },
  { id: 'chouti', term: '抽屜', isDeer: false, emoji: '🗄️', badge: '', plate: '#3a2818' },
  { id: 'yangtai', term: '陽台', isDeer: false, emoji: '🪴', badge: '', plate: '#143828' },
  // 日常用品（含餐具；鏡子／毛巾／牙刷由屋企移入）
  { id: 'jing', term: '鏡子', isDeer: false, emoji: '🪞', badge: '', plate: '#2a3a50' },
  { id: 'maojin', term: '毛巾', isDeer: false, emoji: '🧼', badge: '巾', plate: '#2a3a50' },
  { id: 'yashua', term: '牙刷', isDeer: false, emoji: '🪥', badge: '', plate: '#143828' },
  { id: 'shuihu', term: '水壺', isDeer: false, emoji: '🥤', badge: '', plate: '#0f3550' },
  { id: 'yagao', term: '牙膏', isDeer: false, emoji: '🦷', badge: '膏', plate: '#2a3a50' },
  { id: 'beizi_cup', term: '杯子', isDeer: false, emoji: '🥤', badge: '', plate: '#102848' },
  { id: 'wan', term: '碗', isDeer: false, emoji: '🥣', badge: '', plate: '#3a3010' },
  { id: 'tangchi', term: '湯匙', isDeer: false, emoji: '🥄', badge: '', plate: '#2a3548' },
  { id: 'kuaizi', term: '筷子', isDeer: false, emoji: '🥢', badge: '', plate: '#3a2818' },
  { id: 'chazi', term: '叉子', isDeer: false, emoji: '🍴', badge: '', plate: '#401820' },
  { id: 'panzi', term: '盤子', isDeer: false, emoji: '🍽️', badge: '', plate: '#1a3050' },
  { id: 'zhijin', term: '紙巾', isDeer: false, emoji: '🧻', badge: '', plate: '#3a3a45' },
  { id: 'shuzi', term: '梳子', isDeer: false, emoji: '🪮', badge: '', plate: '#402038' },
  { id: 'lifa', term: '理髮', isDeer: false, emoji: '💇', badge: '', plate: '#281840' },
  { id: 'xitoushui', term: '洗頭水', isDeer: false, emoji: '🧴', badge: '洗', plate: '#1a3050' },
  { id: 'muyulu', term: '沐浴露', isDeer: false, emoji: '🧴', badge: '浴', plate: '#0f3535' },
  { id: 'kouzhao', term: '口罩', isDeer: false, emoji: '😷', badge: '', plate: '#2a3548' },
  { id: 'yanjing', term: '眼鏡', isDeer: false, emoji: '👓', badge: '', plate: '#1a2a4a' },
  // 紅輯高頻（對齊《我自己會讀》紅輯溫習；書面語字形，粵語 TTS）
  // 注意：間尺已用 id chi，故「吃」用 chi_eat；數字「十」已用 shi，故「是」用 shi_be
  { id: 'wo', term: '我', isDeer: false, emoji: '🙋', badge: '', plate: '#1a3050' },
  { id: 'ni', term: '你', isDeer: false, emoji: '👉', badge: '', plate: '#102848' },
  { id: 'ta_he', term: '他', isDeer: false, emoji: '👨', badge: '他', plate: '#2a3548' },
  { id: 'ta_she', term: '她', isDeer: false, emoji: '👩', badge: '她', plate: '#402038' },
  { id: 'kan', term: '看', isDeer: false, emoji: '👀', badge: '看', plate: '#2a1840' },
  { id: 'lai', term: '來', isDeer: false, emoji: '➡️', badge: '', plate: '#143828' },
  { id: 'qu', term: '去', isDeer: false, emoji: '⬅️', badge: '', plate: '#3a3010' },
  { id: 'chi_eat', term: '吃', isDeer: false, emoji: '🍽️', badge: '', plate: '#401820' },
  { id: 'wan_play', term: '玩', isDeer: false, emoji: '🎲', badge: '', plate: '#281840' },
  { id: 'pao', term: '跑', isDeer: false, emoji: '🏃', badge: '', plate: '#402010' },
  { id: 'zou', term: '走', isDeer: false, emoji: '🚶', badge: '', plate: '#2a2a35' },
  { id: 'zuo_sit', term: '坐', isDeer: false, emoji: '🪑', badge: '坐', plate: '#3a2818' },
  { id: 'da_big', term: '大', isDeer: false, emoji: '⬛', badge: '', plate: '#1a1a22' },
  { id: 'xiao_small', term: '小', isDeer: false, emoji: '🔸', badge: '', plate: '#3a3a45' },
  { id: 'you_have', term: '有', isDeer: false, emoji: '✋', badge: '有', plate: '#143820' },
  { id: 'zai', term: '在', isDeer: false, emoji: '📍', badge: '', plate: '#401018' },
  { id: 'shi_be', term: '是', isDeer: false, emoji: '✔️', badge: '', plate: '#0f3535' },
  { id: 'bu', term: '不', isDeer: false, emoji: '❌', badge: '', plate: '#401018' },
  { id: 'hao', term: '好', isDeer: false, emoji: '👍', badge: '', plate: '#143828' },
  { id: 'shang', term: '上', isDeer: false, emoji: '⬆️', badge: '', plate: '#1a3050' },
  { id: 'xia', term: '下', isDeer: false, emoji: '⬇️', badge: '', plate: '#102848' },
  { id: 'ai_love', term: '愛', isDeer: false, emoji: '💗', badge: '', plate: '#401028' },
  { id: 'gei', term: '給', isDeer: false, emoji: '🎁', badge: '', plate: '#2a1840' },
  { id: 'zhao', term: '找', isDeer: false, emoji: '🔍', badge: '', plate: '#2a3548' },
  { id: 'shuo', term: '說', isDeer: false, emoji: '💬', badge: '', plate: '#1a3050' },
  { id: 'pengyou', term: '朋友', isDeer: false, emoji: '👫', badge: '', plate: '#402038' },
  { id: 'zhe', term: '這', isDeer: false, emoji: '👇', badge: '', plate: '#3a3010' },
  { id: 'na_that', term: '那', isDeer: false, emoji: '👉', badge: '那', plate: '#2a2a35' },
  { id: 'duo', term: '多', isDeer: false, emoji: '🔢', badge: '多', plate: '#102848' },
  { id: 'shao', term: '少', isDeer: false, emoji: '1️⃣', badge: '少', plate: '#2a3548' },
  { id: 'didi', term: '弟弟', isDeer: false, emoji: '👦', badge: '弟', plate: '#1a3050' },
  { id: 'meimei', term: '妹妹', isDeer: false, emoji: '👧', badge: '妹', plate: '#402038' },
  { id: 'shuijiao', term: '睡覺', isDeer: false, emoji: '😴', badge: '', plate: '#1a2a4a' },
  { id: 'xiexie', term: '謝謝', isDeer: false, emoji: '🙏', badge: '', plate: '#3a3010' },
  { id: 'laoshi', term: '老師', isDeer: false, emoji: '👩‍🏫', badge: '', plate: '#102848' },
  { id: 'shu_book', term: '書', isDeer: false, emoji: '📕', badge: '', plate: '#401820' },
];

/** 主題：先學再開考 */
const TOPICS = [
  {
    id: 'red_series',
    title: '紅輯',
    blurb: '對齊《我自己會讀》紅輯：高頻字溫習（第一批）',
    cover: '📕',
    wordIds: [
      // 人物／代詞
      'wo', 'ni', 'ta_he', 'ta_she', 'baba', 'mama', 'didi', 'meimei', 'pengyou', 'laoshi',
      // 動作
      'kan', 'lai', 'qu', 'chi_eat', 'wan_play', 'pao', 'zou', 'zuo_sit', 'zhao', 'shuo', 'gei', 'shuijiao',
      // 常用字
      'da_big', 'xiao_small', 'duo', 'shao', 'hao', 'ai_love', 'you_have', 'zai', 'shi_be', 'bu',
      'shang', 'xia', 'zhe', 'na_that', 'xiexie',
      // 重用生活詞（紅輯故事常見）
      'yi', 'shui', 'shu_book', 'gou', 'mao', 'shou', 'jiao', 'ri', 'xuexiao', 'gongyuan',
    ],
  },
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
    blurb: '紅色黃色藍色綠色白色黑色紫色粉紅橙色咖啡色',
    cover: '🎨',
    wordIds: ['hong', 'huang', 'lan', 'lv', 'bai', 'hei', 'zi', 'fenhong', 'chengse', 'kafeise'],
  },
  {
    id: 'weather',
    title: '天氣',
    blurb: '太陽、月亮、雲朵、下雨、雪花、大風、閃電、彩虹',
    cover: '☀️',
    wordIds: ['ri', 'yue', 'yun', 'yu_rain', 'xue', 'feng', 'dian', 'caihong'],
  },
  {
    id: 'nature',
    title: '自然',
    blurb: '星星、天空、花、草、樹、海、沙、火、葉',
    cover: '🌿',
    wordIds: ['xingxing', 'tiankong', 'hua', 'cao', 'shu_tree', 'hai', 'sha', 'huo', 'ye'],
  },
  {
    id: 'transport',
    title: '交通',
    blurb: '汽車、巴士、地鐵、的士、消防車…',
    cover: '🚗',
    wordIds: [
      'che', 'bashi', 'huoche', 'feiji', 'chuan', 'danche',
      'dishi', 'dianche', 'ditie', 'motuoche', 'xiaofangche', 'jiuhuche', 'jingche',
    ],
  },
  {
    id: 'body',
    title: '身體',
    blurb: '眼睛耳朵鼻子嘴巴手腳頭心',
    cover: '👀',
    wordIds: ['yan', 'erduo', 'bi', 'kou', 'shou', 'jiao', 'tou', 'xin'],
  },
  {
    id: 'emotions',
    title: '情緒',
    blurb: '開心、不開心、生氣、害怕、驚喜、害羞',
    cover: '😊',
    wordIds: ['kaixin', 'bukaixin', 'shengqi', 'haipa', 'jingxi', 'haixiu'],
  },
  {
    id: 'senses',
    title: '身體感覺',
    blurb: '累、餓、飽、渴、痛、熱、冷、香、臭',
    cover: '🥵',
    wordIds: ['lei', 'e_hungry', 'bao_full', 'ke_thirsty', 'tong', 're_hot', 'leng_cold', 'xiang_scent', 'chou'],
  },
  {
    id: 'family',
    title: '家庭',
    blurb: '爸爸媽媽爺爺婆婆哥哥姐姐弟弟妹妹寶寶',
    cover: '👨',
    wordIds: ['baba', 'mama', 'yeye', 'popo', 'gege', 'jiejie', 'didi', 'meimei', 'baobao'],
  },
  {
    id: 'food',
    title: '食物',
    blurb: '白飯、小食、肉類、海鮮同飲品',
    cover: '🍚',
    wordIds: [
      'fan', 'mian', 'bao', 'dan', 'nai', 'dangao',
      'shui', 'guozhi', 'xuegao', 'binggan', 'tangguo',
      'sanwenzi', 'hanbao', 'pisa', 'shutiao',
      'jirou', 'niurou', 'zhurou', 'yangrou',
      'xia_shrimp', 'xie_crab', 'haixian',
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
    blurb: '屋企、學校、醫院、超市、泳池、沙田…',
    cover: '🏠',
    wordIds: [
      'wuzi', 'xuexiao', 'keshi', 'gongyuan', 'youlechang', 'shangchang', 'chaoshi', 'jieshi',
      'tushuguan', 'tingchechang', 'shatian',
      'yiyuan', 'xiaofangju', 'jingchaju', 'jichang', 'haitan', 'canting', 'cesuo', 'yongchi',
    ],
  },
  {
    id: 'home',
    title: '屋企',
    blurb: '房間、傢俬、電器同家居設施',
    cover: '🛋️',
    wordIds: [
      'chufang', 'shuifang', 'yushi', 'yangtai',
      'chuangpu', 'zhentou', 'beizi', 'yizi', 'zhuozi', 'shafa', 'yigui', 'chouti',
      'dianshi', 'xuegui', 'xiyiji', 'fengshan', 'lengqi', 'dianhua', 'shizhong', 'deng',
      'men', 'mensuo', 'chuanghu', 'lajitong', 'xiangkuang', 'ditan',
      'xishoutai', 'shuilongtou', 'tuoxie',
    ],
  },
  {
    id: 'daily',
    title: '日常用品',
    blurb: '盥洗、餐具同隨身小物',
    cover: '🪥',
    wordIds: [
      'maojin', 'yashua', 'yagao', 'jing', 'shuzi', 'lifa', 'xitoushui', 'muyulu',
      'kouzhao', 'yanjing', 'shuihu', 'zhijin',
      'beizi_cup', 'wan', 'tangchi', 'kuaizi', 'chazi', 'panzi',
    ],
  },
  {
    id: 'zoo',
    title: '動物園',
    blurb: '鹿家族、猛獸同更多動物園朋友',
    cover: '🦁',
    wordIds: [
      'lu', 'meihualu', 'xunlu', 'tuolu', 'malu',
      'xiong', 'shizi', 'laohu', 'daxiang', 'hou',
      'xiongmao', 'changjinglu', 'banma', 'qie', 'hema', 'xiniu',
      'luotuo', 'daishu', 'shuxiong', 'huli', 'eyu', 'she', 'maotouying', 'lang',
      'haitun', 'haibao', 'kongque', 'honghe',
    ],
  },
  {
    id: 'small_animals',
    title: '小動物',
    blurb: '寵物、農場同奇趣小動物',
    cover: '🐶',
    wordIds: [
      'gou', 'mao', 'yu', 'niao', 'tu',
      'yang', 'niu', 'ma', 'zhu', 'ji', 'ya',
      'wa', 'chong', 'long', 'bianfu', 'ciwei',
    ],
  },
  {
    id: 'fruit',
    title: '水果',
    blurb: '蘋果、芒果、菠蘿、奇異果、櫻桃…',
    cover: '🍎',
    wordIds: [
      'pingguo', 'xiangjiao', 'cheng', 'putao', 'xigua', 'caomei',
      'mangguo', 'boluo', 'tao', 'ningmeng', 'yingtao', 'qiyiguo',
    ],
  },
  {
    id: 'veg',
    title: '蔬菜',
    blurb: '番茄、薯仔、蘑菇、黃瓜、南瓜…',
    cover: '🥕',
    wordIds: [
      'fanqie', 'hongluobo', 'yumi', 'baicai', 'qiezi', 'qingjiao',
      'shuzai', 'yangcong', 'mogu', 'huanggua', 'wandou', 'nangua',
    ],
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
  const badgeIsEmoji = word.badge && /\p{Extended_Pictographic}/u.test(word.badge);
  const badge = word.badge
    ? `<span class="emoji-badge${badgeIsEmoji ? ' emoji-badge-icon' : ''}" aria-hidden="true">${word.badge}</span>`
    : '';
  const faceClass = word.emojiDuo ? 'emoji-face emoji-face-duo' : 'emoji-face';
  return `<span class="emoji-plate" style="--plate:${word.plate || '#122848'}">
    <span class="${faceClass}" aria-hidden="true">${word.emoji}</span>
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

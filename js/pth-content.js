/**
 * PTH content shared by learning cards, quiz questions and word-audio builds.
 * The original 23 videos demonstrate initials, not these example words.
 * Examples are app-curated practice words; they are not claimed as textbook quotes.
 * y/w follow the textbook grouping but are labelled pinyin letters.
 */
export const groupNames = Object.freeze({
  bpmf: 'b・p・m・f', dtnl: 'd・t・n・l', gkh: 'g・k・h',
  jqx: 'j・q・x', zhchshr: 'zh・ch・sh・r', zcs: 'z・c・s', yw: 'y・w',
});
export const groups = Object.freeze(Object.keys(groupNames));

/** Return the first written initial, taking digraphs before single letters. */
export function initialOf(pinyin) {
  const normalized = String(pinyin ?? '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return normalized.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])/)?.[0] ?? '';
}

// Explicit audio keys remain stable when the order of these rows changes.
// say is Mandarin speech input; traditional word is the displayed label.
const wordRows = {
  b: [
    ['b-1', '波波球', 'bō bō qiú', '🎈', '波波球'],
    ['b-2', '巴士', 'bā shì', '🚌', '巴士'],
    ['b-3', '白飯', 'bái fàn', '🍚', '白饭'],
  ],
  p: [
    ['p-1', '葡萄', 'pú tao', '🍇', '葡萄'],
    ['p-2', '蘋果', 'píng guǒ', '🍎', '苹果'],
    ['p-3', '瀑布', 'pù bù', '🏞️', '瀑布'],
  ],
  m: [
    ['m-1', '米飯', 'mǐ fàn', '🍚', '米饭'],
    ['m-2', '貓咪', 'māo mī', '🐱', '猫咪'],
    ['m-3', '馬', 'mǎ', '🐴', '马'],
  ],
  f: [
    ['f-1', '風箏', 'fēng zheng', '🪁', '风筝'],
    ['f-2', '飛機', 'fēi jī', '✈️', '飞机'],
    ['f-3', '飯盒', 'fàn hé', '🍱', '饭盒'],
  ],
  d: [
    ['d-1', '大象', 'dà xiàng', '🐘', '大象'],
    ['d-2', '打中', 'dǎ zhòng', '🎯', '打中'],
    ['d-3', '大門', 'dà mén', '🚪', '大门'],
  ],
  t: [
    ['t-1', '太陽', 'tài yáng', '☀️', '太阳'],
    ['t-2', '兔子', 'tù zi', '🐰', '兔子'],
    ['t-3', '糖果', 'táng guǒ', '🍬', '糖果'],
  ],
  n: [
    ['n-1', '奶牛', 'nǎi niú', '🐄', '奶牛'],
    ['n-2', '鳥', 'niǎo', '🐦', '鸟'],
    ['n-3', '牛奶', 'niú nǎi', '🥛', '牛奶'],
  ],
  l: [
    ['l-1', '梨子', 'lí zi', '🍐', '梨子'],
    ['l-2', '鹿', 'lù', '🦌', '鹿'],
    ['l-3', '老師', 'lǎo shī', '🧑‍🏫', '老师'],
  ],
  g: [
    ['g-1', '哥哥', 'gē ge', '👦', '哥哥'],
    ['g-2', '狗狗', 'gǒu gou', '🐶', '狗狗'],
    ['g-3', '公雞', 'gōng jī', '🐓', '公鸡'],
  ],
  k: [
    ['k-1', '可樂', 'kě lè', '🥤', '可乐'],
    ['k-2', '看見', 'kàn jiàn', '👀', '看见'],
    ['k-3', '口罩', 'kǒu zhào', '😷', '口罩'],
  ],
  h: [
    ['h-1', '花朵', 'huā duǒ', '🌸', '花朵'],
    ['h-2', '河水', 'hé shuǐ', '🏞️', '河水'],
    ['h-3', '海船', 'hǎi chuán', '🚢', '海船'],
  ],
  j: [
    ['j-1', '雞蛋', 'jī dàn', '🥚', '鸡蛋'],
    ['j-2', '家人', 'jiā rén', '👨‍👩‍👧', '家人'],
    ['j-3', '橘子', 'jú zi', '🍊', '橘子'],
  ],
  q: [
    ['q-1', '旗子', 'qí zi', '🚩', '旗子'],
    ['q-2', '青草', 'qīng cǎo', '🌿', '青草'],
    ['q-3', '琴鍵', 'qín jiàn', '🎹', '琴键'],
  ],
  x: [
    ['x-1', '蝦子', 'xiā zi', '🦐', '虾子'],
    ['x-2', '星星', 'xīng xing', '⭐', '星星'],
    ['x-3', '洗手', 'xǐ shǒu', '🧼👐', '洗手'],
  ],
  zh: [
    ['zh-1', '紙張', 'zhǐ zhāng', '📄', '纸张'],
    ['zh-2', '豬', 'zhū', '🐷', '猪'],
    ['zh-3', '蜘蛛', 'zhī zhū', '🕷️', '蜘蛛'],
  ],
  ch: [
    ['ch-1', '車子', 'chē zi', '🚗', '车子'],
    ['ch-2', '叉子', 'chā zi', '🍴', '叉子'],
    ['ch-3', '出發', 'chū fā', '🚶➡️', '出发'],
  ],
  sh: [
    ['sh-1', '書本', 'shū běn', '📖', '书本'],
    ['sh-2', '獅子', 'shī zi', '🦁', '狮子'],
    ['sh-3', '樹木', 'shù mù', '🌳', '树木'],
  ],
  r: [
    ['r-1', '日出', 'rì chū', '🌅', '日出'],
    ['r-2', '人', 'rén', '🧑', '人'],
    ['r-3', '肉類', 'ròu lèi', '🍖', '肉类'],
  ],
  z: [
    ['z-1', '早上', 'zǎo shang', '🌅', '早上'],
    ['z-2', '走路', 'zǒu lù', '🚶', '走路'],
    ['z-3', '足球', 'zú qiú', '⚽', '足球'],
  ],
  c: [
    ['c-1', '草地', 'cǎo dì', '🌱🌱', '草地'],
    ['c-2', '彩虹', 'cǎi hóng', '🌈', '彩虹'],
    ['c-3', '菜', 'cài', '🥬', '菜'],
  ],
  s: [
    ['s-1', '森林', 'sēn lín', '🌲🌲', '森林'],
    ['s-2', '絲線', 'sī xiàn', '🧵', '丝线'],
    ['s-3', '傘', 'sǎn', '☂️', '伞'],
  ],
  y: [
    ['y-1', '葉子', 'yè zi', '🍃', '叶子'],
    ['y-2', '衣服', 'yī fu', '👕', '衣服'],
    ['y-3', '鴨子', 'yā zi', '🦆', '鸭子'],
  ],
  w: [
    ['w-1', '玩具', 'wán jù', '🧸', '玩具'],
    ['w-2', '晚上', 'wǎn shang', '🌙', '晚上'],
    ['w-3', '襪子', 'wà zi', '🧦', '袜子'],
  ],
};

// Preserve prior source references/status as provenance, not a blanket QA claim.
const textbookSources = {
  b: ['PTH textbook K2 QR MP4／bpmf'],
  p: ['PTH textbook K2 QR MP4／bpmf'],
  m: ['PTH textbook K2 QR MP4／bpmf'],
  f: ['PTH textbook K2 QR MP4／bpmf'],
  d: ['PTH textbook K2 p.8（聲母二 d、t、n、l 組別頁；d 個別示範頁未見於掃描）', 'pending'],
  t: ['PTH textbook K2 p.8、p.10（聲母二 d、t、n、l；t 示範見 p.10）', 'verified'],
  n: ['PTH textbook K2 p.8、p.11（聲母二 d、t、n、l；n 示範見 p.11）', 'verified'],
  l: ['PTH textbook K2 p.8、p.9／p.12（聲母二 d、t、n、l；l 示範頁於掃描中重複）', 'verified-with-duplicate-scan'],
  g: ['PTH textbook K2 p.13–14（聲母三 g、k、h；g 示範見 p.13–14）', 'verified'],
  k: ['PTH textbook K2 p.13–15（聲母三 g、k、h；k 示範見 p.14–15）', 'verified'],
  h: ['PTH textbook K2 p.15–16（聲母三 g、k、h；h 示範見 p.15–16）', 'verified'],
  j: ['PTH textbook K2 p.16–17（聲母四 j、q、x；j 示範見 p.17）', 'verified'],
  q: ['PTH textbook K2 p.17–18（聲母四 j、q、x；q 示範見 p.18）', 'verified'],
  x: ['PTH textbook K2 p.18–19（聲母四 j、q、x；x 示範見 p.19）', 'verified'],
  zh: ['PTH textbook K2 p.20–21（聲母五 zh、ch、sh、r；zh 示範見 p.20–21）', 'verified'],
  ch: ['PTH textbook K2 p.21–22（聲母五 zh、ch、sh、r；ch 示範見 p.21–22）', 'verified'],
  sh: ['PTH textbook K2 p.22–23（聲母五 zh、ch、sh、r；sh 示範見 p.22–23）', 'verified'],
  r: ['PTH textbook K2 p.23–24（聲母五 zh、ch、sh、r；r 示範見 p.23–24）', 'verified'],
  z: ['PTH textbook K2 p.25（聲母六 z、c、s；z 示範）', 'verified'],
  c: ['PTH textbook K2 p.25–26（聲母六 z、c、s；c 示範見 p.26）', 'verified'],
  s: ['PTH textbook K2 p.26–27（聲母六 z、c、s；s 示範見 p.27）', 'verified'],
  y: ['PTH textbook K2 p.28–29（聲母七 y、w；y 示範見 p.28–29）', 'verified'],
  w: ['PTH textbook K2 p.29–30（聲母七 y、w；w 示範見 p.29–30）', 'verified'],
};

export const sounds = Object.freeze(groups.flatMap(group =>
  groupNames[group].split('・').map(id => {
    const examples = Object.freeze(wordRows[id].map(([audioKey, word, pinyin, emoji, say]) =>
      Object.freeze({ id: audioKey, audioKey, word, pinyin, emoji, say,
        initial: initialOf(pinyin), syllableIndex: 0, imageLabel: `${word}示意圖` })));
    const first = examples[0];
    return Object.freeze({
      id, name: id, group, examples,
      textbookRef: textbookSources[id][0],
      ...(textbookSources[id][1] ? { textbookStatus: textbookSources[id][1] } : {}),
      kind: group === 'yw' ? 'letter' : 'initial',
      tip: group === 'yw'
        ? `拼音字母 ${id}，依教材編組練習。`
        : `聲母 ${id}，跟着例詞讀一次。`,
      video: `assets/pth/initials/video/${id}.mp4`,
      sourceNote: '教材影片示範發音；例詞為另編練習。',
      word: first.word, emoji: first.emoji, emojiLabel: first.imageLabel,
      syllables: first.pinyin.split(/\s+/).map(syllable => [syllable, initialOf(syllable)]),
    });
  })));

function seededRandom(seed) {
  let value = 2166136261;
  for (const char of String(seed)) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return () => {
    value += 0x6D2B79F5;
    let next = Math.imul(value ^ value >>> 15, value | 1);
    next ^= next + Math.imul(next ^ next >>> 7, next | 61);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

/** Ten explicit tasks, not a short list consumed with modulo indexing. */
export function buildQuestions(group, seed = 0) {
  if (!groups.includes(group)) throw new RangeError(`Unknown PTH group: ${group}`);
  const members = sounds.filter(sound => sound.group === group);
  // Interleave initials so each one (including its basic word) is represented.
  const words = [0, 1, 2].flatMap(index => members.map(sound => sound.examples[index]));
  const tasks = words.slice(0, 10).map((word, index) => ({
    word, type: index % 2 === 0 ? 'listen' : 'picture',
  }));
  const firstPass = [...tasks];
  for (const task of firstPass) {
    if (tasks.length === 10) break;
    tasks.push({ word: task.word, type: task.type === 'listen' ? 'picture' : 'listen' });
  }
  const random = seededRandom(`${group}:${seed}`);
  for (let index = tasks.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [tasks[index], tasks[other]] = [tasks[other], tasks[index]];
  }
  const target = group === 'yw' ? '拼音字母' : '聲母';
  return tasks.map(({ word, type }) => ({
    id: `${group}:${word.id}:${type}`,
    type, answer: word.initial, word,
    prompt: `${type === 'listen' ? '聽詞語' : '看圖讀詞語'}，找出第一個${target}。`,
    hint: `提示：「${word.word}」的第一個${target}是 ${word.initial}。`,
  }));
}

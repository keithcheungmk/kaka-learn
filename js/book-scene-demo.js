const BOOKS = [
  {
    id: 'balloon', title: '我的氣球呢？', stars: 6,
    scenes: [
      { image: 'assets/book-scenes/balloon-colours-a.jpg', aspect: '1.97', source: '紅①・第 2–3 頁', targets: [{ word: '紅氣球', x: 31, y: 26 }, { word: '藍氣球', x: 72, y: 27 }], distractors: ['黃氣球', '綠氣球'] },
      { image: 'assets/book-scenes/balloon-colours-b.jpg', aspect: '1.97', source: '紅①・第 4–5 頁', targets: [{ word: '黃氣球', x: 18, y: 24 }, { word: '綠氣球', x: 74, y: 27 }], distractors: ['紅氣球', '藍氣球'] },
      { image: 'assets/book-scenes/balloon-flew-away.jpg', aspect: '1.2', source: '紅①・第 8 頁', targets: [{ word: '氣球', x: 31, y: 20 }, { word: '飛走了', x: 48, y: 34 }], distractors: ['紅氣球', '藍氣球'] },
    ],
  },
  {
    id: 'anan', title: '貪吃的安安', stars: 6,
    scenes: [
      { image: 'assets/book-scenes/anan-snacks.jpg', aspect: '1.97', source: '紅②・第 2–3 頁', targets: [{ word: '花生', x: 27, y: 45 }, { word: '糖果', x: 78, y: 35 }], distractors: ['餅乾', '水果'] },
      { image: 'assets/book-scenes/anan-biscuits-fruit.jpg', aspect: '1.97', source: '紅②・第 4–5 頁', targets: [{ word: '餅乾', x: 24, y: 45 }, { word: '水果', x: 79, y: 47 }], distractors: ['薯片', '汽水'] },
      { image: 'assets/book-scenes/anan-chips-drink.jpg', aspect: '1.97', source: '紅②・第 6–7 頁', targets: [{ word: '薯片', x: 25, y: 39 }, { word: '汽水', x: 76, y: 41 }], distractors: ['花生', '糖果'] },
    ],
  },
];

// 紅輯其餘書本：頁面資產係內容 lead 從各本 PDF 揀出嘅真實故事頁；
// 但每頁 target 對位仍待逐頁核實，故保留未完成標記，唔會冒充已完成教材。
const RED_BOOKS = [
  ['rb_yusan', '雨傘', '☂️', 'yusan', ['雨傘', '橙雨傘', '藍雨傘', '綠雨傘', '黃雨傘', '花雨傘', '收起小雨傘', '太陽出來了', '出來了', '下雨']],
  ['rb_xin', '信', '✉️', 'xin', ['信', '爸爸', '的', '哥哥', '安安', '媽媽', '姐姐', '爺爺', '沒有', '寫']],
  ['rb_fenguo', '分果果', '🍎', 'fenguo', ['哥哥', '留給', '姐姐', '最後', '婆婆', '分果果', '小狗', '梨', '蘋果', '水果']],
  ['rb_kuaipao', '快跑呀', '🏃', 'kuaipao', ['快', '跑', '啊', '呀', '大火', '小鹿', '老虎', '兔子', '獅子', '斑馬快跑']],
  ['rb_shuijiao', '誰在叫', '📣', 'shuijiao', ['肚子', '小弟弟', '誰在叫', '叫', '誰', '餓', '貓', '羊', '牛', '狗']],
  ['rb_huangye', '黃葉', '🍂', 'huangye', ['黃葉', '一', '五', '了', '片', '二', '四', '三', '秋天', '葉']],
  ['rb_yishuhua', '一束花', '💐', 'yishuhua', ['我', '做', '花兒', '把', '送給', '一朵', '媽媽', '一束', '做好', '花']],
  ['rb_fengwan', '風跟我玩', '🌬️', 'fengwan', ['小帆船', '小頑皮', '吹泡泡', '跟我玩', '了', '是', '我', '風', '玩', '風車']],
  ['rb_xiaoming', '小明和氣球', '🎈', 'xiaoming', ['氣球', '飛過', '爸爸', '起牀', '飛上', '高高的', '飛到', '大大的', '帶', '河']],
  ['rb_dongdong', '冬冬請客', '🍽️', 'dongdong', ['媽媽', '骨頭', '冬冬', '青蛙', '請客', '小蟲', '小狗', '花貓', '吃', '魚']],
].map(([id, title, cover, slug, words]) => ({
  id,
  title,
  stars: 10,
  mode: 'preview',
  cover,
  // 五輪 × 兩個詞語 = 10 題；真實書頁展示，詞語位置待核實。
  scenes: [0, 1, 2, 3, 4].map((page, index) => ({
    image: `assets/book-scenes/red-series-pages/${title}-p${(page % 3) + 4}.jpg`,
    aspect: '1.72',
    incomplete: true,
    source: `紅輯・《${title}》PDF 故事頁 ${(page % 3) + 4}；頁面 target 對位待核實 ${page + 1}`,
    targets: words.slice(index * 2, index * 2 + 2).map((word, targetIndex) => ({ word, x: targetIndex ? 68 : 28, y: 24 + (index % 3) * 22 })),
    distractors: words.filter((word) => !words.slice(index * 2, index * 2 + 2).includes(word)).slice(0, 2),
  })),
}));

BOOKS.push(...RED_BOOKS);

const $ = (selector) => document.querySelector(selector);
let book = BOOKS[0];
let sceneIndex = 0;
let selectedWord = null;
let placements = {};
let stars = 0;
let locked = false;

const progressKey = (bookId) => `kaka-red-book-game-v2:${bookId}`;
function loadProgress(bookId) {
  try { return JSON.parse(localStorage.getItem(progressKey(bookId)) || '{}'); } catch { return {}; }
}
function saveProgress() {
  try { localStorage.setItem(progressKey(book.id), JSON.stringify({ stars, sceneIndex, completed: sceneIndex >= book.scenes.length - 1 && locked })); } catch { /* private browsing */ }
}

function speak(text, onEnd) {
  const api = window.KakaSpeech;
  if (api?.speakTerm) api.speakTerm(text, { rate: 0.82, onEnd });
  else if (onEnd) onEnd();
}

function targetWords() {
  return book.scenes[sceneIndex].targets.map((target) => target.word);
}

function sceneOptions() {
  const scene = book.scenes[sceneIndex];
  return [...scene.targets.map((target) => target.word), ...scene.distractors];
}

function placeWord(word, target) {
  if (locked) return;
  const targetWordsForScene = targetWords();
  if (!sceneOptions().includes(word) || !targetWordsForScene.includes(target)) return;
  const heardWhileSelecting = selectedWord === word;
  Object.keys(placements).forEach((slot) => {
    if (placements[slot] === word) delete placements[slot];
  });
  placements[target] = word;
  selectedWord = null;
  renderScene();
  if (!heardWhileSelecting) speak(word);
}

function renderBookTabs() {
  $('#book-tabs').innerHTML = BOOKS.map((item) => `<button type="button" data-book="${item.id}" aria-current="${item.id === book.id}">${item.title}</button>`).join('');
  $('#book-tabs').querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      book = BOOKS.find((item) => item.id === button.dataset.book) || BOOKS[0];
      const saved = loadProgress(book.id);
      sceneIndex = Number.isInteger(saved.sceneIndex) ? Math.min(saved.sceneIndex, book.scenes.length - 1) : 0;
      stars = Number.isInteger(saved.stars) ? Math.min(saved.stars, book.stars) : 0;
      placements = {};
      selectedWord = null;
      locked = Boolean(saved.completed);
      $('#scene-complete').hidden = true;
      $('.scene-game').hidden = false;
      renderBookTabs();
      renderScene();
    });
  });
}

function renderScene() {
  const scene = book.scenes[sceneIndex];
  $('#scene-book-title').textContent = book.title;
  $('#scene-progress').textContent = `第 ${sceneIndex + 1} / ${book.scenes.length} 頁`;
  $('#star-count').textContent = `${stars}/${book.stars} ⭐`;
  $('#scene-prompt').textContent = '看圖，找出詞語。';
  $('#scene-feedback').textContent = `${scene.source}・先聽，再放字詞。`;
  $('#scene-feedback').className = 'scene-feedback';
  $('#scene-submit').disabled = Object.keys(placements).length !== scene.targets.length || locked;
  $('#scene-feedback').dataset.mode = book.mode || 'verified';

  const board = $('#scene-board');
  board.style.setProperty('--scene-aspect', scene.aspect);
  const preview = scene.image
    ? `<img src="${scene.image}" alt="${book.title} PDF 故事書頁" decoding="async"><small class="scene-preview-badge">真實故事頁・頁面配對待核實</small>`
    : `<div class="scene-neutral-preview" role="img" aria-label="${book.title}中性場景預覽"><span>${book.cover || '📖'}</span><small>場景預覽・待書頁核實</small></div>`;
  board.innerHTML = `${preview}${scene.targets.map((target) => `<button type="button" class="drop-zone${placements[target.word] ? ' is-filled' : ''}" data-target="${target.word}" style="left:${target.x}%;top:${target.y}%" aria-label="把詞語放到${target.word}的位置">${placements[target.word] || '拖到這裡'}</button>`).join('')}`;
  board.querySelectorAll('.drop-zone').forEach((zone) => {
    zone.addEventListener('click', () => selectedWord && placeWord(selectedWord, zone.dataset.target));
    zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('is-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
    zone.addEventListener('drop', (event) => { event.preventDefault(); zone.classList.remove('is-over'); placeWord(event.dataTransfer.getData('text/plain'), zone.dataset.target); });
  });

  const used = new Set(Object.values(placements));
  $('#word-bank').innerHTML = sceneOptions().map((word) => `<button type="button" class="word-card${selectedWord === word ? ' is-selected' : ''}${scene.targets.some((target) => target.word === word) ? '' : ' is-distractor'}" data-word="${word}" draggable="${!used.has(word)}" ${used.has(word) || locked ? 'disabled' : ''}>${word} <small>🔊</small></button>`).join('');
  $('#word-bank').querySelectorAll('.word-card').forEach((card) => {
    card.addEventListener('click', () => {
      selectedWord = card.dataset.word;
      speak(selectedWord);
      renderScene();
    });
    card.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', card.dataset.word));
  });
}

function submitScene() {
  if (locked) return;
  const scene = book.scenes[sceneIndex];
  if (Object.keys(placements).length !== scene.targets.length) return;
  const correct = scene.targets.every((target) => placements[target.word] === target.word);
  const feedback = $('#scene-feedback');
  if (!correct) {
    feedback.textContent = '再聽一次，想想每個詞語在哪一幅圖裡。';
    feedback.className = 'scene-feedback is-retry';
    window.KakaSpeech?.speakRetryFeedback?.();
    return;
  }
  locked = true;
  stars += scene.targets.length;
  saveProgress();
  $('#star-count').textContent = `${stars}/${book.stars} ⭐`;
  feedback.textContent = '答對了！字詞和書頁場景連起來了。';
  feedback.className = 'scene-feedback is-good';
  $('#scene-submit').disabled = true;
  const spoken = scene.targets.map((target) => target.word).join('。');
  window.KakaSpeech?.speakWordThenEncourage?.(spoken, { onEnd: advanceScene });
  if (!window.KakaSpeech?.speakWordThenEncourage) setTimeout(advanceScene, 1200);
}

function advanceScene() {
  if (sceneIndex < book.scenes.length - 1) {
    sceneIndex += 1;
    placements = {};
    selectedWord = null;
    locked = false;
    renderScene();
    return;
  }
  $('.scene-game').hidden = true;
  saveProgress();
  $('#complete-copy').textContent = `你完成了《${book.title}》的 ${book.stars} 個場景字詞。`;
  $('#scene-complete').hidden = false;
}

$('#scene-submit').addEventListener('click', submitScene);
$('#scene-replay').addEventListener('click', () => {
  sceneIndex = 0;
  stars = 0;
  placements = {};
  selectedWord = null;
  locked = false;
  saveProgress();
  $('#scene-complete').hidden = true;
  $('.scene-game').hidden = false;
  renderScene();
});

window.KakaSpeech?.warmVoices?.();
renderBookTabs();
renderScene();

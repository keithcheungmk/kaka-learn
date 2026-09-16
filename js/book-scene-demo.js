const BOOKS = [
  {
    id: 'balloon', title: '我的氣球呢？', stars: 6,
    scenes: [
      { image: 'assets/book-scenes/balloon-colours-a.webp', aspect: '1.97', source: '紅①・第 2–3 頁', targets: [{ word: '紅', x: 31, y: 26 }, { word: '藍', x: 72, y: 27 }] },
      { image: 'assets/book-scenes/balloon-colours-b.webp', aspect: '1.97', source: '紅①・第 4–5 頁', targets: [{ word: '黃', x: 18, y: 24 }, { word: '綠', x: 74, y: 27 }] },
      { image: 'assets/book-scenes/balloon-flew-away.webp', aspect: '1.2', source: '紅①・第 8 頁', targets: [{ word: '氣球', x: 31, y: 20 }, { word: '飛走', x: 48, y: 34 }] },
    ],
  },
  {
    id: 'anan', title: '貪吃的安安', stars: 6,
    scenes: [
      { image: 'assets/book-scenes/anan-snacks.webp', aspect: '1.97', source: '紅②・第 2–3 頁', targets: [{ word: '花生', x: 27, y: 45 }, { word: '糖果', x: 78, y: 35 }] },
      { image: 'assets/book-scenes/anan-biscuits-fruit.webp', aspect: '1.97', source: '紅②・第 4–5 頁', targets: [{ word: '餅乾', x: 24, y: 45 }, { word: '水果', x: 79, y: 47 }] },
      { image: 'assets/book-scenes/anan-chips-drink.webp', aspect: '1.97', source: '紅②・第 6–7 頁', targets: [{ word: '薯片', x: 25, y: 39 }, { word: '汽水', x: 76, y: 41 }] },
    ],
  },
];

const $ = (selector) => document.querySelector(selector);
let book = BOOKS[0];
let sceneIndex = 0;
let selectedWord = null;
let placements = {};
let stars = 0;
let locked = false;

function speak(text, onEnd) {
  const api = window.KakaSpeech;
  if (api?.speakTerm) api.speakTerm(text, { rate: 0.82, onEnd });
  else if (onEnd) onEnd();
}

function targetWords() {
  return book.scenes[sceneIndex].targets.map((target) => target.word);
}

function placeWord(word, target) {
  if (locked) return;
  const targetWordsForScene = targetWords();
  if (!targetWordsForScene.includes(word) || !targetWordsForScene.includes(target)) return;
  Object.keys(placements).forEach((slot) => {
    if (placements[slot] === word) delete placements[slot];
  });
  placements[target] = word;
  selectedWord = null;
  renderScene();
}

function renderBookTabs() {
  $('#book-tabs').innerHTML = BOOKS.map((item) => `<button type="button" data-book="${item.id}" aria-current="${item.id === book.id}">${item.title}</button>`).join('');
  $('#book-tabs').querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      book = BOOKS.find((item) => item.id === button.dataset.book) || BOOKS[0];
      sceneIndex = 0;
      stars = 0;
      placements = {};
      selectedWord = null;
      locked = false;
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

  const board = $('#scene-board');
  board.style.setProperty('--scene-aspect', scene.aspect);
  board.innerHTML = `<img src="${scene.image}" alt="${book.title}的書頁場景" decoding="async">${scene.targets.map((target) => `<button type="button" class="drop-zone${placements[target.word] ? ' is-filled' : ''}" data-target="${target.word}" style="left:${target.x}%;top:${target.y}%" aria-label="把詞語放到${target.word}的位置">${placements[target.word] || '拖到這裡'}</button>`).join('')}`;
  board.querySelectorAll('.drop-zone').forEach((zone) => {
    zone.addEventListener('click', () => selectedWord && placeWord(selectedWord, zone.dataset.target));
    zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('is-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
    zone.addEventListener('drop', (event) => { event.preventDefault(); zone.classList.remove('is-over'); placeWord(event.dataTransfer.getData('text/plain'), zone.dataset.target); });
  });

  const used = new Set(Object.values(placements));
  $('#word-bank').innerHTML = scene.targets.map((target) => `<button type="button" class="word-card${selectedWord === target.word ? ' is-selected' : ''}" data-word="${target.word}" draggable="${!used.has(target.word)}" ${used.has(target.word) || locked ? 'disabled' : ''}>${target.word} <small>🔊</small></button>`).join('');
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
  $('#scene-complete').hidden = true;
  $('.scene-game').hidden = false;
  renderScene();
});

window.KakaSpeech?.warmVoices?.();
renderBookTabs();
renderScene();

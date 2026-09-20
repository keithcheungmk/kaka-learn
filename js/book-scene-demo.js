import { RED_SERIES_BOOKS, RED_SENTENCE_RULES } from '../data/red-series/sentence-game-data.mjs';
import { addQuestionStars, answerChoiceIds, makeOptions, placeChunkAt, placeNextChunk, removeChunkAt, isSentenceCorrect } from './red-sentence-engine.mjs';

const LEGACY_BOOKS = [
  {
    id: 'balloon', title: '我的氣球呢？', stars: 6,
    scenes: [
      { image: 'assets/book-scenes/balloon-colours-a.jpg', aspect: '1.97', source: '紅①・第 2–3 頁', targets: [{ word: '紅氣球' }, { word: '藍氣球' }], distractors: ['黃氣球', '綠氣球'] },
      { image: 'assets/book-scenes/balloon-colours-b.jpg', aspect: '1.97', source: '紅①・第 4–5 頁', targets: [{ word: '黃氣球' }, { word: '綠氣球' }], distractors: ['紅氣球', '藍氣球'] },
      { image: 'assets/book-scenes/balloon-flew-away.jpg', aspect: '1.2', source: '紅①・第 8 頁', targets: [{ word: '氣球' }, { word: '飛走了' }], distractors: ['紅氣球', '藍氣球'] },
    ],
  },
  {
    id: 'anan', title: '貪吃的安安', stars: 6,
    scenes: [
      { image: 'assets/book-scenes/anan-snacks.jpg', aspect: '1.97', source: '紅②・第 2–3 頁', targets: [{ word: '花生' }, { word: '糖果' }], distractors: ['餅乾', '水果'] },
      { image: 'assets/book-scenes/anan-biscuits-fruit.jpg', aspect: '1.97', source: '紅②・第 4–5 頁', targets: [{ word: '餅乾' }, { word: '水果' }], distractors: ['薯片', '汽水'] },
      { image: 'assets/book-scenes/anan-chips-drink.jpg', aspect: '1.97', source: '紅②・第 6–7 頁', targets: [{ word: '薯片' }, { word: '汽水' }], distractors: ['花生', '糖果'] },
    ],
  },
];

// 紅輯正式題只讀逐頁核實 manifest；其餘書保持真實頁面預覽，不會再由全書字卡索引湊答案。
const RED_BOOKS = RED_SERIES_BOOKS.map((item) => ({
  ...item,
  stars: item.mode === 'sentence'
    ? Math.min(item.questions.reduce((total, question) => total + (question.stars ?? question.chunks.length * RED_SENTENCE_RULES.starsPerSentenceChunk), 0), RED_SENTENCE_RULES.starCap)
    : 0,
  scenes: item.mode === 'sentence'
    ? item.questions
    : item.previewPages.map((page) => ({ ...page, aspect: '1.72', source: `PDF 第 ${page.pdfPage} 頁・句子待核實` })),
}));
// 只顯示 12 本紅輯 manifest。舊版 hard-coded 場景沒有逐頁來源，留在檔案內作歷史資料
// 會令書單出現重複書名及未核實答案，所以不再加入可玩的書本清單。
const BOOKS = [...RED_BOOKS];
const $ = (selector) => document.querySelector(selector);

let book = RED_BOOKS.find((item) => item.id === 'rb_fenguo')
  || RED_BOOKS.find((item) => item.mode === 'sentence')
  || BOOKS[0];
let sceneIndex = 0;
let selectedWord = null;
let placements = {};
let stars = 0;
let earnedByScene = {};
let completedScenes = new Set();
let locked = false;
let phase = 'learn';
let roundGeneration = 0;
let optionSceneId = null;
let optionOrder = [];

const activeProfileId = () => window.KakaStorage?.getActiveProfileId?.() || 'kaka';
const progressKey = (bookId) => `kaka-red-book-game-v5:${activeProfileId()}:${bookId}`;
function loadProgress(bookId) {
  try { return JSON.parse(localStorage.getItem(progressKey(bookId)) || '{}'); } catch { return {}; }
}
function saveProgress(overrides = {}) {
  const saved = {
    stars,
    sceneIndex,
    earnedByScene,
    completedSceneIds: [...completedScenes],
    completed: Boolean(locked && sceneIndex >= book.scenes.length - 1),
    ...overrides,
  };
  try { localStorage.setItem(progressKey(book.id), JSON.stringify(saved)); } catch { /* private browsing */ }
}

function usesGentleFlow(item = book) {
  return item.mode === 'sentence' && item.flow === RED_SENTENCE_RULES.gentleFlow;
}

function sentenceStartPhase(item = book) {
  return usesGentleFlow(item) ? 'play' : 'learn';
}

function speak(text, onEnd) {
  const api = window.KakaSpeech;
  if (api?.speakTerm) api.speakTerm(text, { rate: 0.82, onEnd });
  else onEnd?.();
}

function currentScene() {
  return book.scenes[Math.min(sceneIndex, book.scenes.length - 1)];
}

function currentSentenceChunks(scene = currentScene()) {
  return scene.chunks || [];
}

function placementArray(size) {
  return Array.from({ length: size }, (_, index) => placements[String(index)] ?? null);
}

function filledCount() {
  return Object.values(placements).filter((value) => value != null).length;
}

function setSentencePlacements(values) {
  placements = Object.fromEntries(values.map((value, index) => [String(index), value]).filter(([, value]) => value != null));
}

function ensureOptionOrder(scene) {
  const sceneId = `${book.id}:${scene.id || sceneIndex}`;
  if (optionSceneId !== sceneId) {
    optionSceneId = sceneId;
    optionOrder = makeOptions({ chunks: scene.chunks || scene.targets.map((target) => target.word), distractors: scene.distractors });
  }
}

function setFeedback(text, type = '') {
  const feedback = $('#scene-feedback');
  feedback.textContent = text;
  feedback.className = `scene-feedback${type ? ` is-${type}` : ''}`;
}

function renderBookTabs() {
  const tabs = $('#book-tabs');
  tabs.replaceChildren();
  BOOKS.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.book = item.id;
    button.setAttribute('aria-current', String(item.id === book.id));
    button.disabled = locked;
    button.append(document.createTextNode(item.title));
    const status = document.createElement('small');
    status.textContent = item.mode === 'sentence'
      ? `${item.questions.length} 個跨頁任務`
      : item.mode === 'preview' ? '書頁預覽' : '舊版試玩';
    button.append(status);
    button.addEventListener('click', () => selectBook(item));
    tabs.append(button);
  });
}

function selectBook(item) {
  if (locked) return;
  roundGeneration += 1;
  window.KakaSpeech?.cancelAllSpeech?.();
  book = item;
  const saved = loadProgress(book.id);
  const savedMax = Math.max(0, book.scenes.length - 1);
  earnedByScene = saved.earnedByScene && typeof saved.earnedByScene === 'object' ? saved.earnedByScene : {};
  completedScenes = new Set(Array.isArray(saved.completedSceneIds) ? saved.completedSceneIds : []);
  const savedIndex = Number.isInteger(saved.sceneIndex) ? Math.min(saved.sceneIndex, savedMax) : 0;
  const firstIncompleteIndex = book.mode === 'sentence' ? book.scenes.findIndex((scene) => !completedScenes.has(scene.id)) : -1;
  sceneIndex = firstIncompleteIndex >= 0 && completedScenes.has(book.scenes[savedIndex]?.id) ? firstIncompleteIndex : savedIndex;
  stars = book.stars ? Math.min(Number.isInteger(saved.stars) ? saved.stars : 0, book.stars) : 0;
  placements = {};
  phase = item.mode === 'sentence' ? sentenceStartPhase(item) : 'play';
  selectedWord = null;
  const allSentenceScenesComplete = book.mode === 'sentence' && book.scenes.every((scene) => completedScenes.has(scene.id));
  const completed = Boolean((saved.completed || allSentenceScenesComplete) && book.mode !== 'preview');
  locked = false;
  optionSceneId = null;
  $('#scene-complete').hidden = !completed;
  $('.scene-game').hidden = completed;
  if (completed) {
    $('#complete-copy').textContent = book.mode === 'sentence'
      ? `你完成了《${book.title}》的 ${book.scenes.length} 個書頁任務，集齊 ${book.stars} 粒星！`
      : `你完成了《${book.title}》的場景字詞任務。`;
    saveProgress({ sceneIndex: savedMax, stars, completed: true });
  }
  renderBookTabs();
  renderScene();
}

function renderScene() {
  const scene = currentScene();
  const isPreview = book.mode === 'preview';
  const isSentence = book.mode === 'sentence';
  const isLegacy = book.mode === 'legacy';
  const chunks = currentSentenceChunks(scene);
  const answerIds = isSentence ? answerChoiceIds(scene) : [];
  if (!isPreview) ensureOptionOrder(scene);

  $('#scene-book-title').textContent = book.title;
  $('#scene-progress').textContent = isPreview
    ? `原頁 ${sceneIndex + 1} / ${book.scenes.length}`
    : isSentence ? `第 ${sceneIndex + 1} / ${book.scenes.length} 版` : `第 ${sceneIndex + 1} / ${book.scenes.length} 題`;
  $('#star-count').textContent = isPreview
    ? '書頁預覽'
    : `${stars}/${book.stars || RED_SENTENCE_RULES.starCap} ⭐`;
  $('#star-count').setAttribute('aria-label', isPreview ? '本書只供頁面預覽，尚未開放星星測驗' : '星星進度');
  $('#scene-ranger').hidden = isPreview;
  const gentle = usesGentleFlow();
  $('#scene-prompt').textContent = isPreview
    ? '書頁預覽・未核實原句前不會出測驗'
    : isSentence
      ? gentle
        ? '聽一聽，再把本版詞組放好。'
        : phase === 'learn' ? '先看一看、聽一聽，認識本版句子。' : '把本版所有詞組按原書次序放好。'
      : '看場景，找出正確字詞。';
  $('#scene-help').textContent = isPreview
    ? '原頁可以翻閱；逐頁內容核實後才會開放正式遊戲。'
    : isSentence
      ? gentle
        ? '隨時可撳讀音掣。點一下詞組會放入下一格；亦可拖曳。砌齊就讀句，再開心下一版。'
        : phase === 'learn' ? '先聽完整跨頁內容；準備好後再開始砌句小測。' : '點一下正確詞組會自動放入下一格；亦可拖曳，錯了可點格子清走。'
      : '按一下正確字詞，再放入對應格子。';

  const board = $('#scene-board');
  board.style.setProperty('--scene-aspect', scene.aspect || '1.72');
  const imageAlt = `${book.title}掃描書頁，PDF 第 ${scene.pdfPage ?? '—'} 頁`;
  const coverText = isSentence && phase === 'play'
    ? `<div class="scene-sentence-mask" aria-hidden="true">${gentle ? '聽一聽・砌本版' : '測驗中・先聽一聽再砌'}</div>`
    : '';
  // 預覽狀態放在圖片外的說明區，避免 badge 蓋住書頁文字或插圖。
  board.innerHTML = scene.image
    ? `<img src="${scene.image}" alt="${imageAlt}" decoding="async">${coverText}`
    : `<div class="scene-neutral-preview" role="img" aria-label="${book.title}中性場景預覽"><span>📖</span><small>場景預覽</small></div>`;

  $('#scene-listen').hidden = !isSentence;
  $('#scene-listen').disabled = locked;
  $('#scene-listen').textContent = gentle || phase === 'learn' ? '🔊 聽本版句子' : '🔊 重聽本版句子';
  $('#scene-study').hidden = !isSentence || phase !== 'learn' || gentle;
  $('#scene-study-sentence').textContent = isSentence && !gentle ? scene.sentence : '';
  $('#scene-start-quiz').hidden = !isSentence || phase !== 'learn' || gentle;
  $('#scene-start-quiz').disabled = locked;
  $('#scene-review').hidden = !isSentence || phase !== 'play' || gentle;
  $('#scene-review').disabled = locked;
  $('#scene-preview-note').hidden = !isPreview;
  $('#scene-preview-note').textContent = isPreview
    ? '此書可以先看掃描頁；原句、詞組及干擾項仍在逐頁核實，核實完成後才會開放正式測驗。'
    : '';
  $('#scene-preview-nav').hidden = !isPreview;
  $('#scene-preview-prev').disabled = locked || sceneIndex <= 0;
  $('#scene-preview-next').disabled = locked || sceneIndex >= book.scenes.length - 1;
  // gentle：唔使「檢查」掣——砌齊自動判、讀句、翻頁
  $('#scene-submit').hidden = isPreview || (isSentence && phase !== 'play') || gentle;
  $('#scene-submit').textContent = isSentence ? '檢查本版句子' : '提交答案';
  $('#word-bank').hidden = isPreview || (isSentence && phase !== 'play');
  $('#scene-feedback').dataset.mode = book.mode;
  $('#scene-feedback').dataset.flow = gentle ? 'gentle' : '';

  if (isPreview) {
    $('#word-bank').replaceChildren();
    setFeedback(`${scene.source}。此書原句／切詞尚未核實，暫不開放答題。`);
    return;
  }

  const sourceLine = isSentence
    ? `來源：《${book.title}》PDF 第 ${scene.pdfPage} 頁・書內第 ${(scene.bookPages || [scene.bookPage]).join('、')} 頁${scene.side}。${scene.excludedSide ? ` ${scene.excludedSide}` : ''}`
    : `${scene.source}・舊版場景配詞預覽。`;
  if (isSentence && phase === 'learn') {
    setFeedback(sourceLine);
    $('#scene-submit').disabled = true;
    $('#word-bank').replaceChildren();
    return;
  }

  const slotWords = isSentence ? chunks : scene.targets.map((target) => target.word);
  const completeSlots = filledCount() === slotWords.length;
  $('#scene-submit').disabled = !completeSlots || locked;
  setFeedback(gentle
    ? `${sourceLine} 聽完就砌；砌齊會自動讀句翻頁。`
    : sourceLine);

  const used = new Set(Object.values(placements));
  const slotsMarkup = slotWords.map((word, index) => {
    const value = isSentence ? placements[String(index)] : placements[word];
    const displayValue = isSentence ? optionOrder.find((choice) => choice.id === value)?.text || '' : value || '';
    const aria = displayValue || `第 ${index + 1} 個詞組，未填`;
    return `<button type="button" class="answer-slot${displayValue ? ' is-filled' : ''}" data-slot="${index}"${isLegacy ? ` data-target="${word}"` : ''} aria-label="${aria}"${locked ? ' disabled' : ''}>${displayValue || (isSentence ? `詞組 ${index + 1}` : '本頁字詞')}</button>`;
  }).join('');
  const choicesMarkup = optionOrder.map((choice) => {
    const alreadyUsed = used.has(isSentence ? choice.id : choice.text);
    return `<button type="button" class="word-card${choice.isAnswer ? '' : ' is-distractor'}" data-choice-id="${choice.id}" data-word="${choice.text}" draggable="${!alreadyUsed && !locked}" ${alreadyUsed || locked ? 'disabled' : ''}>${choice.text}</button>`;
  }).join('');
  const wordBank = $('#word-bank');
  wordBank.dataset.choiceCount = String(optionOrder.length);
  wordBank.classList.toggle('is-dense', optionOrder.length >= 12);
  wordBank.innerHTML = `<div class="answer-slots" aria-label="本版詞組次序">${slotsMarkup}</div>${choicesMarkup}`;

  $('#word-bank').querySelectorAll('.answer-slot').forEach((zone) => {
    zone.addEventListener('click', () => {
      if (locked) return;
      if (isSentence) {
        setSentencePlacements(removeChunkAt(placementArray(slotWords.length), Number(zone.dataset.slot)));
        renderScene();
      } else if (selectedWord) {
        placeLegacyWord(selectedWord, zone.dataset.target);
      }
    });
    zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('is-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
    zone.addEventListener('drop', (event) => {
      event.preventDefault();
      zone.classList.remove('is-over');
      if (locked) return;
      const word = event.dataTransfer.getData('text/plain');
      if (isSentence) placeSentenceChunk(word, Number(zone.dataset.slot));
      else placeLegacyWord(word, zone.dataset.target);
    });
  });

  $('#word-bank').querySelectorAll('.word-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (locked) return;
      const word = card.dataset.word;
      if (isSentence) {
        const choice = optionOrder.find((option) => option.id === card.dataset.choiceId);
        if (!choice?.isAnswer) {
          setFeedback('再聽一次，揀句子入面嘅詞組。', 'retry');
          return;
        }
        setSentencePlacements(placeNextChunk(placementArray(chunks.length), choice.id, answerIds));
        renderScene();
        return;
      }
      const target = scene.targets.find((item) => item.word === word && !placements[item.word]);
      if (target) {
        placeLegacyWord(word, target.word);
        return;
      }
      selectedWord = word;
      speak(word);
      renderScene();
    });
    card.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', isSentence ? card.dataset.choiceId : card.dataset.word));
  });

  if (gentle && completeSlots && !locked) {
    // 砌齊後喺下一 tick 自動完成，等今次 render 事件綁定先完成
    queueMicrotask(() => maybeAutoCompleteGentle());
  }
}

function placeSentenceChunk(word, slotIndex) {
  const scene = currentScene();
  const answerIds = answerChoiceIds(scene);
  if (locked) return;
  if (!answerIds.includes(word)) {
    setFeedback('再聽一次，揀句子入面嘅詞組。', 'retry');
    return;
  }
  setSentencePlacements(placeChunkAt(placementArray(answerIds.length), word, slotIndex, answerIds));
  renderScene();
}

function placeLegacyWord(word, target) {
  if (locked) return;
  const scene = currentScene();
  const validWords = [...scene.targets.map((item) => item.word), ...scene.distractors];
  if (!validWords.includes(word) || !scene.targets.some((item) => item.word === target)) return;
  Object.keys(placements).forEach((slot) => {
    if (placements[slot] === word) delete placements[slot];
  });
  placements[target] = word;
  selectedWord = null;
  renderScene();
}

function listenCurrentSentence() {
  const scene = currentScene();
  if (scene.sentence) speak(scene.sentence);
}

function maybeAutoCompleteGentle() {
  if (locked || !usesGentleFlow() || phase !== 'play') return;
  const scene = currentScene();
  const chunks = currentSentenceChunks(scene);
  const answerIds = answerChoiceIds(scene);
  if (filledCount() !== chunks.length) return;
  if (!isSentenceCorrect(placementArray(chunks.length), answerIds, optionOrder, chunks)) {
    setFeedback('次序未啱，再聽一次，試試調換詞組。', 'retry');
    return;
  }
  submitScene();
}

function startSentenceQuiz() {
  if (locked || book.mode !== 'sentence' || usesGentleFlow()) return;
  phase = 'play';
  renderScene();
}

function reviewSentence() {
  if (locked || book.mode !== 'sentence' || usesGentleFlow()) return;
  phase = 'learn';
  renderScene();
}

function setTransitionControls(disabled) {
  $('#scene-listen').disabled = disabled;
  $('#scene-start-quiz').disabled = disabled;
  $('#scene-review').disabled = disabled;
  document.querySelectorAll('#book-tabs button, #scene-preview-nav button, .answer-slot, .word-card').forEach((button) => {
    button.disabled = disabled || button.disabled;
  });
}

function shootStars(amount, onEachLanded) {
  const ranger = $('#scene-ranger');
  const target = $('#star-count');
  const fx = window.KakaStarFx;
  let landedCount = 0;
  const landNext = () => {
    if (landedCount >= amount) return;
    let alreadyLanded = false;
    const onLanded = () => {
      if (alreadyLanded) return;
      alreadyLanded = true;
      landedCount += 1;
      onEachLanded?.(landedCount);
      if (landedCount < amount) setTimeout(landNext, 90);
    };
    if (!fx?.flyStar || !fx?.getRangerMuzzle || !ranger || !target) {
      onLanded();
      return;
    }
    const animation = fx.flyStar(fx.getRangerMuzzle(ranger), target, ranger, onLanded);
    animation?.catch?.(onLanded);
  };
  landNext();
}

function submitScene() {
  if (locked || book.mode === 'preview' || (book.mode === 'sentence' && phase !== 'play')) return;
  const scene = currentScene();
  const feedback = $('#scene-feedback');
  let correct = false;
  const answerIds = book.mode === 'sentence' ? answerChoiceIds(scene) : [];
  if (book.mode === 'sentence') {
    const chunks = currentSentenceChunks(scene);
    if (filledCount() !== chunks.length) {
      setFeedback('先把詞組放進每個空格，再按檢查。');
      return;
    }
    correct = isSentenceCorrect(placementArray(chunks.length), answerIds, optionOrder, chunks);
  } else {
    if (filledCount() !== scene.targets.length) return;
    correct = scene.targets.every((target) => placements[target.word] === target.word);
  }
  if (!correct) {
    setFeedback(book.mode === 'sentence' ? '次序未啱，再聽一次，試試調換詞組。' : '再試一次，找找和場景相配的字詞。', 'retry');
    return;
  }

  locked = true;
  const sceneStars = book.mode === 'sentence'
    ? Math.min(
      Math.max(0, (scene.stars ?? scene.chunks.length * RED_SENTENCE_RULES.starsPerSentenceChunk) - (earnedByScene[scene.id] || 0)),
      Math.max(0, book.stars - stars),
    )
    : 2;
  $('#scene-submit').disabled = true;
  const spoken = scene.sentence || scene.targets.map((target) => target.word).join('。');
  const gentle = usesGentleFlow();
  setFeedback(
    book.mode === 'sentence'
      ? gentle
        ? `砌好喇！聽一聽：${spoken}`
        : `答對了！${spoken}（收集 ${sceneStars} 粒星）`
      : '答對了！你已經配好本頁字詞。',
    'good',
  );

  const isLastQuestion = sceneIndex >= book.scenes.length - 1;
  const token = roundGeneration;
  let landedStars = 0;
  let speechEnded = false;
  let speechStarted = false;
  let sceneAwardRecorded = false;
  const finish = () => {
    if (token !== roundGeneration || landedStars < sceneStars || !speechEnded) return;
    saveProgress({ sceneIndex: isLastQuestion ? sceneIndex : sceneIndex + 1, stars, completed: isLastQuestion });
    advanceScene(isLastQuestion);
  };
  const startSpeech = () => {
    if (token !== roundGeneration || speechStarted) return;
    speechStarted = true;
    if (book.mode === 'sentence' && !sceneAwardRecorded) {
      sceneAwardRecorded = true;
      completedScenes.add(scene.id);
      saveProgress({ sceneIndex, stars, completed: false });
    }
    if (window.KakaSpeech?.speakWordThenEncourage) {
      window.KakaSpeech.speakWordThenEncourage(spoken, { onEnd: onSpeechEnd });
    } else {
      speak(spoken, onSpeechEnd);
    }
  };
  const landStar = () => {
    if (token !== roundGeneration) return;
    landedStars += 1;
    stars = addQuestionStars(stars, 1, book.stars);
    if (book.mode === 'sentence') earnedByScene[scene.id] = (earnedByScene[scene.id] || 0) + 1;
    $('#star-count').textContent = `${stars}/${book.stars} ⭐`;
    saveProgress({ sceneIndex, stars, completed: false });
    if (landedStars >= sceneStars) startSpeech();
  };
  setTransitionControls(true);
  const onSpeechEnd = () => {
    if (token !== roundGeneration) return;
    speechEnded = true;
    finish();
  };
  if (sceneStars > 0) shootStars(sceneStars, landStar);
  else startSpeech();
}

function advanceScene(isLastQuestion = sceneIndex >= book.scenes.length - 1) {
  if (!isLastQuestion) {
    sceneIndex += 1;
    placements = {};
    selectedWord = null;
    locked = false;
    phase = book.mode === 'sentence' ? sentenceStartPhase() : 'play';
    optionSceneId = null;
    saveProgress({ sceneIndex, stars, completed: false });
    renderBookTabs();
    renderScene();
    return;
  }
  locked = false;
  renderBookTabs();
  $('.scene-game').hidden = true;
  $('#scene-complete').hidden = false;
  $('#complete-copy').textContent = book.mode === 'sentence'
    ? `你完成了《${book.title}》的 ${book.scenes.length} 個書頁任務，集齊 ${book.stars} 粒星！`
    : `你完成了《${book.title}》的場景字詞任務。`;
  saveProgress({ sceneIndex, stars, completed: true });
}

function movePreviewPage(delta) {
  if (book.mode !== 'preview') return;
  sceneIndex = Math.max(0, Math.min(book.scenes.length - 1, sceneIndex + delta));
  renderScene();
}

$('#scene-listen').addEventListener('click', listenCurrentSentence);
$('#scene-submit').addEventListener('click', submitScene);
$('#scene-start-quiz').addEventListener('click', startSentenceQuiz);
$('#scene-review').addEventListener('click', reviewSentence);
$('#scene-preview-prev').addEventListener('click', () => movePreviewPage(-1));
$('#scene-preview-next').addEventListener('click', () => movePreviewPage(1));
$('#scene-replay').addEventListener('click', () => {
  roundGeneration += 1;
  window.KakaSpeech?.cancelAllSpeech?.();
  sceneIndex = 0;
  stars = 0;
  earnedByScene = {};
  completedScenes = new Set();
  placements = {};
  selectedWord = null;
  locked = false;
  phase = book.mode === 'sentence' ? sentenceStartPhase() : 'play';
  optionSceneId = null;
  saveProgress({ sceneIndex: 0, stars: 0, completed: false });
  $('#scene-complete').hidden = true;
  $('.scene-game').hidden = false;
  renderScene();
});

window.KakaSpeech?.warmVoices?.();
renderBookTabs();
selectBook(book);

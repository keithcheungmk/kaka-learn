/* Classic script — no ES modules (works in sidebar / simple previews). */
(function () {
  if (!window.KakaWords || !window.KakaStorage || !window.KakaSpeech) {
    console.error('KakaLearn: required scripts missing. Check words.js / storage.js / speech.js loaded first.');
    const row = document.querySelector('.btn-row');
    if (row) {
      const msg = document.createElement('p');
      msg.style.cssText = 'color:#FDE68A;font-size:1.1rem;max-width:28ch;margin:12px auto;';
      msg.textContent = '遊戲腳本載入失敗，請用本機伺服器打開（見 README）。';
      row.appendChild(msg);
    }
    return;
  }

const { WORDS, DEER_IDS, TOPICS, wordIllustHtml, getTopicById, wordsForTopic } = window.KakaWords;
const {
  loadState,
  updateState,
  tryEarnStar,
  redeemableCoins,
  resetStars,
  todayKey,
} = window.KakaStorage;
const {
  warmVoices,
  speakTerm,
  speakCorrectFeedback,
  speakRetryFeedback,
  playCorrectCue,
  playTryAgainCue,
  playStarCue,
  playCoinHintCue,
} = window.KakaSpeech;

const HERO_EMOJI = `<div class="hero-emoji-stack" aria-hidden="true">
  <span class="hero-emoji-main">🦌</span>
  <span class="hero-emoji-orbit">🚀</span>
  <span class="hero-emoji-star">⭐</span>
</div>`;

/** @type {ReturnType<typeof loadState>} */
let state = loadState();
let pinBuffer = '';
let listenRound = null;
let matchRound = null;
let buildRound = null;
let busy = false;
/** @type {string|null} */
let buildSelectedKey = null;
let buildDrag = null;
/** @type {string|null} */
let activeTopicId = null;
/** @type {ReturnType<typeof wordsForTopic>} */
let learnWords = [];
let learnIndex = 0;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function init() {
  try {
    warmVoices();
    const hero = $('#hero-deer');
    if (hero) hero.innerHTML = HERO_EMOJI;
    bindHome();
    bindTopics();
    bindLearn();
    bindPlayPick();
    bindListen();
    bindMatch();
    bindBuild();
    bindParent();
    bindStarInfo();
    refreshStarUI();
    closeAllModals();
  } catch (err) {
    console.error('KakaLearn init failed', err);
  }
}

function closeAllModals() {
  ['#modal-pin', '#modal-parent', '#modal-stars'].forEach((sel) => {
    $(sel)?.classList.remove('open');
  });
}

function startListenMode(ev) {
  if (ev) ev.preventDefault();
  if (!activeTopicId) {
    showScreen('topics');
    return;
  }
  closeAllModals();
  showScreen('listen');
  startListenRound();
}

function startMatchMode(ev) {
  if (ev) ev.preventDefault();
  if (!activeTopicId) {
    showScreen('topics');
    return;
  }
  closeAllModals();
  showScreen('match');
  startMatchRound();
}

function startBuildMode(ev) {
  if (ev) ev.preventDefault();
  if (!activeTopicId) {
    showScreen('topics');
    return;
  }
  closeAllModals();
  showScreen('build');
  startBuildRound();
}

function bindHome() {
  const startBtn = $('#btn-start-topics');
  if (startBtn) startBtn.onclick = (ev) => {
    if (ev) ev.preventDefault();
    closeAllModals();
    openTopics();
  };

  window.KakaLearn = Object.assign(window.KakaLearn || {}, {
    startListen: startListenMode,
    startMatch: startMatchMode,
    startBuild: startBuildMode,
    goHome: () => showScreen('home'),
    openTopics,
  });
}

function bindTopics() {
  const back = $('#btn-back-topics');
  if (back) back.onclick = () => showScreen('home');
}

function bindLearn() {
  const back = $('#btn-back-learn');
  if (back) back.onclick = () => openTopics();
  const stage = $('#learn-stage');
  if (stage) stage.onclick = () => speakCurrentLearn();
  const prev = $('#btn-learn-prev');
  const next = $('#btn-learn-next');
  if (prev) prev.onclick = () => stepLearn(-1);
  if (next) next.onclick = () => stepLearn(1);
  const play = $('#btn-learn-play');
  if (play) play.onclick = () => openPlayPick();
}

function bindPlayPick() {
  const back = $('#btn-back-play');
  if (back) back.onclick = () => openLearn(activeTopicId);
  const listenBtn = $('#btn-mode-listen');
  const matchBtn = $('#btn-mode-match');
  const buildBtn = $('#btn-mode-build');
  if (listenBtn) listenBtn.onclick = startListenMode;
  if (matchBtn) matchBtn.onclick = startMatchMode;
  if (buildBtn) buildBtn.onclick = startBuildMode;
}

function showScreen(name) {
  $$('.screen').forEach((el) => el.classList.remove('active'));
  const map = {
    home: '#screen-home',
    topics: '#screen-topics',
    learn: '#screen-learn',
    play: '#screen-play',
    listen: '#screen-listen',
    match: '#screen-match',
    build: '#screen-build',
  };
  $(map[name])?.classList.add('active');
  if (name === 'home' || name === 'topics' || name === 'play') refreshStarUI();
}

function openTopics() {
  renderTopics();
  showScreen('topics');
  refreshStarUI();
}

function renderTopics() {
  const grid = $('#topic-grid');
  if (!grid) return;
  grid.innerHTML = '';
  TOPICS.forEach((topic) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'topic-card';
    btn.innerHTML = `
      <span class="topic-cover" aria-hidden="true">${topic.cover}</span>
      <span class="topic-title">${topic.title}</span>
      <span class="topic-blurb">${topic.blurb}</span>
    `;
    btn.onclick = () => openLearn(topic.id);
    grid.appendChild(btn);
  });
}

function openLearn(topicId) {
  const topic = getTopicById(topicId);
  if (!topic) return;
  activeTopicId = topicId;
  state = loadState();
  const enabled = new Set(
    state.enabledWordIds && state.enabledWordIds.length
      ? state.enabledWordIds
      : WORDS.map((w) => w.id),
  );
  learnWords = wordsForTopic(topicId).filter((w) => enabled.has(w.id));
  if (learnWords.length < 1) learnWords = wordsForTopic(topicId);
  // 每次入主題都打亂順序，令卡卡更有新鮮感
  learnWords = shuffle(learnWords);
  learnIndex = 0;
  const title = $('#learn-topic-title');
  if (title) title.textContent = topic.title;
  renderLearnCard();
  showScreen('learn');
}

function renderLearnCard() {
  const word = learnWords[learnIndex];
  if (!word) return;
  const illust = $('#learn-illust');
  const term = $('#learn-term');
  const progress = $('#learn-progress');
  if (illust) illust.innerHTML = wordIllustHtml(word);
  if (term) term.textContent = word.term;
  if (progress) progress.textContent = `${learnIndex + 1}/${learnWords.length}`;

  const prev = $('#btn-learn-prev');
  const next = $('#btn-learn-next');
  const finishRow = $('#learn-finish-row');
  const atEnd = learnIndex >= learnWords.length - 1;
  if (prev) prev.disabled = learnIndex <= 0;
  if (next) {
    next.disabled = false;
    next.textContent = atEnd ? '再睇一次' : '下一張';
  }
  if (finishRow) finishRow.hidden = !atEnd;

  // Enlarge learn plate
  const plate = illust?.querySelector('.emoji-plate');
  if (plate) plate.classList.add('emoji-plate-lg');
  const face = illust?.querySelector('.emoji-face');
  if (face) face.classList.add('emoji-face-lg');

  speakCurrentLearn();
}

function speakCurrentLearn() {
  const word = learnWords[learnIndex];
  if (!word) return;
  state = loadState();
  speakTerm(word.term, { muted: state.muted });
}

function stepLearn(delta) {
  if (!learnWords.length) return;
  if (delta > 0 && learnIndex >= learnWords.length - 1) {
    // 「再睇一次」：重新打亂順序
    learnWords = shuffle(learnWords);
    learnIndex = 0;
  } else {
    learnIndex = Math.max(0, Math.min(learnWords.length - 1, learnIndex + delta));
  }
  renderLearnCard();
}

function openPlayPick() {
  const topic = getTopicById(activeTopicId);
  const title = $('#play-topic-title');
  if (title) title.textContent = topic ? `${topic.title}・去玩玩` : '去玩玩';
  showScreen('play');
  refreshStarUI();
}

function enabledWords() {
  state = loadState();
  const ids = state.enabledWordIds;
  let list = !ids || !ids.length ? [...WORDS] : WORDS.filter((w) => ids.includes(w.id));
  if (activeTopicId) {
    const topicSet = new Set(wordsForTopic(activeTopicId).map((w) => w.id));
    list = list.filter((w) => topicSet.has(w.id));
  }
  if (list.length < 2) {
    list = activeTopicId ? wordsForTopic(activeTopicId) : [...WORDS];
  }
  if (list.length < 2) list = [...WORDS];
  return list;
}

/** 抽題：鹿類可加權 */
function pickTarget(pool) {
  state = loadState();
  if (!state.deerFocus) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const weighted = [];
  pool.forEach((w) => {
    const weight = w.isDeer || DEER_IDS.includes(w.id) ? 2 : 1;
    for (let i = 0; i < weight; i += 1) weighted.push(w);
  });
  return weighted[Math.floor(Math.random() * weighted.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleOthers(pool, targetId, count) {
  const others = shuffle(pool.filter((w) => w.id !== targetId));
  return others.slice(0, count);
}

/* ---------- 模式 A：聽音選卡 ---------- */

function bindListen() {
  const speak = $('#btn-speak-listen');
  if (speak) {
    speak.onclick = () => {
      if (!listenRound) return;
      speakTerm(listenRound.target.term, { muted: loadState().muted });
    };
  }
  const back = $('#btn-back-listen');
  if (back) back.onclick = () => openPlayPick();
}

function startListenRound() {
  busy = false;
  const pool = enabledWords();
  const target = pickTarget(pool);
  const optionCount = Math.min(4, pool.length);
  const options = shuffle([target, ...sampleOthers(pool, target.id, optionCount - 1)]);
  listenRound = { target, options };

  const feedback = $('#listen-feedback');
  feedback.textContent = '';
  feedback.className = 'feedback';

  const grid = $('#listen-options');
  grid.innerHTML = '';
  options.forEach((word) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'word-card word-card-chars word-card-flip';
    btn.dataset.id = word.id;
    // 正面淨漢字（考認字）；撳完先翻背面睇 emoji
    btn.innerHTML = `
      <span class="flip-inner">
        <span class="flip-face flip-front">
          <span class="term term-only">${word.term}</span>
        </span>
        <span class="flip-face flip-back" aria-hidden="true">
          ${wordIllustHtml(word)}
          <span class="term flip-back-term">${word.term}</span>
        </span>
      </span>`;
    btn.setAttribute('aria-label', word.term);
    btn.addEventListener('click', () => onListenPick(word.id, btn));
    grid.appendChild(btn);
  });

  refreshStarUI();
  setTimeout(() => speakTerm(target.term, { muted: loadState().muted }), 280);
}

function flipListenCard(btn, stay) {
  if (!btn) return;
  btn.classList.add('is-flipped');
  if (!stay) {
    setTimeout(() => btn.classList.remove('is-flipped'), 1100);
  }
}

function onListenPick(id, btn) {
  if (busy || !listenRound) return;
  if (btn.classList.contains('is-flipped')) return;
  state = loadState();
  const correct = id === listenRound.target.id;
  const targetTerm = listenRound.target.term;

  if (correct) {
    busy = true;
    flipListenCard(btn, true);
    btn.classList.add('correct');
    playCorrectCue({ muted: state.muted });
    const praise = speakCorrectFeedback({ muted: state.muted });
    const fb = $('#listen-feedback');
    fb.textContent = praise;
    fb.className = 'feedback ok';
    awardStar().then(() => {
      setTimeout(() => startListenRound(), 2800);
    });
  } else {
    // 錯咗都翻一吓睇圖，跟住翻返去——唔好長期露圖，避免靠淘汰答
    flipListenCard(btn, false);
    btn.classList.add('wrong');
    playTryAgainCue({ muted: state.muted });
    const fb = $('#listen-feedback');
    fb.className = 'feedback retry';
    setTimeout(() => btn.classList.remove('wrong'), 450);
    // 鼓勵句講完先再讀正確字詞，避免 cancel 切走鼓勵聲
    const retryLine = speakRetryFeedback({
      muted: state.muted,
      onEnd: () => {
        setTimeout(() => speakTerm(targetTerm, { muted: loadState().muted }), 250);
      },
    });
    fb.textContent = retryLine;
  }
}

/* ---------- 模式 B：睇圖揀漢字 ---------- */

function bindMatch() {
  const back = $('#btn-back-match');
  if (back) back.onclick = () => openPlayPick();
}

function startMatchRound() {
  busy = false;
  const pool = enabledWords();
  const target = pickTarget(pool);
  const optionCount = Math.min(4, pool.length);
  const options = shuffle([target, ...sampleOthers(pool, target.id, optionCount - 1)]);
  matchRound = { target, options };

  const fb = $('#match-feedback');
  fb.textContent = '';
  fb.className = 'feedback';

  const stage = $('#match-stage');
  if (stage) {
    stage.innerHTML = wordIllustHtml(target);
    const plate = stage.querySelector('.emoji-plate');
    if (plate) plate.classList.add('emoji-plate-lg');
    const face = stage.querySelector('.emoji-face');
    if (face) face.classList.add('emoji-face-lg');
  }

  const grid = $('#match-options');
  grid.innerHTML = '';
  options.forEach((word) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'word-card word-card-chars';
    btn.dataset.id = word.id;
    btn.innerHTML = `<span class="term term-only">${word.term}</span>`;
    btn.setAttribute('aria-label', word.term);
    btn.addEventListener('click', () => onMatchPick(word.id, btn));
    grid.appendChild(btn);
  });

  refreshStarUI();
}

function onMatchPick(id, btn) {
  if (busy || !matchRound) return;
  state = loadState();
  const correct = id === matchRound.target.id;
  const targetTerm = matchRound.target.term;

  if (correct) {
    busy = true;
    btn.classList.add('correct');
    playCorrectCue({ muted: state.muted });
    // 鼓勵句講完先再讀漢字，避免 cancel 切走鼓勵聲
    const praise = speakCorrectFeedback({
      muted: state.muted,
      onEnd: () => {
        setTimeout(() => speakTerm(targetTerm, { muted: loadState().muted }), 220);
      },
    });
    const fb = $('#match-feedback');
    fb.textContent = praise;
    fb.className = 'feedback ok';
    awardStar().then(() => {
      setTimeout(() => startMatchRound(), 3200);
    });
  } else {
    btn.classList.add('wrong');
    playTryAgainCue({ muted: state.muted });
    const fb = $('#match-feedback');
    fb.className = 'feedback retry';
    setTimeout(() => btn.classList.remove('wrong'), 450);
    const retryLine = speakRetryFeedback({ muted: state.muted });
    fb.textContent = retryLine;
  }
}

/* ---------- 模式 C：砌一砌（拖／撳單字按順序） ---------- */

function termChars(term) {
  return [...term];
}

function makeBuildTiles(target, wordPool, size = 8) {
  const needed = termChars(target.term);
  const tiles = needed.map((ch, i) => ({ key: `need-${i}-${ch}`, char: ch }));
  const distractors = shuffle(
    wordPool
      .filter((w) => w.id !== target.id)
      .flatMap((w) => termChars(w.term))
  );
  for (const ch of distractors) {
    if (tiles.length >= size) break;
    tiles.push({ key: `d-${tiles.length}-${ch}`, char: ch });
  }
  if (tiles.length < size) {
    for (const ch of shuffle(WORDS.flatMap((w) => termChars(w.term)))) {
      if (tiles.length >= size) break;
      tiles.push({ key: `x-${tiles.length}-${ch}`, char: ch });
    }
  }
  return shuffle(tiles);
}

function bindBuild() {
  const back = $('#btn-back-build');
  if (back) back.onclick = () => openPlayPick();
}

function startBuildRound() {
  busy = false;
  buildSelectedKey = null;
  buildDrag = null;
  const pool = enabledWords();
  const target = pickTarget(pool);
  const chars = termChars(target.term);
  const tiles = makeBuildTiles(target, pool, 8);
  buildRound = {
    target,
    chars,
    filled: chars.map(() => null),
    tiles,
  };

  const fb = $('#build-feedback');
  if (fb) {
    fb.textContent = '由左到右，砌啱每個字';
    fb.className = 'feedback';
  }

  const stage = $('#build-stage');
  if (stage) {
    stage.innerHTML = wordIllustHtml(target);
    stage.querySelector('.emoji-plate')?.classList.add('emoji-plate-lg');
    stage.querySelector('.emoji-face')?.classList.add('emoji-face-lg');
  }

  renderBuildSlots();
  renderBuildPool();
  refreshStarUI();
}

function nextBuildIndex() {
  if (!buildRound) return -1;
  return buildRound.filled.findIndex((x) => !x);
}

function renderBuildSlots() {
  const box = $('#build-slots');
  if (!box || !buildRound) return;
  const next = nextBuildIndex();
  box.innerHTML = '';
  buildRound.chars.forEach((ch, i) => {
    const filled = buildRound.filled[i];
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = 'build-slot';
    if (filled) slot.classList.add('is-filled');
    if (i === next) slot.classList.add('is-next');
    slot.dataset.index = String(i);
    slot.setAttribute('aria-label', filled ? `已放 ${filled.char}` : `第 ${i + 1} 格，淡字 ${ch}`);
    slot.innerHTML = `
      <span class="build-ghost" aria-hidden="true">${ch}</span>
      ${filled ? `<span class="build-placed">${filled.char}</span>` : ''}`;
    slot.addEventListener('click', () => onBuildSlotTap(i));
    box.appendChild(slot);
  });
}

function renderBuildPool() {
  const box = $('#build-pool');
  if (!box || !buildRound) return;
  box.innerHTML = '';
  buildRound.tiles.forEach((tile) => {
    const used = buildRound.filled.some((f) => f && f.key === tile.key);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'build-tile';
    if (used) btn.classList.add('is-used');
    if (buildSelectedKey === tile.key) btn.classList.add('is-selected');
    btn.dataset.key = tile.key;
    btn.textContent = tile.char;
    btn.setAttribute('aria-label', `漢字 ${tile.char}`);
    if (!used) {
      let suppressClick = false;
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        onBuildTileTap(tile.key);
      });
      btn.addEventListener('pointerdown', (ev) => {
        onBuildPointerDown(ev, tile, () => {
          suppressClick = true;
        });
      });
    }
    box.appendChild(btn);
  });
}

function onBuildTileTap(key) {
  if (busy || !buildRound) return;
  const used = buildRound.filled.some((f) => f && f.key === key);
  if (used) return;
  buildSelectedKey = buildSelectedKey === key ? null : key;
  renderBuildPool();
  const fb = $('#build-feedback');
  if (fb && buildSelectedKey) {
    fb.textContent = '而家撳左邊發光嘅格';
    fb.className = 'feedback';
  }
}

function onBuildSlotTap(index) {
  if (busy || !buildRound) return;
  const next = nextBuildIndex();
  // 撳已填最尾格可以拆返
  if (buildRound.filled[index]) {
    const lastFilled = [...buildRound.filled].map((f, i) => (f ? i : -1)).filter((i) => i >= 0).pop();
    if (lastFilled === index) {
      buildRound.filled[index] = null;
      buildSelectedKey = null;
      renderBuildSlots();
      renderBuildPool();
      const fb = $('#build-feedback');
      if (fb) {
        fb.textContent = '由左到右，砌啱每個字';
        fb.className = 'feedback';
      }
    }
    return;
  }
  if (!buildSelectedKey || index !== next) return;
  tryPlaceBuildChar(buildSelectedKey, index);
}

function tryPlaceBuildChar(tileKey, slotIndex) {
  if (busy || !buildRound) return false;
  const next = nextBuildIndex();
  const tile = buildRound.tiles.find((t) => t.key === tileKey);
  if (!tile) return false;
  if (buildRound.filled.some((f) => f && f.key === tileKey)) return false;

  state = loadState();
  const slotEl = $(`#build-slots .build-slot[data-index="${slotIndex}"]`);

  if (slotIndex !== next) {
    slotEl?.classList.add('is-wrong');
    setTimeout(() => slotEl?.classList.remove('is-wrong'), 450);
    playTryAgainCue({ muted: state.muted });
    const fb = $('#build-feedback');
    if (fb) {
      fb.textContent = '要由左到右砌呀';
      fb.className = 'feedback retry';
    }
    buildSelectedKey = null;
    renderBuildPool();
    return false;
  }

  const expected = buildRound.chars[slotIndex];
  if (tile.char !== expected) {
    slotEl?.classList.add('is-wrong');
    setTimeout(() => slotEl?.classList.remove('is-wrong'), 450);
    playTryAgainCue({ muted: state.muted });
    const retryLine = speakRetryFeedback({ muted: state.muted });
    const fb = $('#build-feedback');
    if (fb) {
      fb.textContent = retryLine;
      fb.className = 'feedback retry';
    }
    buildSelectedKey = null;
    renderBuildPool();
    return false;
  }

  buildRound.filled[slotIndex] = { key: tile.key, char: tile.char };
  buildSelectedKey = null;
  renderBuildSlots();
  renderBuildPool();

  if (buildRound.filled.every(Boolean)) {
    finishBuildSuccess();
  } else {
    // 砌啱一個字都播短鼓勵音效（唔讀整句，避免同之後成功鼓勵搶聲）
    playCorrectCue({ muted: state.muted });
    const fb = $('#build-feedback');
    if (fb) {
      fb.textContent = '好！繼續砌下一個';
      fb.className = 'feedback ok';
    }
  }
  return true;
}

function finishBuildSuccess() {
  if (!buildRound) return;
  busy = true;
  state = loadState();
  playCorrectCue({ muted: state.muted });
  const term = buildRound.target.term;
  // 鼓勵句講完先再讀字詞，避免 speakTerm 嘅 cancel 切走鼓勵聲
  const praise = speakCorrectFeedback({
    muted: state.muted,
    onEnd: () => {
      setTimeout(() => speakTerm(term, { muted: loadState().muted }), 220);
    },
  });
  const fb = $('#build-feedback');
  if (fb) {
    fb.textContent = praise;
    fb.className = 'feedback ok';
  }
  awardStar().then(() => {
    setTimeout(() => startBuildRound(), 3200);
  });
}

function onBuildPointerDown(ev, tile, onDragStarted) {
  if (busy || !buildRound || ev.button === 2) return;
  const used = buildRound.filled.some((f) => f && f.key === tile.key);
  if (used) return;
  const startX = ev.clientX;
  const startY = ev.clientY;
  const btn = ev.currentTarget;
  let moved = false;
  const ghost = document.createElement('div');
  ghost.className = 'build-drag-ghost';
  ghost.textContent = tile.char;

  const onMove = (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!moved && Math.hypot(dx, dy) < 10) return;
    if (!moved) {
      moved = true;
      if (typeof onDragStarted === 'function') onDragStarted();
      buildSelectedKey = tile.key;
      btn.classList.add('is-dragging');
      btn.classList.add('is-selected');
      document.body.appendChild(ghost);
    }
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
  };

  const onUp = (e) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    if (!moved) return;
    ghost.remove();
    btn.classList.remove('is-dragging');
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slot = el?.closest?.('.build-slot');
    const idx = slot ? Number(slot.dataset.index) : -1;
    if (idx >= 0) {
      tryPlaceBuildChar(tile.key, idx);
    } else {
      buildSelectedKey = null;
      renderBuildPool();
    }
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

/* ---------- 星星（只喺測驗答啱先加；學習頁唔計星） ---------- */

async function awardStar() {
  const result = tryEarnStar();
  state = result.state;
  refreshStarUI();

  if (result.gained) {
    showStarBurst();
    playStarCue({ muted: state.muted });
    // First star of the day: gentle AEON coin cue (no blocking modal)
    if (state.starsToday === 1 && !state.coinHintSeen) {
      playCoinHintCue({ muted: state.muted });
      state = updateState({ coinHintSeen: true });
    } else if (state.starsToday === 10 || state.totalStars % 10 === 0) {
      playCoinHintCue({ muted: state.muted });
    }
  } else if (result.capped) {
    const fb =
      $('.screen.active .feedback') || $('#listen-feedback');
    if (fb) {
      fb.textContent = '今日星星滿晒喇！聽日再嚟攞星～';
      fb.className = 'feedback';
    }
  }
  return result;
}

function showStarBurst() {
  const el = $('#star-burst');
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}

function refreshStarUI() {
  state = loadState();
  if (state.starsDate !== todayKey()) {
    state = updateState({ starsToday: 0, starsDate: todayKey() });
  }
  const coins = redeemableCoins(state.totalStars);
  const todayLabel = `今日 ${state.starsToday} / 10`;
  const coinsLabel = `可換 ${coins} 枚 AEON 幣`;

  const todayEl = $('#stars-today-label');
  const coinsEl = $('#coins-label');
  if (todayEl) todayEl.textContent = todayLabel;
  if (coinsEl) coinsEl.textContent = coinsLabel;
  $$('.stars-today-inline').forEach((el) => {
    el.textContent = `${state.starsToday}/10`;
  });
}

function bindStarInfo() {
  $('#btn-star-info').addEventListener('click', () => openStarsModal());
  $('#btn-stars-close').addEventListener('click', () => {
    $('#modal-stars').classList.remove('open');
  });
}

function openStarsModal() {
  refreshStarUI();
  state = loadState();
  $('#info-stars-today').textContent = `${state.starsToday} / 10`;
  $('#info-total-stars').textContent = String(state.totalStars);
  $('#info-coins').textContent = `${redeemableCoins(state.totalStars)} 枚`;
  $('#modal-stars').classList.add('open');
  playCoinHintCue({ muted: state.muted });
}

/* ---------- 家長區 ---------- */

function bindParent() {
  $('#btn-parent').addEventListener('click', () => openPinModal());
  $('#btn-pin-cancel').addEventListener('click', () => closePinModal());
  $('#btn-parent-close').addEventListener('click', () => {
    $('#modal-parent').classList.remove('open');
  });

  buildPinPad();
  $('#toggle-mute').addEventListener('change', (e) => {
    state = updateState({ muted: e.target.checked });
  });
  $('#toggle-deer').addEventListener('change', (e) => {
    state = updateState({ deerFocus: e.target.checked });
  });
  $('#btn-save-pin').addEventListener('click', () => {
    const val = $('#new-pin').value.trim();
    if (!/^\d{4}$/.test(val)) {
      alert('請輸入 4 位數字 PIN');
      return;
    }
    state = updateState({ pin: val });
    $('#new-pin').value = '';
    alert('PIN 已更新');
  });
  $('#btn-reset-stars').addEventListener('click', () => {
    if (confirm('確定重設全部星星同 AEON 幣進度？')) {
      state = resetStars();
      renderParentPanel();
      refreshStarUI();
    }
  });
}

function buildPinPad() {
  const pad = $('#pin-pad');
  pad.innerHTML = '';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '清空', '0', '⌫'];
  keys.forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = key;
    btn.addEventListener('click', () => onPinKey(key));
    pad.appendChild(btn);
  });
  renderPinDisplay();
}

function renderPinDisplay() {
  const row = $('#pin-display');
  row.innerHTML = '';
  for (let i = 0; i < 4; i += 1) {
    const box = document.createElement('div');
    box.className = 'pin-digit';
    box.textContent = pinBuffer[i] ? '•' : '';
    row.appendChild(box);
  }
}

function onPinKey(key) {
  $('#pin-error').textContent = '';
  if (key === '清空') {
    pinBuffer = '';
    renderPinDisplay();
    return;
  }
  if (key === '⌫') {
    pinBuffer = pinBuffer.slice(0, -1);
    renderPinDisplay();
    return;
  }
  if (pinBuffer.length >= 4) return;
  pinBuffer += key;
  renderPinDisplay();
  if (pinBuffer.length === 4) {
    state = loadState();
    if (pinBuffer === state.pin) {
      closePinModal();
      openParentPanel();
    } else {
      $('#pin-error').textContent = 'PIN 唔啱，再試吓';
      pinBuffer = '';
      setTimeout(() => renderPinDisplay(), 280);
    }
  }
}

function openPinModal() {
  pinBuffer = '';
  $('#pin-error').textContent = '';
  renderPinDisplay();
  $('#modal-pin').classList.add('open');
}

function closePinModal() {
  $('#modal-pin').classList.remove('open');
  pinBuffer = '';
}

function openParentPanel() {
  renderParentPanel();
  $('#modal-parent').classList.add('open');
}

function renderParentPanel() {
  state = loadState();
  const coins = redeemableCoins(state.totalStars);
  $('#parent-coin-banner').innerHTML =
    `<strong>10 粒星星 = 1 枚 AEON 幣</strong><br />而家可換 <strong>${coins}</strong> 枚（爸爸媽媽現實兌換）`;
  $('#parent-stars-today').textContent = `${state.starsToday} / 10`;
  $('#parent-total-stars').textContent = String(state.totalStars);
  $('#parent-coins').textContent = String(coins);
  $('#toggle-mute').checked = !!state.muted;
  $('#toggle-deer').checked = state.deerFocus !== false;

  const box = $('#word-toggles');
  box.innerHTML = '';
  const enabled = new Set(
    state.enabledWordIds && state.enabledWordIds.length
      ? state.enabledWordIds
      : WORDS.map((w) => w.id),
  );

  WORDS.forEach((w) => {
    const label = document.createElement('label');
    label.className = 'word-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = enabled.has(w.id);
    input.addEventListener('change', () => {
      const current = loadState();
      let ids =
        current.enabledWordIds && current.enabledWordIds.length
          ? [...current.enabledWordIds]
          : WORDS.map((x) => x.id);
      if (input.checked) {
        if (!ids.includes(w.id)) ids.push(w.id);
      } else {
        ids = ids.filter((id) => id !== w.id);
      }
      if (ids.length < 2) {
        input.checked = true;
        alert('最少要留兩個字詞先玩得');
        return;
      }
      state = updateState({ enabledWordIds: ids });
    });
    label.appendChild(input);
    label.appendChild(document.createTextNode(w.term));
    box.appendChild(label);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();

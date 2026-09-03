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

const cover = (e) => (window.KakaEmojiArt ? window.KakaEmojiArt.html(e) : e);
const { WORDS, DEER_IDS, TOPICS, wordIllustHtml, getTopicById, wordsForTopic, oppositePairWords, getOppositeWord, getWordById } = window.KakaWords;
const {
  COIN_MODES,
  coinsTodayMap,
  coinsTodayCount,
  earnCoinForMode,
  loadRoundProgress,
  saveRoundProgress,
  clearRoundProgress,
  recordWordResult,
  isWordMastered,
  summarizeMastery,
  loadState,
  updateState,
  tryEarnStar,
  redeemableCoins,
  todayKey,
  PROFILES,
  PROFILE_IDS,
  setActiveProfile,
  getActiveProfile,
  markTopicPassed,
  isTopicPassed,
  isKeyPassed,
  coinHistory,
} = window.KakaStorage;
const {
  warmVoices,
  warmAudio,
  speakTerm,
  speakChar,
  speakThen,
  speakCorrectFeedback,
  speakWordThenEncourage,
  speakRetryFeedback,
  playCorrectCue,
  playTryAgainCue,
  playStarCue,
  playCoinHintCue,
  estimateSpeakMs,
} = window.KakaSpeech;

function wordSpeakText(word) {
  if (!word) return '';
  if (typeof word === 'string') return word;
  return word.say || word.term;
}

/** @type {ReturnType<typeof loadState>} */
let state = loadState();
let listenRound = null;
let matchRound = null;
let buildRound = null;
let busy = false;
/** @type {string|null} */
let buildSelectedKey = null;
let buildDrag = null;
/** @type {string|null} */
let activeTopicId = null;
/** @type {{ id: string, title: string, wordIds: string[] }|null} 紅橙輯入面揀咗邊本書 */
let activeBook = null;
/** @type {ReturnType<typeof wordsForTopic>} */
let learnWords = [];
/** @type {{ left: object, right: object }[]} */
let learnPairs = [];
let learnIndex = 0;
/** 相反位置學習頁用成對模式 */
let learnPairMode = false;
/** 已經睇完最後一張：之後「去玩玩」要留低，即使誤撳「再睇一次」 */
let learnPassedOnce = false;
/** 今輪玩法：listen / match / build */
let playMode = null;
/** 今輪答啱嘅字 id（unique；答錯唔計、唔清零） */
const playWonIds = new Set();
/** 聽一聽／配一配：最多 8 個 unique 字；主題少過 8 就全清 */
const LISTEN_MATCH_CAP = 8;
/** 砌一砌：最多 10 個 unique 字；主題少過 10 就全清 */
const BUILD_CAP = 10;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function init() {
  try {
    // 先套用家長揀咗嘅聲，再暖機，唔係第一句會用返自動揀嗰把
    KakaSpeech.setPreferredVoiceURI?.(loadState().voiceURI || null);
    warmVoices();
    bindHome();
    bindTopics();
    bindLearn();
    bindPlayPick();
    bindListen();
    bindMatch();
    bindBuild();
    bindPlayFinish();
    bindProfiles();
    bindStarInfo();
    refreshStarUI();
    refreshProfileChrome();
    closeAllModals();
  } catch (err) {
    console.error('KakaLearn init failed', err);
  }
}

function closeAllModals() {
  ['#modal-stars'].forEach((sel) => {
    $(sel)?.classList.remove('open');
  });
  hidePlayFinish();
}

function playRoundCap() {
  return playMode === 'build' ? BUILD_CAP : LISTEN_MATCH_CAP;
}

/** 今輪目標：min(上限, 而家主題／書嘅字數) */
function playRoundTarget() {
  const n = enabledWords().length;
  return Math.max(1, Math.min(playRoundCap(), n));
}

function resetPlayRoundProgress() {
  playWonIds.clear();
}

/** 未完成輪次嘅 key：玩法 + 主題 + 書。換主題唔會攞錯進度。 */
function roundKey(mode = playMode) {
  return `${mode}|${activeTopicId || ''}|${activeBook ? activeBook.id : ''}`;
}

function beginPlayRound(mode) {
  playMode = mode;
  resetPlayRoundProgress();
  // 中途走咗返嚟，今輪進度仲喺度（同一日、同一個主題／書）
  const valid = new Set(enabledWords().map((w) => w.id));
  loadRoundProgress(roundKey(mode)).forEach((id) => {
    if (valid.has(id)) playWonIds.add(id);
  });
  hidePlayFinish();
  refreshPlayRoundUI();
}

function refreshPlayRoundUI() {
  const label = `${playWonIds.size}/${playRoundTarget()}`;
  ['#listen-round-progress', '#match-round-progress', '#build-round-progress'].forEach((sel) => {
    const el = $(sel);
    if (el) el.textContent = label;
  });
}

function hidePlayFinish() {
  const el = $('#play-finish');
  if (el) el.hidden = true;
  busy = false;
}

function showPlayFinish() {
  busy = true;
  // 完成一輪 = 一個 AEON 幣；同一種玩法一日只派一次
  const coin = earnCoinForMode(playMode);
  state = coin.state;
  markTopicPassed(activeTopicId, activeBook ? activeBook.id : null);
  refreshStarUI();

  const el = $('#play-finish');
  if (el) el.hidden = false;
  const msg = $('#play-finish-msg');
  const line = coin.gained
    ? '今輪玩完喇！攞到一個 AEON 幣！'
    : '今輪玩完喇！你好叻呀！呢個玩法今日嘅幣已經攞咗，試下第二個玩法啦';
  if (msg) msg.textContent = line;
  showStarBurst();
  playStarCue({ muted: state.muted });
  if (coin.gained) playCoinHintCue({ muted: state.muted });
  speakTerm(coin.gained ? '今輪玩完喇！攞到一個 AEON 幣！' : '今輪玩完喇！你好叻呀！', {
    muted: state.muted,
    rate: 0.92,
    pitch: 1.08,
    delayMs: 180,
  });
}

function bindPlayFinish() {
  const again = $('#btn-play-again');
  if (again) {
    again.onclick = () => {
      hidePlayFinish();
      if (playMode === 'listen') startListenMode();
      else if (playMode === 'match') startMatchMode();
      else if (playMode === 'build') startBuildMode();
      else openPlayPick();
    };
  }
  const topics = $('#btn-play-topics');
  if (topics) {
    topics.onclick = () => {
      hidePlayFinish();
      playMode = null;
      resetPlayRoundProgress();
      if (activeBook) {
        const topic = getTopicById(activeTopicId);
        if (topic) {
          openBookPicker(topic);
          return;
        }
      }
      openTopics();
    };
  }
}

/** 答啱先記 unique 字；答錯唔計、唔清零。回傳係咪已經完一輪。 */
function notePlayCorrect(wordId) {
  if (wordId) {
    playWonIds.add(wordId);
    recordWordResult(wordId, true);
  }
  refreshPlayRoundUI();
  const leftover = enabledWords().filter((w) => !playWonIds.has(w.id));
  const done = playWonIds.size >= playRoundTarget() || leftover.length === 0;
  if (done) {
    clearRoundProgress(roundKey());
  } else {
    saveRoundProgress(roundKey(), playWonIds);
  }
  return done;
}

function afterPlayCorrect(wordId, nextRoundFn, nextMs) {
  const roundDone = notePlayCorrect(wordId);
  awardStar().then(() => {
    if (roundDone) {
      setTimeout(() => showPlayFinish(), nextMs);
    } else {
      setTimeout(() => nextRoundFn(), nextMs);
    }
  });
}

function startListenMode(ev) {
  if (ev) ev.preventDefault();
  if (!activeTopicId) {
    showScreen('topics');
    return;
  }
  closeAllModals();
  beginPlayRound('listen');
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
  beginPlayRound('match');
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
  beginPlayRound('build');
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
    playRoundTarget,
    playRoundCap,
    getPlayProgress: () => ({
      mode: playMode,
      won: [...playWonIds],
      target: playRoundTarget(),
      busy,
    }),
    getLearnProgress: () => ({
      index: learnIndex,
      length: learnDeckLength(),
      passedOnce: learnPassedOnce,
      finishHidden: Boolean($('#learn-finish-row')?.hidden),
    }),
  });

  $('#btn-home-progress')?.addEventListener('click', () => openProgress());
  $('#btn-switch-profile')?.addEventListener('click', () => openProfilePick());
  $('#home-profile-chip')?.addEventListener('click', () => openProgress());
}

function bindTopics() {
  const back = $('#btn-back-topics');
  if (back) back.onclick = () => showScreen('home');
  const backBooks = $('#btn-back-books');
  if (backBooks) backBooks.onclick = () => openTopics();
}

function bindLearn() {
  const back = $('#btn-back-learn');
  if (back) back.onclick = () => {
    if (activeBook) {
      const topic = getTopicById(activeTopicId);
      if (topic) openBookPicker(topic);
      return;
    }
    openTopics();
  };
  const stage = $('#learn-stage');
  if (stage) stage.onclick = () => speakCurrentLearn();
  const pairLeft = $('#learn-pair-left');
  const pairRight = $('#learn-pair-right');
  if (pairLeft) {
    pairLeft.onclick = () => {
      if (!learnPairMode || !learnPairs[learnIndex]) return;
      state = loadState();
      speakTerm(wordSpeakText(learnPairs[learnIndex].left), { muted: state.muted });
    };
  }
  if (pairRight) {
    pairRight.onclick = () => {
      if (!learnPairMode || !learnPairs[learnIndex]) return;
      state = loadState();
      speakTerm(wordSpeakText(learnPairs[learnIndex].right), { muted: loadState().muted });
    };
  }
  const prev = $('#btn-learn-prev');
  const next = $('#btn-learn-next');
  if (prev) prev.onclick = () => stepLearn(-1);
  if (next) next.onclick = () => stepLearn(1);
  const play = $('#btn-learn-play');
  if (play) play.onclick = () => openPlayPick();
}

function bindPlayPick() {
  const back = $('#btn-back-play');
  if (back) back.onclick = () => {
    if (activeBook) {
      openBook(activeBook.id);
      return;
    }
    openLearn(activeTopicId);
  };
  const listenBtn = $('#btn-mode-listen');
  const matchBtn = $('#btn-mode-match');
  const buildBtn = $('#btn-mode-build');
  if (listenBtn) listenBtn.onclick = startListenMode;
  if (matchBtn) matchBtn.onclick = startMatchMode;
  if (buildBtn) buildBtn.onclick = startBuildMode;
}

function showScreen(name) {
  hidePlayFinish();
  $$('.screen').forEach((el) => el.classList.remove('active'));
  const map = {
    profiles: '#screen-profiles',
    home: '#screen-home',
    progress: '#screen-progress',
    topics: '#screen-topics',
    books: '#screen-books',
    learn: '#screen-learn',
    play: '#screen-play',
    listen: '#screen-listen',
    match: '#screen-match',
    build: '#screen-build',
  };
  $(map[name])?.classList.add('active');
  if (['listen', 'match', 'build'].includes(name)) {
    window.KakaStarFx?.mountPlayScreen?.($(map[name]));
    refreshStarUI();
  } else {
    window.KakaStarFx?.hideRanger?.();
    if (name === 'home' || name === 'topics' || name === 'play' || name === 'progress') {
      refreshStarUI();
      refreshProfileChrome();
    }
  }
}

function openTopics() {
  activeBook = null;
  renderTopics();
  showScreen('topics');
  refreshStarUI();
}

/** 紅橙輯等主題入面再分書：顯示揀書頁 */
function openBookPicker(topic) {
  activeBook = null;
  const title = $('#books-topic-title');
  if (title) title.textContent = topic.title;
  const lead = $('#screen-books .section-lead');
  if (lead) {
    lead.textContent = topic.id === 'jobs'
      ? '揀一冊嚟溫習職業字詞'
      : topic.id === 'hk_food'
        ? '揀一冊嚟溫習港式味道'
        : '今日讀咗邊本書？揀返嗰本嚟溫習';
  }
  const grid = $('#book-grid');
  if (grid) {
    grid.innerHTML = '';
    const allCard = document.createElement('button');
    allCard.type = 'button';
    allCard.className = 'topic-card';
    allCard.innerHTML = `
      <span class="topic-cover" aria-hidden="true">🎲</span>
      <span class="topic-title">全部${topic.title}</span>
      ${topicPassBadge(isKeyPassed(topic.id))}
      <span class="topic-blurb">晒成輯 ${topic.wordIds.length} 個字詞</span>
    `;
    allCard.onclick = () => {
      activeBook = null;
      startLearn(topic, null);
    };
    grid.appendChild(allCard);
    topic.books.forEach((book) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-card';
      btn.innerHTML = `
        <span class="topic-cover" aria-hidden="true">${cover(book.cover || '📖')}</span>
        <span class="topic-title">${book.title}</span>
        ${topicPassBadge(isKeyPassed(topic.id, book.id))}
        <span class="topic-blurb">${book.wordIds.length} 個字詞</span>
      `;
      btn.onclick = () => openBook(book.id);
      grid.appendChild(btn);
    });
  }
  showScreen('books');
  refreshStarUI();
}

function openBook(bookId) {
  const topic = getTopicById(activeTopicId);
  const book = topic?.books?.find((b) => b.id === bookId);
  if (!book) return;
  activeBook = book;
  startLearn(topic, book);
}

function openLearn(topicId) {
  const topic = getTopicById(topicId);
  if (!topic) return;
  activeTopicId = topicId;
  activeBook = null;
  if (topic.books && topic.books.length) {
    openBookPicker(topic);
    return;
  }
  startLearn(topic, null);
}

function startLearn(topic, book) {
  state = loadState();
  const enabledIds =
    state.enabledWordIds && state.enabledWordIds.length
      ? state.enabledWordIds
      : WORDS.map((w) => w.id);
  const enabled = new Set(enabledIds);
  const sourceWords = book
    ? book.wordIds.map(getWordById).filter(Boolean)
    : wordsForTopic(topic.id);

  learnPairMode = topic.id === 'opposites';
  learnPairs = [];
  learnWords = sourceWords.filter((w) => enabled.has(w.id));
  if (learnWords.length < 1) learnWords = sourceWords;

  if (learnPairMode) {
    learnPairs = oppositePairWords(enabledIds);
    if (learnPairs.length < 1) learnPairs = oppositePairWords(null);
    learnPairs = shuffle(learnPairs);
    // 考試／其他模式仍用單字列表
    learnWords = learnPairs.flatMap((p) => [p.left, p.right]);
  } else {
    // 每次入主題都打亂順序，令卡卡更有新鮮感
    learnWords = shuffle(learnWords);
  }

  learnIndex = 0;
  learnPassedOnce = false;
  const title = $('#learn-topic-title');
  if (title) title.textContent = book ? `${topic.title}・${book.title}` : topic.title;
  const backBtn = $('#btn-back-learn');
  if (backBtn) backBtn.textContent = book ? '← 揀書' : '← 主題';
  const lead = $('#learn-lead');
  if (lead) {
    lead.textContent = learnPairMode
      ? '撳卡聽相反詞'
      : '撳卡聽廣東話';
  }
  renderLearnCard();
  showScreen('learn');
}

const TOPIC_GROUPS = [
  { id: 'starter', title: '今日好學', ids: ['colors', 'family', 'zoo', 'food', 'numbers'] },
  { id: 'life', title: '日常生活', ids: ['opposites', 'weather', 'nature', 'transport', 'body', 'emotions', 'senses', 'school', 'places', 'home', 'daily', 'fruit', 'veg', 'hk_food', 'jobs', 'clothes'] },
  { id: 'animals', title: '動物', ids: ['small_animals', 'bugs', 'ocean', 'dino'] },
  { id: 'books', title: '課本溫習', ids: ['red_series', 'orange_series'] },
];

function topicProgressHtml(topic) {
  const ids = topic.wordIds || [];
  if (!ids.length) return '';
  const stats = loadState().wordStats || {};
  const mastered = ids.filter((id) => isWordMastered(stats[id])).length;
  const ratio = mastered / ids.length;
  const lit = ratio >= 0.67 ? 3 : ratio >= 0.34 ? 2 : mastered > 0 ? 1 : 0;
  const dots = [0, 1, 2]
    .map((i) => `<span class="topic-dot${i < lit ? ' is-on' : ''}" aria-hidden="true"></span>`)
    .join('');
  return `<span class="topic-progress" aria-label="識咗 ${mastered}／${ids.length}">${dots}<span class="topic-progress-n">${mastered}/${ids.length}</span></span>`;
}

function topicPassBadge(passed) {
  return passed
    ? '<span class="topic-pass is-yes">已過</span>'
    : '<span class="topic-pass is-no">未過</span>';
}

function renderTopicCard(topic) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'topic-card';
  if (topic.id === 'red_series' || topic.id === 'orange_series') {
    btn.classList.add('topic-card-book');
  }
  const passed = isTopicPassed(topic);
  btn.innerHTML = `
      <span class="topic-cover" aria-hidden="true">${cover(topic.cover)}</span>
      <span class="topic-title">${topic.title}</span>
      ${topicPassBadge(passed)}
      ${topicProgressHtml(topic)}
    `;
  btn.onclick = () => openLearn(topic.id);
  return btn;
}

function renderTopics() {
  const grid = $('#topic-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const byId = new Map(TOPICS.map((t) => [t.id, t]));
  const used = new Set();
  TOPIC_GROUPS.forEach((group) => {
    const topics = group.ids.map((id) => byId.get(id)).filter(Boolean);
    if (!topics.length) return;
    topics.forEach((t) => used.add(t.id));
    const heading = document.createElement('h2');
    heading.className = 'topic-group-title';
    heading.textContent = group.title;
    grid.appendChild(heading);
    topics.forEach((topic) => grid.appendChild(renderTopicCard(topic)));
  });
  const leftover = TOPICS.filter((t) => !used.has(t.id));
  if (leftover.length) {
    leftover.forEach((topic) => grid.appendChild(renderTopicCard(topic)));
  }
}

function learnDeckLength() {
  return learnPairMode ? learnPairs.length : learnWords.length;
}

function updateLearnFinishRow(atEnd) {
  if (atEnd) learnPassedOnce = true;
  const finishRow = $('#learn-finish-row');
  const play = $('#btn-learn-play');
  if (finishRow) {
    finishRow.hidden = false;
    finishRow.classList.toggle('is-ready', learnPassedOnce);
  }
  if (play) play.textContent = learnPassedOnce ? '學完喇・去玩玩' : '去玩玩';
}

function renderLearnCard() {
  if (learnPairMode) {
    renderLearnPairCard();
    return;
  }

  const stage = $('#learn-stage');
  const pairStage = $('#learn-pair-stage');
  if (stage) stage.hidden = false;
  if (pairStage) pairStage.hidden = true;

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
  const atEnd = learnIndex >= learnWords.length - 1;
  if (prev) {
    prev.disabled = learnIndex <= 0;
    prev.textContent = '← 上一張';
  }
  if (next) {
    next.disabled = false;
    next.textContent = atEnd ? '再睇一次' : '下一張 →';
  }
  updateLearnFinishRow(atEnd);

  // Enlarge learn plate
  const plate = illust?.querySelector('.emoji-plate');
  if (plate) plate.classList.add('emoji-plate-lg');
  const face = illust?.querySelector('.emoji-face');
  if (face) face.classList.add('emoji-face-lg');

  speakCurrentLearn(true);
}

function renderLearnPairCard() {
  const stage = $('#learn-stage');
  const pairStage = $('#learn-pair-stage');
  if (stage) stage.hidden = true;
  if (pairStage) pairStage.hidden = false;

  const pair = learnPairs[learnIndex];
  if (!pair) return;

  const leftIllust = $('#learn-pair-left-illust');
  const rightIllust = $('#learn-pair-right-illust');
  const leftTerm = $('#learn-pair-left-term');
  const rightTerm = $('#learn-pair-right-term');
  const progress = $('#learn-progress');

  if (leftIllust) leftIllust.innerHTML = wordIllustHtml(pair.left);
  if (rightIllust) rightIllust.innerHTML = wordIllustHtml(pair.right);
  if (leftTerm) leftTerm.textContent = pair.left.term;
  if (rightTerm) rightTerm.textContent = pair.right.term;
  if (progress) progress.textContent = `${learnIndex + 1}/${learnPairs.length}`;

  const prev = $('#btn-learn-prev');
  const next = $('#btn-learn-next');
  const atEnd = learnIndex >= learnPairs.length - 1;
  if (prev) {
    prev.disabled = learnIndex <= 0;
    prev.textContent = '← 上一張';
  }
  if (next) {
    next.disabled = false;
    next.textContent = atEnd ? '再睇一次' : '下一對 →';
  }
  updateLearnFinishRow(atEnd);

  speakCurrentLearn(true);
}

/** 自動讀出：卡一載入就讀。
 *  家長可以喺設定熄（autoSpeak）。靜音仍然照跟。
 *  配一配／砌一砌都讀 —— 圖同淡色格本身已經表達咗個詞，讀出唔會多洩題，
 *  反而令 KAKA 聽住字音去認字形。 */
function autoSpeak(text, delayMs = 260) {
  const s = loadState();
  if (s.autoSpeak === false || s.muted) return;
  if (!text) return;
  setTimeout(() => speakTerm(text, { muted: loadState().muted }), delayMs);
}

function speakCurrentLearn(isAuto = false) {
  state = loadState();
  // 家長熄咗「自動讀出」只影響自動嗰次；撳卡永遠讀得到
  if (isAuto && state.autoSpeak === false) return;
  if (learnPairMode) {
    const pair = learnPairs[learnIndex];
    if (!pair) return;
    // 自動先讀左邊（大／多…），再讀右邊相反詞（speakThen 有時長後備）
    speakThen(wordSpeakText(pair.left), { muted: state.muted }, () => {
      speakTerm(wordSpeakText(pair.right), { muted: loadState().muted });
    });
    return;
  }
  const word = learnWords[learnIndex];
  if (!word) return;
  speakTerm(wordSpeakText(word), { muted: state.muted });
}

function stepLearn(delta) {
  if (learnPairMode) {
    if (!learnPairs.length) return;
    if (delta > 0 && learnIndex >= learnPairs.length - 1) {
      learnPairs = shuffle(learnPairs);
      learnWords = learnPairs.flatMap((p) => [p.left, p.right]);
      learnIndex = 0;
    } else {
      learnIndex = Math.max(0, Math.min(learnPairs.length - 1, learnIndex + delta));
    }
    renderLearnCard();
    return;
  }

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

function setPlayModeCopy(btnSel, title, blurb) {
  const btn = $(btnSel);
  if (!btn) return;
  const t = btn.querySelector('.play-mode-title');
  const b = btn.querySelector('.play-mode-blurb');
  if (t) t.textContent = title;
  if (b) b.textContent = blurb;
  btn.setAttribute('aria-label', `${title}，${blurb}`);
}

function openPlayPick() {
  const topic = getTopicById(activeTopicId);
  const title = $('#play-topic-title');
  const base = topic ? topic.title : '';
  const withBook = activeBook ? `${base}・${activeBook.title}` : base;
  if (title) title.textContent = withBook ? `${withBook}・去玩玩` : '去玩玩';
  if (activeTopicId === 'opposites') {
    setPlayModeCopy('#btn-mode-listen', '聽一聽', '聽下，揀相反');
    setPlayModeCopy('#btn-mode-match', '配一配', '睇圖，揀相反');
  } else {
    setPlayModeCopy('#btn-mode-listen', '聽一聽', '聽廣東話，揀漢字');
    setPlayModeCopy('#btn-mode-match', '配一配', '睇圖，揀漢字');
  }
  setPlayModeCopy('#btn-mode-build', '砌一砌', '用手砌漢字');
  showScreen('play');
  refreshStarUI();
}

function enabledWords() {
  state = loadState();
  const ids = state.enabledWordIds;
  let list = !ids || !ids.length ? [...WORDS] : WORDS.filter((w) => ids.includes(w.id));
  if (activeBook) {
    const bookSet = new Set(activeBook.wordIds);
    list = list.filter((w) => bookSet.has(w.id));
    if (list.length < 2) list = activeBook.wordIds.map(getWordById).filter(Boolean);
  } else if (activeTopicId) {
    const topicSet = new Set(wordsForTopic(activeTopicId).map((w) => w.id));
    list = list.filter((w) => topicSet.has(w.id));
  }
  if (list.length < 2) {
    list = activeTopicId ? wordsForTopic(activeTopicId) : [...WORDS];
  }
  if (list.length < 2) list = [...WORDS];
  return list;
}

/** 抽題：優先未答啱過嘅字；掌握度加權；鹿類可加權 */
function masteryWeight(wordId) {
  const stats = (loadState().wordStats || {})[wordId];
  const streak = stats ? stats.streak || 0 : 0;
  if (streak <= 0) return 8;
  if (streak === 1) return 4;
  if (streak === 2) return 2;
  return 1;
}

function pickTarget(pool) {
  let source = pool;
  const leftover = pool.filter((w) => !playWonIds.has(w.id));
  if (leftover.length) source = leftover;
  state = loadState();
  const weighted = [];
  source.forEach((w) => {
    let weight = masteryWeight(w.id);
    if (state.deerFocus && (w.isDeer || DEER_IDS.includes(w.id))) weight *= 2;
    const copies = Math.max(1, Math.round(weight));
    for (let i = 0; i < copies; i += 1) weighted.push(w);
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

/** 相反位置考試：出題字 + 正確答案係其相反詞；選項只有成對兩個 */
function buildOppositeQuiz(pool) {
  const candidates = pool.filter((w) => {
    const opp = getOppositeWord(w.id);
    return opp && pool.some((p) => p.id === opp.id);
  });
  const unused = candidates.filter((w) => !playWonIds.has(w.id));
  const source = unused.length ? unused : (candidates.length ? candidates : pool);
  const prompt = pickTarget(source);
  const answer = getOppositeWord(prompt.id);
  if (!answer) return null;
  return {
    pickOpposite: true,
    prompt,
    answer,
    // 沿用 target = 正確要揀嘅字（相反詞）
    target: answer,
    options: shuffle([prompt, answer]),
  };
}

/* ---------- 模式 A：聽音選卡 ---------- */

function bindListen() {
  const speak = $('#btn-speak-listen');
  if (speak) {
    speak.onclick = () => {
      if (!listenRound) return;
      const spoken = listenRound.prompt || listenRound.target;
      speakTerm(wordSpeakText(spoken), { muted: loadState().muted });
    };
  }
  const back = $('#btn-back-listen');
  if (back) back.onclick = () => openPlayPick();
}

function startListenRound() {
  busy = false;
  refreshPlayRoundUI();
  const pool = enabledWords();
  let round;
  if (activeTopicId === 'opposites') {
    round = buildOppositeQuiz(pool);
  }
  if (!round) {
    const target = pickTarget(pool);
    const optionCount = Math.min(4, pool.length);
    const options = shuffle([target, ...sampleOthers(pool, target.id, optionCount - 1)]);
    round = { pickOpposite: false, prompt: target, target, options };
  }
  listenRound = round;

  const promptText = $('#listen-prompt-text');
  if (promptText) {
    promptText.innerHTML = round.pickOpposite
      ? '聽下，揀相反'
      : '聽下，揀個字';
  }

  const feedback = $('#listen-feedback');
  feedback.textContent = '';
  feedback.className = 'feedback';

  const grid = $('#listen-options');
  grid.innerHTML = '';
  grid.classList.toggle('cols-2', !!round.pickOpposite);
  grid.classList.toggle('cols-3', !round.pickOpposite);
  round.options.forEach((word) => {
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
  const spoken = round.prompt || round.target;
  setTimeout(() => speakTerm(wordSpeakText(spoken), { muted: loadState().muted }), 280);
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
  const answerTerm = wordSpeakText(listenRound.target);
  const promptTerm = wordSpeakText(listenRound.prompt || listenRound.target);

  if (correct) {
    busy = true;
    flipListenCard(btn, true);
    btn.classList.add('correct');
    warmAudio();
    const fb = $('#listen-feedback');
    const nextMs = 2800;
    if (listenRound.pickOpposite) {
      const praise = speakWordThenEncourage(answerTerm, { muted: state.muted });
      fb.textContent = `${promptTerm} 嘅相反係 ${answerTerm}！${praise}`;
      fb.className = 'feedback ok';
      afterPlayCorrect((listenRound.prompt || listenRound.target).id, () => startListenRound(), estimateSpeakMs(`${answerTerm}。${praise}`, { rate: 0.92, delayMs: 80 }) + 500);
    } else {
      playCorrectCue({ muted: state.muted });
      const praise = speakCorrectFeedback({ muted: state.muted });
      fb.textContent = praise;
      fb.className = 'feedback ok';
      afterPlayCorrect((listenRound.prompt || listenRound.target).id, () => startListenRound(), nextMs);
    }
  } else {
    recordWordResult(id, false);
    // 錯咗都翻一吓睇圖，跟住翻返去——唔好長期露圖，避免靠淘汰答
    flipListenCard(btn, false);
    btn.classList.add('wrong');
    playTryAgainCue({ muted: state.muted });
    const fb = $('#listen-feedback');
    fb.className = 'feedback retry';
    setTimeout(() => btn.classList.remove('wrong'), 450);
    // 鼓勵句講完先再讀題目（相反詞唔好讀出要揀嗰個答案）
    const retryLine = speakRetryFeedback({
      muted: state.muted,
      onEnd: () => {
        setTimeout(() => speakTerm(promptTerm, { muted: loadState().muted }), 250);
      },
    });
    fb.textContent = retryLine;
  }
}

/* ---------- 模式 B：配一配 ---------- */

function bindMatch() {
  const back = $('#btn-back-match');
  if (back) back.onclick = () => openPlayPick();
}

function startMatchRound() {
  busy = false;
  refreshPlayRoundUI();
  const pool = enabledWords();
  let round;
  if (activeTopicId === 'opposites') {
    round = buildOppositeQuiz(pool);
  }
  if (!round) {
    const target = pickTarget(pool);
    const optionCount = Math.min(4, pool.length);
    const options = shuffle([target, ...sampleOthers(pool, target.id, optionCount - 1)]);
    round = { pickOpposite: false, prompt: target, target, options };
  }
  matchRound = round;

  const promptText = $('#match-prompt-text');
  if (promptText) {
    promptText.innerHTML = round.pickOpposite
      ? '睇圖，揀相反'
      : '睇圖，揀個字';
  }

  const fb = $('#match-feedback');
  fb.textContent = '';
  fb.className = 'feedback';

  const shown = round.prompt || round.target;
  const stage = $('#match-stage');
  if (stage) {
    stage.innerHTML = wordIllustHtml(shown);
    const plate = stage.querySelector('.emoji-plate');
    if (plate) plate.classList.add('emoji-plate-lg');
    const face = stage.querySelector('.emoji-face');
    if (face) face.classList.add('emoji-face-lg');
  }

  const grid = $('#match-options');
  grid.innerHTML = '';
  grid.classList.toggle('cols-2', !!round.pickOpposite);
  grid.classList.toggle('cols-3', !round.pickOpposite);
  round.options.forEach((word) => {
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
  autoSpeak(wordSpeakText(round.prompt || round.target));
}

function onMatchPick(id, btn) {
  if (busy || !matchRound) return;
  state = loadState();
  const correct = id === matchRound.target.id;
  const answerTerm = wordSpeakText(matchRound.target);
  const promptTerm = wordSpeakText(matchRound.prompt || matchRound.target);

  if (correct) {
    busy = true;
    btn.classList.add('correct');
    warmAudio();
    const fb = $('#match-feedback');
    // 一次過讀正確答案（相反詞）+ 鼓勵
    const praise = speakWordThenEncourage(answerTerm, { muted: state.muted });
    if (fb) {
      fb.textContent = matchRound.pickOpposite
        ? `${promptTerm} 嘅相反係 ${answerTerm}！${praise}`
        : praise;
      fb.className = 'feedback ok';
    }
    const nextMs = estimateSpeakMs(`${answerTerm}。${praise}`, { rate: 0.92, delayMs: 80 }) + 500;
    afterPlayCorrect((matchRound.prompt || matchRound.target).id, () => startMatchRound(), nextMs);
  } else {
    recordWordResult(id, false);
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
  const speak = $('#btn-speak-build');
  if (speak) {
    speak.onclick = () => {
      if (!buildRound) return;
      state = loadState();
      speakTerm(wordSpeakText(buildRound.target), { muted: state.muted });
    };
  }
}

function startBuildRound() {
  busy = false;
  refreshPlayRoundUI();
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
    fb.textContent = '';
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
  autoSpeak(wordSpeakText(target));
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
  warmAudio();
  const used = buildRound.filled.some((f) => f && f.key === key);
  if (used) return;
  const next = nextBuildIndex();
  if (next < 0) return;
  // 撳一下即入下一格並讀字，唔使再撳格（iPad 先有手勢出聲）
  tryPlaceBuildChar(key, next);
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
        fb.textContent = '';
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
    recordWordResult(buildRound.target.id, false);
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

  warmAudio();
  if (buildRound.filled.every(Boolean)) {
    finishBuildSuccess();
  } else {
    // 拖或撳入格：同一下手勢即刻讀呢個字（唔好 setTimeout，iPad 會冇聲）
    speakChar(expected, { muted: state.muted });
    const fb = $('#build-feedback');
    if (fb) {
      fb.textContent = expected;
      fb.className = 'feedback ok';
    }
  }
  return true;
}

function finishBuildSuccess() {
  if (!buildRound) return;
  busy = true;
  state = loadState();
  // 手指手勢入面喚醒 Web Audio，之後叮聲先唔會被 iPad 靜音
  warmAudio();
  const term = buildRound.target.term;
  const termText = wordSpeakText(buildRound.target);
  const chars = termChars(term);
  const lastChar = chars[chars.length - 1] || '';
  const spoken = chars.length > 1 ? `${lastChar}。${termText}` : termText;
  const fb = $('#build-feedback');
  const praise = speakWordThenEncourage(spoken, { muted: state.muted });
  if (fb) {
    fb.textContent = praise;
    fb.className = 'feedback ok';
  }
  const nextMs = estimateSpeakMs(`${spoken}。${praise}`, { rate: 0.92, delayMs: 80 }) + 500;
  afterPlayCorrect(buildRound.target.id, () => startBuildRound(), nextMs);
}

function onBuildPointerDown(ev, tile, onDragStarted) {
  if (busy || !buildRound || ev.button === 2) return;
  warmAudio();
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
  if (result.gained) {
    playStarCue({ muted: state.muted });
    // 粒星由圖卡飛去進度條，落地先亮 —— 令 KAKA 見到「我做啱 → 我近咗」
    await new Promise((resolve) => flyStarToBar(() => {
      refreshStarUI();
      resolve();
    }));
  } else {
    refreshStarUI();
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
  // 主頁嗰兩行文字同條 bar 講緊同一件事，改為只留條 bar（見 renderStarBars）
  const coins = redeemableCoins();
  const todayEl = $('#stars-today-label');
  const coinsEl = $('#coins-label');
  const left = Math.max(0, 3 - coinsTodayCount());
  if (todayEl) todayEl.textContent = left ? `今日仲可以賺 ${left} 個幣` : '今日三個幣都攞晒喇';
  if (coinsEl) coinsEl.textContent = `累積 ${coins} 枚 AEON 幣`;
  $$('.stars-today-inline').forEach((el) => {
    el.textContent = left ? `今日仲可以賺 ${left} 個幣` : '今日幣滿喇';
  });
  renderStarBars();
}

/**
 * 十格星星條：每答啱一題亮一粒，滿 10 粒 = 1 枚 AEON 幣。
 *
 * 點解係「格仔」而唔係百分比橫條：KAKA 未讀得明比例，但數得到星星。
 * 條 bar 會自動插入每個 `.star-panel`（主頁、揀主題…）同每個 `.game-header`
 * （聽一聽／配一配／砌一砌），咁樣攞星星嗰刻就即刻見到條 bar 亮多一粒。
 * 用 JS 插入而唔係喺 index.html 寫十幾次，係為咗將來加新畫面唔使記住補返。
 */
const MODE_LABEL = { listen: '聽一聽', match: '配一配', build: '砌一砌' };

/**
 * 獎勵顯示（2026-08 新規則）。同一條 `.star-bar` 兩個樣：
 *
 * - **遊戲畫面**：今輪進度（8 或 10 格）→ 一個幣。一條進度、一個目標。
 * - **其他畫面**：今日三個幣位（聽／配／砌），下面寫住下一個嘅進度。
 *
 * 點解分開：4 歲玩緊嗰陣只需要知「仲差幾題就有幣」；喺主頁先需要知
 * 「今日仲有幾多個幣未攞」。溝埋一齊就係之前嗰個「今日 1/10 + 可換 3 枚」
 * 兩段訊息打交嘅問題。
 */
function renderStarBars() {
  const coins = coinsTodayMap();
  const hosts = [...$$('.star-panel'), ...$$('.game-header')];

  hosts.forEach((host) => {
    const screenId = host.closest('.screen')?.id || '';
    const mode = { 'screen-listen': 'listen', 'screen-match': 'match', 'screen-build': 'build' }[screenId];
    let bar = host.querySelector('.star-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'star-bar';
      bar.setAttribute('role', 'img');
      if (host.classList.contains('game-header')) bar.classList.add('star-bar-compact');
      host.querySelector('.stars-today-inline')?.closest('.star-meta')?.classList.add('is-replaced');
      host.querySelector('#stars-today-label')?.closest('.star-meta')?.classList.add('is-replaced');
      host.appendChild(bar);
    }

    if (mode) renderRoundBar(bar, mode, coins);
    else renderCoinBar(bar, coins);
  });
}

/** 遊戲畫面：今輪進度 → 幣 */
function renderRoundBar(bar, mode, coins) {
  const target = playRoundTarget();
  const won = playWonIds.size;
  bar.classList.add('star-bar-round');
  bar.classList.remove('star-bar-coins-row');

  let stars = bar.querySelector('.star-bar-stars');
  if (!stars || Number(bar.dataset.cells) !== target) {
    bar.innerHTML = '';
    stars = document.createElement('span');
    stars.className = 'star-bar-stars';
    for (let i = 0; i < target; i += 1) {
      const cell = document.createElement('span');
      cell.className = 'star-cell';
      cell.textContent = '★';
      stars.appendChild(cell);
    }
    bar.appendChild(stars);
    const arrow = document.createElement('span');
    arrow.className = 'star-bar-arrow';
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');
    bar.appendChild(arrow);
    const chip = document.createElement('span');
    chip.className = 'coin-chip';
    // 怪獸守住個幣：進度條就係佢嘅血。答啱射中一下，打完先攞到幣。
    // 刻意細、企邊位、答緊題唔郁 —— 呢個係認字 app，怪獸唔可以搶走漢字嘅注意力。
    chip.innerHTML =
      '<span class="coin-face" aria-hidden="true">$</span>' +
      '<img class="coin-monster" src="./assets/openmoji/1F47E.svg" alt="" aria-hidden="true" decoding="async" />';
    bar.appendChild(chip);
    const hint = document.createElement('span');
    hint.className = 'star-bar-hint';
    bar.appendChild(hint);
    bar.dataset.cells = String(target);
  }

  let newHit = false;
  bar.querySelectorAll('.star-cell').forEach((cell, i) => {
    const on = i < won;
    const was = cell.classList.contains('is-on');
    cell.classList.toggle('is-on', on);
    if (on && !was) {
      cell.classList.remove('just-lit');
      void cell.offsetWidth;
      cell.classList.add('just-lit');
      newHit = true;
    }
  });

  const monster = bar.querySelector('.coin-monster');
  if (monster && newHit) {
    monster.classList.remove('is-hit');
    void monster.offsetWidth;
    monster.classList.add('is-hit');
  }

  const done = won >= target;
  const chip = bar.querySelector('.coin-chip');
  if (chip) {
    const wasFull = chip.classList.contains('is-full');
    chip.classList.toggle('is-full', done || !!coins[mode]);
    // 打完／今日已經攞咗幣：怪獸唔喺度
    chip.classList.toggle('is-cleared', done || !!coins[mode]);
    if (done && !wasFull) {
      const m = chip.querySelector('.coin-monster');
      if (m) {
        m.classList.remove('is-defeated');
        void m.offsetWidth;
        m.classList.add('is-defeated');
      }
    }
    if (done && !wasFull) {
      chip.classList.remove('just-earned');
      void chip.offsetWidth;
      chip.classList.add('just-earned');
    }
  }
  const hint = bar.querySelector('.star-bar-hint');
  if (hint) {
    hint.textContent = coins[mode] && !done
      ? '今日呢隻怪獸打贏咗喇'
      : done
        ? '打贏喇！攞到一個幣'
        : `仲差 ${target - won} 下`;
  }
  bar.setAttribute('aria-label', `今輪 ${won} / ${target}，完成就有一個 AEON 幣`);
}

/** 主頁／揀主題／學習頁：今日三個幣位 + 下一個嘅進度 */
function renderCoinBar(bar, coins) {
  bar.classList.add('star-bar-coins-row');
  // 幣位取代咗星星，panel 左邊嗰粒 ★ icon 就變咗多餘
  bar.closest('.star-panel')?.querySelector('.star-icon')?.classList.add('is-replaced');
  bar.classList.remove('star-bar-round');
  delete bar.dataset.cells;

  const got = coinsTodayCount();
  const next = nextRoundHint(coins);
  bar.innerHTML =
    COIN_MODES.map(
      (m) =>
        `<span class="coin-slot${coins[m] ? ' is-earned' : ''}">` +
        `<span class="coin-face" aria-hidden="true">$</span>` +
        `<span class="coin-slot-label">${MODE_LABEL[m]}</span></span>`,
    ).join('') + `<span class="star-bar-hint">${next}</span>`;
  bar.setAttribute('aria-label', `今日賺咗 ${got} 個 AEON 幣（每種玩法一個）`);
}

/** 下一個幣嘅進度：揀第一個未賺幣、而且有未完成進度嘅玩法 */
function nextRoundHint(coins) {
  const pending = COIN_MODES.filter((m) => !coins[m]);
  if (!pending.length) return '今日三個幣都攞晒喇！';
  for (const m of pending) {
    const saved = loadRoundProgress(`${m}|${activeTopicId || ''}|${activeBook ? activeBook.id : ''}`);
    if (saved.length) {
      const cap = m === 'build' ? BUILD_CAP : LISTEN_MATCH_CAP;
      return `下一個：${MODE_LABEL[m]} ${saved.length}/${cap}`;
    }
  }
  return `今日仲可以賺 ${pending.length} 個幣`;
}

/** 答啱嗰粒星由太空戰士射去進度條下一格，落地先亮。 */
function flyStarToBar(onLanded) {
  const screen = $('.screen.active');
  if (window.KakaStarFx?.flyStarFromRanger) {
    window.KakaStarFx.mountPlayScreen?.(screen);
    window.KakaStarFx.flyStarFromRanger(screen, onLanded);
    return;
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const bar = screen?.querySelector('.star-bar');
  const target = bar?.querySelector('.star-cell:not(.is-on)');
  const from = screen?.querySelector('.space-ranger, .emoji-plate, .build-slots, .match-stage');
  if (reduce || !target || !from || typeof from.animate !== 'function') {
    onLanded();
    return;
  }
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const star = document.createElement('div');
  star.className = 'fly-star';
  star.textContent = '★';
  star.setAttribute('aria-hidden', 'true');
  star.style.left = `${a.left + a.width / 2}px`;
  star.style.top = `${a.top + a.height / 2}px`;
  document.body.appendChild(star);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = star.animate(
    [
      { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1.35)', opacity: 1, offset: 0.18 },
      { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy * 0.5 - 40}px)) scale(1.1)`, opacity: 1, offset: 0.6 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.5)`, opacity: 0.9 },
    ],
    { duration: 1050, easing: 'cubic-bezier(.22,.75,.28,1)' },
  );
  let landed = false;
  const land = () => {
    if (landed) return;
    landed = true;
    star.remove();
    onLanded();
  };
  anim.onfinish = land;
  setTimeout(land, 1200); // 後備：動畫唔跑都要亮返粒星
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
  $('#info-stars-today').textContent = `${coinsTodayCount()} / 3 個幣`;
  $('#info-total-stars').textContent = String(state.totalStars);
  $('#info-coins').textContent = `${redeemableCoins()} 枚`;
  $('#modal-stars').classList.add('open');
  playCoinHintCue({ muted: state.muted });
}

/* ---------- 小朋友 Profile ---------- */

function bindProfiles() {
  PROFILE_IDS.forEach((id) => {
    $(`#btn-profile-${id}`)?.addEventListener('click', () => selectProfile(id));
  });
  $('#btn-back-progress')?.addEventListener('click', () => showScreen('home'));
  $('#btn-progress-switch')?.addEventListener('click', () => openProfilePick());
}

function refreshProfileChrome() {
  const info = getActiveProfile() || PROFILES.kaka;
  const nameEl = $('#home-profile-name');
  const imgEl = $('#home-profile-avatar');
  if (nameEl) nameEl.textContent = info.name;
  if (imgEl) imgEl.src = info.avatar;
}

function openProfilePick() {
  closeAllModals();
  playMode = null;
  resetPlayRoundProgress();
  showScreen('profiles');
}

function selectProfile(id) {
  if (!PROFILE_IDS.includes(id)) return;
  setActiveProfile(id);
  try {
    window.KakaMathStorage?.setActiveProfile?.(id);
  } catch {
    /* 數理掛咗都唔影響認字 */
  }
  state = loadState();
  playMode = null;
  resetPlayRoundProgress();
  activeTopicId = null;
  activeBook = null;
  KakaSpeech.setPreferredVoiceURI?.(state.voiceURI || null);
  refreshProfileChrome();
  refreshStarUI();
  showScreen('home');
}

function openProgress() {
  renderProgress();
  showScreen('progress');
}

function weekdayLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map((n) => parseInt(n, 10));
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  return names[new Date(y, m - 1, d).getDay()];
}

function renderProgress() {
  const info = getActiveProfile() || PROFILES.kaka;
  const who = $('#progress-who');
  const title = $('#progress-title');
  const avatar = $('#progress-avatar');
  if (who) who.textContent = info.name;
  if (title) title.textContent = `${info.name}嘅進度`;
  if (avatar) avatar.src = info.avatar;

  const todayN = coinsTodayCount();
  const todayEl = $('#progress-coin-today');
  if (todayEl) todayEl.textContent = `今日 ${todayN} 個幣 · 累積 ${redeemableCoins()} 枚`;

  const cal = $('#progress-coin-cal');
  if (cal) {
    cal.innerHTML = '';
    coinHistory(14).forEach((day) => {
      const cell = document.createElement('div');
      cell.className = 'coin-cal-day' + (day.isToday ? ' is-today' : '');
      cell.innerHTML = `<span class="coin-cal-n">${day.count}</span><span class="coin-cal-d">${weekdayLabel(day.date)}</span>`;
      cal.appendChild(cell);
    });
  }

  const needEl = $('#progress-need');
  if (needEl) {
    needEl.innerHTML = '';
    const mastery = summarizeMastery(WORDS.map((w) => w.id));
    if (!mastery.needPractice.length) {
      const li = document.createElement('li');
      li.className = 'is-empty';
      li.textContent = '而家冇要練嘅字，去玩玩啦';
      needEl.appendChild(li);
    } else {
      mastery.needPractice.forEach((item) => {
        const word = getWordById(item.id);
        const li = document.createElement('li');
        li.textContent = word ? `${word.term} · 再練` : item.id;
        needEl.appendChild(li);
      });
    }
  }

  const grid = $('#progress-topic-grid');
  if (grid) {
    grid.innerHTML = '';
    const byId = new Map(TOPICS.map((t) => [t.id, t]));
    TOPIC_GROUPS.forEach((group) => {
      const topics = group.ids.map((id) => byId.get(id)).filter(Boolean);
      if (!topics.length) return;
      const heading = document.createElement('h2');
      heading.className = 'topic-group-title';
      heading.textContent = group.title;
      grid.appendChild(heading);
      topics.forEach((topic) => {
        const card = renderTopicCard(topic);
        grid.appendChild(card);
      });
    });
  }

  const mathList = $('#progress-math-list');
  const mathBlock = $('#progress-math-block');
  const mathApi = window.KakaMathStorage;
  const planets = window.KakaMathSkills?.MATH_PLANETS;
  if (mathList && mathApi && Array.isArray(planets)) {
    mathList.innerHTML = '';
    planets.forEach((p) => {
      const chip = document.createElement('span');
      chip.className = 'progress-math-chip';
      const lit = mathApi.isPlanetLit(p.id);
      chip.textContent = `${p.name} ${lit ? '已過' : '未過'}`;
      mathList.appendChild(chip);
    });
    if (mathBlock) mathBlock.hidden = false;
  } else if (mathBlock) {
    mathBlock.hidden = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();

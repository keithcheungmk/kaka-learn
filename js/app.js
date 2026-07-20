/* Classic script — no ES modules (works in sidebar / simple previews). */
const { WORDS, DEER_IDS } = window.KakaWords;
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
  playCorrectCue,
  playTryAgainCue,
  playStarCue,
  playCoinHintCue,
} = window.KakaSpeech;

const HERO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="helmet" cx="40%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#A5F3FC"/>
      <stop offset="55%" stop-color="#2DD4BF"/>
      <stop offset="100%" stop-color="#0F766E"/>
    </radialGradient>
    <linearGradient id="suit" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE68A"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="78" fill="none" stroke="#FDE68A" stroke-width="3" stroke-dasharray="8 10" opacity=".55"/>
  <ellipse cx="100" cy="148" rx="46" ry="18" fill="#7CFFB2" opacity=".25"/>
  <path d="M70 120c4-34 18-54 30-60 12 6 26 26 30 60" fill="#7CFFB2"/>
  <circle cx="100" cy="72" r="28" fill="url(#helmet)"/>
  <circle cx="100" cy="72" r="18" fill="#0B1D3A" opacity=".35"/>
  <circle cx="92" cy="70" r="3" fill="#0B1D3A"/>
  <circle cx="110" cy="70" r="3" fill="#0B1D3A"/>
  <path d="M84 56l-8-18 10 8M116 56l8-18-10 8" stroke="#FDE68A" stroke-width="4" stroke-linecap="round" fill="none"/>
  <rect x="78" y="118" width="44" height="36" rx="14" fill="url(#suit)"/>
  <circle cx="100" cy="136" r="8" fill="#0B1D3A" opacity=".25"/>
  <path d="M70 130c-16 4-22 18-10 22M130 130c16 4 22 18 10 22" fill="#5EEAD4"/>
  <circle cx="158" cy="48" r="6" fill="#FBBF24"/>
  <circle cx="40" cy="60" r="3" fill="#A5F3FC"/>
</svg>`;

/** @type {ReturnType<typeof loadState>} */
let state = loadState();
let pinBuffer = '';
let listenRound = null;
let matchRound = null;
let matchSelectedWordId = null;
let busy = false;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function init() {
  try {
    warmVoices();
    const hero = $('#hero-deer');
    if (hero) hero.innerHTML = HERO_SVG;
    bindHome();
    bindListen();
    bindMatch();
    bindParent();
    bindStarInfo();
    refreshStarUI();
    // Close any stuck overlays from a previous partial load
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
  closeAllModals();
  showScreen('listen');
  startListenRound();
}

function startMatchMode(ev) {
  if (ev) ev.preventDefault();
  closeAllModals();
  showScreen('match');
  startMatchRound();
}

function bindHome() {
  const listenBtn = $('#btn-mode-listen');
  const matchBtn = $('#btn-mode-match');
  // Prefer .onclick so we don't stack duplicate listeners on remount/preview refresh
  if (listenBtn) listenBtn.onclick = startListenMode;
  if (matchBtn) matchBtn.onclick = startMatchMode;
  const backListen = $('#btn-back-listen');
  const backMatch = $('#btn-back-match');
  if (backListen) backListen.onclick = () => showScreen('home');
  if (backMatch) backMatch.onclick = () => showScreen('home');

  window.KakaLearn = Object.assign(window.KakaLearn || {}, {
    startListen: startListenMode,
    startMatch: startMatchMode,
    goHome: () => showScreen('home'),
  });
}

function showScreen(name) {
  $$('.screen').forEach((el) => el.classList.remove('active'));
  const map = {
    home: '#screen-home',
    listen: '#screen-listen',
    match: '#screen-match',
  };
  $(map[name])?.classList.add('active');
  if (name === 'home') refreshStarUI();
}

function enabledWords() {
  state = loadState();
  const ids = state.enabledWordIds;
  let list = !ids || !ids.length ? [...WORDS] : WORDS.filter((w) => ids.includes(w.id));
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
  $('#btn-speak-listen').addEventListener('click', () => {
    if (!listenRound) return;
    speakTerm(listenRound.target.term, { muted: state.muted });
  });
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
    btn.className = 'word-card';
    btn.dataset.id = word.id;
    btn.innerHTML = `<span class="illust">${word.svg}</span><span class="term">${word.term}</span>`;
    btn.addEventListener('click', () => onListenPick(word.id, btn));
    grid.appendChild(btn);
  });

  refreshStarUI();
  setTimeout(() => speakTerm(target.term, { muted: loadState().muted }), 280);
}

function onListenPick(id, btn) {
  if (busy || !listenRound) return;
  state = loadState();
  const correct = id === listenRound.target.id;

  if (correct) {
    busy = true;
    btn.classList.add('correct');
    playCorrectCue({ muted: state.muted });
    const fb = $('#listen-feedback');
    fb.textContent = '好叻！係呢個！';
    fb.className = 'feedback ok';
    awardStar().then(() => {
      setTimeout(() => startListenRound(), 900);
    });
  } else {
    btn.classList.add('wrong');
    playTryAgainCue({ muted: state.muted });
    const fb = $('#listen-feedback');
    fb.textContent = '差少少，再試吓啦～';
    fb.className = 'feedback retry';
    setTimeout(() => btn.classList.remove('wrong'), 450);
    setTimeout(() => speakTerm(listenRound.target.term, { muted: loadState().muted }), 400);
  }
}

/* ---------- 模式 B：先撳字再撳圖 ---------- */

function bindMatch() {
  // delegated via recreate each round
}

function startMatchRound() {
  busy = false;
  matchSelectedWordId = null;
  const pool = enabledWords();
  const count = Math.min(4, pool.length);
  const target = pickTarget(pool);
  const set = shuffle([target, ...sampleOthers(pool, target.id, count - 1)]);
  const words = shuffle(set);
  const pics = shuffle(set);
  matchRound = { set, words, pics, matched: new Set() };

  const fb = $('#match-feedback');
  fb.textContent = '先揀一個字詞';
  fb.className = 'feedback';

  const wordBox = $('#match-words');
  const picBox = $('#match-pics');
  wordBox.innerHTML = '';
  picBox.innerHTML = '';

  words.forEach((w) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.id = w.id;
    btn.textContent = w.term;
    btn.addEventListener('click', () => onMatchWord(w.id, btn));
    wordBox.appendChild(btn);
  });

  pics.forEach((w) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pic-card';
    btn.dataset.id = w.id;
    btn.setAttribute('aria-label', '圖畫');
    btn.innerHTML = `<span class="illust">${w.svg}</span>`;
    btn.addEventListener('click', () => onMatchPic(w.id, btn));
    picBox.appendChild(btn);
  });

  refreshStarUI();
}

function onMatchWord(id, btn) {
  if (busy || !matchRound) return;
  if (matchRound.matched.has(id)) return;

  $$('#match-words .chip').forEach((el) => el.classList.remove('selected'));
  btn.classList.add('selected');
  matchSelectedWordId = id;

  state = loadState();
  const word = WORDS.find((w) => w.id === id);
  if (word) speakTerm(word.term, { muted: state.muted });

  const fb = $('#match-feedback');
  fb.textContent = '而家撳啱嘅圖畫';
  fb.className = 'feedback';
}

function onMatchPic(id, btn) {
  if (busy || !matchRound) return;
  if (!matchSelectedWordId) {
    const fb = $('#match-feedback');
    fb.textContent = '記住：先撳字詞，再撳圖畫';
    fb.className = 'feedback retry';
    return;
  }
  if (matchRound.matched.has(id)) return;

  state = loadState();
  const wordBtn = $(`#match-words .chip[data-id="${matchSelectedWordId}"]`);

  if (id === matchSelectedWordId) {
    busy = true;
    btn.classList.add('correct');
    wordBtn?.classList.add('correct');
    matchRound.matched.add(id);
    playCorrectCue({ muted: state.muted });

    const fb = $('#match-feedback');
    fb.textContent = '配中喇！好叻！';
    fb.className = 'feedback ok';

    awardStar().then(() => {
      const done = matchRound.matched.size >= matchRound.set.length;
      setTimeout(() => {
        if (done) startMatchRound();
        else {
          busy = false;
          matchSelectedWordId = null;
          wordBtn?.classList.remove('selected');
          wordBtn && (wordBtn.disabled = true);
          btn.disabled = true;
          wordBtn && (wordBtn.style.opacity = '0.45');
          btn.style.opacity = '0.45';
          fb.textContent = '再揀下一個字詞';
          fb.className = 'feedback';
        }
      }, 750);
    });
  } else {
    btn.classList.add('wrong');
    playTryAgainCue({ muted: state.muted });
    const fb = $('#match-feedback');
    fb.textContent = '差少少，再試吓啦～';
    fb.className = 'feedback retry';
    setTimeout(() => btn.classList.remove('wrong'), 450);
  }
}

/* ---------- 星星 ---------- */

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

/** localStorage 持久化：星星、家長設定、字詞開關 */

const STORAGE_KEY = 'kaka-learn-v1';

const DEFAULT_STATE = {
  pin: '1234',
  muted: false,
  deerFocus: true,
  totalStars: 0,
  starsToday: 0,
  starsDate: todayKey(),
  enabledWordIds: null, // null = 全部啟用
  coinHintSeen: false,
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadState() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { ...DEFAULT_STATE, starsDate: todayKey() };
  }
  if (!raw) return { ...DEFAULT_STATE, starsDate: todayKey() };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ...DEFAULT_STATE, starsDate: todayKey() };
  }

  const state = {
    ...DEFAULT_STATE,
    ...parsed,
  };

  // 日曆日切換：今日星星歸零
  if (state.starsDate !== todayKey()) {
    state.starsToday = 0;
    state.starsDate = todayKey();
  }

  return state;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // iPad 私密模式等情況：忽略
  }
}

function updateState(patch) {
  const next = { ...loadState(), ...patch };
  saveState(next);
  return next;
}

/** 答對時嘗試加星；回傳 { state, gained, capped } */
function tryEarnStar() {
  const state = loadState();
  if (state.starsDate !== todayKey()) {
    state.starsToday = 0;
    state.starsDate = todayKey();
  }

  if (state.starsToday >= 10) {
    saveState(state);
    return { state, gained: false, capped: true };
  }

  state.starsToday += 1;
  state.totalStars += 1;
  saveState(state);
  return { state, gained: true, capped: false };
}

function redeemableCoins(totalStars) {
  return Math.floor((totalStars || 0) / 10);
}

function resetStars() {
  return updateState({
    totalStars: 0,
    starsToday: 0,
    starsDate: todayKey(),
  });
}


window.KakaStorage = { todayKey, loadState, saveState, updateState, tryEarnStar, redeemableCoins, resetStars };

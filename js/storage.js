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
  voiceURI: null, // 家長喺設定揀嘅聲音；null = 自動（優先粵語女聲）
  autoSpeak: true, // 每張卡載入自動讀出（家長可以熄）
  coinHintSeen: false,

  /* ── 獎勵規則（2026-08 改版）──────────────────────────
     舊：答啱 +1 星，每日上限 10 星，可換幣 = floor(累積星星 / 10)
     新：**完成一輪 = 一個 AEON 幣**，每種玩法一日一個（聽／配／砌，最多 3 個）
     點解改：一輪係 8–10 題，舊規則玩到一半就滿咗 10 星，第二輪一粒都冇，
     對 4 歲嚟講係動力斷崖。而家一條進度條就係一個目標，做完即刻有嘢。
     星星仍然計（totalStars／starsToday）但只做紀錄，唔再係兌換單位。 */
  coinsDate: todayKey(),
  coinsToday: {}, // { listen: 1, match: 0, build: 1 } — 每種玩法一日最多 1
  coinsTotal: 0, // 歷來賺到嘅幣（換版時由 floor(totalStars/10) 承接）
  roundProgress: {}, // { "build|dinosaur|": ["baolong", …] } 未完成嘅輪次，中途走咗都留得低
  wordStats: {}, // { [wordId]: { right, wrong, streak, lastRightDay } }
  economyVersion: 2,
};

/** 每種玩法一日一個幣 */
const COIN_MODES = ['listen', 'match', 'build'];

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

  // 換日：今日幣數同未完成輪次一齊重置
  if (state.coinsDate !== todayKey()) {
    state.coinsDate = todayKey();
    state.coinsToday = {};
    state.roundProgress = {};
  }

  // 由舊規則遷移：已經答應咗嘅幣唔可以蒸發
  // （要睇 parsed，唔可以睇 state —— DEFAULT_STATE 已經有 economyVersion）
  let migrated = false;
  if (!parsed.economyVersion) {
    state.coinsTotal = Math.floor((state.totalStars || 0) / 10);
    state.economyVersion = 1;
    migrated = true;
  }
  if (!state.coinsToday || typeof state.coinsToday !== 'object') state.coinsToday = {};
  if (!state.roundProgress || typeof state.roundProgress !== 'object') state.roundProgress = {};
  if (!state.wordStats || typeof state.wordStats !== 'object') state.wordStats = {};
  if ((parsed.economyVersion || 0) < 2) {
    state.economyVersion = 2;
    migrated = true;
  }
  // 即刻寫返落去，唔好等下一次 save —— 否則呢段時間內攞多幾粒星會令換算數字浮動
  if (migrated) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }

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

  // 新規則：星星只係紀錄，唔再有每日上限（上限而家係「每種玩法一日一個幣」）
  state.starsToday += 1;
  state.totalStars += 1;
  saveState(state);
  return { state, gained: true, capped: false };
}

function redeemableCoins() {
  return loadState().coinsTotal || 0;
}

/** 今日每種玩法賺咗幾多個幣（每種最多 1） */
function coinsTodayMap() {
  const s = loadState();
  const out = {};
  COIN_MODES.forEach((m) => {
    out[m] = s.coinsToday && s.coinsToday[m] ? 1 : 0;
  });
  return out;
}

function coinsTodayCount() {
  const m = coinsTodayMap();
  return COIN_MODES.reduce((n, k) => n + m[k], 0);
}

/** 完成一輪：派幣。同一種玩法一日只派一次。 */
function earnCoinForMode(mode) {
  const state = loadState();
  if (!COIN_MODES.includes(mode)) return { state, gained: false, already: false };
  if (state.coinsToday[mode]) {
    return { state, gained: false, already: true };
  }
  state.coinsToday = { ...state.coinsToday, [mode]: 1 };
  state.coinsTotal = (state.coinsTotal || 0) + 1;
  saveState(state);
  return { state, gained: true, already: false };
}

/** 未完成嘅輪次：中途走咗返嚟仲喺度（key = 玩法|主題|書） */
function loadRoundProgress(key) {
  const s = loadState();
  const arr = s.roundProgress && s.roundProgress[key];
  return Array.isArray(arr) ? arr : [];
}

function saveRoundProgress(key, ids) {
  const state = loadState();
  state.roundProgress = { ...state.roundProgress, [key]: [...ids] };
  saveState(state);
  return state;
}

function clearRoundProgress(key) {
  const state = loadState();
  const next = { ...state.roundProgress };
  delete next[key];
  state.roundProgress = next;
  saveState(state);
  return state;
}

/** 答啱／答錯都記低，俾出題加權同家長區統計用。 */
function recordWordResult(wordId, correct) {
  if (!wordId) return loadState();
  const state = loadState();
  const prev = state.wordStats[wordId] || { right: 0, wrong: 0, streak: 0, lastRightDay: null };
  const next = { ...prev };
  if (correct) {
    next.right += 1;
    next.streak += 1;
    next.lastRightDay = todayKey();
  } else {
    next.wrong += 1;
    next.streak = 0;
  }
  state.wordStats = { ...state.wordStats, [wordId]: next };
  saveState(state);
  return state;
}

function isWordMastered(stats) {
  if (!stats) return false;
  return (stats.streak || 0) >= 3 || (stats.right || 0) >= 3;
}

/** 家長區：識咗幾多個字 + 最需要練嘅頭 10 個。 */
function summarizeMastery(wordIds) {
  const stats = loadState().wordStats || {};
  let mastered = 0;
  const ranked = [];
  wordIds.forEach((id) => {
    const s = stats[id];
    if (isWordMastered(s)) mastered += 1;
    ranked.push({
      id,
      wrong: s ? s.wrong || 0 : 0,
      streak: s ? s.streak || 0 : 0,
      score: (s ? s.wrong || 0 : 0) * 3 - (s ? s.streak || 0 : 0),
    });
  });
  ranked.sort((a, b) => b.score - a.score || a.streak - b.streak);
  return { mastered, needPractice: ranked.filter((r) => r.score > 0 || r.streak === 0).slice(0, 10) };
}

function resetStars() {
  return updateState({
    totalStars: 0,
    starsToday: 0,
    starsDate: todayKey(),
    coinsToday: {},
    coinsTotal: 0,
    coinsDate: todayKey(),
    roundProgress: {},
    wordStats: {},
  });
}


window.KakaStorage = {
  todayKey,
  loadState,
  saveState,
  updateState,
  tryEarnStar,
  redeemableCoins,
  resetStars,
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
};

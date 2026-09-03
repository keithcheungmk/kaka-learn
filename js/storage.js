/** localStorage 持久化：按小朋友 Profile 分開（卡卡／希希） */

const STORAGE_KEY = 'kaka-learn-v1';
const SCHEMA_VERSION = 3;

const PROFILE_IDS = ['kaka', 'heihei'];
const PROFILES = {
  kaka: { id: 'kaka', name: '卡卡', avatar: './assets/profile-kaka.jpg' },
  heihei: { id: 'heihei', name: '希希', avatar: './assets/profile-heihei.jpg' },
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DEFAULT_PROFILE_STATE = {
  muted: false,
  deerFocus: true,
  totalStars: 0,
  starsToday: 0,
  starsDate: todayKey(),
  enabledWordIds: null, // null = 全部啟用
  voiceURI: null, // null = 自動（優先粵語女聲）
  autoSpeak: true,
  coinHintSeen: false,

  /* ── 獎勵規則（2026-08 改版）──────────────────────────
     舊：答啱 +1 星，每日上限 10 星，可換幣 = floor(累積星星 / 10)
     新：**完成一輪 = 一個 AEON 幣**，每種玩法一日一個（聽／配／砌，最多 3 個）
     星星仍然計（totalStars／starsToday）但只做紀錄，唔再係兌換單位。 */
  coinsDate: todayKey(),
  coinsToday: {}, // { listen: 1, match: 0, build: 1 } — 每種玩法一日最多 1
  coinsTotal: 0, // 歷來賺到嘅幣（換版時由 floor(totalStars/10) 承接）
  roundProgress: {}, // { "build|dinosaur|": ["baolong", …] } 未完成嘅輪次
  wordStats: {}, // { [wordId]: { right, wrong, streak, lastRightDay } }
  coinLog: {}, // { "YYYY-MM-DD": n } 每日賺到幾個幣（進度頁日曆）
  passedKeys: {}, // { "zoo": true, "red_series|rb_xiaoming": true }
  economyVersion: 2,
};

/** 每種玩法一日一個幣 */
const COIN_MODES = ['listen', 'match', 'build'];

const PROFILE_FIELD_KEYS = Object.keys(DEFAULT_PROFILE_STATE);

function emptyProfile() {
  return {
    ...DEFAULT_PROFILE_STATE,
    starsDate: todayKey(),
    coinsDate: todayKey(),
    coinsToday: {},
    roundProgress: {},
    wordStats: {},
    coinLog: {},
    passedKeys: {},
  };
}

function emptyRoot() {
  return {
    schemaVersion: SCHEMA_VERSION,
    activeProfileId: null,
    profiles: {
      kaka: emptyProfile(),
      heihei: emptyProfile(),
    },
  };
}

function isProfileRoot(parsed) {
  return !!(
    parsed &&
    typeof parsed === 'object' &&
    (parsed.schemaVersion || 0) >= SCHEMA_VERSION &&
    parsed.profiles &&
    typeof parsed.profiles === 'object'
  );
}

function extractProfileFields(obj) {
  const out = emptyProfile();
  if (!obj || typeof obj !== 'object') return out;
  PROFILE_FIELD_KEYS.forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
}

function applyDailyReset(profile) {
  if (profile.coinsDate !== todayKey()) {
    profile.coinsDate = todayKey();
    profile.coinsToday = {};
    profile.roundProgress = {};
  }
  if (profile.starsDate !== todayKey()) {
    profile.starsToday = 0;
    profile.starsDate = todayKey();
  }
  if (!profile.coinsToday || typeof profile.coinsToday !== 'object') profile.coinsToday = {};
  if (!profile.roundProgress || typeof profile.roundProgress !== 'object') profile.roundProgress = {};
  if (!profile.wordStats || typeof profile.wordStats !== 'object') profile.wordStats = {};
  if (!profile.coinLog || typeof profile.coinLog !== 'object') profile.coinLog = {};
  if (!profile.passedKeys || typeof profile.passedKeys !== 'object') profile.passedKeys = {};
  return profile;
}

function applyEconomyMigration(profile, parsedSource) {
  const src = parsedSource && typeof parsedSource === 'object' ? parsedSource : {};
  let migrated = false;
  if (!src.economyVersion) {
    profile.coinsTotal = Math.floor((profile.totalStars || 0) / 10);
    profile.economyVersion = 1;
    migrated = true;
  }
  if ((src.economyVersion || 0) < 2) {
    profile.economyVersion = 2;
    migrated = true;
  }
  if (!profile.economyVersion) {
    profile.economyVersion = 2;
    migrated = true;
  }
  return migrated;
}

function seedCoinLogFromToday(profile) {
  if (!profile.coinLog || typeof profile.coinLog !== 'object') profile.coinLog = {};
  const today = todayKey();
  if (profile.coinLog[today] != null) return;
  const n = COIN_MODES.reduce((sum, m) => sum + (profile.coinsToday && profile.coinsToday[m] ? 1 : 0), 0);
  if (n > 0 && profile.coinsDate === today) profile.coinLog[today] = n;
}

function migrateLegacyToRoot(parsed) {
  const kaka = extractProfileFields(parsed);
  applyEconomyMigration(kaka, parsed);
  applyDailyReset(kaka);
  seedCoinLogFromToday(kaka);
  const root = emptyRoot();
  root.profiles.kaka = kaka;
  root.profiles.heihei = emptyProfile();
  root.activeProfileId = null;
  return root;
}

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // iPad 私密模式等情況：忽略
  }
}

function normalizeRoot(parsed) {
  const root = emptyRoot();
  root.activeProfileId = PROFILE_IDS.includes(parsed.activeProfileId) ? parsed.activeProfileId : null;
  PROFILE_IDS.forEach((id) => {
    const src = parsed.profiles && parsed.profiles[id];
    const profile = extractProfileFields(src);
    applyEconomyMigration(profile, src);
    applyDailyReset(profile);
    seedCoinLogFromToday(profile);
    root.profiles[id] = profile;
  });
  return root;
}

function loadRoot() {
  const raw = readRaw();
  if (!raw) {
    const root = emptyRoot();
    writeRaw(root);
    return root;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const root = emptyRoot();
    writeRaw(root);
    return root;
  }

  if (isProfileRoot(parsed)) {
    const root = normalizeRoot(parsed);
    writeRaw(root);
    return root;
  }

  const root = migrateLegacyToRoot(parsed);
  writeRaw(root);
  return root;
}

function persistRoot(root) {
  writeRaw(root);
  return root;
}

function activeId(root = loadRoot()) {
  return PROFILE_IDS.includes(root.activeProfileId) ? root.activeProfileId : 'kaka';
}

function loadState() {
  const root = loadRoot();
  return { ...root.profiles[activeId(root)] };
}

function saveState(state) {
  if (isProfileRoot(state)) {
    persistRoot(normalizeRoot(state));
    return loadState();
  }
  const root = loadRoot();
  const id = activeId(root);
  const next = extractProfileFields({ ...root.profiles[id], ...state });
  applyDailyReset(next);
  root.profiles[id] = next;
  persistRoot(root);
  return { ...next };
}

function updateState(patch) {
  const next = { ...loadState(), ...patch };
  return saveState(next);
}

function hasActiveProfile() {
  return PROFILE_IDS.includes(loadRoot().activeProfileId);
}

function getActiveProfileId() {
  return loadRoot().activeProfileId;
}

function getActiveProfile() {
  const id = getActiveProfileId();
  return id ? PROFILES[id] : null;
}

function setActiveProfile(id) {
  if (!PROFILE_IDS.includes(id)) return loadState();
  const root = loadRoot();
  root.activeProfileId = id;
  persistRoot(root);
  return loadState();
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
  const day = todayKey();
  state.coinsToday = { ...state.coinsToday, [mode]: 1 };
  state.coinsTotal = (state.coinsTotal || 0) + 1;
  state.coinLog = { ...(state.coinLog || {}), [day]: ((state.coinLog || {})[day] || 0) + 1 };
  saveState(state);
  return { state, gained: true, already: false };
}

function shiftDayKey(key, delta) {
  const [y, m, d] = key.split('-').map((n) => parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/** 近 N 日賺幣（含今日），舊→新。 */
function coinHistory(days = 14) {
  const log = loadState().coinLog || {};
  const today = todayKey();
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = shiftDayKey(today, -i);
    out.push({ date, count: log[date] || 0, isToday: date === today });
  }
  return out;
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

function markTopicPassed(topicId, bookId) {
  if (!topicId) return loadState();
  const state = loadState();
  const key = bookId ? `${topicId}|${bookId}` : topicId;
  state.passedKeys = { ...(state.passedKeys || {}), [key]: true };
  saveState(state);
  return state;
}

function isKeyPassed(topicId, bookId) {
  const passed = loadState().passedKeys || {};
  if (bookId) return !!passed[`${topicId}|${bookId}`];
  return !!passed[topicId];
}

function isTopicPassed(topic) {
  if (!topic) return false;
  const passed = loadState().passedKeys || {};
  if (passed[topic.id]) return true;
  if (Array.isArray(topic.books)) {
    return topic.books.some((b) => passed[`${topic.id}|${b.id}`]);
  }
  return false;
}

/** 答啱／答錯都記低，俾出題加權同進度頁統計用。 */
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

/** 識咗幾多個字 + 最需要練嘅頭 10 個。 */
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
  const needPractice = ranked.filter((r) => r.wrong > 0).slice(0, 10);
  return { mastered, needPractice };
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
    coinLog: {},
    passedKeys: {},
  });
}

window.KakaStorage = {
  STORAGE_KEY,
  SCHEMA_VERSION,
  PROFILE_IDS,
  PROFILES,
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
  coinHistory,
  loadRoundProgress,
  saveRoundProgress,
  clearRoundProgress,
  recordWordResult,
  isWordMastered,
  summarizeMastery,
  hasActiveProfile,
  getActiveProfileId,
  getActiveProfile,
  setActiveProfile,
  markTopicPassed,
  isKeyPassed,
  isTopicPassed,
};

/** 小鹿數理探險 — localStorage（kaka-math-v1；同認字 kaka-learn-v1 分開） */
(function () {
  const STORAGE_KEY = 'kaka-math-v1';

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  const DEFAULT_STATE = {
    starsToday: 0,
    totalStars: 0,
    starsDate: todayKey(),
    currentPlanetId: 'count',
    litPlanetIds: [],
    interviewUnlocked: false,
  };

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

    const state = { ...DEFAULT_STATE, ...parsed };
    if (state.starsDate !== todayKey()) {
      state.starsToday = 0;
      state.starsDate = todayKey();
    }
    if (!Array.isArray(state.litPlanetIds)) state.litPlanetIds = [];
    return state;
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode */
    }
  }

  function updateState(patch) {
    const next = { ...loadState(), ...patch };
    saveState(next);
    return next;
  }

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

  function isPlanetLit(id, state = loadState()) {
    return (state.litPlanetIds || []).includes(id);
  }

  function lightPlanet(id) {
    const state = loadState();
    if (!state.litPlanetIds.includes(id)) {
      state.litPlanetIds = [...state.litPlanetIds, id];
    }
    saveState(state);
    return state;
  }

  window.KakaMathStorage = {
    STORAGE_KEY,
    todayKey,
    loadState,
    saveState,
    updateState,
    tryEarnStar,
    isPlanetLit,
    lightPlanet,
  };
})();

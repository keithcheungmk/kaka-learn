/** 小鹿數理探險 — localStorage（kaka-math-v1；同認字 kaka-learn-v1 分開） */
(function () {
  const STORAGE_KEY = 'kaka-math-v1';
  const SCHEMA_VERSION = 3;
  const PROFILE_IDS = ['kaka', 'heihei'];

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
    additionProgress: {
      unlockedBase: 5,
      completedMissions: [],
    },
  };

  const PROFILE_FIELD_KEYS = Object.keys(DEFAULT_STATE);

  function emptyProfile() {
    return {
      ...DEFAULT_STATE,
      starsDate: todayKey(),
      litPlanetIds: [],
      additionProgress: {
        unlockedBase: 5,
        completedMissions: [],
      },
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
    if (!Array.isArray(out.litPlanetIds)) out.litPlanetIds = [];
    if (!out.additionProgress || typeof out.additionProgress !== 'object') {
      out.additionProgress = { unlockedBase: 5, completedMissions: [] };
    }
    if (!Array.isArray(out.additionProgress.completedMissions)) {
      out.additionProgress.completedMissions = [];
    }
    if (typeof out.additionProgress.unlockedBase !== 'number') {
      out.additionProgress.unlockedBase = 5;
    }
    if (out.starsDate !== todayKey()) {
      out.starsToday = 0;
      out.starsDate = todayKey();
    }
    return out;
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
      /* private mode */
    }
  }

  function migrateLegacyToRoot(parsed) {
    const root = emptyRoot();
    root.profiles.kaka = extractProfileFields(parsed);
    root.profiles.heihei = emptyProfile();
    root.activeProfileId = null;
    return root;
  }

  function normalizeRoot(parsed) {
    const root = emptyRoot();
    root.activeProfileId = PROFILE_IDS.includes(parsed.activeProfileId) ? parsed.activeProfileId : null;
    PROFILE_IDS.forEach((id) => {
      root.profiles[id] = extractProfileFields(parsed.profiles && parsed.profiles[id]);
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
    const root = loadRoot();
    const id = activeId(root);
    root.profiles[id] = extractProfileFields({ ...root.profiles[id], ...state });
    persistRoot(root);
    return { ...root.profiles[id] };
  }

  function updateState(patch) {
    const next = { ...loadState(), ...patch };
    return saveState(next);
  }

  function setActiveProfile(id) {
    if (!PROFILE_IDS.includes(id)) return loadState();
    const root = loadRoot();
    root.activeProfileId = id;
    persistRoot(root);
    return loadState();
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

  function normalizeAdditionProgress(prog) {
    const base = {
      unlockedBase: 5,
      completedMissions: [],
    };
    if (!prog || typeof prog !== 'object') return base;
    return {
      unlockedBase: typeof prog.unlockedBase === 'number' ? prog.unlockedBase : 5,
      completedMissions: Array.isArray(prog.completedMissions) ? [...prog.completedMissions] : [],
    };
  }

  function getAdditionProgress(state = loadState()) {
    return normalizeAdditionProgress(state.additionProgress);
  }

  function isAdditionBaseUnlocked(base, state = loadState()) {
    return base <= getAdditionProgress(state).unlockedBase;
  }

  function isAdditionMissionDone(id, state = loadState()) {
    return getAdditionProgress(state).completedMissions.includes(id);
  }

  function completeAdditionMission(missionId) {
    const state = loadState();
    const prog = getAdditionProgress(state);
    if (!prog.completedMissions.includes(missionId)) {
      prog.completedMissions = [...prog.completedMissions, missionId];
    }
    const data = window.KakaAdditionData;
    if (data) {
      const found = data.getMissionById(missionId);
      if (found) {
        const allDone = found.level.missions.every((m) => prog.completedMissions.includes(m.id));
        if (allDone && found.level.base < 10) {
          prog.unlockedBase = Math.max(prog.unlockedBase, found.level.base + 1);
        }
        if (allDone && found.level.base === 10 && !state.litPlanetIds.includes('compare-size')) {
          state.litPlanetIds = [...state.litPlanetIds, 'compare-size'];
        }
      }
    }
    state.additionProgress = prog;
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
    setActiveProfile,
    getAdditionProgress,
    isAdditionBaseUnlocked,
    isAdditionMissionDone,
    completeAdditionMission,
  };
})();

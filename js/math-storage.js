/** 數理探險 — localStorage v4（kaka-math-v1；同認字 kaka-learn-v1 分開） */
(function () {
  const STORAGE_KEY = 'kaka-math-v1';
  const SCHEMA_VERSION = 4;
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
      unlockedLevel: 1,
      unlockedBase: 5,
      completedLevels: [],
      completedMissions: [],
    },
    subtractionProgress: {
      unlockedLevel: 1,
      completedLevels: [],
      completedMissions: [],
    },
    skillProgress: {},
    mistakeHistory: [],
    missionHistory: [],
  };

  const PROFILE_FIELD_KEYS = Object.keys(DEFAULT_STATE);

  function emptyProfile() {
    return {
      ...DEFAULT_STATE,
      starsDate: todayKey(),
      litPlanetIds: [],
      additionProgress: {
        unlockedLevel: 1,
        unlockedBase: 5,
        completedLevels: [],
        completedMissions: [],
      },
      subtractionProgress: {
        unlockedLevel: 1,
        completedLevels: [],
        completedMissions: [],
      },
      skillProgress: {},
      mistakeHistory: [],
      missionHistory: [],
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
      (parsed.schemaVersion || 0) >= 3 &&
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
    else out.litPlanetIds = out.litPlanetIds.filter((id) => id !== 'compare-qty');
    if (out.currentPlanetId === 'compare-qty') out.currentPlanetId = 'time';
    if (!out.additionProgress || typeof out.additionProgress !== 'object') {
      out.additionProgress = { unlockedLevel: 1, unlockedBase: 5, completedLevels: [], completedMissions: [] };
    }
    if (!Array.isArray(out.additionProgress.completedMissions)) {
      out.additionProgress.completedMissions = [];
    }
    if (!Array.isArray(out.additionProgress.completedLevels)) out.additionProgress.completedLevels = [];
    if (typeof out.additionProgress.unlockedLevel !== 'number') {
      out.additionProgress.unlockedLevel = out.additionProgress.unlockedBase <= 5 ? 1 : 2;
    }
    if (typeof out.additionProgress.unlockedBase !== 'number') out.additionProgress.unlockedBase = out.additionProgress.unlockedLevel >= 2 ? 10 : 5;
    if (!out.subtractionProgress || typeof out.subtractionProgress !== 'object') {
      out.subtractionProgress = { unlockedLevel: 1, completedLevels: [], completedMissions: [] };
    }
    if (typeof out.subtractionProgress.unlockedLevel !== 'number') out.subtractionProgress.unlockedLevel = 1;
    if (!Array.isArray(out.subtractionProgress.completedLevels)) out.subtractionProgress.completedLevels = [];
    if (!Array.isArray(out.subtractionProgress.completedMissions)) out.subtractionProgress.completedMissions = [];
    if (!out.skillProgress || typeof out.skillProgress !== 'object' || Array.isArray(out.skillProgress)) {
      out.skillProgress = {};
    } else {
      out.skillProgress = JSON.parse(JSON.stringify(out.skillProgress));
    }
    if (!Array.isArray(out.mistakeHistory)) out.mistakeHistory = [];
    else out.mistakeHistory = out.mistakeHistory.slice(-50).map((item) => ({ ...item }));
    if (!Array.isArray(out.missionHistory)) out.missionHistory = [];
    else out.missionHistory = out.missionHistory.slice(-30).map((item) => ({ ...item }));
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
      unlockedLevel: 1,
      unlockedBase: 5,
      completedLevels: [],
      completedMissions: [],
    };
    if (!prog || typeof prog !== 'object') return base;
    return {
      unlockedLevel: typeof prog.unlockedLevel === 'number' ? prog.unlockedLevel : (prog.unlockedBase <= 5 ? 1 : 2),
      unlockedBase: typeof prog.unlockedBase === 'number' ? prog.unlockedBase : (prog.unlockedLevel >= 2 ? 10 : 5),
      completedLevels: Array.isArray(prog.completedLevels) ? [...prog.completedLevels] : [],
      completedMissions: Array.isArray(prog.completedMissions) ? [...prog.completedMissions] : [],
    };
  }

  function getAdditionProgress(state = loadState()) {
    return normalizeAdditionProgress(state.additionProgress);
  }

  function isAdditionBaseUnlocked(base, state = loadState()) {
    return base <= getAdditionProgress(state).unlockedBase;
  }

  function isAdditionLevelUnlocked(level, state = loadState()) {
    return level <= getAdditionProgress(state).unlockedLevel;
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
    // 保留舊版 5–10 關卡資料的讀取兼容，唔令舊進度失效。
    const legacy = /^([5-9]|10)-\d+$/.exec(missionId);
    if (legacy) {
      const base = Number(legacy[1]);
      const required = base === 5 ? ['5-1', '5-2', '5-3', '5-4'] : [];
      if (required.length && required.every((id) => prog.completedMissions.includes(id))) prog.unlockedBase = Math.max(prog.unlockedBase, 6);
    }
    const data = window.KakaAdditionData;
    if (data) {
      const found = data.getMissionById(missionId);
      if (found) {
        const allDone = found.level.missions.every((m) => prog.completedMissions.includes(m.id));
        if (allDone && found.level.level === 1) prog.unlockedBase = Math.max(prog.unlockedBase, 6);
        if (allDone && found.level.level === 2) {
          prog.unlockedBase = Math.max(prog.unlockedBase, 10);
          if (!state.litPlanetIds.includes('compare-size')) state.litPlanetIds = [...state.litPlanetIds, 'compare-size'];
        }
      }
    }
    state.additionProgress = prog;
    saveState(state);
    return state;
  }

  function completeAdditionLevel(level) {
    const state = loadState();
    const prog = getAdditionProgress(state);
    if (!prog.completedLevels.includes(level)) prog.completedLevels.push(level);
    if (level === 1) prog.unlockedLevel = Math.max(prog.unlockedLevel, 2);
    if (level === 1) prog.unlockedBase = Math.max(prog.unlockedBase, 6);
    if (level === 2) prog.unlockedBase = Math.max(prog.unlockedBase, 10);
    state.additionProgress = prog;
    saveState(state);
    return state;
  }

  function unlockAdditionLevel(level) {
    const state = loadState();
    const prog = getAdditionProgress(state);
    prog.unlockedLevel = Math.max(prog.unlockedLevel, level);
    state.additionProgress = prog;
    saveState(state);
    return state;
  }

  function normalizeSubtractionProgress(prog) {
    if (!prog || typeof prog !== 'object') return { unlockedLevel: 1, completedLevels: [], completedMissions: [] };
    return {
      unlockedLevel: typeof prog.unlockedLevel === 'number' ? prog.unlockedLevel : 1,
      completedLevels: Array.isArray(prog.completedLevels) ? [...prog.completedLevels] : [],
      completedMissions: Array.isArray(prog.completedMissions) ? [...prog.completedMissions] : [],
    };
  }
  function getSubtractionProgress(state = loadState()) { return normalizeSubtractionProgress(state.subtractionProgress); }
  function isSubtractionLevelUnlocked(level, state = loadState()) { return level <= getSubtractionProgress(state).unlockedLevel; }
  function isSubtractionMissionDone(id, state = loadState()) { return getSubtractionProgress(state).completedMissions.includes(id); }
  function completeSubtractionMission(missionId) {
    const state = loadState(); const prog = getSubtractionProgress(state);
    if (!prog.completedMissions.includes(missionId)) prog.completedMissions.push(missionId);
    const data = window.KakaSubtractionData;
    const found = data?.getMissionById?.(missionId);
    if (found && found.level.missions.every((m) => prog.completedMissions.includes(m.id)) && found.level.level === 1) prog.unlockedLevel = Math.max(prog.unlockedLevel, 2);
    state.subtractionProgress = prog; saveState(state); return state;
  }
  function completeSubtractionLevel(level) {
    const state = loadState(); const prog = getSubtractionProgress(state);
    if (!prog.completedLevels.includes(level)) prog.completedLevels.push(level);
    if (level === 1) prog.unlockedLevel = Math.max(prog.unlockedLevel, 2);
    state.subtractionProgress = prog; saveState(state); return state;
  }

  window.KakaMathStorage = {
    STORAGE_KEY,
    SCHEMA_VERSION,
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
    isAdditionLevelUnlocked,
    isAdditionMissionDone,
    completeAdditionMission,
    completeAdditionLevel,
    unlockAdditionLevel,
    getSubtractionProgress,
    isSubtractionLevelUnlocked,
    isSubtractionMissionDone,
    completeSubtractionMission,
    completeSubtractionLevel,
  };
})();

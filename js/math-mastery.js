/** 數學掌握度：純資料邏輯；不依賴畫面，供所有數學題型共用。 */
(function () {
  const MAX_RECENT_RESULTS = 12;
  const MAX_MISTAKES = 50;
  const MAX_MISSIONS = 30;

  function emptySkillStat() {
    return {
      attempts: 0,
      firstTryCorrect: 0,
      assistedCorrect: 0,
      hintCount: 0,
      recentResults: [],
      lastPlayedAt: null,
      lastMasteredAt: null,
      status: 'new',
    };
  }

  function normalizeSkillStat(value) {
    const base = emptySkillStat();
    if (!value || typeof value !== 'object') return base;
    return {
      attempts: Number.isFinite(value.attempts) ? Math.max(0, value.attempts) : 0,
      firstTryCorrect: Number.isFinite(value.firstTryCorrect) ? Math.max(0, value.firstTryCorrect) : 0,
      assistedCorrect: Number.isFinite(value.assistedCorrect) ? Math.max(0, value.assistedCorrect) : 0,
      hintCount: Number.isFinite(value.hintCount) ? Math.max(0, value.hintCount) : 0,
      recentResults: Array.isArray(value.recentResults)
        ? value.recentResults.slice(-MAX_RECENT_RESULTS).map((result) => ({ ...result }))
        : [],
      lastPlayedAt: value.lastPlayedAt || null,
      lastMasteredAt: value.lastMasteredAt || null,
      status: ['new', 'learning', 'practising', 'mastered', 'review'].includes(value.status)
        ? value.status
        : 'new',
    };
  }

  function dateKey(timestamp) {
    const value = String(timestamp || '');
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  function determineStatus(stat) {
    const recent = stat.recentResults;
    const recentFive = recent.slice(-5);
    const recentCorrect = recent.filter((result) => result.firstTryCorrect).length;
    const recentFiveCorrect = recentFive.filter((result) => result.firstTryCorrect).length;
    const practiceDays = new Set(recent.map((result) => dateKey(result.at)).filter(Boolean));

    if (stat.status === 'mastered' && recentFive.length === 5 && recentFiveCorrect <= 2) return 'review';
    if (recent.length === 12 && recentCorrect >= 10 && practiceDays.size >= 2) return 'mastered';
    if (stat.attempts < 4) return 'learning';
    return 'practising';
  }

  function recordAttempt(state, attempt) {
    if (!attempt || typeof attempt.skillId !== 'string' || !attempt.skillId.trim()) {
      throw new Error('KakaMathMastery: skillId is required');
    }
    const at = attempt.at || new Date().toISOString();
    const firstTryCorrect = attempt.firstTryCorrect === true;
    const assisted = attempt.assisted === true;
    const hints = Number.isFinite(attempt.hints) ? Math.max(0, Math.floor(attempt.hints)) : 0;
    const next = {
      ...(state || {}),
      skillProgress: { ...((state && state.skillProgress) || {}) },
      mistakeHistory: Array.isArray(state?.mistakeHistory) ? state.mistakeHistory.map((item) => ({ ...item })) : [],
      missionHistory: Array.isArray(state?.missionHistory) ? state.missionHistory.map((item) => ({ ...item })) : [],
    };
    const stat = normalizeSkillStat(next.skillProgress[attempt.skillId]);
    stat.attempts += 1;
    if (firstTryCorrect) stat.firstTryCorrect += 1;
    if (assisted) stat.assistedCorrect += 1;
    stat.hintCount += hints;
    stat.lastPlayedAt = at;
    stat.recentResults = [
      ...stat.recentResults,
      { firstTryCorrect, assisted, hints, at },
    ].slice(-MAX_RECENT_RESULTS);
    stat.status = determineStatus(stat);
    if (stat.status === 'mastered' && !stat.lastMasteredAt) stat.lastMasteredAt = at;
    next.skillProgress[attempt.skillId] = stat;

    if (!firstTryCorrect) {
      next.mistakeHistory = [
        ...next.mistakeHistory,
        {
          skillId: attempt.skillId,
          errorType: attempt.errorType || 'unknown',
          answer: attempt.answer,
          expected: attempt.expected,
          representation: attempt.representation || 'unknown',
          occurredAt: at,
        },
      ].slice(-MAX_MISTAKES);
    }
    return next;
  }

  function recordMission(state, mission) {
    if (!mission || typeof mission.missionId !== 'string' || !mission.missionId.trim()) {
      throw new Error('KakaMathMastery: missionId is required');
    }
    const next = {
      ...(state || {}),
      missionHistory: Array.isArray(state?.missionHistory) ? state.missionHistory.map((item) => ({ ...item })) : [],
    };
    next.missionHistory = [...next.missionHistory, { ...mission }].slice(-MAX_MISSIONS);
    return next;
  }

  window.KakaMathMastery = {
    emptySkillStat,
    normalizeSkillStat,
    determineStatus,
    recordAttempt,
    recordMission,
  };
})();

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

  const MERCURY_SKILL_IDS = [
    'count.oneToOne.1to5',
    'count.oneToOne.1to10',
    'count.oneToOne.0to10',
    'count.subitize.1to5',
    'count.oneMoreLess.0to10',
  ];

  const SKILL_LABELS = {
    'count.oneToOne.1to5': '逐粒數 1–5',
    'count.oneToOne.1to10': '逐粒數 1–10',
    'count.oneToOne.0to10': '數到零',
    'count.subitize.1to5': '快速認量',
    'count.oneMoreLess.0to10': '多一／少一',
    'count.quantityConservation.1to8': '數量守恆',
    'count.numberMatch.0to10': '數量配對',
    'compare-qty.fairShare': '公平分享',
  };

  const REVIEW_BUCKET_WEIGHTS = [
    { status: 'review', weight: 0.4 },
    { status: 'learning', weight: 0.3 },
    { status: 'practising', weight: 0.2 },
    { status: 'mastered', weight: 0.1 },
  ];

  function skillLabel(skillId) {
    return SKILL_LABELS[skillId] || skillId.replace(/^count\./, '').replace(/\./g, ' ');
  }

  /** M7：按 40/30/20/10 由 review→learning→practising→mastered 揀技能 */
  function pickSkillForReview(state, catalog = MERCURY_SKILL_IDS, random = Math.random) {
    const progress = (state && state.skillProgress) || {};
    const buckets = { review: [], learning: [], practising: [], mastered: [], new: [] };
    catalog.forEach((id) => {
      const stat = normalizeSkillStat(progress[id]);
      (buckets[stat.status] || buckets.new).push(id);
    });
    const mistakes = (state && state.mistakeHistory) || [];
    mistakes.slice(-5).forEach((m) => {
      if (m.skillId && catalog.includes(m.skillId) && !buckets.review.includes(m.skillId)) {
        buckets.review.push(m.skillId);
      }
    });
    let roll = random();
    for (const { status, weight } of REVIEW_BUCKET_WEIGHTS) {
      if (buckets[status].length && roll < weight) return buckets[status][Math.floor(random() * buckets[status].length)];
      roll -= weight;
    }
    const pool = [...buckets.review, ...buckets.learning, ...buckets.practising, ...catalog];
    return pool[Math.floor(random() * pool.length)] || catalog[0];
  }

  /** M8：家長進度頁數感摘要 */
  function summarizeMathProgress(state, catalog = MERCURY_SKILL_IDS) {
    const progress = (state && state.skillProgress) || {};
    const counts = { review: 0, learning: 0, practising: 0, mastered: 0, new: 0 };
    catalog.forEach((id) => {
      const stat = normalizeSkillStat(progress[id]);
      counts[stat.status] = (counts[stat.status] || 0) + 1;
    });
    const needPractice = catalog
      .map((id) => ({ id, stat: normalizeSkillStat(progress[id]) }))
      .filter(({ stat }) => stat.status === 'review' || stat.status === 'learning')
      .sort((a, b) => {
        const wrongA = a.stat.attempts - a.stat.firstTryCorrect;
        const wrongB = b.stat.attempts - b.stat.firstTryCorrect;
        return wrongB - wrongA || b.stat.attempts - a.stat.attempts;
      })
      .slice(0, 5)
      .map(({ id, stat }) => ({ id, label: skillLabel(id), status: stat.status }));
    const missions = Array.isArray(state?.missionHistory) ? state.missionHistory.length : 0;
    return {
      counts,
      needPractice,
      missions,
      summaryLine: `掌握 ${counts.mastered} · 學緊 ${counts.learning + counts.practising} · 要重練 ${counts.review}`,
    };
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
    MERCURY_SKILL_IDS,
    SKILL_LABELS,
    skillLabel,
    pickSkillForReview,
    summarizeMathProgress,
  };
})();

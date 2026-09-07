/** 水星・太空補給站 — 五題 Montessori 混合任務 */
(function () {
  const ZH_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const ROUND_SIZE = 5;
  const HINT_IDLE_MS = 15000;

  const ACTIVITY_ORDER = ['rocketFuel', 'alienFeed', 'constellation', 'oneMoreLess', 'review'];

  let deps = null;
  let board = null;
  let mission = [];
  let missionIndex = 0;
  let missionStartedAt = null;
  let hintsUsed = 0;
  let hintLevel = 0;
  let hintTimer = null;
  let roundBusy = false;
  let zeroConfirmBound = null;

  const $ = (sel) => document.querySelector(sel);

  function pickTarget(random = Math.random, max = 10, min = 1) {
    return min + Math.floor(random() * (max - min + 1));
  }

  function skillForCount(n) {
    return n <= 5 ? 'count.oneToOne.1to5' : 'count.oneToOne.1to10';
  }

  function makeRocketFuel(target, random = Math.random) {
    const manip = window.KakaMathManipulatives;
    const emoji = manip?.pickEmoji?.('energy', random) || '⭐';
    return {
      id: `mercury-fuel-${Date.now()}-${target}`,
      activity: 'rocketFuel',
      skillId: skillForCount(target),
      target,
      available: target + 2,
      emoji,
      emojiSet: 'energy',
      title: '水星・火箭入油',
      hero: '🚀',
      instruction: `幫火箭裝入${ZH_NUM[target] || target}粒能源。`,
      speech: `幫火箭裝入${ZH_NUM[target] || target}粒能源。`,
      representation: 'physicalSlots',
      mount: { mode: 'fill' },
    };
  }

  function makeAlienFeed(target, random = Math.random) {
    const manip = window.KakaMathManipulatives;
    const emoji = manip?.pickEmoji?.('food', random) || '🍎';
    if (target === 0) {
      return {
        id: `mercury-alien-0-${Date.now()}`,
        activity: 'alienFeed',
        skillId: 'count.oneToOne.0to10',
        target: 0,
        available: 4,
        emoji,
        emojiSet: 'food',
        title: '水星・外星人餵食',
        hero: '👽',
        instruction: '外星人唔肚餓，唔使放食物。',
        speech: '外星人唔肚餓，唔使放任何食物。',
        representation: 'zeroPlate',
        mount: { mode: 'zero' },
      };
    }
    return {
      id: `mercury-alien-${Date.now()}-${target}`,
      activity: 'alienFeed',
      skillId: skillForCount(target),
      target,
      available: target + 2,
      emoji,
      emojiSet: 'food',
      title: '水星・外星人餵食',
      hero: '👽',
      instruction: `餵外星人 ${ZH_NUM[target] || target} 個${emoji}。`,
      speech: `外星人需要${ZH_NUM[target] || target}個。`,
      representation: 'alienPlate',
      mount: { mode: 'fill', pieceLabel: '食物' },
    };
  }

  function makeConstellation(random = Math.random) {
    const gridSize = random() < 0.6 ? 5 : 10;
    const existing = Math.max(1, Math.floor(gridSize * (0.4 + random() * 0.3)));
    const gaps = gridSize - existing;
    const locked = [];
    while (locked.length < existing) {
      const i = Math.floor(random() * gridSize);
      if (!locked.includes(i)) locked.push(i);
    }
    locked.sort((a, b) => a - b);
    const total = gridSize;
    return {
      id: `mercury-const-${Date.now()}`,
      activity: 'constellation',
      skillId: gridSize <= 5 ? 'count.subitize.1to5' : 'count.oneToOne.1to10',
      target: total,
      available: gaps + 2,
      slotCount: gridSize,
      lockedIndices: locked,
      emoji: '⭐',
      emojiSet: 'energy',
      title: '水星・星座修復',
      hero: '✨',
      instruction: '補返缺少嘅星星，整個星座就會亮。',
      speech: `原本有${ZH_NUM[existing] || existing}粒，加多${ZH_NUM[gaps] || gaps}粒，一共有${ZH_NUM[total] || total}粒。`,
      speechComplete: `原本有${ZH_NUM[existing] || existing}粒，加多${ZH_NUM[gaps] || gaps}粒，一共有${ZH_NUM[total] || total}粒。`,
      representation: 'constellationGrid',
      existing,
      gaps,
      mount: { mode: 'fill', pieceLabel: '星星' },
    };
  }

  function makeOneMoreLess(random = Math.random) {
    const relation = random() < 0.5 ? 'more' : 'less';
    const base = pickTarget(random, 8, 2);
    if (relation === 'more') {
      const target = base + 1;
      return {
        id: `mercury-more-${Date.now()}`,
        activity: 'oneMoreLess',
        skillId: 'count.oneMoreLess.0to10',
        target,
        available: 4,
        startFilled: base,
        slotCount: target,
        emoji: '⭐',
        emojiSet: 'energy',
        title: '水星・多一個',
        hero: '👽',
        instruction: '外星人話：我想多一個！',
        speech: `而家有${ZH_NUM[base] || base}粒，再多一粒。`,
        representation: 'oneMore',
        mount: { mode: 'fill', startFilled: base, pieceLabel: '能源' },
      };
    }
    const shown = base + 1;
    return {
      id: `mercury-less-${Date.now()}`,
      activity: 'oneMoreLess',
      skillId: 'count.oneMoreLess.0to10',
      target: base,
      available: shown,
      slotCount: shown,
      emoji: '⭐',
      emojiSet: 'energy',
      title: '水星・少一個',
      hero: '👽',
      instruction: '拿走多餘一粒。',
      speech: `而家有${ZH_NUM[shown] || shown}粒，拿走一粒。`,
      representation: 'oneLess',
      mount: { mode: 'remove', pieceLabel: '能源' },
    };
  }

  function pickReviewActivity(state, random = Math.random) {
    const mastery = deps?.mastery || window.KakaMathMastery;
    const skillId = mastery?.pickSkillForReview?.(state, undefined, random) || 'count.oneToOne.1to5';
    const t = pickTarget(random, 5, 2);
    if (skillId.includes('oneMoreLess')) return makeOneMoreLess(random);
    if (skillId.includes('subitize')) return makeConstellation(random);
    if (skillId.includes('0to10') && random() < 0.35) return makeAlienFeed(0, random);
    if (skillId.includes('fairShare')) return makeAlienFeed(t, random);
    return random() < 0.5 ? makeAlienFeed(t, random) : makeRocketFuel(t, random);
  }

  function generateMission(state, random = Math.random) {
    return [
      makeRocketFuel(pickTarget(random, 5, 2), random),
      makeAlienFeed(pickTarget(random, 5, 1), random),
      makeConstellation(random),
      makeOneMoreLess(random),
      pickReviewActivity(state, random),
    ];
  }

  function renderHero(q) {
    const rocket = $('#math-fuel-rocket');
    const alien = $('#math-mission-alien');
    const constellation = $('#math-mission-constellation');
    const targetWrap = $('#math-fuel-target-wrap');
    const zeroRow = $('#math-mission-zero-row');
    if (rocket) {
      rocket.textContent = q.hero === '🚀' ? '🚀' : '▫️';
      rocket.hidden = q.activity !== 'rocketFuel';
    }
    if (alien) {
      alien.textContent = '👽';
      alien.hidden = !(q.activity === 'alienFeed' || q.activity === 'oneMoreLess');
    }
    if (constellation) constellation.hidden = q.activity !== 'constellation';
    if (targetWrap) targetWrap.hidden = q.mount?.mode === 'zero';
    if (zeroRow) zeroRow.hidden = q.mount?.mode !== 'zero';
    const title = $('#math-fuel-title');
    if (title) title.textContent = q.title || '水星・太空補給站';
    const targetEl = $('#math-fuel-target-num');
    if (targetEl) targetEl.textContent = String(q.target);
  }

  function clearHintTimer() {
    if (hintTimer) {
      clearTimeout(hintTimer);
      hintTimer = null;
    }
  }

  function scheduleHintTimer() {
    clearHintTimer();
    hintTimer = setTimeout(() => {
      if (roundBusy) return;
      applyHint(Math.max(hintLevel + 1, 1));
    }, HINT_IDLE_MS);
  }

  function applyHint(level) {
    const q = mission[missionIndex];
    if (!q || roundBusy) return;
    hintLevel = Math.max(hintLevel, level);
    hintsUsed += 1;
    if (level <= 1) {
      deps?.speak?.(q.instruction);
      return;
    }
    if (level === 2) {
      board?.highlightEmptySlots?.();
      deps?.speak?.('跟住做啦。');
      return;
    }
    board?.demoOneMove?.();
    deps?.speak?.('試吓咁做。');
  }

  function updateProgress() {
    const el = $('#math-fuel-progress');
    if (el) el.textContent = `${Math.min(missionIndex + 1, ROUND_SIZE)}/${ROUND_SIZE}`;
  }

  function saveAttempt(result) {
    const q = mission[missionIndex];
    const mastery = deps?.mastery;
    if (!mastery?.recordAttempt || !deps?.saveState || !q) return;
    const next = mastery.recordAttempt(deps.loadState(), {
      skillId: q.skillId,
      firstTryCorrect: hintsUsed === 0 && (result.incorrectDrops || 0) <= 1,
      assisted: hintsUsed >= 2,
      hints: hintsUsed,
      errorType: result.incorrectDrops > 0 ? 'offByOne' : undefined,
      answer: result.count,
      expected: q.target,
      representation: q.representation,
    });
    deps.saveState(next);
  }

  function finishRound() {
    const mastery = deps?.mastery;
    if (mastery?.recordMission && deps?.saveState) {
      const next = mastery.recordMission(deps.loadState(), {
        missionId: `mercury-mission-${Date.now()}`,
        startedAt: missionStartedAt,
        completedAt: new Date().toISOString(),
        questionsCompleted: ROUND_SIZE,
        firstTryCorrect: ROUND_SIZE,
        hintsUsed: 0,
      });
      deps.saveState(next);
    }
    const firstLight = !deps?.isPlanetLit?.('count');
    if (firstLight) deps?.lightPlanet?.('count');
    const fb = $('#math-fuel-feedback');
    const praise = deps?.speech?.speakCorrectFeedback?.({ muted: deps.isMuted?.() }) || '好叻呀！';
    if (fb) fb.textContent = firstLight ? `${praise} 水星點亮喇！` : `${praise} 任務完成！`;
    setTimeout(() => {
      roundBusy = false;
      if (firstLight) {
        const fromP = deps.getPlanetById?.('count');
        const toP = deps.getPlanetById?.(deps.getNextPlanetId?.('count'));
        if (fromP && toP) deps.offerWarpHop?.(fromP, toP);
        else deps?.openPlay?.();
      } else {
        deps?.openPlay?.();
      }
    }, 1200);
  }

  function onQuestionComplete(result) {
    if (roundBusy) return;
    roundBusy = true;
    clearHintTimer();
    board?.clearHints?.();
    board?.setBusy?.(true);
    saveAttempt(result);

    const muted = deps?.isMuted?.() || false;
    const { gained } = deps?.tryEarnStar?.() || {};
    if (gained) {
      deps?.speech?.playStarCue?.({ muted });
      deps?.playMathStarReward?.();
    } else {
      deps?.speech?.playCorrectCue?.({ muted });
    }

    const q = mission[missionIndex];
    const fb = $('#math-fuel-feedback');
    const praise = deps?.speech?.speakCorrectFeedback?.({ muted }) || '好叻呀！';
    if (fb) fb.textContent = praise;

    if (q?.activity === 'rocketFuel') {
      $('#math-fuel-rocket')?.classList.add('is-launching');
      deps?.speak?.('火箭起飛！');
    } else if (q?.activity === 'constellation') {
      deps?.speak?.(q.speechComplete || q.speech);
      $('#math-mission-constellation')?.classList.add('is-lit');
    } else {
      deps?.speak?.(q.speechComplete || praise);
    }

    setTimeout(() => {
      $('#math-fuel-rocket')?.classList.remove('is-launching');
      $('#math-mission-constellation')?.classList.remove('is-lit');
      missionIndex += 1;
      hintsUsed = 0;
      hintLevel = 0;
      board?.destroy?.();
      board = null;
      unbindZeroConfirm();

      if (missionIndex >= ROUND_SIZE) {
        finishRound();
        return;
      }

      roundBusy = false;
      startQuestion(false);
    }, 1400);
  }

  function unbindZeroConfirm() {
    const btn = $('#btn-math-mission-zero');
    if (btn && zeroConfirmBound) {
      btn.removeEventListener('click', zeroConfirmBound);
      zeroConfirmBound = null;
    }
  }

  function bindZeroConfirm(q) {
    unbindZeroConfirm();
    const btn = $('#btn-math-mission-zero');
    if (!btn) return;
    zeroConfirmBound = () => {
      if (roundBusy) return;
      const stats = board?.getStats?.() || { filled: 0, incorrectDrops: 0 };
      if (stats.filled > 0) {
        deps?.speak?.('唔使放食物呀。');
        return;
      }
      onQuestionComplete({ moves: 0, incorrectDrops: 0, count: 0 });
    };
    btn.addEventListener('click', zeroConfirmBound);
  }

  function startQuestion(autoSpeak) {
    const q = mission[missionIndex];
    if (!q) return;
    hintsUsed = 0;
    hintLevel = 0;

    const prompt = $('#math-fuel-prompt');
    if (prompt) prompt.textContent = q.instruction;
    renderHero(q);

    const stage = $('#math-fuel-board');
    if (!stage || !window.KakaMathManipulatives) return;

    board?.destroy?.();
    unbindZeroConfirm();
    stage.innerHTML = '';

    if (q.mount?.mode === 'zero') {
      stage.innerHTML = '';
      const pool = document.createElement('div');
      pool.className = 'math-manip-pool math-manip-pool--decor';
      for (let i = 0; i < q.available; i += 1) {
        const span = document.createElement('span');
        span.className = 'math-native-emoji math-mission-decor';
        span.textContent = q.emoji;
        pool.appendChild(span);
      }
      stage.appendChild(pool);
      board = {
        destroy() {},
        setBusy() {},
        clearHints() {},
        highlightEmptySlots() {},
        demoOneMove() { return false; },
        getStats() { return { filled: 0, incorrectDrops: 0 }; },
      };
      bindZeroConfirm(q);
    } else {
      board = window.KakaMathManipulatives.mountSlotBoard(stage, {
        target: q.target,
        available: q.available,
        slotCount: q.slotCount || q.target,
        lockedIndices: q.lockedIndices || [],
        startFilled: q.startFilled || q.mount?.startFilled || 0,
        mode: q.mount?.mode || 'fill',
        emoji: q.emoji,
        emojiSet: q.emojiSet,
        pieceLabel: q.mount?.pieceLabel || '物件',
        speakCount: (n) => deps?.speak?.(String(n), { rate: 0.82, delayMs: 0 }),
        onPlace: () => {
          clearHintTimer();
          board?.clearHints?.();
          scheduleHintTimer();
        },
        onInvalidDrop: ({ incorrectDrops: drops }) => {
          if (drops >= 2) applyHint(1);
          if (drops >= 3) applyHint(2);
        },
        onComplete: (result) => onQuestionComplete(result),
      });
    }

    updateProgress();
    deps?.showMathScreen?.('fuel');
    if (autoSpeak) deps?.speak?.(q.speech);
    if (q.mount?.mode !== 'zero') scheduleHintTimer();
  }

  function openMissionRound() {
    if (!window.KakaMathManipulatives) {
      console.error('KakaMathMercuryMissions: manipulatives missing');
      return;
    }
    const state = deps?.loadState?.() || {};
    mission = generateMission(state);
    missionIndex = 0;
    missionStartedAt = new Date().toISOString();
    roundBusy = false;
    hintsUsed = 0;
    hintLevel = 0;
    const fb = $('#math-fuel-feedback');
    if (fb) fb.textContent = '';
    startQuestion(true);
  }

  function init(injected) {
    deps = injected;
    $('#btn-back-math-fuel')?.addEventListener('click', () => {
      clearHintTimer();
      board?.destroy?.();
      board = null;
      unbindZeroConfirm();
      deps?.openPlay?.();
    });
    $('#btn-math-fuel-speak')?.addEventListener('click', () => {
      const q = mission[missionIndex];
      if (q) deps?.speak?.(q.speech);
    });
    $('#btn-math-mode-fuel')?.addEventListener('click', () => openMissionRound());
  }

  window.KakaMathMercuryMissions = {
    init,
    openMissionRound,
    generateMission,
    ACTIVITY_ORDER,
    ROUND_SIZE,
    makeRocketFuel,
    makeAlienFeed,
    makeConstellation,
    makeOneMoreLess,
  };

  // 向後兼容
  window.KakaMathRocketFuel = {
    init,
    openFuelRound: openMissionRound,
    generateMission,
    makeQuestion: makeRocketFuel,
    ROUND_SIZE,
  };
})();

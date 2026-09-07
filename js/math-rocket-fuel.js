/** 水星・火箭入油 — Montessori 操作任務（獨立模組） */
(function () {
  const ZH_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const ROUND_SIZE = 5;
  const HINT_IDLE_MS = 15000;

  let deps = null;
  let board = null;
  let mission = [];
  let missionIndex = 0;
  let missionStartedAt = null;
  let hintsUsed = 0;
  let hintLevel = 0;
  let hintTimer = null;
  let lastProgressAt = 0;
  let roundBusy = false;

  const $ = (sel) => document.querySelector(sel);

  function pickTarget(random = Math.random) {
    return 1 + Math.floor(random() * 10);
  }

  function makeQuestion(target, random = Math.random) {
    const manip = window.KakaMathManipulatives;
    const emoji = manip?.pickEmoji?.('energy', random) || '⭐';
    return {
      id: `mercury-fuel-${Date.now()}-${target}-${Math.floor(random() * 1e6)}`,
      planetId: 'count',
      activity: 'rocketFuel',
      skillId: target <= 5 ? 'count.oneToOne.1to5' : 'count.oneToOne.1to10',
      target,
      available: target + 2,
      emoji,
      instruction: `幫火箭裝入${ZH_NUM[target] || target}粒能源。`,
      speech: `幫火箭裝入${ZH_NUM[target] || target}粒能源。`,
      completionRule: { type: 'exactCount', value: target },
      representation: 'physicalSlots',
      difficulty: target <= 5 ? 1 : 2,
    };
  }

  function generateMission(random = Math.random) {
    const out = [];
    const used = new Set();
    while (out.length < ROUND_SIZE) {
      const t = pickTarget(random);
      if (used.has(t) && used.size < 8) continue;
      used.add(t);
      out.push(makeQuestion(t, random));
    }
    return out;
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
      const stats = board?.getStats?.() || {};
      if (stats.filled >= (mission[missionIndex]?.target || 0)) return;
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
      deps?.speak?.('仲有空格，放粒能源入去。');
      return;
    }
    board?.demoOneMove?.();
    deps?.speak?.('放一粒入去。');
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
        missionId: `mercury-fuel-${Date.now()}`,
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

    const rocket = $('#math-fuel-rocket');
    rocket?.classList.add('is-launching');
    deps?.speak?.('火箭起飛！');

    setTimeout(() => {
      rocket?.classList.remove('is-launching');
      missionIndex += 1;
      hintsUsed = 0;
      hintLevel = 0;
      board?.destroy?.();
      board = null;

      if (missionIndex >= ROUND_SIZE) {
        finishRound();
        return;
      }

      roundBusy = false;
      startQuestion(false);
    }, 1400);
  }

  function startQuestion(autoSpeak) {
    const q = mission[missionIndex];
    if (!q) return;
    hintsUsed = 0;
    hintLevel = 0;
    lastProgressAt = Date.now();

    const prompt = $('#math-fuel-prompt');
    if (prompt) prompt.textContent = q.instruction;
    const targetEl = $('#math-fuel-target-num');
    if (targetEl) targetEl.textContent = String(q.target);

    const stage = $('#math-fuel-board');
    if (!stage || !window.KakaMathManipulatives) return;

    board?.destroy?.();
    board = window.KakaMathManipulatives.mountSlotBoard(stage, {
      target: q.target,
      available: q.available,
      emoji: q.emoji,
      speakCount: (n) => deps?.speak?.(String(n), { rate: 0.82, delayMs: 0 }),
      onPlace: () => {
        lastProgressAt = Date.now();
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

    updateProgress();
    deps?.showMathScreen?.('fuel');
    if (autoSpeak) deps?.speak?.(q.speech);
    scheduleHintTimer();
  }

  function openFuelRound() {
    if (!window.KakaMathManipulatives) {
      console.error('KakaMathRocketFuel: manipulatives missing');
      return;
    }
    mission = generateMission();
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
      deps?.openPlay?.();
    });
    $('#btn-math-fuel-speak')?.addEventListener('click', () => {
      const q = mission[missionIndex];
      if (q) deps?.speak?.(q.speech);
    });
    $('#btn-math-mode-fuel')?.addEventListener('click', () => openFuelRound());
  }

  window.KakaMathRocketFuel = {
    init,
    openFuelRound,
    generateMission,
    makeQuestion,
    ROUND_SIZE,
  };
})();

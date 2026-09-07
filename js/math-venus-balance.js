/** 金星・公平分享 — 太空平衡基地 */
(function () {
  const ZH_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const ROUND_SIZE = 5;
  const HINT_IDLE_MS = 15000;

  let deps = null;
  let board = null;
  let mission = [];
  let missionIndex = 0;
  let hintsUsed = 0;
  let hintTimer = null;
  let roundBusy = false;

  const $ = (sel) => document.querySelector(sel);

  function makeQuestion(random = Math.random) {
    const left = 2 + Math.floor(random() * 4);
    const right = 1 + Math.floor(random() * Math.max(1, left - 1));
    return {
      id: `venus-balance-${Date.now()}`,
      activity: 'fairShare',
      skillId: 'compare-qty.fairShare',
      left,
      right,
      emoji: '🍎',
      instruction: '兩個朋友想一樣多，幫佢哋分一分。',
      speech: '兩個朋友想一樣多，幫佢哋分一分。',
      representation: 'dualPlate',
    };
  }

  function generateMission(random = Math.random) {
    const out = [];
    while (out.length < ROUND_SIZE) {
      out.push(makeQuestion(random));
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
      hintsUsed += 1;
      deps?.speak?.(mission[missionIndex]?.instruction);
    }, HINT_IDLE_MS);
  }

  function saveAttempt(result) {
    const q = mission[missionIndex];
    const mastery = deps?.mastery;
    if (!mastery?.recordAttempt || !deps?.saveState || !q) return;
    const next = mastery.recordAttempt(deps.loadState(), {
      skillId: q.skillId,
      firstTryCorrect: hintsUsed === 0,
      assisted: hintsUsed >= 1,
      hints: hintsUsed,
      answer: result.count,
      expected: q.left > q.right ? q.right : q.left,
      representation: q.representation,
    });
    deps.saveState(next);
  }

  function finishRound() {
    const firstLight = !deps?.isPlanetLit?.('compare-qty');
    if (firstLight) deps?.lightPlanet?.('compare-qty');
    const fb = $('#math-venus-balance-feedback');
    const praise = deps?.speech?.speakCorrectFeedback?.({ muted: deps.isMuted?.() }) || '好叻呀！';
    if (fb) fb.textContent = firstLight ? `${praise} 金星點亮喇！` : `${praise} 分好喇！`;
    setTimeout(() => {
      roundBusy = false;
      if (firstLight) {
        const fromP = deps.getPlanetById?.('compare-qty');
        const toP = deps.getPlanetById?.(deps.getNextPlanetId?.('compare-qty'));
        if (fromP && toP) deps.offerWarpHop?.(fromP, toP);
        else deps?.openVenusPlay?.();
      } else {
        deps?.openVenusPlay?.();
      }
    }, 1100);
  }

  function onComplete(result) {
    if (roundBusy) return;
    roundBusy = true;
    clearHintTimer();
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

    missionIndex += 1;
    hintsUsed = 0;
    board?.destroy?.();
    board = null;

    if (missionIndex >= ROUND_SIZE) {
      finishRound();
      return;
    }

    setTimeout(() => {
      roundBusy = false;
      startQuestion(false);
    }, 1000);
  }

  function startQuestion(autoSpeak) {
    const q = mission[missionIndex];
    if (!q) return;
    hintsUsed = 0;
    $('#math-venus-balance-prompt').textContent = q.instruction;
    $('#math-venus-balance-progress').textContent = `${missionIndex + 1}/${ROUND_SIZE}`;
    const stage = $('#math-venus-balance-board');
    board?.destroy?.();
    board = window.KakaMathManipulatives.mountBalanceBoard(stage, {
      leftCount: q.left,
      rightCount: q.right,
      emoji: q.emoji,
      onMove: () => clearHintTimer(),
      onComplete: (result) => onComplete(result),
    });
    deps?.showMathScreen?.('venusBalance');
    if (autoSpeak) deps?.speak?.(q.speech);
    scheduleHintTimer();
  }

  function openBalanceRound() {
    mission = generateMission();
    missionIndex = 0;
    roundBusy = false;
    $('#math-venus-balance-feedback').textContent = '';
    startQuestion(true);
  }

  function init(injected) {
    deps = injected;
    $('#btn-back-math-venus-balance')?.addEventListener('click', () => {
      clearHintTimer();
      board?.destroy?.();
      board = null;
      deps?.openVenusPlay?.();
    });
    $('#btn-math-venus-balance-speak')?.addEventListener('click', () => {
      const q = mission[missionIndex];
      if (q) deps?.speak?.(q.speech);
    });
    $('#btn-math-mode-balance')?.addEventListener('click', () => openBalanceRound());
  }

  window.KakaMathVenusBalance = { init, openBalanceRound, generateMission, ROUND_SIZE };
})();

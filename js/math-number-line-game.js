/** 水星・數字關係：0–10 數軸先學＋十題任務。 */
(function () {
  let deps = null;
  let learnIndex = 0;
  let mission = [];
  let missionIndex = 0;
  let busy = false;
  let wrongAttempts = 0;
  let hintLevel = 0;
  let gen = 0;
  let mode = 'first';
  let marker = null;
  let firstStop = null;
  let composePhase = 'first'; // first | second
  let distanceChoice = null;
  let suppressClickUntil = 0;
  let priorComposeStop = null;
  let learnTargetsDone = [];

  const data = () => window.KakaMathNumberLineData;
  const $ = (id) => document.getElementById(id);

  function speak(text, opts) {
    deps?.speak?.(text, opts);
  }

  function speakThen(text, done) {
    const g = gen;
    const finish = () => {
      if (g !== gen) return;
      done?.();
    };
    if (deps?.speech?.speakThen) {
      deps.speech.speakThen(text, { muted: deps.isMuted?.(), rate: 0.88, pitch: 1.05, delayMs: 80 }, finish);
    } else {
      speak(text, { rate: 0.88 });
      setTimeout(finish, Math.min(8000, 900 + String(text || '').length * 80));
    }
  }

  function setFeedback(text, kind = '') {
    const el = $('math-relations-feedback') || $('math-relations-learn-feedback');
    if (!el) return;
    el.textContent = text || '';
    el.className = `feedback${kind ? ` is-${kind}` : ''}`;
  }

  function pct(n) {
    return `${(n / 10) * 100}%`;
  }

  function mountLine(root, {
    markerValue = null,
    startValue = null,
    endBand = null,
    firstBand = null,
    secondBand = null,
    hideLabels = [],
    glow = [],
    interactive = true,
  } = {}) {
    if (!root) return;
    const hide = new Set(hideLabels || []);
    const glowSet = new Set(glow || []);
    root.innerHTML = '';
    root.className = 'math-nline';
    root.setAttribute('role', 'slider');
    root.setAttribute('aria-valuemin', '0');
    root.setAttribute('aria-valuemax', '10');
    if (Number.isInteger(markerValue)) root.setAttribute('aria-valuenow', String(markerValue));

    const track = document.createElement('div');
    track.className = 'math-nline-track';
    root.appendChild(track);

    if (firstBand && Number.isInteger(firstBand.from) && Number.isInteger(firstBand.to)) {
      const band = document.createElement('div');
      band.className = 'math-nline-band math-nline-band--first';
      const a = Math.min(firstBand.from, firstBand.to);
      const b = Math.max(firstBand.from, firstBand.to);
      band.style.left = pct(a);
      band.style.width = pct(b - a);
      track.appendChild(band);
    }
    if (secondBand && Number.isInteger(secondBand.from) && Number.isInteger(secondBand.to)) {
      const band = document.createElement('div');
      band.className = 'math-nline-band math-nline-band--second';
      const a = Math.min(secondBand.from, secondBand.to);
      const b = Math.max(secondBand.from, secondBand.to);
      band.style.left = pct(a);
      band.style.width = pct(b - a);
      track.appendChild(band);
    }
    if (endBand && Number.isInteger(endBand.from) && Number.isInteger(endBand.to)) {
      const band = document.createElement('div');
      band.className = 'math-nline-band math-nline-band--move';
      const a = Math.min(endBand.from, endBand.to);
      const b = Math.max(endBand.from, endBand.to);
      band.style.left = pct(a);
      band.style.width = pct(b - a);
      track.appendChild(band);
    }

    for (let i = 0; i <= 10; i += 1) {
      const tick = document.createElement('div');
      tick.className = `math-nline-tick${glowSet.has(i) ? ' is-glow' : ''}`;
      tick.style.left = pct(i);
      const label = document.createElement('span');
      label.className = 'math-nline-label';
      label.textContent = hide.has(i) ? '？' : String(i);
      tick.appendChild(label);
      track.appendChild(tick);
    }

    if (Number.isInteger(startValue)) {
      const start = document.createElement('div');
      start.className = 'math-nline-start';
      start.style.left = pct(startValue);
      start.textContent = '起';
      track.appendChild(start);
    }

    const markerEl = document.createElement('button');
    markerEl.type = 'button';
    markerEl.className = 'math-nline-marker';
    markerEl.setAttribute('aria-label', '數軸標記');
    const value = Number.isInteger(markerValue) ? markerValue : (Number.isInteger(startValue) ? startValue : 0);
    markerEl.style.left = pct(value);
    track.appendChild(markerEl);

    if (!interactive) return;

    const valueFromClientX = (clientX) => {
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
      return Math.round(ratio * 10);
    };

    const setMarker = (n) => {
      marker = n;
      markerEl.style.left = pct(n);
      root.setAttribute('aria-valuenow', String(n));
      onMarkerChanged();
    };

    let dragging = false;
    let startX = 0;
    let moved = false;

    const onDown = (event) => {
      if (busy) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      markerEl.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    };
    const onMove = (event) => {
      if (!dragging) return;
      if (Math.abs(event.clientX - startX) > 6) moved = true;
      setMarker(valueFromClientX(event.clientX));
    };
    const onUp = (event) => {
      if (!dragging) return;
      dragging = false;
      try { markerEl.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
      if (moved) {
        suppressClickUntil = Date.now() + 280;
        setMarker(valueFromClientX(event.clientX));
      }
    };

    markerEl.addEventListener('pointerdown', onDown);
    markerEl.addEventListener('pointermove', onMove);
    markerEl.addEventListener('pointerup', onUp);
    markerEl.addEventListener('pointercancel', onUp);

    track.addEventListener('click', (event) => {
      if (busy || Date.now() < suppressClickUntil) return;
      if (event.target === markerEl) return;
      setMarker(valueFromClientX(event.clientX));
    });

    root.tabIndex = 0;
    root.onkeydown = (event) => {
      if (busy) return;
      const cur = Number.isInteger(marker) ? marker : value;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        setMarker(Math.min(10, cur + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        setMarker(Math.max(0, cur - 1));
      }
    };
  }

  function currentQuestion() {
    return mission[missionIndex] || null;
  }

  function updateBandsLive() {
    const q = currentQuestion();
    const track = document.querySelector('#math-relations-line .math-nline-track');
    if (!q || !track || !Number.isInteger(marker)) return;
    track.querySelectorAll('.math-nline-band').forEach((el) => el.remove());
    const addBand = (cls, from, to) => {
      if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
      const band = document.createElement('div');
      band.className = `math-nline-band ${cls}`;
      const a = Math.min(from, to);
      const b = Math.max(from, to);
      band.style.left = pct(a);
      band.style.width = pct(b - a);
      track.insertBefore(band, track.firstChild);
    };
    if (q.type === 'compose') {
      if (Number.isInteger(firstStop)) {
        addBand('math-nline-band--first', 0, firstStop);
        if (composePhase === 'second') addBand('math-nline-band--second', firstStop, marker);
      } else {
        addBand('math-nline-band--first', 0, marker);
      }
    } else if (Number.isInteger(q.start)) {
      addBand('math-nline-band--move', q.start, marker);
    }
  }

  function onMarkerChanged() {
    updateBandsLive();
  }

  function renderDistanceChoices(q) {
    const box = $('math-relations-distance-choices');
    if (!box) return;
    const show = !!(q && q.needsDistanceChoice);
    box.hidden = !show;
    if (!show) {
      box.innerHTML = '';
      return;
    }
    const max = Math.max(5, q.distance + 2);
    box.innerHTML = '';
    for (let i = 1; i <= Math.min(10, max); i += 1) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `math-nline-choice${distanceChoice === i ? ' is-selected' : ''}`;
      btn.textContent = String(i);
      btn.setAttribute('aria-label', `${i}格`);
      btn.addEventListener('click', () => {
        if (busy) return;
        distanceChoice = i;
        renderDistanceChoices(q);
      });
      box.appendChild(btn);
    }
  }

  function renderComposeControls(q) {
    const stopBtn = $('btn-math-relations-stop');
    const changeBtn = $('btn-math-relations-change-first');
    if (!stopBtn || !changeBtn) return;
    const isCompose = q?.type === 'compose';
    stopBtn.hidden = !(isCompose && composePhase === 'first' && firstStop == null);
    changeBtn.hidden = !(isCompose && firstStop != null);
  }

  function renderPlay(autoSpeak) {
    const q = currentQuestion();
    if (!q) return;
    const progress = $('math-relations-progress');
    if (progress) progress.textContent = `${missionIndex + 1}/10`;
    const prompt = $('math-relations-prompt');
    if (prompt) prompt.textContent = q.prompt;
    const title = $('math-relations-play-title');
    if (title) title.textContent = '水星・數字關係';

    const startValue = Number.isInteger(q.start) ? q.start : null;
    let markerValue = marker;
    if (!Number.isInteger(markerValue)) {
      markerValue = startValue;
    }

    let endBand = null;
    let firstBand = null;
    let secondBand = null;
    if (q.type === 'compose') {
      if (Number.isInteger(firstStop)) {
        firstBand = { from: 0, to: firstStop };
        if (Number.isInteger(markerValue) && composePhase === 'second') {
          secondBand = { from: firstStop, to: markerValue };
        }
      } else if (Number.isInteger(markerValue)) {
        firstBand = { from: 0, to: markerValue };
      }
    } else if ((q.type === 'measure' || q.type === 'makeTen' || q.type === 'move' || q.type === 'inverse') && Number.isInteger(startValue) && Number.isInteger(markerValue)) {
      endBand = { from: startValue, to: markerValue };
    }

    const glow = [];
    if (hintLevel >= 2) {
      if (q.type === 'position' || q.type === 'order') {
        for (let i = Math.max(0, q.target - 1); i <= Math.min(10, q.target + 1); i += 1) glow.push(i);
      }
      if (q.type === 'compose') {
        (q.expectedStops || []).forEach((s) => {
          if (s !== q.forbiddenStop) glow.push(s);
        });
      }
      if (q.type === 'makeTen' || q.type === 'measure' || q.type === 'move' || q.type === 'inverse') {
        const a = Math.min(q.start, q.target);
        const b = Math.max(q.start, q.target);
        for (let i = a; i <= b; i += 1) glow.push(i);
      }
    }

    mountLine($('math-relations-line'), {
      markerValue,
      startValue,
      endBand,
      firstBand,
      secondBand,
      hideLabels: q.hideLabels || [],
      glow,
      interactive: !busy,
    });

    renderDistanceChoices(q);
    renderComposeControls(q);

    const explain = $('math-relations-explain');
    if (explain) explain.hidden = true;

    if (autoSpeak) speak(q.prompt);
  }

  function openLearn() {
    deps.updateState?.({ currentPlanetId: data().PLANET_ID });
    learnIndex = 0;
    learnTargetsDone = [];
    renderLearn(true);
    deps.showMathScreen('relationsLearn');
  }

  function renderLearn(autoSpeak) {
    const steps = data().LEARN_STEPS;
    const step = steps[learnIndex];
    const progress = $('math-relations-learn-progress');
    if (progress) progress.textContent = `${learnIndex + 1}/${steps.length}`;
    const title = $('math-relations-learn-title');
    if (title) title.textContent = `水星・先學・${step.title}`;
    const prompt = $('math-relations-learn-prompt');
    if (prompt) prompt.textContent = step.prompt;
    const fb = $('math-relations-learn-feedback');
    if (fb) fb.textContent = '';

    const startValue = Number.isInteger(step.start) ? step.start : null;
    marker = Number.isInteger(step.start) ? step.start : null;
    mountLine($('math-relations-learn-line'), {
      markerValue: marker,
      startValue,
      interactive: true,
    });

    const prev = $('btn-math-relations-learn-prev');
    const next = $('btn-math-relations-learn-next');
    if (prev) prev.disabled = learnIndex <= 0;
    if (next) next.disabled = learnIndex >= steps.length - 1;

    if (autoSpeak) speak(step.speak);
  }

  function openMission(opts = {}) {
    deps.updateState?.({ currentPlanetId: data().PLANET_ID });
    const state = deps.loadState?.() || {};
    const completed = state.numberRelationsProgress?.completedRounds || 0;
    mode = opts.mode || (completed > 0 ? 'replay' : 'first');
    mission = data().generateMission({
      mode,
      skillProgress: state.skillProgress || {},
    });
    missionIndex = 0;
    priorComposeStop = null;
    resetQuestionState();
    busy = false;
    deps.showMathScreen('relationsPlay');
    renderPlay(true);
  }

  function resetQuestionState() {
    const q = currentQuestion();
    wrongAttempts = 0;
    hintLevel = 0;
    distanceChoice = null;
    firstStop = null;
    composePhase = 'first';
    marker = Number.isInteger(q?.start) ? q.start : null;
    setFeedback('');
  }

  function recordMastery(result, assisted) {
    if (!deps?.mastery || !result?.skillId) return;
    const state = deps.loadState?.() || {};
    const next = deps.mastery.recordAttempt(state, {
      skillId: result.skillId,
      firstTryCorrect: wrongAttempts === 0 && !assisted,
      assisted: !!assisted,
      hints: hintLevel,
    });
    deps.storage?.saveState?.(next);
  }

  function completeRound() {
    const planetId = data().PLANET_ID;
    if (!deps.isPlanetLit?.(planetId)) deps.lightPlanet?.(planetId);
    const state = deps.loadState?.() || {};
    const prog = {
      completedRounds: (state.numberRelationsProgress?.completedRounds || 0) + 1,
      lastCompletedAt: new Date().toISOString(),
      questionTypeCounts: {
        ...(state.numberRelationsProgress?.questionTypeCounts || {}),
      },
    };
    deps.storage?.updateState?.({ numberRelationsProgress: prog });
    deps.showMathRoundReward?.('水星十題完成！你識得搵位置、行距離、砌兩段路同補到十。', () => openMission({ mode: 'replay' }));
  }

  function showExplainThenAdvance(spoken) {
    const q = currentQuestion();
    const needsExplain = q && [2, 6, 9].includes(q.index); // Q3/Q7/Q10 (0-based 2,6,9)
    const explain = $('math-relations-explain');
    const message = $('math-relations-explain-msg');
    if (needsExplain && explain && message) {
      message.textContent = spoken;
      explain.hidden = false;
      const demo = $('btn-math-relations-explain-demo');
      const next = $('btn-math-relations-explain-next');
      if (demo) demo.onclick = () => speak(spoken);
      if (next) {
        next.onclick = () => {
          explain.hidden = true;
          advance();
        };
      }
      speakThen(spoken, () => { /* wait for user next */ });
      return;
    }
    speakThen(spoken, advance);
  }

  function advance() {
    busy = false;
    if (missionIndex >= mission.length - 1) {
      completeRound();
      return;
    }
    missionIndex += 1;
    const q = currentQuestion();
    if (q?.type === 'compose' && q.forbiddenStop != null) {
      // keep priorComposeStop from Q6
    } else if (q?.type === 'compose') {
      priorComposeStop = null;
    }
    resetQuestionState();
    if (q?.type === 'compose' && q.forbiddenStop != null) {
      // forbidden already on question
    }
    renderPlay(true);
  }

  function onStopFirst() {
    if (busy) return;
    const q = currentQuestion();
    if (q?.type !== 'compose' || firstStop != null) return;
    if (!Number.isInteger(marker) || marker <= 0 || marker >= q.goal) {
      setFeedback('第一段要停喺零同目標中間。', 'bad');
      speak('第一段要停喺零同目標中間。');
      return;
    }
    if (q.forbiddenStop != null && marker === q.forbiddenStop) {
      setFeedback('今次第一段唔好再停喺上次嗰個數。', 'bad');
      speak('今次第一段唔好再停喺上次嗰個數。');
      return;
    }
    firstStop = marker;
    composePhase = 'second';
    setFeedback(`停喺${data().zh(firstStop)}。依家再行去${data().zh(q.goal)}。`);
    speak(`停喺${data().zh(firstStop)}。依家再行去${data().zh(q.goal)}。`);
    renderPlay(false);
  }

  function onChangeFirst() {
    if (busy) return;
    firstStop = null;
    composePhase = 'first';
    marker = 0;
    setFeedback('可以重新揀第一段。');
    renderPlay(false);
  }

  function onAnswer() {
    if (busy) return;
    const q = currentQuestion();
    if (!q) return;

    // After Q6 success, stamp forbidden stop onto Q7 if needed
    if (q.type === 'compose' && q.forbiddenStop == null && priorComposeStop != null && missionIndex === 6) {
      q.forbiddenStop = priorComposeStop;
    }

    const result = data().validateAnswer(q, {
      marker,
      distanceChoice,
      firstStop,
      secondEnd: q.type === 'compose' ? marker : null,
    });

    if (!result.ok) {
      wrongAttempts += 1;
      if (wrongAttempts === 1) hintLevel = Math.max(hintLevel, 1);
      if (wrongAttempts >= 2) hintLevel = Math.max(hintLevel, 2);
      setFeedback(result.message, 'bad');
      speak(result.message);
      if (hintLevel >= 2) renderPlay(false);
      return;
    }

    busy = true;
    setFeedback('答啱喇！', 'good');
    deps.speech?.playCorrectCue?.({ muted: deps.isMuted?.() });
    const assisted = wrongAttempts >= 2;
    recordMastery(result, assisted);
    const { gained } = deps.tryEarnStar?.() || { gained: false };
    if (gained) {
      // optional star fx elsewhere
    }

    if (q.type === 'compose' && missionIndex === 5 && Number.isInteger(result.firstStop)) {
      priorComposeStop = result.firstStop;
      if (mission[6]) mission[6].forbiddenStop = result.firstStop;
    }

    const spoken = result.spokenCorrect || q.spokenCorrect;
    showExplainThenAdvance(spoken);
  }

  function onHint() {
    if (busy) return;
    const q = currentQuestion();
    if (!q) return;
    hintLevel = Math.min(2, hintLevel + 1);
    const result = data().validateAnswer(q, { marker: -1 });
    const text = hintLevel >= 2 ? result.hintLevel2 : result.hintLevel1;
    setFeedback(text);
    speak(text);
    renderPlay(false);
  }

  function init(nextDeps) {
    deps = nextDeps;
    if (!data()) {
      console.error('KakaMathNumberLineGame: data module missing');
      return false;
    }

    $('btn-back-math-relations-learn')?.addEventListener('click', () => deps.openGalaxy?.());
    $('btn-math-relations-learn-prev')?.addEventListener('click', () => {
      if (learnIndex <= 0) return;
      learnIndex -= 1;
      renderLearn(true);
    });
    $('btn-math-relations-learn-next')?.addEventListener('click', () => {
      if (learnIndex >= data().LEARN_STEPS.length - 1) return;
      learnIndex += 1;
      renderLearn(true);
    });
    $('btn-math-relations-start-mission')?.addEventListener('click', () => openMission());
    $('math-relations-learn-stage')?.addEventListener('click', () => {
      const step = data().LEARN_STEPS[learnIndex];
      if (step) speak(step.speak);
    });

    $('btn-back-math-relations-play')?.addEventListener('click', () => openLearn());
    $('btn-math-relations-speak')?.addEventListener('click', () => {
      const q = currentQuestion();
      if (q) speak(q.prompt);
    });
    $('btn-math-relations-hint')?.addEventListener('click', onHint);
    $('btn-math-relations-stop')?.addEventListener('click', onStopFirst);
    $('btn-math-relations-change-first')?.addEventListener('click', onChangeFirst);
    $('btn-math-relations-answer')?.addEventListener('click', onAnswer);
    return true;
  }

  window.KakaMathNumberLineGame = { init, openLearn, openMission };
})();

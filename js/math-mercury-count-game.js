/** 水星・逐粒數物件，再揀數字；不使用數線或拖放操作。 */
(function () {
  let deps = null;
  let learnIndex = 0;
  let mission = [];
  let missionIndex = 0;
  let wrongAttempts = 0;
  let busy = false;
  let generation = 0;

  const data = () => window.KakaMathMercuryCountData;
  const $ = (id) => document.getElementById(id);

  function speak(text, done) {
    const token = generation;
    const finish = () => {
      if (token === generation) done?.();
    };
    if (deps?.speech?.speakThen) {
      deps.speech.speakThen(text, {
        muted: deps.isMuted?.(), rate: 0.9, pitch: 1.05, delayMs: 80,
      }, finish);
      return;
    }
    deps?.speak?.(text, { rate: 0.9 });
    const fallbackMs = Math.min(9000, 1300 + String(text || '').length * 115);
    setTimeout(finish, deps?.isMuted?.() ? 250 : fallbackMs);
  }

  function renderCountSet(root, count, object, { numbered = false } = {}) {
    if (!root) return;
    root.className = 'math-counting-set';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', `${count}${object.counter}${object.name}`);
    root.replaceChildren();
    for (let i = 0; i < count; i += 1) {
      const item = document.createElement('span');
      item.className = 'math-counting-object';
      item.setAttribute('aria-label', `${i + 1}${object.counter}${object.name}`);
      const emoji = document.createElement('span');
      emoji.className = 'math-counting-emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = object.emoji;
      item.append(emoji);
      if (numbered) {
        const number = document.createElement('span');
        number.className = 'math-counting-number';
        number.setAttribute('aria-hidden', 'true');
        number.textContent = String(i + 1);
        item.append(number);
      }
      root.append(item);
    }
  }

  function renderLearn(autoSpeak = false) {
    const step = data().LEARN_STEPS[learnIndex];
    const title = $('math-relations-learn-title');
    const progress = $('math-relations-learn-progress');
    const prompt = $('math-relations-learn-prompt');
    const feedback = $('math-relations-learn-feedback');
    if (title) title.textContent = `水星・${step.title}`;
    if (progress) progress.textContent = `${learnIndex + 1}/${data().LEARN_STEPS.length}`;
    if (prompt) prompt.textContent = step.prompt;
    if (feedback) feedback.textContent = '';
    renderCountSet($('math-relations-learn-line'), step.count, step.object, { numbered: true });
    const prev = $('btn-math-relations-learn-prev');
    const next = $('btn-math-relations-learn-next');
    const start = $('btn-math-relations-start-mission');
    if (prev) prev.disabled = learnIndex === 0;
    if (next) next.hidden = learnIndex >= data().LEARN_STEPS.length - 1;
    if (start) start.hidden = learnIndex < data().LEARN_STEPS.length - 1;
    if (autoSpeak) speak(step.speak);
  }

  function openLearn() {
    generation += 1;
    learnIndex = 0;
    deps?.updateState?.({ currentPlanetId: data().PLANET_ID });
    renderLearn(true);
    deps.showMathScreen('relationsLearn');
  }

  function openMission() {
    generation += 1;
    const state = deps?.loadState?.() || {};
    const completedRounds = data().completedRoundsFromState(state);
    mission = data().generateMission({ completedRounds });
    missionIndex = 0;
    wrongAttempts = 0;
    busy = false;
    deps?.updateState?.({ currentPlanetId: data().PLANET_ID });
    deps.showMathScreen('relationsPlay');
    renderQuestion(true);
  }

  function setChoiceButtonsDisabled(disabled) {
    $('math-relations-distance-choices')?.querySelectorAll('button').forEach((button) => {
      button.disabled = disabled;
    });
  }

  function renderQuestion(autoSpeak = false) {
    const question = mission[missionIndex];
    const progress = $('math-relations-progress');
    const prompt = $('math-relations-prompt');
    const title = $('math-relations-play-title');
    const feedback = $('math-relations-feedback');
    const choices = $('math-relations-distance-choices');
    const explain = $('math-relations-explain');
    const next = $('btn-math-relations-explain-next');
    const demo = $('btn-math-relations-explain-demo');
    if (title) title.textContent = '水星・數一數';
    if (progress) progress.textContent = `${missionIndex + 1}/${mission.length}`;
    if (prompt) prompt.textContent = question.prompt;
    if (feedback) feedback.textContent = '';
    renderCountSet($('math-relations-line'), question.count, question.object);
    if (choices) {
      choices.className = 'math-counting-choices';
      choices.replaceChildren();
      question.choices.forEach((value) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'math-counting-choice';
        button.textContent = String(value);
        button.setAttribute('aria-label', `答案 ${value}`);
        button.addEventListener('click', () => chooseAnswer(value, button));
        choices.append(button);
      });
    }
    // Reuse the existing explanation panel as a child-paced confirmation step.
    if (explain) explain.hidden = true;
    if (next) {
      next.disabled = true;
      next.textContent = missionIndex === mission.length - 1 ? '完成任務' : '下一題';
    }
    if (demo) demo.hidden = true;
    ['btn-math-relations-stop', 'btn-math-relations-change-first', 'btn-math-relations-hint', 'btn-math-relations-answer'].forEach((id) => {
      const button = $(id);
      if (button) button.hidden = true;
    });
    if (autoSpeak) speak(question.speak);
  }

  function recordAttempt(question, correct) {
    if (!deps?.mastery?.recordAttempt) return;
    const state = deps.loadState?.() || {};
    const updated = deps.mastery.recordAttempt(state, {
      skillId: question.skillId,
      firstTryCorrect: correct && wrongAttempts === 0,
      assisted: false,
      hints: 0,
      errorType: correct ? undefined : 'wrong-count',
      answer: correct ? question.answer : undefined,
      expected: question.answer,
      representation: 'countable-objects',
    });
    deps.storage?.saveState?.(updated);
  }

  function chooseAnswer(value, button) {
    const question = mission[missionIndex];
    if (busy || !question) return;
    busy = true;
    setChoiceButtonsDisabled(true);
    const feedback = $('math-relations-feedback');
    if (value !== question.answer) {
      wrongAttempts += 1;
      recordAttempt(question, false);
      button.classList.add('is-wrong');
      if (feedback) feedback.textContent = '再數一次。逐粒由一開始，慢慢數就得。';
      deps?.speech?.playTryAgainCue?.({ muted: deps.isMuted?.() });
      setTimeout(() => {
        button.classList.remove('is-wrong');
        busy = false;
        setChoiceButtonsDisabled(false);
      }, 500);
      return;
    }

    // A retry already recorded the incorrect tap. Do not log the eventual
    // correct selection as another failed first attempt in mastery history.
    if (wrongAttempts === 0) recordAttempt(question, true);
    button.classList.add('is-correct');
    const { gained } = deps?.tryEarnStar?.() || {};
    if (gained) {
      deps?.speech?.playStarCue?.({ muted: deps.isMuted?.() });
      deps?.playMathStarReward?.();
    } else deps?.speech?.playCorrectCue?.({ muted: deps.isMuted?.() });

    if (feedback) feedback.textContent = '答啱喇！';
    const explain = $('math-relations-explain');
    const message = $('math-relations-explain-msg');
    const next = $('btn-math-relations-explain-next');
    if (message) message.textContent = question.spokenCorrect;
    if (explain) explain.hidden = false;
    speak(question.spokenCorrect, () => {
      if (next) next.disabled = false;
      busy = false;
    });
  }

  function completeMission() {
    const state = deps?.loadState?.() || {};
    const progress = state.mercuryCountProgress || {};
    deps?.lightPlanet?.(data().PLANET_ID);
    deps?.updateState?.({
      mercuryCountProgress: {
        completedRounds: (progress.completedRounds || 0) + 1,
        lastCompletedAt: new Date().toISOString(),
        questionTypeCounts: { ...(progress.questionTypeCounts || {}), 'count-objects': mission.length },
      },
    });
    deps?.showMathRoundReward?.('水星數一數完成！逐粒數清楚，做得好！', () => openMission());
  }

  function advance() {
    if (busy) return;
    if (missionIndex >= mission.length - 1) {
      completeMission();
      return;
    }
    missionIndex += 1;
    wrongAttempts = 0;
    renderQuestion(true);
  }

  function init(dependencies) {
    deps = dependencies || {};
    $('math-relations-learn-stage')?.addEventListener('click', () => speak(data().LEARN_STEPS[learnIndex].speak));
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
    $('btn-math-relations-start-mission')?.addEventListener('click', openMission);
    $('btn-back-math-relations-learn')?.addEventListener('click', () => deps.openGalaxy?.());
    $('btn-back-math-relations-play')?.addEventListener('click', openLearn);
    $('btn-math-relations-speak')?.addEventListener('click', () => {
      const question = mission[missionIndex];
      if (question) speak(question.speak);
    });
    $('btn-math-relations-explain-demo')?.addEventListener('click', () => {
      const question = mission[missionIndex];
      if (question) speak(question.spokenCorrect);
    });
    $('btn-math-relations-explain-next')?.addEventListener('click', () => {
      if ($('btn-math-relations-explain-next')?.disabled) return;
      $('math-relations-explain').hidden = true;
      advance();
    });
  }

  window.KakaMathMercuryCountGame = { init, openLearn, openMission };
})();

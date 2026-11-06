(function (global) {
  'use strict';
  const vehicles = global.CONSTRUCTION_TRUCKS || [];
  const $ = (id) => document.getElementById(id);
  const screens = ['screen-home', 'screen-detail', 'screen-quiz', 'screen-finish'];
  let selectedVehicle = 0;
  let currentIndex = 0;
  let questionOrder = [];
  let correctCount = 0;
  let answered = false;
  const VOICE = { yue: 'zh-HK', mandarin: 'zh-CN' };

  function showScreen(id, label) {
    screens.forEach((name) => $(name)?.classList.toggle('hidden', name !== id));
    $('status-pill').textContent = label;
    global.scrollTo?.({ top: 0, behavior: 'instant' });
  }

  function announce(text, lang = 'zh-HK') {
    const speech = global.KakaSpeech;
    if (!speech) return;
    if (lang === 'en-US' && speech.speakEnglishTerm) speech.speakEnglishTerm(text, { rate: 0.8, pitch: 1.08 });
    else speech.speakTerm?.(text, { lang, rate: 0.88, pitch: 1.05, delayMs: 60 });
  }

  function sayVehicle(vehicle, kind, lang) {
    const text = kind === 'name'
      ? (lang === 'english' ? vehicle.english : lang === 'mandarin' ? vehicle.mandarin : vehicle.yue)
      : (lang === 'english' ? vehicle.factEnglish : lang === 'mandarin' ? vehicle.factMandarin : vehicle.fact);
    announce(text, lang === 'english' ? 'en-US' : VOICE[lang]);
  }

  function renderHome() {
    $('vehicle-grid').innerHTML = vehicles.map((vehicle, index) => `
      <button class="vehicle-card" type="button" data-index="${index}" aria-label="認識${vehicle.yue} ${vehicle.mandarin} ${vehicle.english}">
        <span class="vehicle-art" data-vehicle="${vehicle.id}" role="img" aria-label="${vehicle.yue}插圖"></span>
        <strong>${vehicle.yue}</strong><small>${vehicle.mandarin} · ${vehicle.english}</small>
      </button>`).join('');
    $('vehicle-grid').querySelectorAll('[data-index]').forEach((card) => card.addEventListener('click', () => openDetail(Number(card.dataset.index))));
  }

  function renderSelector() {
    $('detail-selector').innerHTML = vehicles.map((vehicle, index) =>
      `<button type="button" data-select="${index}" aria-label="選擇${vehicle.yue}" aria-pressed="${index === selectedVehicle}"><span class="vehicle-art selector-art" data-vehicle="${vehicle.id}" aria-hidden="true"></span></button>`).join('');
    $('detail-selector').querySelectorAll('[data-select]').forEach((button) => button.addEventListener('click', () => openDetail(Number(button.dataset.select))));
  }

  function openDetail(index) {
    selectedVehicle = index;
    const item = vehicles[index];
    $('detail-art').dataset.vehicle = item.id;
    $('detail-art').setAttribute('aria-label', `${item.yue}插圖`);
    $('detail-name').textContent = item.yue;
    $('detail-mandarin').textContent = `普通話：${item.mandarin}`;
    $('detail-english').textContent = `English: ${item.english}`;
    $('detail-fact').textContent = item.fact;
    $('detail-toy').textContent = item.toy;
    renderSelector();
    showScreen('screen-detail', `${index + 1}／${vehicles.length} 輛車`);
  }

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function renderQuestion() {
    const vehicleIndex = questionOrder[currentIndex];
    const item = vehicles[vehicleIndex];
    answered = false;
    $('quiz-progress').textContent = `任務 ${currentIndex + 1}／${questionOrder.length}`;
    $('quiz-art').dataset.vehicle = item.id;
    $('quiz-art').setAttribute('aria-label', `${item.yue}插圖`);
    $('quiz-name').textContent = `車名：${item.yue}`;
    $('quiz-question').textContent = item.quiz;
    $('quiz-fact').textContent = '看看這輛車的工具，再想想它會怎樣幫忙。';
    $('feedback').textContent = '';
    $('next-question').classList.add('hidden');
    $('mission-toy').innerHTML = '<strong>答對後會有一個積木車小任務！</strong>';
    const answers = shuffle(vehicles.map((vehicle, index) => ({ text: vehicle.job, scene: vehicle.scene, correct: index === vehicleIndex })));
    $('choices').innerHTML = answers.map((answer) =>
      `<button type="button" data-correct="${answer.correct}" aria-label="${answer.text}"><span class="choice-scene" aria-hidden="true">${answer.scene}</span><span>${answer.text}</span></button>`).join('');
    $('choices').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => chooseAnswer(button, item)));
    $('status-pill').textContent = `${correctCount} 題答啱`;
  }

  function chooseAnswer(button, item) {
    if (answered) return;
    if (button.dataset.correct !== 'true') {
      button.classList.add('wrong');
      $('feedback').textContent = '再看一看車上的工具，試另一個答案！';
      global.KakaSpeech?.playTryAgainCue?.();
      announce('再想一想，試另一個答案。');
      return;
    }
    answered = true;
    correctCount += 1;
    button.classList.add('correct');
    $('choices').querySelectorAll('button').forEach((choice) => { choice.disabled = true; });
    $('quiz-fact').textContent = `${item.yue}：${item.fact}`;
    $('feedback').textContent = `答對了！這是${item.yue}。`;
    $('mission-toy').innerHTML = `<strong>🧱 試用積木車</strong><br>${item.toy}`;
    global.KakaSpeech?.playCorrectCue?.();
    announce(`答對了，${item.yue}。${item.fact}`);
    const next = $('next-question');
    next.textContent = currentIndex + 1 >= questionOrder.length ? '完成工程車任務 →' : '下一個任務 →';
    next.classList.remove('hidden');
  }

  function startMission() {
    questionOrder = shuffle(vehicles.map((_, index) => index));
    currentIndex = 0;
    correctCount = 0;
    showScreen('screen-quiz', '工程車任務');
    renderQuestion();
  }

  function finishMission() {
    global.KakaSpeech?.cancelAllSpeech?.();
    const storage = global.KakaStorage;
    const previouslyPassed = storage?.isKeyPassed?.('common-sense', 'construction-trucks');
    if (!previouslyPassed) storage?.tryEarnStar?.();
    storage?.markTopicPassed?.('common-sense', 'construction-trucks');
    const result = storage?.earnCoinForMode?.('common-sense-construction-trucks');
    $('finish-message').textContent = `${previouslyPassed ? '' : '首次完成，獲得一顆星星！ '}${result?.gained ? '今天獲得一個常識樂園獎勵。' : '今天的工程車任務獎勵已記錄。'}`;
    showScreen('screen-finish', '任務完成');
    global.KakaSpeech?.playStarCue?.();
    announce('太棒了！八個工程車任務完成！');
  }

  function bindEvents() {
    global.KakaNav?.bindBackLink($('truck-back'), 'common-sense.html');
    $('start-mission').addEventListener('click', startMission);
    document.querySelectorAll('[data-say-name]').forEach((button) => button.addEventListener('click', () => sayVehicle(vehicles[selectedVehicle], 'name', button.dataset.sayName)));
    document.querySelectorAll('[data-say-fact]').forEach((button) => button.addEventListener('click', () => sayVehicle(vehicles[selectedVehicle], 'fact', button.dataset.sayFact)));
    document.querySelectorAll('[data-say-quiz-name]').forEach((button) => button.addEventListener('click', () => sayVehicle(vehicles[questionOrder[currentIndex] ?? 0], 'name', button.dataset.sayQuizName)));
    document.querySelectorAll('[data-say-quiz]').forEach((button) => button.addEventListener('click', () => {
      const item = vehicles[questionOrder[currentIndex] ?? 0];
      const language = button.dataset.sayQuiz;
      announce(language === 'english' ? item.factEnglish : language === 'mandarin' ? item.factMandarin : item.fact, language === 'english' ? 'en-US' : VOICE[language]);
    }));
    $('detail-next').addEventListener('click', () => openDetail((selectedVehicle + 1) % vehicles.length));
    $('next-question').addEventListener('click', () => {
      currentIndex += 1;
      if (currentIndex >= questionOrder.length) finishMission();
      else renderQuestion();
    });
    $('play-again').addEventListener('click', startMission);
    $('back-home').addEventListener('click', () => showScreen('screen-home', '認識工程車'));
    global.addEventListener('pagehide', () => global.KakaSpeech?.cancelAllSpeech?.());
  }

  renderHome();
  bindEvents();
  global.ConstructionTruckGame = { vehicles, startMission, openDetail };
})(window);

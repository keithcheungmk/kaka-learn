/* Listen & Find — find a spoken fruit in a familiar scene. */
(function () {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const FRUITS = [
    ['apple', 19, 22, 12, 20],
    ['banana', 38, 22, 16, 21],
    ['orange', 25, 70, 15, 23],
    ['grapes', 19, 46, 16, 22],
    ['pear', 38, 45, 11, 22],
    ['strawberry', 51, 71, 10, 19],
    ['pineapple', 61, 30, 13, 37],
    ['watermelon', 81, 58, 21, 35],
  ];

  const screen = $('#screen-listen-find');
  if (!screen || !window.KakaSpeech || !window.KakaStorage) return;

  const wall = $('#listen-find-wall');
  const svg = $('#listen-find-draw');
  const line = $('#listen-find-line');
  const overlay = $('#listen-find-overlay');
  const message = $('#listen-find-message');
  const heading = $('#listen-find-heading');
  const progress = $('#listen-find-progress');
  const mascot = $('#listen-find-mascot');
  const targets = new Map();
  let order = [];
  let index = 0;
  let active = false;
  let drawingPointerId = null;
  let points = [];
  let previousPraise = -1;
  let speechFallback = null;
  let speechToken = 0;

  function isMuted() {
    try {
      return !!window.KakaStorage.loadState().muted;
    } catch {
      return false;
    }
  }

  function speak(text, onEnd) {
    if (speechFallback) window.clearTimeout(speechFallback);
    const token = ++speechToken;
    let ended = false;
    const done = () => {
      if (ended || token !== speechToken) return;
      ended = true;
      if (speechFallback) window.clearTimeout(speechFallback);
      speechFallback = null;
      onEnd?.();
    };
    if (onEnd) {
      const fallbackMs = (window.KakaSpeech.estimateSpeakMs?.(text, { rate: 0.88, delayMs: 0 }) || 2200) + 500;
      speechFallback = window.setTimeout(done, fallbackMs);
    }
    window.KakaSpeech.speakEnglishTerm(text, {
      muted: isMuted(),
      rate: 0.88,
      pitch: 1.08,
      delayMs: 0,
      onEnd: done,
    });
  }

  function cancelSpeech() {
    speechToken += 1;
    if (speechFallback) window.clearTimeout(speechFallback);
    speechFallback = null;
    window.KakaSpeech.cancelAllSpeech();
  }

  function shuffled(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function setProgress() {
    progress.textContent = `${index} / ${FRUITS.length} ✨`;
  }

  function praiseFor(fruit) {
    const lines = window.KAKA_FIND_PRAISE || [];
    if (!lines.length) return `Great job, Kaka! You found the ${fruit}!`;
    let next = Math.floor(Math.random() * lines.length);
    if (lines.length > 1 && next === previousPraise) next = (next + 1) % lines.length;
    previousPraise = next;
    return lines[next].replaceAll('{fruit}', fruit);
  }

  function clearDrawing() {
    points = [];
    drawingPointerId = null;
    line.setAttribute('d', '');
  }

  function finishRound() {
    active = false;
    heading.textContent = 'Amazing work! 🌟';
    const coin = window.KakaStorage.earnCoinForMode(
      window.KakaStorage.getCoinModeForGame?.('listen') || 'listen',
      'Listen & Find · Fruit Shop',
    );
    window.KakaLearn?.refreshRewards?.();
    message.textContent = coin.gained
      ? 'You found all eight fruits and earned an AEON coin!'
      : 'You found all eight fruits! Your Listen coin is already collected today.';
    $('#btn-listen-find-again').hidden = false;
    speak(coin.gained
      ? 'Amazing work! You found all eight fruits and earned a coin!'
      : 'Amazing work! You found all eight fruits!');
  }

  function askForFruit() {
    if (index >= order.length) {
      finishRound();
      return;
    }
    active = true;
    heading.textContent = 'Find the fruit!';
    message.textContent = 'Listen carefully, then find the fruit.';
    setProgress();
    speak(`Find the ${order[index]}!`);
  }

  function startRound() {
    window.KakaSpeech.warmAudio();
    window.KakaSpeech.warmEnglishVoice();
    cancelSpeech();
    targets.forEach((target) => {
      target.classList.remove('is-found', 'is-wrong');
      target.setAttribute('aria-pressed', 'false');
    });
    $('#btn-listen-find-again').hidden = true;
    mascot.classList.remove('is-celebrating');
    overlay.hidden = true;
    order = shuffled(FRUITS.map(([fruit]) => fruit));
    index = 0;
    setProgress();
    askForFruit();
  }

  function updateDrawingViewBox() {
    const rect = wall.getBoundingClientRect();
    if (rect.width && rect.height) svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  }

  function targetAtPoint(x, y) {
    return [...targets.values()].find((target) => {
      if (target.classList.contains('is-found')) return false;
      const rect = target.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
  }

  function targetInsideCircle(pointsForCircle) {
    if (pointsForCircle.length < 2) return null;
    const xs = pointsForCircle.map((point) => point.x);
    const ys = pointsForCircle.map((point) => point.y);
    const bounds = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
    const wallRect = wall.getBoundingClientRect();
    return [...targets.values()].find((target) => {
      if (target.classList.contains('is-found')) return false;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - wallRect.left;
      const centerY = rect.top + rect.height / 2 - wallRect.top;
      return centerX >= bounds.left && centerX <= bounds.right && centerY >= bounds.top && centerY <= bounds.bottom;
    });
  }

  function answerTarget(target) {
    if (!active || !target || target.classList.contains('is-found')) return;
    clearDrawing();
    const fruit = target.dataset.fruit;
    if (fruit !== order[index]) {
      target.classList.remove('is-wrong');
      void target.offsetWidth;
      target.classList.add('is-wrong');
      message.textContent = 'Good try! Listen again for the fruit.';
      speak('Good try! Listen again.', () => speak(`Find the ${order[index]}!`));
      return;
    }

    active = false;
    target.classList.add('is-found');
    target.setAttribute('aria-pressed', 'true');
    index += 1;
    window.KakaStorage.tryEarnStar?.();
    window.KakaLearn?.refreshRewards?.();
    setProgress();
    const praise = praiseFor(fruit);
    message.textContent = praise;
    mascot.classList.remove('is-celebrating');
    void mascot.offsetWidth;
    mascot.classList.add('is-celebrating');
    speak(praise, () => window.setTimeout(askForFruit, 350));
  }

  function setupTargets() {
    FRUITS.forEach(([fruit, left, top, width, height]) => {
      const target = $(`.listen-find-target[data-fruit="${fruit}"]`);
      target.style.left = `${left}%`;
      target.style.top = `${top}%`;
      target.style.width = `${width}%`;
      target.style.height = `${height}%`;
      target.setAttribute('aria-label', `Find the ${fruit}`);
      target.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        answerTarget(target);
      });
      targets.set(fruit, target);
    });
    updateDrawingViewBox();
  }

  function pointerPoint(event) {
    const rect = wall.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function bindDrawing() {
    wall.addEventListener('pointerdown', (event) => {
      if (!active || drawingPointerId !== null) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      drawingPointerId = event.pointerId;
      wall.setPointerCapture(event.pointerId);
      points = [pointerPoint(event)];
      line.setAttribute('d', `M ${points[0].x} ${points[0].y}`);
    });
    wall.addEventListener('pointermove', (event) => {
      if (event.pointerId !== drawingPointerId) return;
      const point = pointerPoint(event);
      points.push(point);
      line.setAttribute('d', `${line.getAttribute('d')} L ${point.x} ${point.y}`);
    });
    wall.addEventListener('pointerup', (event) => {
      if (event.pointerId !== drawingPointerId) return;
      const moved = points.some((point) => Math.hypot(point.x - points[0].x, point.y - points[0].y) > 16);
      const target = moved ? targetInsideCircle(points) : targetAtPoint(event.clientX, event.clientY);
      clearDrawing();
      if (target) answerTarget(target);
    });
    wall.addEventListener('pointercancel', clearDrawing);
    window.addEventListener('resize', updateDrawingViewBox, { passive: true });
  }

  function open() {
    cancelSpeech();
    active = false;
    clearDrawing();
    $('.screen.active')?.classList.remove('active');
    screen.classList.add('active');
    overlay.hidden = false;
    $('#btn-listen-find-again').hidden = true;
    heading.textContent = 'Listen carefully...';
    message.textContent = 'Get ready to play!';
    index = 0;
    setProgress();
    window.KakaStarFx?.hideRanger?.();
  }

  function close() {
    active = false;
    cancelSpeech();
    window.KakaPhonics?.openEnglishHub?.();
  }

  $('#btn-english-listen-find')?.addEventListener('click', open);
  $('#btn-listen-find-back')?.addEventListener('click', close);
  $('#btn-listen-find-start')?.addEventListener('click', startRound);
  $('#btn-listen-find-again')?.addEventListener('click', startRound);
  $('#btn-listen-find-listen')?.addEventListener('click', () => {
    if (active && order[index]) speak(`Find the ${order[index]}!`);
  });
  setupTargets();
  bindDrawing();
  window.KakaPhonics?.warmEnglishVoice?.();
  window.KakaListenFind = { open };
})();

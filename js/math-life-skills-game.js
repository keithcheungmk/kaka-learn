/** 五項生活數學任務引擎：各題型有自己的操作與視覺提示。 */
(function () {
  let deps = null, activity = null, mission = [], index = 0, locked = false, wrongAttempts = 0, generation = 0;
  let compareSelection = null, paired = { left: new Set(), right: new Set() };
  const $ = (id) => document.getElementById(id);
  const data = () => window.KakaMathLifeSkillsData;

  function speakThen(text, done) {
    const token = generation;
    const finish = () => { if (token === generation) done?.(); };
    if (deps?.speech?.speakThen) { deps.speech.speakThen(text, { muted: deps.isMuted?.(), rate: .88, pitch: 1.04, delayMs: 60 }, finish); return; }
    deps?.speak?.(text, { rate: .88 });
    setTimeout(finish, Math.min(6500, 900 + String(text || '').length * 90));
  }
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }
  function shapeDrawing(shape, color = '#ff9b39') {
    const drawing = el('span', `math-life-shape-drawing shape--${shape.id}`);
    drawing.setAttribute('aria-hidden', 'true'); drawing.style.setProperty('--shape-color', color); return drawing;
  }
  function announce(text) { const node = $('math-life-skill-feedback'); if (node) node.textContent = text; }
  function renderPile(parent, count, object, side) {
    const group = el('section', `math-life-pile math-life-pile--${side}`);
    group.setAttribute('aria-label', `${side === 'left' ? '左邊' : '右邊'}有${count}${object.counter}${object.name}`);
    const items = el('div', 'math-life-pile-items');
    for (let i = 0; i < count; i += 1) {
      const isPaired = paired[side].has(i);
      const item = el('button', `math-life-object${isPaired ? ' is-paired' : ''}${compareSelection?.side === side && compareSelection.index === i ? ' is-selected' : ''}`, object.emoji);
      item.type = 'button'; item.disabled = locked || isPaired;
      item.setAttribute('aria-label', `${i + 1}${object.counter}${object.name}${isPaired ? '，已配對' : '，點一下選擇'}`);
      item.addEventListener('click', () => selectCompareItem(side, i)); items.append(item);
    }
    group.append(el('strong', 'math-life-side-label', side === 'left' ? '左邊' : '右邊'), items,
      el('span', 'math-life-pair-count', `配好 ${paired[side].size} 對`)); parent.append(group);
  }
  function renderCompare(board, question) {
    const pair = el('div', 'math-life-pair');
    renderPile(pair, question.left, question.object, 'left'); pair.append(el('span', 'math-life-vs', '⇄'));
    renderPile(pair, question.right, question.object, 'right');
    board.append(el('p', 'math-life-board-instruction', '點一件左邊物品，再點一件右邊物品，配成一對。'), pair);
  }
  function selectCompareItem(side, itemIndex) {
    if (locked) return;
    if (!compareSelection || compareSelection.side === side) compareSelection = { side, index: itemIndex };
    else {
      const leftIndex = side === 'left' ? itemIndex : compareSelection.index;
      const rightIndex = side === 'right' ? itemIndex : compareSelection.index;
    paired.left.add(leftIndex); paired.right.add(rightIndex); compareSelection = null;
    announce(`配好${paired.left.size}對。看看兩邊還有沒有剩下。`);
    }
    renderQuestionVisual(mission[index]);
    if (paired.left.size === Math.min(mission[index].left, mission[index].right)) {
      document.querySelectorAll('#math-life-skill-choices button').forEach((button) => { button.disabled = false; });
      announce(`全部配好${paired.left.size}對了！看看邊邊有物品剩下，再揀答案。`);
    }
  }
  function renderBonds(board, question) {
    const equation = el('div', 'math-life-bond-equation');
    equation.append(el('strong', 'math-life-part-number', String(question.part)), el('span', '', '＋'),
      el('strong', 'math-life-missing-number', '?'), el('span', '', '＝'), el('strong', 'math-life-target-number', String(question.total)));
    const frame = el('div', 'math-life-ten-frame');
    for (let i = 0; i < question.total; i += 1) {
      const filled = i < question.part;
      const cell = el('span', `math-life-ten-cell${filled ? ' is-filled' : ' is-empty'}`, filled ? '⭐' : '');
      cell.setAttribute('aria-hidden', 'true'); frame.append(cell);
    }
    frame.setAttribute('aria-label', `目標${question.total}粒星的格子，已經有${question.part}粒，還有${question.total - question.part}個空格`);
    board.append(el('p', 'math-life-board-instruction', `已有${question.part}粒，看看還有幾個空格。`), equation, frame);
  }
  function renderShop(board, question) {
    const shop = el('div', 'math-life-shop-scene');
    const product = el('div', 'math-life-product-card');
    product.append(el('span', 'math-life-shop-item', question.item.emoji), el('strong', '', question.item.name), el('span', 'math-life-price-tag', `${question.price} 個幣`));
    const wallet = el('div', 'math-life-wallet'); wallet.append(el('strong', '', `錢包有 ${question.wallet} 個幣`));
    const coins = el('div', 'math-life-coins');
    for (let i = 0; i < question.wallet; i += 1) coins.append(el('span', 'math-life-coin', '🪙'));
    wallet.append(coins); shop.append(product, wallet); board.append(shop);
  }
  function renderMeasure(board, question) {
    const pair = el('div', `math-life-measure-pair is-${question.attribute === '長短' ? 'length' : question.attribute === '輕重' ? 'weight' : 'capacity'}`);
    ['left', 'right'].forEach((side) => {
      const amount = question[side], card = el('div', 'math-life-measure-object');
      card.append(el('strong', 'math-life-side-label', side === 'left' ? '左邊' : '右邊'));
      if (question.attribute === '長短') {
        const ruler = el('div', 'math-life-ruler');
        const bar = el('span', 'math-life-measure-bar'); bar.style.width = `${Math.round(30 + amount * 8)}%`;
        ruler.append(bar); card.append(ruler);
      } else if (question.attribute === '輕重') {
        const scale = el('div', 'math-life-balance-visual');
        const weights = el('span', 'math-life-weight-blocks');
        for (let i = 0; i < amount; i += 1) weights.append(el('span', 'math-life-weight-block', '🧱'));
        scale.append(el('span', 'math-life-balance-pan', '⚖️'), weights); card.append(scale);
      } else {
        const cup = el('span', 'math-life-cup'), water = el('span', 'math-life-cup-water');
        water.style.height = `${Math.round(14 + amount * 10)}%`; cup.append(water); card.append(cup);
        card.append(el('span', 'math-life-measure-mark', `${amount} 格`));
      }
      pair.append(card);
    });
    board.append(pair);
  }
  function renderQuestionVisual(question) {
    const board = $('math-life-skill-board'); if (!board) return;
    board.replaceChildren(); board.dataset.kind = question.kind;
    if (question.kind === 'compare') renderCompare(board, question);
    else if (question.kind === 'bonds') renderBonds(board, question);
    else if (question.kind === 'shape') {
      const card = el('div', 'math-life-shape-card');
      card.append(shapeDrawing(question.shape), el('span', 'math-life-shape-silhouette-caption', '看看它的邊和角'));
      board.append(card);
    } else if (question.kind === 'pattern') {
      const row = el('div', 'math-life-pattern-row');
      question.sequence.forEach((shape, i) => { const tile = el('div', 'math-life-pattern-tile'); tile.append(shapeDrawing(shape, data().COLORS[i % data().COLORS.length])); row.append(tile); });
      row.append(el('div', 'math-life-pattern-missing', '?')); board.append(el('p', 'math-life-board-instruction', '找找重複的形狀小隊。'), row);
    } else if (question.kind === 'shop') renderShop(board, question);
    else if (question.kind === 'measure') renderMeasure(board, question);
  }
  function recordAttempt(question, correct, picked) {
    if (!deps?.mastery?.recordAttempt) return;
    const updated = deps.mastery.recordAttempt(deps.loadState?.() || {}, {
      skillId: question.skillId, firstTryCorrect: correct && wrongAttempts === 0, assisted: correct && wrongAttempts > 0,
      hints: wrongAttempts > 0 ? 1 : 0, errorType: correct ? undefined : `${question.kind}-choice`,
      answer: picked, expected: question.answer, representation: question.kind,
    }); deps.storage?.saveState?.(updated);
  }
  function answer(question, choice, button) {
    if (locked) return;
    if (question.kind === 'compare' && paired.left.size < Math.min(question.left, question.right)) {
      announce('先把兩邊的物品一對一配好，才揀答案喔。'); return;
    }
    if (choice.id !== question.answer) {
      wrongAttempts += 1; recordAttempt(question, false, choice.id); button.classList.add('is-bad');
      if (question.kind === 'compare') announce(`已一對一配好${Math.min(question.left, question.right)}對，看看哪邊有剩。`);
      else if (question.kind === 'bonds') announce(`可以用星星逐個數一數，合起來有幾個。`);
      else if (question.kind === 'shape' || question.kind === 'pattern') announce(`再看看形狀的邊、角，或前面重複的次序。`);
      else announce(`再看看物品、價錢和數量，慢慢想一想。`);
      deps?.speech?.playTryAgainCue?.({ muted: deps.isMuted?.() }); setTimeout(() => button.classList.remove('is-bad'), 420); return;
    }
    locked = true; document.querySelectorAll('#math-life-skill-choices button').forEach((item) => { item.disabled = true; });
    button.classList.add('is-ok');
    recordAttempt(question, true, choice.id); deps?.speech?.playCorrectCue?.({ muted: deps.isMuted?.() });
    announce(`答啱喇！${question.explain}`);
    const nextButton = $('btn-math-life-skill-next'); if (nextButton) nextButton.hidden = true;
    speakThen(`答啱喇！${question.explain}你好叻！`, () => { if (nextButton) nextButton.hidden = false; });
  }
  function renderChoice(question, choice, choices) {
    const button = el('button', 'btn math-life-choice'); button.type = 'button'; button.dataset.choiceId = String(choice.id);
    if (question.kind === 'shape' || question.kind === 'pattern') {
      const shape = data().SHAPES.find((item) => item.id === choice.id);
      if (shape) button.append(shapeDrawing(shape, '#ffd064')); button.append(el('strong', '', choice.label));
    } else if (question.kind === 'bonds') {
      button.append(el('span', 'math-life-answer-number', String(choice.id)), el('span', 'math-life-answer-unit', '粒'));
    } else button.textContent = choice.label;
    if (question.kind === 'compare' && paired.left.size < Math.min(question.left, question.right)) button.disabled = true;
    button.addEventListener('click', () => answer(question, choice, button)); choices.append(button);
  }
  function renderQuestion() {
    const question = mission[index]; if (!question) return;
    locked = false; wrongAttempts = 0; compareSelection = null; paired = { left: new Set(), right: new Set() };
    $('math-life-skill-progress').textContent = `${index + 1}/${mission.length}`;
    $('math-life-skill-prompt').textContent = question.prompt || activity.title;
    $('math-life-skill-feedback').textContent = ''; $('btn-math-life-skill-next').hidden = true;
    renderQuestionVisual(question); const choices = $('math-life-skill-choices'); choices.replaceChildren();
    question.choices.forEach((choice) => renderChoice(question, choice, choices));
  }
  function start(activityId) {
    const found = data().ACTIVITIES.find((item) => item.id === activityId); if (!found) return;
    generation += 1; activity = found; mission = data().makeMission(activityId, { length: 10 }); index = 0;
    $('math-life-skill-title').textContent = found.title; $('math-life-skill-planet').textContent = `生活挑戰・${found.subtitle}`;
    $('btn-back-math-life-skill').onclick = () => deps?.openGalaxy?.(); renderQuestion(); deps.showMathScreen('lifeSkill');
    speakThen(mission[0].prompt || found.title, () => {});
  }
  function next() {
    if (!locked) return;
    if (index + 1 < mission.length) { index += 1; renderQuestion(); speakThen(mission[index].prompt || activity.title, () => {}); return; }
    const current = activity; deps.tryEarnStar?.(); deps.showMathRoundReward(`${current.title}十題完成！攞到一粒星星，你好叻呀！`, () => start(current.id));
  }
  function init(dependencies) {
    deps = dependencies; $('btn-math-life-skill-next')?.addEventListener('click', next);
    const grid = $('math-extra-mission-grid'); if (!grid) return; grid.replaceChildren();
    data().ACTIVITIES.forEach((item, index) => {
      const button = el('button', `math-extra-mission-card mission-${index + 1}`); button.type = 'button';
      const icon = ['🔎', '🧩', '🔺', '🛒', '📏'][index];
      button.append(el('span', 'math-extra-mission-icon', icon), el('span', 'math-extra-mission-location', '生活挑戰'),
        el('strong', '', item.title), el('span', 'math-extra-mission-description', item.subtitle), el('span', 'math-extra-mission-arrow', '開始 →'));
      button.setAttribute('aria-label', `生活挑戰：${item.title}。${item.subtitle}`);
      button.addEventListener('click', () => start(item.id)); grid.append(button);
    });
  }
  window.KakaMathLifeSkillsGame = { init, start };
})();

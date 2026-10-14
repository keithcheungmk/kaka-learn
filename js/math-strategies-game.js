/* 四種計算法以水果格仔操作教學；每條方法路線十題一粒星。 */
(function () {
  let deps = null, activeMethod = null, rounds = [], index = 0, question = null;
  let stage = 0, moved = 0, locked = false, generation = 0;
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  function init(injected) {
    deps = injected;
    renderCards();
    $('btn-back-math-strategy')?.addEventListener('click', backToGalaxy);
    $('btn-math-strategy-start')?.addEventListener('click', startRound);
    $('btn-math-strategy-next')?.addEventListener('click', next);
    $('btn-math-strategy-replay')?.addEventListener('click', () => open(activeMethod?.id));
    $('btn-math-strategy-finish-back')?.addEventListener('click', backToGalaxy);
  }

  function renderCards() {
    const methods = window.KakaMathStrategiesData.METHODS;
    const addition = $('math-strategy-method-grid-addition');
    const subtraction = $('math-strategy-method-grid-subtraction');
    [[addition, methods.filter((m) => m.id === 'make-ten')], [subtraction, methods.filter((m) => m.id !== 'make-ten')]].forEach(([grid, list]) => {
      if (!grid) return;
      grid.innerHTML = list.map((method) => `<button type="button" class="math-strategy-card" data-method="${esc(method.id)}"><span class="math-strategy-card-icon" aria-hidden="true">${method.icon}</span><span class="math-strategy-card-type">${esc(method.operation)}</span><strong>${esc(method.title)}</strong><span class="math-strategy-card-copy">${esc(method.cardText)}</span><span class="math-strategy-card-cta">開始闖關 →</span></button>`).join('');
      grid.querySelectorAll('[data-method]').forEach((button) => button.addEventListener('click', () => open(button.dataset.method)));
    });
  }

  function open(methodId) {
    activeMethod = window.KakaMathStrategiesData.METHODS.find((m) => m.id === methodId);
    if (!activeMethod || !deps) return;
    generation += 1;
    $('math-strategy-title').textContent = activeMethod.title;
    $('math-strategy-method-label').textContent = `水果格仔・${activeMethod.title}`;
    $('math-strategy-intro').textContent = activeMethod.intro;
    $('math-strategy-example-equation').textContent = `${activeMethod.example.a}${methodSign()}${activeMethod.example.b}＝${activeMethod.example.answer}`;
    $('math-strategy-example-steps').innerHTML = activeMethod.example.steps.map((step, i) => `<li><span>${i + 1}</span>${esc(step)}</li>`).join('');
    $('math-strategy-progress').textContent = '準備';
    $('math-strategy-intro-panel').hidden = false;
    $('math-strategy-play-panel').hidden = true;
    $('math-strategy-finish-panel').hidden = true;
    deps.showMathScreen('strategy');
    const startButton = $('btn-math-strategy-start');
    startButton.disabled = true;
    speakThen(`${activeMethod.title}。${activeMethod.intro}`, () => { startButton.disabled = false; });
  }

  function methodSign() { return activeMethod?.id === 'make-ten' ? '＋' : '－'; }
  function startRound() {
    if (!activeMethod) return;
    generation += 1;
    rounds = window.KakaMathStrategiesData.makeRound(activeMethod.id, { length: 10 });
    index = 0;
    $('math-strategy-intro-panel').hidden = true;
    $('math-strategy-finish-panel').hidden = true;
    $('math-strategy-play-panel').hidden = false;
    renderQuestion();
  }

  function renderQuestion() {
    question = rounds[index];
    if (!question) return finish();
    stage = 0; moved = 0; locked = false;
    $('math-strategy-progress').textContent = `${index + 1} / ${rounds.length}`;
    $('math-strategy-question-count').textContent = `第 ${index + 1} 題，共 ${rounds.length} 題・完成十題攞一粒星`;
    $('math-strategy-prompt').textContent = question.concretePrompt;
    $('math-strategy-equation').textContent = question.equation;
    $('math-strategy-feedback').textContent = '';
    $('math-strategy-feedback').className = 'math-strategy-feedback';
    $('math-strategy-board-hint').textContent = `${question.emoji} ${question.itemName}數字格`;
    $('math-strategy-action-copy').textContent = '';
    $('math-strategy-move-count').textContent = '';
    $('btn-math-strategy-next').hidden = true;
    renderBoard();
    updateStageCopy();
    speakThen(`${question.concretePrompt} ${$('math-strategy-action-copy').textContent}`, () => {});
  }

  function frame(title, amount, capacity, zone, clickableCount = 0) {
    const cells = Array.from({ length: capacity }, (_, i) => {
      const filled = i < amount;
      const clickable = filled && i < clickableCount;
      return `<button type="button" class="math-fruit-cell${filled ? ' is-filled' : ''}${clickable ? ' is-actionable' : ''}" ${clickable ? `data-zone="${zone}" data-cell="${i}" aria-label="移動一${esc(question.measure)}${esc(question.itemName)}"` : 'disabled aria-hidden="true"'}>${filled ? question.emoji : ''}</button>`;
    }).join('');
    return `<section class="math-fruit-group"><h4>${esc(title)} <span>${amount}/${capacity}</span></h4><div class="math-fruit-frame" style="--frame-columns:5">${cells}</div></section>`;
  }
  function tray(title, amount, zone) {
    const cells = Array.from({ length: amount }, (_, i) => `<button type="button" class="math-fruit-cell is-filled is-actionable" data-zone="${zone}" data-cell="${i}" aria-label="搬一${esc(question.measure)}${esc(question.itemName)}">${question.emoji}</button>`).join('');
    return `<section class="math-fruit-group math-fruit-tray"><h4>${esc(title)} <span>${amount} 粒</span></h4><div class="math-fruit-frame" style="--frame-columns:5">${cells || '<span class="math-fruit-empty">已搬晒喇</span>'}</div></section>`;
  }

  function renderBoard() {
    const board = $('math-strategy-board');
    if (!board || !question) return;
    const { a, b } = question;
    const takeaway = `<section class="math-fruit-group math-fruit-takeaway"><h4>已拿走／已放入 <span>${moved} 粒</span></h4><div class="math-fruit-frame" style="--frame-columns:5">${Array.from({ length: Math.max(1, moved) }, (_, i) => `<span class="math-fruit-cell is-filled is-moved" aria-hidden="true">${i < moved ? question.emoji : ''}</span>`).join('')}</div></section>`;
    if (activeMethod.id === 'make-ten') {
      const need = 10 - a;
      board.innerHTML = frame('湊十格', a + Math.min(moved, need), 10, 'none') + frame('再加水果', Math.max(0, moved - need), Math.max(1, b - need), 'none') + tray('等住加入', b - moved, 'tray') + takeaway;
    } else if (activeMethod.id === 'break-ten') {
      board.innerHTML = frame('十格', Math.max(0, 10 - moved), 10, 'take-ten', stage === 0 ? Math.min(b - moved, 10 - moved) : 0) + frame('多出嚟', Math.max(0, a - 10), 10, 'none') + takeaway;
    } else if (activeMethod.id === 'flat-ten') {
      const loose = a % 10;
      board.innerHTML = frame('先用散出嚟嘅水果減到十', Math.max(0, loose - moved), Math.max(1, loose), 'take-loose', stage === 0 ? loose - moved : 0) + frame('十格', Math.max(0, 10 - Math.max(0, moved - loose)), 10, 'take-ten-flat', stage === 1 ? b - loose - (moved - loose) : 0) + takeaway;
    } else {
      board.innerHTML = frame('由減數加到原數', Math.min(a, b + moved), a, 'none') + frame('待加入', Math.max(0, moved - (10 - b)), Math.max(1, a - 10), 'none') + tray('搬入目標格', a - b - moved, 'tray-add') + takeaway;
    }
    board.querySelectorAll('[data-zone]').forEach((button) => button.addEventListener('click', () => moveFruit(button.dataset.zone)));
  }

  function moveFruit(zone) {
    if (locked) return;
    const { a, b } = question;
    if (activeMethod.id === 'make-ten') {
      if (zone !== 'tray' || moved >= b) return;
      moved += 1; renderBoard();
      if (moved === 10 - a) { stage = 1; updateStageCopy(); }
      if (moved === b) completeQuestion(); else updateMoveCount();
      return;
    }
    if (activeMethod.id === 'break-ten' && zone === 'take-ten' && stage === 0 && moved < b) {
      moved += 1; renderBoard(); updateMoveCount();
      if (moved === b) completeQuestion();
      return;
    }
    if (activeMethod.id === 'flat-ten') {
      const loose = a % 10;
      if (stage === 0 && zone === 'take-loose') {
        moved += 1; renderBoard();
        if (moved === loose) { stage = 1; updateStageCopy(); }
        return;
      }
      if (stage === 1 && zone === 'take-ten-flat' && moved < b) {
        moved += 1; renderBoard(); updateMoveCount();
        if (moved === b) completeQuestion();
      }
      return;
    }
    if (activeMethod.id === 'think-add-subtract' && zone === 'tray-add' && moved < a - b) {
      moved += 1; renderBoard();
      if (moved === 10 - b) { stage = 1; updateStageCopy(); }
      if (moved === a - b) completeQuestion(); else updateMoveCount();
    }
  }

  function updateMoveCount() {
    $('math-strategy-move-count').textContent = `已搬 ${moved} 粒`;
  }

  function updateStageCopy() {
    const { a, b, answer } = question;
    let line = '', feedback = '';
    if (activeMethod.id === 'make-ten') {
      const need = 10 - a;
      if (stage === 0) { line = `由 ${b} 粒入面搬 ${need} 粒入十格，先湊成 10。`; feedback = `仲要搬 ${need - moved} 粒就湊到十！`; }
      else { line = `好喇，${a}＋${need}＝10。再將剩低 ${b - moved} 粒放入第二格。`; feedback = `十粒再加剩低水果，就係 ${answer} 粒。`; }
    } else if (activeMethod.id === 'break-ten') {
      line = `將 ${b} 粒由十格拿走；十格剩低 ${10 - moved} 粒，再加返外面 ${a - 10} 粒。`;
      feedback = `由十格拿走 ${b} 粒，再數埋外面嘅水果。`;
    } else if (activeMethod.id === 'flat-ten') {
      const loose = a % 10;
      if (stage === 0) { line = `先拿走散出嚟嘅 ${loose} 粒，將 ${a} 減到 10。`; feedback = `仲有 ${loose - moved} 粒散果要先拿走。`; }
      else { line = `而家 10 減剩低要拿走嘅 ${b - loose} 粒。`; feedback = `由十格再拿走 ${b - loose} 粒。`; }
    } else {
      const first = 10 - b;
      if (stage === 0) { line = `由 ${b} 開始加，先搬 ${first} 粒，去到 10。`; feedback = `仲要搬 ${first - moved} 粒先到十。`; }
      else { line = `已到 10 喇！再搬 ${a - 10} 粒，就到 ${a}。`; feedback = `總共加咗 ${answer} 粒，所以 ${a}－${b}＝${answer}。`; }
    }
    $('math-strategy-action-copy').textContent = line;
    $('math-strategy-feedback').textContent = feedback;
    if (stage > 0) speak(line);
    updateMoveCount();
  }

  function completeQuestion() {
    if (locked) return;
    locked = true;
    const message = `答啱喇！${question.explanation}你好叻！`;
    $('math-strategy-feedback').textContent = message;
    $('math-strategy-feedback').className = 'math-strategy-feedback is-correct';
    $('math-strategy-equation').textContent = question.equation.replace('？', String(question.answer));
    $('math-strategy-action-copy').textContent = question.steps.join(' → ');
    $('btn-math-strategy-next').hidden = true;
    $('btn-math-strategy-next').textContent = index === rounds.length - 1 ? '完成十題 →' : '下一題 →';
    speakThen(message, () => { $('btn-math-strategy-next').hidden = false; });
    $('math-strategy-board').querySelectorAll('button').forEach((button) => { button.disabled = true; });
  }

  function speak(message) { deps?.speak?.(message); }
  function speakThen(message, done) {
    const token = generation;
    const finish = () => { if (token === generation) done?.(); };
    if (deps?.speech?.speakThen) { deps.speech.speakThen(message, { muted: deps.isMuted?.(), rate: .88, pitch: 1.04, delayMs: 60 }, finish); return; }
    speak(message); setTimeout(finish, Math.min(6500, 900 + String(message || '').length * 90));
  }
  function next() { if (!locked) return; index += 1; if (index >= rounds.length) finish(); else renderQuestion(); }
  function finish() {
    deps?.tryEarnStar?.();
    $('math-strategy-play-panel').hidden = true;
    $('math-strategy-intro-panel').hidden = true;
    $('math-strategy-finish-panel').hidden = false;
    $('math-strategy-progress').textContent = '完成';
    $('math-strategy-finish-title').textContent = `完成${activeMethod.title}！`;
    $('math-strategy-finish-copy').textContent = '十題做完，攞到一粒星星！水果格仔做得好清楚，再玩一輪都得！';
    deps?.showMathRoundReward?.(`完成${activeMethod.title}十題，攞到一粒星星！你好叻呀！`, () => open(activeMethod.id));
  }
  function backToGalaxy() { generation += 1; deps?.openGalaxy?.(); }
  window.KakaMathStrategiesGame = { init, open };
})();

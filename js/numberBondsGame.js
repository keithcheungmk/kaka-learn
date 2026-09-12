/* 地球・數字拆解玩法：獨立模組，唔改動原有加法遊戲。 */
(function () {
  let deps = null;
  let level = null;
  let missionIndex = 0;
  let roundMissions = [];
  let roundStars = new Set();
  let slots = [];
  let dragValue = null;
  let lastPraiseIndex = -1;

  const CORRECT_PRAISES = [
    '你真聰明哦！',
    '你好叻呀！',
    '哇，好犀利啊！',
    '答得真好！',
    '你真係好醒目！',
  ];

  const $ = (id) => document.getElementById(id);
  const data = () => window.KakaNumberBondsData;
  const storage = () => deps.storage;

  function openSelect() {
    renderSelect();
    deps.showMathScreen('bondsSelect');
  }

  function renderSelect() {
    const grid = $('number-bonds-level-grid');
    if (!grid) return;
    const progress = storage().getNumberBondsProgress();
    grid.innerHTML = data().levels.map((item) => {
      const unlocked = storage().isNumberBondsLevelUnlocked(item.level);
      const done = progress.completedLevels.includes(item.level);
      return `<button type="button" class="addition-level-card number-bonds-level-card ${unlocked ? '' : 'is-locked'} ${done ? 'is-done' : ''}" data-bonds-level="${item.level}" ${unlocked ? '' : 'disabled'}>
        <span class="addition-level-kicker">${item.title}</span><strong>${item.range}</strong>
        <span class="addition-level-label">數字拆解</span><small>${item.blurb}<br>${item.missions.length} 個目標</small>
        <span class="addition-level-status">${done ? '已完成 ✓' : (unlocked ? '可以開始' : '完成 Level 1 後解鎖')}</span>
      </button>`;
    }).join('');
    grid.querySelectorAll('[data-bonds-level]').forEach((button) => {
      button.addEventListener('click', () => startLevel(Number(button.dataset.bondsLevel)));
    });
  }

  function startLevel(levelNumber) {
    const selected = data().getLevel(levelNumber);
    if (!selected || !storage().isNumberBondsLevelUnlocked(levelNumber)) return;
    level = selected;
    roundMissions = data().roundMissionsForLevel?.(level) || [...level.missions];
    roundStars = new Set();
    missionIndex = 0;
    deps.showMathScreen('bondsPlay');
    renderMission();
  }

  function renderMission() {
    const mission = roundMissions[missionIndex];
    slots = mission.pairs.map(() => [null, null]);
    $('number-bonds-play-title').textContent = level.title;
    $('number-bonds-mission-progress').textContent = `第 ${missionIndex + 1}/10 題`;
    $('number-bonds-prompt').textContent = `請將 ${mission.target} 拆成所有不同嘅兩數組合。`;
    $('number-bonds-target').textContent = mission.target;
    $('number-bonds-feedback').textContent = '';
    renderRows(mission);
    renderPool(mission.target);
    updateAnswerButton();
  }

  function renderRows(mission) {
    const root = $('number-bonds-rows');
    root.innerHTML = mission.pairs.map((pair, index) => `<div class="number-bonds-row" data-row="${index}">
      <button type="button" class="number-bonds-slot" data-slot="0" aria-label="第 ${index + 1} 組第一個數">？</button>
      <span aria-hidden="true">＋</span>
      <button type="button" class="number-bonds-slot" data-slot="1" aria-label="第 ${index + 1} 組第二個數">？</button>
      <span class="number-bonds-equals" aria-hidden="true">＝</span>
      <strong class="number-bonds-row-target" aria-label="目標數字 ${mission.target}">${mission.target}</strong>
    </div>`).join('');
    root.querySelectorAll('.number-bonds-slot').forEach((button) => {
      const row = Number(button.closest('.number-bonds-row').dataset.row);
      const slot = Number(button.dataset.slot);
      button.addEventListener('click', () => {
        slots[row][slot] = null;
        renderRows(mission);
        updateAnswerButton();
      });
      button.addEventListener('dragover', (event) => event.preventDefault());
      button.addEventListener('drop', (event) => {
        event.preventDefault();
        placeValue(row, slot, dragValue ?? Number(event.dataTransfer.getData('text/plain')));
        dragValue = null;
      });
    });
    root.querySelectorAll('.number-bonds-slot').forEach((button) => {
      const row = Number(button.closest('.number-bonds-row').dataset.row);
      const slot = Number(button.dataset.slot);
      const value = slots[row][slot];
      if (value !== null) button.textContent = value;
      button.classList.toggle('is-filled', value !== null);
    });
  }

  function renderPool(target) {
    const root = $('number-bonds-pool');
    const max = Math.max(10, target - 1);
    root.style.setProperty('--number-count', String(max));
    root.innerHTML = Array.from({ length: max }, (_, index) => index + 1).map((value) => `<button type="button" class="number-bonds-number" draggable="true" data-value="${value}">${value}</button>`).join('');
    root.querySelectorAll('.number-bonds-number').forEach((button) => {
      const value = Number(button.dataset.value);
      button.addEventListener('click', () => placeNext(value));
      button.addEventListener('dragstart', (event) => {
        dragValue = value;
        event.dataTransfer.setData('text/plain', String(value));
      });
    });
  }

  function placeNext(value) {
    for (let row = 0; row < slots.length; row += 1) {
      for (let slot = 0; slot < 2; slot += 1) {
        if (slots[row][slot] === null) { placeValue(row, slot, value); return; }
      }
    }
  }

  function placeValue(row, slot, value) {
    if (!Number.isInteger(value) || value < 1) return;
    slots[row][slot] = value;
    renderRows(roundMissions[missionIndex]);
    updateAnswerButton();
  }

  function updateAnswerButton() {
    const complete = slots.length > 0 && slots.every((pair) => pair[0] !== null && pair[1] !== null);
    $('btn-number-bonds-answer').disabled = !complete;
  }

  function checkAnswer() {
    const mission = roundMissions[missionIndex];
    const expected = mission.pairs.map((pair) => pair.join(',')).sort();
    const actual = slots.map((pair) => [...pair].sort((a, b) => a - b).join(',')).sort();
    const feedback = $('number-bonds-feedback');
    if (expected.length !== actual.length || expected.some((pair, index) => pair !== actual[index])) {
      feedback.textContent = '仲有組合未齊，或者有兩個數放錯咗；逐格撳一下可以清除。';
      feedback.className = 'feedback is-bad';
      return;
    }
    feedback.textContent = '啱晒！你搵齊所有組合！';
    feedback.className = 'feedback is-good';
    if (!mission.review) storage().completeNumberBondsMission(mission.id);
    if (!roundStars.has(mission.id)) { deps.tryEarnStar(); roundStars.add(mission.id); }
    missionIndex += 1;
    let praiseIndex = Math.floor(Math.random() * CORRECT_PRAISES.length);
    if (CORRECT_PRAISES.length > 1 && praiseIndex === lastPraiseIndex) praiseIndex = (praiseIndex + 1) % CORRECT_PRAISES.length;
    lastPraiseIndex = praiseIndex;
    const message = `答對了！${mission.target} 可以是 ${mission.pairs.map(([a, b]) => `${a} 加 ${b}`).join('，或者是 ')}。${CORRECT_PRAISES[praiseIndex]}`;
    showCorrectPopover(message, () => {
      if (missionIndex < roundMissions.length) {
        renderMission();
      } else {
        storage().completeNumberBondsLevel(level.level);
        deps.showMathRoundReward(`${level.title}完成！你已經識得拆解 ${level.range} 嘅數字。`, () => startLevel(level.level));
      }
    });
  }

  function showCorrectPopover(message, onNext) {
    const popover = $('number-bonds-correct-popover');
    const messageEl = $('number-bonds-correct-message');
    const next = $('btn-number-bonds-next');
    if (!popover || !messageEl || !next) { onNext?.(); return; }
    messageEl.textContent = message;
    popover.hidden = false;
    deps.speak?.(message);
    next.onclick = () => { popover.hidden = true; onNext?.(); };
  }

  function init(nextDeps) {
    deps = nextDeps;
    $('btn-number-bonds-answer')?.addEventListener('click', checkAnswer);
    $('btn-number-bonds-next')?.addEventListener('click', () => { $('number-bonds-correct-popover').hidden = true; });
  }

  window.KakaNumberBondsGame = { init, openSelect, startLevel };
})();

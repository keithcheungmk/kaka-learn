/** 地球加法星球 — Montessori 物件拖放＋十題一輪。 */
(function () {
  const PLANET_ID = 'compare-size';
  let deps = null, levels = [], currentLevelIndex = 0, currentMissionIndex = 0;
  let filledCount = 0, busy = false, dragState = null;
  const $ = (sel) => document.querySelector(sel);
  const storage = () => deps?.storage || window.KakaMathStorage;
  const isLevelUnlocked = (level) => storage()?.isAdditionLevelUnlocked?.(level.level) ?? level.level === 1;
  const isMissionDone = (id) => storage()?.isAdditionMissionDone?.(id) ?? false;
  const isLevelComplete = (level) => level.missions.every((mission) => isMissionDone(mission.id));

  function updateStarsDisplay() {
    const el = $('#addition-play-stars') || $('#addition-select-stars');
    if (el && deps?.loadState) el.textContent = `${deps.loadState().starsToday}/10`;
  }

  function renderEquation(mission) {
    const eq = $('#addition-equation');
    if (!eq) return;
    const second = filledCount >= mission.b ? String(mission.b) : (filledCount ? String(filledCount) : '❓');
    eq.innerHTML = `${mission.a} + <span class="eq-unknown">${second}</span> = <span class="eq-sum">${mission.targetNumber}</span>`;
    eq.classList.remove('is-pop'); void eq.offsetWidth; eq.classList.add('is-pop');
  }

  function createObject(visual) {
    const item = document.createElement('button');
    item.type = 'button'; item.className = `addition-object math-native-emoji addition-object--${visual.id}`;
    item.textContent = visual.emoji; item.setAttribute('aria-label', `一粒${visual.label}`); item.dataset.draggable = '1';
    return item;
  }
  function getEmptyCells() { return [...document.querySelectorAll('#addition-slot .addition-slot-cell.is-empty')]; }
  function syncFilled() {
    filledCount = getEmptyCells().filter((cell) => cell.querySelector('.addition-object')).length;
    getEmptyCells().forEach((cell) => cell.classList.remove('is-next'));
    getEmptyCells().find((cell) => !cell.querySelector('.addition-object'))?.classList.add('is-next');
  }

  function renderSlot(mission) {
    const slot = $('#addition-slot'); if (!slot) return;
    slot.innerHTML = ''; filledCount = 0;
    for (let i = 0; i < mission.a; i += 1) {
      const cell = document.createElement('div'); cell.className = 'addition-slot-cell is-preset'; cell.appendChild(createObject(mission.visual)); slot.appendChild(cell);
    }
    const divider = document.createElement('div'); divider.className = 'addition-slot-divider'; divider.textContent = '+'; slot.appendChild(divider);
    for (let i = 0; i < mission.b; i += 1) { const cell = document.createElement('div'); cell.className = 'addition-slot-cell is-empty'; slot.appendChild(cell); }
    const frame = $('#addition-ten-frame');
    if (frame) {
      frame.hidden = mission.level !== 2;
      frame.innerHTML = mission.level === 2
        ? `<span class="addition-ten-frame-label">湊十法：先填滿 10 格，再數剩低</span><span class="addition-ten-frame-cells">${Array.from({ length: 10 }, (_, index) => `<span class="addition-ten-frame-cell${index < mission.a ? ' is-filled' : ''}${index === mission.a ? ' is-next' : ''}">${index < mission.a ? mission.visual.emoji : ''}</span>`).join('')}</span>`
        : '';
    }
    syncFilled();
  }

  function renderWarehouse(mission) {
    const box = $('#addition-warehouse'); if (!box) return;
    box.innerHTML = `<div class="addition-warehouse-label">拖 ${mission.visual.label} 入白板，或者撳一下</div>`;
    for (let i = 0; i < Math.max(mission.b + 2, 7); i += 1) {
      const object = createObject(mission.visual); object.dataset.warehouse = '1'; object.addEventListener('click', onWarehouseClick); bindDrag(object); box.appendChild(object);
    }
  }

  function placeObject(source, cell, flyFrom) {
    if (!cell || cell.querySelector('.addition-object')) return;
    const go = () => {
      const mission = levels[currentLevelIndex].missions[currentMissionIndex];
      const object = createObject(mission.visual); object.classList.add('is-snapped'); object.dataset.warehouse = '0';
      object.addEventListener('click', (event) => { event.stopPropagation(); returnObject(object); }); bindDrag(object); cell.appendChild(object);
      if (source?.dataset.warehouse === '1') source.remove();
      syncFilled(); renderEquation(mission); deps?.speak?.(filledCount === mission.b ? `${filledCount}粒${mission.visual.label}` : `${filledCount}`);
      if (filledCount >= mission.b) onComplete(mission, levels[currentLevelIndex]);
    };
    if (!flyFrom) return go();
    const ghost = flyFrom.cloneNode(true); ghost.classList.add('is-flying');
    const from = flyFrom.getBoundingClientRect(), to = cell.getBoundingClientRect();
    ghost.style.cssText = `position:fixed;z-index:50;width:${from.width}px;height:${from.height}px;left:${from.left}px;top:${from.top}px;`;
    document.body.appendChild(ghost); requestAnimationFrame(() => { ghost.style.left = `${to.left}px`; ghost.style.top = `${to.top}px`; });
    setTimeout(() => { ghost.remove(); go(); }, 300);
  }

  function returnObject(object) {
    if (busy) return;
    const mission = levels[currentLevelIndex].missions[currentMissionIndex]; object.remove();
    const replacement = createObject(mission.visual); replacement.dataset.warehouse = '1'; replacement.addEventListener('click', onWarehouseClick); bindDrag(replacement);
    $('#addition-warehouse')?.appendChild(replacement); syncFilled(); renderEquation(mission);
  }
  function onWarehouseClick(event) {
    if (busy || dragState) return;
    const cell = getEmptyCells().find((item) => !item.querySelector('.addition-object')); if (cell) placeObject(event.currentTarget, cell, event.currentTarget);
  }

  function bindDrag(element) {
    element.addEventListener('pointerdown', (event) => {
      if (busy) return; event.preventDefault();
      dragState = { element, id: event.pointerId, warehouse: element.dataset.warehouse === '1', cell: element.closest('.addition-slot-cell'), x: event.clientX, y: event.clientY, ghost: null, moved: false };
      element.setPointerCapture(event.pointerId); element.classList.add('is-dragging');
      const move = (nextEvent) => {
        if (Math.hypot(nextEvent.clientX - dragState.x, nextEvent.clientY - dragState.y) < 8) return;
        dragState.moved = true;
        if (!dragState.ghost) {
          const rect = element.getBoundingClientRect(); dragState.ghost = element.cloneNode(true); dragState.ghost.className = 'addition-object is-flying';
          dragState.ghost.style.cssText = `position:fixed;z-index:50;width:${rect.width}px;height:${rect.height}px;left:${rect.left}px;top:${rect.top}px;`; document.body.appendChild(dragState.ghost);
        }
        dragState.ghost.style.left = `${nextEvent.clientX - dragState.ghost.offsetWidth / 2}px`; dragState.ghost.style.top = `${nextEvent.clientY - dragState.ghost.offsetHeight / 2}px`;
      };
      const up = (upEvent) => {
        element.releasePointerCapture(upEvent.pointerId); element.classList.remove('is-dragging'); element.removeEventListener('pointermove', move); element.removeEventListener('pointerup', up); dragState.ghost?.remove();
        const state = dragState; dragState = null; if (!state.moved) return;
        const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest?.('.addition-slot-cell.is-empty,#addition-warehouse');
        if (target?.id === 'addition-warehouse' && state.cell) returnObject(element);
        else if (target?.classList?.contains('is-empty') && !target.querySelector('.addition-object')) {
          if (state.warehouse) placeObject(element, target); else if (state.cell !== target) { target.appendChild(element); syncFilled(); renderEquation(levels[currentLevelIndex].missions[currentMissionIndex]); }
        }
      };
      element.addEventListener('pointermove', move); element.addEventListener('pointerup', up);
    });
  }

  function showReward(level) {
    const overlay = $('#math-round-finish'); if (!overlay) return;
    const msg = $('#math-round-finish-msg'); if (msg) msg.textContent = `${level.title}完成！攞到一個獎勵！`;
    overlay.hidden = false; deps?.speech?.playStarCue?.({ muted: deps.isMuted?.() }); deps?.speak?.('今輪玩完喇！你好叻呀！攞到一個獎勵！'); deps?.playMathStarReward?.();
    $('#btn-math-round-again').onclick = () => { overlay.hidden = true; startMission(currentLevelIndex, 0); };
    $('#btn-math-round-galaxy').onclick = () => { overlay.hidden = true; deps?.openGalaxy?.(); };
  }

  function onComplete(mission, level) {
    if (busy) return; busy = true; $('#addition-slot')?.classList.add('is-merging'); deps?.speech?.playCorrectCue?.({ muted: deps.isMuted?.() }); deps?.speak?.(`${mission.a}加${mission.b}等於${mission.targetNumber}`);
    setTimeout(() => {
      $('#addition-slot')?.classList.remove('is-merging');
      if (!isMissionDone(mission.id)) { storage()?.completeAdditionMission?.(mission.id); deps?.tryEarnStar?.(); }
      updateStarsDisplay();
      if (currentMissionIndex < level.missions.length - 1) { busy = false; currentMissionIndex += 1; startMission(currentLevelIndex, currentMissionIndex); }
      else { storage()?.completeAdditionLevel?.(level.level); if (level.level === 1) storage()?.unlockAdditionLevel?.(2); if (!deps?.isPlanetLit?.(PLANET_ID)) deps?.lightPlanet?.(PLANET_ID); busy = false; showReward(level); }
    }, 650);
  }

  function startMission(levelIndex, missionIndex) {
    currentLevelIndex = levelIndex; currentMissionIndex = missionIndex; busy = false; dragState = null;
    const level = levels[levelIndex], mission = level.missions[missionIndex];
    $('#addition-play-title').textContent = level.title; $('#addition-scenario').textContent = `${mission.scenario} · ${mission.visual.emoji}`; $('#addition-desc').textContent = mission.desc;
    $('#addition-mission-progress').textContent = `今輪第 ${missionIndex + 1} / ${level.missions.length} 題`; $('#addition-feedback').textContent = '';
    renderSlot(mission); renderWarehouse(mission); renderEquation(mission); updateStarsDisplay(); deps.showMathScreen('additionPlay'); deps.speak(mission.desc);
  }

  function renderLevelSelect() {
    const grid = $('#addition-level-grid'); if (!grid) return; grid.innerHTML = '';
    levels.forEach((level, index) => {
      const unlocked = isLevelUnlocked(level), complete = isLevelComplete(level), button = document.createElement('button');
      button.type = 'button'; button.className = `addition-level-card${unlocked ? '' : ' is-locked'}${complete ? ' is-done' : ''}`; button.style.setProperty('--addition-accent', level.color); button.disabled = !unlocked;
      button.innerHTML = `<span class="addition-level-kicker">LEVEL ${level.level}</span><strong>${level.targetRange}</strong><span class="addition-level-label">${level.title.split('・')[1]}</span><small>${level.blurb}</small><span class="addition-level-status">${complete ? '已完成・可以再玩' : unlocked ? '10 題任務' : '完成 Level 1 後解鎖'}</span>`;
      button.onclick = () => { const first = level.missions.findIndex((mission) => !isMissionDone(mission.id)); startMission(index, first >= 0 ? first : 0); }; grid.appendChild(button);
    });
    updateStarsDisplay(); deps.showMathScreen('additionSelect');
  }

  function openEarthAddition() { deps.updateState({ currentPlanetId: PLANET_ID }); renderLevelSelect(); }
  function init(options) { deps = options; levels = window.KakaAdditionData?.additionLevels || []; $('#btn-back-math-addition-select')?.addEventListener('click', () => deps.openHub()); $('#btn-back-math-addition-play')?.addEventListener('click', () => renderLevelSelect()); return levels.length > 0; }
  window.KakaAdditionGame = { init, openEarthAddition, renderLevelSelect, startMission };
})();

/** 地球加法星球 — Montessori 物件拖放＋十題一輪。 */
(function () {
  const PLANET_ID = 'compare-size';
  let deps = null, levels = [], currentLevelIndex = 0, currentMissionIndex = 0;
  let filledCount = 0, busy = false, dragState = null, suppressClickUntil = 0, flightTimer = null;
  const $ = (sel) => document.querySelector(sel);
  const storage = () => deps?.storage || window.KakaMathStorage;
  const isLevelUnlocked = (level) => storage()?.isAdditionLevelUnlocked?.(level.level) ?? level.level === 1;
  const isMissionDone = (id) => storage()?.isAdditionMissionDone?.(id) ?? false;
  const isLevelComplete = (level) => level.missions.every((mission) => isMissionDone(mission.id));
  function shuffleMissions(missions) {
    const shuffled = [...missions];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function updateStarsDisplay() {
    const el = $('#addition-play-stars') || $('#addition-select-stars');
    if (el && deps?.loadState) el.textContent = `${deps.loadState().starsToday}/10`;
  }

  function renderEquation(mission) {
    const eq = $('#addition-equation');
    if (!eq) return;
    const total = getBoardObjects().length;
    const added = Math.max(0, total - mission.a);
    const second = added ? String(added) : '❓';
    const sum = added ? String(total) : String(mission.targetNumber);
    eq.innerHTML = `${mission.a} + <span class="eq-unknown">${second}</span> = <span class="eq-sum">${sum}</span>`;
    eq.classList.remove('is-pop'); void eq.offsetWidth; eq.classList.add('is-pop');
  }

  function createObject(visual) {
    const item = document.createElement('button');
    item.type = 'button'; item.className = `addition-object math-native-emoji addition-object--${visual.id}`;
    item.textContent = visual.emoji; item.setAttribute('aria-label', `一${visual.measure}${visual.label}`); item.dataset.draggable = '1';
    return item;
  }
  function clearTransientObjects() {
    if (flightTimer) { clearTimeout(flightTimer); flightTimer = null; }
    document.querySelectorAll('.addition-object.is-flying').forEach((object) => object.remove());
  }
  function getBoardObjects() { return [...document.querySelectorAll('#addition-slot .addition-object[data-board-object="1"]')]; }
  function syncFilled() {
    const mission = levels[currentLevelIndex]?.missions[currentMissionIndex];
    filledCount = Math.max(0, getBoardObjects().length - (mission?.a || 0));
  }

  function renderSlot(mission) {
    const slot = $('#addition-slot'); if (!slot) return;
    slot.innerHTML = ''; filledCount = 0; slot.dataset.target = String(mission.targetNumber);
    for (let i = 0; i < mission.a; i += 1) {
      const object = createObject(mission.visual); object.dataset.boardObject = '1'; object.dataset.preset = '1'; bindDrag(object); slot.appendChild(object);
    }
    const divider = document.createElement('div'); divider.className = 'addition-slot-divider'; divider.textContent = '+'; slot.appendChild(divider);
    syncFilled();
    positionBoardObjects();
  }

  function renderWarehouse(mission) {
    const box = $('#addition-warehouse'); if (!box) return;
    box.innerHTML = `<div class="addition-warehouse-label">拖 ${mission.visual.label} 入白板，或者撳一下</div>`;
    for (let i = 0; i < Math.max(mission.b + 2, 7); i += 1) {
      const object = createObject(mission.visual); object.dataset.warehouse = '1'; object.addEventListener('click', onWarehouseClick); bindDrag(object); box.appendChild(object);
    }
  }

  function positionBoardObject(object, clientX = null, clientY = null) {
    const board = $('#addition-slot'); if (!board || !object) return;
    const rect = board.getBoundingClientRect();
    const width = object.offsetWidth || 58; const height = object.offsetHeight || 68;
    const x = clientX === null ? rect.left + Math.random() * Math.max(1, rect.width - width) : clientX - width / 2;
    const y = clientY === null ? rect.top + Math.random() * Math.max(1, rect.height - height) : clientY - height / 2;
    object.style.left = `${Math.max(4, Math.min(rect.width - width - 4, x - rect.left))}px`;
    object.style.top = `${Math.max(4, Math.min(rect.height - height - 4, y - rect.top))}px`;
  }

  function positionBoardObjects() {
    const board = $('#addition-slot'); if (!board) return;
    const rect = board.getBoundingClientRect();
    const placed = [];
    const divider = { x: rect.width / 2 - 42, y: rect.height / 2 - 42, w: 84, h: 84 };
    const leftRegion = { x: 8, y: 8, w: Math.max(120, rect.width * 0.42), h: Math.max(1, rect.height - 16) };
    getBoardObjects().forEach((object) => {
      const width = object.offsetWidth || 58; const height = object.offsetHeight || 68;
      let chosen = null;
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const candidate = {
          x: leftRegion.x + Math.random() * Math.max(1, leftRegion.w - width),
          y: leftRegion.y + Math.random() * Math.max(1, leftRegion.h - height),
          w: width,
          h: height,
        };
        const padded = { x: candidate.x - 12, y: candidate.y - 12, w: candidate.w + 24, h: candidate.h + 24 };
        const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
        if (!overlaps(padded, divider) && placed.every((item) => !overlaps(padded, item))) { chosen = candidate; break; }
      }
      if (!chosen) chosen = { x: leftRegion.x + (placed.length % 4) * Math.max(64, width + 8), y: leftRegion.y + Math.floor(placed.length / 4) * Math.max(76, height + 8), w: width, h: height };
      object.style.left = `${Math.max(4, Math.min(rect.width - width - 4, chosen.x))}px`;
      object.style.top = `${Math.max(4, Math.min(rect.height - height - 4, chosen.y))}px`;
      placed.push(chosen);
    });
  }

  function placeObject(source, clientX = null, clientY = null, flyFrom) {
    const board = $('#addition-slot'); if (!board) return;
    const go = () => {
      const mission = levels[currentLevelIndex].missions[currentMissionIndex];
      const object = createObject(mission.visual); object.classList.add('is-snapped'); object.dataset.warehouse = '0'; object.dataset.boardObject = '1';
      object.addEventListener('click', (event) => { event.stopPropagation(); if (Date.now() < suppressClickUntil) return; returnObject(object); }); bindDrag(object); board.appendChild(object); positionBoardObject(object, clientX, clientY);
      if (source?.dataset.warehouse === '1') source.remove();
      syncFilled(); renderEquation(mission); deps?.speak?.(filledCount === mission.b ? `${filledCount}${mission.visual.measure}${mission.visual.label}` : `${filledCount}`);
    };
    if (!flyFrom) return go();
    const ghost = flyFrom.cloneNode(true); ghost.classList.add('is-flying');
    const from = flyFrom.getBoundingClientRect(), boardRect = board.getBoundingClientRect();
    ghost.style.cssText = `position:fixed;z-index:50;width:${from.width}px;height:${from.height}px;left:${from.left}px;top:${from.top}px;`;
    document.body.appendChild(ghost); requestAnimationFrame(() => { ghost.style.left = `${boardRect.left + boardRect.width / 2}px`; ghost.style.top = `${boardRect.top + boardRect.height / 2}px`; });
    flightTimer = setTimeout(() => { flightTimer = null; ghost.remove(); go(); }, 300);
  }

  function returnObject(object) {
    if (busy) return;
    const mission = levels[currentLevelIndex].missions[currentMissionIndex]; object.remove();
    const replacement = createObject(mission.visual); replacement.dataset.warehouse = '1'; replacement.addEventListener('click', onWarehouseClick); bindDrag(replacement);
    $('#addition-warehouse')?.appendChild(replacement); syncFilled(); renderEquation(mission);
  }
  function onWarehouseClick(event) {
    if (busy || dragState || Date.now() < suppressClickUntil) return;
    placeObject(event.currentTarget);
  }

  function answer(mission) {
    if (busy) return;
    const feedback = $('#addition-feedback');
    const total = getBoardObjects().length;
    if (total !== mission.targetNumber) {
      const difference = Math.abs(mission.targetNumber - total);
      const measureName = `${mission.visual.measure}${mission.visual.label}`;
      const message = total < mission.targetNumber
        ? `而家有 ${total}${measureName}，仲差 ${difference}${measureName}，再撳回答。`
        : `而家有 ${total}${measureName}，多咗 ${difference}${measureName}，請移走再撳回答。`;
      if (feedback) feedback.textContent = message;
      deps?.speak?.(message);
      return;
    }
    if (feedback) feedback.textContent = '答啱喇！';
    onComplete(mission, levels[currentLevelIndex]);
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
        suppressClickUntil = Date.now() + 350;
        const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest?.('#addition-slot,#addition-warehouse');
        if (target?.id === 'addition-warehouse' && !state.warehouse) returnObject(element);
        else if (target?.id === 'addition-slot') {
          if (state.warehouse) placeObject(element, upEvent.clientX, upEvent.clientY);
          else { positionBoardObject(element, upEvent.clientX, upEvent.clientY); syncFilled(); renderEquation(levels[currentLevelIndex].missions[currentMissionIndex]); }
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
    clearTransientObjects();
    currentLevelIndex = levelIndex; currentMissionIndex = missionIndex; busy = false; dragState = null; suppressClickUntil = 0;
    const level = levels[levelIndex], mission = level.missions[missionIndex];
    $('#addition-play-title').textContent = level.title; $('#addition-scenario').textContent = `${mission.visual.emoji} ${mission.scenario}`; $('#addition-desc').textContent = `已有 ${mission.a}${mission.visual.measure}${mission.visual.label}，要有 ${mission.targetNumber}${mission.visual.measure}${mission.visual.label}，仲差幾多？`;
    const boardLabel = document.querySelector('.addition-board-label'); if (boardLabel) boardLabel.textContent = '將物件放埋一齊';
    $('#addition-mission-progress').textContent = `今輪第 ${missionIndex + 1} / ${level.missions.length} 題`; $('#addition-feedback').textContent = '';
    renderSlot(mission); renderWarehouse(mission); renderEquation(mission); updateStarsDisplay(); deps.showMathScreen('additionPlay');
    requestAnimationFrame(() => positionBoardObjects());
    deps.speak(mission.desc);
  }

  function renderLevelSelect() {
    const grid = $('#addition-level-grid'); if (!grid) return; grid.innerHTML = '';
    levels.forEach((level, index) => {
      const unlocked = isLevelUnlocked(level), complete = isLevelComplete(level), button = document.createElement('button');
      button.type = 'button'; button.className = `addition-level-card${unlocked ? '' : ' is-locked'}${complete ? ' is-done' : ''}`; button.style.setProperty('--addition-accent', level.color); button.disabled = !unlocked;
      const visual = level.level === 1 ? '🍓 ＋ 🍓' : '🔟 ＋ 🐥';
      button.innerHTML = `<span class="addition-level-kicker">LEVEL ${level.level}</span><span class="addition-level-visual" aria-hidden="true">${visual}</span><strong>${level.targetRange}</strong><span class="addition-level-label">${level.title.split('・')[1]}</span><small>${level.blurb}</small><span class="addition-level-status">${complete ? '已完成・再玩' : unlocked ? '10 題任務' : '完成 Level 1 後解鎖'}</span>`;
      button.onclick = () => { const first = level.missions.findIndex((mission) => !isMissionDone(mission.id)); startMission(index, first >= 0 ? first : 0); }; grid.appendChild(button);
    });
    updateStarsDisplay(); deps.showMathScreen('additionSelect');
  }

  function openEarthAddition() { deps.updateState({ currentPlanetId: PLANET_ID }); renderLevelSelect(); }
  function init(options) { deps = options; levels = (window.KakaAdditionData?.additionLevels || []).map((level) => ({ ...level, missions: shuffleMissions(level.missions) })); $('#btn-back-math-addition-select')?.addEventListener('click', () => deps.openGalaxy()); $('#btn-back-math-addition-play')?.addEventListener('click', () => renderLevelSelect()); $('#btn-addition-answer')?.addEventListener('click', () => { const mission = levels[currentLevelIndex]?.missions[currentMissionIndex]; if (mission) answer(mission); }); return levels.length > 0; }
  window.KakaAdditionGame = { init, openEarthAddition, renderLevelSelect, startMission };
})();

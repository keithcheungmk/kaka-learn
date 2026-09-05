/** 地球加法星球 — 能量方塊遊戲 */
(function () {
  const PLANET_ID = 'compare-size';
  let deps = null;
  let levels = [];
  let currentLevelIndex = 0;
  let currentMissionIndex = 0;
  let filledCount = 0;
  let busy = false;
  let dragState = null;
  const $ = (sel) => document.querySelector(sel);
  const storage = () => deps?.storage || window.KakaMathStorage;
  const isLevelUnlocked = (t) => storage()?.isAdditionBaseUnlocked?.(t) ?? t <= 5;
  const isMissionDone = (id) => storage()?.isAdditionMissionDone?.(id) ?? false;
  const isLevelComplete = (lv) => lv.missions.every((m) => isMissionDone(m.id));

  function updateStarsDisplay() {
    const el = $('#addition-play-stars') || $('#addition-select-stars');
    if (el && deps?.loadState) el.textContent = `${deps.loadState().starsToday}/10`;
  }

  function renderEquation(mission, level) {
    const eq = $('#addition-equation');
    if (!eq) return;
    let mid = filledCount <= 0 ? '<span class="eq-unknown">❓</span>' : filledCount < mission.b ? `<span class="eq-unknown">${filledCount}</span>` : String(mission.b);
    eq.innerHTML = `${mission.a} + ${mid} = <span class="eq-sum">${level.targetNumber}</span>`;
    eq.classList.remove('is-pop');
    void eq.offsetWidth;
    eq.classList.add('is-pop');
  }

  function createBlock(kind) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `addition-block addition-block--${kind}`;
    if (kind === 'gold') b.dataset.draggable = '1';
    return b;
  }

  function getEmptyCells() {
    return [...document.querySelectorAll('#addition-slot .addition-slot-cell.is-empty')];
  }

  function syncFilled() {
    filledCount = getEmptyCells().filter((c) => c.querySelector('.addition-block')).length;
    getEmptyCells().forEach((c) => c.classList.remove('is-next'));
    const n = getEmptyCells().find((c) => !c.querySelector('.addition-block'));
    if (n) n.classList.add('is-next');
  }

  function renderSlot(mission) {
    const slot = $('#addition-slot');
    if (!slot) return;
    slot.innerHTML = '';
    filledCount = 0;
    for (let i = 0; i < mission.a; i += 1) {
      const c = document.createElement('div');
      c.className = 'addition-slot-cell is-preset';
      const b = createBlock('blue');
      b.dataset.draggable = '0';
      c.appendChild(b);
      slot.appendChild(c);
    }
    if (mission.a && mission.b) {
      const d = document.createElement('div');
      d.className = 'addition-slot-divider';
      slot.appendChild(d);
    }
    for (let i = 0; i < mission.b; i += 1) {
      const c = document.createElement('div');
      c.className = 'addition-slot-cell is-empty';
      slot.appendChild(c);
    }
    syncFilled();
  }

  function renderWarehouse(mission) {
    const box = $('#addition-warehouse');
    if (!box) return;
    box.innerHTML = '<div class="addition-warehouse-label">拖入或者撳能量方塊 ⬇️</div>';
    for (let i = 0; i < mission.b + Math.max(2, Math.ceil(mission.b / 2)); i += 1) {
      const b = createBlock('gold');
      b.dataset.warehouse = '1';
      b.addEventListener('click', onWarehouseClick);
      bindDrag(b);
      box.appendChild(b);
    }
  }

  function placeBlock(source, cell, flyFrom) {
    if (!cell || cell.querySelector('.addition-block')) return;
    const go = () => {
      const p = createBlock('gold');
      p.classList.add('is-snapped');
      bindDrag(p);
      p.addEventListener('click', (e) => { e.stopPropagation(); returnBlock(p); });
      cell.appendChild(p);
      if (source?.dataset.warehouse === '1') source.remove();
      syncFilled();
      const m = levels[currentLevelIndex].missions[currentMissionIndex];
      renderEquation(m, levels[currentLevelIndex]);
      if (filledCount >= m.b) onComplete(m, levels[currentLevelIndex]);
    };
    if (flyFrom) {
      const g = flyFrom.cloneNode(true);
      g.classList.add('is-flying');
      const rf = flyFrom.getBoundingClientRect();
      const rt = cell.getBoundingClientRect();
      g.style.cssText = `position:fixed;z-index:50;width:${rf.width}px;height:${rf.height}px;left:${rf.left}px;top:${rf.top}px;`;
      document.body.appendChild(g);
      requestAnimationFrame(() => { g.style.left = `${rt.left}px`; g.style.top = `${rt.top}px`; });
      setTimeout(() => { g.remove(); go(); }, 360);
    } else go();
  }

  function returnBlock(block) {
    if (block.dataset.warehouse === '1' || busy) return;
    block.remove();
    const b = createBlock('gold');
    b.dataset.warehouse = '1';
    b.addEventListener('click', onWarehouseClick);
    bindDrag(b);
    $('#addition-warehouse')?.appendChild(b);
    syncFilled();
    renderEquation(levels[currentLevelIndex].missions[currentMissionIndex], levels[currentLevelIndex]);
  }

  function onWarehouseClick(e) {
    if (busy || dragState) return;
    const cells = getEmptyCells();
    const cell = cells.find((c) => !c.querySelector('.addition-block'));
    if (cell) placeBlock(e.currentTarget, cell, e.currentTarget);
  }

  function bindDrag(el) {
    el.addEventListener('pointerdown', (e) => {
      if (busy || el.dataset.draggable === '0') return;
      e.preventDefault();
      dragState = { el, id: e.pointerId, wh: el.dataset.warehouse === '1', cell: el.closest('.addition-slot-cell'), ghost: null, x: e.clientX, y: e.clientY, moved: false };
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
      const move = (ev) => {
        if (Math.hypot(ev.clientX - dragState.x, ev.clientY - dragState.y) < 8) return;
        dragState.moved = true;
        if (!dragState.ghost) {
          const r = el.getBoundingClientRect();
          dragState.ghost = el.cloneNode(true);
          dragState.ghost.className = 'addition-block addition-block--gold is-flying';
          dragState.ghost.style.cssText = `position:fixed;z-index:50;width:${r.width}px;height:${r.height}px;left:${r.left}px;top:${r.top}px;`;
          document.body.appendChild(dragState.ghost);
        }
        dragState.ghost.style.left = `${ev.clientX - dragState.ghost.offsetWidth / 2}px`;
        dragState.ghost.style.top = `${ev.clientY - dragState.ghost.offsetHeight / 2}px`;
      };
      const up = (ev) => {
        el.releasePointerCapture(ev.pointerId);
        el.classList.remove('is-dragging');
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        dragState.ghost?.remove();
        const ds = dragState;
        dragState = null;
        if (!ds.moved) return;
        if (ds.ghost) ds.ghost.style.pointerEvents = 'none';
        const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('.addition-slot-cell.is-empty,#addition-warehouse,.addition-slot-cell');
        if (t?.closest('#addition-warehouse') && ds.cell && !ds.wh) returnBlock(el);
        else if (t?.classList?.contains('is-empty') && !t.querySelector('.addition-block')) {
          if (ds.wh) placeBlock(el, t);
          else if (ds.cell !== t) { t.appendChild(el); syncFilled(); const m = levels[currentLevelIndex].missions[currentMissionIndex]; renderEquation(m, levels[currentLevelIndex]); if (filledCount >= m.b) onComplete(m, levels[currentLevelIndex]); }
        }
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
    });
  }

  function onComplete(mission, level) {
    if (busy) return;
    busy = true;
    $('#addition-slot')?.classList.add('is-merging');
    deps?.speech?.playCorrectCue?.({ muted: deps.isMuted?.() });
    const ov = $('#addition-merge-overlay');
    if (ov) { ov.hidden = false; ov.innerHTML = `<div class="addition-merge-block"><span class="merge-num">${level.targetNumber}</span><span class="merge-face">😊</span></div>`; }
    deps?.speak?.(`${mission.a}加${mission.b}等於${level.targetNumber}`);
    setTimeout(() => {
      $('#addition-slot')?.classList.remove('is-merging');
      if (ov) { ov.hidden = true; ov.innerHTML = ''; }
      const wasLit = deps.isPlanetLit?.(PLANET_ID);
      if (!isMissionDone(mission.id)) {
        storage()?.completeAdditionMission?.(mission.id);
        const { gained } = deps.tryEarnStar?.() || {};
        if (gained) { deps.speech?.playStarCue?.({ muted: deps.isMuted?.() }); deps.playMathStarReward?.(); }
        $('#addition-feedback').textContent = '好叻呀！' + (gained ? ' ★' : '');
      }
      updateStarsDisplay();
      if (!wasLit && deps.isPlanetLit?.(PLANET_ID)) {
        const f = deps.getPlanetById?.(PLANET_ID);
        const t = deps.getPlanetById?.(deps.getNextPlanetId?.(PLANET_ID));
        busy = false;
        if (f && t && f.id !== t.id) deps.offerWarpHop?.(f, t);
        else renderLevelSelect();
        return;
      }
      busy = false;
      if (currentMissionIndex < level.missions.length - 1) { currentMissionIndex += 1; startMission(currentLevelIndex, currentMissionIndex); }
      else renderLevelSelect();
    }, 900);
  }

  function startMission(li, mi) {
    currentLevelIndex = li;
    currentMissionIndex = mi;
    busy = false;
    dragState = null;
    const level = levels[li];
    const mission = level.missions[mi];
    $('#addition-play-title').textContent = level.title;
    $('#addition-scenario').textContent = mission.scenario;
    $('#addition-desc').textContent = mission.desc;
    $('#addition-mission-progress').textContent = `任務 ${mi + 1}/${level.missions.length}`;
    $('#addition-feedback').textContent = '';
    renderSlot(mission);
    renderWarehouse(mission);
    renderEquation(mission, level);
    updateStarsDisplay();
    deps.showMathScreen('additionPlay');
    deps.speak(mission.desc);
  }

  function renderLevelSelect() {
    const grid = $('#addition-level-grid');
    grid.innerHTML = '';
    levels.forEach((level, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `addition-level-card${isLevelUnlocked(level.targetNumber) ? '' : ' is-locked'}${isLevelComplete(level) ? ' is-done' : ''}`;
      btn.style.setProperty('--addition-accent', level.color);
      btn.disabled = !isLevelUnlocked(level.targetNumber);
      btn.innerHTML = `<span class="addition-level-num">${level.targetNumber}</span><span class="addition-level-label">${level.title}</span>`;
      btn.onclick = () => {
        const first = level.missions.findIndex((m) => !isMissionDone(m.id));
        startMission(idx, first >= 0 ? first : 0);
      };
      grid.appendChild(btn);
    });
    updateStarsDisplay();
    deps.showMathScreen('additionSelect');
  }

  function openEarthAddition() {
    deps.updateState({ currentPlanetId: PLANET_ID });
    renderLevelSelect();
  }

  function init(options) {
    deps = options;
    levels = window.KakaAdditionData?.additionLevels || [];
    $('#btn-back-math-addition-select')?.addEventListener('click', () => deps.openHub());
    $('#btn-back-math-addition-play')?.addEventListener('click', () => renderLevelSelect());
    return levels.length > 0;
  }

  window.KakaAdditionGame = { init, openEarthAddition, renderLevelSelect, startMission };
})();

/** 月球減法拿走 — 以拖走具體物件理解「原有 − 拿走 = 剩低」。 */
(function () {
  const PLANET_ID = 'moon';
  let deps = null, levels = [], currentLevelIndex = 0, currentMissionIndex = 0, removedCount = 0, busy = false;
  const $ = (selector) => document.querySelector(selector);
  const storage = () => deps?.storage || window.KakaMathStorage;
  function done(id) { return storage()?.isSubtractionMissionDone?.(id) ?? false; }
  function unlocked(level) { return storage()?.isSubtractionLevelUnlocked?.(level) ?? level === 1; }
  function updateStars() { const el = $('#subtraction-play-stars') || $('#subtraction-select-stars'); if (el) el.textContent = `${deps.loadState().starsToday}/10`; }
  function object(visual) { const el = document.createElement('button'); el.type = 'button'; el.className = `subtraction-object math-native-emoji subtraction-object--${visual.id}`; el.textContent = visual.emoji; el.setAttribute('aria-label', `一粒${visual.label}`); el.dataset.object = '1'; return el; }
  function renderEquation(mission) { const el = $('#subtraction-equation'); if (el) el.innerHTML = `${mission.start} − <span class="subtraction-removed">${removedCount || '?'}</span> = <span class="subtraction-result">${mission.remaining}</span>`; }
  function sync(mission) {
    removedCount = document.querySelectorAll('#subtraction-takeaway .subtraction-object').length;
    renderEquation(mission);
    $('#subtraction-slot')?.classList.toggle('is-ready', removedCount >= mission.remove);
  }
  function finish(mission, level) {
    if (busy) return; busy = true; deps.speech?.playCorrectCue?.({ muted: deps.isMuted?.() }); deps.speak?.(`${mission.start}減${mission.remove}等於${mission.remaining}`);
    setTimeout(() => {
      if (!done(mission.id)) { storage()?.completeSubtractionMission?.(mission.id); deps.tryEarnStar?.(); }
      updateStars();
      if (currentMissionIndex < level.missions.length - 1) { currentMissionIndex += 1; busy = false; startMission(currentLevelIndex, currentMissionIndex); return; }
      storage()?.completeSubtractionLevel?.(level.level); if (!deps.isPlanetLit?.(PLANET_ID)) deps.lightPlanet?.(PLANET_ID);
      busy = false; showReward(level);
    }, 550);
  }
  function moveToTakeaway(el, mission) { if (busy || !el?.parentElement || removedCount >= mission.remove) return; $('#subtraction-takeaway')?.appendChild(el); el.classList.add('is-taken'); sync(mission); if (removedCount >= mission.remove) finish(mission, levels[currentLevelIndex]); }
  function bindObject(el, mission) {
    el.addEventListener('click', () => moveToTakeaway(el, mission));
    el.addEventListener('pointerdown', (event) => {
      if (busy) return; event.preventDefault(); el.setPointerCapture(event.pointerId); const startX = event.clientX; const startY = event.clientY; let moved = false;
      const move = (e) => { if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) moved = true; };
      const up = (e) => { el.releasePointerCapture(e.pointerId); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); if (!moved) return; const target = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('#subtraction-takeaway'); if (target) moveToTakeaway(el, mission); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up);
    });
  }
  function renderMission(mission) {
    const slot = $('#subtraction-slot'); const takeaway = $('#subtraction-takeaway'); if (!slot || !takeaway) return;
    slot.innerHTML = ''; takeaway.innerHTML = `<div class="subtraction-takeaway-label">將物件拖到呢度<br>或者撳一下拿走</div>`;
    for (let i = 0; i < mission.start; i += 1) { const el = object(mission.visual); bindObject(el, mission); slot.appendChild(el); }
    removedCount = 0; sync(mission);
  }
  function showReward(level) {
    const overlay = $('#math-round-finish'); if (!overlay) return; const msg = $('#math-round-finish-msg'); if (msg) msg.textContent = `${level.title}完成！攞到一個獎勵！`; overlay.hidden = false; deps.speech?.playStarCue?.({ muted: deps.isMuted?.() }); deps.speak?.('今輪玩完喇！你好叻呀！攞到一個獎勵！'); deps.playMathStarReward?.();
    $('#btn-math-round-again').onclick = () => { overlay.hidden = true; startMission(currentLevelIndex, 0); }; $('#btn-math-round-galaxy').onclick = () => { overlay.hidden = true; deps.openGalaxy?.(); };
  }
  function startMission(levelIndex, missionIndex) { currentLevelIndex = levelIndex; currentMissionIndex = missionIndex; busy = false; const level = levels[levelIndex]; const mission = level.missions[missionIndex]; $('#subtraction-play-title').textContent = level.title; $('#subtraction-scenario').textContent = `${mission.scenario} · ${mission.visual.emoji}`; $('#subtraction-desc').textContent = mission.desc; $('#subtraction-mission-progress').textContent = `今輪第 ${missionIndex + 1} / ${level.missions.length} 題`; $('#subtraction-feedback').textContent = ''; renderMission(mission); updateStars(); deps.showMathScreen('subtractionPlay'); deps.speak?.(mission.desc); }
  function renderSelect() { const grid = $('#subtraction-level-grid'); if (!grid) return; grid.innerHTML = ''; levels.forEach((level, index) => { const complete = level.missions.every((m) => done(m.id)); const card = document.createElement('button'); card.type = 'button'; card.className = `subtraction-level-card${unlocked(level.level) ? '' : ' is-locked'}${complete ? ' is-done' : ''}`; card.style.setProperty('--subtraction-accent', level.color); card.disabled = !unlocked(level.level); card.innerHTML = `<span class="subtraction-level-kicker">LEVEL ${level.level}</span><strong>${level.targetRange}</strong><span>${level.title.split('・')[1]}</span><small>${level.blurb}</small><span class="subtraction-level-status">${complete ? '已完成・可以再玩' : unlocked(level.level) ? '10 題任務' : '完成 Level 1 後解鎖'}</span>`; card.onclick = () => { const first = level.missions.findIndex((m) => !done(m.id)); startMission(index, first < 0 ? 0 : first); }; grid.appendChild(card); }); updateStars(); deps.showMathScreen('subtractionSelect'); }
  function openMoonSubtraction() { deps.updateState({ currentPlanetId: PLANET_ID }); renderSelect(); }
  function init(options) { deps = options; levels = window.KakaSubtractionData?.subtractionLevels || []; $('#btn-back-math-subtraction-select')?.addEventListener('click', () => deps.openHub()); $('#btn-back-math-subtraction-play')?.addEventListener('click', () => renderSelect()); return levels.length > 0; }
  window.KakaSubtractionGame = { init, openMoonSubtraction, renderSelect, startMission };
})();

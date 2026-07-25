/* 小鹿數理探險 — 獨立 IIFE（故障隔離：掛掉唔影響認字／字母隊） */
(function () {
  try {
    bootMath();
  } catch (err) {
    console.error('KakaMath: boot failed; Chinese / phonics should still work.', err);
    disableMathEntry();
  }

  function disableMathEntry() {
    const btn = document.getElementById('btn-start-math');
    if (btn) {
      btn.disabled = true;
      btn.title = '數理暫時未能開啟';
    }
  }

  function bootMath() {
    if (!window.KakaMathStorage || !window.KakaMathSkills) {
      console.error('KakaMath: math-storage.js / math-skills.js missing.');
      disableMathEntry();
      return;
    }

    const { loadState, updateState, isPlanetLit } = window.KakaMathStorage;
    const { MATH_PLANETS, getPlanetById, getNextPlanetId, planetGlobeHtml } = window.KakaMathSkills;

    const $ = (sel, root = document) => root.querySelector(sel);

    const screens = {
      home: '#screen-home',
      hub: '#screen-math-hub',
      galaxy: '#screen-math-galaxy',
    };

    function showMathScreen(name) {
      document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
      const sel = screens[name] || screens.hub;
      const el = $(sel);
      if (el) el.classList.add('active');
    }

    function goHome() {
      document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
      $('#screen-home')?.classList.add('active');
    }

    function applyPlanetTheme(planet) {
      const hub = $('#screen-math-hub');
      if (hub) hub.style.setProperty('--math-planet', planet.color);

      const ball = $('#math-planet-ball');
      if (ball) {
        const lit = isPlanetLit(planet.id) ? ' is-lit' : '';
        ball.className = `math-globe-wrap math-globe-wrap--${planet.body}${lit}`;
        ball.innerHTML = `<span class="math-globe math-globe--${planet.body}"></span>`;
      }

      const title = $('#math-hub-planet-name');
      if (title) title.textContent = planet.name;

      const blurb = $('#math-hub-blurb');
      if (blurb) blurb.textContent = planet.blurb;

      const skill = $('#math-hub-skill');
      if (skill) skill.textContent = `學：${planet.skill}`;

      const scarf = $('#math-deer-scarf');
      if (scarf) scarf.style.background = planet.color;
    }

    function renderHub() {
      const state = loadState();
      const planet = getPlanetById(state.currentPlanetId);
      applyPlanetTheme(planet);

      const stars = $('#math-hub-stars');
      if (stars) stars.textContent = `今日 ★ ${state.starsToday} / 10`;

      const lit = $('#math-hub-lit');
      if (lit) lit.textContent = `已點亮 ${state.litPlanetIds.length} / ${MATH_PLANETS.length}`;

      const nextId = getNextPlanetId(planet.id);
      const next = getPlanetById(nextId);
      const nextEl = $('#math-hub-next');
      if (nextEl) nextEl.textContent = `下一粒：${next.name}`;
    }

    function openHub() {
      renderHub();
      showMathScreen('hub');
    }

    function renderGalaxy() {
      const grid = $('#math-galaxy-grid');
      if (!grid) return;
      const state = loadState();
      grid.classList.add('math-galaxy-grid');
      grid.innerHTML = '';
      [...MATH_PLANETS]
        .sort((a, b) => a.order - b.order)
        .forEach((p) => {
          const lit = isPlanetLit(p.id, state);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `math-galaxy-card${lit ? ' is-lit' : ''}`;
          btn.setAttribute('aria-label', `${p.name}，學${p.skill}`);
          btn.innerHTML = `
            ${planetGlobeHtml(p, lit ? 'is-lit' : '')}
            <span class="math-galaxy-name">${p.name}</span>
            <span class="math-galaxy-skill">${lit ? '已點亮・' : ''}${p.skill}</span>
          `;
          btn.addEventListener('click', () => {
            updateState({ currentPlanetId: p.id });
            openHub();
          });
          grid.appendChild(btn);
        });
    }

    function bind() {
      const start = $('#btn-start-math');
      if (!start) {
        console.error('KakaMath: #btn-start-math missing.');
        return;
      }
      start.addEventListener('click', () => openHub());

      $('#btn-back-math-hub')?.addEventListener('click', () => goHome());
      $('#btn-math-galaxy')?.addEventListener('click', () => {
        renderGalaxy();
        showMathScreen('galaxy');
      });
      $('#btn-back-math-galaxy')?.addEventListener('click', () => openHub());

      const launch = $('#btn-math-launch');
      launch?.addEventListener('click', () => {
        const note = $('#math-hub-coming');
        const planet = getPlanetById(loadState().currentPlanetId);
        if (note) {
          note.hidden = false;
          note.textContent = `${planet.name}玩法即將開放，而家可以睇旅程先！`;
        }
      });
    }

    bind();
    window.KakaMath = { openHub, goHome, renderHub };
  }
})();

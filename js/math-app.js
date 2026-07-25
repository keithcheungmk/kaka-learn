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

    const { loadState, updateState, tryEarnStar, isPlanetLit, lightPlanet } = window.KakaMathStorage;
    const { MATH_PLANETS, getPlanetById, getNextPlanetId, planetGlobeHtml } = window.KakaMathSkills;
    const speech = window.KakaSpeech || null;

    const ZH_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const COUNT_EMOJIS = ['⭐', '🌙', '🚀', '🪨', '💫', '🛰️'];
    const LEARN_COUNTS = [1, 2, 3, 4, 5];
    const LIT_TARGET = 5;

    const $ = (sel, root = document) => root.querySelector(sel);

    const screens = {
      home: '#screen-home',
      hub: '#screen-math-hub',
      galaxy: '#screen-math-galaxy',
      learn: '#screen-math-learn',
      play: '#screen-math-play',
      count: '#screen-math-count',
    };

    let learnIndex = 0;
    let countBusy = false;
    let countRound = null;
    let countCorrect = 0;
    let countEmoji = COUNT_EMOJIS[0];

    function isMuted() {
      try {
        return !!(window.KakaStorage && window.KakaStorage.loadState().muted);
      } catch {
        return false;
      }
    }

    function speak(text, opts = {}) {
      if (!speech || typeof speech.speakTerm !== 'function') return;
      speech.warmAudio?.();
      speech.speakTerm(text, { muted: isMuted(), rate: 0.92, pitch: 1.05, delayMs: 80, ...opts });
    }

    function showMathScreen(name) {
      document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
      const sel = screens[name] || screens.hub;
      $(sel)?.classList.add('active');
    }

    function goHome() {
      document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
      $('#screen-home')?.classList.add('active');
    }

    function shuffle(arr) {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function renderCountField(el, n, emoji) {
      if (!el) return;
      el.innerHTML = '';
      for (let i = 0; i < n; i += 1) {
        const span = document.createElement('span');
        span.className = 'math-count-dot';
        span.textContent = emoji;
        span.style.animationDelay = `${i * 0.05}s`;
        el.appendChild(span);
      }
    }

    function countPhrase(n) {
      return `呢度有${ZH_NUM[n] || n}粒`;
    }

    function flashStarBurst() {
      const burst = $('#star-burst');
      if (!burst) return;
      burst.classList.remove('show');
      // force reflow
      void burst.offsetWidth;
      burst.classList.add('show');
      setTimeout(() => burst.classList.remove('show'), 900);
    }

    function applyPlanetTheme(planet) {
      const hub = $('#screen-math-hub');
      if (hub) hub.style.setProperty('--math-planet', planet.color);

      const ball = $('#math-planet-ball');
      if (ball) {
        const litClass = isPlanetLit(planet.id) ? ' is-lit' : '';
        ball.outerHTML = `<div id="math-planet-ball" class="math-globe-wrap math-globe-wrap--photo math-globe-wrap--${planet.body}${litClass}" aria-hidden="true"><img class="math-globe-img" src="${planet.img}" alt="" width="256" height="256" decoding="async" /></div>`;
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

      const coming = $('#math-hub-coming');
      if (coming) {
        if (planet.id === 'count') {
          coming.hidden = true;
          coming.textContent = '';
        } else {
          coming.hidden = false;
          coming.textContent = `${planet.name}玩法即將開放，而家可以去水星學數數！`;
        }
      }
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

    /* ---------- 水星・先學 ---------- */
    function openLearn() {
      updateState({ currentPlanetId: 'count' });
      learnIndex = 0;
      countEmoji = COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)];
      const title = $('#math-learn-title');
      if (title) title.textContent = '水星・先學';
      renderLearnCard(true);
      showMathScreen('learn');
    }

    function renderLearnCard(autoSpeak) {
      const n = LEARN_COUNTS[learnIndex];
      renderCountField($('#math-learn-field'), n, countEmoji);
      const num = $('#math-learn-num');
      if (num) num.textContent = String(n);
      const progress = $('#math-learn-progress');
      if (progress) progress.textContent = `${learnIndex + 1}/${LEARN_COUNTS.length}`;

      const prev = $('#btn-math-learn-prev');
      const next = $('#btn-math-learn-next');
      const finish = $('#math-learn-finish-row');
      if (prev) prev.disabled = learnIndex <= 0;
      if (next) next.hidden = learnIndex >= LEARN_COUNTS.length - 1;
      if (finish) finish.hidden = learnIndex < LEARN_COUNTS.length - 1;

      if (autoSpeak) speakLearn();
    }

    function speakLearn() {
      const n = LEARN_COUNTS[learnIndex];
      speak(`${countPhrase(n)}。${n}`);
    }

    /* ---------- 水星・數一數 ---------- */
    function openPlay() {
      const stars = $('#math-play-stars');
      const state = loadState();
      if (stars) stars.textContent = `${state.starsToday}/10`;
      const title = $('#math-play-title');
      if (title) title.textContent = '水星・去玩玩';
      showMathScreen('play');
    }

    function openCount() {
      countBusy = false;
      countCorrect = 0;
      countEmoji = COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)];
      updateCountProgress();
      nextCountRound(true);
      showMathScreen('count');
    }

    function updateCountProgress() {
      const el = $('#math-count-progress');
      if (el) el.textContent = `${countCorrect}/${LIT_TARGET}`;
    }

    function nextCountRound(autoSpeak) {
      const answer = 1 + Math.floor(Math.random() * 10);
      const opts = new Set([answer]);
      while (opts.size < 3) {
        opts.add(1 + Math.floor(Math.random() * 10));
      }
      countRound = { answer, options: shuffle([...opts]) };
      renderCountField($('#math-count-field'), answer, countEmoji);
      const prompt = $('#math-count-prompt');
      if (prompt) prompt.textContent = '有幾多粒？數吓再揀！';
      const fb = $('#math-count-feedback');
      if (fb) fb.textContent = '';

      const box = $('#math-count-options');
      if (box) {
        box.innerHTML = '';
        countRound.options.forEach((n) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'math-num-bubble';
          btn.textContent = String(n);
          btn.setAttribute('aria-label', `揀 ${n}`);
          btn.addEventListener('click', () => onCountPick(n, btn));
          box.appendChild(btn);
        });
      }
      if (autoSpeak) speakCountPrompt();
    }

    function speakCountPrompt() {
      speak('有幾多粒？數吓再揀！');
    }

    function onCountPick(n, btn) {
      if (countBusy || !countRound) return;
      countBusy = true;
      const muted = isMuted();
      const fb = $('#math-count-feedback');
      const ok = n === countRound.answer;

      if (ok) {
        btn.classList.add('is-ok');
        const { gained } = tryEarnStar();
        if (gained) {
          flashStarBurst();
          speech?.playStarCue?.({ muted });
        } else {
          speech?.playCorrectCue?.({ muted });
        }
        countCorrect += 1;
        updateCountProgress();
        const praise =
          speech?.speakCorrectFeedback?.({ muted }) || '你好叻呀，答啱咗！';
        if (fb) fb.textContent = gained ? `${praise} ★` : praise;

        if (countCorrect >= LIT_TARGET && !isPlanetLit('count')) {
          lightPlanet('count');
          if (fb) fb.textContent = `${praise} 水星點亮喇！`;
          speak('水星點亮喇！');
        }

        const stars = $('#math-play-stars');
        const state = loadState();
        if (stars) stars.textContent = `${state.starsToday}/10`;

        setTimeout(() => {
          countBusy = false;
          nextCountRound(true);
        }, 1100);
      } else {
        btn.classList.add('is-bad');
        speech?.playTryAgainCue?.({ muted });
        const line = speech?.speakRetryFeedback?.({ muted }) || '唔緊要，試多次！';
        if (fb) fb.textContent = line;
        // 短暫閃正確數量（溫柔提示）
        const field = $('#math-count-field');
        if (field) field.style.outline = '3px solid rgba(253, 230, 138, 0.7)';
        setTimeout(() => {
          btn.classList.remove('is-bad');
          if (field) field.style.outline = '';
          countBusy = false;
        }, 700);
      }
    }

    function launchFromHub() {
      const planet = getPlanetById(loadState().currentPlanetId);
      if (planet.id !== 'count') {
        const note = $('#math-hub-coming');
        if (note) {
          note.hidden = false;
          note.textContent = `${planet.name}玩法即將開放，而家去水星學數數啦！`;
        }
        updateState({ currentPlanetId: 'count' });
        renderHub();
        return;
      }
      openLearn();
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
      $('#btn-math-launch')?.addEventListener('click', () => launchFromHub());

      $('#btn-back-math-learn')?.addEventListener('click', () => openHub());
      $('#math-learn-tap')?.addEventListener('click', () => speakLearn());
      $('#btn-math-learn-prev')?.addEventListener('click', () => {
        if (learnIndex <= 0) return;
        learnIndex -= 1;
        renderLearnCard(true);
      });
      $('#btn-math-learn-next')?.addEventListener('click', () => {
        if (learnIndex >= LEARN_COUNTS.length - 1) return;
        learnIndex += 1;
        renderLearnCard(true);
      });
      $('#btn-math-learn-play')?.addEventListener('click', () => openPlay());

      $('#btn-back-math-play')?.addEventListener('click', () => openLearn());
      $('#btn-math-mode-count')?.addEventListener('click', () => openCount());

      $('#btn-back-math-count')?.addEventListener('click', () => openPlay());
      $('#btn-math-count-speak')?.addEventListener('click', () => speakCountPrompt());
    }

    bind();
    window.KakaMath = { openHub, goHome, renderHub, openLearn, openCount };
  }
})();

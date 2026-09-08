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
    if (!window.KakaMathStorage || !window.KakaMathSkills || !window.KakaAdditionData || !window.KakaAdditionGame) {
      console.error('KakaMath: math modules missing.');
      disableMathEntry();
      return;
    }

    const {
      loadState,
      saveState,
      updateState,
      tryEarnStar,
      isPlanetLit,
      lightPlanet,
    } = window.KakaMathStorage;
    const { MATH_PLANETS, getPlanetById, getNextPlanetId, planetGlobeHtml } = window.KakaMathSkills;
    const mastery = window.KakaMathMastery || null;
    const questionEngine = window.KakaMathQuestionEngine || null;
    const speech = window.KakaSpeech || null;

    const ZH_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const COUNT_EMOJIS = ['⭐', '🌙', '🚀', '🪨', '💫'];
    const LEARN_COUNTS = [1, 2, 3, 4, 5];
    const LIT_TARGET = 10;

    /** 時間資料：id = "h-00" 整點／"h-30" 半點（1–12） */
    const ZH_HOUR = ['十二', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一'];
    function clockItem(h, half) {
      const zh = ZH_HOUR[h % 12];
      return {
        id: `${h}-${half ? '30' : '00'}`,
        h,
        half: !!half,
        say: half ? `${zh}點半` : `${zh}點鐘`,
      };
    }
    const CLOCK_ITEMS = [];
    for (let h = 1; h <= 12; h += 1) {
      CLOCK_ITEMS.push(clockItem(h, false), clockItem(h, true));
    }

    /** 先學：模擬鐘 + 電子鐘（整點／半點） */
    const VENUS_TIME_LEARN_CARDS = [
      { ...clockItem(3, false), learnSay: '三點鐘。模擬鐘短針指住 3，長針指住 12。電子鐘寫住 3:00。' },
      { ...clockItem(3, true), learnSay: '三點半。長針指住 6，就係半點。電子鐘寫住 3:30。' },
      { ...clockItem(12, false), learnSay: '十二點鐘。兩支針都指住 12。電子鐘寫住 12:00。' },
      { ...clockItem(6, true), learnSay: '六點半。長針指住 6。電子鐘寫住 6:30。' },
      { ...clockItem(9, false), learnSay: '電子鐘寫住 9:00，就係九點鐘。' },
      { ...clockItem(2, true), learnSay: '電子鐘寫住 2:30，就係兩點半。' },
    ];

    const MARS_SHAPES = [
      { id: 'circle', name: '圓形', emoji: '⚪', say: '圓形' },
      { id: 'triangle', name: '三角形', emoji: '🔺', say: '三角形' },
      { id: 'square', name: '方形', emoji: '🟦', say: '方形' },
    ];

    const MARS_LEARN_CARDS = [
      { kind: 'shape', shape: MARS_SHAPES[0], learnSay: '呢個係圓形。圓圓哋，冇角。' },
      { kind: 'shape', shape: MARS_SHAPES[1], learnSay: '呢個係三角形。有三個角。' },
      { kind: 'shape', shape: MARS_SHAPES[2], learnSay: '呢個係方形。有四個一樣嘅邊。' },
      {
        kind: 'pattern',
        sequence: [MARS_SHAPES[0], MARS_SHAPES[1], MARS_SHAPES[0], MARS_SHAPES[1]],
        answer: MARS_SHAPES[0],
        learnSay: '圓、三角、圓、三角……跟住又係圓。呢個叫規律。',
      },
      {
        kind: 'pattern',
        sequence: [MARS_SHAPES[2], MARS_SHAPES[2], MARS_SHAPES[0], MARS_SHAPES[2], MARS_SHAPES[2], MARS_SHAPES[0]],
        answer: MARS_SHAPES[2],
        learnSay: '方、方、圓，再方、方、圓……跟住又係方。',
      },
    ];

    const $ = (sel, root = document) => root.querySelector(sel);

    const screens = {
      home: '#screen-home',
      hub: '#screen-math-hub',
      galaxy: '#screen-math-galaxy',
      learn: '#screen-math-learn',
      play: '#screen-math-play',
      count: '#screen-math-count',
      fuel: '#screen-math-fuel',
      additionSelect: '#screen-math-earth-addition-select',
      additionPlay: '#screen-math-earth-addition-play',
      vlearn: '#screen-math-venus-learn',
      vplay: '#screen-math-venus-play',
      time: '#screen-math-time',
      marsLearn: '#screen-math-mars-learn',
      marsPlay: '#screen-math-mars-play',
      shape: '#screen-math-shape',
      pattern: '#screen-math-pattern',
    };

    let learnIndex = 0;
    let countBusy = false;
    let countRound = null;
    let countCorrect = 0;
    let countEmoji = COUNT_EMOJIS[0];
    let countMission = [];
    let countIndex = 0;
    let countWrongAttempts = 0;
    let countFirstWrongAnswer = null;
    let countMissionStartedAt = null;
    let vLearnIndex = 0;
    let timeBusy = false;
    let timeRound = null;
    let timeCorrect = 0;
    let timeMode = 'analog';
    let marsLearnIndex = 0;
    let shapeBusy = false;
    let shapeRound = null;
    let shapeCorrect = 0;
    let patternBusy = false;
    let patternRound = null;
    let patternCorrect = 0;
    let warpFromPlanet = null;
    let warpToPlanet = null;
    let warpTimer = null;

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
      const el = $(sel);
      el?.classList.add('active');
      if (['count', 'additionPlay', 'time', 'fuel', 'shape', 'pattern'].includes(name)) {
        const fx = window.KakaStarFx;
        fx?.mountPlayScreen?.(el);
        fx?.ensureMathStarTarget?.(el, `${loadState().starsToday}/10`);
      } else {
        window.KakaStarFx?.hideRanger?.();
      }
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

    /** 原創幼齡鐘面：純 CSS 畫（全部 1–12 數字＋兩支針），唔用外部圖 */
    function clockFaceHtml(item, { small = false } = {}) {
      const hourAng = ((item.h % 12) + (item.half ? 0.5 : 0)) * 30;
      const minAng = item.half ? 180 : 0;
      const hourLabels = [
        { h: 12, ang: 0 },
        { h: 1, ang: 30 },
        { h: 2, ang: 60 },
        { h: 3, ang: 90 },
        { h: 4, ang: 120 },
        { h: 5, ang: 150 },
        { h: 6, ang: 180 },
        { h: 7, ang: 210 },
        { h: 8, ang: 240 },
        { h: 9, ang: 270 },
        { h: 10, ang: 300 },
        { h: 11, ang: 330 },
      ];
      const markers = hourLabels
        .map((m) => {
          const rad = (m.ang * Math.PI) / 180;
          const r = 38;
          const x = 50 + r * Math.sin(rad);
          const y = 50 - r * Math.cos(rad);
          return `<span class="math-clock-marker math-clock-marker--num" style="left:${x}%;top:${y}%">${m.h}</span>`;
        })
        .join('');
      // 最外圈細刻度：每個鐘點一條，跟住角度轉
      const ticks = hourLabels
        .map((m) => {
          const rad = (m.ang * Math.PI) / 180;
          const r = 46;
          const x = 50 + r * Math.sin(rad);
          const y = 50 - r * Math.cos(rad);
          return `<span class="math-clock-tick" style="left:${x}%;top:${y}%;transform: translate(-50%, -50%) rotate(${m.ang}deg)"></span>`;
        })
        .join('');
      return `<div class="math-clock-face math-clock-face--drawn${small ? ' math-clock-face--small' : ''}" role="img" aria-label="${item.say}">${ticks}${markers}<span class="math-clock-hand math-clock-hand--hour" style="transform: translateX(-50%) rotate(${hourAng}deg)"></span><span class="math-clock-hand math-clock-hand--min" style="transform: translateX(-50%) rotate(${minAng}deg)"></span><span class="math-clock-center"></span></div>`;
    }

    function digitalText(item) {
      return `${item.h}:${item.half ? '30' : '00'}`;
    }

    function digitalClockHtml(item, { small = false } = {}) {
      const text = digitalText(item);
      return `<div class="math-digital-clock${small ? ' math-digital-clock--small' : ''}" role="img" aria-label="${item.say}"><span class="math-digital-digits">${text}</span></div>`;
    }

    function shapeGlyphHtml(shape, extraClass = '') {
      return `<span class="math-shape-glyph math-shape-glyph--${shape.id} ${extraClass}" aria-hidden="true">${shape.emoji}</span>`;
    }

    function patternCellsHtml(sequence, { blankLast = false } = {}) {
      return sequence
        .map((item, i) => {
          const empty = item == null || (blankLast && i === sequence.length - 1);
          if (empty) return `<span class="math-pattern-cell is-blank" aria-label="缺格">？</span>`;
          return `<span class="math-pattern-cell">${shapeGlyphHtml(item)}</span>`;
        })
        .join('');
    }

    function renderCountField(el, n, emoji) {
      if (!el) return;
      el.innerHTML = '';
      for (let i = 0; i < n; i += 1) {
        const span = document.createElement('span');
        span.className = 'math-count-dot';
        if (window.KakaEmojiArt) span.innerHTML = window.KakaEmojiArt.html(emoji);
        else span.textContent = emoji;
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

    /** 答啱：太空戰士射星去 header 星星位（無動畫就退回中間 burst） */
    function playMathStarReward() {
      const screen = document.querySelector('.math-screen.active');
      const fx = window.KakaStarFx;
      if (!screen || !fx?.flyStarFromRanger) {
        flashStarBurst();
        return;
      }
      const state = loadState();
      fx.mountPlayScreen(screen);
      fx.ensureMathStarTarget(screen, `${state.starsToday}/10`);
      fx.flyStarFromRanger(screen, () => {
        const s = loadState();
        fx.ensureMathStarTarget(screen, `${s.starsToday}/10`);
      });
    }

    function showMathRoundReward(message, onAgain) {
      const overlay = $('#math-round-finish');
      if (!overlay) return;
      const msg = $('#math-round-finish-msg');
      if (msg) msg.textContent = message || '今輪玩完喇！攞到一個獎勵！';
      overlay.hidden = false;
      speech?.playStarCue?.({ muted: isMuted() });
      speak(message || '今輪玩完喇！你好叻呀！攞到一個獎勵！');
      playMathStarReward();
      $('#btn-math-round-again').onclick = () => { overlay.hidden = true; onAgain?.(); };
      $('#btn-math-round-galaxy').onclick = () => { overlay.hidden = true; openGalaxy(); };
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

    }

    function renderHub() {
      const state = loadState();
      const planet = getPlanetById(state.currentPlanetId);
      applyPlanetTheme(planet);

      const stars = $('#math-hub-stars');
      if (stars) stars.textContent = `今日 ★ ${state.starsToday} / 10`;

      const litCount = $('#math-hub-lit');
      if (litCount) litCount.textContent = `已點亮 ${state.litPlanetIds.length} / ${MATH_PLANETS.length}`;

      const nextId = getNextPlanetId(planet.id);
      const next = getPlanetById(nextId);
      const nextEl = $('#math-hub-next');
      if (nextEl) nextEl.textContent = `下一粒：${next.name}`;

      const litNow = isPlanetLit(planet.id, state);
      const badge = $('#math-hub-lit-badge');
      if (badge) badge.hidden = !litNow;

      const goNext = $('#btn-math-go-next');
      if (goNext) {
        const hasNext = next.id !== planet.id;
        goNext.hidden = !(litNow && hasNext);
        goNext.textContent = `飛去${next.name}`;
      }

      const coming = $('#math-hub-coming');
      if (coming) {
        const playable = ['count', 'compare-size', 'time', 'shape'].includes(planet.id);
        if (playable) {
          coming.hidden = true;
          coming.textContent = '';
        } else {
          coming.hidden = false;
          coming.textContent = litNow
            ? `${planet.name}玩法即將開放；可以返水星溫習，或者睇旅程揀第二粒。`
            : `${planet.name}玩法即將開放，而家可以去水星學數數！`;
        }
      }
    }

    function hideWarp() {
      const overlay = $('#math-warp');
      if (!overlay) return;
      if (warpTimer) {
        clearTimeout(warpTimer);
        warpTimer = null;
      }
      overlay.classList.remove('is-flying');
      overlay.hidden = true;
      warpFromPlanet = null;
      warpToPlanet = null;
    }

    function finishWarpGo() {
      const to = warpToPlanet;
      hideWarp();
      if (!to) {
        openHub();
        return;
      }
      updateState({ currentPlanetId: to.id });
      openHub();
      speak(`到${to.name}喇！`);
    }

    function finishWarpStay() {
      const from = warpFromPlanet;
      hideWarp();
      if (from) updateState({ currentPlanetId: from.id });
      openHub();
    }

    /** 點亮後短飛行＋建議下一粒（可留低／飛過去；唔硬鎖） */
    function offerWarpHop(fromPlanet, toPlanet) {
      const overlay = $('#math-warp');
      if (!overlay || !toPlanet || fromPlanet.id === toPlanet.id) {
        openHub();
        return;
      }
      warpFromPlanet = fromPlanet;
      warpToPlanet = toPlanet;

      const fromImg = $('#math-warp-from-img');
      const toImg = $('#math-warp-to-img');
      const fromName = $('#math-warp-from-name');
      const toName = $('#math-warp-to-name');
      const msg = $('#math-warp-msg');
      if (fromImg) fromImg.src = fromPlanet.img;
      if (toImg) toImg.src = toPlanet.img;
      if (fromName) fromName.textContent = fromPlanet.name;
      if (toName) toName.textContent = toPlanet.name;
      if (msg) msg.textContent = `${fromPlanet.name}點亮喇！飛去${toPlanet.name}？`;

      overlay.hidden = false;
      overlay.classList.remove('is-flying');
      void overlay.offsetWidth;
      overlay.classList.add('is-flying');
      speak(`${fromPlanet.name}點亮喇！飛去${toPlanet.name}？`);

      if (warpTimer) clearTimeout(warpTimer);
      // 唔自動飛走：等家長／小朋友撳掣；飛行動畫只係氣氛
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
          const retired = p.id === 'moon';
          const lit = !retired && isPlanetLit(p.id, state);
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `math-galaxy-card${lit ? ' is-lit' : ''}`;
          const status = retired ? '即將開放' : (lit ? '已點亮' : '可以出發');
          btn.setAttribute('aria-label', `${p.name}，${p.skill}，${status}`);
          btn.innerHTML = `
            <span class="math-galaxy-planet">
              ${planetGlobeHtml(p, lit ? 'is-lit' : '')}
              <span class="math-galaxy-icon math-native-emoji" aria-hidden="true">${p.icon || '🚀'}</span>
            </span>
            <span class="math-galaxy-name">${p.name}</span>
            <span class="math-galaxy-skill">${p.skill}</span>
            <span class="math-galaxy-status">${status}</span>
          `;
          btn.addEventListener('click', () => {
            updateState({ currentPlanetId: p.id });
            openHub();
          });
          grid.appendChild(btn);
        });
    }

    /** 撳「睇旅程」：渲染＋顯示銀河頁（獨立函式，唔靠 inline onclick） */
    function openGalaxy() {
      try {
        renderGalaxy();
        showMathScreen('galaxy');
      } catch (err) {
        console.error('KakaMath: openGalaxy failed', err);
        const grid = $('#math-galaxy-grid');
        if (grid) {
          grid.innerHTML = '<p class="section-lead">銀河旅程暫時未能顯示，請返去再試。</p>';
        }
        showMathScreen('galaxy');
      }
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
      if (title) title.textContent = '水星・太空補給站';
      showMathScreen('play');
    }

    function openCount() {
      countBusy = false;
      countCorrect = 0;
      countIndex = 0;
      countWrongAttempts = 0;
      countFirstWrongAnswer = null;
      countMissionStartedAt = new Date().toISOString();
      countEmoji = COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)];
      countMission = questionEngine?.generateMission?.() || [];
      while (countMission.length < 10) {
        countMission = countMission.concat(questionEngine?.generateMission?.() || []).slice(0, 10);
      }
      if (!countMission.length) {
          countMission = Array.from({ length: 10 }, () => {
          const answer = 1 + Math.floor(Math.random() * 10);
          const options = new Set([answer, Math.max(0, answer - 1), Math.min(10, answer + 1)]);
          while (options.size < 3) options.add(Math.floor(Math.random() * 11));
          return {
            id: `fallback-${Date.now()}-${answer}`,
            type: 'oneToOne',
            skillId: 'count.oneToOne.1to10',
            answer,
            quantity: answer,
            options: shuffle([...options]),
            prompt: '逐粒撳住數，數完再揀答案。',
            speech: '逐粒撳住數，每粒只數一次。',
            representation: 'touchObjects',
          };
        });
      }
      updateCountProgress();
      nextCountRound(true);
      showMathScreen('count');
    }

    function updateCountProgress() {
      const el = $('#math-count-progress');
      if (el) el.textContent = `${Math.min(countIndex + 1, countMission.length || 10)}/${countMission.length || 10}`;
    }

    function nextCountRound(autoSpeak) {
      countRound = countMission[countIndex];
      if (!countRound) return;
      countWrongAttempts = 0;
      countFirstWrongAnswer = null;
      renderCountQuestion(countRound);
      const prompt = $('#math-count-prompt');
      if (prompt) prompt.textContent = countRound.prompt;
      const fb = $('#math-count-feedback');
      if (fb) fb.textContent = '';
      renderCountOptions(countRound);
      updateCountProgress();
      if (autoSpeak) speakCountPrompt();
    }

    function speakCountPrompt() {
      speak(countRound?.speech || '有幾多粒？數吓再揀！');
    }

    function countDotHtml(emoji = countEmoji) {
      return window.KakaEmojiArt ? window.KakaEmojiArt.html(emoji) : emoji;
    }

    function appendStaticDots(parent, quantity) {
      for (let i = 0; i < quantity; i += 1) {
        const dot = document.createElement('span');
        dot.className = 'math-count-dot';
        dot.innerHTML = countDotHtml();
        dot.style.animationDelay = `${i * 0.04}s`;
        parent.appendChild(dot);
      }
    }

    function renderCountQuestion(question) {
      const field = $('#math-count-field');
      if (!field) return;
      field.innerHTML = '';
      field.className = `math-count-field math-count-field--quiz math-count-field--${question.type}`;
      field.removeAttribute('aria-hidden');
      field.classList.remove('is-guided');

      if (question.type === 'oneToOne') {
        const items = document.createElement('div');
        items.className = `math-touch-count math-touch-count--${question.arrangement || 'scattered'}`;
        const status = document.createElement('div');
        status.className = 'math-touch-status';
        status.textContent = `已數：0 / ${question.quantity}`;
        for (let i = 0; i < question.quantity; i += 1) {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'math-count-dot math-count-tappable';
          dot.innerHTML = countDotHtml();
          dot.setAttribute('aria-label', `第 ${i + 1} 粒，未數`);
          dot.addEventListener('click', () => {
            if (dot.classList.contains('is-counted') || countBusy) return;
            dot.classList.add('is-counted');
            const counted = items.querySelectorAll('.is-counted').length;
            dot.setAttribute('aria-label', `第 ${i + 1} 粒，已數`);
            status.textContent = `已數：${counted} / ${question.quantity}`;
            speak(String(counted), { rate: 0.82, delayMs: 0 });
            if (counted === question.quantity) {
              $('#math-count-options')?.querySelectorAll('button').forEach((btn) => { btn.disabled = false; });
              status.textContent = '數完喇，揀答案！';
            }
          });
          items.appendChild(dot);
        }
        field.append(items, status);
        return;
      }

      if (question.type === 'conservation') {
        const before = document.createElement('div');
        before.className = 'math-conservation-row math-conservation-row--line';
        appendStaticDots(before, question.quantity);
        const arrow = document.createElement('span');
        arrow.className = 'math-conservation-arrow';
        arrow.textContent = '↓ 只係排開';
        const after = document.createElement('div');
        after.className = 'math-conservation-row math-conservation-row--scattered';
        appendStaticDots(after, question.quantity);
        field.append(before, arrow, after);
        return;
      }

      if (question.type === 'numberMatch') {
        const target = document.createElement('div');
        target.className = 'math-target-number';
        target.innerHTML = `<span>搵數量</span><strong>${question.targetNumber}</strong>`;
        field.appendChild(target);
        return;
      }

      if (question.type === 'oneMoreLess') {
        const group = document.createElement('div');
        group.className = 'math-one-more-group';
        appendStaticDots(group, question.quantity);
        const action = document.createElement('div');
        action.className = `math-one-more-action is-${question.relation}`;
        action.textContent = question.relation === 'more' ? '+ 1' : '− 1';
        field.append(group, action);
        return;
      }

      const group = document.createElement('div');
      group.className = `math-subitize-pattern math-subitize-pattern--${question.arrangement || 'dice'}`;
      appendStaticDots(group, question.quantity);
      field.appendChild(group);
    }

    function renderCountOptions(question) {
      const box = $('#math-count-options');
      if (!box) return;
      box.innerHTML = '';
      question.options.forEach((n) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = question.type === 'numberMatch' ? 'math-quantity-option' : 'math-num-bubble';
        if (question.type === 'numberMatch') {
          btn.innerHTML = `<span class="math-mini-dots" aria-hidden="true">${'●'.repeat(n) || '∅'}</span>`;
          btn.setAttribute('aria-label', `${n} 粒`);
        } else {
          btn.textContent = String(n);
          btn.setAttribute('aria-label', `揀 ${n}`);
        }
        if (question.type === 'oneToOne') btn.disabled = true;
        btn.addEventListener('click', () => onCountPick(n, btn));
        box.appendChild(btn);
      });
    }

    function saveCountResult(correctAnswer) {
      if (!mastery?.recordAttempt || !saveState || !countRound) return;
      const next = mastery.recordAttempt(loadState(), {
        skillId: countRound.skillId,
        firstTryCorrect: countWrongAttempts === 0,
        assisted: countWrongAttempts >= 2,
        hints: countWrongAttempts,
        errorType: countWrongAttempts
          ? questionEngine?.classifyError?.(countRound, countFirstWrongAnswer)
          : undefined,
        answer: countFirstWrongAnswer ?? correctAnswer,
        expected: countRound.answer,
        representation: countRound.representation,
      });
      saveState(next);
    }

    function finishCountMission() {
      if (!mastery?.recordMission || !saveState) return;
      const next = mastery.recordMission(loadState(), {
        missionId: `mercury-${Date.now()}`,
        startedAt: countMissionStartedAt,
        completedAt: new Date().toISOString(),
        questionsCompleted: countMission.length,
        firstTryCorrect: countMission.length - countMission.filter((q) => q._neededHelp).length,
        hintsUsed: countMission.reduce((sum, q) => sum + (q._hints || 0), 0),
      });
      saveState(next);
    }

    function onCountPick(n, btn) {
      if (countBusy || !countRound) return;
      countBusy = true;
      const muted = isMuted();
      const fb = $('#math-count-feedback');
      const ok = n === countRound.answer;

      if (ok) {
        btn.classList.add('is-ok');
        countRound._neededHelp = countWrongAttempts > 0;
        countRound._hints = countWrongAttempts;
        saveCountResult(n);
        const { gained } = tryEarnStar();
        if (gained) {
          speech?.playStarCue?.({ muted });
          playMathStarReward();
        } else {
          speech?.playCorrectCue?.({ muted });
        }
        countCorrect += 1;
        const praise =
          speech?.speakCorrectFeedback?.({ muted }) || '你好叻呀，答啱咗！';
        if (fb) fb.textContent = gained ? `${praise} ★` : praise;

        if (countCorrect >= countMission.length) {
          finishCountMission();
          const firstLight = !isPlanetLit('count');
          if (firstLight) lightPlanet('count');
          if (fb) fb.textContent = firstLight ? `${praise} 水星點亮喇！` : `${praise} Ranger Mission 完成！`;
          setTimeout(() => {
            countBusy = false;
            showMathRoundReward(firstLight ? '水星十題完成！水星點亮喇！' : '今輪玩完喇！你好叻呀！攞到一個獎勵！', openCount);
          }, 1100);
          return;
        }

        const stars = $('#math-play-stars');
        const state = loadState();
        if (stars) stars.textContent = `${state.starsToday}/10`;

        setTimeout(() => {
          countBusy = false;
          countIndex += 1;
          nextCountRound(true);
        }, 1100);
      } else {
        countWrongAttempts += 1;
        if (countFirstWrongAnswer === null) countFirstWrongAnswer = n;
        btn.classList.add('is-bad');
        speech?.playTryAgainCue?.({ muted });
        const line = questionEngine?.hintFor?.(countRound, countWrongAttempts)
          || speech?.speakRetryFeedback?.({ muted })
          || '唔緊要，試多次！';
        if (fb) fb.textContent = line;
        speak(line);
        // 短暫閃正確數量（溫柔提示）
        const field = $('#math-count-field');
        if (field) {
          field.style.outline = '3px solid rgba(253, 230, 138, 0.7)';
          if (countWrongAttempts >= 2) field.classList.add('is-guided');
        }
        setTimeout(() => {
          btn.classList.remove('is-bad');
          if (field) {
            field.style.outline = '';
            if (countRound.type === 'oneToOne' && countWrongAttempts >= 2) {
              field.querySelectorAll('.math-count-tappable').forEach((dot, index) => {
                dot.classList.remove('is-counted');
                dot.setAttribute('aria-label', `第 ${index + 1} 粒，未數`);
              });
              const status = field.querySelector('.math-touch-status');
              if (status) status.textContent = `已數：0 / ${countRound.quantity}`;
              $('#math-count-options')?.querySelectorAll('button').forEach((option) => { option.disabled = true; });
            }
          }
          countBusy = false;
        }, 700);
      }
    }

    /* ---------- 地球・加法（KakaAdditionGame） ---------- */

    /* ---------- 金星・先學（睇鐘） ---------- */
    function openVenusLearn() {
      updateState({ currentPlanetId: 'time' });
      vLearnIndex = 0;
      const title = $('#math-venus-learn-title');
      if (title) title.textContent = '金星・先學';
      renderVenusLearnCard(true);
      showMathScreen('vlearn');
    }

    function renderVenusLearnCard(autoSpeak) {
      const card = VENUS_TIME_LEARN_CARDS[vLearnIndex];
      const face = $('#math-venus-learn-face');
      if (face) face.innerHTML = clockFaceHtml(card);
      const dig = $('#math-venus-learn-digital');
      if (dig) dig.innerHTML = `<span class="math-digital-digits">${digitalText(card)}</span>`;
      const say = $('#math-venus-learn-say');
      if (say) say.textContent = `${card.say} · ${digitalText(card)}`;
      const progress = $('#math-venus-learn-progress');
      if (progress) progress.textContent = `${vLearnIndex + 1}/${VENUS_TIME_LEARN_CARDS.length}`;

      const prev = $('#btn-math-venus-learn-prev');
      const next = $('#btn-math-venus-learn-next');
      const finish = $('#math-venus-learn-finish-row');
      if (prev) prev.disabled = vLearnIndex <= 0;
      if (next) next.hidden = vLearnIndex >= VENUS_TIME_LEARN_CARDS.length - 1;
      if (finish) finish.hidden = vLearnIndex < VENUS_TIME_LEARN_CARDS.length - 1;

      if (autoSpeak) speakVenusLearn();
    }

    function speakVenusLearn() {
      const card = VENUS_TIME_LEARN_CARDS[vLearnIndex];
      speak(card.learnSay || card.say);
    }

    function openVenusPlay() {
      const stars = $('#math-venus-play-stars');
      const state = loadState();
      if (stars) stars.textContent = `${state.starsToday}/10`;
      const title = $('#math-venus-play-title');
      if (title) title.textContent = '金星・去玩玩';
      showMathScreen('vplay');
    }

    function openTimeQuiz(mode) {
      timeMode = mode === 'digital' ? 'digital' : 'analog';
      timeBusy = false;
      timeCorrect = 0;
      const title = $('#math-time-title');
      if (title) title.textContent = timeMode === 'digital' ? '揀電子鐘' : '揀鐘面';
      updateTimeProgress();
      nextTimeRound(true);
      showMathScreen('time');
    }

    function updateTimeProgress() {
      const el = $('#math-time-progress');
      if (el) el.textContent = `${timeCorrect}/${LIT_TARGET}`;
    }

    function nextTimeRound(autoSpeak) {
      const target = CLOCK_ITEMS[Math.floor(Math.random() * CLOCK_ITEMS.length)];
      const others = shuffle(CLOCK_ITEMS.filter((c) => c.id !== target.id)).slice(0, 2);
      const options = shuffle([target, ...others]);
      timeRound = { target, options };

      const prompt = $('#math-time-prompt');
      if (prompt) {
        prompt.textContent =
          timeMode === 'digital' ? '聽完揀正確嘅電子鐘' : '聽完揀正確嘅鐘面';
      }
      const fb = $('#math-time-feedback');
      if (fb) fb.textContent = '';

      const box = $('#math-time-options');
      if (box) {
        box.innerHTML = '';
        options.forEach((c) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = timeMode === 'digital' ? 'math-clock-pick math-clock-pick--digital' : 'math-clock-pick';
          btn.setAttribute('aria-label', `${c.say} ${digitalText(c)}`);
          btn.innerHTML =
            timeMode === 'digital'
              ? `${digitalClockHtml(c, { small: true })}<span class="math-clock-label">${c.say}</span>`
              : `${clockFaceHtml(c, { small: true })}<span class="math-clock-label">${c.say}</span>`;
          btn.addEventListener('click', () => onTimePick(c.id, btn));
          box.appendChild(btn);
        });
      }
      if (autoSpeak) speak(`幾點？${target.say}`);
    }

    function onTimePick(id, btn) {
      if (timeBusy || !timeRound) return;
      timeBusy = true;
      const muted = isMuted();
      const fb = $('#math-time-feedback');
      const ok = id === timeRound.target.id;

      if (ok) {
        btn.classList.add('is-ok');
        const { gained } = tryEarnStar();
        if (gained) {
          speech?.playStarCue?.({ muted });
          playMathStarReward();
        } else {
          speech?.playCorrectCue?.({ muted });
        }
        timeCorrect += 1;
        updateTimeProgress();
        const praise =
          speech?.speakCorrectFeedback?.({ muted }) || '你好叻呀，答啱咗！';
        if (fb) fb.textContent = gained ? `${praise} ★` : praise;

        if (timeCorrect >= LIT_TARGET) {
          if (!isPlanetLit('time')) lightPlanet('time');
          if (fb) fb.textContent = `${praise} 金星點亮喇！`;
          setTimeout(() => {
            timeBusy = false;
            showMathRoundReward('金星十題完成！你好叻呀！', () => openTimeQuiz(timeMode));
          }, 900);
          return;
        }

        const stars = $('#math-venus-play-stars');
        const state = loadState();
        if (stars) stars.textContent = `${state.starsToday}/10`;

        setTimeout(() => {
          timeBusy = false;
          nextTimeRound(true);
        }, 1100);
      } else {
        btn.classList.add('is-bad');
        speech?.playTryAgainCue?.({ muted });
        const line = speech?.speakRetryFeedback?.({ muted }) || '唔緊要，試多次！';
        if (fb) fb.textContent = line;
        setTimeout(() => {
          btn.classList.remove('is-bad');
          timeBusy = false;
        }, 700);
      }
    }

    /* ---------- 火星・形狀＋推理 ---------- */
    function openMarsLearn() {
      updateState({ currentPlanetId: 'shape' });
      marsLearnIndex = 0;
      const title = $('#math-mars-learn-title');
      if (title) title.textContent = '火星・先學';
      renderMarsLearnCard(true);
      showMathScreen('marsLearn');
    }

    function renderMarsLearnCard(autoSpeak) {
      const card = MARS_LEARN_CARDS[marsLearnIndex];
      const visual = $('#math-mars-learn-visual');
      const say = $('#math-mars-learn-say');
      if (card.kind === 'shape') {
        if (visual) visual.innerHTML = shapeGlyphHtml(card.shape, 'is-hero');
        if (say) say.textContent = card.shape.name;
      } else {
        if (visual) visual.innerHTML = `<div class="math-pattern-row">${patternCellsHtml(card.sequence)}</div>`;
        if (say) say.textContent = '規律';
      }
      const progress = $('#math-mars-learn-progress');
      if (progress) progress.textContent = `${marsLearnIndex + 1}/${MARS_LEARN_CARDS.length}`;
      const prev = $('#btn-math-mars-learn-prev');
      const next = $('#btn-math-mars-learn-next');
      const finish = $('#math-mars-learn-finish-row');
      if (prev) prev.disabled = marsLearnIndex <= 0;
      if (next) next.hidden = marsLearnIndex >= MARS_LEARN_CARDS.length - 1;
      if (finish) finish.hidden = marsLearnIndex < MARS_LEARN_CARDS.length - 1;
      if (autoSpeak) speakMarsLearn();
    }

    function speakMarsLearn() {
      speak(MARS_LEARN_CARDS[marsLearnIndex].learnSay);
    }

    function openMarsPlay() {
      const stars = $('#math-mars-play-stars');
      const state = loadState();
      if (stars) stars.textContent = `${state.starsToday}/10`;
      showMathScreen('marsPlay');
    }

    function openShapeQuiz() {
      shapeBusy = false;
      shapeCorrect = 0;
      updateShapeProgress();
      nextShapeRound(true);
      showMathScreen('shape');
    }

    function updateShapeProgress() {
      const el = $('#math-shape-progress');
      if (el) el.textContent = `${shapeCorrect}/${LIT_TARGET}`;
    }

    function nextShapeRound(autoSpeak) {
      const target = MARS_SHAPES[Math.floor(Math.random() * MARS_SHAPES.length)];
      const options = shuffle([...MARS_SHAPES]);
      shapeRound = { target, options };
      const prompt = $('#math-shape-prompt');
      if (prompt) prompt.textContent = '呢個係咩形狀？';
      const fb = $('#math-shape-feedback');
      if (fb) fb.textContent = '';
      const targetEl = $('#math-shape-target');
      if (targetEl) targetEl.innerHTML = shapeGlyphHtml(target, 'is-hero');
      const box = $('#math-shape-options');
      if (box) {
        box.innerHTML = '';
        options.forEach((s) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn btn-secondary math-mars-option';
          btn.textContent = s.name;
          btn.addEventListener('click', () => onShapePick(s.id, btn));
          box.appendChild(btn);
        });
      }
      if (autoSpeak) speak('呢個係咩形狀？');
    }

    function onShapePick(id, btn) {
      if (shapeBusy || !shapeRound) return;
      shapeBusy = true;
      const muted = isMuted();
      const fb = $('#math-shape-feedback');
      const ok = id === shapeRound.target.id;
      if (ok) {
        btn.classList.add('is-ok');
        const { gained } = tryEarnStar();
        if (gained) {
          speech?.playStarCue?.({ muted });
          playMathStarReward();
        } else {
          speech?.playCorrectCue?.({ muted });
        }
        shapeCorrect += 1;
        updateShapeProgress();
        const praise = speech?.speakCorrectFeedback?.({ muted }) || '好叻呀！';
        if (fb) fb.textContent = praise;
        if (shapeCorrect >= LIT_TARGET) {
          if (!isPlanetLit('shape')) lightPlanet('shape');
          if (fb) fb.textContent = `${praise} 火星點亮喇！`;
          setTimeout(() => {
            shapeBusy = false;
            showMathRoundReward('火星十題完成！你好叻呀！', openShapeQuiz);
          }, 900);
          return;
        }
        setTimeout(() => {
          shapeBusy = false;
          nextShapeRound(true);
        }, 1000);
      } else {
        btn.classList.add('is-bad');
        speech?.playTryAgainCue?.({ muted });
        if (fb) fb.textContent = speech?.speakRetryFeedback?.({ muted }) || '試多次！';
        setTimeout(() => {
          btn.classList.remove('is-bad');
          shapeBusy = false;
        }, 700);
      }
    }

    function openPatternQuiz() {
      patternBusy = false;
      patternCorrect = 0;
      updatePatternProgress();
      nextPatternRound(true);
      showMathScreen('pattern');
    }

    function updatePatternProgress() {
      const el = $('#math-pattern-progress');
      if (el) el.textContent = `${patternCorrect}/${LIT_TARGET}`;
    }

    function makePatternRound() {
      const pool = shuffle([...MARS_SHAPES]);
      const a = pool[0];
      const b = pool[1];
      const c = pool[2];
      if (Math.random() < 0.55) {
        const sequence = [a, b, a, b, a, null];
        return { sequence, answer: b, options: shuffle([b, a, c]) };
      }
      const sequence = [a, b, c, a, b, null];
      return { sequence, answer: c, options: shuffle([c, a, b]) };
    }

    function nextPatternRound(autoSpeak) {
      patternRound = makePatternRound();
      const prompt = $('#math-pattern-prompt');
      if (prompt) prompt.textContent = '邊個跟住嚟？';
      const fb = $('#math-pattern-feedback');
      if (fb) fb.textContent = '';
      const row = $('#math-pattern-row');
      if (row) row.innerHTML = patternCellsHtml(patternRound.sequence);
      const box = $('#math-pattern-options');
      if (box) {
        box.innerHTML = '';
        patternRound.options.forEach((s) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'math-mars-option math-mars-option--glyph';
          btn.setAttribute('aria-label', s.name);
          btn.innerHTML = shapeGlyphHtml(s);
          btn.addEventListener('click', () => onPatternPick(s.id, btn));
          box.appendChild(btn);
        });
      }
      if (autoSpeak) speak('邊個跟住嚟？');
    }

    function onPatternPick(id, btn) {
      if (patternBusy || !patternRound) return;
      patternBusy = true;
      const muted = isMuted();
      const fb = $('#math-pattern-feedback');
      const ok = id === patternRound.answer.id;
      if (ok) {
        btn.classList.add('is-ok');
        const { gained } = tryEarnStar();
        if (gained) {
          speech?.playStarCue?.({ muted });
          playMathStarReward();
        } else {
          speech?.playCorrectCue?.({ muted });
        }
        patternCorrect += 1;
        updatePatternProgress();
        const praise = speech?.speakCorrectFeedback?.({ muted }) || '好叻呀！';
        if (fb) fb.textContent = praise;
        if (patternCorrect >= LIT_TARGET) {
          if (!isPlanetLit('shape')) lightPlanet('shape');
          if (fb) fb.textContent = `${praise} 火星點亮喇！`;
          setTimeout(() => {
            patternBusy = false;
            showMathRoundReward('火星規律十題完成！你好叻呀！', openPatternQuiz);
          }, 900);
          return;
        }
        setTimeout(() => {
          patternBusy = false;
          nextPatternRound(true);
        }, 1000);
      } else {
        btn.classList.add('is-bad');
        speech?.playTryAgainCue?.({ muted });
        if (fb) fb.textContent = speech?.speakRetryFeedback?.({ muted }) || '試多次！';
        setTimeout(() => {
          btn.classList.remove('is-bad');
          patternBusy = false;
        }, 700);
      }
    }

    function goToNextPlanetFromHub() {
      const planet = getPlanetById(loadState().currentPlanetId);
      if (!isPlanetLit(planet.id)) return;
      const next = getPlanetById(getNextPlanetId(planet.id));
      if (next.id === planet.id) return;
      offerWarpHop(planet, next);
    }

    function launchFromHub() {
      const planet = getPlanetById(loadState().currentPlanetId);
      if (planet.id === 'count') {
        openLearn();
        return;
      }
      if (planet.id === 'compare-size') {
        window.KakaAdditionGame.openEarthAddition();
        return;
      }
      if (planet.id === 'time') {
        openVenusLearn();
        return;
      }
      if (planet.id === 'shape') {
        openMarsLearn();
        return;
      }
      const note = $('#math-hub-coming');
      if (note) {
        note.hidden = false;
        note.textContent = `${planet.name}玩法即將開放；可以揀水星、金星、地球或者火星玩！`;
      }
      renderHub();
    }

    function bind() {
      const start = $('#btn-start-math');
      if (!start) {
        console.error('KakaMath: #btn-start-math missing.');
        return;
      }
      start.addEventListener('click', () => openGalaxy());

      $('#btn-back-math-hub')?.addEventListener('click', () => openGalaxy());
      $('#btn-back-math-galaxy')?.addEventListener('click', () => goHome());
      $('#btn-math-launch')?.addEventListener('click', () => launchFromHub());
      $('#btn-math-go-next')?.addEventListener('click', () => goToNextPlanetFromHub());
      $('#btn-math-warp-go')?.addEventListener('click', () => finishWarpGo());
      $('#btn-math-warp-stay')?.addEventListener('click', () => finishWarpStay());

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

      $('#btn-back-math-venus-learn')?.addEventListener('click', () => openHub());
      $('#math-venus-learn-tap')?.addEventListener('click', () => speakVenusLearn());
      $('#btn-math-venus-learn-prev')?.addEventListener('click', () => {
        if (vLearnIndex <= 0) return;
        vLearnIndex -= 1;
        renderVenusLearnCard(true);
      });
      $('#btn-math-venus-learn-next')?.addEventListener('click', () => {
        if (vLearnIndex >= VENUS_TIME_LEARN_CARDS.length - 1) return;
        vLearnIndex += 1;
        renderVenusLearnCard(true);
      });
      $('#btn-math-venus-learn-play')?.addEventListener('click', () => openVenusPlay());

      $('#btn-back-math-venus-play')?.addEventListener('click', () => openVenusLearn());
      $('#btn-math-mode-time-analog')?.addEventListener('click', () => openTimeQuiz('analog'));
      $('#btn-math-mode-time-digital')?.addEventListener('click', () => openTimeQuiz('digital'));

      $('#btn-back-math-time')?.addEventListener('click', () => openVenusPlay());
      $('#btn-math-time-speak')?.addEventListener('click', () => {
        if (timeRound) speak(`幾點？${timeRound.target.say}`);
      });

      $('#btn-back-math-mars-learn')?.addEventListener('click', () => openHub());
      $('#math-mars-learn-tap')?.addEventListener('click', () => speakMarsLearn());
      $('#btn-math-mars-learn-prev')?.addEventListener('click', () => {
        if (marsLearnIndex <= 0) return;
        marsLearnIndex -= 1;
        renderMarsLearnCard(true);
      });
      $('#btn-math-mars-learn-next')?.addEventListener('click', () => {
        if (marsLearnIndex >= MARS_LEARN_CARDS.length - 1) return;
        marsLearnIndex += 1;
        renderMarsLearnCard(true);
      });
      $('#btn-math-mars-learn-play')?.addEventListener('click', () => openMarsPlay());

      $('#btn-back-math-mars-play')?.addEventListener('click', () => openMarsLearn());
      $('#btn-math-mode-shape')?.addEventListener('click', () => openShapeQuiz());
      $('#btn-math-mode-pattern')?.addEventListener('click', () => openPatternQuiz());

      $('#btn-back-math-shape')?.addEventListener('click', () => openMarsPlay());
      $('#btn-math-shape-speak')?.addEventListener('click', () => speak('呢個係咩形狀？'));

      $('#btn-back-math-pattern')?.addEventListener('click', () => openMarsPlay());
      $('#btn-math-pattern-speak')?.addEventListener('click', () => speak('邊個跟住嚟？'));
    }

    bind();

    window.KakaAdditionGame.init({
      storage: window.KakaMathStorage,
      loadState,
      updateState,
      tryEarnStar,
      isPlanetLit,
      lightPlanet,
      getPlanetById,
      getNextPlanetId,
      offerWarpHop,
      openHub,
      openGalaxy,
      showMathScreen,
      speak,
      speech,
      isMuted,
      playMathStarReward,
    });

    window.KakaMathMercuryMissions?.init({
      loadState,
      saveState,
      mastery,
      speak,
      speech,
      tryEarnStar,
      isPlanetLit,
      lightPlanet,
      getPlanetById,
      getNextPlanetId,
      offerWarpHop,
      openPlay,
      showMathScreen,
      playMathStarReward,
      showMathRoundReward,
      isMuted,
    });

    window.KakaMath = {
      openHub,
      goHome,
      renderHub,
      openLearn,
      openCount,
      openEarthAddition: () => window.KakaAdditionGame.openEarthAddition(),
      openVenusLearn,
      openTimeQuiz,
      openMarsLearn,
      openShapeQuiz,
      openPatternQuiz,
      openGalaxy,
      offerWarpHop,
    };
  }
})();

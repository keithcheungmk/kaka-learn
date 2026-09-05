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
    if (!window.KakaMathStorage || !window.KakaMathSkills || !window.KakaAdditionData) {
      console.error('KakaMath: math modules missing.');
      disableMathEntry();
      return;
    }

    const {
      loadState,
      updateState,
      tryEarnStar,
      isPlanetLit,
      lightPlanet,
      isAdditionBaseUnlocked,
      isAdditionMissionDone,
      completeAdditionMission,
    } = window.KakaMathStorage;
    const { MATH_PLANETS, getPlanetById, getNextPlanetId, planetGlobeHtml } = window.KakaMathSkills;
    const { additionLevels, getLevelByBase } = window.KakaAdditionData;
    const speech = window.KakaSpeech || null;

    const ZH_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    const COUNT_EMOJIS = ['⭐', '🌙', '🚀', '🪨', '💫', '🛰️'];
    const LEARN_COUNTS = [1, 2, 3, 4, 5];
    const LIT_TARGET = 5;

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

    /** 先學：整點 + 半點講清楚 */
    const MOON_LEARN_CARDS = [
      { ...clockItem(3, false), learnSay: '三點鐘。短針指住 3，長針指住 12。' },
      { ...clockItem(3, true), learnSay: '三點半。長針指住 6，就係半點。' },
      { ...clockItem(12, false), learnSay: '十二點鐘。兩支針都指住 12。' },
      { ...clockItem(6, true), learnSay: '六點半。長針指住 6。' },
    ];

    const $ = (sel, root = document) => root.querySelector(sel);

    const screens = {
      home: '#screen-home',
      hub: '#screen-math-hub',
      galaxy: '#screen-math-galaxy',
      learn: '#screen-math-learn',
      play: '#screen-math-play',
      count: '#screen-math-count',
      vlearn: '#screen-math-venus-learn',
      vplay: '#screen-math-venus-play',
      compare: '#screen-math-compare',
      elevels: '#screen-math-earth-levels',
      egame: '#screen-math-earth-game',
      mlearn: '#screen-math-moon-learn',
      mplay: '#screen-math-moon-play',
      time: '#screen-math-time',
    };

    let learnIndex = 0;
    let countBusy = false;
    let countRound = null;
    let countCorrect = 0;
    let countEmoji = COUNT_EMOJIS[0];
    let vLearnIndex = 0;
    let compareBusy = false;
    let compareRound = null;
    let compareCorrect = 0;
    let compareEmoji = '🌟';
    let addMissionId = null;
    let addLevelBase = 5;
    let addMissionIdx = 0;
    let addSlotB = 0;
    let addBusy = false;
    let addDragState = null;
    let mLearnIndex = 0;
    let timeBusy = false;
    let timeRound = null;
    let timeCorrect = 0;
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
      if (['count', 'compare', 'egame', 'time'].includes(name)) {
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
        const playable = ['count', 'compare-qty', 'compare-size', 'time'].includes(planet.id);
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
          speech?.playStarCue?.({ muted });
          playMathStarReward();
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
          const fromP = getPlanetById('count');
          const toP = getPlanetById(getNextPlanetId('count'));
          setTimeout(() => {
            countBusy = false;
            offerWarpHop(fromP, toP);
          }, 900);
          return;
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

    /* ---------- 金星・先學（邊多邊少） ---------- */
    const VENUS_LEARN_CARDS = [
      { left: 1, right: 2, say: '右邊多啲' },
      { left: 3, right: 3, say: '一樣多' },
      { left: 5, right: 2, say: '左邊多啲' },
      { left: 4, right: 6, say: '右邊多啲' },
    ];

    function compareEmojiForCard() {
      return COUNT_EMOJIS[Math.floor(Math.random() * COUNT_EMOJIS.length)];
    }

    function renderCompareItems(el, n, emoji) {
      if (!el) return;
      el.innerHTML = '';
      for (let i = 0; i < n; i += 1) {
        const span = document.createElement('span');
        span.className = 'math-count-dot';
        if (window.KakaEmojiArt) span.innerHTML = window.KakaEmojiArt.html(emoji);
        else span.textContent = emoji;
        span.style.animationDelay = `${i * 0.04}s`;
        el.appendChild(span);
      }
    }

    function openVenusLearn() {
      updateState({ currentPlanetId: 'compare-qty' });
      vLearnIndex = 0;
      compareEmoji = compareEmojiForCard();
      const title = $('#math-venus-learn-title');
      if (title) title.textContent = '金星・先學';
      renderVenusLearnCard(true);
      showMathScreen('vlearn');
    }

    function renderVenusLearnCard(autoSpeak) {
      const card = VENUS_LEARN_CARDS[vLearnIndex];
      renderCompareItems($('#math-venus-learn-left'), card.left, compareEmoji);
      renderCompareItems($('#math-venus-learn-right'), card.right, compareEmoji);
      const say = $('#math-venus-learn-say');
      if (say) say.textContent = card.say;
      const progress = $('#math-venus-learn-progress');
      if (progress) progress.textContent = `${vLearnIndex + 1}/${VENUS_LEARN_CARDS.length}`;

      const prev = $('#btn-math-venus-learn-prev');
      const next = $('#btn-math-venus-learn-next');
      const finish = $('#math-venus-learn-finish-row');
      if (prev) prev.disabled = vLearnIndex <= 0;
      if (next) next.hidden = vLearnIndex >= VENUS_LEARN_CARDS.length - 1;
      if (finish) finish.hidden = vLearnIndex < VENUS_LEARN_CARDS.length - 1;

      if (autoSpeak) speakVenusLearn();
    }

    function speakVenusLearn() {
      const card = VENUS_LEARN_CARDS[vLearnIndex];
      speak(card.say);
    }

    /* ---------- 金星・邊多邊少 ---------- */
    function openVenusPlay() {
      const stars = $('#math-venus-play-stars');
      const state = loadState();
      if (stars) stars.textContent = `${state.starsToday}/10`;
      const title = $('#math-venus-play-title');
      if (title) title.textContent = '金星・去玩玩';
      showMathScreen('vplay');
    }

    function openCompare() {
      compareBusy = false;
      compareCorrect = 0;
      compareEmoji = compareEmojiForCard();
      updateCompareProgress();
      nextCompareRound(true);
      showMathScreen('compare');
    }

    function updateCompareProgress() {
      const el = $('#math-compare-progress');
      if (el) el.textContent = `${compareCorrect}/${LIT_TARGET}`;
    }

    function makeCompareRound() {
      const roll = Math.random();
      if (roll < 0.25) {
        const n = 2 + Math.floor(Math.random() * 7);
        return { left: n, right: n, answer: 'same' };
      }
      const left = 1 + Math.floor(Math.random() * 9);
      let right = 1 + Math.floor(Math.random() * 9);
      while (right === left) {
        right = 1 + Math.floor(Math.random() * 9);
      }
      return { left, right, answer: left > right ? 'left' : 'right' };
    }

    function nextCompareRound(autoSpeak) {
      compareRound = makeCompareRound();
      compareEmoji = compareEmojiForCard();
      renderCompareItems($('#math-compare-left'), compareRound.left, compareEmoji);
      renderCompareItems($('#math-compare-right'), compareRound.right, compareEmoji);
      const prompt = $('#math-compare-prompt');
      if (prompt) prompt.textContent = '邊堆多啲？撳左邊或右邊；一樣就撳「一樣多」';
      const fb = $('#math-compare-feedback');
      if (fb) fb.textContent = '';
      $('#math-compare-field')
        ?.querySelectorAll('.math-compare-pick')
        .forEach((b) => b.classList.remove('is-ok', 'is-bad'));
      if (autoSpeak) speakComparePrompt();
    }

    function speakComparePrompt() {
      speak('邊堆多啲？');
    }

    function onComparePick(choice) {
      if (compareBusy || !compareRound) return;
      compareBusy = true;
      const muted = isMuted();
      const fb = $('#math-compare-feedback');
      const ok = choice === compareRound.answer;

      const sideBtn =
        choice === 'same'
          ? $('#btn-math-compare-same')
          : $(`#math-compare-field .math-compare-pick[data-side="${choice}"]`);

      if (ok) {
        sideBtn?.classList.add('is-ok');
        const { gained } = tryEarnStar();
        if (gained) {
          speech?.playStarCue?.({ muted });
          playMathStarReward();
        } else {
          speech?.playCorrectCue?.({ muted });
        }
        compareCorrect += 1;
        updateCompareProgress();
        const praise =
          speech?.speakCorrectFeedback?.({ muted }) || '你好叻呀，答啱咗！';
        if (fb) fb.textContent = gained ? `${praise} ★` : praise;

        if (compareCorrect >= LIT_TARGET && !isPlanetLit('compare-qty')) {
          lightPlanet('compare-qty');
          if (fb) fb.textContent = `${praise} 金星點亮喇！`;
          const fromP = getPlanetById('compare-qty');
          const toP = getPlanetById(getNextPlanetId('compare-qty'));
          setTimeout(() => {
            compareBusy = false;
            offerWarpHop(fromP, toP);
          }, 900);
          return;
        }

        const stars = $('#math-venus-play-stars');
        const state = loadState();
        if (stars) stars.textContent = `${state.starsToday}/10`;

        setTimeout(() => {
          compareBusy = false;
          nextCompareRound(true);
        }, 1100);
      } else {
        sideBtn?.classList.add('is-bad');
        speech?.playTryAgainCue?.({ muted });
        const line = speech?.speakRetryFeedback?.({ muted }) || '唔緊要，試多次！';
        if (fb) fb.textContent = line;
        const field = $('#math-compare-field');
        if (field) field.style.outline = '3px solid rgba(253, 230, 138, 0.7)';
        setTimeout(() => {
          sideBtn?.classList.remove('is-bad');
          if (field) field.style.outline = '';
          compareBusy = false;
        }, 700);
      }
    }

    /* ---------- 地球・加法（能量方塊） ---------- */
    const EARTH_PLANET_ID = 'compare-size';

    function updateEarthStarsDisplay() {
      const state = loadState();
      const txt = `${state.starsToday}/10`;
      const a = $('#math-earth-levels-stars');
      if (a) a.textContent = txt;
    }

    function isEarthLevelComplete(level) {
      return level.missions.every((m) => isAdditionMissionDone(m.id));
    }

    function openEarthLevelSelect() {
      updateState({ currentPlanetId: EARTH_PLANET_ID });
      renderEarthLevelGrid();
      showMathScreen('elevels');
    }

    function renderEarthLevelGrid() {
      const grid = $('#math-earth-level-grid');
      if (!grid) return;
      grid.innerHTML = '';
      additionLevels.forEach((level) => {
        const unlocked = isAdditionBaseUnlocked(level.base);
        const done = isEarthLevelComplete(level);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `math-addition-level-card${unlocked ? '' : ' is-locked'}${done ? ' is-done' : ''}`;
        btn.disabled = !unlocked;
        btn.innerHTML = `
          <span class="math-addition-level-num">${level.targetNumber}</span>
          <span class="math-addition-level-title">${level.title}</span>
        `;
        btn.addEventListener('click', () => {
          const first = level.missions.findIndex((m) => !isAdditionMissionDone(m.id));
          openEarthGame(level.base, first >= 0 ? first : 0);
        });
        grid.appendChild(btn);
      });
      updateEarthStarsDisplay();
    }

    function getEarthMissionContext() {
      const level = getLevelByBase(addLevelBase);
      const mission = level.missions[addMissionIdx];
      return { level, mission };
    }

    function createEnergyBlock({ preset = false } = {}) {
      const b = document.createElement('span');
      b.className = 'math-energy-block';
      b.setAttribute('role', 'img');
      b.setAttribute('aria-label', '能量方塊');
      if (preset) {
        b.dataset.preset = '1';
        b.style.opacity = '0.85';
        b.style.filter = 'hue-rotate(-18deg)';
      } else {
        b.classList.add('is-in-warehouse');
        b.dataset.draggable = '1';
      }
      return b;
    }

    function countSlotBBlocks() {
      return $('#math-earth-blocks-b')?.querySelectorAll('.math-energy-block:not([data-preset="1"])').length || 0;
    }

    function renderEarthEquation() {
      const { level, mission } = getEarthMissionContext();
      const eq = $('#math-earth-equation');
      if (!eq) return;
      addSlotB = countSlotBBlocks();
      let mid =
        addSlotB <= 0
          ? '<span class="math-addition-eq-b">❓</span>'
          : addSlotB < mission.b
            ? `<span class="math-addition-eq-b">${addSlotB}</span>`
            : `<span class="math-addition-eq-b">${mission.b}</span>`;
      eq.innerHTML = `
        <span class="math-addition-eq-a">${mission.a}</span>
        <span>+</span>
        ${mid}
        <span>=</span>
        <span class="math-addition-eq-sum">${level.targetNumber}</span>
      `;
    }

    function renderEarthSlotA(mission) {
      const box = $('#math-earth-blocks-a');
      if (!box) return;
      box.innerHTML = '';
      for (let i = 0; i < mission.a; i += 1) {
        box.appendChild(createEnergyBlock({ preset: true }));
      }
    }

    function renderEarthSlotB() {
      const box = $('#math-earth-blocks-b');
      if (!box) return;
      box.innerHTML = '';
      addSlotB = 0;
    }

    function bindEarthBlockDrag(el) {
      el.addEventListener('pointerdown', (e) => {
        if (addBusy || el.dataset.preset === '1' || el.dataset.draggable === '0') return;
        e.preventDefault();
        addDragState = {
          el,
          id: e.pointerId,
          warehouse: el.dataset.warehouse === '1',
          fromCell: el.parentElement,
          ghost: null,
          x: e.clientX,
          y: e.clientY,
          moved: false,
        };
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-dragging');

        const move = (ev) => {
          if (!addDragState) return;
          if (Math.hypot(ev.clientX - addDragState.x, ev.clientY - addDragState.y) < 8) return;
          addDragState.moved = true;
          if (!addDragState.ghost) {
            const r = el.getBoundingClientRect();
            addDragState.ghost = el.cloneNode(true);
            addDragState.ghost.className = 'math-energy-block is-flying';
            addDragState.ghost.style.cssText = `position:fixed;z-index:50;width:${r.width}px;height:${r.height}px;left:${r.left}px;top:${r.top}px;pointer-events:none;`;
            document.body.appendChild(addDragState.ghost);
          }
          addDragState.ghost.style.left = `${ev.clientX - addDragState.ghost.offsetWidth / 2}px`;
          addDragState.ghost.style.top = `${ev.clientY - addDragState.ghost.offsetHeight / 2}px`;
        };

        const up = (ev) => {
          el.releasePointerCapture(ev.pointerId);
          el.classList.remove('is-dragging');
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          addDragState?.ghost?.remove();
          const ds = addDragState;
          addDragState = null;
          if (!ds?.moved) return;

          const target = document.elementFromPoint(ev.clientX, ev.clientY);
          const dropB = target?.closest?.('#math-earth-blocks-b');
          const dropWh = target?.closest?.('#math-earth-warehouse');
          const slotB = $('#math-earth-slot-b');

          if (dropWh && ds.fromCell?.id === 'math-earth-blocks-b') {
            returnEarthBlockToWarehouse(el);
          } else if (dropB && ds.warehouse) {
            placeEarthBlockFromWarehouse(el, dropB, ds.el);
          } else if (dropB && ds.fromCell?.id === 'math-earth-blocks-b' && dropB !== ds.fromCell) {
            dropB.appendChild(el);
            syncEarthSlotB();
          } else if (slotB && !dropB && !dropWh && ds.fromCell?.id === 'math-earth-blocks-b') {
            returnEarthBlockToWarehouse(el);
          }
        };

        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
      });
    }

    function attachEarthBlock(el, { warehouse = false } = {}) {
      if (warehouse) {
        el.dataset.warehouse = '1';
        el.classList.add('is-in-warehouse');
      } else {
        delete el.dataset.warehouse;
        el.classList.remove('is-in-warehouse');
      }
      el.dataset.draggable = '1';
      el.addEventListener('click', onEarthBlockTap);
      bindEarthBlockDrag(el);
    }

    function onEarthBlockTap(e) {
      if (addBusy || addDragState) return;
      const block = e.currentTarget;
      if (block.dataset.warehouse === '1') {
        const box = $('#math-earth-blocks-b');
        if (box) placeEarthBlockFromWarehouse(block, box, block);
        return;
      }
      if (block.closest('#math-earth-blocks-b')) {
        returnEarthBlockToWarehouse(block);
      }
    }

    function placeEarthBlockFromWarehouse(source, dropBox, flyFrom) {
      const { mission } = getEarthMissionContext();
      const current = countSlotBBlocks();
      if (current >= mission.b) return;

      const go = () => {
        const block = createEnergyBlock();
        dropBox.appendChild(block);
        attachEarthBlock(block);
        if (source?.dataset.warehouse === '1') source.remove();
        syncEarthSlotB();
      };

      if (flyFrom) {
        const ghost = flyFrom.cloneNode(true);
        ghost.className = 'math-energy-block is-flying';
        const rf = flyFrom.getBoundingClientRect();
        const rt = dropBox.getBoundingClientRect();
        ghost.style.cssText = `position:fixed;z-index:50;width:${rf.width}px;height:${rf.height}px;left:${rf.left}px;top:${rf.top}px;pointer-events:none;`;
        document.body.appendChild(ghost);
        requestAnimationFrame(() => {
          ghost.style.transition = 'left 0.32s ease, top 0.32s ease';
          ghost.style.left = `${rt.left + rt.width / 2 - rf.width / 2}px`;
          ghost.style.top = `${rt.top + rt.height / 2 - rf.height / 2}px`;
        });
        setTimeout(() => {
          ghost.remove();
          go();
        }, 340);
      } else {
        go();
      }
    }

    function returnEarthBlockToWarehouse(block) {
      if (addBusy || block.dataset.preset === '1') return;
      block.remove();
      const b = createEnergyBlock();
      attachEarthBlock(b, { warehouse: true });
      $('#math-earth-warehouse')?.appendChild(b);
      syncEarthSlotB();
    }

    function renderEarthWarehouse(mission) {
      const box = $('#math-earth-warehouse');
      if (!box) return;
      box.innerHTML = '';
      const extra = mission.b + Math.max(2, Math.ceil(mission.b / 2));
      for (let i = 0; i < extra; i += 1) {
        const b = createEnergyBlock();
        attachEarthBlock(b, { warehouse: true });
        box.appendChild(b);
      }
    }

    function syncEarthSlotB() {
      addSlotB = countSlotBBlocks();
      const slotB = $('#math-earth-slot-b');
      const { mission } = getEarthMissionContext();
      slotB?.classList.toggle('is-drop-target', addSlotB < mission.b);
      renderEarthEquation();
      if (addSlotB >= mission.b) checkEarthAddition();
    }

    function openEarthGame(base, missionIdx = 0) {
      addLevelBase = base;
      addMissionIdx = missionIdx;
      addBusy = false;
      addDragState = null;
      const { level, mission } = getEarthMissionContext();
      addMissionId = mission.id;

      const title = $('#math-earth-game-title');
      if (title) title.textContent = level.title;
      const prog = $('#math-earth-mission-progress');
      if (prog) prog.textContent = `${addMissionIdx + 1}/${level.missions.length}`;
      const scenario = $('#math-earth-scenario');
      if (scenario) scenario.textContent = mission.scenario;
      const desc = $('#math-earth-desc');
      if (desc) desc.textContent = mission.desc;
      const fb = $('#math-earth-feedback');
      if (fb) fb.textContent = '';
      const celeb = $('#math-earth-celebrate');
      if (celeb) celeb.hidden = true;

      renderEarthSlotA(mission);
      renderEarthSlotB();
      renderEarthWarehouse(mission);
      renderEarthEquation();
      $('#math-earth-slots')?.classList.remove('is-merging');
      showMathScreen('egame');
      speak(mission.desc);
    }

    function checkEarthAddition() {
      if (addBusy) return;
      const { level, mission } = getEarthMissionContext();
      if (countSlotBBlocks() < mission.b) return;
      addBusy = true;

      $('#math-earth-slots')?.classList.add('is-merging');
      const muted = isMuted();
      speech?.playCorrectCue?.({ muted });

      const celeb = $('#math-earth-celebrate');
      const sayEl = $('#math-earth-celebrate-say');
      const line = `${mission.a}加${mission.b}等於${level.targetNumber}！`;
      if (sayEl) sayEl.textContent = line;
      if (celeb) celeb.hidden = false;
      speak(line);

      setTimeout(() => {
        $('#math-earth-slots')?.classList.remove('is-merging');
        const wasLit = isPlanetLit(EARTH_PLANET_ID);
        if (!isAdditionMissionDone(mission.id)) {
          completeAdditionMission(mission.id);
          const { gained } = tryEarnStar();
          if (gained) {
            speech?.playStarCue?.({ muted });
            playMathStarReward();
          }
          const fb = $('#math-earth-feedback');
          if (fb) fb.textContent = gained ? '好叻呀！★' : '好叻呀！';
        }
        updateEarthStarsDisplay();

        if (!wasLit && isPlanetLit(EARTH_PLANET_ID)) {
          addBusy = false;
          if (celeb) celeb.hidden = true;
          const fromP = getPlanetById(EARTH_PLANET_ID);
          const toP = getPlanetById(getNextPlanetId(EARTH_PLANET_ID));
          if (fromP && toP && fromP.id !== toP.id) offerWarpHop(fromP, toP);
          else openEarthLevelSelect();
          return;
        }
        addBusy = false;
      }, 900);
    }

    function goEarthNextMission() {
      const celeb = $('#math-earth-celebrate');
      if (celeb) celeb.hidden = true;
      const { level } = getEarthMissionContext();
      if (addMissionIdx < level.missions.length - 1) {
        openEarthGame(addLevelBase, addMissionIdx + 1);
        return;
      }
      openEarthLevelSelect();
    }

    /* ---------- 月球・先學（時間） ---------- */
    function openMoonLearn() {
      updateState({ currentPlanetId: 'time' });
      mLearnIndex = 0;
      const title = $('#math-moon-learn-title');
      if (title) title.textContent = '月球・先學';
      renderMoonLearnCard(true);
      showMathScreen('mlearn');
    }

    function renderMoonLearnCard(autoSpeak) {
      const card = MOON_LEARN_CARDS[mLearnIndex];
      const face = $('#math-moon-learn-face');
      if (face) face.innerHTML = clockFaceHtml(card);
      const say = $('#math-moon-learn-say');
      if (say) say.textContent = card.say;
      const progress = $('#math-moon-learn-progress');
      if (progress) progress.textContent = `${mLearnIndex + 1}/${MOON_LEARN_CARDS.length}`;

      const prev = $('#btn-math-moon-learn-prev');
      const next = $('#btn-math-moon-learn-next');
      const finish = $('#math-moon-learn-finish-row');
      if (prev) prev.disabled = mLearnIndex <= 0;
      if (next) next.hidden = mLearnIndex >= MOON_LEARN_CARDS.length - 1;
      if (finish) finish.hidden = mLearnIndex < MOON_LEARN_CARDS.length - 1;

      if (autoSpeak) speakMoonLearn();
    }

    function speakMoonLearn() {
      const card = MOON_LEARN_CARDS[mLearnIndex];
      speak(card.learnSay || card.say);
    }

    /* ---------- 月球・聽一聽揀鐘 ---------- */
    function openMoonPlay() {
      const stars = $('#math-moon-play-stars');
      const state = loadState();
      if (stars) stars.textContent = `${state.starsToday}/10`;
      const title = $('#math-moon-play-title');
      if (title) title.textContent = '月球・去玩玩';
      showMathScreen('mplay');
    }

    function openTimeQuiz() {
      timeBusy = false;
      timeCorrect = 0;
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
      if (prompt) prompt.textContent = '揀出正確嘅時間';
      const fb = $('#math-time-feedback');
      if (fb) fb.textContent = '';

      const box = $('#math-time-options');
      if (box) {
        box.innerHTML = '';
        options.forEach((c) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'math-clock-pick';
          btn.setAttribute('aria-label', c.say);
          btn.innerHTML = `
            ${clockFaceHtml(c, { small: true })}
            <span class="math-clock-label">${c.say}</span>
          `;
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

        if (timeCorrect >= LIT_TARGET && !isPlanetLit('time')) {
          lightPlanet('time');
          if (fb) fb.textContent = `${praise} 月球點亮喇！`;
          const fromP = getPlanetById('time');
          const toP = getPlanetById(getNextPlanetId('time'));
          setTimeout(() => {
            timeBusy = false;
            offerWarpHop(fromP, toP);
          }, 900);
          return;
        }

        const stars = $('#math-moon-play-stars');
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
      if (planet.id === 'compare-qty') {
        openVenusLearn();
        return;
      }
      if (planet.id === 'compare-size') {
        openEarthLevelSelect();
        return;
      }
      if (planet.id === 'time') {
        openMoonLearn();
        return;
      }
      const note = $('#math-hub-coming');
      if (note) {
        note.hidden = false;
        note.textContent = `${planet.name}玩法即將開放；可以揀水星、金星、地球或者月球玩！`;
      }
      renderHub();
    }

    function bind() {
      const start = $('#btn-start-math');
      if (!start) {
        console.error('KakaMath: #btn-start-math missing.');
        return;
      }
      start.addEventListener('click', () => openHub());

      $('#btn-back-math-hub')?.addEventListener('click', () => goHome());
      $('#btn-math-galaxy')?.addEventListener('click', () => openGalaxy());
      $('#btn-back-math-galaxy')?.addEventListener('click', () => openHub());
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
        if (vLearnIndex >= VENUS_LEARN_CARDS.length - 1) return;
        vLearnIndex += 1;
        renderVenusLearnCard(true);
      });
      $('#btn-math-venus-learn-play')?.addEventListener('click', () => openVenusPlay());

      $('#btn-back-math-venus-play')?.addEventListener('click', () => openVenusLearn());
      $('#btn-math-mode-compare')?.addEventListener('click', () => openCompare());

      $('#btn-back-math-compare')?.addEventListener('click', () => openVenusPlay());
      $('#btn-math-compare-speak')?.addEventListener('click', () => speakComparePrompt());
      $('#btn-math-compare-same')?.addEventListener('click', () => onComparePick('same'));
      document
        .querySelectorAll('#math-compare-field .math-compare-pick')
        .forEach((btn) => {
          btn.addEventListener('click', () => onComparePick(btn.dataset.side));
        });

      $('#btn-back-math-earth-levels')?.addEventListener('click', () => openHub());
      $('#btn-back-math-earth-game')?.addEventListener('click', () => openEarthLevelSelect());
      $('#btn-math-earth-next')?.addEventListener('click', () => goEarthNextMission());

      $('#btn-back-math-moon-learn')?.addEventListener('click', () => openHub());
      $('#math-moon-learn-tap')?.addEventListener('click', () => speakMoonLearn());
      $('#btn-math-moon-learn-prev')?.addEventListener('click', () => {
        if (mLearnIndex <= 0) return;
        mLearnIndex -= 1;
        renderMoonLearnCard(true);
      });
      $('#btn-math-moon-learn-next')?.addEventListener('click', () => {
        if (mLearnIndex >= MOON_LEARN_CARDS.length - 1) return;
        mLearnIndex += 1;
        renderMoonLearnCard(true);
      });
      $('#btn-math-moon-learn-play')?.addEventListener('click', () => openMoonPlay());

      $('#btn-back-math-moon-play')?.addEventListener('click', () => openMoonLearn());
      $('#btn-math-mode-time')?.addEventListener('click', () => openTimeQuiz());

      $('#btn-back-math-time')?.addEventListener('click', () => openMoonPlay());
      $('#btn-math-time-speak')?.addEventListener('click', () => {
        if (timeRound) speak(`幾點？${timeRound.target.say}`);
      });
    }

    bind();

    window.KakaMath = {
      openHub,
      goHome,
      renderHub,
      openLearn,
      openCount,
      openVenusLearn,
      openCompare,
      openEarthLevelSelect,
      openEarthGame,
      openMoonLearn,
      openTimeQuiz,
      openGalaxy,
      offerWarpHop,
    };
  }
})();

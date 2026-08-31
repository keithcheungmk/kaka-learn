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
      elearn: '#screen-math-earth-learn',
      eplay: '#screen-math-earth-play',
      size: '#screen-math-size',
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
    let eLearnIndex = 0;
    let sizeBusy = false;
    let sizeRound = null;
    let sizeCorrect = 0;
    let sizeEmoji = '🌕';
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
      if (['count', 'compare', 'size', 'time'].includes(name)) {
        const fx = window.KakaStarFx;
        fx?.mountPlayScreen?.(el);
        fx?.ensureMathStarTarget?.(el, `${loadState().starsToday}/10`);
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
        if (planet.id === 'count') {
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

    /* ---------- 地球・先學（大細長短） ---------- */
    /** 用原創圖形：大細＝圓；長短＝橫線（唔用 emoji 拉長縮細） */
    const EARTH_LEARN_CARDS = [
      { q: '邊個大啲？', kind: 'circle', left: 0.6, right: 1.05, say: '右邊大啲' },
      { q: '邊個長啲？', kind: 'bar', left: 0.45, right: 1.0, say: '右邊長啲' },
      { q: '邊個細啲？', kind: 'circle', left: 1.05, right: 0.6, say: '左邊細啲' },
      { q: '邊個短啲？', kind: 'bar', left: 0.45, right: 1.0, say: '左邊短啲' },
    ];

    function drawCompareShape(el, kind, scale) {
      if (!el) return;
      if (kind === 'bar') {
        const widthPct = Math.max(18, Math.min(100, Math.round(scale * 100)));
        el.innerHTML = `<span class="math-bar-shape" style="width:${widthPct}%"></span>`;
        return;
      }
      const size = Math.max(1.8, 4.5 * scale);
      el.innerHTML = `<span class="math-circle-shape" style="width:${size}rem;height:${size}rem"></span>`;
    }

    function openEarthLearn() {
      updateState({ currentPlanetId: 'compare-size' });
      eLearnIndex = 0;
      const title = $('#math-earth-learn-title');
      if (title) title.textContent = '地球・先學';
      renderEarthLearnCard(true);
      showMathScreen('elearn');
    }

    function renderEarthLearnCard(autoSpeak) {
      const card = EARTH_LEARN_CARDS[eLearnIndex];
      drawCompareShape($('#math-earth-learn-left'), card.kind, card.left);
      drawCompareShape($('#math-earth-learn-right'), card.kind, card.right);
      const say = $('#math-earth-learn-say');
      if (say) say.textContent = card.say;
      const lead = $('#math-earth-learn-lead');
      if (lead) lead.textContent = card.q;
      const progress = $('#math-earth-learn-progress');
      if (progress) progress.textContent = `${eLearnIndex + 1}/${EARTH_LEARN_CARDS.length}`;

      const prev = $('#btn-math-earth-learn-prev');
      const next = $('#btn-math-earth-learn-next');
      const finish = $('#math-earth-learn-finish-row');
      if (prev) prev.disabled = eLearnIndex <= 0;
      if (next) next.hidden = eLearnIndex >= EARTH_LEARN_CARDS.length - 1;
      if (finish) finish.hidden = eLearnIndex < EARTH_LEARN_CARDS.length - 1;

      if (autoSpeak) speakEarthLearn();
    }

    function speakEarthLearn() {
      const card = EARTH_LEARN_CARDS[eLearnIndex];
      speak(card.say);
    }

    /* ---------- 地球・比一比 ---------- */
    function openEarthPlay() {
      const stars = $('#math-earth-play-stars');
      const state = loadState();
      if (stars) stars.textContent = `${state.starsToday}/10`;
      const title = $('#math-earth-play-title');
      if (title) title.textContent = '地球・去玩玩';
      showMathScreen('eplay');
    }

    const SIZE_QUESTIONS = [
      { q: '邊個大啲？', kind: 'circle', answerWhenLeftBigger: 'left', answerWhenRightBigger: 'right' },
      { q: '邊個細啲？', kind: 'circle', answerWhenLeftBigger: 'right', answerWhenRightBigger: 'left' },
      { q: '邊個長啲？', kind: 'bar', answerWhenLeftBigger: 'left', answerWhenRightBigger: 'right' },
      { q: '邊個短啲？', kind: 'bar', answerWhenLeftBigger: 'right', answerWhenRightBigger: 'left' },
    ];

    function openSizeQuiz() {
      sizeBusy = false;
      sizeCorrect = 0;
      updateSizeProgress();
      nextSizeRound(true);
      showMathScreen('size');
    }

    function updateSizeProgress() {
      const el = $('#math-size-progress');
      if (el) el.textContent = `${sizeCorrect}/${LIT_TARGET}`;
    }

    function nextSizeRound(autoSpeak) {
      const def = SIZE_QUESTIONS[Math.floor(Math.random() * SIZE_QUESTIONS.length)];
      const leftBigger = Math.random() < 0.5;
      const leftScale = leftBigger ? 1.05 : 0.6;
      const rightScale = leftBigger ? 0.6 : 1.05;
      const answer = leftBigger ? def.answerWhenLeftBigger : def.answerWhenRightBigger;
      sizeRound = { answer, prompt: def.q, kind: def.kind };

      drawCompareShape($('#math-size-left'), def.kind, leftScale);
      drawCompareShape($('#math-size-right'), def.kind, rightScale);

      const prompt = $('#math-size-prompt');
      if (prompt) prompt.textContent = def.q;
      const fb = $('#math-size-feedback');
      if (fb) fb.textContent = '';
      $('#math-size-field')
        ?.querySelectorAll('.math-size-pick')
        .forEach((b) => b.classList.remove('is-ok', 'is-bad'));
      if (autoSpeak) speak(def.q);
    }

    function onSizePick(side) {
      if (sizeBusy || !sizeRound) return;
      sizeBusy = true;
      const muted = isMuted();
      const fb = $('#math-size-feedback');
      const ok = side === sizeRound.answer;
      const btn = $(`#math-size-field .math-size-pick[data-side="${side}"]`);

      if (ok) {
        btn?.classList.add('is-ok');
        const { gained } = tryEarnStar();
        if (gained) {
          speech?.playStarCue?.({ muted });
          playMathStarReward();
        } else {
          speech?.playCorrectCue?.({ muted });
        }
        sizeCorrect += 1;
        updateSizeProgress();
        const praise =
          speech?.speakCorrectFeedback?.({ muted }) || '你好叻呀，答啱咗！';
        if (fb) fb.textContent = gained ? `${praise} ★` : praise;

        if (sizeCorrect >= LIT_TARGET && !isPlanetLit('compare-size')) {
          lightPlanet('compare-size');
          if (fb) fb.textContent = `${praise} 地球點亮喇！`;
          const fromP = getPlanetById('compare-size');
          const toP = getPlanetById(getNextPlanetId('compare-size'));
          setTimeout(() => {
            sizeBusy = false;
            offerWarpHop(fromP, toP);
          }, 900);
          return;
        }

        const stars = $('#math-earth-play-stars');
        const state = loadState();
        if (stars) stars.textContent = `${state.starsToday}/10`;

        setTimeout(() => {
          sizeBusy = false;
          nextSizeRound(true);
        }, 1100);
      } else {
        btn?.classList.add('is-bad');
        speech?.playTryAgainCue?.({ muted });
        const line = speech?.speakRetryFeedback?.({ muted }) || '唔緊要，試多次！';
        if (fb) fb.textContent = line;
        const field = $('#math-size-field');
        if (field) field.style.outline = '3px solid rgba(253, 230, 138, 0.7)';
        setTimeout(() => {
          btn?.classList.remove('is-bad');
          if (field) field.style.outline = '';
          sizeBusy = false;
        }, 700);
      }
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
        openEarthLearn();
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

      $('#btn-back-math-earth-learn')?.addEventListener('click', () => openHub());
      $('#math-earth-learn-tap')?.addEventListener('click', () => speakEarthLearn());
      $('#btn-math-earth-learn-prev')?.addEventListener('click', () => {
        if (eLearnIndex <= 0) return;
        eLearnIndex -= 1;
        renderEarthLearnCard(true);
      });
      $('#btn-math-earth-learn-next')?.addEventListener('click', () => {
        if (eLearnIndex >= EARTH_LEARN_CARDS.length - 1) return;
        eLearnIndex += 1;
        renderEarthLearnCard(true);
      });
      $('#btn-math-earth-learn-play')?.addEventListener('click', () => openEarthPlay());

      $('#btn-back-math-earth-play')?.addEventListener('click', () => openEarthLearn());
      $('#btn-math-mode-size')?.addEventListener('click', () => openSizeQuiz());

      $('#btn-back-math-size')?.addEventListener('click', () => openEarthPlay());
      $('#btn-math-size-speak')?.addEventListener('click', () => {
        if (sizeRound) speak(sizeRound.prompt);
      });
      document
        .querySelectorAll('#math-size-field .math-size-pick')
        .forEach((btn) => {
          btn.addEventListener('click', () => onSizePick(btn.dataset.side));
        });

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
      openEarthLearn,
      openSizeQuiz,
      openMoonLearn,
      openTimeQuiz,
      openGalaxy,
      offerWarpHop,
    };
  }
})();

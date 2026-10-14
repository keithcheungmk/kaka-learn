(() => {
  'use strict';

  const catalog = window.COMMON_SENSE_CATALOG || { packs: [] };
  const packMap = window.COMMON_SENSE_PACKS || {};
  const storage = window.KakaStorage || {};
  const speech = window.KakaSpeech || {};
  const $ = (id) => document.getElementById(id);

  const HOME_HREF = 'index.html#screen-home';
  const VIEWS = ['view-packs', 'view-learn', 'view-quiz', 'view-finish'];
  const FALLBACK_HINT = '唔係呢個喎，再諗吓○○啦，可以再試。';

  let view = 'packs';
  let currentPack = null;
  let currentFestival = null;
  let currentSeason = null;
  let quizOrder = [];
  let quizIndex = 0;
  let correctCount = 0;
  let answering = false;
  let finishAwarded = false;
  const preloadLinks = [];
  const FIRST_EAGER = 6;

  function hanLen(text) {
    return (String(text || '').match(/[\u4e00-\u9fff]/g) || []).length;
  }

  function shuffle(list) {
    const arr = list.slice();
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function isMuted() {
    return Boolean(storage.loadState?.().muted);
  }

  function isTestFast() {
    return Boolean(window.__KAKA_TEST__);
  }

  function isFestivalsPack(pack) {
    return Boolean(pack?.kind === 'festivals' || (pack?.festivals && pack.festivals.length));
  }

  function isSeasonsPack(pack) {
    return Boolean(pack?.kind === 'seasons' || (pack?.seasons && pack.seasons.length));
  }

  function festivalQuizItems(fest) {
    if (!fest) return [];
    const words = Array.isArray(fest.words) ? fest.words : [];
    const extra = Array.isArray(fest.quizExtra) ? fest.quizExtra : [];
    return words.concat(extra);
  }

  function seasonQuizItems(season) {
    if (!season) return [];
    const events = Array.isArray(season.events) ? season.events : [];
    const extra = Array.isArray(season.quizExtra) ? season.quizExtra : [];
    return events.concat(extra);
  }

  function allSeasonQuizItems(pack) {
    return (pack?.seasons || []).flatMap((season) => seasonQuizItems(season));
  }

  function packItems(pack) {
    if (currentFestival) return festivalQuizItems(currentFestival);
    if (isSeasonsPack(pack)) {
      const all = allSeasonQuizItems(pack);
      if (!currentSeason) return all;
      const own = seasonQuizItems(currentSeason);
      if (own.length >= (pack.roundSize || 10)) return own;
      const seen = new Set(own.map((entry) => entry.id));
      return own.concat(all.filter((entry) => !seen.has(entry.id)));
    }
    if (!pack) return [];
    if (Array.isArray(pack.items) && pack.items.length) return pack.items;
    if (Array.isArray(pack.careers) && pack.careers.length) return pack.careers;
    return [];
  }

  function nestedLearn() {
    return currentFestival || currentSeason;
  }

  function setPreloads(urls) {
    preloadLinks.splice(0).forEach((el) => el.remove());
    [...new Set((urls || []).filter(Boolean))].slice(0, 8).forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      document.head.appendChild(link);
      preloadLinks.push(link);
    });
  }

  function mediaImg(src, alt, opts = {}) {
    if (!src) return '';
    const eager = Boolean(opts.eager);
    const width = opts.width || 900;
    const height = opts.height || 675;
    const extraClass = opts.className ? ` class="${opts.className}"` : '';
    const prio = eager ? ' fetchpriority="high"' : '';
    return (
      `<span class="cs-media">` +
      `<img src="${src}" alt="${alt || ''}" width="${width}" height="${height}" ` +
      `loading="${eager ? 'eager' : 'lazy'}" decoding="async"${prio}${extraClass}>` +
      `</span>`
    );
  }

  function markMediaReady(img, slot, instant) {
    img.classList.toggle('is-instant', Boolean(instant));
    img.classList.add('is-ready');
    slot?.classList.add('is-ready');
  }

  function revealMedia(img, slot, instant) {
    const go = () => markMediaReady(img, slot, instant);
    if (typeof img.decode === 'function' && img.naturalWidth > 0) {
      img.decode().then(go, go);
      return;
    }
    go();
  }

  function bindMedia(root) {
    const scope = root || document;
    scope.querySelectorAll('.cs-media img').forEach((img) => {
      const slot = img.closest('.cs-media');
      const instant = img.complete && img.naturalWidth > 0;
      if (instant) {
        revealMedia(img, slot, true);
        return;
      }
      img.addEventListener('load', () => revealMedia(img, slot, false), { once: true });
      img.addEventListener('error', () => markMediaReady(img, slot, true), { once: true });
    });
  }

  function wallItems(pack) {
    return packItems(pack).filter((entry) => entry && entry.wall !== false);
  }

  function speak(text, onEnd, lang) {
    if (!speech.speakTerm) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    speech.speakTerm(text, {
      muted: isMuted(),
      rate: 0.92,
      pitch: 1.05,
      delayMs: isTestFast() ? 0 : 80,
      lang: lang || 'zh-HK',
      onEnd,
    });
  }

  function stopSpeech() {
    speech.cancelAllSpeech?.();
  }

  function sampleRound() {
    const items = packItems(currentPack);
    const size = Math.min(currentPack?.roundSize || 10, items.length);
    return shuffle(items).slice(0, size);
  }

  function currentQuestion() {
    return quizOrder[quizIndex] || null;
  }

  function setPill(text) {
    const el = $('status-pill');
    if (el) el.textContent = text;
  }

  function setBrand(kicker, title) {
    const k = $('brand-kicker');
    const t = $('brand-title');
    if (k) k.textContent = kicker;
    if (t) t.textContent = title;
  }

  function setBack(label, href) {
    const el = $('back-link');
    if (!el) return;
    el.textContent = label;
    el.setAttribute('href', href);
  }

  function setStartVisible(show) {
    const cta = document.querySelector('.sticky-cta');
    if (cta) cta.classList.toggle('hidden', !show);
  }

  function showView(next) {
    view = next;
    VIEWS.forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle('hidden', id !== `view-${next}`);
    });
    const title = currentSeason?.name || currentFestival?.name || currentPack?.title || '卡卡常識樂園';
    if (next === 'packs') {
      setBrand('常識樂園', '卡卡常識樂園');
      setBack('← 主頁', HOME_HREF);
      setPill('揀主題');
    } else if (next === 'learn') {
      setBrand('常識樂園', title);
      if (currentSeason) {
        setBack('← 四季', HOME_HREF);
        setPill('季節');
      } else if (currentFestival) {
        setBack('← 節日', HOME_HREF);
        setPill('生字');
      } else {
        setBack('← 常識', HOME_HREF);
        setPill('學習牆');
      }
    } else if (next === 'quiz') {
      setBrand('答題挑戰', title);
      setBack(currentSeason ? '← 季節' : (currentFestival ? '← 生字' : '← 學習牆'), HOME_HREF);
      setPill(`已答啱 ${correctCount}／10`);
    } else if (next === 'finish') {
      setBrand('過關', title);
      setBack(currentSeason ? '← 季節' : (currentFestival ? '← 生字' : '← 學習牆'), HOME_HREF);
      setPill('10／10');
    }
  }

  function renderPackWall() {
    const grid = $('pack-grid');
    if (!grid) return;
    const packs = Array.isArray(catalog.packs) ? catalog.packs : [];
    const lineA = packs.filter((p) => p.line !== 'B' && p.status === 'playable');
    const lineB = packs.filter((p) => p.line === 'B' && p.status === 'playable');
    const renderCard = (meta, index) => {
      const cover = meta.cover
        ? `<img class="pack-art" src="${meta.cover}" alt="" width="256" height="256" loading="${index < FIRST_EAGER ? 'eager' : 'lazy'}" decoding="async"${index < 4 ? ' fetchpriority="high"' : ''}>`
        : `<span class="pack-art pack-soon-icon" aria-hidden="true">${meta.emoji || '📖'}</span>`;
      const inner = `${cover}<span class="pack-meta"><strong>${meta.kicker}</strong><span>${meta.blurb}</span></span>`;
      if (meta.href) {
        return `<a class="pack pack-playable" id="${meta.buttonId || ''}" href="${meta.href}" aria-label="${meta.kicker}">${inner}</a>`;
      }
      return `<button type="button" class="pack pack-playable" id="${meta.buttonId || ''}" data-pack="${meta.packId}" aria-label="${meta.kicker}，學完再答十題">${inner}</button>`;
    };
    grid.innerHTML =
      `<p class="pack-line-label">${catalog.lineATitle || '常識答題'}</p>` +
      lineA.map((meta, i) => renderCard(meta, i)).join('') +
      `<p class="pack-line-label">${catalog.lineBTitle || '面試四格'}</p>` +
      lineB.map((meta, i) => renderCard(meta, lineA.length + i)).join('');
    grid.querySelectorAll('[data-pack]').forEach((btn) => {
      btn.addEventListener('click', () => openPack(btn.dataset.pack));
    });
    setPreloads(lineA.concat(lineB).slice(0, 8).map((meta) => meta.cover));
  }

  function renderLearnWall() {
    const extras = $('learn-extras');
    const grid = $('learn-grid');
    const heading = $('learn-heading');
    const intro = $('learn-intro-text');
    const toPreload = [];
    if (extras) extras.innerHTML = '';
    if (grid) {
      grid.innerHTML = '';
      grid.classList.toggle('season-grid', Boolean(isSeasonsPack(currentPack) && !currentSeason));
    }
    if (!currentPack) {
      if (heading) heading.textContent = '';
      if (intro) intro.textContent = '';
      setStartVisible(false);
      return;
    }

    if (currentSeason) {
      if (heading) heading.textContent = currentSeason.name;
      if (intro) intro.textContent = currentSeason.intro || currentPack.intro || '';
      setStartVisible(true);
      (currentSeason.events || []).forEach((entry, index) => {
        grid.appendChild(renderEventCard(entry, index));
        if (index < FIRST_EAGER) toPreload.push(entry.image);
      });
      setPreloads(toPreload);
      bindMedia($('view-learn'));
      return;
    }

    if (currentFestival) {
      if (heading) heading.textContent = currentFestival.name;
      if (intro) intro.textContent = currentFestival.intro || currentPack.intro || '';
      setStartVisible(true);
      (currentFestival.words || []).forEach((entry, index) => {
        grid.appendChild(renderWordCard(entry, index));
        if (index < FIRST_EAGER) toPreload.push(entry.image);
      });
      setPreloads(toPreload);
      bindMedia($('view-learn'));
      return;
    }

    if (heading) heading.textContent = currentPack.title || '';
    if (intro) intro.textContent = currentPack.intro || '';
    setStartVisible(!isFestivalsPack(currentPack));

    (currentPack.sections || []).forEach((section) => {
      if (!extras) return;
      if (section.type === 'map') extras.appendChild(renderMap(section));
      if (section.type === 'process') extras.appendChild(renderProcess(section));
      if (section.type === 'comics') extras.appendChild(renderComics(section));
    });

    if (isFestivalsPack(currentPack)) {
      (currentPack.festivals || []).forEach((fest, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'learn-card festival-card';
        card.dataset.festival = fest.id;
        card.setAttribute('aria-label', `${fest.name}，入去學生字`);
        card.innerHTML =
          mediaImg(fest.cover, fest.name, { eager: index < FIRST_EAGER, width: 900, height: 675 }) +
          `<p class="name">${fest.name}</p>` +
          `<p class="duty">${fest.wallLine || ''}</p>` +
          '<p class="hear">入去學生字</p>';
        card.addEventListener('click', () => openFestival(fest.id));
        grid.appendChild(card);
        if (index < FIRST_EAGER) toPreload.push(fest.cover);
      });
      setPreloads(toPreload);
      bindMedia($('view-learn'));
      return;
    }

    if (isSeasonsPack(currentPack)) {
      (currentPack.seasons || []).forEach((season, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'learn-card season-card';
        card.dataset.season = season.id;
        card.setAttribute('aria-label', `${season.name}，入去睇天氣`);
        card.innerHTML =
          mediaImg(season.cover, season.name, { eager: true, width: 900, height: 675 }) +
          `<p class="name">${season.name}</p>` +
          `<p class="duty">${season.wallLine || ''}</p>` +
          '<p class="hear">入去睇睇</p>';
        card.addEventListener('click', () => openSeason(season.id));
        grid.appendChild(card);
        toPreload.push(season.cover);
      });
      setPreloads(toPreload);
      bindMedia($('view-learn'));
      return;
    }

    wallItems(currentPack).forEach((entry, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'learn-card';
      card.dataset.item = entry.id;
      card.setAttribute('aria-label', `${entry.wallLine || entry.name}，聽一聽`);
      card.innerHTML =
        mediaImg(entry.image, entry.name, { eager: index < FIRST_EAGER, width: 900, height: 675 }) +
        `<p class="name">${entry.name}</p>` +
        `<p class="duty">${entry.wallLine || ''}</p>` +
        '<p class="hear">🔊 聽一聽</p>';
      card.addEventListener('click', () => {
        card.classList.add('is-heard');
        speak(entry.audio || entry.ask);
      });
      grid.appendChild(card);
      if (index < FIRST_EAGER) toPreload.push(entry.image);
    });
    setPreloads(toPreload.concat(
      (currentPack.sections || []).flatMap((section) => {
        if (section.type === 'map') return [section.src];
        if (section.type === 'comics') {
          return (section.strips || []).flatMap((strip) =>
            (strip.steps || []).slice(0, 3).map((step) => step.image)
          );
        }
        return [];
      })
    ));
    bindMedia($('view-learn'));
  }

  function renderEventCard(entry, index) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'learn-card';
    card.dataset.item = entry.id;
    card.setAttribute('aria-label', `${entry.wallLine || entry.name}，聽一聽`);
    card.innerHTML =
      mediaImg(entry.image, entry.name, { eager: index < FIRST_EAGER, width: 900, height: 675 }) +
      `<p class="name">${entry.name}</p>` +
      `<p class="duty">${entry.wallLine || ''}</p>` +
      '<p class="hear">🔊 聽一聽</p>';
    card.addEventListener('click', () => {
      card.classList.add('is-heard');
      speak(entry.audio || entry.ask);
    });
    return card;
  }

  function renderWordCard(entry, index) {
    const card = document.createElement('article');
    card.className = 'learn-card word-card';
    card.dataset.item = entry.id;
    card.innerHTML =
      mediaImg(entry.image, entry.name, { eager: index < FIRST_EAGER, width: 900, height: 675 }) +
      `<p class="name">${entry.name}</p>` +
      '<div class="speak-duo">' +
      `<button type="button" class="speak-lang speak-yue" aria-label="用廣東話讀「${entry.name}」">廣東話</button>` +
      `<button type="button" class="speak-lang speak-pth" aria-label="用普通話讀「${entry.pth || entry.name}」">普通話</button>` +
      '</div>';
    card.querySelector('.speak-yue').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      card.classList.add('is-heard');
      speak(entry.name, null, 'zh-HK');
    });
    card.querySelector('.speak-pth').addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      card.classList.add('is-heard');
      speak(entry.pth || entry.name, null, 'zh-CN');
    });
    return card;
  }

  function renderMap(section) {
    const el = document.createElement('section');
    el.className = 'cs-map';
    el.id = section.id || 'cs-mtr-map';
    const pins = (section.pins || []).map((pin) => (
      `<li><b>${pin.n}</b><span>${pin.name}</span><em>${pin.note}</em></li>`
    )).join('');
    el.innerHTML =
      `<h3>${section.title}</h3>` +
      mediaImg(section.src, section.title, { eager: true, width: 900, height: 675 }) +
      `<p class="map-caption">${section.caption || ''}</p>` +
      `<ul class="cs-pins">${pins}</ul>`;
    return el;
  }

  function renderProcess(section) {
    const el = document.createElement('section');
    el.className = 'cs-process';
    el.id = section.id || 'cs-food-process';
    const strips = (section.strips || []).map((strip) => {
      const steps = (strip.steps || []).map((step, i) => (
        `<li>${mediaImg(step.image, step.label, { eager: i < 2, width: 256, height: 256 })}<span>${i + 1}. ${step.label}</span></li>`
      )).join('');
      return `<div class="process-strip"><h4>${strip.title}</h4><ol>${steps}</ol></div>`;
    }).join('');
    el.innerHTML = `<h3>${section.title || ''}</h3><p>${section.intro || ''}</p>${strips}`;
    return el;
  }

  function renderComics(section) {
    const el = document.createElement('section');
    el.className = 'cs-comics';
    el.id = section.id || 'cs-food-comics';
    (section.strips || []).forEach((strip, stripIndex) => {
      const block = document.createElement('div');
      block.className = 'comic-strip';
      const heading = document.createElement('h3');
      heading.textContent = strip.title || '';
      block.appendChild(heading);
      const list = document.createElement('ol');
      (strip.steps || []).forEach((step, stepIndex) => {
        const li = document.createElement('li');
        li.innerHTML =
          mediaImg(step.image, step.caption || '', {
            eager: stripIndex === 0 && stepIndex < 4,
            width: 900,
            height: 675,
          }) +
          `<p>${step.caption || ''}</p>`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'comic-speak';
        btn.setAttribute('aria-label', `聽「${step.caption || strip.title}」`);
        btn.textContent = '🔊 聽一聽';
        btn.addEventListener('click', () => speak(step.audio || step.caption));
        li.appendChild(btn);
        list.appendChild(li);
      });
      block.appendChild(list);
      el.appendChild(block);
    });
    return el;
  }

  function updateProgress() {
    if (view === 'quiz') setPill(`已答啱 ${correctCount}／10`);
  }

  function renderQuiz() {
    const q = currentQuestion();
    if (!q) return;
    answering = false;
    const img = $('quiz-img');
    const frame = img?.closest('.quiz-frame, .cs-media');
    if (img) {
      img.classList.remove('is-ready', 'is-instant');
      frame?.classList.remove('is-ready');
      img.loading = 'eager';
      img.fetchPriority = 'high';
      img.decoding = 'async';
      img.src = q.image || '';
      img.alt = q.name || '';
      img.classList.toggle('hidden', !q.image);
      const ready = (instant) => revealMedia(img, frame, instant);
      if (q.image) {
        if (img.complete && img.naturalWidth > 0) ready(true);
        else {
          img.addEventListener('load', () => ready(false), { once: true });
          img.addEventListener('error', () => markMediaReady(img, frame, true), { once: true });
        }
        setPreloads([q.image]);
      } else {
        ready();
      }
    }
    const ask = $('quiz-q');
    if (ask) ask.textContent = q.ask;
    const fb = $('quiz-feedback');
    if (fb) {
      fb.textContent = '';
      fb.className = 'feedback';
    }
    const box = $('quiz-choices');
    if (!box) return;
    box.innerHTML = '';
    shuffle([q.correct, ...q.wrong]).forEach((text) => {
      const row = document.createElement('div');
      row.className = 'choice-row';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.dataset.answer = text;
      const label = document.createElement('span');
      label.className = 'choice-text';
      label.textContent = text;
      btn.appendChild(label);
      btn.addEventListener('click', () => onAnswer(btn, text === q.correct, q));

      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'choice-speak';
      speakBtn.setAttribute('aria-label', `聽「${text}」`);
      speakBtn.textContent = '🔊';
      speakBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        speak(text);
      });

      row.appendChild(btn);
      row.appendChild(speakBtn);
      box.appendChild(row);
    });
    updateProgress();
    speak(q.ask);
  }

  function afterCorrectAdvance() {
    if (correctCount >= 10) {
      showFinish();
      return;
    }
    quizIndex += 1;
    renderQuiz();
  }

  function onAnswer(btn, ok, q) {
    if (answering) return;
    const fb = $('quiz-feedback');
    if (ok) {
      answering = true;
      [...document.querySelectorAll('#quiz-choices .choice')].forEach((el) => {
        el.disabled = true;
      });
      btn.classList.add('is-correct');
      correctCount += 1;
      updateProgress();
      if (fb) {
        fb.textContent = '啱喇！';
        fb.className = 'feedback is-ok';
      }
      speech.playCorrectCue?.({ muted: isMuted() });
      const go = () => afterCorrectAdvance();
      if (isTestFast()) {
        go();
        return;
      }
      speak('啱喇！', go);
      return;
    }
    btn.classList.add('is-wrong');
    btn.disabled = true;
    const template = currentPack?.wrongHint || FALLBACK_HINT;
    const hint = template.replace('○○', q.name || '');
    if (fb) {
      fb.textContent = hint;
      fb.className = 'feedback is-bad';
    }
    speech.playTryAgainCue?.({ muted: isMuted() });
    speak(hint);
  }

  function startQuiz() {
    if (isFestivalsPack(currentPack) && !currentFestival) return;
    quizOrder = sampleRound();
    quizIndex = 0;
    correctCount = 0;
    finishAwarded = false;
    showView('quiz');
    renderQuiz();
  }

  function showFinish() {
    if (!finishAwarded) {
      finishAwarded = true;
      const mode = currentPack?.coinMode || 'common-sense-heroes';
      const coin = storage.earnCoinForMode
        ? storage.earnCoinForMode(mode)
        : { gained: false, already: true };
      const nested = nestedLearn();
      const passedId = nested
        ? `${currentPack?.packId || 'community-heroes'}-${nested.id}`
        : (currentPack?.packId || 'community-heroes');
      storage.markTopicPassed?.('common-sense', passedId);
      const msg = $('finish-msg');
      const line = coin.gained
        ? '今輪玩完喇！攞到一個 AEON 幣！'
        : '今日已攞！今輪玩完喇，再開一次唔會再派幣。';
      if (msg) {
        msg.textContent = line;
        msg.classList.toggle('is-already', Boolean(coin.already));
      }
      speech.playStarCue?.({ muted: isMuted() });
      if (coin.gained) speech.playCoinHintCue?.({ muted: isMuted() });
      speak(coin.gained ? '今輪玩完喇！攞到一個 AEON 幣！' : '今日已攞！今輪玩完喇！');
    }
    showView('finish');
  }

  function goPacks() {
    stopSpeech();
    currentPack = null;
    currentFestival = null;
    currentSeason = null;
    showView('packs');
  }

  function openPack(packId) {
    const pack = packMap[packId];
    if (!pack) return;
    currentPack = pack;
    currentFestival = null;
    currentSeason = null;
    stopSpeech();
    renderLearnWall();
    showView('learn');
  }

  function openFestival(festId) {
    const fest = (currentPack?.festivals || []).find((item) => item.id === festId);
    if (!fest) return;
    currentFestival = fest;
    currentSeason = null;
    stopSpeech();
    renderLearnWall();
    showView('learn');
  }

  function openSeason(seasonId) {
    const season = (currentPack?.seasons || []).find((item) => item.id === seasonId);
    if (!season) return;
    currentSeason = season;
    currentFestival = null;
    stopSpeech();
    renderLearnWall();
    showView('learn');
  }

  function goLearn() {
    stopSpeech();
    if (!currentPack) {
      goPacks();
      return;
    }
    renderLearnWall();
    showView('learn');
  }

  function onBack(event) {
    event.preventDefault();
    if (view === 'quiz' || view === 'finish') {
      stopSpeech();
      goLearn();
      return;
    }
    if (view === 'learn') {
      stopSpeech();
      if (currentFestival || currentSeason) {
        currentFestival = null;
        currentSeason = null;
        renderLearnWall();
        showView('learn');
        return;
      }
      goPacks();
      return;
    }
    (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr(HOME_HREF);
  }

  function bind() {
    $('back-link')?.addEventListener('click', onBack);
    $('btn-start-quiz')?.addEventListener('click', startQuiz);
    $('btn-quiz-listen')?.addEventListener('click', () => {
      const q = currentQuestion();
      if (q) speak(q.audio || q.ask);
    });
    $('btn-play-again')?.addEventListener('click', () => {
      stopSpeech();
      startQuiz();
    });
    $('btn-back-packs')?.addEventListener('click', goPacks);
    $('btn-back-home')?.addEventListener('click', (event) => {
      event.preventDefault();
      (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr(HOME_HREF);
    });
  }

  speech.warmVoices?.();
  renderPackWall();
  bind();
  showView('packs');

  window.KakaCommonSense = {
    catalog,
    packMap,
    hanLen,
    sampleRound,
    currentQuestion,
    getProgress: () => ({
      view,
      packId: currentPack?.packId || null,
      festivalId: currentFestival?.id || null,
      seasonId: currentSeason?.id || null,
      quizIndex,
      correctCount,
      total: quizOrder.length,
    }),
    startQuiz,
    openPack,
    openFestival,
    openSeason,
    showLearn: goLearn,
    showPacks: goPacks,
    get pack() { return currentPack || packMap['community-heroes'] || {}; },
    get festival() { return currentFestival; },
    get season() { return currentSeason; },
    get careers() { return packItems(currentPack || packMap['community-heroes']); },
    answerCurrentCorrect() {
      const q = currentQuestion();
      if (!q) return false;
      const btn = [...document.querySelectorAll('#quiz-choices .choice')]
        .find((el) => (el.dataset.answer || el.querySelector('.choice-text')?.textContent) === q.correct);
      if (!btn) return false;
      btn.click();
      return true;
    },
    answerCurrentWrong() {
      const q = currentQuestion();
      if (!q) return false;
      const btn = [...document.querySelectorAll('#quiz-choices .choice')]
        .find((el) => (el.dataset.answer || el.querySelector('.choice-text')?.textContent) !== q.correct && !el.disabled);
      if (!btn) return false;
      btn.click();
      return true;
    },
  };
})();

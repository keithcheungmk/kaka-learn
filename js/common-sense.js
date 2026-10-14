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
  let quizOrder = [];
  let quizIndex = 0;
  let correctCount = 0;
  let answering = false;
  let finishAwarded = false;

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

  function packItems(pack) {
    if (!pack) return [];
    if (Array.isArray(pack.items) && pack.items.length) return pack.items;
    if (Array.isArray(pack.careers) && pack.careers.length) return pack.careers;
    return [];
  }

  function speak(text, onEnd) {
    if (!speech.speakTerm) {
      if (typeof onEnd === 'function') onEnd();
      return;
    }
    speech.speakTerm(text, {
      muted: isMuted(),
      rate: 0.92,
      pitch: 1.05,
      delayMs: isTestFast() ? 0 : 80,
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

  function showView(next) {
    view = next;
    VIEWS.forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle('hidden', id !== `view-${next}`);
    });
    const title = currentPack?.title || '卡卡常識樂園';
    if (next === 'packs') {
      setBrand('常識樂園', '卡卡常識樂園');
      setBack('← 主頁', HOME_HREF);
      setPill('揀主題');
    } else if (next === 'learn') {
      setBrand('常識樂園', title);
      setBack('← 常識', HOME_HREF);
      setPill('學習牆');
    } else if (next === 'quiz') {
      setBrand('答題挑戰', title);
      setBack('← 學習牆', HOME_HREF);
      setPill(`已答啱 ${correctCount}／10`);
    } else if (next === 'finish') {
      setBrand('過關', title);
      setBack('← 學習牆', HOME_HREF);
      setPill('10／10');
    }
  }

  function renderPackWall() {
    const grid = $('pack-grid');
    if (!grid) return;
    const packs = Array.isArray(catalog.packs) ? catalog.packs : [];
    const lineA = packs.filter((p) => p.line !== 'B');
    const lineB = packs.filter((p) => p.line === 'B');
    const renderCard = (meta) => {
      const playable = meta.status === 'playable';
      const cover = meta.cover
        ? `<img class="pack-art" src="${meta.cover}" alt="" width="256" height="256">`
        : `<span class="pack-art pack-soon-icon" aria-hidden="true">${meta.emoji || '📖'}</span>`;
      const inner = `${cover}<span class="pack-meta"><strong>${meta.kicker}</strong><span>${meta.blurb}</span></span>`;
      if (!playable) {
        return `<div class="pack pack-soon" aria-disabled="true">${inner}</div>`;
      }
      if (meta.href) {
        return `<a class="pack pack-playable" id="${meta.buttonId || ''}" href="${meta.href}" aria-label="${meta.kicker}">${inner}</a>`;
      }
      return `<button type="button" class="pack pack-playable" id="${meta.buttonId || ''}" data-pack="${meta.packId}" aria-label="${meta.kicker}，學完再答十題">${inner}</button>`;
    };
    grid.innerHTML =
      `<p class="pack-line-label">${catalog.lineATitle || '常識答題'}</p>` +
      lineA.map(renderCard).join('') +
      `<p class="pack-line-label">${catalog.lineBTitle || '面試四格'}</p>` +
      lineB.map(renderCard).join('');
    grid.querySelectorAll('[data-pack]').forEach((btn) => {
      btn.addEventListener('click', () => openPack(btn.dataset.pack));
    });
  }

  function renderLearnWall() {
    const extras = $('learn-extras');
    const grid = $('learn-grid');
    const heading = $('learn-heading');
    const intro = $('learn-intro-text');
    if (heading) heading.textContent = currentPack?.title || '';
    if (intro) intro.textContent = currentPack?.intro || '';
    if (extras) extras.innerHTML = '';
    if (grid) grid.innerHTML = '';
    if (!currentPack) return;

    if (currentPack.lifeAnchor && extras) {
      const box = document.createElement('section');
      box.className = 'life-anchor';
      box.innerHTML = `<h3>${currentPack.lifeAnchor.title}</h3><p>${currentPack.lifeAnchor.body}</p>`;
      extras.appendChild(box);
    }
    (currentPack.sections || []).forEach((section) => {
      if (!extras) return;
      if (section.type === 'map') extras.appendChild(renderMap(section));
      if (section.type === 'process') extras.appendChild(renderProcess(section));
    });

    packItems(currentPack).forEach((entry) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'learn-card';
      card.dataset.item = entry.id;
      card.setAttribute('aria-label', `${entry.wallLine}，聽一聽`);
      const img = entry.image
        ? `<img src="${entry.image}" alt="${entry.name}" width="256" height="256">`
        : '';
      card.innerHTML =
        img +
        `<p class="name">${entry.name}</p>` +
        `<p class="duty">${entry.wallLine}</p>` +
        '<p class="hear">🔊 聽一聽</p>';
      card.addEventListener('click', () => {
        card.classList.add('is-heard');
        speak(entry.audio || entry.ask);
      });
      grid.appendChild(card);
    });
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
      `<img src="${section.src}" alt="${section.title}">` +
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
        `<li><img src="${step.image}" alt="${step.label}"><span>${i + 1}. ${step.label}</span></li>`
      )).join('');
      return `<div class="process-strip"><h4>${strip.title}</h4><ol>${steps}</ol></div>`;
    }).join('');
    el.innerHTML = `<h3>${section.title}</h3><p>${section.intro || ''}</p>${strips}`;
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
    if (img) {
      img.src = q.image || '';
      img.alt = q.name || '';
      img.classList.toggle('hidden', !q.image);
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
      storage.markTopicPassed?.('common-sense', currentPack?.packId || 'community-heroes');
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
    showView('packs');
  }

  function openPack(packId) {
    const pack = packMap[packId];
    if (!pack) return;
    currentPack = pack;
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
      goPacks();
      return;
    }
    // Pack-wall ← 主頁: fallback is index.html#screen-home, not bare index.html.
    // One live QA hit 你係邊個 once and could not repro; history.back() can
    // land on index without a restored hash/profile. No wrong href here.
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
      quizIndex,
      correctCount,
      total: quizOrder.length,
    }),
    startQuiz,
    openPack,
    showLearn: goLearn,
    showPacks: goPacks,
    get pack() { return currentPack || packMap['community-heroes'] || {}; },
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

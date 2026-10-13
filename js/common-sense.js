(() => {
  'use strict';

  const pack = window.COMMON_SENSE_HEROES || {};
  const careers = Array.isArray(pack.careers) ? pack.careers : [];
  const storage = window.KakaStorage || {};
  const speech = window.KakaSpeech || {};
  const $ = (id) => document.getElementById(id);

  const HOME_HREF = 'index.html#screen-home';
  const VIEWS = ['view-packs', 'view-learn', 'view-quiz', 'view-finish'];
  const WRONG_HINT = '唔係呢個喎，再諗吓○○平時幫人做咩？';

  let view = 'packs';
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
    const size = Math.min(pack.roundSize || 10, careers.length);
    return shuffle(careers).slice(0, size);
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
    if (next === 'packs') {
      setBrand('常識樂園', '卡卡常識樂園');
      setBack('← 主頁', HOME_HREF);
      setPill('社區英雄');
    } else if (next === 'learn') {
      setBrand('常識樂園', '社區小英雄');
      setBack('← 常識', HOME_HREF);
      setPill('學習牆');
    } else if (next === 'quiz') {
      setBrand('答題挑戰', '社區小英雄');
      setBack('← 學習牆', HOME_HREF);
      setPill(`已答啱 ${correctCount}／10`);
    } else if (next === 'finish') {
      setBrand('過關', '社區小英雄');
      setBack('← 包牆', HOME_HREF);
      setPill('10／10');
    }
  }

  function renderLearnWall() {
    const grid = $('learn-grid');
    if (!grid) return;
    grid.innerHTML = '';
    careers.forEach((career) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'learn-card';
      card.dataset.career = career.id;
      card.setAttribute('aria-label', `${career.wallLine}，聽一聽`);
      card.innerHTML =
        `<img src="${career.image}" alt="${career.name}" width="256" height="256">` +
        `<p class="name">${career.name}</p>` +
        `<p class="duty">${career.wallLine}</p>` +
        '<p class="hear">🔊 聽一聽</p>';
      card.addEventListener('click', () => {
        card.classList.add('is-heard');
        speak(career.audio || career.ask);
      });
      grid.appendChild(card);
    });
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
      img.src = q.image;
      img.alt = q.name;
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
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.textContent = text;
      btn.addEventListener('click', () => onAnswer(btn, text === q.correct, q));
      box.appendChild(btn);
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
    const hint = WRONG_HINT.replace('○○', q.name);
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
      const coin = storage.earnCoinForMode
        ? storage.earnCoinForMode(pack.coinMode || 'common-sense-heroes')
        : { gained: false, already: true };
      storage.markTopicPassed?.(pack.topicId || 'common-sense', pack.packId || 'community-heroes');
      const msg = $('finish-msg');
      const line = coin.gained
        ? '今輪玩完喇！攞到一個 AEON 幣！'
        : '今輪玩完喇！你好叻呀！呢個玩法今日嘅幣已經攞咗，試下第二個玩法啦';
      if (msg) msg.textContent = line;
      speech.playStarCue?.({ muted: isMuted() });
      if (coin.gained) speech.playCoinHintCue?.({ muted: isMuted() });
      speak(coin.gained ? '今輪玩完喇！攞到一個 AEON 幣！' : '今輪玩完喇！你好叻呀！');
    }
    showView('finish');
  }

  function goPacks() {
    stopSpeech();
    showView('packs');
  }

  function goLearn() {
    stopSpeech();
    showView('learn');
  }

  function onBack(event) {
    event.preventDefault();
    if (view === 'quiz') {
      stopSpeech();
      goLearn();
      return;
    }
    if (view === 'learn' || view === 'finish') {
      stopSpeech();
      goPacks();
      return;
    }
    (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr(HOME_HREF);
  }

  function bind() {
    $('back-link')?.addEventListener('click', onBack);
    $('btn-pack-heroes')?.addEventListener('click', goLearn);
    $('btn-start-quiz')?.addEventListener('click', startQuiz);
    $('btn-quiz-listen')?.addEventListener('click', () => {
      const q = currentQuestion();
      if (q) speak(q.audio || q.ask);
    });
    $('btn-play-again')?.addEventListener('click', () => {
      stopSpeech();
      goLearn();
    });
    $('btn-back-packs')?.addEventListener('click', goPacks);
    $('btn-back-home')?.addEventListener('click', (event) => {
      event.preventDefault();
      (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr(HOME_HREF);
    });
  }

  speech.warmVoices?.();
  renderLearnWall();
  bind();
  showView('packs');

  window.KakaCommonSense = {
    pack,
    careers,
    hanLen,
    sampleRound,
    currentQuestion,
    getProgress: () => ({ view, quizIndex, correctCount, total: quizOrder.length }),
    startQuiz,
    showLearn: goLearn,
    showPacks: goPacks,
    answerCurrentCorrect() {
      const q = currentQuestion();
      if (!q) return false;
      const btn = [...document.querySelectorAll('#quiz-choices .choice')]
        .find((el) => el.textContent === q.correct);
      if (!btn) return false;
      btn.click();
      return true;
    },
    answerCurrentWrong() {
      const q = currentQuestion();
      if (!q) return false;
      const btn = [...document.querySelectorAll('#quiz-choices .choice')]
        .find((el) => el.textContent !== q.correct && !el.disabled);
      if (!btn) return false;
      btn.click();
      return true;
    },
  };
})();

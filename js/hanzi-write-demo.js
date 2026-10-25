(() => {
  'use strict';

  const storage = window.KakaStorage || {};
  const speech = window.KakaSpeech || {};
  const nav = window.KakaNav || { goBackOr: (href) => { location.assign(href); } };
  const CHAR_DATA = window.KAKA_HANZI_WRITE_CHARS || {};
  const BANK = window.KAKA_HANZI_WRITE_BANK || window.KAKA_HANZI_WRITE_LEVELS || [];
  const LEVELS = BANK;
  const TOPIC_ID = 'hanzi-write';
  const COIN_MODE = 'hanzi-write';
  const PARENT_HREF = 'index.html#screen-topics';
  const GUIDE_ORANGE = '#ff8a1a';
  const OUTLINE_INK = '#8aa0c8';
  const DRAWING_INK = '#16325c';
  const GUIDE_DASH = '16 10';
  const GUIDE_OUTLINE_WIDTH = '10';
  const DRAWING_TARGET_PX = 26;
  const WRITE_HINT = '跟著橙色線，一筆一筆寫。';
  const RETRY_HINT = '再試一次。跟著橙色線寫。';
  const PASS_CHEER = '過關啦';

  const $ = (id) => document.getElementById(id);
  const views = {
    profile: $('view-profile'),
    adventure: $('view-adventure'),
    write: $('view-write'),
  };

  let view = 'profile';
  let levelIndex = 0;
  let writer = null;
  let quizActive = false;
  let passedThisVisit = new Set();
  let lastMissSpeakAt = 0;

  function levels() {
    return LEVELS.filter((level) => CHAR_DATA[level.char]);
  }

  function currentLevel() {
    return levels()[levelIndex] || levels()[0] || { id: 'xing', char: '星', say: '星', title: '第一關' };
  }

  function showView(name) {
    view = name;
    Object.entries(views).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle('hidden', key !== name);
    });
    const back = $('back-link');
    if (name === 'write') {
      back.textContent = '← 冒險';
    } else if (name === 'adventure') {
      back.textContent = '← 選角色';
    } else {
      back.textContent = '← 中文';
    }
    refreshStars();
  }

  function speak(text) {
    speech.unlockSpeech?.();
    speech.speakTerm?.(text, { rate: 0.92, pitch: 1.08 });
  }

  function refreshStars() {
    const state = storage.loadState?.() || {};
    const stars = state.totalStars || 0;
    const pill = $('star-pill');
    if (pill) pill.textContent = `★ ${stars}`;
  }

  function markProfileButtons() {
    const id = storage.getActiveProfileId?.();
    ['kaka', 'heihei'].forEach((pid) => {
      $(`btn-profile-${pid}`)?.classList.toggle('is-on', pid === id);
    });
  }

  function whoName() {
    return storage.getActiveProfile?.()?.name || '小朋友';
  }

  function firstPlayableIndex() {
    const list = levels();
    const idx = list.findIndex((level) => !storage.isKeyPassed?.(TOPIC_ID, level.id));
    return idx === -1 ? 0 : idx;
  }

  function renderBank() {
    const el = $('level-bank');
    if (!el) return;
    el.replaceChildren();
    levels().forEach((level, i) => {
      const passed = storage.isKeyPassed?.(TOPIC_ID, level.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-chip' + (passed ? ' is-passed' : '');
      btn.setAttribute('role', 'listitem');
      btn.textContent = level.char;
      btn.setAttribute('aria-label', `${level.title || `第${i + 1}關`} 寫${level.char}`);
      btn.addEventListener('click', () => openWrite(i));
      el.appendChild(btn);
    });
  }

  function goAdventure() {
    $('who-line').textContent = `${whoName()}，準備好了嗎？`;
    renderBank();
    showView('adventure');
    speak(`${whoName()}，開始冒險`);
  }

  function pickProfile(id) {
    storage.setActiveProfile?.(id);
    markProfileButtons();
    goAdventure();
  }

  function charDataLoader(char, onComplete) {
    const data = CHAR_DATA[char];
    if (!data) throw new Error(`未有繁體字資料：${char}`);
    onComplete(data);
  }

  function drawingWidthFor(size) {
    // hanzi-writer drawingWidth is in the 1024-unit character space, then
    // scaled onto the board. 14 ≈ 5 CSS px on a 400px board — too thin for
    // an iPad finger. Target ~26 CSS px so the trail stays visible.
    const scale = Math.max(0.12, (Number(size) - 24) / 1024);
    return Math.max(56, Math.round(DRAWING_TARGET_PX / scale));
  }

  function writerStrokeGroup() {
    return document.querySelector('#hanzi-target svg > g');
  }

  function makeGuidePath(pathD, strokeIndex) {
    const svgNs = ['http:', 'www.w3.org/2000/svg'].join('//');
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', GUIDE_ORANGE);
    path.setAttribute('stroke-width', GUIDE_OUTLINE_WIDTH);
    path.setAttribute('stroke-dasharray', GUIDE_DASH);
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-opacity', '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('pointer-events', 'none');
    path.classList.add('hanzi-guide-stroke');
    path.dataset.strokeIndex = String(strokeIndex);
    return path;
  }

  function placeGuideInWriter(path) {
    const group = writerStrokeGroup();
    if (!group) return false;
    group.querySelectorAll(':scope > .hanzi-guide-stroke').forEach((el) => el.remove());
    // Append as a direct child. The writer group already holds outline /
    // completed strokes; live finger ink is mounted after this tip.
    // Do not insertBefore nested clip paths — they are not children of `g`.
    try {
      group.appendChild(path);
      return group.contains(path);
    } catch {
      return false;
    }
  }

  function clearActiveStrokeGuide() {
    document.querySelectorAll('.hanzi-guide-stroke').forEach((el) => el.remove());
    const host = $('hanzi-guide');
    if (host) host.replaceChildren();
  }

  function showActiveStrokeGuide(strokeIndex) {
    const host = $('hanzi-guide');
    clearActiveStrokeGuide();
    const level = currentLevel();
    const pathD = CHAR_DATA[level.char]?.strokes?.[strokeIndex];
    if (!pathD || typeof HanziWriter === 'undefined' || !HanziWriter.getScalingTransform) return;
    const path = makeGuidePath(pathD, strokeIndex);
    if (placeGuideInWriter(path)) return;
    // Fallback overlay sits under #hanzi-target so finger ink still wins.
    if (!host) return;
    const size = boardSize();
    const svgNs = ['http:', 'www.w3.org/2000/svg'].join('//');
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.setAttribute('overflow', 'visible');
    const group = document.createElementNS(svgNs, 'g');
    const transform = HanziWriter.getScalingTransform(size, size, 12);
    group.setAttribute('transform', transform.transform);
    group.appendChild(path);
    svg.appendChild(group);
    host.appendChild(svg);
  }

  function destroyWriter() {
    if (writer?.cancelQuiz) {
      try { writer.cancelQuiz(); } catch { /* quiz may already be idle */ }
    }
    writer = null;
    quizActive = false;
    clearActiveStrokeGuide();
    const target = $('hanzi-target');
    if (target) target.innerHTML = '';
  }

  function boardSize() {
    const board = document.querySelector('.mizi-board');
    const raw = board ? Math.min(board.clientWidth, board.clientHeight) : 320;
    return Math.max(180, Math.floor(raw - 8));
  }

  function setWriteStatus(text, tone) {
    const el = $('write-status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-retry', tone === 'retry');
  }

  function flashMissBoard() {
    const board = document.querySelector('.mizi-board');
    if (!board) return;
    board.classList.remove('is-miss');
    void board.offsetWidth;
    board.classList.add('is-miss');
    window.setTimeout(() => board.classList.remove('is-miss'), 520);
  }

  function onQuizMiss() {
    setWriteStatus(RETRY_HINT, 'retry');
    flashMissBoard();
    const now = Date.now();
    if (now - lastMissSpeakAt > 1600) {
      lastMissSpeakAt = now;
      speak('再試一次');
    }
  }

  function startQuiz() {
    if (!writer) return;
    quizActive = true;
    setWriteStatus(WRITE_HINT);
    showActiveStrokeGuide(0);
    writer.quiz({
      onMistake() {
        onQuizMiss();
      },
      onCorrectStroke(data) {
        setWriteStatus(WRITE_HINT);
        showActiveStrokeGuide((data?.strokeNum ?? 0) + 1);
      },
      onComplete() {
        quizActive = false;
        clearActiveStrokeGuide();
        onLevelPassed();
      },
    });
  }

  function playGuide() {
    if (!writer) return;
    if (writer.cancelQuiz) {
      try { writer.cancelQuiz(); } catch { /* ignore */ }
    }
    quizActive = false;
    clearActiveStrokeGuide();
    setWriteStatus('先看筆順，再自己寫。');
    writer.animateCharacter({
      onComplete() {
        startQuiz();
      },
    });
  }

  function mountWriter() {
    const level = currentLevel();
    destroyWriter();
    if (typeof HanziWriter === 'undefined') {
      setWriteStatus('寫字工具未載入，請重新整理。');
      return;
    }
    const size = boardSize();
    writer = HanziWriter.create('hanzi-target', level.char, {
      width: size,
      height: size,
      padding: 12,
      strokeColor: GUIDE_ORANGE,
      highlightColor: GUIDE_ORANGE,
      outlineColor: OUTLINE_INK,
      drawingColor: DRAWING_INK,
      drawingWidth: drawingWidthFor(size),
      showHintAfterMisses: 1,
      highlightOnComplete: true,
      strokeHighlightSpeed: 1,
      charDataLoader,
    });
    playGuide();
  }

  function openWrite(index) {
    const list = levels();
    levelIndex = Math.max(0, Math.min(index, list.length - 1));
    const level = currentLevel();
    $('level-kicker').textContent = level.title || `第${levelIndex + 1}關`;
    $('write-heading').textContent = `寫「${level.char}」`;
    $('write-lead').textContent = level.hint ? `${level.hint}。先看筆順，再自己寫一次。` : '先看筆順，再自己寫一次。';
    $('btn-next-char').hidden = true;
    if ($('btn-pass-rewrite')) $('btn-pass-rewrite').hidden = true;
    $('pass-overlay').classList.add('hidden');
    showPassGloss('');
    showView('write');
    speak(`寫${level.say || level.char}`);
    requestAnimationFrame(() => mountWriter());
  }

  function awardClear(level) {
    const first = !storage.isKeyPassed?.(TOPIC_ID, level.id) && !passedThisVisit.has(level.id);
    passedThisVisit.add(level.id);
    storage.markTopicPassed?.(TOPIC_ID, level.id);
    if (first && storage.tryEarnStar) {
      storage.tryEarnStar();
      storage.tryEarnStar();
      storage.tryEarnStar();
    }
    const coin = first && storage.earnCoinForMode
      ? storage.earnCoinForMode(COIN_MODE)
      : { gained: false, already: !first };
    refreshStars();
    return { first, coin };
  }

  function onLevelPassed() {
    const level = currentLevel();
    const { first, coin } = awardClear(level);
    const hasNext = levelIndex < levels().length - 1;
    $('btn-next-char').hidden = !hasNext;
    $('btn-next-level').hidden = !hasNext;
    if ($('btn-pass-rewrite')) $('btn-pass-rewrite').hidden = hasNext;
    if (!hasNext) {
      $('pass-copy').textContent = first
        ? '十二關都寫完喇。三顆星星已亮起。完成一輪，獎勵一枚星星幣。'
        : '全部關卡已經完成。可以再寫一次；今天的星星幣已經領取。';
    } else {
      $('pass-copy').textContent = first
        ? '三顆星星已亮起。完成一輪，獎勵一枚星星幣。'
        : '這一關已經完成。可以再寫一次；今天的星星幣已經領取。';
    }
    $('pass-coin').textContent = coin.gained ? '＋1 星星幣' : (coin.already ? '今天已領過幣' : '星星已記下');
    $('pass-overlay').classList.remove('hidden');
    speakGlossThenCheer(level);
  }

  function showPassGloss(text) {
    const el = $('pass-gloss');
    if (!el) return '';
    const gloss = String(text || '').trim();
    el.textContent = gloss;
    el.hidden = !gloss;
    return gloss;
  }

  function speakGlossThenCheer(level) {
    const gloss = showPassGloss(level?.glossYue || '');
    // iPad Safari 常吞第二次 async speak；亦會喺 cancel 後太快再講就靜音。
    // 畫面先出釋義字幕，再用一句粵語讀「釋義。過關啦」，靜音機都睇到先釋義再過關。
    const line = gloss ? `${gloss}。${PASS_CHEER}` : PASS_CHEER;
    speech.unlockSpeech?.();
    const opts = { rate: 0.92, pitch: 1.08, delayMs: 60, lang: 'zh-HK' };
    if (typeof speech.speakThen === 'function') {
      speech.speakThen(line, opts, () => {});
      return;
    }
    if (typeof speech.speakTerm === 'function') {
      speech.speakTerm(line, opts);
      return;
    }
    speak(line);
  }

  function rewrite() {
    $('pass-overlay').classList.add('hidden');
    showPassGloss('');
    if (!writer) {
      mountWriter();
      return;
    }
    playGuide();
  }

  function leaveWrite() {
    $('pass-overlay').classList.add('hidden');
    showPassGloss('');
    destroyWriter();
    renderBank();
    showView('adventure');
  }

  function restFromWrite() {
    leaveWrite();
  }

  function onBack(event) {
    event.preventDefault();
    if (view === 'write') {
      leaveWrite();
      return;
    }
    if (view === 'adventure') {
      showView('profile');
      return;
    }
    nav.goBackOr(PARENT_HREF);
  }

  $('btn-profile-kaka').addEventListener('click', () => pickProfile('kaka'));
  $('btn-profile-heihei').addEventListener('click', () => pickProfile('heihei'));
  $('btn-start-adventure').addEventListener('click', () => openWrite(firstPlayableIndex()));
  $('btn-guide').addEventListener('click', () => {
    speech.unlockSpeech?.();
    playGuide();
  });
  $('btn-rewrite').addEventListener('click', () => {
    speech.unlockSpeech?.();
    rewrite();
  });
  $('btn-next-char').addEventListener('click', () => openWrite(levelIndex + 1));
  $('btn-next-level').addEventListener('click', () => openWrite(levelIndex + 1));
  $('btn-pass-rewrite')?.addEventListener('click', () => {
    speech.unlockSpeech?.();
    rewrite();
  });
  $('btn-pass-home').addEventListener('click', () => {
    $('pass-overlay').classList.add('hidden');
    showPassGloss('');
    destroyWriter();
    nav.goBackOr(PARENT_HREF);
  });
  $('btn-write-rest')?.addEventListener('click', () => {
    restFromWrite();
  });
  $('back-link').addEventListener('click', onBack);

  window.addEventListener('resize', () => {
    if (view === 'write' && writer) mountWriter();
  });

  speech.warmVoices?.();
  markProfileButtons();
  if (storage.hasActiveProfile?.()) {
    goAdventure();
  } else {
    showView('profile');
  }

  window.KakaHanziWrite = {
    TOPIC_ID,
    COIN_MODE,
    PARENT_HREF,
    GUIDE_ORANGE,
    GUIDE_DASH,
    GUIDE_OUTLINE_WIDTH,
    DRAWING_INK,
    DRAWING_TARGET_PX,
    OUTLINE_INK,
    drawingWidthFor,
    placeGuideInWriter,
    WRITE_HINT,
    RETRY_HINT,
    PASS_CHEER,
    levels,
    currentLevel,
    firstPlayableIndex,
    speakGlossThenCheer,
    showPassGloss,
    showActiveStrokeGuide,
    clearActiveStrokeGuide,
    leaveWrite,
    restFromWrite,
    showView,
    openWrite,
    onLevelPassed,
    onQuizMiss,
    awardClear,
    getView: () => view,
  };
})();

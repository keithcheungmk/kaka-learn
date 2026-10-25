(() => {
  'use strict';

  const storage = window.KakaStorage || {};
  const speech = window.KakaSpeech || {};
  const nav = window.KakaNav || { goBackOr: (href) => { location.assign(href); } };
  const CHAR_DATA = window.KAKA_HANZI_WRITE_CHARS || {};
  const BANK = window.KAKA_HANZI_WRITE_BANK || window.KAKA_HANZI_WRITE_LEVELS || [];
  const CHAPTERS = window.KAKA_HANZI_WRITE_CHAPTERS || [];
  const TOPIC_ID = 'hanzi-write';
  const COIN_MODE = 'hanzi-write';
  const PARENT_HREF = 'index.html#screen-topics';
  const GUIDE_ORANGE = '#ff8a1a';
  const OUTLINE_INK = '#8aa0c8';
  const OUTLINE_FAINT = '#d4deee';
  const DRAWING_INK = '#16325c';
  const GUIDE_DASH = '16 10';
  const GUIDE_OUTLINE_WIDTH = '10';
  const DRAWING_TARGET_PX = 26;
  const NEED_SUCCESSES = 6;
  const WARMUP_SIZE = 4;
  const HINT_FULL = 1;
  const HINT_FAINT = 2;
  const HINT_BLANK = 3;
  const WRITE_HINT = '跟著橙色線，一筆一筆寫。';
  const WRITE_HINT_FAINT = '跟著淡虛線和橙色起筆點寫。';
  const WRITE_HINT_BLANK = '這次自己寫。忘記了可以按「看筆順」。';
  const RETRY_HINT = '再試一次。跟著橙色線寫。';
  const PASS_CHEER = '過關啦';

  const $ = (id) => document.getElementById(id);
  const views = {
    profile: $('view-profile'),
    adventure: $('view-adventure'),
    warmup: $('view-warmup'),
    chars: $('view-chars'),
    write: $('view-write'),
  };

  let view = 'profile';
  let chapterId = 'ch1';
  let levelIndex = 0;
  let writer = null;
  let quizActive = false;
  let lastMissSpeakAt = 0;
  let warmupState = null;

  function levels() {
    return BANK.filter((level) => CHAR_DATA[level.char]);
  }

  function chapterById(id) {
    return CHAPTERS.find((chapter) => chapter.id === id) || CHAPTERS[0];
  }

  function openChapters() {
    return CHAPTERS.filter((chapter) => chapter.open);
  }

  function chapterLevels(id) {
    const chapter = chapterById(id || chapterId);
    const ids = new Set(chapter?.charIds || []);
    return levels().filter((level) => ids.has(level.id));
  }

  function currentLevel() {
    const list = chapterLevels();
    return list[levelIndex] || list[0] || levels()[0] || { id: 'yi', char: '一', say: '一', title: '寫「一」' };
  }

  function emptyProgress() {
    return { chars: {}, warmups: {}, chapters: {} };
  }

  function loadProgress() {
    const raw = storage.loadState?.()?.hanziWriteProgress;
    if (!raw || typeof raw !== 'object') return emptyProgress();
    return {
      chars: raw.chars && typeof raw.chars === 'object' ? { ...raw.chars } : {},
      warmups: raw.warmups && typeof raw.warmups === 'object' ? { ...raw.warmups } : {},
      chapters: raw.chapters && typeof raw.chapters === 'object' ? { ...raw.chapters } : {},
    };
  }

  function saveProgress(next) {
    storage.updateState?.({ hanziWriteProgress: next });
    return next;
  }

  function hintLevelFor(successes) {
    const n = Number(successes) || 0;
    if (n >= 4) return HINT_BLANK;
    if (n >= 2) return HINT_FAINT;
    return HINT_FULL;
  }

  function successCount(charId) {
    const n = Number(loadProgress().chars[charId] || 0);
    if (n > 0) return Math.min(NEED_SUCCESSES, n);
    if (storage.isKeyPassed?.(TOPIC_ID, charId)) return NEED_SUCCESSES;
    return 0;
  }

  function setSuccessCount(charId, count) {
    const next = loadProgress();
    const value = Math.min(NEED_SUCCESSES, Math.max(0, Number(count) || 0));
    next.chars[charId] = value;
    saveProgress(next);
    if (value >= NEED_SUCCESSES) storage.markTopicPassed?.(TOPIC_ID, charId);
    return value;
  }

  function isWarmupDone(id) {
    return !!loadProgress().warmups[id || chapterId];
  }

  function markWarmupDone(id) {
    const next = loadProgress();
    next.warmups[id || chapterId] = true;
    saveProgress(next);
  }

  function chapterCleared(id) {
    const list = chapterLevels(id);
    return list.length > 0 && list.every((level) => successCount(level.id) >= NEED_SUCCESSES);
  }

  function chapterRewardPending(id) {
    return chapterCleared(id) && !loadProgress().chapters[id];
  }

  function markChapterRewarded(id) {
    const next = loadProgress();
    next.chapters[id] = true;
    saveProgress(next);
  }

  function hintLabel(level) {
    if (level === HINT_FAINT) return '淡虛線和起筆點';
    if (level === HINT_BLANK) return '自己寫';
    return '完整虛線';
  }

  function writeHintFor(level) {
    if (level === HINT_FAINT) return WRITE_HINT_FAINT;
    if (level === HINT_BLANK) return WRITE_HINT_BLANK;
    return WRITE_HINT;
  }

  function showView(name) {
    view = name;
    Object.entries(views).forEach(([key, el]) => {
      if (!el) return;
      el.classList.toggle('hidden', key !== name);
    });
    const back = $('back-link');
    if (name === 'write') back.textContent = '← 字表';
    else if (name === 'chars' || name === 'warmup') back.textContent = '← 選章';
    else if (name === 'adventure') back.textContent = '← 選角色';
    else back.textContent = '← 中文';
    refreshStars();
  }

  function speak(text) {
    speech.unlockSpeech?.();
    speech.speakTerm?.(text, { rate: 0.92, pitch: 1.08 });
  }

  function refreshStars() {
    const state = storage.loadState?.() || {};
    const pill = $('star-pill');
    if (pill) pill.textContent = `★ ${state.totalStars || 0}`;
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

  function renderChapters() {
    const el = $('chapter-grid');
    if (!el) return;
    el.replaceChildren();
    CHAPTERS.forEach((chapter) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chapter-card';
      btn.setAttribute('role', 'listitem');
      const list = chapterLevels(chapter.id);
      const done = list.filter((level) => successCount(level.id) >= NEED_SUCCESSES).length;
      if (!chapter.open) {
        btn.classList.add('is-locked');
        btn.disabled = true;
        btn.innerHTML = `<span class="chapter-meta">第${chapter.no}章</span><strong>即將開放</strong><span class="chapter-blurb">稍後才可以寫。</span>`;
      } else {
        if (done === list.length && list.length) btn.classList.add('is-done');
        btn.innerHTML = `<span class="chapter-meta">第${chapter.no}章</span><strong>${chapter.title}</strong><span class="chapter-blurb">${chapter.blurb || ''}</span><span class="chapter-meta">已過 ${done}／${list.length} 字</span>`;
        btn.setAttribute('aria-label', `第${chapter.no}章 ${chapter.title}，已過 ${done}／${list.length} 字`);
        btn.addEventListener('click', () => openChapter(chapter.id));
      }
      el.appendChild(btn);
    });
  }

  function goAdventure() {
    $('who-line').textContent = `${whoName()}，準備好了嗎？`;
    renderChapters();
    showView('adventure');
    speak(`${whoName()}，選一章`);
  }

  function pickProfile(id) {
    storage.setActiveProfile?.(id);
    markProfileButtons();
    goAdventure();
  }

  function renderChars() {
    const el = $('level-bank');
    if (!el) return;
    el.replaceChildren();
    const chapter = chapterById(chapterId);
    if ($('chars-kicker')) $('chars-kicker').textContent = `第${chapter.no}章 · ${chapter.title}`;
    chapterLevels().forEach((level, i) => {
      const done = successCount(level.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-chip' + (done >= NEED_SUCCESSES ? ' is-passed' : '');
      btn.setAttribute('role', 'listitem');
      btn.dataset.charId = level.id;
      btn.innerHTML = `<span class="chip-char">${level.char}</span><span class="chip-prog">${done}／${NEED_SUCCESSES}</span>`;
      btn.setAttribute('aria-label', `寫${level.char}，已寫 ${done}／${NEED_SUCCESSES}`);
      btn.addEventListener('click', () => openWrite(i));
      el.appendChild(btn);
    });
  }

  function goChars() {
    hideOverlays();
    renderChars();
    showView('chars');
  }

  function shuffle(list) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function buildWarmup(id) {
    const pool = chapterLevels(id);
    const targets = shuffle(pool).slice(0, Math.min(WARMUP_SIZE, pool.length));
    return {
      chapterId: id,
      index: 0,
      items: targets.map((target) => {
        const others = shuffle(pool.filter((item) => item.id !== target.id)).slice(0, 3);
        return { target, choices: shuffle([target, ...others]) };
      }),
    };
  }

  function warmupTargetId() {
    return warmupState?.items?.[warmupState.index]?.target?.id || '';
  }

  function renderWarmup() {
    const item = warmupState?.items?.[warmupState.index];
    const chapter = chapterById(warmupState?.chapterId || chapterId);
    if ($('warmup-kicker')) $('warmup-kicker').textContent = `第${chapter.no}章 · ${chapter.title}`;
    if ($('warmup-progress')) {
      $('warmup-progress').textContent = `已完成 ${warmupState?.index || 0}／${warmupState?.items?.length || WARMUP_SIZE}`;
    }
    const grid = $('warmup-grid');
    if (!grid || !item) return;
    grid.replaceChildren();
    item.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'warmup-choice';
      btn.dataset.charId = choice.id;
      btn.innerHTML = `<span class="warmup-emoji" aria-hidden="true">${choice.emoji || choice.char}</span><span>${choice.char}</span>`;
      btn.setAttribute('aria-label', choice.char);
      btn.addEventListener('click', () => answerWarmup(choice.id));
      grid.appendChild(btn);
    });
    if ($('warmup-status')) {
      $('warmup-status').textContent = '先聽，再指圖。';
      $('warmup-status').classList.remove('is-retry');
    }
  }

  function playWarmupPrompt() {
    const target = warmupState?.items?.[warmupState.index]?.target;
    if (!target) return;
    speak(target.say || target.char);
  }

  function openWarmup(id) {
    chapterId = id;
    warmupState = buildWarmup(id);
    renderWarmup();
    showView('warmup');
    speak('聽粵語，再指圖');
    window.setTimeout(playWarmupPrompt, 400);
  }

  function answerWarmup(choiceId) {
    const item = warmupState?.items?.[warmupState.index];
    if (!item) return;
    if (choiceId !== item.target.id) {
      if ($('warmup-status')) {
        $('warmup-status').textContent = '再試一次。先聽，再指圖。';
        $('warmup-status').classList.add('is-retry');
      }
      const wrong = document.querySelector(`#warmup-grid [data-char-id="${choiceId}"]`);
      if (wrong) {
        wrong.classList.remove('is-wrong');
        void wrong.offsetWidth;
        wrong.classList.add('is-wrong');
      }
      speak('再試一次');
      return;
    }
    speak(item.target.say || item.target.char);
    warmupState.index += 1;
    if (warmupState.index >= warmupState.items.length) {
      finishWarmup();
      return;
    }
    renderWarmup();
    window.setTimeout(playWarmupPrompt, 350);
  }

  function finishWarmup() {
    markWarmupDone(warmupState?.chapterId || chapterId);
    warmupState = null;
    goChars();
  }

  function openChapter(id) {
    const chapter = chapterById(id);
    if (!chapter?.open) return;
    chapterId = chapter.id;
    if (!isWarmupDone(chapter.id)) {
      openWarmup(chapter.id);
      return;
    }
    goChars();
  }

  function charDataLoader(char, onComplete) {
    const data = CHAR_DATA[char];
    if (!data) throw new Error(`未有繁體字資料：${char}`);
    onComplete(data);
  }

  function drawingWidthFor(size) {
    const scale = Math.max(0.12, (Number(size) - 24) / 1024);
    return Math.max(56, Math.round(DRAWING_TARGET_PX / scale));
  }

  function writerStrokeGroup() {
    return document.querySelector('#hanzi-target svg > g');
  }

  function makeGuidePath(pathD, strokeIndex, hintLevel) {
    const svgNs = ['http:', 'www.w3.org/2000/svg'].join('//');
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', pathD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', GUIDE_ORANGE);
    path.setAttribute('stroke-width', hintLevel === HINT_FAINT ? '8' : GUIDE_OUTLINE_WIDTH);
    path.setAttribute('stroke-dasharray', GUIDE_DASH);
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-opacity', hintLevel === HINT_FAINT ? '0.38' : '1');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    path.setAttribute('pointer-events', 'none');
    path.classList.add('hanzi-guide-stroke');
    path.dataset.strokeIndex = String(strokeIndex);
    return path;
  }

  function makeStartDot(char, strokeIndex, hintLevel) {
    const pt = CHAR_DATA[char]?.medians?.[strokeIndex]?.[0];
    if (!Array.isArray(pt) || pt.length < 2) return null;
    const svgNs = ['http:', 'www.w3.org/2000/svg'].join('//');
    const dot = document.createElementNS(svgNs, 'circle');
    dot.setAttribute('cx', String(pt[0]));
    dot.setAttribute('cy', String(pt[1]));
    dot.setAttribute('r', hintLevel === HINT_BLANK ? '16' : '22');
    dot.setAttribute('fill', GUIDE_ORANGE);
    dot.setAttribute('fill-opacity', hintLevel === HINT_BLANK ? '0.35' : '0.95');
    dot.setAttribute('pointer-events', 'none');
    dot.classList.add('hanzi-guide-stroke');
    dot.dataset.strokeIndex = String(strokeIndex);
    return dot;
  }

  function placeGuideInWriter(path) {
    const group = writerStrokeGroup();
    if (!group) return false;
    group.querySelectorAll(':scope > .hanzi-guide-stroke').forEach((el) => el.remove());
    try {
      if (path) group.appendChild(path);
      return !path || group.contains(path);
    } catch {
      return false;
    }
  }

  function placeGuideNodes(nodes) {
    const group = writerStrokeGroup();
    if (!group) return false;
    group.querySelectorAll(':scope > .hanzi-guide-stroke').forEach((el) => el.remove());
    try {
      nodes.forEach((node) => group.appendChild(node));
      return nodes.every((node) => group.contains(node));
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
    const hint = hintLevelFor(successCount(level.id));
    const pathD = CHAR_DATA[level.char]?.strokes?.[strokeIndex];
    if (typeof HanziWriter === 'undefined' || !HanziWriter.getScalingTransform) return;
    const nodes = [];
    if (hint !== HINT_BLANK && pathD) nodes.push(makeGuidePath(pathD, strokeIndex, hint));
    if (hint !== HINT_FULL) {
      const dot = makeStartDot(level.char, strokeIndex, hint);
      if (dot) nodes.push(dot);
    }
    if (!nodes.length) return;
    if (placeGuideNodes(nodes)) return;
    if (placeGuideInWriter(nodes[0]) && nodes.length === 1) return;
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
    nodes.forEach((node) => group.appendChild(node));
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

  function refreshWriteChrome() {
    const level = currentLevel();
    const chapter = chapterById(chapterId);
    const done = successCount(level.id);
    const hint = hintLevelFor(done);
    if ($('level-kicker')) $('level-kicker').textContent = `第${chapter.no}章 · ${chapter.title}`;
    if ($('write-heading')) $('write-heading').textContent = `寫「${level.char}」`;
    if ($('write-lead')) {
      $('write-lead').textContent = level.hint
        ? `${level.hint}。已寫 ${done}／${NEED_SUCCESSES}。提示：${hintLabel(hint)}。`
        : `已寫 ${done}／${NEED_SUCCESSES}。提示：${hintLabel(hint)}。`;
    }
    if ($('write-progress')) {
      $('write-progress').textContent = `已寫 ${done}／${NEED_SUCCESSES} · 提示：${hintLabel(hint)}`;
    }
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
    const hint = hintLevelFor(successCount(currentLevel().id));
    quizActive = true;
    setWriteStatus(writeHintFor(hint));
    showActiveStrokeGuide(0);
    writer.quiz({
      onMistake() {
        onQuizMiss();
      },
      onCorrectStroke(data) {
        setWriteStatus(writeHintFor(hint));
        showActiveStrokeGuide((data?.strokeNum ?? 0) + 1);
      },
      onComplete() {
        quizActive = false;
        clearActiveStrokeGuide();
        onWriteSuccess();
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
    const hint = hintLevelFor(successCount(level.id));
    writer = HanziWriter.create('hanzi-target', level.char, {
      width: size,
      height: size,
      padding: 12,
      strokeColor: GUIDE_ORANGE,
      highlightColor: GUIDE_ORANGE,
      outlineColor: hint === HINT_BLANK ? OUTLINE_FAINT : OUTLINE_INK,
      drawingColor: DRAWING_INK,
      drawingWidth: drawingWidthFor(size),
      showOutline: true,
      showHintAfterMisses: hint === HINT_BLANK ? false : 1,
      highlightOnComplete: true,
      strokeHighlightSpeed: 1,
      charDataLoader,
    });
    if (successCount(level.id) === 0) playGuide();
    else startQuiz();
  }

  function openWrite(index) {
    const list = chapterLevels();
    levelIndex = Math.max(0, Math.min(index, list.length - 1));
    hideOverlays();
    if ($('btn-next-char')) $('btn-next-char').hidden = true;
    refreshWriteChrome();
    showView('write');
    speak(`寫${currentLevel().say || currentLevel().char}`);
    requestAnimationFrame(() => mountWriter());
  }

  function nextIncompleteIndex() {
    const list = chapterLevels();
    const idx = list.findIndex((level, i) => i > levelIndex && successCount(level.id) < NEED_SUCCESSES);
    if (idx !== -1) return idx;
    return list.findIndex((level) => successCount(level.id) < NEED_SUCCESSES);
  }

  function firstPlayableIndex() {
    const idx = chapterLevels().findIndex((level) => successCount(level.id) < NEED_SUCCESSES);
    return idx === -1 ? 0 : idx;
  }

  function awardSuccessTick() {
    if (storage.tryEarnStar) storage.tryEarnStar();
    refreshStars();
  }

  function awardClear(level, opts) {
    const alreadyDone = successCount(level.id) >= NEED_SUCCESSES && storage.isKeyPassed?.(TOPIC_ID, level.id);
    const first = opts?.firstClear ?? !alreadyDone;
    setSuccessCount(level.id, NEED_SUCCESSES);
    let bonusStars = 0;
    if (first) {
      bonusStars += 2;
      storage.tryEarnStar?.();
      storage.tryEarnStar?.();
    }
    const coin = first && storage.earnCoinForMode
      ? storage.earnCoinForMode(COIN_MODE)
      : { gained: false, already: !first };
    let chapterCoin = { gained: false, already: false };
    let chapterFirst = false;
    if (chapterRewardPending(chapterId)) {
      chapterFirst = true;
      markChapterRewarded(chapterId);
      bonusStars += 5;
      for (let i = 0; i < 5; i += 1) storage.tryEarnStar?.();
      chapterCoin = storage.earnCoinForMode
        ? storage.earnCoinForMode(`${COIN_MODE}-${chapterId}`)
        : { gained: false, already: false };
    }
    refreshStars();
    return { first, coin, chapterFirst, chapterCoin, bonusStars };
  }

  function hideOverlays() {
    $('pass-overlay')?.classList.add('hidden');
    $('rest-overlay')?.classList.add('hidden');
    showPassGloss('');
  }

  function showRestOffer(done) {
    const copy = $('rest-copy');
    if (copy) {
      copy.textContent = `已經寫了 ${done}／${NEED_SUCCESSES} 次。要休息一下嗎？進度已記住，下次可以再寫。`;
    }
    $('rest-overlay')?.classList.remove('hidden');
    speak('寫得好，要休息一下嗎');
  }

  function onWriteSuccess() {
    const level = currentLevel();
    const prev = successCount(level.id);
    const next = setSuccessCount(level.id, prev + 1);
    awardSuccessTick();
    refreshWriteChrome();
    if (next >= NEED_SUCCESSES) {
      onLevelPassed({ firstClear: prev < NEED_SUCCESSES });
      return;
    }
    if (next % 2 === 0) {
      showRestOffer(next);
      return;
    }
    continueWrite();
  }

  function continueWrite() {
    hideOverlays();
    refreshWriteChrome();
    if (!writer) {
      mountWriter();
      return;
    }
    startQuiz();
  }

  function onLevelPassed(opts) {
    const level = currentLevel();
    const { first, coin, chapterFirst, chapterCoin } = awardClear(level, opts);
    const nextIdx = nextIncompleteIndex();
    const hasNext = nextIdx !== -1 && nextIdx !== levelIndex;
    if ($('btn-next-char')) $('btn-next-char').hidden = !hasNext;
    if ($('btn-next-level')) $('btn-next-level').hidden = !hasNext;
    if ($('btn-pass-rewrite')) $('btn-pass-rewrite').hidden = hasNext;
    if ($('pass-stars')) $('pass-stars').textContent = chapterFirst ? '★★★★★' : '★★★';
    if (chapterFirst) {
      $('pass-copy').textContent = first
        ? '這個字寫滿六次，這一章也完成了。大獎勵已記下。'
        : '這一章已經完成。大獎勵已記下。';
    } else if (first) {
      $('pass-copy').textContent = '這個字已經寫滿六次。星星已亮起。完成一輪，獎勵一枚星星幣。';
    } else {
      $('pass-copy').textContent = '這個字已經寫滿六次。可以再寫；今天的星星幣已經領取。';
    }
    const coinBits = [];
    if (coin.gained) coinBits.push('＋1 星星幣');
    if (chapterCoin.gained) coinBits.push('＋1 章節幣');
    if (!coinBits.length) coinBits.push(coin.already ? '今天已領過幣' : '星星已記下');
    $('pass-coin').textContent = coinBits.join(' · ');
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
    hideOverlays();
    if (!writer) {
      mountWriter();
      return;
    }
    playGuide();
  }

  function leaveWrite() {
    hideOverlays();
    destroyWriter();
    renderChars();
    showView('chars');
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
    if (view === 'chars' || view === 'warmup') {
      warmupState = null;
      goAdventure();
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
  $('btn-start-adventure').addEventListener('click', () => openChapter('ch1'));
  $('btn-warmup-listen')?.addEventListener('click', () => {
    speech.unlockSpeech?.();
    playWarmupPrompt();
  });
  $('btn-guide').addEventListener('click', () => {
    speech.unlockSpeech?.();
    playGuide();
  });
  $('btn-rewrite').addEventListener('click', () => {
    speech.unlockSpeech?.();
    rewrite();
  });
  $('btn-next-char').addEventListener('click', () => {
    const idx = nextIncompleteIndex();
    openWrite(idx === -1 ? levelIndex : idx);
  });
  $('btn-next-level')?.addEventListener('click', () => {
    const idx = nextIncompleteIndex();
    openWrite(idx === -1 ? levelIndex : idx);
  });
  $('btn-back-chars')?.addEventListener('click', () => leaveWrite());
  $('btn-pass-rewrite')?.addEventListener('click', () => {
    speech.unlockSpeech?.();
    rewrite();
  });
  $('btn-pass-home').addEventListener('click', () => {
    hideOverlays();
    destroyWriter();
    nav.goBackOr(PARENT_HREF);
  });
  $('btn-write-rest')?.addEventListener('click', () => {
    restFromWrite();
  });
  $('btn-rest-continue')?.addEventListener('click', () => {
    speech.unlockSpeech?.();
    continueWrite();
  });
  $('btn-rest-leave')?.addEventListener('click', () => {
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
    NEED_SUCCESSES,
    HINT_FULL,
    HINT_FAINT,
    HINT_BLANK,
    WRITE_HINT,
    RETRY_HINT,
    PASS_CHEER,
    hintLevelFor,
    successCount,
    setSuccessCount,
    drawingWidthFor,
    placeGuideInWriter,
    placeGuideNodes,
    levels,
    chapterLevels,
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
    openChapter,
    finishWarmup,
    warmupTargetId,
    answerWarmup,
    onLevelPassed,
    onWriteSuccess,
    onQuizMiss,
    awardClear,
    getView: () => view,
    getChapterId: () => chapterId,
  };
})();

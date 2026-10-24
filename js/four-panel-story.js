(() => {
  'use strict';
  const levels = window.FOUR_PANEL_STORIES || [];
  const storage = window.KakaStorage || {};
  const speech = window.KakaSpeech || {};
  const $ = (id) => document.getElementById(id);
  const TOPIC_ID = 'four-panel';
  const MAX_MS = 90 * 1000;
  const MIME_TYPES = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
  const KID_SELF_LABELS = { all: '我講齊喇', loud: '我講大聲', done: '我講完喇' };
  const RETRY_LINE = '再講一次呀';
  const WARMUP_HINTS = [
    '唔係呢格，再試吓。',
    '睇吓邊格啱呢幅。',
    '開頭定結尾？再試吓。',
  ];
  const VIEWS = ['wall', 'warmup', 'path', 'listen', 'play'];

  const wall = $('wall');
  const play = $('play');
  let current = null;
  let view = 'wall';
  let recorder = null;
  let recordStream = null;
  let chunks = [];
  let recordTimer = null;
  let recordStartedAt = 0;
  let playbackUrl = '';
  let localDone = new Set();
  let warmupState = null;
  let warmupMissTimer = null;
  let warmupAdvanceTimer = null;
  let listenTimer = null;
  let listenIndex = 0;
  let listenPlaying = false;

  function pickMimeType() {
    if (typeof MediaRecorder === 'undefined') return '';
    return MIME_TYPES.find((type) => {
      try { return MediaRecorder.isTypeSupported(type); } catch { return false; }
    }) || '';
  }

  function hasSortWarmup(level) {
    return Boolean(level?.sortWarmup) && Array.isArray(level?.panels) && level.panels.length === 4;
  }

  function shuffle(values) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (copy.length > 1 && copy.every((value, index) => value === values[index])) {
      [copy[0], copy[1]] = [copy[1], copy[0]];
    }
    return copy;
  }

  function warmupHint(missCount) {
    return WARMUP_HINTS[Math.min(Math.max(0, missCount - 1), WARMUP_HINTS.length - 1)];
  }

  function kidPanelButtons() {
    return [...document.querySelectorAll('#kid-panel-grid .kid-panel-btn')];
  }

  function kidSelfButtons() {
    return [...document.querySelectorAll('#kid-self .kid-self-btn')];
  }

  function allKidPanelsOn() {
    const buttons = kidPanelButtons();
    return buttons.length === 4 && buttons.every((btn) => btn.classList.contains('is-on'));
  }

  function allKidSelfOn() {
    const buttons = kidSelfButtons();
    return buttons.length === 3 && buttons.every((btn) => btn.classList.contains('is-on'));
  }

  function allChecksOn() {
    return [...document.querySelectorAll('#parent-checks input[type="checkbox"]')]
      .every((box) => box.checked);
  }

  function bothSidesAgree() {
    return allKidPanelsOn() && allKidSelfOn() && allChecksOn();
  }

  function parentTouched() {
    return [...document.querySelectorAll('#parent-checks input[type="checkbox"]')]
      .some((box) => box.checked);
  }

  function setKidOn(btn, on) {
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  function isLevelDone(id) {
    if (!id) return false;
    if (storage.isKeyPassed?.(TOPIC_ID, id)) return true;
    return localDone.has(id);
  }

  function markLevelDone(id) {
    localDone.add(id);
    if (storage.markTopicPassed) storage.markTopicPassed(TOPIC_ID, id);
  }

  function setStatus(text, tone) {
    const el = $('status-note');
    el.textContent = text || '';
    if (tone) el.dataset.tone = tone;
    else delete el.dataset.tone;
  }

  function revokePlayback() {
    if (playbackUrl) {
      URL.revokeObjectURL(playbackUrl);
      playbackUrl = '';
    }
    const audio = $('playback-audio');
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  function stopTracks() {
    if (recordStream) {
      recordStream.getTracks().forEach((track) => track.stop());
      recordStream = null;
    }
  }

  function stopRecording({ silent } = {}) {
    window.clearInterval(recordTimer);
    recordTimer = null;
    const active = recorder;
    recorder = null;
    if (active && active.state !== 'inactive') {
      try { active.stop(); } catch { /* already stopped */ }
    } else {
      stopTracks();
    }
    $('btn-record').classList.remove('is-recording');
    $('btn-record').textContent = '🎤 開始錄音';
    if (!silent) setStatus('錄音停咗。可以聽返自己，再撳亮四格。', 'ok');
  }

  function isMuted() {
    return Boolean(storage.loadState?.()?.muted);
  }

  function speakLine(text) {
    if (!text) return;
    speech.unlockSpeech?.();
    if (speech.speakTerm) speech.speakTerm(text, { rate: 0.92, pitch: 1.05, muted: isMuted() });
  }

  function speakCue(text, correct) {
    if (!text) return;
    speech.unlockSpeech?.();
    speech.warmAudio?.();
    const muted = isMuted();
    if (correct && speech.speakThen && speech.playCorrectCue) {
      speech.speakThen(text, { muted, lang: 'zh-HK', rate: 0.92, pitch: 1.05 }, () => {
        speech.playCorrectCue({ muted });
      });
      return;
    }
    speakLine(text);
  }

  function isRecordingNow() {
    return !!(recorder && recorder.state === 'recording');
  }

  function lightComicBeat(beat) {
    const panel = document.querySelector(`#comic-board .comic-panel[data-beat="${beat}"]`);
    if (!panel) return false;
    panel.classList.add('is-lit');
    return true;
  }

  /** 等錄音／錄音中都可以撳四格：亮燈；未錄音仲會讀格名。評分唔喺呢度計。 */
  function previewComicBeat(beat) {
    if (!current || !beat || play.classList.contains('is-reviewing')) return false;
    if (!lightComicBeat(beat)) return false;
    if (!isRecordingNow()) speakLine(beat);
    return true;
  }

  function onComicHit(beat) {
    if (!beat) return;
    if (play.classList.contains('is-reviewing')) {
      toggleKidPanel(beat);
      return;
    }
    previewComicBeat(beat);
  }

  function previewWallBeat(button) {
    const beat = button?.dataset?.beat;
    const thumb = button?.closest('.level-thumb');
    if (!beat || !thumb) return false;
    thumb.classList.add('is-lit');
    speakLine(beat);
    return true;
  }

  function resetKidLoop() {
    kidPanelButtons().forEach((btn) => setKidOn(btn, false));
    kidSelfButtons().forEach((btn) => setKidOn(btn, false));
    document.querySelectorAll('#comic-board .comic-panel').forEach((panel) => {
      panel.classList.remove('is-lit');
    });
    document.querySelectorAll('#parent-checks input[type="checkbox"]').forEach((box) => {
      box.checked = false;
    });
    $('kid-self').classList.add('hidden');
    $('model-box').classList.add('hidden');
    $('parent-checks').classList.add('hidden');
    $('play-actions').classList.add('hidden');
    $('retry-note').classList.add('hidden');
  }

  function syncComicLights() {
    const onBeats = new Set(
      kidPanelButtons().filter((btn) => btn.classList.contains('is-on')).map((btn) => btn.dataset.beat),
    );
    document.querySelectorAll('#comic-board .comic-panel').forEach((panel) => {
      panel.classList.toggle('is-lit', onBeats.has(panel.dataset.beat));
    });
  }

  function revealClosedLoop() {
    const panelsReady = allKidPanelsOn();
    const selfReady = panelsReady && allKidSelfOn();
    $('kid-self').classList.toggle('hidden', !panelsReady);
    $('model-box').classList.toggle('hidden', !selfReady);
    $('parent-checks').classList.toggle('hidden', !selfReady);
    $('play-actions').classList.toggle('hidden', !selfReady);
    if (selfReady) {
      $('model-text').textContent = current?.modelStory || '';
    }
    refreshCompleteButton();
  }

  function showReview() {
    play.classList.add('is-reviewing');
    renderKidPanels();
    resetKidLoop();
    $('kid-panels').classList.remove('hidden');
    revealClosedLoop();
    $('kid-panels').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function hideReview() {
    play.classList.remove('is-reviewing');
    $('playback').classList.add('hidden');
    $('kid-panels').classList.add('hidden');
    $('completion').classList.add('hidden');
    resetKidLoop();
    refreshCompleteButton();
  }

  function refreshStars() {
    const done = current ? isLevelDone(current.id) : levels.some((level) => isLevelDone(level.id));
    const pill = $('star-pill');
    pill.textContent = done ? '★' : '☆';
    pill.classList.toggle('is-empty', !done);
  }

  function refreshCompleteButton() {
    const already = current && isLevelDone(current.id);
    const parentOpen = !$('parent-checks').classList.contains('hidden');
    const agree = bothSidesAgree();
    $('btn-complete').disabled = !agree;
    $('btn-complete').textContent = already ? '完成' : '完成・領星';
    const showRetry = parentOpen && parentTouched() && !allChecksOn();
    $('retry-note').classList.toggle('hidden', !showRetry);
    if (showRetry) setStatus(RETRY_LINE);
    else if (parentOpen && agree) setStatus('');
    if (already) $('completion').classList.remove('hidden');
  }

  function hideViews() {
    VIEWS.forEach((name) => $(name)?.classList.add('hidden'));
  }

  function setChrome() {
    const title = $('brand-title');
    const kicker = $('brand-kicker');
    const back = $('back-link');
    const shell = document.querySelector('.four-shell');
    shell?.classList.toggle('is-stage', view !== 'wall');
    shell?.classList.toggle('is-playing', view === 'play');
    refreshStars();
    if (view === 'warmup') {
      title.textContent = `${current.place}：${current.title}`;
      kicker.textContent = '排圖熱身';
      back.textContent = '← 關卡';
      back.setAttribute('href', '#wall');
      return;
    }
    if (view === 'path') {
      title.textContent = `${current.place}：${current.title}`;
      kicker.textContent = '揀下一步';
      back.textContent = '← 熱身';
      back.setAttribute('href', '#warmup');
      return;
    }
    if (view === 'listen') {
      title.textContent = `${current.place}：${current.title}`;
      kicker.textContent = '聽範讀';
      back.textContent = '← 選路';
      back.setAttribute('href', '#path');
      return;
    }
    if (view === 'play') {
      title.textContent = `${current.place}：${current.title}`;
      kicker.textContent = '四格講故事';
      if (hasSortWarmup(current)) {
        back.textContent = '← 選路';
        back.setAttribute('href', '#path');
      } else {
        back.textContent = '← 關卡';
        back.setAttribute('href', '#wall');
      }
      return;
    }
    title.textContent = '四格講故事';
    kicker.textContent = '講故事・粵語';
    back.textContent = '← 中文';
    back.setAttribute('href', 'index.html#screen-topics');
  }

  function showView(name) {
    hideViews();
    view = name;
    $(name)?.classList.remove('hidden');
    setChrome();
  }

  function renderWall() {
    $('level-grid').innerHTML = levels.map((level) => {
      const done = isLevelDone(level.id);
      const thumbs = level.panels.map((panel, index) => (
        `<figure class="level-thumb">
          <button type="button" class="wall-hit" data-beat="${panel.beat}" aria-label="聽${panel.beat}">
            <img src="${panel.image}" alt="${panel.alt}" draggable="false">
          </button>
          <b>${index + 1}</b>
        </figure>`
      )).join('');
      return `<article class="level-card" data-level="${level.id}">
        <div class="level-thumbs">${thumbs}</div>
        <div class="level-meta">
          <strong>${level.place}：${level.title}${done ? ' <span class="done-tag">★</span>' : ''}</strong>
          <p>四格・第一／然後／後來／最後</p>
        </div>
        <button type="button" class="start-btn" data-start="${level.id}">${level.startLabel}</button>
      </article>`;
    }).join('');
    $('level-grid').querySelectorAll('[data-start]').forEach((button) => {
      button.addEventListener('click', () => openLevel(button.dataset.start));
    });
    $('level-grid').querySelectorAll('.wall-hit').forEach((button) => {
      button.addEventListener('click', () => previewWallBeat(button));
    });
    showView('wall');
  }

  function renderComic() {
    $('comic-board').innerHTML = current.panels.map((panel) => (
      `<figure class="comic-panel" data-beat="${panel.beat}">
        <button type="button" class="comic-hit" data-beat="${panel.beat}" aria-label="撳亮${panel.beat}">
          <img src="${panel.image}" alt="${panel.alt}" draggable="false">
        </button>
        <figcaption>${panel.beat}</figcaption>
      </figure>`
    )).join('');
    $('comic-board').querySelectorAll('.comic-hit').forEach((button) => {
      button.addEventListener('click', () => onComicHit(button.dataset.beat));
    });
  }

  function renderKidPanels() {
    if (!current) return;
    $('kid-panel-grid').innerHTML = current.panels.map((panel) => (
      `<button type="button" class="kid-panel-btn" data-beat="${panel.beat}" aria-pressed="false">${panel.beat}</button>`
    )).join('');
    kidPanelButtons().forEach((button) => {
      button.addEventListener('click', () => toggleKidPanel(button.dataset.beat));
    });
  }

  function toggleKidPanel(beat) {
    if (!play.classList.contains('is-reviewing') || !beat) return;
    const btn = kidPanelButtons().find((item) => item.dataset.beat === beat);
    if (!btn) return;
    setKidOn(btn, !btn.classList.contains('is-on'));
    syncComicLights();
    speakLine(beat);
    revealClosedLoop();
  }

  function toggleKidSelf(key) {
    if (!play.classList.contains('is-reviewing') || !allKidPanelsOn()) return;
    const btn = kidSelfButtons().find((item) => item.dataset.self === key);
    if (!btn) return;
    setKidOn(btn, !btn.classList.contains('is-on'));
    speakLine(KID_SELF_LABELS[key] || btn.textContent);
    revealClosedLoop();
    if (allKidSelfOn()) {
      $('play-actions').scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  }

  function clearWarmupTimers() {
    if (warmupMissTimer) window.clearTimeout(warmupMissTimer);
    if (warmupAdvanceTimer) window.clearTimeout(warmupAdvanceTimer);
    warmupMissTimer = null;
    warmupAdvanceTimer = null;
  }

  function setWarmupFeedback(text, kind) {
    const el = $('warmup-feedback');
    el.textContent = text || '';
    el.classList.toggle('is-retry', kind === 'retry');
    el.classList.toggle('success', kind === 'success');
  }

  function beginWarmup({ reset = true } = {}) {
    if (!current || !hasSortWarmup(current)) {
      showPlay();
      return;
    }
    if (reset || !warmupState || warmupState.storyId !== current.id) {
      warmupState = {
        storyId: current.id,
        poolOrder: shuffle(current.panels.map((_, index) => index)),
        slots: [null, null, null, null],
        selected: null,
        missSlot: null,
        missCount: 0,
        done: false,
      };
    }
    clearWarmupTimers();
    stopListen();
    showView('warmup');
    setWarmupFeedback(warmupState.done ? '排好喇！而家揀下一步。' : '', warmupState.done ? 'success' : '');
    renderWarmup();
    if (!warmupState.done) speakLine('撳一幅圖，再撳格。');
  }

  function renderWarmup() {
    if (!current || !warmupState) return;
    const pool = $('warmup-pool');
    const slots = $('warmup-slots');
    pool.replaceChildren();
    slots.replaceChildren();
    warmupState.poolOrder.forEach((panelIndex) => {
      const panel = current.panels[panelIndex];
      const placed = warmupState.slots.includes(panelIndex);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'warmup-pic';
      button.dataset.panel = String(panelIndex);
      if (warmupState.selected === panelIndex) button.classList.add('is-selected');
      if (placed) button.classList.add('is-placed');
      button.disabled = placed || warmupState.done;
      button.setAttribute('aria-label', panel.cue || `故事圖 ${panelIndex + 1}`);
      const image = document.createElement('img');
      image.src = panel.image;
      image.alt = panel.alt;
      image.draggable = false;
      button.append(image);
      button.addEventListener('click', () => pickWarmupPicture(panelIndex));
      pool.append(button);
    });
    current.panels.forEach((panel, slotIndex) => {
      const filled = warmupState.slots[slotIndex];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'warmup-slot';
      button.dataset.slot = String(slotIndex);
      if (filled != null) button.classList.add('is-filled');
      if (warmupState.missSlot === slotIndex) button.classList.add('is-miss');
      button.disabled = warmupState.done;
      button.setAttribute('aria-label', `第 ${slotIndex + 1} 格`);
      const badge = document.createElement('b');
      badge.textContent = String(slotIndex + 1);
      button.append(badge);
      if (filled != null) {
        const image = document.createElement('img');
        image.src = current.panels[filled].image;
        image.alt = current.panels[filled].alt;
        image.draggable = false;
        button.append(image);
      } else {
        const empty = document.createElement('span');
        empty.className = 'slot-empty';
        empty.textContent = '放呢度';
        button.append(empty);
      }
      button.addEventListener('click', () => placeWarmupSlot(slotIndex));
      slots.append(button);
    });
    const placedCount = warmupState.slots.filter((item) => item != null).length;
    $('warmup-progress').textContent = `已排好 ${placedCount}／4`;
    $('btn-warmup-next').classList.toggle('hidden', !warmupState.done);
  }

  function pickWarmupPicture(panelIndex) {
    if (!warmupState || warmupState.done || warmupState.slots.includes(panelIndex)) return;
    warmupState.selected = warmupState.selected === panelIndex ? null : panelIndex;
    warmupState.missSlot = null;
    setWarmupFeedback('', '');
    if (warmupState.selected != null) {
      const cue = current.panels[panelIndex].cue || '';
      speakCue(cue, false);
    }
    renderWarmup();
  }

  function placeWarmupSlot(slotIndex) {
    if (!warmupState || warmupState.done) return;
    if (warmupState.slots[slotIndex] != null) {
      setWarmupFeedback('呢格已經有圖喇。', 'retry');
      return;
    }
    if (warmupState.selected == null) {
      setWarmupFeedback('先撳一幅圖。', 'retry');
      return;
    }
    const panelIndex = warmupState.selected;
    if (panelIndex === slotIndex) {
      warmupState.slots[slotIndex] = panelIndex;
      warmupState.selected = null;
      warmupState.missSlot = null;
      warmupState.missCount = 0;
      speakCue(current.panels[panelIndex].beat, true);
      const placedCount = warmupState.slots.filter((item) => item != null).length;
      if (placedCount === 4) {
        warmupState.done = true;
        setWarmupFeedback('排好喇！而家揀下一步。', 'success');
        renderWarmup();
        warmupAdvanceTimer = window.setTimeout(() => {
          if (current && warmupState?.done && view === 'warmup') showPath();
        }, 2200);
        return;
      }
      setWarmupFeedback('', '');
      renderWarmup();
      return;
    }
    warmupState.missCount += 1;
    warmupState.missSlot = slotIndex;
    setWarmupFeedback(warmupHint(warmupState.missCount), 'retry');
    renderWarmup();
    if (warmupMissTimer) window.clearTimeout(warmupMissTimer);
    warmupMissTimer = window.setTimeout(() => {
      if (!warmupState) return;
      warmupState.missSlot = null;
      renderWarmup();
    }, 800);
  }

  function leaveWarmup() {
    clearWarmupTimers();
    stopListen();
    speech.cancelAllSpeech?.();
    warmupState = null;
    current = null;
    setWarmupFeedback('', '');
    renderWall();
  }

  function showPath() {
    if (!current) return;
    clearWarmupTimers();
    stopListen();
    speech.cancelAllSpeech?.();
    showView('path');
    speakLine('想先聽一次，定係而家講？');
  }

  function stopListen() {
    listenPlaying = false;
    if (listenTimer) window.clearTimeout(listenTimer);
    listenTimer = null;
    speech.cancelAllSpeech?.();
  }

  function renderListenBoard(activeIndex) {
    $('listen-board').innerHTML = current.panels.map((panel, index) => (
      `<figure class="comic-panel${index === activeIndex ? ' is-lit' : ''}" data-beat="${panel.beat}">
        <img src="${panel.image}" alt="${panel.alt}" draggable="false">
        <figcaption>${panel.beat}</figcaption>
      </figure>`
    )).join('');
  }

  function playListenStep(index) {
    if (!current || view !== 'listen') return;
    if (index >= current.panels.length) {
      listenPlaying = false;
      $('listen-beat').textContent = '聽完喇';
      $('listen-line').textContent = '可以再聽，或者去講。';
      return;
    }
    listenIndex = index;
    listenPlaying = true;
    const panel = current.panels[index];
    $('listen-beat').textContent = panel.beat;
    $('listen-line').textContent = panel.modelLine || '';
    renderListenBoard(index);
    const line = `${panel.beat}，${panel.modelLine || ''}`.replace(/，$/, '');
    const muted = isMuted();
    const goNext = () => {
      if (!listenPlaying || view !== 'listen') return;
      playListenStep(index + 1);
    };
    speech.unlockSpeech?.();
    if (speech.speakThen) {
      speech.speakThen(line, { muted, lang: 'zh-HK', rate: 0.92, pitch: 1.05 }, goNext);
    } else {
      speakLine(line);
      listenTimer = window.setTimeout(goNext, 2600);
    }
  }

  function showListen() {
    if (!current) return;
    stopListen();
    showView('listen');
    $('listen-beat').textContent = current.panels[0].beat;
    $('listen-line').textContent = '';
    renderListenBoard(-1);
    playListenStep(0);
  }

  function showPlay() {
    if (!current) return;
    clearWarmupTimers();
    stopListen();
    stopRecording({ silent: true });
    revokePlayback();
    hideReview();
    showView('play');
    $('prompt-text').textContent = current.prompt;
    renderComic();
    refreshCompleteButton();
    setStatus('');
    speakLine(current.prompt);
  }

  function openLevel(id) {
    current = levels.find((level) => level.id === id);
    if (!current) return;
    stopRecording({ silent: true });
    revokePlayback();
    hideReview();
    if (hasSortWarmup(current)) {
      beginWarmup({ reset: true });
      return;
    }
    showPlay();
  }

  function leavePlay() {
    stopRecording({ silent: true });
    speech.cancelAllSpeech?.();
    revokePlayback();
    hideReview();
    if (current && hasSortWarmup(current)) {
      showPath();
      return;
    }
    current = null;
    renderWall();
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('呢部機暫時錄唔到音。家長可以聽住小朋友現場講，再撳亮四格。', 'warn');
      showReview();
      return;
    }
    try {
      recordStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setStatus('未准許用咪。可以喺瀏覽器設定打開咪高峰，或者由家長聽住現場講，再撳亮四格。', 'warn');
      showReview();
      return;
    }
    chunks = [];
    revokePlayback();
    hideReview();
    const mimeType = pickMimeType();
    let usedMime = mimeType;
    try {
      recorder = mimeType ? new MediaRecorder(recordStream, { mimeType }) : new MediaRecorder(recordStream);
      usedMime = recorder.mimeType || mimeType;
    } catch {
      stopTracks();
      setStatus('呢部機錄唔到音。家長可以聽住現場講，再撳亮四格。', 'warn');
      showReview();
      return;
    }
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stopTracks();
      if (!chunks.length) {
        setStatus('未錄到聲音，再試一次或者現場講完再撳亮四格。', 'warn');
        showReview();
        return;
      }
      const blob = new Blob(chunks, { type: usedMime || chunks[0].type || 'audio/webm' });
      playbackUrl = URL.createObjectURL(blob);
      const audio = $('playback-audio');
      audio.src = playbackUrl;
      $('playback').classList.remove('hidden');
      showReview();
    };
    recorder.start();
    recordStartedAt = Date.now();
    $('btn-record').classList.add('is-recording');
    $('btn-record').textContent = '⏹ 停止';
    setStatus('而家錄音緊，最多大約 90 秒。講完就撳停止。', 'ok');
    recordTimer = window.setInterval(() => {
      const left = Math.max(0, MAX_MS - (Date.now() - recordStartedAt));
      const sec = Math.ceil(left / 1000);
      $('btn-record').textContent = `⏹ 停止（${sec}）`;
      if (left <= 0) stopRecording();
    }, 250);
  }

  function onRecordClick() {
    speech.unlockSpeech?.();
    if (recorder && recorder.state === 'recording') {
      stopRecording();
      return;
    }
    startRecording();
  }

  function completeLevel() {
    if (!current || !bothSidesAgree()) return;
    const first = !isLevelDone(current.id);
    markLevelDone(current.id);
    if (first && storage.tryEarnStar) storage.tryEarnStar();
    $('retry-note').classList.add('hidden');
    $('completion').classList.remove('hidden');
    refreshStars();
    refreshCompleteButton();
    if (window.KakaCelebrate?.play) {
      window.KakaCelebrate.play({
        actions: $('completion'),
        muted: Boolean(storage.loadState?.()?.muted),
      }).then(() => $('completion')?.classList.remove('hidden'));
    } else {
      speakLine('講完喇，好叻呀。');
    }
  }

  function rerecord() {
    stopRecording({ silent: true });
    revokePlayback();
    hideReview();
    setStatus(RETRY_LINE);
  }

  function onBack() {
    if (view === 'play') {
      leavePlay();
      return;
    }
    if (view === 'listen') {
      stopListen();
      showPath();
      return;
    }
    if (view === 'path') {
      beginWarmup({ reset: false });
      return;
    }
    if (view === 'warmup') {
      leaveWarmup();
      return;
    }
    (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr('index.html#screen-topics');
  }

  $('btn-prompt').addEventListener('click', () => current && speakLine(current.prompt));
  $('btn-model').addEventListener('click', () => current && speakLine(current.modelStory));
  $('btn-record').addEventListener('click', onRecordClick);
  $('btn-complete').addEventListener('click', completeLevel);
  $('btn-rerecord').addEventListener('click', rerecord);
  $('btn-warmup-next').addEventListener('click', () => {
    if (warmupState?.done) showPath();
  });
  $('btn-listen-model').addEventListener('click', showListen);
  $('btn-go-tell').addEventListener('click', showPlay);
  $('btn-replay-model').addEventListener('click', () => {
    stopListen();
    playListenStep(0);
  });
  $('btn-listen-tell').addEventListener('click', showPlay);
  $('kid-self').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-self]');
    if (btn) toggleKidSelf(btn.dataset.self);
  });
  $('parent-checks').addEventListener('change', refreshCompleteButton);
  $('back-link').addEventListener('click', (event) => {
    event.preventDefault();
    onBack();
  });
  window.addEventListener('pagehide', () => {
    stopRecording({ silent: true });
    stopListen();
    revokePlayback();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRecording({ silent: true });
  });

  speech.warmVoices?.();
  renderWall();

  window.KakaFourPanel = {
    TOPIC_ID,
    MAX_MS,
    RETRY_LINE,
    KID_SELF_LABELS,
    WARMUP_HINTS,
    levels,
    pickMimeType,
    hasSortWarmup,
    warmupHint,
    allKidPanelsOn,
    allKidSelfOn,
    allChecksOn,
    bothSidesAgree,
    isLevelDone,
    showReview,
    previewComicBeat,
    previewWallBeat,
    onComicHit,
    toggleKidPanel,
    toggleKidSelf,
    pickWarmupPicture,
    placeWarmupSlot,
    showPath,
    showListen,
    showPlay,
    completeSortWarmupForTest() {
      if (!current || !hasSortWarmup(current)) return;
      warmupState = {
        storyId: current.id,
        poolOrder: current.panels.map((_, index) => index),
        slots: [0, 1, 2, 3],
        selected: null,
        missSlot: null,
        missCount: 0,
        done: true,
      };
      clearWarmupTimers();
      setWarmupFeedback('排好喇！而家揀下一步。', 'success');
      renderWarmup();
      showPath();
    },
    revealClosedLoopForTest() {
      if (!current) return;
      showReview();
      current.panels.forEach((panel) => {
        const btn = kidPanelButtons().find((item) => item.dataset.beat === panel.beat);
        if (btn) setKidOn(btn, true);
      });
      syncComicLights();
      kidSelfButtons().forEach((btn) => setKidOn(btn, true));
      revealClosedLoop();
    },
  };
})();

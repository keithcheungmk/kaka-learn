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

  const wall = $('wall');
  const play = $('play');
  let current = null;
  let recorder = null;
  let recordStream = null;
  let chunks = [];
  let recordTimer = null;
  let recordStartedAt = 0;
  let playbackUrl = '';
  let localDone = new Set();

  function pickMimeType() {
    if (typeof MediaRecorder === 'undefined') return '';
    return MIME_TYPES.find((type) => {
      try { return MediaRecorder.isTypeSupported(type); } catch { return false; }
    }) || '';
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

  function speakLine(text) {
    if (!text) return;
    speech.unlockSpeech?.();
    if (speech.speakTerm) speech.speakTerm(text, { rate: 0.92, pitch: 1.05 });
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

  function renderWall() {
    $('level-grid').innerHTML = levels.map((level) => {
      const done = isLevelDone(level.id);
      const thumbs = level.panels.map((panel, index) => (
        `<figure class="level-thumb">
          <button type="button" class="wall-hit" data-beat="${panel.beat}" aria-label="聽${panel.beat}">
            <img src="${panel.image}" alt="${panel.alt}">
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
    $('brand-title').textContent = '四格講故事';
    $('brand-kicker').textContent = '講故事・粵語';
    $('back-link').setAttribute('href', 'index.html#screen-topics');
    $('back-link').textContent = '← 中文';
    refreshStars();
  }

  function renderComic() {
    $('comic-board').innerHTML = current.panels.map((panel) => (
      `<figure class="comic-panel" data-beat="${panel.beat}">
        <button type="button" class="comic-hit" data-beat="${panel.beat}" aria-label="撳亮${panel.beat}">
          <img src="${panel.image}" alt="${panel.alt}">
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

  function openLevel(id) {
    current = levels.find((level) => level.id === id);
    if (!current) return;
    stopRecording({ silent: true });
    revokePlayback();
    hideReview();
    wall.classList.add('hidden');
    play.classList.remove('hidden');
    document.querySelector('.four-shell')?.classList.add('is-playing');
    $('brand-title').textContent = `${current.place}：${current.title}`;
    $('brand-kicker').textContent = '四格講故事';
    $('back-link').setAttribute('href', '#wall');
    $('back-link').textContent = '← 關卡';
    $('prompt-text').textContent = current.prompt;
    renderComic();
    refreshStars();
    refreshCompleteButton();
    setStatus('');
    speakLine(current.prompt);
  }

  function leavePlay() {
    stopRecording({ silent: true });
    speech.cancelAllSpeech?.();
    revokePlayback();
    current = null;
    play.classList.add('hidden');
    play.classList.remove('is-reviewing');
    wall.classList.remove('hidden');
    document.querySelector('.four-shell')?.classList.remove('is-playing');
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

  $('btn-prompt').addEventListener('click', () => current && speakLine(current.prompt));
  $('btn-model').addEventListener('click', () => current && speakLine(current.modelStory));
  $('btn-record').addEventListener('click', onRecordClick);
  $('btn-complete').addEventListener('click', completeLevel);
  $('btn-rerecord').addEventListener('click', rerecord);
  $('kid-self').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-self]');
    if (btn) toggleKidSelf(btn.dataset.self);
  });
  $('parent-checks').addEventListener('change', refreshCompleteButton);
  $('back-link').addEventListener('click', (event) => {
    event.preventDefault();
    if (current) {
      leavePlay();
      return;
    }
    (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr('index.html#screen-topics');
  });
  window.addEventListener('pagehide', () => {
    stopRecording({ silent: true });
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
    levels,
    pickMimeType,
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

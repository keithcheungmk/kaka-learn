/* Picture spelling challenge, embedded in Topic Words and sharing English star rounds. */
(function () {
  const data = window.KakaEmojiSpellingData;
  const phonics = window.KakaPhonicsWords;
  const speech = window.KakaSpeech;
  const storage = window.KakaStorage;
  if (!data || !phonics || !speech || !storage) {
    console.error('Emoji Spelling could not start: shared English data or services are missing.');
    return;
  }

  const $ = (selector) => document.querySelector(selector);
  const topics = data.getTopics();
  const ROUND_SIZE = 10;
  const state = { topic: null, round: [], index: 0, score: 0, pool: [], selected: [], completed: [], key: '', offset: 0, locked: false };
  let answerTimer = null;
  let roundToken = 0;
  let suppressLetterClickUntil = 0;

  function muted() {
    try { return !!storage.loadState().muted; } catch { return false; }
  }

  function speak(text, rate = 0.84) {
    speech.speakEnglishTerm(text, { muted: muted(), rate, pitch: 1.05, delayMs: 0 });
  }

  function stopAudio() {
    if (answerTimer) clearTimeout(answerTimer);
    answerTimer = null;
    speech.cancelAllSpeech?.();
  }

  function showScreen(screen) {
    document.querySelectorAll('.screen').forEach((item) => item.classList.remove('active'));
    screen?.classList.add('active');
    window.KakaStarFx?.hideRanger?.();
  }

  function showView(view) {
    ['category', 'learn', 'play'].forEach((name) => {
      const panel = $(`#emoji-spelling-${name}-view`);
      if (panel) panel.hidden = name !== view;
    });
    $('#emoji-spelling-finish').hidden = true;
    $('#screen-emoji-spelling')?.classList.toggle('is-playing', view === 'play');
    stopAudio();
  }

  function imageHtml(emoji, plate, asset = '') {
    if (asset) return `<span class="emoji-spelling-custom-art"><img src="${asset}" alt="" loading="lazy" decoding="async"></span>`;
    const parts = window.KakaEmojiArt?.graphemes?.(emoji) || [emoji];
    const art = parts.map((part) => {
      const id = window.KakaEmojiArt?.codeName?.(part);
      if (!id || data.needsNativeEmoji(id)) return `<span class="emoji-spelling-native">${part}</span>`;
      return window.KakaEmojiArt.html(part);
    }).join('');
    const multi = parts.length > 1;
    return `<span class="emoji-plate" style="--plate:${plate}"><span class="emoji-face${multi ? ' is-multi' : ''}" aria-hidden="true">${art}</span></span>`;
  }

  function renderCategories() {
    const grid = $('#emoji-spelling-category-grid');
    if (!grid) return;
    grid.replaceChildren();
    topics.forEach((topic, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji-spelling-category';
      button.dataset.topicId = topic.id;
      button.innerHTML = `${imageHtml(topic.cover, '#254b72', topic.coverPhoto)}<strong>${topic.titleEn}</strong><span>${topic.words.length} 個詞語</span>`;
      button.addEventListener('click', () => openTopic(topic));
      button.style.setProperty('--topic-order', index);
      grid.appendChild(button);
    });
  }

  function openTopic(topic) {
    state.topic = topic;
    state.round = [];
    state.score = 0;
    $('#emoji-spelling-learn-title').textContent = topic.titleEn;
    $('#emoji-spelling-learn-lead').textContent = '撳圖卡聽英文詞語，認識好晒就開始串字。';
    const grid = $('#emoji-spelling-word-grid');
    grid.replaceChildren();
    topic.words.forEach((word) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji-spelling-word-card';
      button.setAttribute('aria-label', `Listen to ${word.word}`);
      button.innerHTML = `${imageHtml(word.emoji, word.plate, word.photo || word.objectArt)}<strong>${word.word.toUpperCase()}</strong><span class="emoji-spelling-card-speaker" aria-hidden="true">🔊</span>`;
      button.addEventListener('click', () => speak(word.word));
      grid.appendChild(button);
    });
    showView('learn');
    showScreen($('#screen-emoji-spelling'));
  }

  function progressKey(topic) {
    const profileId = typeof storage.getActiveProfileId === 'function' ? storage.getActiveProfileId() : 'kaka';
    return `${profileId}|emoji-spelling|${topic.id}`;
  }

  function renderRoundBar() {
    const header = $('#emoji-spelling-play-view .game-header');
    if (!header) return;
    let bar = header.querySelector('.emoji-spelling-round-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'star-bar star-bar-compact emoji-spelling-round-bar';
      bar.setAttribute('role', 'img');
      bar.innerHTML = '<span class="star-bar-stars"></span><span class="star-bar-hint"></span>';
      header.appendChild(bar);
    }
    const count = Math.min(state.completed.length, ROUND_SIZE);
    bar.setAttribute('aria-label', `今輪串對 ${count} 題，共 ${ROUND_SIZE} 題`);
    const stars = bar.querySelector('.star-bar-stars');
    if (stars) stars.innerHTML = Array.from({ length: ROUND_SIZE }, (_, index) =>
      `<span class="star-cell${index < count ? ' is-on' : ''}" aria-hidden="true">★</span>`).join('');
    const hint = bar.querySelector('.star-bar-hint');
    if (hint) hint.textContent = `${count}/${ROUND_SIZE}`;
  }

  function startRound({ restart = false } = {}) {
    if (!state.topic) return;
    stopAudio();
    roundToken += 1;
    state.key = progressKey(state.topic);
    if (restart) storage.clearRoundProgress?.(state.key);
    const savedOffset = Number(storage.loadRoundProgress?.(`${state.key}|offset`)?.[0] || 0);
    state.offset = Number.isFinite(savedOffset) && savedOffset >= 0 ? Math.floor(savedOffset) % state.topic.words.length : 0;
    state.round = data.planRound(state.topic.words, state.offset, ROUND_SIZE);
    state.completed = restart ? [] : (storage.loadRoundProgress?.(state.key) || []).slice(0, ROUND_SIZE);
    if (state.completed.length >= ROUND_SIZE) {
      storage.clearRoundProgress?.(state.key);
      state.completed = [];
    }
    state.score = state.completed.length;
    state.index = state.completed.length;
    showView('play');
    renderRoundBar();
    renderQuestion();
  }

  function renderQuestion() {
    const word = state.round[state.index];
    if (!word) return finishRound();
    state.pool = data.makeLetterPool(word.word);
    state.selected = data.createAnswerSlots(word.letters.length);
    state.locked = false;
    $('#emoji-spelling-play-title').textContent = state.topic.titleEn;
    $('#emoji-spelling-progress').textContent = `${state.index + 1} / ${state.round.length}`;
    $('#emoji-spelling-picture').innerHTML = imageHtml(word.emoji, word.plate, word.photo || word.objectArt);
    $('#emoji-spelling-feedback').textContent = '';
    $('#emoji-spelling-feedback').classList.remove('is-retry', 'is-correct');
    renderAnswer();
    renderLetterPool();
  }

  function placeLetter(tile, slotIndex) {
    if (state.locked || state.selected.some((item) => item?.key === tile.key)) return;
    const nextIndex = slotIndex == null ? data.nextEmptySlot(state.selected) : slotIndex;
    if (nextIndex < 0 || nextIndex >= state.selected.length || state.selected[nextIndex]) return;
    state.selected[nextIndex] = tile;
    renderAnswer();
    renderLetterPool();
    if (state.selected.every(Boolean)) checkAnswer();
  }

  function renderAnswer() {
    const answer = $('#emoji-spelling-answer');
    const word = state.round[state.index];
    if (!answer || !word) return;
    answer.replaceChildren();
    const breaks = new Set(word.wordBreaks);
    word.letters.forEach((letter, index) => {
      const selected = state.selected[index];
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = `emoji-spelling-slot${selected ? ' is-filled' : ''}`;
      slot.dataset.index = String(index);
      slot.textContent = selected ? selected.letter.toUpperCase() : '';
      slot.setAttribute('aria-label', selected ? `Remove ${selected.letter}` : `Empty letter ${index + 1}`);
      slot.disabled = state.locked;
      slot.addEventListener('click', () => removeSelected(index));
      answer.appendChild(slot);
      if (breaks.has(index + 1)) {
        const gap = document.createElement('span');
        gap.className = 'emoji-spelling-word-gap';
        gap.textContent = ' ';
        gap.setAttribute('aria-hidden', 'true');
        answer.appendChild(gap);
      }
    });
  }

  function beginLetterDrag(event, tile, button) {
    if (event.button === 2 || state.locked || button.disabled) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const ghost = document.createElement('div');
    ghost.className = 'emoji-spelling-drag-ghost';
    ghost.textContent = tile.letter.toUpperCase();

    const onMove = (moveEvent) => {
      if (!moved && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 9) return;
      moved = true;
      moveEvent.preventDefault();
      button.classList.add('is-dragging');
      if (!ghost.isConnected) document.body.appendChild(ghost);
      ghost.style.left = `${moveEvent.clientX}px`;
      ghost.style.top = `${moveEvent.clientY}px`;
      document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest?.('.emoji-spelling-slot:not(:disabled)')?.classList.add('is-drop-target');
      document.querySelectorAll('.emoji-spelling-slot.is-drop-target').forEach((slot) => {
        const rect = slot.getBoundingClientRect();
        if (moveEvent.clientX < rect.left || moveEvent.clientX > rect.right || moveEvent.clientY < rect.top || moveEvent.clientY > rect.bottom) slot.classList.remove('is-drop-target');
      });
    };

    const onUp = (upEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      button.classList.remove('is-dragging');
      document.querySelectorAll('.emoji-spelling-slot.is-drop-target').forEach((slot) => slot.classList.remove('is-drop-target'));
      if (!moved) return;
      suppressLetterClickUntil = Date.now() + 350;
      ghost.remove();
      const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest?.('.emoji-spelling-slot:not(:disabled)');
      if (target) placeLetter(tile, Number(target.dataset.index));
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp, { once: true });
    window.addEventListener('pointercancel', onUp, { once: true });
  }

  function renderLetterPool() {
    const pool = $('#emoji-spelling-letter-pool');
    pool.replaceChildren();
    state.pool.forEach((tile) => {
      const used = state.selected.some((item) => item?.key === tile.key);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `emoji-spelling-letter${used ? ' is-used' : ''}`;
      button.textContent = tile.letter.toUpperCase();
      button.disabled = state.locked || used;
      button.setAttribute('aria-label', `Letter ${tile.letter}`);
      button.addEventListener('click', (event) => {
        if (Date.now() < suppressLetterClickUntil) { event.preventDefault(); return; }
        placeLetter(tile);
      });
      button.addEventListener('pointerdown', (event) => beginLetterDrag(event, tile, button));
      pool.appendChild(button);
    });
  }

  function removeSelected(index) {
    if (state.locked || !state.selected[index]) return;
    state.selected[index] = null;
    renderAnswer();
    renderLetterPool();
  }

  function undoLast() {
    const index = state.selected.map((item, i) => item ? i : -1).filter((i) => i >= 0).pop();
    if (index != null) removeSelected(index);
  }

  function checkAnswer() {
    const target = state.round[state.index];
    const feedback = $('#emoji-spelling-feedback');
    state.locked = true;
    if (!data.isCorrectAnswer(state.selected, target.word)) {
      feedback.textContent = 'Not quite. Try again!';
      feedback.classList.add('is-retry');
      speech.playTryAgainCue({ muted: muted() });
      speak('Try again!', 0.94);
      const token = roundToken;
      answerTimer = setTimeout(() => {
        if (token !== roundToken) return;
        state.selected = data.createAnswerSlots(state.round[state.index].letters.length);
        state.locked = false;
        feedback.textContent = '';
        feedback.classList.remove('is-retry');
        renderAnswer();
        renderLetterPool();
        answerTimer = null;
      }, 900);
      return;
    }

    state.score += 1;
    feedback.textContent = 'Great spelling!';
    feedback.classList.remove('is-retry');
    feedback.classList.add('is-correct');
    speech.playCorrectCue({ muted: muted() });
    speak(`Great job! ${target.word}.`, 0.9);
    const token = roundToken;
    answerTimer = setTimeout(() => {
      if (token !== roundToken) return;
      const commitStar = () => {
        if (token !== roundToken) return;
        state.completed.push(`${state.index}:${target.id}`);
        if (state.completed.length < ROUND_SIZE) storage.saveRoundProgress?.(state.key, state.completed);
        else storage.clearRoundProgress?.(state.key);
        renderRoundBar();
        state.index += 1;
        if (state.index >= state.round.length) finishRound();
        else renderQuestion();
      };
      if (typeof window.KakaStarFx?.flyStarFromRanger === 'function') {
        window.KakaStarFx.flyStarFromRanger($('#screen-emoji-spelling'), commitStar);
      } else commitStar();
      answerTimer = null;
    }, Math.max(850, Math.min(1300, target.word.length * 65)));
  }

  function finishRound() {
    stopAudio();
    storage.saveRoundProgress?.(`${state.key}|offset`, [String((state.offset + ROUND_SIZE) % state.topic.words.length)]);
    $('#emoji-spelling-finish-score').textContent = `${state.score} / ${state.round.length} 個詞語`;
    $('#emoji-spelling-finish-reward').textContent = '你儲滿了 10 粒星，拼字進步了！';
    $('#emoji-spelling-finish').hidden = false;
    $('#emoji-spelling-finish').classList.remove('is-celebrating');
    void $('#emoji-spelling-finish').offsetWidth;
    $('#emoji-spelling-finish').classList.add('is-celebrating');
    speech.playStarCue({ muted: muted() });
    speak('Amazing spelling! You earned ten stars!', 0.92);
  }

  function openCategories() {
    stopAudio();
    roundToken += 1;
    showView('category');
    renderCategories();
    showScreen($('#screen-emoji-spelling'));
  }

  function backToEnglish() {
    stopAudio();
    roundToken += 1;
    if (window.KakaPhonics?.openWordTopics) window.KakaPhonics.openWordTopics();
    else showScreen($('#screen-phonics-topics'));
  }

  function bind() {
    $('#btn-open-emoji-spelling')?.addEventListener('click', openCategories);
    $('#btn-emoji-spelling-back-english')?.addEventListener('click', backToEnglish);
    $('#btn-emoji-spelling-back-categories')?.addEventListener('click', openCategories);
    $('#btn-emoji-spelling-learn-back-bottom')?.addEventListener('click', openCategories);
    $('#btn-emoji-spelling-start')?.addEventListener('click', () => startRound());
    $('#btn-emoji-spelling-review')?.addEventListener('click', () => {
      roundToken += 1;
      showView('learn');
      showScreen($('#screen-emoji-spelling'));
    });
    $('#btn-emoji-spelling-speak')?.addEventListener('click', () => {
      const word = state.round[state.index];
      if (word) speak(word.word);
    });
    $('#btn-emoji-spelling-undo')?.addEventListener('click', undoLast);
    $('#btn-emoji-spelling-choose-again')?.addEventListener('click', openCategories);
    $('#btn-emoji-spelling-play-again')?.addEventListener('click', () => startRound({ restart: true }));
    renderCategories();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();

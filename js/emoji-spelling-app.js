/* Picture spelling challenge, embedded in Topic Words and sharing English star rounds. */
(function () {
  const data = window.KakaEmojiSpellingData;
  const phonics = window.KakaPhonicsWords;
  const speech = window.KakaSpeech;
  const sounds = window.KakaEmojiSpellingSounds;
  const storage = window.KakaStorage;
  if (!data || !phonics || !speech || !sounds || !storage) {
    console.error('Emoji Spelling could not start: shared English data or services are missing.');
    return;
  }

  const $ = (selector) => document.querySelector(selector);
  const topics = data.getTopics();
  const ROUND_SIZE = 10;
  const SPEAKER_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm12.5-.9a1 1 0 0 1 1.4 0 5.5 5.5 0 0 1 0 7.8 1 1 0 1 1-1.4-1.4 3.5 3.5 0 0 0 0-5 1 1 0 0 1 0-1.4z"/></svg>';
  const state = { topic: null, round: [], index: 0, score: 0, pool: [], selected: [], completed: [], key: '', offset: 0, locked: false };
  let answerTimer = null;
  let roundToken = 0;
  let suppressLetterClickUntil = 0;
  let returnCollectionId = null;
  let returnTrack = 'sight';

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
    sounds.stopPhonics();
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
    const art = parts.map((part) => `<span class="emoji-spelling-native">${part}</span>`).join('');
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
    $('#emoji-spelling-learn-title').textContent = "Let's Learn! 📖";
    $('#emoji-spelling-learn-lead').textContent = '點擊卡片聽發音，準備好就出發挑戰！';
    const grid = $('#emoji-spelling-word-grid');
    grid.replaceChildren();
    const offset = topicOffset(topic, progressKey(topic));
    data.planRound(topic.words, offset, Math.min(ROUND_SIZE, topic.words.length)).forEach((word) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'emoji-spelling-word-card';
      button.setAttribute('aria-label', `Listen to ${word.word}`);
      button.innerHTML = `${imageHtml(word.emoji, word.plate, word.photo || word.objectArt)}<strong>${word.word.toUpperCase()}</strong><span class="emoji-spelling-card-speaker" aria-hidden="true">${SPEAKER_ICON}</span>`;
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

  function topicOffset(topic, key) {
    const saved = Number(storage.loadRoundProgress?.(`${key}|offset`)?.[0] || 0);
    return Number.isFinite(saved) && saved >= 0 ? Math.floor(saved) % topic.words.length : 0;
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
    state.offset = topicOffset(state.topic, state.key);
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
    state.pool = data.makeLetterPool(word.word, Math.random, 2);
    state.selected = data.createAnswerSlots(word.letters.length);
    state.locked = false;
    $('#screen-emoji-spelling')?.classList.toggle('has-long-word', word.letters.length > 10);
    $('#emoji-spelling-play-title').textContent = '✨ Emoji Spelling ✨';
    $('#emoji-spelling-progress').textContent = `${state.index + 1} / ${state.round.length}`;
    $('#emoji-spelling-picture').innerHTML = imageHtml(word.emoji, word.plate, word.photo || word.objectArt);
    $('#btn-emoji-spelling-phonics').hidden = !word.phonicsChunks.length;
    $('#emoji-spelling-feedback').textContent = '';
    $('#emoji-spelling-feedback').classList.remove('is-retry', 'is-correct');
    renderAnswer();
    renderLetterPool();
    speak(word.word);
  }

  function placeLetter(tile, slotIndex) {
    if (state.locked || state.selected.some((item) => item?.key === tile.key)) return;
    const nextIndex = data.nextEmptySlot(state.selected);
    if (nextIndex < 0) return;
    sounds.stopPhonics();
    speech.cancelAllSpeech?.();
    const feedback = $('#emoji-spelling-feedback');
    if ((slotIndex != null && slotIndex !== nextIndex) || tile.letter !== state.round[state.index].letters[nextIndex]) {
      feedback.textContent = '再試另一個字母！';
      feedback.classList.remove('is-correct');
      feedback.classList.add('is-retry');
      sounds.retry({ muted: muted() });
      return;
    }
    state.selected[nextIndex] = tile;
    feedback.textContent = '啱喇！';
    feedback.classList.remove('is-retry');
    feedback.classList.add('is-correct');
    renderAnswer();
    renderLetterPool();
    if (state.selected.every(Boolean)) checkAnswer();
    else sounds.correct({ muted: muted() });
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
      if (upEvent.type === 'pointercancel') { ghost.remove(); suppressLetterClickUntil = Date.now() + 350; return; }
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
      sounds.retry({ muted: muted() });
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
    sounds.correct({ muted: muted() });
    const token = roundToken;
    const award = () => {
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
    };
    // Guard every stage against navigation and speech engines that never fire onEnd.
    const sayThen = (text, next) => {
      if (token !== roundToken) return;
      let finished = false;
      const done = () => {
        if (finished || token !== roundToken) return;
        finished = true;
        if (answerTimer) clearTimeout(answerTimer);
        answerTimer = null;
        next();
      };
      const fallbackMs = Math.max(2200, speech.estimateSpeakMs?.(text, { rate: 0.84, delayMs: 0 }) || 2200);
      answerTimer = setTimeout(done, fallbackMs);
      speech.speakEnglishTerm(text, { muted: muted(), rate: 0.84, pitch: 1.05, delayMs: 0, onEnd: done });
    };
    const praise = () => {
      const name = storage.getActiveProfileId?.() === 'heihei' ? 'Heihei' : 'Kaka';
      feedback.textContent = `Great job, ${name}!`;
      sayThen(`Great job, ${name}!`, award);
    };
    const repeatWord = () => sayThen(target.word, praise);
    sayThen(target.word, () => {
      if (!target.phonicsChunks.length) return repeatWord();
      const notes = target.phonicsNotes?.length ? `（${target.phonicsNotes.join('；')}）` : '';
      feedback.textContent = `聽音塊：${(target.phonicsLabels || target.phonicsChunks.map(chunk => chunk.replace(/^oo-(?:long|short)$/, 'oo'))).join(' · ')}${notes}`;
      sounds.playPhonics(target.phonicsChunks, { muted: muted() }).then(() => {
        if (token === roundToken) repeatWord();
      });
    });
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

  function openTopicById(id, collectionId = null, track = 'sight') {
    const topic = topics.find((item) => item.id === id);
    if (!topic) return false;
    roundToken += 1;
    returnCollectionId = collectionId;
    returnTrack = track;
    openTopic(topic);
    return true;
  }

  function returnToTopics() {
    stopAudio();
    roundToken += 1;
    if (returnCollectionId && window.KakaPhonics?.openWordCollections) window.KakaPhonics.openWordCollections(returnCollectionId);
    else if (returnTrack === 'phonics' && window.KakaPhonics?.openPhonicsTopics) window.KakaPhonics.openPhonicsTopics();
    else if (window.KakaPhonics?.openWordTopics) window.KakaPhonics.openWordTopics();
    else openCategories();
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
    $('#btn-emoji-spelling-back-categories')?.addEventListener('click', returnToTopics);
    $('#btn-emoji-spelling-learn-back-bottom')?.addEventListener('click', returnToTopics);
    $('#btn-emoji-spelling-start')?.addEventListener('click', () => startRound());
    $('#btn-emoji-spelling-review')?.addEventListener('click', () => {
      roundToken += 1;
      showView('learn');
      showScreen($('#screen-emoji-spelling'));
    });
    $('#btn-emoji-spelling-speak')?.addEventListener('click', () => {
      const word = state.round[state.index];
      if (word) { sounds.stopPhonics(); speak(word.word); }
    });
    $('#btn-emoji-spelling-phonics')?.addEventListener('click', () => {
      const word = state.round[state.index];
      if (!word || !word.phonicsChunks.length || state.locked) return;
      speech.cancelAllSpeech?.();
      sounds.playPhonics(word.phonicsChunks, { muted: muted() });
    });
    $('#btn-emoji-spelling-undo')?.addEventListener('click', undoLast);
    $('#btn-emoji-spelling-choose-again')?.addEventListener('click', returnToTopics);
    $('#btn-emoji-spelling-play-again')?.addEventListener('click', () => startRound({ restart: true }));
    renderCategories();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
  window.KakaEmojiSpelling = { openTopicById };
})();

(() => {
  'use strict';
  const stories = window.FAMILY_STORIES_EN || [];
  const $ = id => document.getElementById(id);
  const library = $('library'), reader = $('reader');
  const finishedKey = 'kaka-family-storybook-en-finished-v1';
  const speech = window.KakaSpeech || {};
  const libraryTitle = 'Karl, HeiHei and Froggie';
  let current = null, pageIndex = 0, pageStates = [], activeSlots = [], activeSlot = 0, speakToken = 0;
  const safeRead = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const storyHeading = story => {
    const place = String(story?.place || '').trim();
    const title = String(story?.title || '').trim();
    return place ? `${place}: ${title}` : title;
  };
  const setReadingChrome = on => {
    $('story-topbar').classList.toggle('is-reading', on);
    document.querySelector('.storybook-shell')?.classList.toggle('is-reading', on);
    $('brand-title').textContent = on && current ? storyHeading(current) : libraryTitle;
    const back = $('back-english');
    if (back) back.setAttribute('href', on ? '#library' : 'index.html#screen-story-series');
  };
  const refreshStars = () => {
    $('star-total').textContent = safeRead(finishedKey).length;
    const total = $('story-total');
    if (total) total.textContent = stories.length;
  };
  const shuffle = values => [...values].map(value => [Math.random(), value]).sort((a, b) => a[0] - b[0]).map(pair => pair[1]);
  const escapeRe = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function lastWordIndex(sentence, word) {
    const re = new RegExp(`\\b${escapeRe(word)}\\b`, 'g');
    let match, last = -1;
    while ((match = re.exec(sentence))) last = match.index;
    return last >= 0 ? last : sentence.lastIndexOf(word);
  }
  function renderLibrary() {
    $('story-grid').innerHTML = stories.map((story, index) => {
      const done = safeRead(finishedKey).includes(story.id);
      const image = `assets/family-stories/scenes/${story.id}-p01.webp`;
      const displayedWords = story.pages.flatMap(page => page.focusWords).slice(0, 4);
      return `<button class="story-card" type="button" data-story="${story.id}" aria-label="Start story: ${storyHeading(story)}"><img class="story-cover" src="${image}" alt="${story.title} illustration"><span><strong class="story-title">${String(index + 1).padStart(2, '0')}・${storyHeading(story)} ${done ? '<span class="done-tag">★</span>' : ''}</strong><p>${story.place} · ${story.pages.length} pages</p><p>${story.summary}</p><p class="card-words">Focus words: ${displayedWords.join(', ')}</p></span></button>`;
    }).join('');
    $('story-grid').querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => openStory(button.dataset.story)));
    refreshStars();
  }
  function openStory(id) {
    current = stories.find(story => story.id === id);
    if (!current) return;
    pageIndex = 0;
    pageStates = current.pages.map(page => ({ unlocked: false, solved: false, answers: Array(page.focusWords.length).fill('') }));
    library.classList.add('hidden'); reader.classList.remove('hidden'); $('completion').classList.add('hidden');
    setReadingChrome(true);
    renderPage(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function stopSpeech() {
    speakToken += 1;
    speech.cancelAllSpeech?.();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
  function canAttemptSpeech() {
    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }
  function pageReadingText(page) {
    const sentence = String(page.sentence || '').trim();
    const dialogue = String(page.dialogue?.text || '').replace(/^["']|["']$/g, '');
    const speaker = page.dialogue?.speaker || '';
    const base = /[.!?]$/.test(sentence) ? sentence : `${sentence}.`;
    return `${base} ${speaker} says: "${dialogue}"`;
  }
  function leaveReader() {
    stopSpeech();
    current = null;
    reader.classList.add('hidden');
    library.classList.remove('hidden');
    setReadingChrome(false);
    renderLibrary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('next-story').addEventListener('click', leaveReader);
  $('back-english').addEventListener('click', event => {
    event.preventDefault();
    if ($('story-topbar').classList.contains('is-reading')) {
      leaveReader();
      return;
    }
    (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr('index.html#screen-story-series');
  });
  function renderPage() {
    const page = current.pages[pageIndex], state = pageStates[pageIndex];
    stopSpeech();
    $('page-count').textContent = `Page ${pageIndex + 1} / ${current.pages.length}`;
    $('page-progress').style.width = `${((pageIndex + 1) / current.pages.length) * 100}%`;
    $('scene-image').src = `assets/family-stories/scenes/${current.id}-p${String(pageIndex + 1).padStart(2, '0')}.webp`;
    $('scene-image').alt = `${storyHeading(current)}, page ${pageIndex + 1}`;
    $('scene-caption').textContent = `${storyHeading(current)} · page ${pageIndex + 1}`;
    $('page-reading').textContent = pageReadingText(page);
    $('audio-feedback').textContent = '';
    $('prev-page').disabled = pageIndex === 0;
    $('next-page').disabled = !state.solved;
    $('next-page').textContent = pageIndex === current.pages.length - 1 ? 'Finish story →' : 'Next →';
    $('activity').classList.remove('hidden'); $('completion').classList.add('hidden');
    $('answer-celebration').classList.add('hidden');
    $('answer-celebration').classList.remove('play');
    $('task-feedback').textContent = state.solved ? 'This page is done. You can go to the next page.' : '';
    $('task-feedback').classList.toggle('success', state.solved);
    $('guardian-unlock').classList.toggle('hidden', state.unlocked || canAttemptSpeech());
    activeSlot = 0;
    renderWordTask(page, state);
  }
  $('prev-page').addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPage(); } });
  $('next-page').addEventListener('click', () => {
    if (!pageStates[pageIndex]?.solved) return;
    if (pageIndex < current.pages.length - 1) { pageIndex++; renderPage(); }
    else completeStory();
  });

  function afterPageHeard(unlockedPageIndex) {
    if (!current || !pageStates[unlockedPageIndex]) return;
    pageStates[unlockedPageIndex].unlocked = true;
    $('guardian-unlock').classList.add('hidden');
    $('task-feedback').textContent = 'Now put the two focus words back in the sentence.';
    const unlockedPage = current.pages[unlockedPageIndex];
    const unlockedState = pageStates[unlockedPageIndex];
    unlockedState.audioLocked = true;
    $('speak-sentence').disabled = true;
    renderWordTask(unlockedPage, unlockedState);
    const readStarted = speakStory(unlockedPage.sentence, {
      onEnd: () => {
        unlockedState.audioLocked = false;
        $('speak-sentence').disabled = false;
        if (current?.pages[pageIndex] === unlockedPage) renderWordTask(unlockedPage, unlockedState);
      },
      onError: () => {
        unlockedState.audioLocked = false;
        $('speak-sentence').disabled = false;
        if (current?.pages[pageIndex] === unlockedPage) renderWordTask(unlockedPage, unlockedState);
      }
    });
    if (!readStarted) {
      unlockedState.audioLocked = false;
      $('speak-sentence').disabled = false;
      renderWordTask(unlockedPage, unlockedState);
    }
  }

  function speakStory(text, { unlockPage = false, onEnd = null, onError = null } = {}) {
    speech.unlockSpeech?.();
    speech.warmAudio?.();
    speech.warmEnglishVoice?.();
    stopSpeech();
    if (!canAttemptSpeech() || typeof speech.speakEnglishTerm !== 'function') {
      $('audio-feedback').textContent = 'This browser cannot read aloud. A parent can read the page.';
      $('guardian-unlock').classList.remove('hidden');
      return false;
    }
    const token = speakToken;
    let finished = false;
    const finish = ok => {
      if (finished || token !== speakToken) return;
      finished = true;
      if (ok) {
        $('audio-feedback').textContent = 'Finished.';
        if (unlockPage && current) afterPageHeard(pageIndex);
        if (typeof onEnd === 'function') onEnd();
      } else {
        $('audio-feedback').textContent = 'Could not play. Tap Listen again, or ask a parent to read.';
        if (current && !pageStates[pageIndex]?.unlocked) $('guardian-unlock').classList.remove('hidden');
        if (typeof onError === 'function') onError();
      }
    };
    $('audio-feedback').textContent = 'Reading in English…';
    speech.speakEnglishTerm(text, {
      rate: 0.92,
      pitch: 1.05,
      delayMs: 60,
      onEnd: () => finish(true)
    });
    return true;
  }
  $('speak-sentence').addEventListener('click', () => {
    if (!current) return;
    speakStory(pageReadingText(current.pages[pageIndex]), { unlockPage: true });
  });
  $('guardian-unlock').addEventListener('click', () => {
    if (!current) return;
    pageStates[pageIndex].unlocked = true;
    $('guardian-unlock').classList.add('hidden');
    $('audio-feedback').textContent = 'A parent read this page.';
    $('task-feedback').textContent = 'You can fill the two words now.';
    renderWordTask(current.pages[pageIndex], pageStates[pageIndex]);
  });
  $('speak-task-sentence').addEventListener('click', () => {
    if (!current || !pageStates[pageIndex]?.unlocked) return;
    speakStory(current.pages[pageIndex].sentence);
  });

  function setSolvedSpeechControls(disabled) {
    $('speak-sentence').disabled = disabled;
    $('speak-task-sentence').disabled = disabled || !pageStates[pageIndex]?.unlocked;
  }

  function renderWordTask(page, state) {
    const targets = page.focusWords.map(word => ({ word, start: lastWordIndex(page.sentence, word) })).sort((a, b) => a.start - b.start);
    activeSlots = targets.map(target => target.word);
    if (activeSlot < 0 || activeSlot >= activeSlots.length || state.answers[activeSlot]) {
      activeSlot = state.answers.findIndex(value => !value);
      if (activeSlot < 0) activeSlot = 0;
    }
    const pieces = [];
    let cursor = 0;
    targets.forEach((target, index) => {
      pieces.push(document.createTextNode(page.sentence.slice(cursor, target.start)));
      const slot = document.createElement('button');
      slot.type = 'button'; slot.className = 'word-slot'; slot.dataset.slot = String(index);
      slot.textContent = state.answers[index] || '____';
      slot.setAttribute('aria-label', state.answers[index] ? `Blank ${index + 1}: ${state.answers[index]}, tap to remove` : `Word blank ${index + 1}`);
      slot.disabled = !state.unlocked || state.solved || state.audioLocked;
      slot.addEventListener('click', () => {
        if (state.solved || !state.unlocked) return;
        if (state.answers[index]) state.answers[index] = '';
        activeSlot = index; renderWordTask(page, state);
      });
      pieces.push(slot);
      cursor = target.start + target.word.length;
    });
    pieces.push(document.createTextNode(page.sentence.slice(cursor)));
    $('task-sentence').replaceChildren(...pieces);
    $('speak-task-sentence').disabled = !state.unlocked || state.audioLocked || state.speechSequenceActive;
    const distractors = (page.distractors || []).slice(0, 2);
    if (!state.wordPool) {
      state.wordPool = shuffle([...new Set([...activeSlots, ...distractors])]);
    }
    const pool = state.wordPool;
    const bank = $('word-bank'); bank.replaceChildren();
    pool.forEach(word => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'word-choice'; button.textContent = word;
      button.disabled = !state.unlocked || state.solved || state.audioLocked || state.answers.includes(word);
      button.setAttribute('aria-pressed', String(state.answers.includes(word)));
      button.addEventListener('click', () => {
        if (button.disabled) return;
        let index = activeSlot;
        if (state.answers[index]) index = state.answers.findIndex(value => !value);
        if (index < 0) return;
        speakStory(word);
        state.answers[index] = word;
        activeSlot = state.answers.findIndex(value => !value);
        if (activeSlot < 0) activeSlot = index;
        renderWordTask(page, state);
      });
      bank.append(button);
    });
    $('submit-page').disabled = !state.unlocked || state.solved || state.audioLocked || state.answers.some(answer => !answer);
    $('reset-page').disabled = !state.unlocked || state.solved || state.audioLocked;
    $('task-instruction').textContent = state.unlocked
      ? 'The word bank has two extra words. Tap a blank, then a word.'
      : 'Tap Listen first. If it cannot play, a parent can read the page.';
  }
  $('reset-page').addEventListener('click', () => {
    const state = pageStates[pageIndex];
    if (!state?.unlocked || state.solved) return;
    state.answers = Array(activeSlots.length).fill(''); activeSlot = 0;
    $('task-feedback').textContent = ''; $('task-feedback').classList.remove('success');
    renderWordTask(current.pages[pageIndex], state);
  });
  $('submit-page').addEventListener('click', () => {
    const page = current?.pages[pageIndex], state = pageStates[pageIndex];
    if (!page || !state.unlocked || state.solved || state.answers.some(answer => !answer)) return;
    const expected = [...page.focusWords].sort((a, b) => lastWordIndex(page.sentence, a) - lastWordIndex(page.sentence, b));
    if (state.answers.every((answer, index) => answer === expected[index])) {
      state.solved = true;
      state.speechSequenceActive = true;
      $('task-feedback').textContent = 'Yes! Listening to the full sentence…';
      $('task-feedback').classList.add('success');
      $('next-page').disabled = true;
      setSolvedSpeechControls(true);
      renderWordTask(page, state);
      const celebration = $('answer-celebration');
      celebration.classList.remove('hidden');
      celebration.classList.remove('play');
      void celebration.offsetWidth;
      celebration.classList.add('play');
      const finishSolvedSpeech = () => {
        state.speechSequenceActive = false;
        setSolvedSpeechControls(false);
        renderWordTask(page, state);
        $('next-page').disabled = false;
      };
      const sentenceRead = speakStory(page.sentence, {
        onEnd: () => {
          $('task-feedback').textContent = 'Great job! You finished this page.';
          const praiseRead = speakStory('Great job!', { onEnd: finishSolvedSpeech, onError: finishSolvedSpeech });
          if (!praiseRead) finishSolvedSpeech();
        },
        onError: finishSolvedSpeech
      });
      if (!sentenceRead) {
        $('task-feedback').textContent = 'Great job! You finished this page.';
        finishSolvedSpeech();
      }
    } else {
      $('task-feedback').textContent = 'Look at the sentence again, then try the words one more time.';
      $('task-feedback').classList.remove('success');
    }
  });
  function completeStory() {
    const completed = safeRead(finishedKey);
    if (!completed.includes(current.id)) {
      completed.push(current.id);
      try { localStorage.setItem(finishedKey, JSON.stringify(completed)); } catch { /* Progress still completes for this session. */ }
    }
    refreshStars(); $('activity').classList.add('hidden'); $('completion').classList.remove('hidden');
    $('completion-summary').textContent = `You finished ${storyHeading(current)} · ${current.pages.length} pages.`;
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    window.KakaCelebrate?.play?.({
      actions: $('next-story'),
      muted: Boolean(window.KakaStorage?.loadState?.()?.muted),
    });
  }
  speech.warmVoices?.();
  speech.warmEnglishVoice?.();
  setReadingChrome(false);
  renderLibrary();
})();

(() => {
  'use strict';
  const allStories = window.FAMILY_STORIES || [];
  const isPlayable = story => !story.hidden && !story.retired;
  const stories = allStories.filter(isPlayable);
  const bookTitles = {rb_anan:'《貪吃的安安》',rb_dongdong:'《冬冬請客》',rb_fenguo:'《分果果》',rb_fengwan:'《風跟我玩》',rb_huangye:'《黃葉》',rb_kuaipao:'《快跑呀》',rb_qiqiu:'《我的氣球呢？》',rb_shuijiao:'《誰在叫？》',rb_xiaoming:'《小明和氣球》',rb_xin:'《信》',rb_yishuhua:'《一束花》',rb_yusan:'《雨傘》'};
  const cast = [
    ['卡卡','4歲・106 cm','短黑髮；黃衣深藍邊','kaka-turnaround.webp'],
    ['禧禧','3歲・約96 cm','圓臉大眼；深藍衣黃衣領','heihei-turnaround.webp'],
    ['虹姑姑','161 cm','身形較高、面尖、長髮','auntie-turnaround.webp'],
    ['蛙蛙','155 cm','禧禧的媽媽；身形較矮、圓臉大眼','wawa-turnaround.webp'],
    ['傑叔叔','170 cm','卡卡的爸爸；深藍外套','jie-turnaround.webp'],
    ['耀叔叔','175 cm','禧禧的爸爸；灰綠外套','yao-turnaround.webp'],
    ['浠榆','初生寶寶','卡卡的妹妹；淡粉色花紋包被','xiyu-turnaround.webp'],
    ['姨媽','約163 cm','虹姑姑的家姐；孔雀綠開襟衫、短黑髮','yima-turnaround.webp'],
    ['爺爺','約165 cm','光頭；米色 polo、卡其長褲','yeye-turnaround.webp']
  ];
  const $ = id => document.getElementById(id);
  const library = $('library'), reader = $('reader');
  const finishedKey = 'kaka-family-storybook-finished-v1';
  const speech = window.KakaSpeech || {};
  const libraryTitle = '卡卡和禧禧一齊玩';
  const heldUtters = [];
  let current = null, pageIndex = 0, pageStates = [], activeUtterance = null, activeSpeechFallback = null, activeSpeechRetry = null, activeSlots = [], activeSlot = 0, warmupState = null, warmupMissTimer = null;
  const safeRead = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const storyHeading = story => {
    const place = String(story?.place || '').trim();
    const title = String(story?.title || '').trim();
    return place ? `${place}：${title}` : title;
  };
  const storyWarmupPairs = story => {
    const pairs = Array.isArray(story?.warmupPairs)
      ? story.warmupPairs.filter(pair => pair && pair.word && pair.image)
      : [];
    return pairs.length ? pairs : null;
  };
  const setReadingChrome = (on, mode = on ? 'reading' : 'library') => {
    const view = mode === 'warmup' ? 'warmup' : on ? 'reading' : 'library';
    $('story-topbar').classList.toggle('is-reading', view === 'reading');
    $('story-topbar').classList.toggle('is-warmup', view === 'warmup');
    document.querySelector('.storybook-shell')?.classList.toggle('is-reading', view === 'reading');
    document.querySelector('.storybook-shell')?.classList.toggle('is-warmup', view === 'warmup');
    $('brand-title').textContent = view !== 'library' && current ? storyHeading(current) : libraryTitle;
    const back = $('back-chinese');
    if (back) back.setAttribute('href', view === 'library' ? 'index.html#screen-topics' : '#library');
    if (view === 'warmup') $('page-count').textContent = '圖字熱身';
  };
  const isMuted = () => Boolean(window.KakaStorage?.loadState?.()?.muted);
  function speakPlacedChip(word, correct) {
    speech.unlockSpeech?.();
    speech.warmAudio?.();
    const muted = isMuted();
    if (correct && speech.speakThen && speech.playCorrectCue) {
      speech.speakThen(word, { muted, lang: 'zh-HK' }, () => speech.playCorrectCue({ muted }));
      return;
    }
    if (speech.speakTerm) {
      speech.speakTerm(word, { muted, lang: 'zh-HK' });
      return;
    }
    speakStory(word);
  };
  const refreshStars = () => {
    const playableIds = new Set(stories.map(story => story.id));
    const finished = safeRead(finishedKey).filter(id => playableIds.has(id));
    $('star-total').textContent = finished.length;
    const total = $('story-total');
    if (total) total.textContent = stories.length;
  };
  const shuffle = values => [...values].map(value => [Math.random(), value]).sort((a,b) => a[0]-b[0]).map(pair => pair[1]);
  function renderLibrary() {
    $('story-grid').innerHTML = stories.map((story, index) => {
      const done = safeRead(finishedKey).includes(story.id);
      const image = `assets/family-stories/scenes/${story.id}-p01.webp`;
      const hasBookWords = story.bookWords.length > 0;
      const displayedWords = hasBookWords
        ? story.bookWords.slice(0,4)
        : story.pages.flatMap(page => page.focusWords).slice(0,4);
      const wordLabel = hasBookWords ? '讀本詞' : '學習詞語';
      return `<button class="story-card" type="button" data-story="${story.id}" aria-label="開始故事：${story.title}"><img class="story-cover" src="${image}" alt="${story.title}插圖" onerror="this.src='assets/family-stories/characters/family-height-lineup.webp'"><span><strong class="story-title">${String(index+1).padStart(2,'0')}・${story.title} ${done?'<span class="done-tag">★</span>':''}</strong><p>${story.place} · ${story.pages.length}頁</p><p>${story.summary}</p><p class="card-words">${wordLabel}：${displayedWords.join('、')}</p>${story.artNote?`<p class="art-note">${story.artNote}</p>`:''}<p class="card-cta">故事／點這裏開始</p></span></button>`;
    }).join('');
    const castGrid = $('cast-grid');
    if (castGrid) castGrid.innerHTML = cast.map(([name,height,traits,file]) => `<article class="cast-card"><img src="assets/family-stories/characters/${file}" alt="${name}角色三視圖"><div><strong>${name}</strong><p>${height} · ${traits}</p></div></article>`).join('');
    $('story-grid').querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => openStory(button.dataset.story)));
    refreshStars();
  }
  function openStory(id) {
    current = allStories.find(story => story.id === id);
    if (!current || !isPlayable(current)) return;
    pageIndex = 0;
    pageStates = current.pages.map(page => ({ unlocked: false, solved: false, answers: Array(page.focusWords.length).fill('') }));
    library.classList.add('hidden');
    $('completion').classList.add('hidden');
    if (storyWarmupPairs(current)) {
      beginWarmup({ reset: true });
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    showReader();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function showReader() {
    $('warmup')?.classList.add('hidden');
    library.classList.add('hidden');
    reader.classList.remove('hidden');
    setReadingChrome(true, 'reading');
    renderPage();
  }
  function beginWarmup({ reset = true } = {}) {
    const pairs = storyWarmupPairs(current);
    if (!pairs) {
      showReader();
      return;
    }
    if (reset || !warmupState || warmupState.storyId !== current.id) {
      const indexes = pairs.map((_, index) => index);
      warmupState = {
        storyId: current.id,
        pairs,
        imageOrder: shuffle(indexes),
        wordOrder: shuffle([...indexes]),
        matched: new Set(),
        selected: null,
        miss: null,
        done: false
      };
    }
    if (warmupMissTimer) window.clearTimeout(warmupMissTimer);
    warmupMissTimer = null;
    library.classList.add('hidden');
    reader.classList.add('hidden');
    $('warmup').classList.remove('hidden');
    $('warmup-feedback').textContent = '';
    $('warmup-feedback').classList.remove('success');
    setReadingChrome(true, 'warmup');
    renderWarmup();
  }
  function renderWarmup() {
    if (!warmupState) return;
    const { pairs, imageOrder, wordOrder, matched, selected, miss } = warmupState;
    const pictures = $('warmup-pictures');
    const words = $('warmup-words');
    pictures.replaceChildren();
    words.replaceChildren();
    imageOrder.forEach((pairIndex, displayIndex) => {
      const pair = pairs[pairIndex];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'warmup-picture';
      if (selected?.type === 'image' && selected.pairIndex === pairIndex) button.classList.add('is-selected');
      if (matched.has(pairIndex)) button.classList.add('is-matched');
      if (miss && miss.some(item => item.type === 'image' && item.pairIndex === pairIndex)) button.classList.add('is-miss');
      button.disabled = matched.has(pairIndex) || warmupState.done;
      button.setAttribute('aria-label', `故事圖 ${displayIndex + 1}`);
      const image = document.createElement('img');
      image.src = pair.image;
      image.alt = '';
      image.width = 900;
      image.height = 600;
      button.append(image);
      button.addEventListener('click', () => pickWarmup('image', pairIndex));
      pictures.append(button);
    });
    wordOrder.forEach(pairIndex => {
      const pair = pairs[pairIndex];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'warmup-word';
      button.textContent = pair.word;
      if (selected?.type === 'word' && selected.pairIndex === pairIndex) button.classList.add('is-selected');
      if (matched.has(pairIndex)) button.classList.add('is-matched');
      if (miss && miss.some(item => item.type === 'word' && item.pairIndex === pairIndex)) button.classList.add('is-miss');
      button.disabled = matched.has(pairIndex) || warmupState.done;
      button.addEventListener('click', () => pickWarmup('word', pairIndex));
      words.append(button);
    });
    $('warmup-progress').textContent = `已配對 ${matched.size}／${pairs.length}`;
  }
  function pickWarmup(type, pairIndex) {
    if (!warmupState || warmupState.done || warmupState.matched.has(pairIndex)) return;
    const selected = warmupState.selected;
    if (!selected) {
      warmupState.selected = { type, pairIndex };
      warmupState.miss = null;
      renderWarmup();
      return;
    }
    if (selected.type === type) {
      warmupState.selected = selected.pairIndex === pairIndex ? null : { type, pairIndex };
      warmupState.miss = null;
      renderWarmup();
      return;
    }
    if (selected.pairIndex === pairIndex) {
      warmupState.matched.add(pairIndex);
      warmupState.selected = null;
      warmupState.miss = null;
      speakPlacedChip(warmupState.pairs[pairIndex].word, true);
      if (warmupState.matched.size === warmupState.pairs.length) {
        warmupState.done = true;
        $('warmup-feedback').textContent = '配齊喇！而家入故事。';
        $('warmup-feedback').classList.add('success');
        renderWarmup();
        window.setTimeout(() => {
          if (current && warmupState?.done) showReader();
        }, 900);
        return;
      }
      $('warmup-feedback').textContent = '';
      renderWarmup();
      return;
    }
    warmupState.miss = [
      { type: selected.type, pairIndex: selected.pairIndex },
      { type, pairIndex }
    ];
    warmupState.selected = null;
    $('warmup-feedback').textContent = '';
    renderWarmup();
    if (warmupMissTimer) window.clearTimeout(warmupMissTimer);
    warmupMissTimer = window.setTimeout(() => {
      if (!warmupState) return;
      warmupState.miss = null;
      renderWarmup();
    }, 220);
  }
  function leaveWarmup() {
    stopSpeech();
    if (warmupMissTimer) window.clearTimeout(warmupMissTimer);
    warmupMissTimer = null;
    warmupState = null;
    current = null;
    $('warmup').classList.add('hidden');
    $('warmup-feedback').textContent = '';
    $('warmup-feedback').classList.remove('success');
    library.classList.remove('hidden');
    reader.classList.add('hidden');
    setReadingChrome(false, 'library');
    renderLibrary();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function stopSpeech() {
    if (activeSpeechFallback) window.clearTimeout(activeSpeechFallback);
    activeSpeechFallback = null;
    if (activeSpeechRetry) window.clearTimeout(activeSpeechRetry);
    activeSpeechRetry = null;
    speech.cancelAllSpeech?.();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    activeUtterance = null;
  }
  function holdUtter(utter) {
    heldUtters.push(utter);
    const drop = () => {
      const i = heldUtters.indexOf(utter);
      if (i >= 0) heldUtters.splice(i, 1);
    };
    utter.addEventListener('end', drop);
    utter.addEventListener('error', drop);
  }
  function canAttemptSpeech() {
    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  }
  function isCantoneseVoice(voice) {
    const lang = String(voice.lang || '').replaceAll('_', '-').toLowerCase();
    const name = String(voice.name || '');
    return /zh-hk/.test(lang) || /^yue\b/.test(lang) || /cantonese|粵語|粤语|廣東話|广东话|sinji|思睿|曉佳|曉曼/i.test(name);
  }
  function pickStoryVoice() {
    const voices = canAttemptSpeech() ? window.speechSynthesis.getVoices() : [];
    const fromSpeech = speech.currentVoice?.();
    if (fromSpeech && isCantoneseVoice(fromSpeech)) return fromSpeech;
    return voices.find(isCantoneseVoice) || fromSpeech || null;
  }
  function pageReadingText(page) {
    const sentence = String(page.sentence || '').replace(/[。！？]$/, '');
    const dialogue = String(page.dialogue?.text || '').replace(/^「|」$/g, '');
    return `${sentence}。${page.dialogue?.speaker || ''}說：「${dialogue}」`;
  }
  function leaveReader() {
    stopSpeech();
    window.KakaCelebrate?.hide?.();
    $('completion').classList.add('hidden');
    if (current && storyWarmupPairs(current)) {
      reader.classList.add('hidden');
      beginWarmup({ reset: true });
      window.scrollTo({top:0,behavior:'smooth'});
      return;
    }
    current = null;
    reader.classList.add('hidden');
    library.classList.remove('hidden');
    setReadingChrome(false);
    renderLibrary();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function replayCurrentStory() {
    if (!current) return;
    window.KakaCelebrate?.hide?.();
    $('completion').classList.add('hidden');
    openStory(current.id);
  }
  $('next-story').addEventListener('click', leaveReader);
  $('replay-story').addEventListener('click', replayCurrentStory);
  $('back-chinese').addEventListener('click', event => {
    event.preventDefault();
    if ($('story-topbar').classList.contains('is-warmup')) {
      leaveWarmup();
      return;
    }
    if ($('story-topbar').classList.contains('is-reading')) {
      leaveReader();
      return;
    }
    (window.KakaNav || { goBackOr: (href) => { location.assign(href); } }).goBackOr('index.html#screen-topics');
  });
  function renderPage() {
    const page = current.pages[pageIndex], state = pageStates[pageIndex];
    stopSpeech();
    $('page-count').textContent = `第 ${pageIndex+1} / ${current.pages.length} 頁`;
    $('page-progress').style.width = `${((pageIndex+1)/current.pages.length)*100}%`;
    $('scene-image').src = `assets/family-stories/scenes/${current.id}-p${String(pageIndex+1).padStart(2,'0')}.webp`;
    $('scene-image').alt = `${current.title}，第 ${pageIndex+1} 頁`;
    $('scene-image').onerror = () => { $('scene-image').src = 'assets/family-stories/characters/family-height-lineup.webp'; };
    $('scene-caption').textContent = `${current.title}・第 ${pageIndex+1} 頁${current.artNote?`｜${current.artNote}`:''}`;
    $('page-reading').textContent = pageReadingText(page);
    $('audio-feedback').textContent = '';
    $('prev-page').disabled = pageIndex === 0;
    $('next-page').disabled = !state.solved;
    $('next-page').textContent = pageIndex === current.pages.length-1 ? '完成故事 →' : '下一頁 →';
    $('activity').classList.remove('hidden'); $('completion').classList.add('hidden');
    $('answer-celebration').classList.add('hidden');
    $('answer-celebration').classList.remove('play');
    $('task-feedback').textContent = state.solved ? '本頁完成！可以繼續下一頁。' : '';
    $('task-feedback').classList.toggle('success', state.solved);
    $('guardian-unlock').classList.toggle('hidden', state.unlocked || canAttemptSpeech());
    activeSlot = 0;
    renderWordTask(page, state);
  }
  $('prev-page').addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPage(); } });
  $('next-page').addEventListener('click', () => {
    if (!pageStates[pageIndex]?.solved) return;
    if (pageIndex < current.pages.length-1) { pageIndex++; renderPage(); }
    else completeStory();
  });

  function afterPageHeard(unlockedPageIndex) {
    if (!current || !pageStates[unlockedPageIndex]) return;
    const unlockedPage = current.pages[unlockedPageIndex];
    const unlockedState = pageStates[unlockedPageIndex];
    unlockedState.unlocked = true;
    unlockedState.audioLocked = false;
    $('guardian-unlock').classList.add('hidden');
    $('task-feedback').textContent = '聽完了，請把兩個重點詞放回句子。';
    $('speak-sentence').disabled = false;
    renderWordTask(unlockedPage, unlockedState);
  }

  function speakStory(text, { unlockPage = false, onEnd = null, onError = null } = {}) {
    speech.unlockSpeech?.();
    speech.warmAudio?.();
    stopSpeech();
    if (!canAttemptSpeech()) {
      $('audio-feedback').textContent = '此瀏覽器不支援語音合成；可由家長朗讀。';
      $('guardian-unlock').classList.remove('hidden');
      return false;
    }
    const lang = 'zh-HK';
    const startUtterance = (utteranceText) => {
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      const voice = pickStoryVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || lang;
      } else {
        utterance.lang = lang;
      }
      utterance.rate = 0.95;
      holdUtter(utterance);
      return utterance;
    };
    let currentUtter = startUtterance(text);
    activeUtterance = currentUtter;
    let started = false;
    let finished = false;
    const estimatedMs = speech.estimateSpeakMs
      ? speech.estimateSpeakMs(text, { rate: 0.95, delayMs: 80 })
      : Math.max(10000, Math.min(60000, text.length * 600 + 5000));
    const isActive = () => activeUtterance === currentUtter;
    const finish = (ok, event) => {
      if (finished || !isActive()) return;
      finished = true;
      activeUtterance = null;
      if (activeSpeechFallback) window.clearTimeout(activeSpeechFallback);
      if (activeSpeechRetry) window.clearTimeout(activeSpeechRetry);
      activeSpeechFallback = null;
      activeSpeechRetry = null;
      if (ok) {
        $('audio-feedback').textContent = '播放完畢。';
        if (unlockPage && current) afterPageHeard(pageIndex);
        if (typeof onEnd === 'function') onEnd();
      } else {
        $('audio-feedback').textContent = `語音播放失敗${event && event.error ? `（${event.error}）` : ''}。可以再撳喇叭，或由家長朗讀。`;
        if (current && !pageStates[pageIndex]?.unlocked) $('guardian-unlock').classList.remove('hidden');
        if (typeof onError === 'function') onError(event || { error: 'failed' });
      }
    };
    const bindUtter = utter => {
      utter.onstart = () => { started = true; };
      utter.onend = () => finish(true);
      utter.onerror = event => {
        if (event && (event.error === 'interrupted' || event.error === 'canceled')) return;
        finish(false, event);
      };
    };
    bindUtter(currentUtter);
    activeSpeechFallback = window.setTimeout(() => {
      if (!isActive() || finished) return;
      if (started) {
        window.speechSynthesis.cancel();
        $('audio-feedback').textContent = '語音播放時間較長，已停止；可以再按喇叭重播。';
        finish(false, { error: 'timeout' });
        return;
      }
      finish(false, { error: 'silent' });
    }, estimatedMs);
    $('audio-feedback').textContent = '正在用粵語讀本頁……';
    try {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    } catch { /* ignore */ }
    try {
      window.speechSynthesis.speak(currentUtter);
    } catch {
      finish(false, { error: 'speak' });
      return false;
    }
    activeSpeechRetry = window.setTimeout(() => {
      if (finished || started || !isActive()) return;
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) return;
        const retry = startUtterance(text);
        bindUtter(retry);
        currentUtter = retry;
        activeUtterance = retry;
        window.speechSynthesis.speak(retry);
      } catch { /* ignore */ }
      window.setTimeout(() => {
        if (finished || started) return;
        if (current && !pageStates[pageIndex]?.unlocked) $('guardian-unlock').classList.remove('hidden');
        $('audio-feedback').textContent = '未聽到粵語。可以再撳喇叭，或由家長朗讀。';
      }, 1100);
    }, 700);
    return true;
  }
  $('speak-sentence').addEventListener('click', () => {
    if (!current) return;
    speakStory(pageReadingText(current.pages[pageIndex]), {unlockPage:true});
  });
  $('guardian-unlock').addEventListener('click', () => {
    if (!current) return;
    pageStates[pageIndex].unlocked = true;
    $('guardian-unlock').classList.add('hidden');
    $('audio-feedback').textContent = '家長已代為朗讀本頁句子。';
    $('task-feedback').textContent = '現在可以開始填詞。';
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
    const targets = page.focusWords.map(word => ({ word, start: page.sentence.indexOf(word) })).sort((a,b) => a.start-b.start);
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
      slot.textContent = state.answers[index] || '＿＿＿＿';
      slot.setAttribute('aria-label', state.answers[index] ? `空格 ${index+1}：${state.answers[index]}，按一下移除` : `第 ${index+1} 個詞語空格`);
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
    const distractors = (page.distractors || []).slice(0,2);
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
        speakPlacedChip(word, word === activeSlots[index]);
        state.answers[index] = word;
        activeSlot = state.answers.findIndex(value => !value);
        if (activeSlot < 0) activeSlot = index;
        renderWordTask(page, state);
      });
      bank.append(button);
    });
    $('submit-page').disabled = !state.unlocked || state.solved || state.audioLocked || state.answers.some(answer => !answer);
    $('reset-page').disabled = !state.unlocked || state.solved || state.audioLocked;
    $('task-instruction').textContent = state.unlocked ? '詞語池中有兩個干擾詞；按空格再選詞，或直接選詞填入下一格。' : '先按左邊「聽本頁」，聽完句子後再開始；播唔到可以請家長代讀。';
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
    const expected = [...page.focusWords].sort((a,b) => page.sentence.indexOf(a)-page.sentence.indexOf(b));
    if (state.answers.every((answer,index) => answer === expected[index])) {
      state.solved = true;
      state.speechSequenceActive = true;
      $('task-feedback').textContent = '答對了！正在重讀完整句子……';
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
          $('task-feedback').textContent = '你好叻！你已把本頁句子補完整。';
          const praiseRead = speakStory('你好叻！', { onEnd: finishSolvedSpeech, onError: finishSolvedSpeech });
          if (!praiseRead) finishSolvedSpeech();
        },
        onError: finishSolvedSpeech
      });
      if (!sentenceRead) {
        $('task-feedback').textContent = '答對了！你好叻！你已把本頁句子補完整。';
        finishSolvedSpeech();
      }
    } else {
      $('task-feedback').textContent = '再看一次句子中的位置，調整詞語後再提交。';
      $('task-feedback').classList.remove('success');
    }
  });
  function completeStory() {
    const completed = safeRead(finishedKey);
    if (!completed.includes(current.id)) {
      completed.push(current.id);
      try { localStorage.setItem(finishedKey, JSON.stringify(completed)); } catch { /* Progress still completes for this session. */ }
    }
    refreshStars();
    $('activity').classList.add('hidden');
    const completion = $('completion');
    completion.classList.remove('hidden');
    $('completion-summary').textContent = `你完成了《${current.title}》的 ${current.pages.length} 頁，每頁都把重點詞放回句子裏。`;
    window.KakaCelebrate?.play?.({
      root: completion,
      actions: $('story-finish-actions'),
      muted: Boolean(window.KakaStorage?.loadState?.()?.muted),
    });
  }
  function storyIdFromLocation() {
    try {
      const queryId = new URLSearchParams(location.search).get('story');
      if (queryId) return queryId;
    } catch { /* ignore */ }
    const hash = String(location.hash || '').replace(/^#/, '');
    return hash && hash !== 'library' ? hash : '';
  }
  speech.warmVoices?.();
  setReadingChrome(false);
  renderLibrary();
  const bootStory = storyIdFromLocation();
  if (bootStory) openStory(bootStory);
})();

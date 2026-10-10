(() => {
  'use strict';
  const stories = window.FAMILY_STORIES || [];
  const bookTitles = {rb_anan:'《貪吃的安安》',rb_dongdong:'《冬冬請客》',rb_fenguo:'《分果果》',rb_fengwan:'《風跟我玩》',rb_huangye:'《黃葉》',rb_kuaipao:'《快跑呀》',rb_qiqiu:'《我的氣球呢？》',rb_shuijiao:'《誰在叫？》',rb_xiaoming:'《小明和氣球》',rb_xin:'《信》',rb_yishuhua:'《一束花》',rb_yusan:'《雨傘》'};
  const cast = [
    ['卡卡','4歲・106 cm','短黑髮；黃衣深藍邊','kaka-turnaround.webp'],
    ['禧禧','3歲・約96 cm','圓臉大眼；深藍衣黃衣領','heihei-turnaround.webp'],
    ['虹姑姑','161 cm','身形較高、面尖、長髮','auntie-turnaround.webp'],
    ['蛙蛙','155 cm','禧禧的媽媽；身形較矮、圓臉大眼','wawa-turnaround.webp'],
    ['傑叔叔','170 cm','卡卡的爸爸；深藍外套','jie-turnaround.webp'],
    ['耀叔叔','175 cm','禧禧的爸爸；灰綠外套','yao-turnaround.webp'],
    ['浠榆','初生寶寶','卡卡的妹妹；淡粉色花紋包被','xiyu-turnaround.webp'],
    ['妹媽','約163 cm','虹姑姑的家姐；孔雀綠開襟衫、短黑髮','meima-turnaround.webp']
  ];
  const $ = id => document.getElementById(id);
  const library = $('library'), reader = $('reader');
  const finishedKey = 'kaka-family-storybook-finished-v1';
  const voiceKey = 'kaka-family-storybook-mandarin-voice-v1';
  let current = null, pageIndex = 0, pageStates = [], selectedVoice = null, voiceList = [], activeUtterance = null, activeSpeechFallback = null, activeSlots = [], activeSlot = 0;
  const safeRead = key => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } };
  const refreshStars = () => {
    $('star-total').textContent = safeRead(finishedKey).length;
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
      return `<button class="story-card" type="button" data-story="${story.id}" aria-label="開始故事：${story.title}"><img class="story-cover" src="${image}" alt="${story.title}插圖" onerror="this.src='assets/family-stories/characters/family-height-lineup.webp'"><span><strong class="story-title">${String(index+1).padStart(2,'0')}・${story.title} ${done?'<span class="done-tag">★</span>':''}</strong><p>${story.place} · ${story.pages.length}頁</p><p>${story.summary}</p><p class="card-words">${wordLabel}：${displayedWords.join('、')}</p>${story.artNote?`<p class="art-note">${story.artNote}</p>`:''}</span></button>`;
    }).join('');
    const castGrid = $('cast-grid');
    if (castGrid) castGrid.innerHTML = cast.map(([name,height,traits,file]) => `<article class="cast-card"><img src="assets/family-stories/characters/${file}" alt="${name}角色三視圖"><div><strong>${name}</strong><p>${height} · ${traits}</p></div></article>`).join('');
    $('story-grid').querySelectorAll('[data-story]').forEach(button => button.addEventListener('click', () => openStory(button.dataset.story)));
    refreshStars();
  }
  function openStory(id) {
    current = stories.find(story => story.id === id);
    if (!current) return;
    pageIndex = 0;
    pageStates = current.pages.map(page => ({ unlocked: false, solved: false, answers: Array(page.focusWords.length).fill('') }));
    library.classList.add('hidden'); reader.classList.remove('hidden'); $('completion').classList.add('hidden');
    $('story-title').textContent = current.title; $('story-place').textContent = current.place;
    renderPage(); window.scrollTo({top:0,behavior:'smooth'});
  }
  function stopSpeech() {
    if (activeSpeechFallback) window.clearTimeout(activeSpeechFallback);
    activeSpeechFallback = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    activeUtterance = null;
  }
  function pageReadingText(page) {
    const sentence = String(page.sentence || '').replace(/[。！？]$/, '');
    const dialogue = String(page.dialogue?.text || '').replace(/^「|」$/g, '');
    return `${sentence}。${page.dialogue?.speaker || ''}說：「${dialogue}」`;
  }
  function leaveReader() {
    stopSpeech(); reader.classList.add('hidden'); library.classList.remove('hidden'); renderLibrary(); window.scrollTo({top:0,behavior:'smooth'});
  }
  $('back-library').addEventListener('click', leaveReader);
  $('next-story').addEventListener('click', leaveReader);
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
    $('guardian-unlock').classList.toggle('hidden', state.unlocked || hasMandarinVoice());
    activeSlot = 0;
    renderWordTask(page, state);
  }
  $('prev-page').addEventListener('click', () => { if (pageIndex > 0) { pageIndex--; renderPage(); } });
  $('next-page').addEventListener('click', () => {
    if (!pageStates[pageIndex]?.solved) return;
    if (pageIndex < current.pages.length-1) { pageIndex++; renderPage(); }
    else completeStory();
  });

  // Restrict voice choices to explicit Mandarin locale tags. Generic zh and Cantonese locales are excluded.
  function isExplicitMandarin(voice) {
    const lang = String(voice.lang || '').replaceAll('_','-').toLowerCase();
    return /^(cmn)(-|$)/.test(lang) || /^zh-(hans-)?(cn|sg)(-|$)/.test(lang) || /^zh-(hant-)?tw(-|$)/.test(lang);
  }
  function hasMandarinVoice() { return Boolean(selectedVoice && voiceList.includes(selectedVoice)); }
  function refreshVoices() {
    if (!('speechSynthesis' in window)) {
      $('mandarin-voice').innerHTML = '<option value="">此瀏覽器不支援語音合成</option>';
      $('mandarin-voice').disabled = true;
      $('test-voice').disabled = true;
      $('voice-status').textContent = '此瀏覽器不支援語音合成；不會改用其他語言。';
      $('guardian-unlock').classList.remove('hidden');
      return;
    }
    const voices = window.speechSynthesis.getVoices();
    voiceList = voices.filter(isExplicitMandarin);
    const select = $('mandarin-voice'), saved = localStorage.getItem(voiceKey);
    select.innerHTML = '';
    if (!voiceList.length) {
      select.add(new Option('找不到普通話聲線', ''));
      selectedVoice = null;
      $('voice-status').textContent = '未找到明確標示為普通話的聲線；不會退回廣東話或系統預設聲線。可由家長朗讀。';
      $('test-voice').disabled = true;
      if (current) $('guardian-unlock').classList.remove('hidden');
      return;
    }
    voiceList.forEach((voice, index) => select.add(new Option(`${voice.name}（${voice.lang}）`, String(index))));
    const savedIndex = voiceList.findIndex(voice => `${voice.name}|${voice.lang}|${voice.voiceURI}` === saved);
    select.value = String(savedIndex >= 0 ? savedIndex : 0);
    selectedVoice = voiceList[Number(select.value)];
    $('voice-status').textContent = `可選普通話聲線：${voiceList.length} 個。試聽確認合適後再開始。`;
    $('test-voice').disabled = false;
    if (current && !pageStates[pageIndex]?.unlocked) $('guardian-unlock').classList.add('hidden');
  }
  $('mandarin-voice').addEventListener('change', event => {
    selectedVoice = voiceList[Number(event.target.value)] || null;
    if (selectedVoice) localStorage.setItem(voiceKey, `${selectedVoice.name}|${selectedVoice.lang}|${selectedVoice.voiceURI}`);
    $('voice-status').textContent = selectedVoice ? `已選：${selectedVoice.name}（${selectedVoice.lang}）。請先試聽確認。` : '未選擇普通話聲線。';
  });
  if ('speechSynthesis' in window) {
    refreshVoices();
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices);
  } else refreshVoices();

  function speakMandarin(text, { unlockPage = false, test = false, onEnd = null, onError = null } = {}) {
    stopSpeech();
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      $('voice-status').textContent = '此瀏覽器不支援語音合成。';
      $('guardian-unlock').classList.remove('hidden');
      return false;
    }
    if (!hasMandarinVoice()) {
      $('audio-feedback').textContent = '找不到已選的普通話聲線；不會使用系統預設聲線。';
      $('guardian-unlock').classList.remove('hidden');
      return false;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
    utterance.rate = 0.95;
    activeUtterance = utterance;
    activeSpeechFallback = window.setTimeout(() => {
      if (activeUtterance !== utterance) return;
      activeUtterance = null;
      activeSpeechFallback = null;
      window.speechSynthesis.cancel();
      $('audio-feedback').textContent = '語音播放時間較長，已停止；可以再按喇叭重播。';
      if (typeof onError === 'function') onError({ error: 'timeout' });
    }, Math.max(10000, Math.min(60000, text.length * 600 + 5000)));
    $('audio-feedback').textContent = test ? '正在試聽所選聲線……' : '正在播放所選普通話聲線……';
    utterance.onend = () => {
      if (activeUtterance !== utterance) return;
      activeUtterance = null;
      if (activeSpeechFallback) window.clearTimeout(activeSpeechFallback);
      activeSpeechFallback = null;
      $('audio-feedback').textContent = test ? `試聽完成：${selectedVoice.name}（${selectedVoice.lang}）。請確認聽起來是普通話。` : '播放完畢。';
      if (unlockPage && current) {
        const unlockedPageIndex = pageIndex;
        pageStates[unlockedPageIndex].unlocked = true;
        $('guardian-unlock').classList.add('hidden');
        $('task-feedback').textContent = '聽完了，請把兩個重點詞放回句子。';
        renderWordTask(current.pages[unlockedPageIndex], pageStates[unlockedPageIndex]);
        const unlockedPage = current.pages[unlockedPageIndex];
        const unlockedState = pageStates[unlockedPageIndex];
        unlockedState.audioLocked = true;
        $('speak-sentence').disabled = true;
        $('test-voice').disabled = true;
        renderWordTask(unlockedPage, unlockedState);
        const readStarted = speakMandarin(unlockedPage.sentence, {
          onEnd: () => {
            unlockedState.audioLocked = false;
            $('speak-sentence').disabled = false;
            $('test-voice').disabled = !hasMandarinVoice();
            if (current?.pages[pageIndex] === unlockedPage) renderWordTask(unlockedPage, unlockedState);
          },
          onError: () => {
            unlockedState.audioLocked = false;
            $('speak-sentence').disabled = false;
            $('test-voice').disabled = !hasMandarinVoice();
            if (current?.pages[pageIndex] === unlockedPage) renderWordTask(unlockedPage, unlockedState);
          }
        });
        if (!readStarted) {
          unlockedState.audioLocked = false;
          $('speak-sentence').disabled = false;
          $('test-voice').disabled = !hasMandarinVoice();
          renderWordTask(unlockedPage, unlockedState);
        }
      }
      if (typeof onEnd === 'function') onEnd();
    };
    utterance.onerror = event => {
      if (activeUtterance !== utterance) return;
      activeUtterance = null;
      if (activeSpeechFallback) window.clearTimeout(activeSpeechFallback);
      activeSpeechFallback = null;
      $('audio-feedback').textContent = `語音播放失敗（${event.error || '未知錯誤'}）。請試另一個普通話聲線，或由家長朗讀。`;
      $('guardian-unlock').classList.remove('hidden');
      if (typeof onError === 'function') onError(event);
    };
    window.speechSynthesis.speak(utterance);
    return true;
  }
  $('test-voice').addEventListener('click', () => speakMandarin('你好，這是普通話聲線試聽。', {test:true}));
  $('speak-sentence').addEventListener('click', () => {
    if (!current) return;
    const page = current.pages[pageIndex];
    const text = [page.sentence, `${page.dialogue.speaker}說，${page.dialogue.text}`].filter(Boolean).join(' ');
    speakMandarin(text, {unlockPage:true});
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
    speakMandarin(current.pages[pageIndex].sentence);
  });

  function setSolvedSpeechControls(disabled) {
    $('speak-sentence').disabled = disabled;
    $('speak-task-sentence').disabled = disabled || !pageStates[pageIndex]?.unlocked;
    $('test-voice').disabled = disabled || !hasMandarinVoice();
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
    const pool = shuffle([...new Set([...activeSlots, ...distractors])]);
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
        speakMandarin(word);
        state.answers[index] = word;
        activeSlot = state.answers.findIndex(value => !value);
        if (activeSlot < 0) activeSlot = index;
        renderWordTask(page, state);
      });
      bank.append(button);
    });
    $('submit-page').disabled = !state.unlocked || state.solved || state.audioLocked || state.answers.some(answer => !answer);
    $('reset-page').disabled = !state.unlocked || state.solved || state.audioLocked;
    $('task-instruction').textContent = state.unlocked ? '詞語池中有兩個干擾詞；按空格再選詞，或直接選詞填入下一格。' : '先按左邊「聽本頁」，聽完句子後再開始；沒有普通話聲線時可請家長代讀。';
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
      const sentenceRead = speakMandarin(page.sentence, {
        onEnd: () => {
          $('task-feedback').textContent = '你好叻！你已把本頁句子補完整。';
          const praiseRead = speakMandarin('你好叻！', { onEnd: finishSolvedSpeech, onError: finishSolvedSpeech });
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
    refreshStars(); $('activity').classList.add('hidden'); $('completion').classList.remove('hidden');
    $('completion-summary').textContent = `你完成了《${current.title}》的 ${current.pages.length} 頁，每頁都把重點詞放回句子裏。`;
    window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  }
  renderLibrary();
})();

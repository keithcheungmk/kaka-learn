/* 卡卡字母隊 — English Phonics（獨立 IIFE，唔改動 js/app.js 任何內容）
 * Classic script — 冇 ES module，方便 iPad／預覽側欄。
 * 每個小測驗係 10 題回合：答啱先亮一粒星；中途離開可繼續。
 */
(function () {
  if (!window.KakaWords || !window.KakaStorage || !window.KakaSpeech || !window.KakaPhonicsWords) {
    console.error('KakaPhonics: required scripts missing. Check words.js / storage.js / speech.js / phonics-words.js loaded first.');
    return;
  }

  const {
    PHONICS_TOPICS, PHONICS_SOUND_SECTIONS, getPhonicsTopicById,
    phonicsLetterPool, phonicsWordIllustHtml, letterTileHtml, isLetterItem,
  } = window.KakaPhonicsWords;
  const {
    loadState, getActiveProfileId, recordPhonicsSkillResult,
    loadRoundProgress, saveRoundProgress, clearRoundProgress,
  } = window.KakaStorage;
  const {
    warmEnglishVoice,
    speakEnglishTerm,
    speakRetryFeedback,
    playCorrectCue,
    playTryAgainCue,
    estimateSpeakMs,
    warmAudio,
    cancelAllSpeech,
    FEEDBACK_CORRECT_LINES,
  } = window.KakaSpeech;

  let pBusy = false;
  let pActiveTopicId = null;
  let pLearnWords = [];
  let pLearnIndex = 0;
  let pLearnAudioGen = 0;
  let pLearnPassedOnce = false;
  let pSoundMissionIndex = 0;
  let pListenRound = null;
  let pMatchRound = null;
  let pConnectRound = null;
  let pConnectResizeBound = false;
  let pBuildRound = null;
  let pBuildSelectedKey = null;
  let pBuildAudioGen = 0;
  let pBuildPromptTimer = null;
  const PHONICS_ROUND_LENGTH = 10;
  const pRoundStates = Object.create(null);

  /** Cached HTMLAudioElement per grapheme／phoneme. */
  const phonemeAudioByLetter = Object.create(null);
  let activePhonemeAudio = null;
  let phonemeWaitTimer = null;
  /** Bump when replacing phoneme assets so iPad／Safari 唔用舊 cache。 */
  const PHONEME_ASSET_VERSION = '20260916-clean-rime-flow';

  // A rime is a readable word-part rather than a standalone phoneme. Use a
  // clean English voice for it; raw recordings stay in source-materials until clean.
  const CLEAN_RIME_WORDS = new Set(['ice']);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function isMuted() {
    try {
      return !!loadState().muted;
    } catch {
      return false;
    }
  }

  const PHONEME_FILES = new Set([
    ...'abcdefghijklmnoprstuvwxyz',
    'qu', 'ck', 'ff', 'll', 'ss', 'zz', 'ch', 'sh', 'th', 'ng',
    'ai', 'ee', 'igh', 'oa', 'oo-long', 'oo-short', 'ar', 'or', 'ur',
    'ow', 'oi', 'ear', 'air', 'er',
  ]);

  function normalizePhoneme(ch) {
    const s = String(ch || '')
      .trim()
      .toLowerCase();
    return PHONEME_FILES.has(s) ? s : '';
  }

  function stopPhonemeAudio() {
    if (phonemeWaitTimer) {
      clearTimeout(phonemeWaitTimer);
      phonemeWaitTimer = null;
    }
    if (activePhonemeAudio) {
      try {
        activePhonemeAudio.pause();
        activePhonemeAudio.currentTime = 0;
      } catch {
        /* ignore */
      }
      activePhonemeAudio = null;
    }
  }

  /**
   * Play one reviewed phonics sound (not a letter name).
   * Mama's 49 processed clips live in ./assets/phonemes/; browser TTS is never used as a phoneme fallback.
   * @returns {Promise<void>}
   */
  function playLetterSound(letter, { muted = isMuted(), onEnd = null } = {}) {
    const ch = normalizePhoneme(letter);
    const finish = () => {
      if (typeof onEnd === 'function') onEnd();
    };
    if (!ch || muted) {
      finish();
      return Promise.resolve();
    }

    stopPhonemeAudio();
    if (typeof cancelAllSpeech === 'function') cancelAllSpeech();
    else {
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }

    let audio = phonemeAudioByLetter[ch];
    if (!audio) {
      audio = new Audio(`./assets/phonemes/${ch}.mp3?v=${PHONEME_ASSET_VERSION}`);
      audio.preload = 'auto';
      phonemeAudioByLetter[ch] = audio;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      /* ignore */
    }
    activePhonemeAudio = audio;

    return new Promise((resolve) => {
      let settled = false;
      const done = () => {
        if (settled) return;
        settled = true;
        if (activePhonemeAudio === audio) activePhonemeAudio = null;
        finish();
        resolve();
      };
      audio.addEventListener('ended', done, { once: true });
      audio.addEventListener('error', done, { once: true });
      // Safety timeout if ended never fires (some WebViews)
      phonemeWaitTimer = setTimeout(done, 1800);
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Never fall back to a letter name: it teaches a different sound.
          done();
        });
      }
    });
  }

  /** Speak a phonics target: known graphemes → phoneme clip; words → English TTS. */
  function speakPhonicsTarget(word, opts = {}) {
    if (normalizePhoneme(word)) {
      return playLetterSound(word, opts);
    }
    speakEnglishTerm(word, opts);
    return Promise.resolve();
  }

  /** Play a reviewed phoneme, or a cleanly spoken rime such as "ice". */
  function playPhonicsChunk(chunk, { muted = isMuted() } = {}) {
    if (normalizePhoneme(chunk)) return playLetterSound(chunk, { muted });
    const rime = String(chunk || '').trim().toLowerCase();
    if (!CLEAN_RIME_WORDS.has(rime) || muted) return Promise.resolve();
    return speakEnglishAndWait(rime, { muted, rate: 0.82, pitch: 1.05, delayMs: 0 });
  }

  function goHome() {
    if (window.KakaLearn && typeof window.KakaLearn.goHome === 'function') {
      window.KakaLearn.goHome();
      return;
    }
    $$('.screen').forEach((el) => el.classList.remove('active'));
    $('#screen-home')?.classList.add('active');
  }

  function showPScreen(name) {
    const map = {
      topics: '#screen-phonics-topics',
      sounds: '#screen-phonics-sounds',
      collections: '#screen-phonics-collections',
      learn: '#screen-phonics-learn',
      play: '#screen-phonics-play',
      listen: '#screen-phonics-listen',
      match: '#screen-phonics-match',
      connect: '#screen-phonics-connect',
      build: '#screen-phonics-build',
    };
    $$('.screen').forEach((el) => el.classList.remove('active'));
    const el = $(map[name]);
    el?.classList.add('active');
    if (['listen', 'match', 'connect', 'build'].includes(name)) {
      window.KakaStarFx?.mountPlayScreen?.(el);
    } else {
      window.KakaStarFx?.hideRanger?.();
    }
  }

  function reframePhonicsAsEnglish() {
    const topics = $('#screen-phonics-topics');
    const title = topics?.querySelector('.game-header h1');
    const kicker = topics?.querySelector('.phonics-mission-kicker');
    const lead = topics?.querySelector('.section-lead');
    if (title) title.textContent = 'SPACE RANGER ENGLISH';
    if (kicker) kicker.textContent = 'WORD MISSION';
    if (lead) lead.textContent = '揀一個英文主題，先認全字，再聽音砌字！';
    $$('.phonics-screen').forEach((screen) => {
      const label = screen.getAttribute('aria-label');
      if (label) screen.setAttribute('aria-label', label.replace('SPACE RANGER PHONICS', 'SPACE RANGER ENGLISH'));
    });
  }

  function phonicsRoundKey(mode) {
    const profileId = typeof getActiveProfileId === 'function' ? getActiveProfileId() : 'kaka';
    return `${profileId}|phonics|${mode}|${pActiveTopicId || 'none'}|${pSoundMissionIndex || 0}`;
  }

  function phonicsRoundPlan(pool) {
    // Keep the first pass predictable, then repeat the same small word set as
    // needed. Several early sound groups have fewer than ten items.
    return Array.from({ length: PHONICS_ROUND_LENGTH }, (_, index) => pool[index % pool.length]);
  }

  function ensurePhonicsRound(mode, pool) {
    const key = phonicsRoundKey(mode);
    let state = pRoundStates[mode];
    if (!state || state.key !== key || state.poolIds !== pool.map((word) => word.id).join('|')) {
      const saved = typeof loadRoundProgress === 'function' ? loadRoundProgress(key) : [];
      state = {
        key,
        poolIds: pool.map((word) => word.id).join('|'),
        plan: phonicsRoundPlan(pool),
        completed: Array.isArray(saved) ? saved.slice(0, PHONICS_ROUND_LENGTH) : [],
      };
      pRoundStates[mode] = state;
    }
    return state;
  }

  function renderPhonicsRoundBar(mode, state) {
    const screen = $(`#screen-phonics-${mode}`);
    const header = screen?.querySelector('.game-header');
    if (!screen || !header || !state) return;
    let bar = header.querySelector('.phonics-round-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'star-bar star-bar-compact phonics-round-bar';
      bar.setAttribute('role', 'img');
      bar.innerHTML = '<span class="star-bar-stars"></span><span class="star-bar-hint"></span>';
      header.appendChild(bar);
    }
    const count = Math.min(state.completed.length, PHONICS_ROUND_LENGTH);
    bar.setAttribute('aria-label', `今輪答啱 ${count} 題，共 ${PHONICS_ROUND_LENGTH} 題`);
    const stars = $('.star-bar-stars', bar);
    if (stars) {
      stars.innerHTML = Array.from({ length: PHONICS_ROUND_LENGTH }, (_, index) =>
        `<span class="star-cell${index < count ? ' is-on' : ''}" aria-hidden="true">★</span>`).join('');
    }
    const hint = $('.star-bar-hint', bar);
    if (hint) hint.textContent = `${count}/${PHONICS_ROUND_LENGTH}`;
  }

  function hidePhonicsRoundFinish(mode) {
    $(`#screen-phonics-${mode} .phonics-round-finish`)?.remove();
  }

  function resetPhonicsRound(mode) {
    const state = pRoundStates[mode];
    const key = state?.key || phonicsRoundKey(mode);
    if (typeof clearRoundProgress === 'function') clearRoundProgress(key);
    delete pRoundStates[mode];
    if (mode === 'connect') pConnectRound = null;
    hidePhonicsRoundFinish(mode);
  }

  function showPhonicsRoundFinish(mode) {
    const screen = $(`#screen-phonics-${mode}`);
    if (!screen || screen.querySelector('.phonics-round-finish')) return;
    const topic = getPhonicsTopicById(pActiveTopicId);
    const isBlendFlow = topic?.flow === 'blend';
    const finishText = mode === 'connect'
      ? '10 組圖詞都配對喇！'
      : isBlendFlow ? '10 題都拼好喇！' : '完成 10 題！';
    const finish = document.createElement('div');
    finish.className = 'play-finish phonics-round-finish';
    finish.innerHTML = `
      <div class="play-finish-inner" role="dialog" aria-modal="true" aria-label="小測驗完成">
        <div class="play-finish-star" aria-hidden="true"><img src="./assets/kaka-ranger-celebrate.png" alt=""></div>
        <p>${finishText}你儲滿咗 10 粒星。</p>
        <div class="play-finish-actions">
          <button type="button" class="btn btn-primary" data-phonics-round-again>再玩一輪</button>
          <button type="button" class="btn btn-secondary" data-phonics-round-back>${isBlendFlow ? '返字卡' : '返玩法'}</button>
        </div>
      </div>`;
    finish.querySelector('[data-phonics-round-again]')?.addEventListener('click', () => {
      resetPhonicsRound(mode);
      if (mode === 'listen') startPhonicsListenMode();
      if (mode === 'match') startPhonicsMatchMode();
      if (mode === 'connect') startPhonicsConnectMode();
      if (mode === 'build') startPhonicsBuildMode();
    });
    finish.querySelector('[data-phonics-round-back]')?.addEventListener('click', () => {
      hidePhonicsRoundFinish(mode);
      if (isBlendFlow) openPhonicsLearn(pActiveTopicId, pSoundMissionIndex);
      else openPhonicsPlayPick();
    });
    screen.appendChild(finish);
  }

  function awardPhonicsRoundStar(mode, target, onComplete) {
    const state = pRoundStates[mode];
    if (!state || !target) return;
    const commit = () => {
      const answerIndex = state.completed.length;
      if (answerIndex >= PHONICS_ROUND_LENGTH) return;
      state.completed.push(`${answerIndex}:${target.id}`);
      if (state.completed.length < PHONICS_ROUND_LENGTH && typeof saveRoundProgress === 'function') {
        saveRoundProgress(state.key, state.completed);
      }
      renderPhonicsRoundBar(mode, state);
      const finished = state.completed.length >= PHONICS_ROUND_LENGTH;
      if (finished && typeof clearRoundProgress === 'function') clearRoundProgress(state.key);
      if (typeof onComplete === 'function') onComplete(finished);
    };
    const screen = $(`#screen-phonics-${mode}`);
    if (screen && typeof window.KakaStarFx?.flyStarFromRanger === 'function') {
      window.KakaStarFx.flyStarFromRanger(screen, commit);
    } else {
      commit();
    }
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sampleOthers(pool, targetId, count) {
    const others = shuffle(pool.filter((w) => w.id !== targetId));
    return others.slice(0, count);
  }

  function pickTarget(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pickPraiseLine() {
    const lines = FEEDBACK_CORRECT_LINES || ['好叻！'];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  const PHONICS_BUILD_RETRY_LINES = [
    'Try again!',
    'Almost! Try again.',
    'Good try! Have another go.',
  ];

  function activeLearnerEnglishName() {
    return getActiveProfileId?.() === 'heihei' ? 'Hei Hei' : 'Kaka';
  }

  function pickPhonicsBuildPraise() {
    const name = activeLearnerEnglishName();
    const lines = [
      `Great job, ${name}!`,
      'Well done!',
      'You got it!',
      'Brilliant!',
      'Excellent blending!',
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function pickPhonicsBuildRetry() {
    return PHONICS_BUILD_RETRY_LINES[Math.floor(Math.random() * PHONICS_BUILD_RETRY_LINES.length)];
  }

  function waitMs(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** English TTS with a timeout because iPad Safari does not always fire utterance.onend. */
  function speakEnglishAndWait(text, { muted = isMuted(), delayMs = 80, rate = 0.85, pitch = 1.05 } = {}) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      speakEnglishTerm(text, { muted, delayMs, rate, pitch, onEnd: finish });
      const wait = estimateSpeakMs ? estimateSpeakMs(text, { rate, delayMs }) : 1600;
      setTimeout(finish, wait + 200);
    });
  }

  function speakPhonicsBuildRetry() {
    const line = pickPhonicsBuildRetry();
    const activeRound = pBuildRound;
    pBusy = true;
    playTryAgainCue({ muted: isMuted() });
    speakEnglishTerm(line, { muted: isMuted(), rate: 0.9, pitch: 1.05, delayMs: 120 });
    const duration = isMuted()
      ? 420
      : (estimateSpeakMs ? estimateSpeakMs(line, { rate: 0.9, delayMs: 120 }) : 1800);
    setTimeout(() => {
      if (pBuildRound === activeRound) pBusy = false;
    }, duration);
    return line;
  }

  function recordPhonicsSkill(skill, itemId, correct) {
    if (typeof recordPhonicsSkillResult !== 'function') return;
    try {
      recordPhonicsSkillResult(skill, itemId, correct);
    } catch (err) {
      console.warn('Phonics skill result was not saved', err);
    }
  }

  /**
   * 答啱流程（刻意簡化，避免聲音「撈埋一齊」）：
   * 1) 叮一聲（Web Audio）
   * 2) 只讀英文答案詞（加強 phonics 學習）
   * 3) 粵語鼓勵句只顯示喺畫面，唔出聲——唔好同英文答案搶 TTS 聲道
   * （之前先讀粵語鼓勵再讀英文，喺 iPad 上成日重疊／互相 cancel，聽落好亂）
   * @returns {string} 鼓勵句（畫面顯示用）
   */
  function speakCorrectEnglishOnly(word, muted, onAllDone) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (typeof onAllDone === 'function') onAllDone();
    };
    if (typeof warmAudio === 'function') warmAudio();
    playCorrectCue({ muted });
    const praise = pickPraiseLine();
    if (!word || muted) {
      setTimeout(finish, muted ? 700 : 400);
      return praise;
    }
    // Letters: phoneme MP3; CVC/sight: full English word TTS
    if (normalizePhoneme(word)) {
      setTimeout(() => {
        playLetterSound(word, { muted, onEnd: finish });
      }, 120);
      setTimeout(finish, 2000);
      return praise;
    }
    speakEnglishTerm(word, { muted, delayMs: 120, onEnd: finish });
    const wait = estimateSpeakMs ? estimateSpeakMs(word, { rate: 0.85, delayMs: 120 }) : 1400;
    setTimeout(finish, wait + 200);
    return praise;
  }

  /**
   * 答錯流程：先讀粵語「再試吓」，真正讀完先再讀英文目標詞（雙重保險）。
   * @returns {string} 再試句（畫面顯示用）
   */
  function speakRetryThenEnglish(word, muted, onAllDone) {
    let wordStarted = false;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (typeof onAllDone === 'function') onAllDone();
    };
    const startWord = () => {
      if (wordStarted) return;
      wordStarted = true;
      if (!word) {
        finish();
        return;
      }
      if (normalizePhoneme(word)) {
        playLetterSound(word, { muted, onEnd: finish });
        setTimeout(finish, 2000);
        return;
      }
      speakEnglishTerm(word, { muted, delayMs: 180, onEnd: finish });
      const wordWait = estimateSpeakMs ? estimateSpeakMs(word, { rate: 0.85, delayMs: 180 }) : 1400;
      setTimeout(finish, wordWait + 200);
    };
    playTryAgainCue({ muted });
    const retryLine = speakRetryFeedback({ muted, onEnd: () => setTimeout(startWord, 180) });
    const retryWait = estimateSpeakMs ? estimateSpeakMs(retryLine, { rate: 0.92, delayMs: 220 }) : 1800;
    setTimeout(startWord, retryWait + 200);
    return retryLine;
  }

  function init() {
    try {
      warmEnglishVoice();
      reframePhonicsAsEnglish();
      bindPhonicsHome();
      bindPhonicsTopics();
      bindPhonicsSounds();
      bindPhonicsCollections();
      bindPhonicsLearn();
      bindPhonicsPlayPick();
      bindPhonicsListen();
      bindPhonicsMatch();
      bindPhonicsConnect();
      bindPhonicsBuild();
    } catch (err) {
      console.error('KakaPhonics init failed', err);
    }
  }

  function bindPhonicsHome() {
    const btn = $('#btn-start-phonics');
    if (btn) {
      btn.onclick = (ev) => {
        if (ev) ev.preventDefault();
        openPhonicsTopics();
      };
    }
  }

  function bindPhonicsTopics() {
    const back = $('#btn-back-phonics-topics');
    if (back) back.onclick = () => goHome();
  }

  function openPhonicsTopics() {
    renderPhonicsTopics();
    showPScreen('topics');
  }

  function renderPhonicsTopics() {
    const grids = {
      sight: $('#phonics-sight-grid'),
      phonics: $('#phonics-topic-grid'),
    };
    Object.values(grids).forEach((grid) => { if (grid) grid.innerHTML = ''; });
    const counters = { sight: 0, phonics: 0 };
    PHONICS_TOPICS.forEach((topic) => {
      const track = topic.section === 'sight' ? 'sight' : 'phonics';
      const grid = grids[track];
      if (!grid) return;
      counters[track] += 1;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-card';
      btn.innerHTML = `
        <span class="phonics-mission-number" aria-hidden="true">${track === 'sight' ? 'WORD' : 'MISSION'} ${String(counters[track]).padStart(2, '0')}</span>
        <span class="topic-cover" aria-hidden="true">${topic.cover}</span>
        <span class="topic-title topic-title-zh">${topic.title}</span>
        ${track === 'sight' && topic.titleEn ? `<span class="topic-title topic-title-en term-en">${topic.titleEn}</span>` : ''}
        <span class="topic-blurb term-en">${topic.blurb}</span>
      `;
      btn.onclick = () => topic.soundMissions ? openPhonicsSounds() : topic.collections ? openPhonicsCollections(topic.id) : openPhonicsLearn(topic.id);
      grid.appendChild(btn);
    });
  }

  function bindPhonicsCollections() {
    const back = $('#btn-back-phonics-collections');
    if (back) back.onclick = () => openPhonicsTopics();
  }

  function openPhonicsCollections(topicId) {
    const topic = getPhonicsTopicById(topicId);
    const grid = $('#phonics-collections-grid');
    if (!topic?.collections || !grid) return;
    const title = $('#phonics-collections-title');
    const lead = $('#phonics-collections-lead');
    if (title) title.textContent = topic.title;
    if (lead) lead.textContent = '揀一個節日，先學詞語再拼字';
    grid.innerHTML = '';
    topic.collections.forEach((collection, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-card collection-topic-card';
      btn.innerHTML = `
        <span class="phonics-mission-number" aria-hidden="true">FESTIVAL ${String(index + 1).padStart(2, '0')}</span>
        <span class="topic-cover" aria-hidden="true">${collection.cover}</span>
        <span class="topic-title collection-title topic-title-zh">${collection.title}</span>
        ${collection.titleEn ? `<span class="topic-title collection-title topic-title-en term-en">${collection.titleEn}</span>` : ''}
        <span class="topic-blurb term-en">${collection.blurb}</span>
      `;
      btn.onclick = () => openPhonicsLearn(collection.id);
      grid.appendChild(btn);
    });
    showPScreen('collections');
  }

  function bindPhonicsSounds() {
    const back = $('#btn-back-phonics-sounds');
    if (back) back.onclick = () => openPhonicsTopics();
  }

  function soundDisplay(sound) {
    if (sound === 'oo-long') return { glyph: 'oo', note: '長音' };
    if (sound === 'oo-short') return { glyph: 'oo', note: '短音' };
    if (sound === 'ow-snow') return { glyph: 'ow', note: 'snow 的音' };
    return { glyph: sound, note: '' };
  }

  function openPhonicsSounds() {
    pActiveTopicId = 'letters_rev';
    const container = $('#phonics-sound-section-list');
    if (!container) return;
    const missions = getPhonicsTopicById('letters_rev')?.soundMissions || [];
    container.innerHTML = (PHONICS_SOUND_SECTIONS || []).map((section) => `
      <section class="sound-section-card" aria-labelledby="sound-section-${section.id}">
        <header class="sound-section-heading">
          <div>
            <h2 id="sound-section-${section.id}">${section.title}</h2>
            <p>${section.blurb}</p>
          </div>
          <span>${section.count} 音</span>
        </header>
        <div class="sound-group-list">
          ${section.groups.map((group) => {
            const missionIndex = missions.findIndex((mission) => mission.id === group.id);
            return `<article class="sound-group-row">
              <div class="sound-group-copy">
                <h3>${group.label}</h3>
                <p>Sound Mission ${String(missionIndex + 1).padStart(2, '0')}</p>
              </div>
              <div class="sound-chip-list">
                ${group.sounds.map((sound) => {
                  const display = soundDisplay(sound);
                  return `<button type="button" class="sound-list-chip" data-sound="${sound}" aria-label="播放 ${display.glyph}${display.note ? ` ${display.note}` : ''}">
                    <span class="sound-list-glyph">${display.glyph}</span>
                    ${display.note ? `<small>${display.note}</small>` : ''}
                  </button>`;
                }).join('')}
              </div>
              <div class="sound-group-actions">
                <button type="button" class="btn btn-secondary sound-group-study" data-mission="${missionIndex}">溫習本組</button>
                <button type="button" class="btn btn-ghost sound-group-quiz" data-mission="${missionIndex}">小測驗</button>
              </div>
            </article>`;
          }).join('')}
        </div>
      </section>
    `).join('');

    container.querySelectorAll('.sound-list-chip').forEach((button) => {
      button.addEventListener('click', () => {
        container.querySelectorAll('.sound-list-chip.is-playing').forEach((chip) => chip.classList.remove('is-playing'));
        button.classList.add('is-playing');
        playLetterSound(button.dataset.sound, {
          muted: isMuted(),
          onEnd: () => button.classList.remove('is-playing'),
        });
      });
    });
    container.querySelectorAll('.sound-group-study').forEach((button) => {
      button.addEventListener('click', () => openPhonicsLearn('letters_rev', Number(button.dataset.mission)));
    });
    container.querySelectorAll('.sound-group-quiz').forEach((button) => {
      button.addEventListener('click', () => {
        pSoundMissionIndex = Number(button.dataset.mission) || 0;
        openPhonicsPlayPick();
      });
    });
    showPScreen('sounds');
  }

  function bindPhonicsLearn() {
    const back = $('#btn-back-phonics-learn');
    if (back) back.onclick = () => {
      const topic = getPhonicsTopicById(pActiveTopicId);
      if (pActiveTopicId === 'letters_rev') openPhonicsSounds();
      else if (topic?.parentId) openPhonicsCollections(topic.parentId);
      else openPhonicsTopics();
    };
    const tap = $('#phonics-learn-tap');
    if (tap) tap.onclick = () => speakCurrentPhonicsLearn();
    const prev = $('#btn-phonics-learn-prev');
    const next = $('#btn-phonics-learn-next');
    if (prev) prev.onclick = () => stepPhonicsLearn(-1);
    if (next) next.onclick = () => stepPhonicsLearn(1);
    const play = $('#btn-phonics-learn-play');
    if (play) {
      play.onclick = () => {
        const topic = getPhonicsTopicById(pActiveTopicId);
        if (topic?.flow === 'blend' && topic?.section !== 'sight' && topic?.parentId !== 'hk_festivals') {
          startPhonicsBuildMode();
        } else {
          openPhonicsPlayPick();
        }
      };
    }
  }

  function openPhonicsLearn(topicId, soundMissionIndex = 0) {
    const topic = getPhonicsTopicById(topicId);
    if (!topic) return;
    pActiveTopicId = topicId;
    pSoundMissionIndex = soundMissionIndex;
    pLearnWords = topic.soundMissions?.[pSoundMissionIndex]?.words
      || (topic.flow === 'blend' ? [...topic.words] : shuffle(topic.words));
    pLearnIndex = 0;
    pLearnPassedOnce = false;
    const title = $('#phonics-learn-topic-title');
    if (title) title.textContent = topic.soundMissions
      ? topic.soundMissions[pSoundMissionIndex].label
      : topic.title;
    renderPhonicsLearnCard();
    showPScreen('learn');
  }

  function renderPhonicsLearnCard() {
    const word = pLearnWords[pLearnIndex];
    if (!word) return;
    const illust = $('#phonics-learn-illust');
    const term = $('#phonics-learn-term');
    const lettersRow = $('#phonics-learn-letters');
    const progress = $('#phonics-learn-progress');
    const lead = $('#screen-phonics-learn .section-lead');
    const isLetter = typeof isLetterItem === 'function' ? isLetterItem(word) : word.kind === 'letter';

    if (isLetter) {
      const display = soundDisplay(word.word);
      if (illust) {
        illust.innerHTML = `<span class="letter-tile letter-tile-lg" aria-hidden="true">${letterTileHtml(display.glyph)}</span>`;
      }
      if (term) term.textContent = display.glyph;
      if (lettersRow) lettersRow.innerHTML = '';
      if (lead) lead.textContent = display.note
        ? `先聽 ${display.note}，再玩聽音辨形`
        : '先聽熟每個音，再玩聽音辨形';
    } else {
      if (illust) illust.innerHTML = word.emoji ? phonicsWordIllustHtml(word) : '';
      if (term) term.textContent = word.word;
      if (lettersRow) {
        const soundChunks = word.soundChunks || word.letters;
        lettersRow.innerHTML = soundChunks
          ? soundChunks
              .map((ch, index) => {
                const divider = word.wordBreaks?.includes(index) ? '<span class="phrase-divider" aria-hidden="true"></span>' : '';
                return `${divider}<button type="button" class="letter-tile" data-letter="${ch}" aria-label="播放 ${ch} 音">${letterTileHtml(ch)}</button>`;
              })
              .join('')
          : '';
        lettersRow.querySelectorAll('.letter-tile').forEach((tile) => {
          tile.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            tile.classList.remove('is-energized');
            void tile.offsetWidth;
            tile.classList.add('is-energized');
            setTimeout(() => tile.classList.remove('is-energized'), 520);
            playPhonicsChunk(tile.dataset.letter, { muted: isMuted() });
          });
        });
      }
      if (lead) {
        const topic = getPhonicsTopicById(pActiveTopicId);
        lead.textContent = topic?.flow === 'blend'
          ? (word.soundChunks ? '先聽音塊，再讀完整英文' : '先聽完整英文；再撳下面每個音素')
          : word.letters ? '撳字母聽音' : '撳卡聽英文';
      }
    }
    if (progress) progress.textContent = `${pLearnIndex + 1}/${pLearnWords.length}`;

    const prev = $('#btn-phonics-learn-prev');
    const next = $('#btn-phonics-learn-next');
    const finishRow = $('#phonics-learn-finish-row');
    const play = $('#btn-phonics-learn-play');
    const atEnd = pLearnIndex >= pLearnWords.length - 1;
    if (atEnd) pLearnPassedOnce = true;
    if (prev) {
      prev.disabled = pLearnIndex <= 0;
      prev.textContent = '← 上一張';
    }
    if (next) next.textContent = atEnd ? '再睇一次' : '下一張 →';
    if (finishRow) {
      finishRow.hidden = false;
      finishRow.classList.toggle('is-ready', pLearnPassedOnce);
    }
    if (play) {
      const topic = getPhonicsTopicById(pActiveTopicId);
      play.textContent = topic?.flow === 'blend'
        ? (pLearnPassedOnce ? '學完喇・開始拼字' : '開始拼字')
        : (pLearnPassedOnce ? '學完喇・去玩玩' : '去玩玩');
    }

    const plate = illust?.querySelector('.emoji-plate');
    if (plate) plate.classList.add('emoji-plate-lg');
    const face = illust?.querySelector('.emoji-face');
    if (face) face.classList.add('emoji-face-lg');

    speakCurrentPhonicsLearn();
  }

  async function speakCurrentPhonicsLearn() {
    const word = pLearnWords[pLearnIndex];
    if (!word) return;
    const audioGen = ++pLearnAudioGen;
    const isLetter = typeof isLetterItem === 'function' ? isLetterItem(word) : word.kind === 'letter';
    if (isLetter) {
      playLetterSound(word.word, { muted: isMuted() });
      return;
    }

    // 拼字格保持原來字形；rime 用乾淨英文讀音示範連讀。
    // 例如 rice 的字格是 r-i-c-e，而學習示範讀 r + ice → rice。
    if (Array.isArray(word.soundChunks) && word.soundChunks.length) {
      for (const sound of word.soundChunks) {
        await playPhonicsChunk(sound, { muted: isMuted() });
        if (audioGen !== pLearnAudioGen) return;
        await waitMs(100);
      }
      if (audioGen !== pLearnAudioGen) return;
    }
    speakEnglishTerm(word.word, { muted: isMuted() });
  }

  function stepPhonicsLearn(delta) {
    if (!pLearnWords.length) return;
    if (delta > 0 && pLearnIndex >= pLearnWords.length - 1) {
      pLearnWords = shuffle(pLearnWords);
      pLearnIndex = 0;
    } else {
      pLearnIndex = Math.max(0, Math.min(pLearnWords.length - 1, pLearnIndex + delta));
    }
    renderPhonicsLearnCard();
  }

  function bindPhonicsPlayPick() {
    const back = $('#btn-back-phonics-play');
    if (back) back.onclick = () => openPhonicsLearn(pActiveTopicId, pSoundMissionIndex);
    const listenBtn = $('#btn-phonics-mode-listen');
    const matchBtn = $('#btn-phonics-mode-match');
    const connectBtn = $('#btn-phonics-mode-connect');
    const buildBtn = $('#btn-phonics-mode-build');
    if (listenBtn) listenBtn.onclick = startPhonicsListenMode;
    if (matchBtn) matchBtn.onclick = startPhonicsMatchMode;
    if (connectBtn) connectBtn.onclick = startPhonicsConnectMode;
    if (buildBtn) buildBtn.onclick = startPhonicsBuildMode;
  }

  function openPhonicsPlayPick() {
    const topic = getPhonicsTopicById(pActiveTopicId);
    const title = $('#phonics-play-topic-title');
    if (title) {
      const activeSoundGroup = topic?.soundMissions?.[pSoundMissionIndex];
      title.textContent = activeSoundGroup ? `${activeSoundGroup.label}・小測驗` : topic ? `${topic.title}・去玩玩` : '去玩玩';
    }
    const modes = topic?.section === 'sight' || topic?.parentId === 'hk_festivals'
      ? [...new Set([...(topic?.modes || []), 'connect'])]
      : (topic?.modes || ['listen']);
    const listenBtn = $('#btn-phonics-mode-listen');
    const matchBtn = $('#btn-phonics-mode-match');
    const connectBtn = $('#btn-phonics-mode-connect');
    const buildBtn = $('#btn-phonics-mode-build');
    if (listenBtn) listenBtn.hidden = !modes.includes('listen');
    if (matchBtn) matchBtn.hidden = !modes.includes('match');
    if (connectBtn) connectBtn.hidden = !modes.includes('connect');
    if (buildBtn) buildBtn.hidden = !modes.includes('build');
    showPScreen('play');
  }

  function startPhonicsListenMode(ev) {
    if (ev) ev.preventDefault();
    if (!pActiveTopicId) {
      openPhonicsTopics();
      return;
    }
    showPScreen('listen');
    hidePhonicsRoundFinish('listen');
    startPhonicsListenRound();
  }

  function startPhonicsMatchMode(ev) {
    if (ev) ev.preventDefault();
    if (!pActiveTopicId) {
      openPhonicsTopics();
      return;
    }
    showPScreen('match');
    hidePhonicsRoundFinish('match');
    startPhonicsMatchRound();
  }

  function startPhonicsConnectMode(ev) {
    if (ev) ev.preventDefault();
    if (!pActiveTopicId) {
      openPhonicsTopics();
      return;
    }
    showPScreen('connect');
    hidePhonicsRoundFinish('connect');
    startPhonicsConnectRound();
  }

  function startPhonicsBuildMode(ev) {
    if (ev) ev.preventDefault();
    if (!pActiveTopicId) {
      openPhonicsTopics();
      return;
    }
    const topic = getPhonicsTopicById(pActiveTopicId);
    const isBlendFlow = topic?.flow === 'blend';
    const title = $('#screen-phonics-build .game-header h1');
    const prompt = $('#screen-phonics-build .prompt-box p');
    const back = $('#btn-back-phonics-build');
    const poolLabel = $('#screen-phonics-build .build-pool-wrap .section-label');
    if (title) title.textContent = isBlendFlow && topic ? `${topic.title}・拼字` : '砌一砌';
    if (prompt) prompt.textContent = isBlendFlow ? '睇圖，逐個音砌出英文' : '拖字母入格';
    if (back) back.textContent = isBlendFlow ? '← 字卡' : '← 玩法';
    if (poolLabel) poolLabel.textContent = isBlendFlow ? '音素池' : '字母池';
    showPScreen('build');
    hidePhonicsRoundFinish('build');
    startPhonicsBuildRound();
  }

  function currentTopicWords() {
    const topic = getPhonicsTopicById(pActiveTopicId);
    if (!topic) return [];
    return topic.soundMissions?.[pSoundMissionIndex]?.words || topic.words;
  }

  /* ---------- 模式 A：聽一聽・揀圖(冇圖嘅 sight word 就揀字) ---------- */

  function bindPhonicsListen() {
    const speak = $('#btn-phonics-speak-listen');
    if (speak) {
      speak.onclick = () => {
        if (!pListenRound) return;
        speakPhonicsTarget(pListenRound.target.word, { muted: isMuted() });
      };
    }
    const back = $('#btn-back-phonics-listen');
    if (back) back.onclick = () => openPhonicsPlayPick();
  }

  function startPhonicsListenRound() {
    pBusy = false;
    const pool = currentTopicWords();
    if (pool.length < 2) return;
    const state = ensurePhonicsRound('listen', pool);
    if (state.completed.length >= PHONICS_ROUND_LENGTH) {
      showPhonicsRoundFinish('listen');
      return;
    }
    renderPhonicsRoundBar('listen', state);
    const target = state.plan[state.completed.length];
    const optionCount = Math.min(4, pool.length);
    const options = shuffle([target, ...sampleOthers(pool, target.id, optionCount - 1)]);
    pListenRound = { target, options };
    const isLetter = typeof isLetterItem === 'function' ? isLetterItem(target) : target.kind === 'letter';

    const prompt = $('#screen-phonics-listen .prompt-box p');
    if (prompt) {
      prompt.innerHTML = isLetter
        ? '聽下，揀啱嘅字母音'
        : target.emoji
          ? '聽下，揀幅圖'
          : '聽下，揀個字';
    }

    const fb = $('#phonics-listen-feedback');
    if (fb) {
      fb.textContent = '';
      fb.className = 'feedback';
    }

    const grid = $('#phonics-listen-options');
    if (grid) {
      grid.innerHTML = '';
      options.forEach((word) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const itemIsLetter = typeof isLetterItem === 'function' ? isLetterItem(word) : word.kind === 'letter';
        if (itemIsLetter) {
          btn.className = 'word-card word-card-letter';
          btn.innerHTML = `<span class="letter-tile letter-tile-card">${letterTileHtml(word.word)}</span>`;
        } else if (word.emoji) {
          btn.className = 'word-card';
          btn.innerHTML = `<span class="illust">${phonicsWordIllustHtml(word)}</span>`;
        } else {
          btn.className = 'word-card word-card-chars';
          btn.innerHTML = `<span class="term term-only term-en">${word.word}</span>`;
        }
        btn.dataset.id = word.id;
        btn.setAttribute('aria-label', word.word);
        btn.addEventListener('click', () => onPhonicsListenPick(word.id, btn));
        grid.appendChild(btn);
      });
    }

    setTimeout(() => speakPhonicsTarget(target.word, { muted: isMuted() }), 280);
  }

  function onPhonicsListenPick(id, btn) {
    if (pBusy || !pListenRound) return;
    const correct = id === pListenRound.target.id;
    const targetWord = pListenRound.target.word;
    const isLetter = typeof isLetterItem === 'function' ? isLetterItem(pListenRound.target) : pListenRound.target.kind === 'letter';
    const fb = $('#phonics-listen-feedback');

    if (isLetter) recordPhonicsSkill('recognition', targetWord, correct);

    if (correct) {
      pBusy = true;
      btn.classList.add('correct');
      const praise = speakCorrectEnglishOnly(targetWord, isMuted(), () => {
        if (!$('#screen-phonics-listen')?.classList.contains('active')) return;
        awardPhonicsRoundStar('listen', pListenRound.target, (finished) => {
          if (finished) showPhonicsRoundFinish('listen');
          else setTimeout(() => startPhonicsListenRound(), 450);
        });
      });
      if (fb) {
        fb.textContent = praise;
        fb.className = 'feedback ok';
      }
    } else {
      btn.classList.add('wrong');
      setTimeout(() => btn.classList.remove('wrong'), 450);
      const retryLine = speakRetryThenEnglish(targetWord, isMuted());
      if (fb) {
        fb.textContent = retryLine;
        fb.className = 'feedback retry';
      }
    }
  }

  /* ---------- 模式 B：配一配 ---------- */

  function bindPhonicsMatch() {
    const back = $('#btn-back-phonics-match');
    if (back) back.onclick = () => openPhonicsPlayPick();
  }

  function startPhonicsMatchRound() {
    pBusy = false;
    const pool = currentTopicWords().filter((w) => w.emoji);
    if (pool.length < 2) return;
    const state = ensurePhonicsRound('match', pool);
    if (state.completed.length >= PHONICS_ROUND_LENGTH) {
      showPhonicsRoundFinish('match');
      return;
    }
    renderPhonicsRoundBar('match', state);
    const target = state.plan[state.completed.length];
    const optionCount = Math.min(4, pool.length);
    const options = shuffle([target, ...sampleOthers(pool, target.id, optionCount - 1)]);
    pMatchRound = { target, options };

    const fb = $('#phonics-match-feedback');
    if (fb) {
      fb.textContent = '';
      fb.className = 'feedback';
    }

    const stage = $('#phonics-match-stage');
    if (stage) {
      stage.innerHTML = phonicsWordIllustHtml(target);
      stage.querySelector('.emoji-plate')?.classList.add('emoji-plate-lg');
      stage.querySelector('.emoji-face')?.classList.add('emoji-face-lg');
    }

    const grid = $('#phonics-match-options');
    if (grid) {
      grid.innerHTML = '';
      options.forEach((word) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'word-card word-card-chars';
        btn.dataset.id = word.id;
        btn.innerHTML = `<span class="term term-only term-en">${word.word}</span>`;
        btn.setAttribute('aria-label', word.word);
        btn.addEventListener('click', () => onPhonicsMatchPick(word.id, btn));
        grid.appendChild(btn);
      });
    }
  }

  function onPhonicsMatchPick(id, btn) {
    if (pBusy || !pMatchRound) return;
    const correct = id === pMatchRound.target.id;
    const targetWord = pMatchRound.target.word;
    const fb = $('#phonics-match-feedback');

    if (Array.isArray(pMatchRound.target.letters) && pMatchRound.target.letters.length > 0) {
      recordPhonicsSkill('blending', pMatchRound.target.id, correct);
    }

    if (correct) {
      pBusy = true;
      btn.classList.add('correct');
      const praise = speakCorrectEnglishOnly(targetWord, isMuted(), () => {
        if (!$('#screen-phonics-match')?.classList.contains('active')) return;
        awardPhonicsRoundStar('match', pMatchRound.target, (finished) => {
          if (finished) showPhonicsRoundFinish('match');
          else setTimeout(() => startPhonicsMatchRound(), 450);
        });
      });
      if (fb) {
        fb.textContent = praise;
        fb.className = 'feedback ok';
      }
    } else {
      btn.classList.add('wrong');
      setTimeout(() => btn.classList.remove('wrong'), 450);
      const retryLine = speakRetryThenEnglish(targetWord, isMuted());
      if (fb) {
        fb.textContent = retryLine;
        fb.className = 'feedback retry';
      }
    }
  }

  /* ---------- 模式 C：連一連・圖詞配對（Sight Words） ---------- */

  function bindPhonicsConnect() {
    const back = $('#btn-back-phonics-connect');
    if (back) back.onclick = () => {
      pBusy = false;
      pConnectRound = null;
      if (typeof cancelAllSpeech === 'function') cancelAllSpeech();
      openPhonicsPlayPick();
    };
    if (!pConnectResizeBound) {
      window.addEventListener('resize', () => {
        if ($('#screen-phonics-connect')?.classList.contains('active')) drawPhonicsConnectLines();
      });
      pConnectResizeBound = true;
    }
  }

  function connectCardById(selector, id) {
    const board = $('#phonics-connect-board');
    if (!board) return null;
    return [...board.querySelectorAll(selector)].find((el) => el.dataset.id === id) || null;
  }

  function renderPhonicsConnectSelection() {
    const round = pConnectRound;
    if (!round) return;
    $('#phonics-connect-pictures')?.querySelectorAll('[data-id]').forEach((el) => {
      const matched = round.matchedIds.has(el.dataset.id);
      el.classList.toggle('is-selected', el.dataset.id === round.selectedPictureId && !matched);
      el.classList.toggle('is-matched', matched);
    });
    $('#phonics-connect-words')?.querySelectorAll('[data-id]').forEach((el) => {
      const matched = round.matchedIds.has(el.dataset.id);
      el.classList.toggle('is-selected', el.dataset.id === round.selectedWordId && !matched);
      el.classList.toggle('is-matched', matched);
    });
  }

  function drawPhonicsConnectLines() {
    const board = $('#phonics-connect-board');
    const svg = $('#phonics-connect-lines');
    if (!board || !svg || !pConnectRound || window.matchMedia('(max-width: 640px)').matches) {
      if (svg) svg.innerHTML = '';
      return;
    }
    const boardRect = board.getBoundingClientRect();
    const width = Math.max(1, boardRect.width);
    const height = Math.max(1, boardRect.height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const lines = [];
    pConnectRound.matchedIds.forEach((id) => {
      const picture = connectCardById('.connect-picture-main', id);
      const word = connectCardById('.connect-word-card', id);
      if (!picture || !word) return;
      const pictureRect = picture.getBoundingClientRect();
      const wordRect = word.getBoundingClientRect();
      const x1 = pictureRect.right - boardRect.left;
      const y1 = pictureRect.top + pictureRect.height / 2 - boardRect.top;
      const x2 = wordRect.left - boardRect.left;
      const y2 = wordRect.top + wordRect.height / 2 - boardRect.top;
      lines.push(`<line class="connect-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>`);
    });
    svg.innerHTML = lines.join('');
  }

  function renderPhonicsConnectBoard() {
    const round = pConnectRound;
    const pictureBox = $('#phonics-connect-pictures');
    const wordBox = $('#phonics-connect-words');
    if (!round || !pictureBox || !wordBox) return;
    pictureBox.innerHTML = '';
    wordBox.innerHTML = '';
    const pictures = shuffle(round.board);
    const words = shuffle(round.board);

    pictures.forEach((item) => {
      const matched = round.matchedIds.has(item.id);
      const article = document.createElement('article');
      article.className = 'connect-item';
      const picture = document.createElement('button');
      picture.type = 'button';
      picture.className = 'connect-picture-main';
      picture.dataset.id = item.id;
      picture.setAttribute('aria-label', `圖片：${item.word}`);
      picture.disabled = matched;
      picture.innerHTML = phonicsWordIllustHtml(item);
      picture.addEventListener('click', () => onPhonicsConnectPicture(item.id));

      const audio = document.createElement('button');
      audio.type = 'button';
      audio.className = 'connect-audio';
      audio.setAttribute('aria-label', `聽 ${item.word}`);
      audio.textContent = '🔊';
      audio.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        speakEnglishTerm(item.word, { muted: isMuted(), delayMs: 0, rate: 0.86, pitch: 1.05 });
      });

      article.append(picture, audio);
      pictureBox.appendChild(article);
    });

    words.forEach((item) => {
      const word = document.createElement('button');
      word.type = 'button';
      word.className = 'connect-word-card';
      word.dataset.id = item.id;
      word.textContent = item.word;
      word.setAttribute('aria-label', `英文：${item.word}`);
      word.disabled = round.matchedIds.has(item.id);
      word.addEventListener('click', () => onPhonicsConnectWord(item.id));
      wordBox.appendChild(word);
    });
    renderPhonicsConnectSelection();
    requestAnimationFrame(drawPhonicsConnectLines);
  }

  function startPhonicsConnectRound() {
    pBusy = false;
    const pool = currentTopicWords().filter((word) => word.emoji);
    if (pool.length < 2) return;
    const state = ensurePhonicsRound('connect', pool);
    if (state.completed.length >= PHONICS_ROUND_LENGTH) {
      showPhonicsRoundFinish('connect');
      return;
    }
    renderPhonicsRoundBar('connect', state);
    const answerIndex = state.completed.length;
    const target = state.plan[answerIndex];
    if (!pConnectRound || pConnectRound.stateKey !== state.key || pConnectRound.answerIndex !== answerIndex) {
      pConnectRound = {
        stateKey: state.key,
        answerIndex,
        board: shuffle([target, ...sampleOthers(pool, target.id, 4)]),
        matchedIds: new Set(),
        selectedPictureId: null,
        selectedWordId: null,
      };
    }
    const fb = $('#phonics-connect-feedback');
    if (fb) {
      fb.textContent = `配對 ${pConnectRound.matchedIds.size}/${pConnectRound.board.length}`;
      fb.className = 'feedback';
    }
    renderPhonicsConnectBoard();
  }

  function onPhonicsConnectPicture(id) {
    if (pBusy || !pConnectRound || pConnectRound.matchedIds.has(id)) return;
    pConnectRound.selectedPictureId = pConnectRound.selectedPictureId === id ? null : id;
    renderPhonicsConnectSelection();
    if (pConnectRound.selectedPictureId && pConnectRound.selectedWordId) attemptPhonicsConnectPair();
  }

  function onPhonicsConnectWord(id) {
    if (pBusy || !pConnectRound || pConnectRound.matchedIds.has(id)) return;
    pConnectRound.selectedWordId = pConnectRound.selectedWordId === id ? null : id;
    renderPhonicsConnectSelection();
    if (pConnectRound.selectedPictureId && pConnectRound.selectedWordId) attemptPhonicsConnectPair();
  }

  function attemptPhonicsConnectPair() {
    if (pBusy || !pConnectRound) return;
    const pictureId = pConnectRound.selectedPictureId;
    const wordId = pConnectRound.selectedWordId;
    if (!pictureId || !wordId) return;
    const item = pConnectRound.board.find((word) => word.id === pictureId);
    const correct = pictureId === wordId;
    const picture = connectCardById('.connect-picture-main', pictureId);
    const word = connectCardById('.connect-word-card', wordId);
    const fb = $('#phonics-connect-feedback');

    if (correct && item) {
      pBusy = true;
      pConnectRound.matchedIds.add(item.id);
      pConnectRound.selectedPictureId = null;
      pConnectRound.selectedWordId = null;
      picture?.classList.add('is-matched');
      word?.classList.add('is-matched');
      renderPhonicsConnectSelection();
      drawPhonicsConnectLines();
      recordPhonicsSkill('recognition', item.id, true);
      if (fb) {
        fb.textContent = 'Great job!';
        fb.className = 'feedback ok';
      }
      speakCorrectEnglishOnly(item.word, isMuted(), () => {
        if (!$('#screen-phonics-connect')?.classList.contains('active')) return;
        awardPhonicsRoundStar('connect', item, (finished) => {
          if (finished) {
            showPhonicsRoundFinish('connect');
            return;
          }
          if (pConnectRound && pConnectRound.matchedIds.size >= pConnectRound.board.length) {
            pConnectRound = null;
            setTimeout(() => startPhonicsConnectRound(), 450);
          } else {
            pBusy = false;
            if (pConnectRound && fb) fb.textContent = `配對 ${pConnectRound.matchedIds.size}/${pConnectRound.board.length}`;
          }
        });
      });
      return;
    }

    pBusy = true;
    picture?.classList.add('is-wrong');
    word?.classList.add('is-wrong');
    pConnectRound.selectedPictureId = null;
    pConnectRound.selectedWordId = null;
    renderPhonicsConnectSelection();
    setTimeout(() => {
      picture?.classList.remove('is-wrong');
      word?.classList.remove('is-wrong');
    }, 500);
    const retryLine = speakRetryThenEnglish(item?.word || '', isMuted(), () => {
      if (pConnectRound) pBusy = false;
    });
    if (fb) {
      fb.textContent = retryLine;
      fb.className = 'feedback retry';
    }
  }

  /* ---------- 模式 C：砌一砌(拖／撳字母按順序) ---------- */

  function makePhonicsBuildTiles(target, topic) {
    const needed = target.letters;
    const tiles = needed.map((ch, i) => ({ key: `need-${i}-${ch}`, char: ch }));
    const allLetters = phonicsLetterPool(topic);
    const distractors = shuffle(allLetters.filter((ch) => !needed.includes(ch)));
    const cap = Math.min(8, allLetters.length);
    for (const ch of distractors) {
      if (tiles.length >= cap) break;
      tiles.push({ key: `d-${tiles.length}-${ch}`, char: ch });
    }
    return shuffle(tiles);
  }

  function bindPhonicsBuild() {
    const back = $('#btn-back-phonics-build');
    if (back) back.onclick = () => {
      pBuildAudioGen += 1;
      if (pBuildPromptTimer) clearTimeout(pBuildPromptTimer);
      pBuildPromptTimer = null;
      stopPhonemeAudio();
      if (typeof cancelAllSpeech === 'function') cancelAllSpeech();
      const topic = getPhonicsTopicById(pActiveTopicId);
      if (topic?.flow === 'blend') openPhonicsLearn(pActiveTopicId, pSoundMissionIndex);
      else openPhonicsPlayPick();
    };
  }

  function startPhonicsBuildRound() {
    if (pBuildPromptTimer) clearTimeout(pBuildPromptTimer);
    pBuildPromptTimer = null;
    const audioGen = ++pBuildAudioGen;
    stopPhonemeAudio();
    if (typeof cancelAllSpeech === 'function') cancelAllSpeech();
    pBusy = false;
    pBuildSelectedKey = null;
    const topic = getPhonicsTopicById(pActiveTopicId);
    const pool = currentTopicWords().filter((w) => w.letters);
    if (pool.length < 1) return;
    const state = ensurePhonicsRound('build', pool);
    if (state.completed.length >= PHONICS_ROUND_LENGTH) {
      showPhonicsRoundFinish('build');
      return;
    }
    renderPhonicsRoundBar('build', state);
    const target = state.plan[state.completed.length];
    const chars = target.letters;
    const tiles = makePhonicsBuildTiles(target, topic);
    pBuildRound = {
      target,
      chars,
      filled: chars.map(() => null),
      tiles,
      isComplete: false,
      autoPlacedIndex: -1,
    };

    const fb = $('#phonics-build-feedback');
    if (fb) {
      fb.textContent = '';
      fb.className = 'feedback';
    }

    const stage = $('#phonics-build-stage');
    if (stage) {
      stage.innerHTML = phonicsWordIllustHtml(target);
      stage.querySelector('.emoji-plate')?.classList.add('emoji-plate-lg');
      stage.querySelector('.emoji-face')?.classList.add('emoji-face-lg');
    }

    renderPhonicsBuildSlots();
    renderPhonicsBuildPool();

    // First model the complete word. The generation guard prevents a stale
    // delayed prompt from speaking after the child has already moved on.
    pBuildPromptTimer = setTimeout(() => {
      pBuildPromptTimer = null;
      if (audioGen !== pBuildAudioGen || pBuildRound?.target.id !== target.id) return;
      speakEnglishTerm(target.word, { muted: isMuted(), rate: 0.82, pitch: 1.05, delayMs: 0 });
    }, 400);
  }

  function nextPhonicsBuildIndex() {
    if (!pBuildRound) return -1;
    return pBuildRound.filled.findIndex((x) => !x);
  }

  function renderPhonicsBuildSlots() {
    const box = $('#phonics-build-slots');
    if (!box || !pBuildRound) return;
    const next = nextPhonicsBuildIndex();
    box.innerHTML = '';
    box.classList.toggle('has-long-word', pBuildRound.chars.length > 8);
    pBuildRound.chars.forEach((ch, i) => {
      const filled = pBuildRound.filled[i];
      const blendGroup = pBuildRound.isComplete
        ? pBuildRound.target.blendGroups?.find((group) => i >= group.start && i < group.end)
        : null;
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'build-slot';
      if (filled) slot.classList.add('is-filled');
      if (i === next) slot.classList.add('is-next');
      if (blendGroup) {
        slot.classList.add('is-chunk');
        slot.style.setProperty('--blend-group-color', blendGroup.color);
        slot.setAttribute('aria-label', `${blendGroup.label} 詞塊的第 ${i - blendGroup.start + 1} 個字母 ${filled?.char || ch}`);
      }
      if (i === pBuildRound.autoPlacedIndex) slot.classList.add('is-auto-placed');
      slot.dataset.index = String(i);
      if (!blendGroup) slot.setAttribute('aria-label', filled ? `已放 ${filled.char}` : `第 ${i + 1} 格，提示字形 ${ch}`);
      slot.innerHTML = `
        <span class="build-ghost term-en" aria-hidden="true">${ch}</span>
        ${filled ? `<span class="build-placed letter-tile" aria-hidden="true">${letterTileHtml(filled.char)}</span>` : ''}`;
      slot.addEventListener('click', () => onPhonicsBuildSlotTap(i));
      box.appendChild(slot);
      if (pBuildRound.target.wordBreaks?.includes(i + 1)) {
        const divider = document.createElement('span');
        divider.className = 'build-phrase-divider';
        divider.setAttribute('aria-hidden', 'true');
        box.appendChild(divider);
      }
    });
    renderPhonicsBuildChunks();
  }

  function renderPhonicsBuildChunks(activeGroupIndex = -1) {
    const box = $('#phonics-build-chunks');
    if (!box || !pBuildRound) return;
    const groups = pBuildRound.target.blendGroups || [];
    const showGroups = pBuildRound.isComplete && groups.length > 0;
    box.hidden = !showGroups;
    box.innerHTML = showGroups
      ? groups.map((group, index) => `
        <span class="build-chunk-pill${index === activeGroupIndex ? ' is-active' : ''}" style="--blend-group-color:${group.color}">${group.label}</span>`).join('')
      : '';
  }

  function renderPhonicsBuildPool() {
    const box = $('#phonics-build-pool');
    if (!box || !pBuildRound) return;
    box.innerHTML = '';
    pBuildRound.tiles.forEach((tile) => {
      const used = pBuildRound.filled.some((f) => f && f.key === tile.key);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'build-tile letter-tile';
      if (used) btn.classList.add('is-used');
      if (pBuildSelectedKey === tile.key) btn.classList.add('is-selected');
      btn.dataset.key = tile.key;
      btn.innerHTML = letterTileHtml(tile.char);
      btn.setAttribute('aria-label', `音素 ${tile.char}`);
      if (!used) {
        let suppressClick = false;
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          if (suppressClick) {
            suppressClick = false;
            return;
          }
          onPhonicsBuildTileTap(tile.key);
        });
        btn.addEventListener('pointerdown', (ev) => {
          onPhonicsBuildPointerDown(ev, tile, () => {
            suppressClick = true;
          });
        });
      }
      box.appendChild(btn);
    });
  }

  function onPhonicsBuildTileTap(key) {
    if (pBusy || !pBuildRound) return;
    const used = pBuildRound.filled.some((f) => f && f.key === key);
    if (used) return;
    if (pBuildSelectedKey === key) {
      const next = nextPhonicsBuildIndex();
      if (next >= 0) tryPlacePhonicsBuildChar(key, next, { autoPlace: true });
      return;
    }
    pBuildSelectedKey = key;
    renderPhonicsBuildPool();
    const tile = pBuildRound.tiles.find((item) => item.key === key);
    if (tile) playLetterSound(tile.char, { muted: isMuted() });
    const fb = $('#phonics-build-feedback');
    if (fb) {
      fb.textContent = '再撳同一粒字母，會自動彈入發光格。';
      fb.className = 'feedback';
    }
  }

  function onPhonicsBuildSlotTap(index) {
    if (pBusy || !pBuildRound) return;
    const next = nextPhonicsBuildIndex();
    if (pBuildRound.filled[index]) {
      const lastFilled = [...pBuildRound.filled].map((f, i) => (f ? i : -1)).filter((i) => i >= 0).pop();
      if (lastFilled === index) {
        pBuildRound.filled[index] = null;
        pBuildSelectedKey = null;
        renderPhonicsBuildSlots();
        renderPhonicsBuildPool();
        const fb = $('#phonics-build-feedback');
        if (fb) {
          fb.textContent = '';
          fb.className = 'feedback';
        }
      }
      return;
    }
    if (!pBuildSelectedKey || index !== next) return;
    tryPlacePhonicsBuildChar(pBuildSelectedKey, index);
  }

  function tryPlacePhonicsBuildChar(tileKey, slotIndex, { autoPlace = false } = {}) {
    if (pBusy || !pBuildRound) return false;
    if (pBuildPromptTimer) clearTimeout(pBuildPromptTimer);
    pBuildPromptTimer = null;
    const next = nextPhonicsBuildIndex();
    const tile = pBuildRound.tiles.find((t) => t.key === tileKey);
    if (!tile) return false;
    if (pBuildRound.filled.some((f) => f && f.key === tileKey)) return false;

    const slotEl = $(`#phonics-build-slots .build-slot[data-index="${slotIndex}"]`);

    if (slotIndex !== next) {
      slotEl?.classList.add('is-wrong');
      setTimeout(() => slotEl?.classList.remove('is-wrong'), 450);
      const retryLine = speakPhonicsBuildRetry();
      const fb = $('#phonics-build-feedback');
      if (fb) {
        fb.textContent = retryLine;
        fb.className = 'feedback retry';
      }
      pBuildSelectedKey = null;
      renderPhonicsBuildPool();
      return false;
    }

    const expected = pBuildRound.chars[slotIndex];
    if (tile.char !== expected) {
      recordPhonicsSkill('segmenting', pBuildRound.target.id, false);
      slotEl?.classList.add('is-wrong');
      setTimeout(() => slotEl?.classList.remove('is-wrong'), 450);
      const retryLine = speakPhonicsBuildRetry();
      const fb = $('#phonics-build-feedback');
      if (fb) {
        fb.textContent = retryLine;
        fb.className = 'feedback retry';
      }
      pBuildSelectedKey = null;
      renderPhonicsBuildPool();
      return false;
    }

    pBuildRound.filled[slotIndex] = { key: tile.key, char: tile.char };
    pBuildSelectedKey = null;
    pBuildRound.autoPlacedIndex = autoPlace ? slotIndex : -1;
    if (pBuildRound.filled.every(Boolean)) pBuildRound.isComplete = true;
    renderPhonicsBuildSlots();
    renderPhonicsBuildPool();
    if (autoPlace) {
      const placedRound = pBuildRound;
      setTimeout(() => {
        if (pBuildRound !== placedRound || pBuildRound.autoPlacedIndex !== slotIndex) return;
        pBuildRound.autoPlacedIndex = -1;
        renderPhonicsBuildSlots();
      }, 420);
    }

    // Tap and drag both arrive here, so every correctly placed grapheme gets
    // the same reviewed Mama phoneme recording.
    const placedSound = playLetterSound(tile.char, { muted: isMuted() });
    const placedRound = pBuildRound;

    if (pBuildRound.filled.every(Boolean)) {
      finishPhonicsBuildSuccess(placedSound);
    } else {
      // Let the short sound finish before accepting the next tile, otherwise
      // fast taps would cut off the sound the child is meant to memorise.
      pBusy = true;
      placedSound.then(() => {
        if (pBuildRound === placedRound && !pBuildRound.filled.every(Boolean)) pBusy = false;
      });
      const fb = $('#phonics-build-feedback');
      if (fb) {
        fb.textContent = 'Great! Keep going.';
        fb.className = 'feedback ok';
      }
    }
    return true;
  }

  async function finishPhonicsBuildSuccess(placedSound = Promise.resolve()) {
    if (!pBuildRound) return;
    pBusy = true;
    const audioGen = ++pBuildAudioGen;
    const completedRound = pBuildRound;
    const word = pBuildRound.target.word;
    recordPhonicsSkill('segmenting', pBuildRound.target.id, true);
    const praise = pickPhonicsBuildPraise();
    const fb = $('#phonics-build-feedback');
    if (fb) {
      fb.textContent = praise;
      fb.className = 'feedback ok';
    }

    await placedSound;
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    await waitMs(180);
    const blendGroups = completedRound.target.blendGroups || [];
    if (blendGroups.length) {
      for (let groupIndex = 0; groupIndex < blendGroups.length; groupIndex += 1) {
        if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
        const group = blendGroups[groupIndex];
        const slots = Array.from({ length: group.end - group.start }, (_, offset) => (
          $(`#phonics-build-slots .build-slot[data-index="${group.start + offset}"]`)
        ));
        slots.forEach((slot) => slot?.classList.add('is-blending'));
        renderPhonicsBuildChunks(groupIndex);
        for (const sound of group.sounds) {
          if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
          await playPhonicsChunk(sound, { muted: isMuted() });
          await waitMs(70);
        }
        slots.forEach((slot) => slot?.classList.remove('is-blending'));
      }
      renderPhonicsBuildChunks();
    } else {
      const blendSounds = completedRound.target.soundChunks || completedRound.chars;
      for (let index = 0; index < blendSounds.length; index += 1) {
        if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
        const slot = blendSounds === completedRound.chars
          ? $(`#phonics-build-slots .build-slot[data-index="${index}"]`)
          : null;
        slot?.classList.add('is-blending');
        await playPhonicsChunk(blendSounds[index], { muted: isMuted() });
        slot?.classList.remove('is-blending');
        await waitMs(70);
      }
    }
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    await speakEnglishAndWait(word, { muted: isMuted(), rate: 0.78, pitch: 1.05, delayMs: 0 });
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    await waitMs(180);
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    playCorrectCue({ muted: isMuted() });
    await speakEnglishAndWait(praise, { muted: isMuted(), rate: 0.9, pitch: 1.08, delayMs: 80 });
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    await waitMs(450);
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    awardPhonicsRoundStar('build', completedRound.target, (finished) => {
      if (finished) showPhonicsRoundFinish('build');
      else startPhonicsBuildRound();
    });
  }

  function onPhonicsBuildPointerDown(ev, tile, onDragStarted) {
    if (pBusy || !pBuildRound || ev.button === 2) return;
    const used = pBuildRound.filled.some((f) => f && f.key === tile.key);
    if (used) return;
    const startX = ev.clientX;
    const startY = ev.clientY;
    const btn = ev.currentTarget;
    let moved = false;
    const ghost = document.createElement('div');
    ghost.className = 'build-drag-ghost term-en';
    ghost.textContent = tile.char;

    const onMove = (e) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 10) return;
      if (!moved) {
        moved = true;
        if (typeof onDragStarted === 'function') onDragStarted();
        pBuildSelectedKey = tile.key;
        btn.classList.add('is-dragging');
        btn.classList.add('is-selected');
        document.body.appendChild(ghost);
      }
      ghost.style.left = `${e.clientX}px`;
      ghost.style.top = `${e.clientY}px`;
    };

    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (!moved) return;
      ghost.remove();
      btn.classList.remove('is-dragging');
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const slot = el?.closest?.('.build-slot');
      const idx = slot ? Number(slot.dataset.index) : -1;
      if (idx >= 0) {
        tryPlacePhonicsBuildChar(tile.key, idx);
      } else {
        pBuildSelectedKey = null;
        renderPhonicsBuildPool();
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  document.addEventListener('DOMContentLoaded', init);
})();

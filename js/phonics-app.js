/* 卡卡字母隊 — English Phonics（獨立 IIFE，唔改動 js/app.js 任何內容）
 * Classic script — 冇 ES module，方便 iPad／預覽側欄。
 * Phase 1：keep it simple — 冇星星／PIN，答啱淨係鼓勵 + 自動下一題。
 */
(function () {
  if (!window.KakaWords || !window.KakaStorage || !window.KakaSpeech || !window.KakaPhonicsWords) {
    console.error('KakaPhonics: required scripts missing. Check words.js / storage.js / speech.js / phonics-words.js loaded first.');
    return;
  }

  const {
    PHONICS_TOPICS, PHONICS_SOUND_SECTIONS, PHONICS_STAGES, PHONICS_TRICKY_SETS, PHONICS_VOCAB_SETS,
    getPhonicsTopicById, getPhonicsStageById, wordGraphemes, phonicsLetterPool,
    phonicsWordIllustHtml, letterTileHtml, isLetterItem,
  } = window.KakaPhonicsWords;
  const { loadState, getActiveProfileId, recordPhonicsSkillResult } = window.KakaStorage;
  const {
    warmEnglishVoice,
    speakEnglishTerm,
    speakRetryFeedback,
    playCorrectCue,
    playTryAgainCue,
    estimateSpeakMs,
    warmAudio,
    FEEDBACK_CORRECT_LINES,
  } = window.KakaSpeech;

  let pBusy = false;
  let pActiveTopicId = null;
  let pLearnWords = [];
  let pLearnIndex = 0;
  let pLearnPassedOnce = false;
  let pSoundMissionIndex = 0;
  let pListenRound = null;
  let pMatchRound = null;
  let pBuildRound = null;
  let pBuildSelectedKey = null;
  let pBuildAudioGen = 0;
  let pBuildPromptTimer = null;

  /** Cached HTMLAudioElement per grapheme／phoneme. */
  const phonemeAudioByLetter = Object.create(null);
  let activePhonemeAudio = null;
  let phonemeWaitTimer = null;
  /** Bump when replacing phoneme MP3s so iPad／Safari 唔用舊 cache。 */
  const PHONEME_ASSET_VERSION = '20260905mama';

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
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch {
      /* ignore */
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

  function goHome() {
    if (window.KakaLearn && typeof window.KakaLearn.goHome === 'function') {
      window.KakaLearn.goHome();
      return;
    }
    $$('.screen').forEach((el) => el.classList.remove('active'));
    $('#screen-home')?.classList.add('active');
  }


  /** Unified phonics audio sequencer — cancel on navigate / new task; never TTS letter names for phonemes. */
  const PhonicsAudio = {
    generation: 0,
    timers: [],
    cancel() {
      this.generation += 1;
      this.timers.forEach((id) => clearTimeout(id));
      this.timers = [];
      stopPhonemeAudio();
      try {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    },
    _wait(ms, gen) {
      return new Promise((resolve) => {
        const id = setTimeout(() => {
          this.timers = this.timers.filter((t) => t !== id);
          resolve(gen === this.generation);
        }, ms);
        this.timers.push(id);
      });
    },
    async playPhoneme(sound, { muted = isMuted() } = {}) {
      const gen = this.generation;
      if (muted) {
        await this._wait(160, gen);
        return gen === this.generation;
      }
      await playLetterSound(sound, { muted });
      return gen === this.generation;
    },
    async speakWord(word, { muted = isMuted(), rate = 0.85, pitch = 1.05 } = {}) {
      const gen = this.generation;
      if (!word) return gen === this.generation;
      if (muted) {
        await this._wait(280, gen);
        return gen === this.generation;
      }
      await speakEnglishAndWait(word, { muted, delayMs: 40, rate, pitch });
      return gen === this.generation;
    },
    async speakFeedback(text, { muted = isMuted(), rate = 0.92, pitch = 1.06 } = {}) {
      return this.speakWord(text, { muted, rate, pitch });
    },
    /**
     * steps: { type:'phoneme'|'word'|'feedback'|'wait'|'highlight', value?, ms?, index? }
     */
    async playSequence(steps, { muted = isMuted(), onStep = null } = {}) {
      const gen = this.generation;
      for (const step of steps) {
        if (gen !== this.generation) return false;
        if (typeof onStep === 'function') onStep(step);
        if (step.type === 'wait') {
          const ok = await this._wait(step.ms || 150, gen);
          if (!ok) return false;
        } else if (step.type === 'phoneme') {
          const ok = await this.playPhoneme(step.value, { muted });
          if (!ok) return false;
          const gap = await this._wait(step.gapMs != null ? step.gapMs : 150, gen);
          if (!gap) return false;
        } else if (step.type === 'word') {
          const ok = await this.speakWord(step.value, { muted, rate: step.rate || 0.85 });
          if (!ok) return false;
        } else if (step.type === 'feedback') {
          const ok = await this.speakFeedback(step.value, { muted });
          if (!ok) return false;
        } else if (step.type === 'highlight') {
          /* visual only */
        }
      }
      return gen === this.generation;
    },
  };

  function wordUnits(word) {
    if (typeof wordGraphemes === 'function') return wordGraphemes(word);
    return word?.graphemes || word?.letters || [];
  }

  function buildBlendSteps(word) {
    const units = wordUnits(word);
    const steps = [];
    units.forEach((g, index) => {
      steps.push({ type: 'highlight', index });
      steps.push({ type: 'phoneme', value: g, gapMs: 150 });
    });
    steps.push({ type: 'wait', ms: 300 });
    steps.push({ type: 'highlight', index: -1, blend: true });
    steps.push({ type: 'word', value: word.word });
    return steps;
  }

  function setBlendNodeActive(index, { blend = false } = {}) {
    const nodes = $$('#phonics-blend-nodes .phonics-blend-node');
    nodes.forEach((node, i) => {
      node.classList.toggle('is-active', !blend && i === index);
      node.classList.toggle('is-blended', !!blend);
    });
  }

  async function playBlendSequenceForWord(word, { muted = isMuted() } = {}) {
    if (!word || !wordUnits(word).length) return false;
    PhonicsAudio.cancel();
    const steps = buildBlendSteps(word);
    return PhonicsAudio.playSequence(steps, {
      muted,
      onStep: (step) => {
        if (step.type === 'highlight') setBlendNodeActive(step.index, { blend: !!step.blend });
      },
    });
  }

  function showPScreen(name) {
    PhonicsAudio.cancel();
    const map = {
      topics: '#screen-phonics-topics',
      sounds: '#screen-phonics-sounds',
      learn: '#screen-phonics-learn',
      play: '#screen-phonics-play',
      listen: '#screen-phonics-listen',
      match: '#screen-phonics-match',
      build: '#screen-phonics-build',
    };
    $$('.screen').forEach((el) => el.classList.remove('active'));
    const el = $(map[name]);
    el?.classList.add('active');
    if (['listen', 'match', 'build'].includes(name)) {
      window.KakaStarFx?.mountPlayScreen?.(el);
    } else {
      window.KakaStarFx?.hideRanger?.();
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
    playTryAgainCue({ muted: isMuted() });
    speakEnglishTerm(line, { muted: isMuted(), rate: 0.9, pitch: 1.05, delayMs: 120 });
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
  const PHONICS_EN_PRAISE = [
    'Great job, {name}!',
    'Well done!',
    'You got it!',
    'Brilliant!',
    'Excellent blending!',
  ];
  const PHONICS_EN_RETRY = [
    'Try again!',
    'Almost! Try again.',
    'Good try! Have another go.',
  ];

  function pickPhonicsEnglishPraise() {
    const name = activeLearnerEnglishName();
    const line = PHONICS_EN_PRAISE[Math.floor(Math.random() * PHONICS_EN_PRAISE.length)];
    return line.replace('{name}', name);
  }

  function pickPhonicsEnglishRetry() {
    return PHONICS_EN_RETRY[Math.floor(Math.random() * PHONICS_EN_RETRY.length)];
  }

  function speakCorrectEnglishOnly(word, muted, onAllDone) {
    const praise = pickPhonicsEnglishPraise();
    (async () => {
      playCorrectCue({ muted });
      const still = await PhonicsAudio.speakFeedback(praise, { muted });
      if (!still) {
        if (typeof onAllDone === 'function') onAllDone();
        return;
      }
      if (word) {
        if (normalizePhoneme(word)) {
          await PhonicsAudio.playPhoneme(word, { muted });
        } else {
          await PhonicsAudio.speakWord(word, { muted });
        }
      }
      if (typeof onAllDone === 'function') onAllDone();
    })();
    return praise;
  }

  /**
   * 答錯流程：先讀粵語「再試吓」，真正讀完先再讀英文目標詞（雙重保險）。
   * @returns {string} 再試句（畫面顯示用）
   */
  function speakRetryThenEnglish(word, muted, onAllDone) {
    const retryLine = pickPhonicsEnglishRetry();
    (async () => {
      playTryAgainCue({ muted });
      const still = await PhonicsAudio.speakFeedback(retryLine, { muted });
      if (!still) {
        if (typeof onAllDone === 'function') onAllDone();
        return;
      }
      // Wrong answers: replay target phoneme/word — never announce the letter name.
      if (word) {
        if (normalizePhoneme(word)) {
          await PhonicsAudio.playPhoneme(word, { muted });
        } else {
          await PhonicsAudio.speakWord(word, { muted });
        }
      }
      if (typeof onAllDone === 'function') onAllDone();
    })();
    return retryLine;
  }

  function init() {
    try {
      warmEnglishVoice();
      bindPhonicsHome();
      bindPhonicsTopics();
      bindPhonicsSounds();
      bindPhonicsLearn();
      bindPhonicsPlayPick();
      bindPhonicsListen();
      bindPhonicsMatch();
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

  function missionStatusForStage(stage) {
    // Soft status only — never hard-lock. Uses existing skill stats when present.
    try {
      const stats = loadState()?.phonicsSkillStats?.blending || {};
      const ids = stage.wordIds || [];
      if (!ids.length) return 'can-review';
      let mastered = 0;
      let seen = 0;
      ids.forEach((id) => {
        const s = stats[id];
        if (!s) return;
        seen += 1;
        if ((s.right || 0) >= 3 && (s.streak || 0) >= 2) mastered += 1;
      });
      if (mastered >= Math.max(1, Math.ceil(ids.length * 0.6))) return 'mastered';
      if (seen > 0) return 'learning';
      return 'suggested';
    } catch {
      return 'can-review';
    }
  }

  function statusLabel(status) {
    if (status === 'mastered') return '已掌握';
    if (status === 'learning') return '正在學習';
    if (status === 'suggested') return '建議下一站';
    return '可以溫習';
  }

  function suggestedNextStage() {
    const stages = (PHONICS_STAGES || []).slice().sort((a, b) => a.order - b.order);
    for (const stage of stages) {
      const st = missionStatusForStage(stage);
      if (st === 'suggested' || st === 'learning') return stage;
    }
    return stages[0] || null;
  }

  function hubCardHtml({ code, title, focus, status, cta }) {
    return `
      <span class="phonics-mission-number" aria-hidden="true">${code}</span>
      <span class="topic-title term-en">${title}</span>
      <span class="topic-blurb term-en">${focus || ''}</span>
      <span class="phonics-hub-status" data-status="${status}">${statusLabel(status)}</span>
      <span class="phonics-hub-cta">${cta}</span>
    `;
  }

  function renderPhonicsTopics() {
    const suggestBox = $('#phonics-hub-suggest');
    const soundsBox = $('#phonics-hub-sounds');
    const blendBox = $('#phonics-hub-blend');
    const trickyBox = $('#phonics-hub-tricky');
    const vocabBox = $('#phonics-hub-vocab');
    const legacyGrid = $('#phonics-topic-grid');

    const next = suggestedNextStage();
    if (suggestBox) {
      if (next) {
        suggestBox.innerHTML = `
          <p class="phonics-hub-suggest-label">建議下一站</p>
          <button type="button" class="phonics-hub-suggest-card" id="btn-phonics-suggested-next">
            <span class="phonics-mission-number">Mission ${String(next.order).padStart(2, '0')}</span>
            <span class="topic-title term-en">${next.title}</span>
            <span class="topic-blurb term-en">Focus: ${next.focusSounds.join(' ')}</span>
            <span class="phonics-hub-cta">開始拼讀</span>
          </button>`;
        $('#btn-phonics-suggested-next')?.addEventListener('click', () => openPhonicsLearn(next.id));
      } else {
        suggestBox.innerHTML = '';
      }
    }

    if (soundsBox) {
      soundsBox.innerHTML = '';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-card phonics-hub-card';
      btn.innerHTML = hubCardHtml({
        code: 'Sound Lab',
        title: '字母音訓練基地',
        focus: '49 音 · 13 Sound Missions',
        status: 'can-review',
        cta: '進入聲音訓練',
      });
      btn.onclick = () => openPhonicsSounds();
      soundsBox.appendChild(btn);
      (PHONICS_SOUND_SECTIONS || []).forEach((section, idx) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'topic-card phonics-hub-card';
        card.innerHTML = hubCardHtml({
          code: `0${idx + 1}`,
          title: section.title,
          focus: section.blurb,
          status: 'can-review',
          cta: '聽音',
        });
        card.onclick = () => openPhonicsSounds();
        soundsBox.appendChild(card);
      });
    }

    if (blendBox) {
      blendBox.innerHTML = '';
      (PHONICS_STAGES || []).slice().sort((a, b) => a.order - b.order).forEach((stage) => {
        const status = missionStatusForStage(stage);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'topic-card phonics-hub-card';
        card.innerHTML = hubCardHtml({
          code: `Stage ${String(stage.order).padStart(2, '0')}`,
          title: stage.title,
          focus: `Focus: ${stage.focusSounds.join(' ')}`,
          status: next && next.id === stage.id ? 'suggested' : status,
          cta: '拼讀任務',
        });
        card.onclick = () => openPhonicsLearn(stage.id);
        blendBox.appendChild(card);
      });
    }

    if (trickyBox) {
      trickyBox.innerHTML = '';
      (PHONICS_TRICKY_SETS || []).forEach((set, i) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'topic-card phonics-hub-card';
        card.innerHTML = hubCardHtml({
          code: `Set ${i + 1}`,
          title: set.title,
          focus: set.blurb,
          status: 'can-review',
          cta: '特別字',
        });
        card.onclick = () => openPhonicsLearn(set.id);
        trickyBox.appendChild(card);
      });
    }

    if (vocabBox) {
      vocabBox.innerHTML = '';
      (PHONICS_VOCAB_SETS || []).forEach((set, i) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'topic-card phonics-hub-card';
        card.innerHTML = hubCardHtml({
          code: `Vocab ${i + 1}`,
          title: set.title,
          focus: set.blurb,
          status: 'can-review',
          cta: '詞彙任務',
        });
        card.onclick = () => openPhonicsLearn(set.id);
        vocabBox.appendChild(card);
      });
    }

    // Keep legacy grid populated (hidden) for smoke selectors / older hooks
    if (legacyGrid) {
      legacyGrid.innerHTML = '';
      const firstBlend = (PHONICS_STAGES || [])[0];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-card';
      btn.textContent = firstBlend ? firstBlend.title : 'Sound Training';
      btn.onclick = () => (firstBlend ? openPhonicsLearn(firstBlend.id) : openPhonicsSounds());
      legacyGrid.appendChild(btn);
    }
  }

  function bindPhonicsSounds() {
    const back = $('#btn-back-phonics-sounds');
    if (back) back.onclick = () => openPhonicsTopics();
  }

  function soundDisplay(sound) {
    if (sound === 'oo-long') return { glyph: 'oo', note: '長音' };
    if (sound === 'oo-short') return { glyph: 'oo', note: '短音' };
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
    if (back) back.onclick = () => pActiveTopicId === 'letters_rev' ? openPhonicsSounds() : openPhonicsTopics();
    const tap = $('#phonics-learn-tap');
    if (tap) tap.onclick = () => speakCurrentPhonicsLearn();
    const prev = $('#btn-phonics-learn-prev');
    const next = $('#btn-phonics-learn-next');
    if (prev) prev.onclick = () => stepPhonicsLearn(-1);
    if (next) next.onclick = () => stepPhonicsLearn(1);
    const play = $('#btn-phonics-learn-play');
    if (play) play.onclick = () => openPhonicsPlayPick();
  }

  function openPhonicsLearn(topicId, soundMissionIndex = 0) {
    const topic = getPhonicsTopicById(topicId);
    if (!topic) return;
    pActiveTopicId = topicId;
    pSoundMissionIndex = soundMissionIndex;
    pLearnWords = topic.soundMissions?.[pSoundMissionIndex]?.words || shuffle(topic.words);
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
    PhonicsAudio.cancel();
    const illust = $('#phonics-learn-illust');
    const term = $('#phonics-learn-term');
    const lettersRow = $('#phonics-learn-letters');
    const progress = $('#phonics-learn-progress');
    const lead = $('#screen-phonics-learn .section-lead');
    const blendPanel = $('#phonics-blend-panel');
    const blendNodes = $('#phonics-blend-nodes');
    const blendBtn = $('#btn-phonics-blend-sounds');
    const isLetter = typeof isLetterItem === 'function' ? isLetterItem(word) : word.kind === 'letter' || word.kind === 'phoneme';
    const units = wordUnits(word);

    if (isLetter) {
      if (illust) {
        illust.innerHTML = `<span class="letter-tile letter-tile-lg" aria-hidden="true">${letterTileHtml(word.word)}</span>`;
      }
      if (term) term.textContent = word.word;
      if (lettersRow) lettersRow.innerHTML = '';
      if (blendPanel) blendPanel.hidden = true;
      if (lead) lead.textContent = '先聽熟每個音，再玩聽音辨形';
    } else {
      if (illust) illust.innerHTML = (word.emoji || word.meaningArt?.emoji) ? phonicsWordIllustHtml(word) : '';
      if (term) term.textContent = word.word;
      if (lettersRow) {
        lettersRow.innerHTML = units.length
          ? units
              .map(
                (ch) =>
                  `<button type="button" class="letter-tile" data-letter="${ch}" aria-label="letter sound ${ch}">${letterTileHtml(ch)}</button>`,
              )
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
            PhonicsAudio.cancel();
            PhonicsAudio.playPhoneme(tile.dataset.letter, { muted: isMuted() });
          });
        });
      }
      if (blendPanel && blendNodes) {
        if (units.length) {
          blendPanel.hidden = false;
          blendNodes.innerHTML = units
            .map((ch, i) => `<span class="phonics-blend-node letter-tile" data-index="${i}">${letterTileHtml(ch)}</span>`)
            .join('<i class="phonics-blend-link" aria-hidden="true"></i>');
          if (blendBtn) {
            blendBtn.onclick = () => {
              playBlendSequenceForWord(word, { muted: isMuted() });
            };
          }
        } else {
          blendPanel.hidden = true;
        }
      }
      if (lead) lead.textContent = units.length ? '撳字母聽音，或 Blend the sounds' : '撳卡聽英文';
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
    if (play) play.textContent = pLearnPassedOnce ? '學完喇・去玩玩' : '去玩玩';

    const plate = illust?.querySelector('.emoji-plate');
    if (plate) plate.classList.add('emoji-plate-lg');
    const face = illust?.querySelector('.emoji-face');
    if (face) face.classList.add('emoji-face-lg');

    speakCurrentPhonicsLearn();
  }

  function speakCurrentPhonicsLearn() {
    const word = pLearnWords[pLearnIndex];
    if (!word) return;
    PhonicsAudio.cancel();
    const isLetter = typeof isLetterItem === 'function' ? isLetterItem(word) : word.kind === 'letter' || word.kind === 'phoneme';
    if (isLetter) {
      PhonicsAudio.playPhoneme(word.word, { muted: isMuted() });
      return;
    }
    PhonicsAudio.speakWord(word.word, { muted: isMuted() });
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
    const buildBtn = $('#btn-phonics-mode-build');
    if (listenBtn) listenBtn.onclick = startPhonicsListenMode;
    if (matchBtn) matchBtn.onclick = startPhonicsMatchMode;
    if (buildBtn) buildBtn.onclick = startPhonicsBuildMode;
  }

  function openPhonicsPlayPick() {
    const topic = getPhonicsTopicById(pActiveTopicId);
    const title = $('#phonics-play-topic-title');
    if (title) {
      const activeSoundGroup = topic?.soundMissions?.[pSoundMissionIndex];
      title.textContent = activeSoundGroup ? `${activeSoundGroup.label}・小測驗` : topic ? `${topic.title}・去玩玩` : '去玩玩';
    }
    const modes = topic?.modes || ['listen'];
    const listenBtn = $('#btn-phonics-mode-listen');
    const matchBtn = $('#btn-phonics-mode-match');
    const buildBtn = $('#btn-phonics-mode-build');
    if (listenBtn) listenBtn.hidden = !modes.includes('listen');
    if (matchBtn) matchBtn.hidden = !modes.includes('match');
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
    startPhonicsListenRound();
  }

  function startPhonicsMatchMode(ev) {
    if (ev) ev.preventDefault();
    if (!pActiveTopicId) {
      openPhonicsTopics();
      return;
    }
    showPScreen('match');
    startPhonicsMatchRound();
  }

  function startPhonicsBuildMode(ev) {
    if (ev) ev.preventDefault();
    if (!pActiveTopicId) {
      openPhonicsTopics();
      return;
    }
    showPScreen('build');
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
    const target = pickTarget(pool);
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
        setTimeout(() => startPhonicsListenRound(), 450);
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
    const target = pickTarget(pool);
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

    // Blend the Word: play /c/ /a/ /t/ then child picks the word/picture.
    if (wordUnits(target).length) {
      const prompt = $('#screen-phonics-match .prompt-box p');
      if (prompt) prompt.textContent = '聽音拼合，揀個字';
      setTimeout(() => {
        playBlendSequenceForWord(target, { muted: isMuted() });
      }, 280);
    }
  }

  function onPhonicsMatchPick(id, btn) {
    if (pBusy || !pMatchRound) return;
    const correct = id === pMatchRound.target.id;
    const targetWord = pMatchRound.target.word;
    const fb = $('#phonics-match-feedback');

    if (wordUnits(pMatchRound.target).length > 0) {
      recordPhonicsSkill('blending', pMatchRound.target.id, correct);
    }

    if (correct) {
      pBusy = true;
      btn.classList.add('correct');
      const praise = speakCorrectEnglishOnly(targetWord, isMuted(), () => {
        setTimeout(() => startPhonicsMatchRound(), 450);
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

  /* ---------- 模式 C：砌一砌(拖／撳字母按順序) ---------- */

  function makePhonicsBuildTiles(target, topic) {
    const needed = wordUnits(target);
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
      openPhonicsPlayPick();
    };
  }

  function startPhonicsBuildRound() {
    if (pBuildPromptTimer) clearTimeout(pBuildPromptTimer);
    pBuildPromptTimer = null;
    const audioGen = ++pBuildAudioGen;
    pBusy = false;
    pBuildSelectedKey = null;
    const topic = getPhonicsTopicById(pActiveTopicId);
    const pool = (topic?.words || []).filter((w) => wordUnits(w).length);
    if (pool.length < 1) return;
    const target = pickTarget(pool);
    const chars = wordUnits(target);
    const tiles = makePhonicsBuildTiles(target, topic);
    pBuildRound = {
      target,
      chars,
      filled: chars.map(() => null),
      tiles,
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
    pBuildRound.chars.forEach((ch, i) => {
      const filled = pBuildRound.filled[i];
      const slot = document.createElement('button');
      slot.type = 'button';
      slot.className = 'build-slot';
      if (filled) slot.classList.add('is-filled');
      if (i === next) slot.classList.add('is-next');
      slot.dataset.index = String(i);
      slot.setAttribute('aria-label', filled ? `已放 ${filled.char}` : `第 ${i + 1} 格，淡字母 ${ch}`);
      slot.innerHTML = `
        <span class="build-ghost term-en" aria-hidden="true">${ch}</span>
        ${filled ? `<span class="build-placed letter-tile" aria-hidden="true">${letterTileHtml(filled.char)}</span>` : ''}`;
      slot.addEventListener('click', () => onPhonicsBuildSlotTap(i));
      box.appendChild(slot);
    });
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
      btn.setAttribute('aria-label', `letter ${tile.char}`);
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
    pBuildSelectedKey = pBuildSelectedKey === key ? null : key;
    renderPhonicsBuildPool();
    const fb = $('#phonics-build-feedback');
    if (fb && pBuildSelectedKey) {
      fb.textContent = '而家撳左邊發光嘅格';
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

  function tryPlacePhonicsBuildChar(tileKey, slotIndex) {
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
    renderPhonicsBuildSlots();
    renderPhonicsBuildPool();

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
    await waitMs(280);
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    await speakEnglishAndWait(word, { muted: isMuted(), rate: 0.82, pitch: 1.05, delayMs: 0 });
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    await waitMs(180);
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    playCorrectCue({ muted: isMuted() });
    await speakEnglishAndWait(praise, { muted: isMuted(), rate: 0.9, pitch: 1.08, delayMs: 80 });
    if (audioGen !== pBuildAudioGen || pBuildRound !== completedRound) return;
    await waitMs(450);
    if (audioGen === pBuildAudioGen && pBuildRound === completedRound) startPhonicsBuildRound();
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

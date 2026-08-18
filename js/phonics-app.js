/* 卡卡字母隊 — English Phonics（獨立 IIFE，唔改動 js/app.js 任何內容）
 * Classic script — 冇 ES module，方便 iPad／預覽側欄。
 * Phase 1：keep it simple — 冇星星／PIN，答啱淨係鼓勵 + 自動下一題。
 */
(function () {
  if (!window.KakaWords || !window.KakaStorage || !window.KakaSpeech || !window.KakaPhonicsWords) {
    console.error('KakaPhonics: required scripts missing. Check words.js / storage.js / speech.js / phonics-words.js loaded first.');
    return;
  }

  const { PHONICS_TOPICS, getPhonicsTopicById, phonicsLetterPool, phonicsWordIllustHtml, letterTileHtml, isLetterItem } =
    window.KakaPhonicsWords;
  const { loadState } = window.KakaStorage;
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
  let pListenRound = null;
  let pMatchRound = null;
  let pBuildRound = null;
  let pBuildSelectedKey = null;

  /** Cached HTMLAudioElement per letter (a–z phoneme clips). */
  const phonemeAudioByLetter = Object.create(null);
  let activePhonemeAudio = null;
  let phonemeWaitTimer = null;
  /** Bump when replacing phoneme MP3s so iPad／Safari 唔用舊 cache。 */
  const PHONEME_ASSET_VERSION = '20260818b';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function isMuted() {
    try {
      return !!loadState().muted;
    } catch {
      return false;
    }
  }

  function normalizeLetter(ch) {
    const s = String(ch || '')
      .trim()
      .toLowerCase();
    return /^[a-z]$/.test(s) ? s : '';
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
   * Play synthetic-phonics sound for one letter (not the letter name).
   * Clips live in ./assets/phonemes/{a-z}.mp3 — browser TTS cannot do isolated phonemes reliably.
   * @returns {Promise<void>}
   */
  function playLetterSound(letter, { muted = isMuted(), onEnd = null } = {}) {
    const ch = normalizeLetter(letter);
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
      phonemeWaitTimer = setTimeout(done, 2200);
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Autoplay / missing file — last resort: letter name TTS (better than silence)
          if (typeof speakEnglishTerm === 'function') {
            speakEnglishTerm(ch, { muted: false, rate: 0.88, onEnd: done });
            return;
          }
          done();
        });
      }
    });
  }

  /** Speak a phonics target: single letters → phoneme clip; words → English TTS. */
  function speakPhonicsTarget(word, opts = {}) {
    if (normalizeLetter(word)) {
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

  function showPScreen(name) {
    const map = {
      topics: '#screen-phonics-topics',
      learn: '#screen-phonics-learn',
      play: '#screen-phonics-play',
      listen: '#screen-phonics-listen',
      match: '#screen-phonics-match',
      build: '#screen-phonics-build',
    };
    $$('.screen').forEach((el) => el.classList.remove('active'));
    $(map[name])?.classList.add('active');
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
    if (normalizeLetter(word)) {
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
      if (normalizeLetter(word)) {
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
      bindPhonicsHome();
      bindPhonicsTopics();
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

  function renderPhonicsTopics() {
    const grid = $('#phonics-topic-grid');
    if (!grid) return;
    grid.innerHTML = '';
    PHONICS_TOPICS.forEach((topic) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'topic-card';
      btn.innerHTML = `
        <span class="topic-cover" aria-hidden="true">${topic.cover}</span>
        <span class="topic-title term-en">${topic.title}</span>
        <span class="topic-blurb term-en">${topic.blurb}</span>
      `;
      btn.onclick = () => openPhonicsLearn(topic.id);
      grid.appendChild(btn);
    });
  }

  function bindPhonicsLearn() {
    const back = $('#btn-back-phonics-learn');
    if (back) back.onclick = () => openPhonicsTopics();
    const tap = $('#phonics-learn-tap');
    if (tap) tap.onclick = () => speakCurrentPhonicsLearn();
    const prev = $('#btn-phonics-learn-prev');
    const next = $('#btn-phonics-learn-next');
    if (prev) prev.onclick = () => stepPhonicsLearn(-1);
    if (next) next.onclick = () => stepPhonicsLearn(1);
    const play = $('#btn-phonics-learn-play');
    if (play) play.onclick = () => openPhonicsPlayPick();
  }

  function openPhonicsLearn(topicId) {
    const topic = getPhonicsTopicById(topicId);
    if (!topic) return;
    pActiveTopicId = topicId;
    pLearnWords = shuffle(topic.words);
    pLearnIndex = 0;
    const title = $('#phonics-learn-topic-title');
    if (title) title.textContent = topic.title;
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
      if (illust) {
        illust.innerHTML = `<span class="letter-tile letter-tile-lg" aria-hidden="true">${letterTileHtml(word.word)}</span>`;
      }
      if (term) term.textContent = word.word;
      if (lettersRow) lettersRow.innerHTML = '';
      if (lead) lead.textContent = '睇吓字母，撳喇叭聽字母音（phonics）';
    } else {
      if (illust) illust.innerHTML = word.emoji ? phonicsWordIllustHtml(word) : '';
      if (term) term.textContent = word.word;
      if (lettersRow) {
        lettersRow.innerHTML = word.letters
          ? word.letters
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
            playLetterSound(tile.dataset.letter, { muted: isMuted() });
          });
        });
      }
      if (lead) {
        lead.textContent = word.letters
          ? '睇吓字同圖,撳字母聽字母音，撳喇叭聽成個字'
          : word.emoji
            ? '睇吓常見字同圖，撳喇叭聽成個字（一眼認得）'
            : '睇吓常見字，撳喇叭聽成個字（一眼認得）';
      }
    }
    if (progress) progress.textContent = `${pLearnIndex + 1}/${pLearnWords.length}`;

    const prev = $('#btn-phonics-learn-prev');
    const next = $('#btn-phonics-learn-next');
    const finishRow = $('#phonics-learn-finish-row');
    const atEnd = pLearnIndex >= pLearnWords.length - 1;
    if (prev) prev.disabled = pLearnIndex <= 0;
    if (next) next.textContent = atEnd ? '再睇一次' : '下一張';
    if (finishRow) finishRow.hidden = !atEnd;

    const plate = illust?.querySelector('.emoji-plate');
    if (plate) plate.classList.add('emoji-plate-lg');
    const face = illust?.querySelector('.emoji-face');
    if (face) face.classList.add('emoji-face-lg');

    speakCurrentPhonicsLearn();
  }

  function speakCurrentPhonicsLearn() {
    const word = pLearnWords[pLearnIndex];
    if (!word) return;
    const isLetter = typeof isLetterItem === 'function' ? isLetterItem(word) : word.kind === 'letter';
    if (isLetter) {
      playLetterSound(word.word, { muted: isMuted() });
      return;
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
    if (back) back.onclick = () => openPhonicsLearn(pActiveTopicId);
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
    if (title) title.textContent = topic ? `${topic.title}・去玩玩` : '去玩玩';
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
    return topic ? topic.words : [];
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
        ? '聽字母讀音，再揀啱嘅<strong>字母</strong>'
        : target.emoji
          ? '聽英文讀音,再揀啱嘅<strong>圖畫</strong>'
          : '聽英文讀音,再揀啱嘅<strong>英文字</strong>';
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
    const fb = $('#phonics-listen-feedback');

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

  /* ---------- 模式 B：睇圖・揀字 ---------- */

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
  }

  function onPhonicsMatchPick(id, btn) {
    if (pBusy || !pMatchRound) return;
    const correct = id === pMatchRound.target.id;
    const targetWord = pMatchRound.target.word;
    const fb = $('#phonics-match-feedback');

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
    if (back) back.onclick = () => openPhonicsPlayPick();
  }

  function startPhonicsBuildRound() {
    pBusy = false;
    pBuildSelectedKey = null;
    const topic = getPhonicsTopicById(pActiveTopicId);
    const pool = (topic?.words || []).filter((w) => w.letters);
    if (pool.length < 1) return;
    const target = pickTarget(pool);
    const chars = target.letters;
    const tiles = makePhonicsBuildTiles(target, topic);
    pBuildRound = {
      target,
      chars,
      filled: chars.map(() => null),
      tiles,
    };

    const fb = $('#phonics-build-feedback');
    if (fb) {
      fb.textContent = '由左到右,砌啱每個字母';
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
      slot.setAttribute('aria-label', filled ? `已放 ${filled.char}` : `第 ${i + 1} 格,淡字母 ${ch}`);
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
          fb.textContent = '由左到右,砌啱每個字母';
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
    const next = nextPhonicsBuildIndex();
    const tile = pBuildRound.tiles.find((t) => t.key === tileKey);
    if (!tile) return false;
    if (pBuildRound.filled.some((f) => f && f.key === tileKey)) return false;

    const slotEl = $(`#phonics-build-slots .build-slot[data-index="${slotIndex}"]`);

    if (slotIndex !== next) {
      slotEl?.classList.add('is-wrong');
      setTimeout(() => slotEl?.classList.remove('is-wrong'), 450);
      playTryAgainCue({ muted: isMuted() });
      const fb = $('#phonics-build-feedback');
      if (fb) {
        fb.textContent = '要由左到右砌呀';
        fb.className = 'feedback retry';
      }
      pBuildSelectedKey = null;
      renderPhonicsBuildPool();
      return false;
    }

    const expected = pBuildRound.chars[slotIndex];
    if (tile.char !== expected) {
      slotEl?.classList.add('is-wrong');
      setTimeout(() => slotEl?.classList.remove('is-wrong'), 450);
      const retryLine = speakRetryThenEnglish(pBuildRound.target.word, isMuted());
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

    if (pBuildRound.filled.every(Boolean)) {
      finishPhonicsBuildSuccess();
    } else {
      const fb = $('#phonics-build-feedback');
      if (fb) {
        fb.textContent = '好!繼續砌下一個';
        fb.className = 'feedback ok';
      }
    }
    return true;
  }

  function finishPhonicsBuildSuccess() {
    if (!pBuildRound) return;
    pBusy = true;
    const word = pBuildRound.target.word;
    const praise = speakCorrectEnglishOnly(word, isMuted(), () => {
      setTimeout(() => startPhonicsBuildRound(), 450);
    });
    const fb = $('#phonics-build-feedback');
    if (fb) {
      fb.textContent = praise;
      fb.className = 'feedback ok';
    }
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

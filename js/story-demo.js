/* STORY ENGLISH — CF001 Game Night Read & Fill.
 * Each fill sentence is checked against the cited Carter Family PDF page and
 * matching original page clip. The learner hears the source clip first, then
 * practises the short sentence with the device's English TTS voice.
 */
(function () {
  const speech = window.KakaSpeech;
  if (!speech) return console.error('KakaStoryDemo: KakaSpeech is required.');

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  let pageIndex = 0;
  let phase = 'listen';
  let busy = false;
  let viewGen = 0;
  let readToken = 0;
  let selectedWord = null;
  let solved = false;
  let reading = false;

  const PRAISE_LINES = [
    'Great job, Kaka! You got it right!',
    'Well done, Kaka! You did it!',
    'Fantastic work, Kaka! Keep it up!',
    'Great, Kaka! You are doing a wonderful job!',
  ];

  const pageImage = (page) => `./assets/story-demo/pages/page-${String(page).padStart(2, '0')}.jpg`;
  const pageAudio = (page) => `./assets/story-demo/cf001-game-night-page-${String(page).padStart(2, '0')}.mp3`;

  // pdfPage is the source PDF page; sourceClip identifies the pre-derivative clip.
  const PAGES = [
    { pdfPage: 3, sourceClip: '86.mp3', sentence: ['Let’s', 'have', 'a', 'Game', 'Night!'], blanks: ['Night!'], choices: ['Night!', 'game', 'day'], image: 1 },
    { pdfPage: 4, sourceClip: '87.mp3', sentence: ['She', 'moved', 'her', 'piece', 'five', 'spaces.'], blanks: ['five'], choices: ['five', 'six', 'four'], image: 2 },
    { pdfPage: 5, sourceClip: '88.mp3', sentence: ['I', 'get', 'to', 'move', 'six', 'spaces!'], blanks: ['six'], choices: ['six', 'five', 'seven'], image: 3 },
    { pdfPage: 6, sourceClip: '89.mp3', sentence: ['I', 'have', 'to', 'go', 'back', 'three', 'spaces.'], blanks: ['three'], choices: ['three', 'six', 'two'], image: 4 },
    { pdfPage: 7, sourceClip: '90.mp3', sentence: ['I', 'won!'], blanks: ['won!'], choices: ['won!', 'lost', 'drew!'], image: 5 },
    { pdfPage: 8, sourceClip: '91.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Harry.'], blanks: ['sport,'], choices: ['sport,', 'game', 'player,'], image: 6 },
    { pdfPage: 9, sourceClip: '92.mp3', sentence: ['I', 'wanted', 'to', 'win!'], blanks: ['win!'], choices: ['win!', 'play', 'lose!'], image: 7 },
    { pdfPage: 10, sourceClip: '93.mp3', sentence: ['Are', 'you', 'at', 'a', 'concert?'], blanks: ['concert?'], choices: ['concert?', 'school?', 'park?'], image: 8 },
    { pdfPage: 11, sourceClip: '94.mp3', sentence: ['Are', 'you', 'a', 'seal?'], blanks: ['seal?'], choices: ['seal?', 'bird?', 'fish?'], image: 9 },
    { pdfPage: 12, sourceClip: '95.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Emmy.'], blanks: ['Emmy.'], choices: ['Emmy.', 'Harry.', 'Mom.'], image: 10 },
    { pdfPage: 13, sourceClip: '96.mp3', sentence: ['Are', 'you', 'a', 'bird?'], blanks: ['bird?'], choices: ['bird?', 'seal?', 'fish?'], image: 11 },
    { pdfPage: 14, sourceClip: '97.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'honey.'], blanks: ['honey.'], choices: ['honey.', 'Mom.', 'Harry.'], image: 12 },
  ];

  function muted() { try { return !!window.KakaStorage?.loadState?.().muted; } catch { return false; } }
  function stopAudio() { $$('audio[data-story-demo]').forEach((audio) => { audio.pause(); audio.currentTime = 0; }); }
  function invalidatePlayback() { viewGen += 1; readToken += 1; reading = false; stopAudio(); speech.cancelAllSpeech?.(); }
  function show(name) { invalidatePlayback(); $$('.screen').forEach((screen) => screen.classList.remove('active')); $(`#screen-${name}`)?.classList.add('active'); window.KakaStarFx?.hideRanger?.(); }
  function home() { invalidatePlayback(); if (window.KakaLearn?.goHome) window.KakaLearn.goHome(); else show('home'); }
  function current() { return PAGES[pageIndex]; }

  function renderHub() {
    $('#story-demo-complete').textContent = `${pageIndex ? `${pageIndex}/${PAGES.length}` : 'Ready'}`;
    const grid = $('#story-demo-activity-grid');
    grid.innerHTML = `<button type="button" class="story-activity-card story-activity-card--read" id="btn-story-read-fill">
      <img class="story-activity-image" src="${pageImage(1)}" alt="" loading="lazy" decoding="async">
      <strong>Read & Fill</strong><small>${PAGES.length} story pages</small>
      <span class="story-activity-description">聽每一頁，再放回剛才聽到的一個字。</span><span class="story-activity-status">Start →</span>
    </button>`;
    $('#btn-story-read-fill')?.addEventListener('click', start);
  }

  function openHub() { renderHub(); show('story-demo'); }
  function start() { pageIndex = 0; phase = 'listen'; busy = false; selectedWord = null; solved = false; show('story-play'); renderPage(); }
  function playPageAudio({ after = null } = {}) {
    const audio = $('audio[data-story-demo]');
    const feedback = $('#story-play-feedback');
    if (!audio) return;
    if (feedback) { feedback.textContent = 'Listening…'; feedback.className = 'feedback'; }
    audio.currentTime = 0;
    audio.onended = () => { if (after) after(); else if (feedback) feedback.textContent = 'Now fill the missing word.'; };
    audio.onerror = () => { if (feedback) { feedback.textContent = 'Audio could not play. Please try again.'; feedback.className = 'feedback retry'; } };
    audio.play().catch(() => { if (feedback) { feedback.textContent = 'Audio could not play. Please try again.'; feedback.className = 'feedback retry'; } });
  }

  function renderListen() {
    const item = current();
    $('#story-play-title').textContent = 'Read & Fill';
    $('#story-play-lead').textContent = '先聽這一頁故事，然後把一個字放回句子。';
    $('#story-round-progress').textContent = `${pageIndex + 1}/${PAGES.length}`;
    $('#story-play-stage').innerHTML = `<div class="story-book-frame"><img class="story-book-page" src="${pageImage(item.image)}" alt="Game Night, page ${pageIndex + 1}" decoding="async"></div>`;
    $('#story-play-actions').innerHTML = `<button type="button" class="btn btn-ghost" id="btn-story-prev" ${pageIndex === 0 ? 'disabled' : ''}>← Previous</button>
      <button type="button" class="btn btn-secondary" id="btn-story-audio">🔊 Listen to the story</button>
      <audio data-story-demo preload="metadata" src="${pageAudio(item.image)}"></audio>`;
    $('#story-play-options').innerHTML = '';
    $('#btn-story-prev')?.addEventListener('click', () => { if (pageIndex > 0) { pageIndex -= 1; phase = 'listen'; renderPage(); } });
    $('#btn-story-audio')?.addEventListener('click', () => playPageAudio({ after: () => { phase = 'fill'; renderPage(); } }));
  }

  function tokenMarkup(item, { filled = false } = {}) {
    const blankSet = new Set(item.blanks);
    return item.sentence.map((word, index) => blankSet.has(word) && !filled
      ? `<button type="button" class="story-fill-blank story-sentence-token" data-sentence-index="${index}" data-blank="${word}" aria-label="Missing word">${selectedWord || '?'}</button>`
      : `<span class="story-sentence-word story-sentence-token${blankSet.has(word) ? ' is-filled' : ''}" data-sentence-index="${index}">${word}</span>`).join(' ');
  }

  function setReadingUi(disabled) {
    $$('.story-fill-tile, #btn-story-submit, #btn-story-read-sentence').forEach((element) => { element.disabled = disabled || busy; });
  }

  function clearSentenceHighlight() {
    $$('.story-sentence-token').forEach((element) => element.classList.remove('is-speaking'));
  }

  function readSentenceWithHighlight(item, onEnd = null) {
    const token = ++readToken;
    reading = true;
    setReadingUi(true);
    clearSentenceHighlight();
    let index = 0;
    const finish = () => {
      if (token !== readToken) return;
      clearSentenceHighlight();
      reading = false;
      setReadingUi(false);
      onEnd?.();
    };
    const next = () => {
      if (token !== readToken) return;
      if (index >= item.sentence.length) { finish(); return; }
      const wordIndex = index;
      const element = $(`.story-sentence-token[data-sentence-index="${wordIndex}"]`);
      clearSentenceHighlight();
      element?.classList.add('is-speaking');
      index += 1;
      let done = false;
      let fallbackTimer = null;
      const moveOn = () => {
        if (done || token !== readToken) return;
        done = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        setTimeout(next, 0);
      };
      fallbackTimer = setTimeout(moveOn, (speech.estimateSpeakMs?.(item.sentence[wordIndex], { rate: 0.78, delayMs: 80 }) || 1500) + 450);
      speech.speakEnglishTerm?.(item.sentence[wordIndex], { rate: 0.78, pitch: 1.05, onEnd: moveOn });
    };
    next();
  }

  function speakPraise(onEnd = null) {
    const token = ++readToken;
    const line = PRAISE_LINES[pageIndex % PRAISE_LINES.length];
    const feedback = $('#story-play-feedback');
    reading = true;
    setReadingUi(true);
    if (feedback) { feedback.textContent = line; feedback.className = 'feedback ok story-praise'; }
    let done = false;
    let fallbackTimer = null;
    const finish = () => {
      if (done || token !== readToken) return;
      done = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      reading = false;
      setReadingUi(false);
      onEnd?.();
    };
    fallbackTimer = setTimeout(finish, (speech.estimateSpeakMs?.(line, { rate: 0.82, delayMs: 80 }) || 1800) + 600);
    speech.speakEnglishTerm?.(line, { rate: 0.82, pitch: 1.05, onEnd: finish });
  }

  function selectWord(word) {
    const item = current();
    if (busy || reading || !item.choices.includes(word)) return;
    selectedWord = word;
    const blank = $('.story-fill-blank');
    if (blank) { blank.textContent = word; blank.classList.add('has-selection'); }
    $$('.story-fill-tile').forEach((tile) => tile.classList.toggle('selected', tile.dataset.word === word));
    const submit = $('#btn-story-submit');
    if (submit) submit.disabled = false;
    $('#story-play-feedback').textContent = 'Now press Submit.';
    $('#story-play-feedback').className = 'feedback';
  }

  function renderFill() {
    const item = current();
    const stage = $('#story-play-stage');
    $('#story-play-lead').textContent = '聽英文句子，揀字，再按 Submit。';
    stage.classList.add('story-page-challenge');
    stage.innerHTML = `<div class="story-challenge-image-wrap"><img class="story-challenge-page" src="${pageImage(item.image)}" alt="Game Night, page ${pageIndex + 1}" decoding="async"></div>
      <section class="story-fill-panel" aria-label="Sentence fill activity">
        <p class="story-source-tag">Game Night · PDF page ${item.pdfPage}</p>
        <h2>Fill the missing word</h2><p class="story-fill-sentence">${tokenMarkup(item, { filled: solved })}</p>
        <button type="button" class="btn btn-secondary story-listen-again" id="btn-story-read-sentence" ${reading ? 'disabled' : ''}>🔊 Read this sentence</button>
        <p class="story-fill-help">Choose one word, then press Submit.</p>
        <div class="story-fill-bank" id="story-fill-bank">${item.choices.map((word) => `<button type="button" class="story-fill-tile${selectedWord === word ? ' selected' : ''}${solved && item.blanks.includes(word) ? ' correct' : ''}" draggable="${!busy && !reading}" data-word="${word}"${busy || reading ? ' disabled' : ''}>${word}</button>`).join('')}</div>
        <button type="button" class="btn btn-primary story-fill-submit" id="btn-story-submit"${!selectedWord || busy || reading ? ' disabled' : ''}>Submit</button>
      </section>`;
    $('#story-play-actions').innerHTML = '';
    $('#story-play-options').innerHTML = '';
    $('#btn-story-read-sentence')?.addEventListener('click', () => readSentenceWithHighlight(item));
    $$('.story-fill-tile', stage).forEach((tile) => {
      tile.addEventListener('click', () => selectWord(tile.dataset.word));
      tile.addEventListener('dragstart', (event) => event.dataTransfer?.setData('text/plain', tile.dataset.word));
    });
    $$('.story-fill-blank', stage).forEach((blank) => {
      blank.addEventListener('dragover', (event) => event.preventDefault());
      blank.addEventListener('drop', (event) => { event.preventDefault(); selectWord(event.dataTransfer?.getData('text/plain')); });
    });
    $('#btn-story-submit')?.addEventListener('click', submitWord);
  }

  function submitWord() {
    const item = current();
    const word = selectedWord;
    if (busy || reading || !word) return;
    const blank = $('.story-fill-blank');
    if (!item.blanks.includes(word)) {
      const tile = $$('.story-fill-tile').find((candidate) => candidate.dataset.word === word);
      tile?.classList.add('wrong');
      speech.playTryAgainCue?.({ muted: muted() });
      $('#story-play-feedback').textContent = 'That’s okay. Try again!';
      $('#story-play-feedback').className = 'feedback retry';
      selectedWord = null;
      if (blank) { blank.textContent = '?'; blank.classList.remove('has-selection'); }
      $$('.story-fill-tile').forEach((candidate) => candidate.classList.remove('selected'));
      setTimeout(() => tile?.classList.remove('wrong'), 650);
      return;
    }
    busy = true;
    solved = true;
    blank.textContent = word;
    blank.classList.add('filled');
    $$('.story-fill-tile').forEach((tile) => {
      tile.disabled = true;
      tile.draggable = false;
      tile.classList.toggle('correct', tile.dataset.word === word);
    });
    $('#btn-story-submit').disabled = true;
    speech.playCorrectCue?.({ muted: muted() });
    const feedback = $('#story-play-feedback');
    feedback.textContent = 'Great job!'; feedback.className = 'feedback ok';
    speakPraise(() => {
      $('#story-fill-bank').insertAdjacentHTML('afterend', `<button type="button" class="btn btn-primary story-next-page" id="btn-story-next">${pageIndex === PAGES.length - 1 ? 'Finish story →' : 'Next page →'}</button>`);
      $('#btn-story-next')?.addEventListener('click', nextPage);
    });
  }

  function nextPage() {
    if (pageIndex >= PAGES.length - 1) return finish();
    pageIndex += 1; phase = 'listen'; busy = false; selectedWord = null; solved = false; renderPage();
  }
  function finish() {
    $('#story-play-title').textContent = 'Great reading!';
    $('#story-play-lead').textContent = 'You listened to the story and filled every sentence.';
    $('#story-round-progress').textContent = `${PAGES.length}/${PAGES.length}`;
    $('#story-play-stage').classList.remove('story-page-challenge');
    $('#story-play-stage').innerHTML = `<div class="story-finish"><span>★</span><h2>Game Night Complete!</h2><p>Read the story again whenever you like.</p></div>`;
    $('#story-play-actions').innerHTML = '<button type="button" class="btn btn-secondary" id="btn-story-restart">Read again</button>';
    $('#story-play-options').innerHTML = '<button type="button" class="story-answer" id="btn-story-home">Back to Game Night</button>';
    $('#btn-story-restart')?.addEventListener('click', start);
    $('#btn-story-home')?.addEventListener('click', openHub);
  }
  function renderPage() {
    stopAudio(); viewGen += 1;
    const feedback = $('#story-play-feedback'); feedback.textContent = ''; feedback.className = 'feedback';
    $('#story-play-stage').classList.remove('story-page-challenge');
    if (phase === 'listen') renderListen(); else renderFill();
  }
  function init() {
    speech.warmVoices?.();
    speech.warmEnglishVoice?.();
    $('#btn-start-story-demo')?.addEventListener('click', openHub);
    $('#btn-back-story-demo')?.addEventListener('click', home);
    $('#btn-back-story-play')?.addEventListener('click', openHub);
  }
  init();
  window.KakaStoryDemo = { open: openHub, pageCount: PAGES.length };
}());

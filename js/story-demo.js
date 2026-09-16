/* STORY ENGLISH — CF001 Game Night Read & Fill.
 * Each fill sentence is checked against the cited Carter Family PDF page and
 * matching original page clip.  The learner always hears the source clip first.
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

  const pageImage = (page) => `./assets/story-demo/pages/page-${String(page).padStart(2, '0')}.jpg`;
  const pageAudio = (page) => `./assets/story-demo/cf001-game-night-page-${String(page).padStart(2, '0')}.mp3`;

  // pdfPage is the source PDF page; sourceClip identifies the pre-derivative clip.
  const PAGES = [
    { pdfPage: 3, sourceClip: '86.mp3', sentence: ['Let’s', 'have', 'a', 'Game', 'Night!'], blanks: ['Night!'], choices: ['Night!', 'game'], image: 1 },
    { pdfPage: 4, sourceClip: '87.mp3', sentence: ['She', 'moved', 'her', 'piece', 'five', 'spaces.'], blanks: ['five'], choices: ['five', 'six'], image: 2 },
    { pdfPage: 5, sourceClip: '88.mp3', sentence: ['I', 'get', 'to', 'move', 'six', 'spaces!'], blanks: ['six'], choices: ['six', 'five'], image: 3 },
    { pdfPage: 6, sourceClip: '89.mp3', sentence: ['I', 'have', 'to', 'go', 'back', 'three', 'spaces.'], blanks: ['three'], choices: ['three', 'six'], image: 4 },
    { pdfPage: 7, sourceClip: '90.mp3', sentence: ['I', 'won!'], blanks: ['won!'], choices: ['won!', 'lost'], image: 5 },
    { pdfPage: 8, sourceClip: '91.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Harry.'], blanks: ['sport,'], choices: ['sport,', 'game'], image: 6 },
    { pdfPage: 9, sourceClip: '92.mp3', sentence: ['I', 'wanted', 'to', 'win!'], blanks: ['win!'], choices: ['win!', 'play'], image: 7 },
    { pdfPage: 10, sourceClip: '93.mp3', sentence: ['Are', 'you', 'at', 'a', 'concert?'], blanks: ['concert?'], choices: ['concert?', 'school?'], image: 8 },
    { pdfPage: 11, sourceClip: '94.mp3', sentence: ['Are', 'you', 'a', 'seal?'], blanks: ['seal?'], choices: ['seal?', 'bird?'], image: 9 },
    { pdfPage: 12, sourceClip: '95.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Emmy.'], blanks: ['Emmy.'], choices: ['Emmy.', 'Harry.'], image: 10 },
    { pdfPage: 13, sourceClip: '96.mp3', sentence: ['Are', 'you', 'a', 'bird?'], blanks: ['bird?'], choices: ['bird?', 'seal?'], image: 11 },
    { pdfPage: 14, sourceClip: '97.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'honey.'], blanks: ['honey.'], choices: ['honey.', 'Mom.'], image: 12 },
  ];

  function muted() { try { return !!window.KakaStorage?.loadState?.().muted; } catch { return false; } }
  function stopAudio() { $$('audio[data-story-demo]').forEach((audio) => { audio.pause(); audio.currentTime = 0; }); }
  function invalidatePlayback() { viewGen += 1; stopAudio(); speech.cancelAllSpeech?.(); }
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
  function start() { pageIndex = 0; phase = 'listen'; busy = false; show('story-play'); renderPage(); }
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
      <button type="button" class="btn btn-secondary" id="btn-story-audio">🔊 Listen to this page</button>
      <audio data-story-demo preload="metadata" src="${pageAudio(item.image)}"></audio>`;
    $('#story-play-options').innerHTML = '';
    $('#btn-story-prev')?.addEventListener('click', () => { if (pageIndex > 0) { pageIndex -= 1; phase = 'listen'; renderPage(); } });
    $('#btn-story-audio')?.addEventListener('click', () => playPageAudio({ after: () => { phase = 'fill'; renderPage(); } }));
  }

  function tokenMarkup(item) {
    const blankSet = new Set(item.blanks);
    return item.sentence.map((word) => blankSet.has(word)
      ? `<button type="button" class="story-fill-blank" data-blank="${word}" aria-label="Missing word">?</button>`
      : `<span class="story-sentence-word">${word}</span>`).join(' ');
  }

  function renderFill() {
    const item = current();
    const stage = $('#story-play-stage');
    $('#story-play-lead').textContent = '把剛才聽到的字拉進空格；也可以直接點字卡。';
    stage.classList.add('story-page-challenge');
    stage.innerHTML = `<div class="story-challenge-image-wrap"><img class="story-challenge-page" src="${pageImage(item.image)}" alt="Game Night, page ${pageIndex + 1}" decoding="async"></div>
      <section class="story-fill-panel" aria-label="Sentence fill activity">
        <p class="story-source-tag">Game Night · PDF page ${item.pdfPage}</p>
        <h2>Fill the missing word</h2><p class="story-fill-sentence">${tokenMarkup(item)}</p>
        <button type="button" class="btn btn-secondary story-listen-again" id="btn-story-audio">🔊 Listen again</button>
        <audio data-story-demo preload="metadata" src="${pageAudio(item.image)}"></audio>
        <p class="story-fill-help">Drag or tap the word.</p>
        <div class="story-fill-bank" id="story-fill-bank">${item.choices.map((word) => `<button type="button" class="story-fill-tile" draggable="true" data-word="${word}">${word}</button>`).join('')}</div>
      </section>`;
    $('#story-play-actions').innerHTML = '';
    $('#story-play-options').innerHTML = '';
    $('#btn-story-audio')?.addEventListener('click', () => playPageAudio());
    $$('.story-fill-tile', stage).forEach((tile) => {
      tile.addEventListener('click', () => placeWord(tile.dataset.word));
      tile.addEventListener('dragstart', (event) => event.dataTransfer?.setData('text/plain', tile.dataset.word));
    });
    $$('.story-fill-blank', stage).forEach((blank) => {
      blank.addEventListener('dragover', (event) => event.preventDefault());
      blank.addEventListener('drop', (event) => { event.preventDefault(); placeWord(event.dataTransfer?.getData('text/plain')); });
    });
  }

  function placeWord(word) {
    const item = current();
    if (busy || !word) return;
    const blank = $('.story-fill-blank');
    if (!item.blanks.includes(word)) {
      const tile = $(`.story-fill-tile[data-word="${word}"]`);
      tile?.classList.add('wrong'); setTimeout(() => tile?.classList.remove('wrong'), 420);
      speech.playTryAgainCue?.({ muted: muted() });
      $('#story-play-feedback').textContent = 'Try again. Listen once more if you need to.';
      $('#story-play-feedback').className = 'feedback retry';
      return;
    }
    busy = true;
    blank.textContent = word; blank.classList.add('filled');
    $(`.story-fill-tile[data-word="${word}"]`)?.classList.add('selected');
    speech.playCorrectCue?.({ muted: muted() });
    const feedback = $('#story-play-feedback');
    feedback.textContent = 'Great! Read the whole sentence.'; feedback.className = 'feedback ok';
    $('#story-fill-bank').insertAdjacentHTML('afterend', `<button type="button" class="btn btn-primary story-next-page" id="btn-story-next">${pageIndex === PAGES.length - 1 ? 'Finish story →' : 'Next page →'}</button>`);
    $('#btn-story-next')?.addEventListener('click', nextPage);
  }

  function nextPage() {
    if (pageIndex >= PAGES.length - 1) return finish();
    pageIndex += 1; phase = 'listen'; busy = false; renderPage();
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
  function init() { $('#btn-start-story-demo')?.addEventListener('click', openHub); $('#btn-back-story-demo')?.addEventListener('click', home); $('#btn-back-story-play')?.addEventListener('click', openHub); }
  init();
  window.KakaStoryDemo = { open: openHub, pageCount: PAGES.length };
}());

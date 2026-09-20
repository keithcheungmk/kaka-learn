/* STORY ENGLISH — Carter Family Read & Fill (CF001–CF003).
 * Each fill sentence is checked against the cited Carter Family PDF page and
 * matching original page clip. The learner hears the source clip first, then
 * practises the short sentence with the device's English TTS voice.
 */
(function () {
  const speech = window.KakaSpeech;
  if (!speech) return console.error('KakaStoryDemo: KakaSpeech is required.');

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  let activeBookId = null;
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

  const BOOKS = [
    {
      id: 'cf001',
      title: 'Game Night',
      cfLabel: 'CF001',
      cover: './assets/story-demo/pages/page-01.jpg',
      pages: [
        { pdfPage: 3, sourceClip: '86.mp3', sentence: ['Let’s', 'have', 'a', 'Game', 'Night!'], blanks: ['Night!'], choices: ['Night!', 'game', 'day'], image: './assets/story-demo/pages/page-01.jpg', audio: './assets/story-demo/cf001-game-night-page-01.mp3' },
        { pdfPage: 4, sourceClip: '87.mp3', sentence: ['She', 'moved', 'her', 'piece', 'five', 'spaces.'], blanks: ['five'], choices: ['five', 'six', 'four'], image: './assets/story-demo/pages/page-02.jpg', audio: './assets/story-demo/cf001-game-night-page-02.mp3' },
        { pdfPage: 5, sourceClip: '88.mp3', sentence: ['I', 'get', 'to', 'move', 'six', 'spaces!'], blanks: ['six'], choices: ['six', 'five', 'seven'], image: './assets/story-demo/pages/page-03.jpg', audio: './assets/story-demo/cf001-game-night-page-03.mp3' },
        { pdfPage: 6, sourceClip: '89.mp3', sentence: ['I', 'have', 'to', 'go', 'back', 'three', 'spaces.'], blanks: ['three'], choices: ['three', 'six', 'two'], image: './assets/story-demo/pages/page-04.jpg', audio: './assets/story-demo/cf001-game-night-page-04.mp3' },
        { pdfPage: 7, sourceClip: '90.mp3', sentence: ['I', 'won!'], blanks: ['won!'], choices: ['won!', 'lost', 'drew!'], image: './assets/story-demo/pages/page-05.jpg', audio: './assets/story-demo/cf001-game-night-page-05.mp3' },
        { pdfPage: 8, sourceClip: '91.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Harry.'], blanks: ['sport,'], choices: ['sport,', 'game', 'player,'], image: './assets/story-demo/pages/page-06.jpg', audio: './assets/story-demo/cf001-game-night-page-06.mp3' },
        { pdfPage: 9, sourceClip: '92.mp3', sentence: ['I', 'wanted', 'to', 'win!'], blanks: ['win!'], choices: ['win!', 'play', 'lose!'], image: './assets/story-demo/pages/page-07.jpg', audio: './assets/story-demo/cf001-game-night-page-07.mp3' },
        { pdfPage: 10, sourceClip: '93.mp3', sentence: ['Are', 'you', 'at', 'a', 'concert?'], blanks: ['concert?'], choices: ['concert?', 'school?', 'park?'], image: './assets/story-demo/pages/page-08.jpg', audio: './assets/story-demo/cf001-game-night-page-08.mp3' },
        { pdfPage: 11, sourceClip: '94.mp3', sentence: ['Are', 'you', 'a', 'seal?'], blanks: ['seal?'], choices: ['seal?', 'bird?', 'fish?'], image: './assets/story-demo/pages/page-09.jpg', audio: './assets/story-demo/cf001-game-night-page-09.mp3' },
        { pdfPage: 12, sourceClip: '95.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Emmy.'], blanks: ['Emmy.'], choices: ['Emmy.', 'Harry.', 'Mom.'], image: './assets/story-demo/pages/page-10.jpg', audio: './assets/story-demo/cf001-game-night-page-10.mp3' },
        { pdfPage: 13, sourceClip: '96.mp3', sentence: ['Are', 'you', 'a', 'bird?'], blanks: ['bird?'], choices: ['bird?', 'seal?', 'fish?'], image: './assets/story-demo/pages/page-11.jpg', audio: './assets/story-demo/cf001-game-night-page-11.mp3' },
        { pdfPage: 14, sourceClip: '97.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'honey.'], blanks: ['honey.'], choices: ['honey.', 'Mom.', 'Harry.'], image: './assets/story-demo/pages/page-12.jpg', audio: './assets/story-demo/cf001-game-night-page-12.mp3' },
      ],
    },
    {
      id: 'cf002',
      title: 'The Tree House',
      cfLabel: 'CF002',
      cover: './assets/story-demo/cf002/pages/page-01.jpg',
      pages: [
        { pdfPage: 3, sourceClip: '98.mp3', sentence: ['Dad', 'and', 'the', 'kids', 'were', 'building', 'a', 'tree', 'house.'], blanks: ['house.'], choices: ['house.', 'boat.', 'tent.'], image: './assets/story-demo/cf002/pages/page-01.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-01.mp3' },
        { pdfPage: 4, sourceClip: '99.mp3', sentence: ['“Can', 'I', 'measure?”', 'asked', 'Oliver.'], blanks: ['measure?”'], choices: ['measure?”', 'paint?”', 'cut?”'], image: './assets/story-demo/cf002/pages/page-02.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-02.mp3' },
        { pdfPage: 5, sourceClip: '100.mp3', sentence: ['Emmy', 'marked', 'the', 'wood', 'with', 'a', 'pencil.'], blanks: ['pencil.'], choices: ['pencil.', 'hammer.', 'brush.'], image: './assets/story-demo/cf002/pages/page-03.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-03.mp3' },
        { pdfPage: 6, sourceClip: '101.mp3', sentence: ['Dad', 'plugged', 'in', 'the', 'saw.'], blanks: ['saw.'], choices: ['saw.', 'drill.', 'lamp.'], image: './assets/story-demo/cf002/pages/page-04.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-04.mp3' },
        { pdfPage: 7, sourceClip: '102.mp3', sentence: ['The', 'saw', 'is', 'very', 'dangerous.'], blanks: ['dangerous.'], choices: ['dangerous.', 'quiet.', 'tiny.'], image: './assets/story-demo/cf002/pages/page-05.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-05.mp3' },
        { pdfPage: 8, sourceClip: '103.mp3', sentence: ['The', 'saw', 'was', 'really', 'loud.'], blanks: ['loud.'], choices: ['loud.', 'soft.', 'slow.'], image: './assets/story-demo/cf002/pages/page-06.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-06.mp3' },
        { pdfPage: 9, sourceClip: '104.mp3', sentence: ['Oliver', 'picked', 'up', 'a', 'small', 'piece', 'of', 'wood.'], blanks: ['wood.'], choices: ['wood.', 'rope.', 'glass.'], image: './assets/story-demo/cf002/pages/page-07.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-07.mp3' },
        { pdfPage: 10, sourceClip: '105.mp3', sentence: ['They', 'nailed', 'the', 'wood', 'together.'], blanks: ['together.'], choices: ['together.', 'apart.', 'away.'], image: './assets/story-demo/cf002/pages/page-08.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-08.mp3' },
        { pdfPage: 11, sourceClip: '106.mp3', sentence: ['Finally', 'the', 'tree', 'house', 'was', 'finished.'], blanks: ['finished.'], choices: ['finished.', 'broken.', 'empty.'], image: './assets/story-demo/cf002/pages/page-09.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-09.mp3' },
        { pdfPage: 12, sourceClip: '107.mp3', sentence: ['Where', 'is', 'Oliver?'], blanks: ['Oliver?'], choices: ['Oliver?', 'Harry?', 'Emmy?'], image: './assets/story-demo/cf002/pages/page-10.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-10.mp3' },
        { pdfPage: 13, sourceClip: '108.mp3', sentence: ['Harry', 'heard', 'a', 'banging', 'sound.'], blanks: ['sound.'], choices: ['sound.', 'song.', 'bell.'], image: './assets/story-demo/cf002/pages/page-11.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-11.mp3' },
        { pdfPage: 14, sourceClip: '109.mp3', sentence: ['Your', 'sign', 'is', 'perfect!'], blanks: ['perfect!'], choices: ['perfect!', 'broken!', 'tiny!'], image: './assets/story-demo/cf002/pages/page-12.jpg', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-12.mp3' },
      ],
    },
    {
      id: 'cf003',
      title: 'The School Play',
      cfLabel: 'CF003',
      cover: './assets/story-demo/cf003/pages/page-01.jpg',
      pages: [
        { pdfPage: 2, sourceClip: '110.mp3', sentence: ['I', 'can’t', 'be', 'late', 'for', 'my', 'school', 'play.'], blanks: ['play.'], choices: ['play.', 'party.', 'race.'], image: './assets/story-demo/cf003/pages/page-01.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-01.mp3' },
        { pdfPage: 3, sourceClip: '111.mp3', sentence: ['At', 'last', 'everyone', 'ran', 'out', 'to', 'the', 'car.'], blanks: ['car.'], choices: ['car.', 'bus.', 'park.'], image: './assets/story-demo/cf003/pages/page-02.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-02.mp3' },
        { pdfPage: 4, sourceClip: '112.mp3', sentence: ['Did', 'you', 'remember', 'the', 'tickets?'], blanks: ['tickets?'], choices: ['tickets?', 'keys?', 'books?'], image: './assets/story-demo/cf003/pages/page-03.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-03.mp3' },
        { pdfPage: 5, sourceClip: '113.mp3', sentence: ['Dad', 'turned', 'the', 'car', 'around', 'and', 'drove', 'back', 'home.'], blanks: ['home.'], choices: ['home.', 'school.', 'shop.'], image: './assets/story-demo/cf003/pages/page-04.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-04.mp3' },
        { pdfPage: 6, sourceClip: '114.mp3', sentence: ['I', 'have', 'to', 'go', 'to', 'the', 'bathroom!'], blanks: ['bathroom!'], choices: ['bathroom!', 'kitchen!', 'garden!'], image: './assets/story-demo/cf003/pages/page-05.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-05.mp3' },
        { pdfPage: 7, sourceClip: '115.mp3', sentence: ['Mom,', 'Dad,', 'and', 'Oliver', 'were', 'back', 'soon.'], blanks: ['soon.'], choices: ['soon.', 'late.', 'lost.'], image: './assets/story-demo/cf003/pages/page-06.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-06.mp3' },
        { pdfPage: 8, sourceClip: '116.mp3', sentence: ['I', 'forgot', 'my', 'turtle', 'costume!'], blanks: ['costume!'], choices: ['costume!', 'hat!', 'bag!'], image: './assets/story-demo/cf003/pages/page-07.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-07.mp3' },
        { pdfPage: 9, sourceClip: '117.mp3', sentence: ['Mom', 'ran', 'into', 'the', 'house', 'for', 'the', 'costume.'], blanks: ['costume.'], choices: ['costume.', 'camera.', 'ticket.'], image: './assets/story-demo/cf003/pages/page-08.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-08.mp3' },
        { pdfPage: 10, sourceClip: '118.mp3', sentence: ['Did', 'anyone', 'else', 'forget', 'anything?'], blanks: ['anything?'], choices: ['anything?', 'someone?', 'nowhere?'], image: './assets/story-demo/cf003/pages/page-09.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-09.mp3' },
        { pdfPage: 11, sourceClip: '119.mp3', sentence: ['looking', 'at', 'her', 'watch.'], blanks: ['watch.'], choices: ['watch.', 'phone.', 'book.'], image: './assets/story-demo/cf003/pages/page-10.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-10.mp3' },
        { pdfPage: 12, sourceClip: '120.mp3', sentence: ['Soon', 'they', 'were', 'at', 'the', 'school.'], blanks: ['school.'], choices: ['school.', 'park.', 'shop.'], image: './assets/story-demo/cf003/pages/page-11.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-11.mp3' },
        { pdfPage: 13, sourceClip: '121.mp3', sentence: ['A', 'minute', 'later', 'the', 'play', 'started.'], blanks: ['started.'], choices: ['started.', 'ended.', 'paused.'], image: './assets/story-demo/cf003/pages/page-12.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-12.mp3' },
        { pdfPage: 14, sourceClip: '122.mp3', sentence: ['Honey,', 'take', 'some', 'pictures.'], blanks: ['pictures.'], choices: ['pictures.', 'tickets.', 'seats.'], image: './assets/story-demo/cf003/pages/page-13.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-13.mp3' },
        { pdfPage: 15, sourceClip: '123.mp3', sentence: ['I', 'forgot', 'the', 'camera!'], blanks: ['camera!'], choices: ['camera!', 'keys!', 'map!'], image: './assets/story-demo/cf003/pages/page-14.jpg', audio: './assets/story-demo/cf003/cf003-the-school-play-page-14.mp3' },
      ],
    },
  ];

  function muted() { try { return !!window.KakaStorage?.loadState?.().muted; } catch { return false; } }
  function stopAudio() { $$('audio[data-story-demo]').forEach((audio) => { audio.pause(); audio.currentTime = 0; }); }
  function invalidatePlayback() { viewGen += 1; readToken += 1; reading = false; stopAudio(); speech.cancelAllSpeech?.(); }
  function show(name) { invalidatePlayback(); $$('.screen').forEach((screen) => screen.classList.remove('active')); $(`#screen-${name}`)?.classList.add('active'); window.KakaStarFx?.hideRanger?.(); }
  function home() { invalidatePlayback(); activeBookId = null; if (window.KakaLearn?.goHome) window.KakaLearn.goHome(); else show('home'); }
  function activeBook() { return BOOKS.find((book) => book.id === activeBookId) || null; }
  function pages() { return activeBook()?.pages || []; }
  function current() { return pages()[pageIndex]; }
  function totalPages() { return BOOKS.reduce((sum, book) => sum + book.pages.length, 0); }

  function renderHub() {
    $('#story-demo-complete').textContent = `${BOOKS.length} books`;
    const heroCover = $('#story-demo-hero-cover');
    const heroKicker = $('#story-demo-kicker');
    const heroTitle = $('#story-demo-hero-title');
    if (heroCover) heroCover.src = BOOKS[0].cover;
    if (heroKicker) heroKicker.textContent = 'CARTER FAMILY · CF001–CF003';
    if (heroTitle) heroTitle.textContent = 'Story Books';
    const grid = $('#story-demo-activity-grid');
    grid.innerHTML = BOOKS.map((book) => `<button type="button" class="story-activity-card story-activity-card--read" data-book-id="${book.id}">
      <img class="story-activity-image" src="${book.cover}" alt="" loading="lazy" decoding="async">
      <strong>${book.title}</strong><small>${book.cfLabel} · ${book.pages.length} pages</small>
      <span class="story-activity-description">聽每一頁，再放回剛才聽到的一個字。</span><span class="story-activity-status">Start →</span>
    </button>`).join('');
    $$('[data-book-id]', grid).forEach((button) => {
      button.addEventListener('click', () => startBook(button.dataset.bookId));
    });
  }

  function openHub() { activeBookId = null; renderHub(); show('story-demo'); }
  function startBook(bookId) {
    const book = BOOKS.find((item) => item.id === bookId);
    if (!book) return;
    activeBookId = bookId;
    pageIndex = 0;
    phase = 'listen';
    busy = false;
    selectedWord = null;
    solved = false;
    show('story-play');
    renderPage();
  }

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
    const book = activeBook();
    const item = current();
    const list = pages();
    $('#btn-back-story-play').textContent = `← ${book.title}`;
    $('#story-play-title').textContent = 'Read & Fill';
    $('#story-play-lead').textContent = '先聽這一頁故事，然後把一個字放回句子。';
    $('#story-round-progress').textContent = `${pageIndex + 1}/${list.length}`;
    $('#story-play-stage').innerHTML = `<div class="story-book-frame"><img class="story-book-page" src="${item.image}" alt="${book.title}, page ${pageIndex + 1}" decoding="async"></div>`;
    $('#story-play-actions').innerHTML = `<button type="button" class="btn btn-ghost" id="btn-story-prev" ${pageIndex === 0 ? 'disabled' : ''}>← Previous</button>
      <button type="button" class="btn btn-secondary" id="btn-story-audio">🔊 Listen to the story</button>
      <audio data-story-demo preload="metadata" src="${item.audio}"></audio>`;
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
    const book = activeBook();
    const item = current();
    const stage = $('#story-play-stage');
    $('#story-play-lead').textContent = '聽英文句子，揀字，再按 Submit。';
    stage.classList.add('story-page-challenge');
    stage.innerHTML = `<div class="story-challenge-image-wrap"><img class="story-challenge-page" src="${item.image}" alt="${book.title}, page ${pageIndex + 1}" decoding="async"></div>
      <section class="story-fill-panel" aria-label="Sentence fill activity">
        <p class="story-source-tag">${book.title} · PDF page ${item.pdfPage}</p>
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
    const list = pages();
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
      $('#story-fill-bank').insertAdjacentHTML('afterend', `<button type="button" class="btn btn-primary story-next-page" id="btn-story-next">${pageIndex === list.length - 1 ? 'Finish story →' : 'Next page →'}</button>`);
      $('#btn-story-next')?.addEventListener('click', nextPage);
    });
  }

  function nextPage() {
    const list = pages();
    if (pageIndex >= list.length - 1) return finish();
    pageIndex += 1; phase = 'listen'; busy = false; selectedWord = null; solved = false; renderPage();
  }

  function finish() {
    const book = activeBook();
    const list = pages();
    $('#story-play-title').textContent = 'Great reading!';
    $('#story-play-lead').textContent = 'You listened to the story and filled every sentence.';
    $('#story-round-progress').textContent = `${list.length}/${list.length}`;
    $('#story-play-stage').classList.remove('story-page-challenge');
    $('#story-play-stage').innerHTML = `<div class="story-finish"><span>★</span><h2>${book.title} Complete!</h2><p>Read the story again whenever you like.</p></div>`;
    $('#story-play-actions').innerHTML = '<button type="button" class="btn btn-secondary" id="btn-story-restart">Read again</button>';
    $('#story-play-options').innerHTML = '<button type="button" class="story-answer" id="btn-story-home">Back to Story Books</button>';
    $('#btn-story-restart')?.addEventListener('click', () => startBook(book.id));
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
  window.KakaStoryDemo = {
    open: openHub,
    books: BOOKS.map((book) => ({ id: book.id, title: book.title, pageCount: book.pages.length })),
    pageCount: totalPages(),
  };
}());

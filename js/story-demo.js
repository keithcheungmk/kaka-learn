/* STORY ENGLISH — Carter Family Read & Fill (CF001–CF085).
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
  let questionPlan = [];

  const PRAISE_LINES = [
    'Great job, Kaka! You got it right!',
    'Well done, Kaka! You did it!',
    'Fantastic work, Kaka! Keep it up!',
    'Great, Kaka! You are doing a wonderful job!',
  ];

  const BASE_BOOKS = [
    {
      id: 'cf001',
      title: 'Game Night',
      cfLabel: 'CF001',
      cover: './assets/story-demo/pages/page-01.webp',
      pages: [
        { pdfPage: 3, sourceClip: '86.mp3', sentence: ['Let’s', 'have', 'a', 'Game', 'Night!'], blanks: ['Night!'], choices: ['Night!', 'sport,', 'five'], image: './assets/story-demo/pages/page-01.webp', audio: './assets/story-demo/cf001-game-night-page-01.mp3' },
        { pdfPage: 4, sourceClip: '87.mp3', sentence: ['She', 'moved', 'her', 'piece', 'five', 'spaces.'], blanks: ['spaces.'], choices: ['spaces.', 'seal?', 'sport,'], image: './assets/story-demo/pages/page-02.webp', audio: './assets/story-demo/cf001-game-night-page-02.mp3' },
        { pdfPage: 5, sourceClip: '88.mp3', sentence: ['I', 'get', 'to', 'move', 'six', 'spaces!'], blanks: ['spaces!'], choices: ['spaces!', 'five', 'concert?'], image: './assets/story-demo/pages/page-03.webp', audio: './assets/story-demo/cf001-game-night-page-03.mp3' },
        { pdfPage: 6, sourceClip: '89.mp3', sentence: ['I', 'have', 'to', 'go', 'back', 'three', 'spaces.'], blanks: ['spaces.'], choices: ['spaces.', 'sport,', 'concert?'], image: './assets/story-demo/pages/page-04.webp', audio: './assets/story-demo/cf001-game-night-page-04.mp3' },
        { pdfPage: 7, sourceClip: '90.mp3', sentence: ['I', 'won!'], blanks: ['won!'], choices: ['won!', 'six', 'concert?'], image: './assets/story-demo/pages/page-05.webp', audio: './assets/story-demo/cf001-game-night-page-05.mp3' },
        { pdfPage: 8, sourceClip: '91.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Harry.'], blanks: ['good', 'sport,'], choices: ['good sport,', 'Game Night!', 'five spaces.'], image: './assets/story-demo/pages/page-06.webp', audio: './assets/story-demo/cf001-game-night-page-06.mp3' },
        { pdfPage: 9, sourceClip: '92.mp3', sentence: ['I', 'wanted', 'to', 'win!'], blanks: ['wanted'], choices: ['wanted', 'seal?', 'good'], image: './assets/story-demo/pages/page-07.webp', audio: './assets/story-demo/cf001-game-night-page-07.mp3' },
        { pdfPage: 10, sourceClip: '93.mp3', sentence: ['Are', 'you', 'at', 'a', 'concert?'], blanks: ['concert?'], choices: ['concert?', 'bird?', 'seal?'], image: './assets/story-demo/pages/page-08.webp', audio: './assets/story-demo/cf001-game-night-page-08.mp3' },
        { pdfPage: 11, sourceClip: '94.mp3', sentence: ['Are', 'you', 'a', 'seal?'], blanks: ['seal?'], choices: ['seal?', 'Game', 'wanted'], image: './assets/story-demo/pages/page-09.webp', audio: './assets/story-demo/cf001-game-night-page-09.mp3' },
        { pdfPage: 12, sourceClip: '95.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'Emmy.'], blanks: ['good', 'sport,'], choices: ['good sport,', 'Game Night!', 'five spaces.'], image: './assets/story-demo/pages/page-10.webp', audio: './assets/story-demo/cf001-game-night-page-10.mp3' },
        { pdfPage: 13, sourceClip: '96.mp3', sentence: ['Are', 'you', 'a', 'bird?'], blanks: ['bird?'], choices: ['bird?', 'five', 'Night!'], image: './assets/story-demo/pages/page-11.webp', audio: './assets/story-demo/cf001-game-night-page-11.mp3' },
        { pdfPage: 14, sourceClip: '97.mp3', sentence: ['Be', 'a', 'good', 'sport,', 'honey.'], blanks: ['good', 'sport,'], choices: ['good sport,', 'Game Night!', 'five spaces.'], image: './assets/story-demo/pages/page-12.webp', audio: './assets/story-demo/cf001-game-night-page-12.mp3' },
      ],
    },
    {
      id: 'cf002',
      title: 'The Tree House',
      cfLabel: 'CF002',
      cover: './assets/story-demo/cf002/pages/page-01.webp',
      pages: [
        { pdfPage: 3, sourceClip: '98.mp3', sentence: ['Dad', 'and', 'the', 'kids', 'were', 'building', 'a', 'tree', 'house.'], blanks: ['tree', 'house.'], choices: ['tree house.', 'small piece', 'wood together.'], image: './assets/story-demo/cf002/pages/page-01.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-01.mp3' },
        { pdfPage: 4, sourceClip: '99.mp3', sentence: ['“Can', 'I', 'measure?”', 'asked', 'Oliver.'], blanks: ['asked'], choices: ['asked', 'together.', 'plugged'], image: './assets/story-demo/cf002/pages/page-02.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-02.mp3' },
        { pdfPage: 5, sourceClip: '100.mp3', sentence: ['Emmy', 'marked', 'the', 'wood', 'with', 'a', 'pencil.'], blanks: ['pencil.'], choices: ['pencil.', 'piece', 'finished.'], image: './assets/story-demo/cf002/pages/page-03.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-03.mp3' },
        { pdfPage: 6, sourceClip: '101.mp3', sentence: ['Dad', 'plugged', 'in', 'the', 'saw.'], blanks: ['plugged'], choices: ['plugged', 'Finally', 'sound.'], image: './assets/story-demo/cf002/pages/page-04.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-04.mp3' },
        { pdfPage: 7, sourceClip: '102.mp3', sentence: ['The', 'saw', 'is', 'very', 'dangerous.'], blanks: ['dangerous.'], choices: ['dangerous.', 'measure?”', 'plugged'], image: './assets/story-demo/cf002/pages/page-05.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-05.mp3' },
        { pdfPage: 8, sourceClip: '103.mp3', sentence: ['The', 'saw', 'was', 'really', 'loud.'], blanks: ['loud.'], choices: ['loud.', 'marked', 'pencil.'], image: './assets/story-demo/cf002/pages/page-06.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-06.mp3' },
        { pdfPage: 9, sourceClip: '104.mp3', sentence: ['Oliver', 'picked', 'up', 'a', 'small', 'piece', 'of', 'wood.'], blanks: ['small', 'piece'], choices: ['small piece', 'tree house.', 'wood together.'], image: './assets/story-demo/cf002/pages/page-07.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-07.mp3' },
        { pdfPage: 10, sourceClip: '105.mp3', sentence: ['They', 'nailed', 'the', 'wood', 'together.'], blanks: ['wood', 'together.'], choices: ['wood together.', 'tree house.', 'small piece'], image: './assets/story-demo/cf002/pages/page-08.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-08.mp3' },
        { pdfPage: 11, sourceClip: '106.mp3', sentence: ['Finally', 'the', 'tree', 'house', 'was', 'finished.'], blanks: ['finished.'], choices: ['finished.', 'perfect!', 'piece'], image: './assets/story-demo/cf002/pages/page-09.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-09.mp3' },
        { pdfPage: 12, sourceClip: '107.mp3', sentence: ['Where', 'is', 'Oliver?'], blanks: ['Where'], choices: ['Where', 'plugged', 'finished.'], image: './assets/story-demo/cf002/pages/page-10.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-10.mp3' },
        { pdfPage: 13, sourceClip: '108.mp3', sentence: ['Harry', 'heard', 'a', 'banging', 'sound.'], blanks: ['sound.'], choices: ['sound.', 'nailed', 'marked'], image: './assets/story-demo/cf002/pages/page-11.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-11.mp3' },
        { pdfPage: 14, sourceClip: '109.mp3', sentence: ['Your', 'sign', 'is', 'perfect!'], blanks: ['perfect!'], choices: ['perfect!', 'loud.', 'building'], image: './assets/story-demo/cf002/pages/page-12.webp', audio: './assets/story-demo/cf002/cf002-the-tree-house-page-12.mp3' },
      ],
    },
    {
      id: 'cf003',
      title: 'The School Play',
      cfLabel: 'CF003',
      cover: './assets/story-demo/cf003/pages/page-01.webp',
      pages: [
        { pdfPage: 2, sourceClip: '110.mp3', sentence: ['I', 'can’t', 'be', 'late', 'for', 'my', 'school', 'play.'], blanks: ['play.'], choices: ['play.', 'camera!', 'costume!'], image: './assets/story-demo/cf003/pages/page-01.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-01.mp3' },
        { pdfPage: 3, sourceClip: '111.mp3', sentence: ['At', 'last', 'everyone', 'ran', 'out', 'to', 'the', 'car.'], blanks: ['last', 'everyone'], choices: ['last everyone', 'back home.', 'turtle costume!'], image: './assets/story-demo/cf003/pages/page-02.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-02.mp3' },
        { pdfPage: 4, sourceClip: '112.mp3', sentence: ['Did', 'you', 'remember', 'the', 'tickets?'], blanks: ['tickets?'], choices: ['tickets?', 'camera!', 'turned'], image: './assets/story-demo/cf003/pages/page-03.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-03.mp3' },
        { pdfPage: 5, sourceClip: '113.mp3', sentence: ['Dad', 'turned', 'the', 'car', 'around', 'and', 'drove', 'back', 'home.'], blanks: ['back', 'home.'], choices: ['back home.', 'last everyone', 'turtle costume!'], image: './assets/story-demo/cf003/pages/page-04.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-04.mp3' },
        { pdfPage: 6, sourceClip: '114.mp3', sentence: ['I', 'have', 'to', 'go', 'to', 'the', 'bathroom!'], blanks: ['bathroom!'], choices: ['bathroom!', 'else', 'house'], image: './assets/story-demo/cf003/pages/page-05.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-05.mp3' },
        { pdfPage: 7, sourceClip: '115.mp3', sentence: ['Mom,', 'Dad,', 'and', 'Oliver', 'were', 'back', 'soon.'], blanks: ['soon.'], choices: ['soon.', 'else', 'home.'], image: './assets/story-demo/cf003/pages/page-06.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-06.mp3' },
        { pdfPage: 8, sourceClip: '116.mp3', sentence: ['I', 'forgot', 'my', 'turtle', 'costume!'], blanks: ['turtle', 'costume!'], choices: ['turtle costume!', 'last everyone', 'back home.'], image: './assets/story-demo/cf003/pages/page-07.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-07.mp3' },
        { pdfPage: 9, sourceClip: '117.mp3', sentence: ['Mom', 'ran', 'into', 'the', 'house', 'for', 'the', 'costume.'], blanks: ['costume.'], choices: ['costume.', 'last', 'later'], image: './assets/story-demo/cf003/pages/page-08.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-08.mp3' },
        { pdfPage: 10, sourceClip: '118.mp3', sentence: ['Did', 'anyone', 'else', 'forget', 'anything?'], blanks: ['forget', 'anything?'], choices: ['forget anything?', 'last everyone', 'back home.'], image: './assets/story-demo/cf003/pages/page-09.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-09.mp3' },
        { pdfPage: 11, sourceClip: '119.mp3', sentence: ['looking', 'at', 'her', 'watch.'], blanks: ['watch.'], choices: ['watch.', 'ran', 'back'], image: './assets/story-demo/cf003/pages/page-10.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-10.mp3' },
        { pdfPage: 12, sourceClip: '120.mp3', sentence: ['Soon', 'they', 'were', 'at', 'the', 'school.'], blanks: ['school.'], choices: ['school.', 'last', 'forget'], image: './assets/story-demo/cf003/pages/page-11.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-11.mp3' },
        { pdfPage: 13, sourceClip: '121.mp3', sentence: ['A', 'minute', 'later', 'the', 'play', 'started.'], blanks: ['started.'], choices: ['started.', 'drove', 'school'], image: './assets/story-demo/cf003/pages/page-12.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-12.mp3' },
        { pdfPage: 14, sourceClip: '122.mp3', sentence: ['Honey,', 'take', 'some', 'pictures.'], blanks: ['pictures.'], choices: ['pictures.', 'minute', 'later'], image: './assets/story-demo/cf003/pages/page-13.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-13.mp3' },
        { pdfPage: 15, sourceClip: '123.mp3', sentence: ['I', 'forgot', 'the', 'camera!'], blanks: ['camera!'], choices: ['camera!', 'pictures.', 'bathroom!'], image: './assets/story-demo/cf003/pages/page-14.webp', audio: './assets/story-demo/cf003/cf003-the-school-play-page-14.mp3' },
      ],
    },
  ];

  // Carter Family and Magic Marker keep separate catalogues and progress keys,
  // while sharing this verified page-listen/read-and-fill experience.
  const CARTER_BOOKS = BASE_BOOKS.concat(window.KakaCarterManifest?.books || []);
  const MAGIC_MARKER_BOOKS = window.KakaMagicMarkerManifest?.books || [];
  const WACKY_RICKY_BOOKS = window.KakaWackyRickyManifest?.books || [];
  const SERIES = [
    { id: 'carter', title: 'Carter Family', label: 'CARTER FAMILY', range: 'CF001–CF085', image: CARTER_BOOKS[0]?.cover || CARTER_BOOKS[0]?.pages[0]?.image, description: '生活故事 · 聆聽、閱讀與句子填字', books: CARTER_BOOKS },
    { id: 'magic-marker', title: 'Magic Marker', label: 'MAGIC MARKER', range: 'MM001–MM073', image: MAGIC_MARKER_BOOKS[0]?.cover || MAGIC_MARKER_BOOKS[0]?.pages[0]?.image, description: 'Maxie、Taco、Alex 和 Sue 的故事', books: MAGIC_MARKER_BOOKS },
    { id: 'wacky-ricky', title: 'Wacky Ricky', label: 'WACKY RICKY', range: 'WR001–WR100', image: WACKY_RICKY_BOOKS[0]?.cover || WACKY_RICKY_BOOKS[0]?.pages[0]?.image, description: 'Ricky 和朋友們的故事 · 錄音仍待聽審', books: WACKY_RICKY_BOOKS },
  ];
  let currentSeriesId = 'carter';
  let BOOKS = CARTER_BOOKS;

  const OPTION_LABELS = ['A', 'B', 'C', 'D'];
  const normalizeOption = (word) => String(word || '').toLowerCase().replace(/[^a-z]/g, '');
  const PHRASE_FALLBACKS = ['happy park', 'green house', 'little school', 'funny book'];

  function blankAnswer(item) {
    const blanks = item?.blanks || [];
    if (blanks.length >= 2) return blanks.join(' ');
    return blanks[0] || '';
  }

  function pageHasPhrase(item) {
    return (item?.blanks || []).length >= 2;
  }

  function storyPageKey(bookId, page, index) {
    return `story|${bookId}|page-${page?.printedPage || index + 1}`;
  }

  function storyBookKey(bookId) {
    return `story|${bookId}`;
  }

  function passedStoryKeys() {
    try {
      return window.KakaStorage?.loadState?.().passedKeys || {};
    } catch {
      return {};
    }
  }

  function isWackyBookComplete(book, passedKeys = passedStoryKeys()) {
    if (!book?.id || !book.pages?.length) return false;
    if (passedKeys[storyBookKey(book.id)]) return true;
    return book.pages.every((page, index) => passedKeys[storyPageKey(book.id, page, index)]);
  }

  function markStoryBookComplete(book) {
    const storage = window.KakaStorage;
    if (!book?.id || !storage?.loadState || !storage?.updateState) return;
    const key = storyBookKey(book.id);
    const state = storage.loadState();
    if (state.passedKeys?.[key]) return;
    storage.updateState({ passedKeys: { ...(state.passedKeys || {}), [key]: true } });
  }

  function bookShelfCardHtml(book, { complete = false } = {}) {
    const star = complete
      ? '<span class="story-complete-star" aria-label="已完成">★</span>'
      : '';
    const titleStar = complete ? ' <span class="story-complete-tag" aria-hidden="true">★</span>' : '';
    return `<button type="button" class="story-activity-card story-activity-card--read${complete ? ' is-complete' : ''}" data-book-id="${book.id}">
      <span class="story-activity-cover">${star}<img class="story-activity-image" src="${book.cover || book.pages[0]?.image || ''}" alt="" loading="lazy" decoding="async"></span>
      <strong>${book.title}${titleStar}</strong><small>${book.cfLabel || book.mmLabel || book.wrLabel} · ${book.pages.length} playable pages${book.unavailablePages?.length ? ` · ${book.unavailablePages.length} audio pages unavailable` : ''}</small>
      <span class="story-activity-description">聽每一頁，再放回剛才聽到的一個字。</span><span class="story-activity-status">${complete ? '已完成 · 再玩 →' : 'Start →'}</span>
    </button>`;
  }

  function shuffle(items, random) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function balancedAnswerSlots(count, random = Math.random) {
    if (!count) return [];
    const base = Math.floor(count / OPTION_LABELS.length);
    const bonusLabels = new Set(shuffle(OPTION_LABELS.map((_, index) => index), random).slice(0, count % OPTION_LABELS.length));
    const slots = OPTION_LABELS.flatMap((_, index) => Array(base + (bonusLabels.has(index) ? 1 : 0)).fill(index));
    let ordered = shuffle(slots, random);
    // Keep the distribution balanced while avoiding an obvious repeated-answer lane.
    for (let attempt = 0; attempt < 200 && ordered.some((slot, index) => index > 0 && slot === ordered[index - 1]); attempt += 1) {
      ordered = shuffle(slots, random);
    }
    return ordered;
  }

  function createQuestionPlan(bookOrId, random = Math.random, sourceBooks = BOOKS) {
    const book = typeof bookOrId === 'string' ? sourceBooks.find((candidate) => candidate.id === bookOrId) : bookOrId;
    if (!book?.pages?.length) return [];
    const pageAnswer = (page) => blankAnswer(page);
    const localWordPool = book.pages.flatMap((page) => [pageAnswer(page), ...(page.choices || [])].filter(Boolean));
    const allWordPool = sourceBooks.flatMap((candidateBook) => candidateBook.pages.flatMap((page) => [pageAnswer(page), ...(page.choices || [])].filter(Boolean)));
    const answerSlots = balancedAnswerSlots(book.pages.length, random);

    return book.pages.map((page, pageIndex) => {
      const answer = pageAnswer(page);
      if (!answer) {
        return { listenOnly: true, correctIndex: -1, answer: '', choices: new Array() };
      }
      const existingChoices = [...new Set([answer, ...(page.choices || [])].filter(Boolean))];
      const used = new Set(existingChoices.map(normalizeOption));
      const visible = new Set((page.sentence || []).map(normalizeOption));
      const findCandidates = (pool) => [...new Map(pool
        .filter((word) => {
          const key = normalizeOption(word);
          const wantsPhrase = answer.includes(' ');
          return key && !used.has(key) && !visible.has(key) && key.length <= 24 && (!wantsPhrase || String(word).includes(' '));
        })
        .map((word) => [normalizeOption(word), word])).values()];
      let candidates = findCandidates(localWordPool);
      if (!candidates.length) candidates = findCandidates(allWordPool);
      const answerLength = normalizeOption(answer).length;
      const closest = candidates.sort((left, right) => Math.abs(normalizeOption(left).length - answerLength) - Math.abs(normalizeOption(right).length - answerLength)).slice(0, 12);
      const extraDistractor = closest.length ? closest[Math.floor(random() * closest.length)] : (answer.includes(' ') ? 'happy park' : 'story');
      const choices = [...existingChoices.slice(0, 3), extraDistractor];
      while (choices.length < 4 || new Set(choices.map(normalizeOption)).size < 4) {
        const fallbackPool = answer.includes(' ') ? PHRASE_FALLBACKS : ['family', 'school', 'happy', 'playing'];
        const fallback = fallbackPool.find((word) => !choices.some((choice) => normalizeOption(choice) === normalizeOption(word)));
        if (!fallback) break;
        choices.push(fallback);
      }
      const correctIndex = answerSlots[pageIndex];
      const distractors = shuffle(choices.filter((word) => normalizeOption(word) !== normalizeOption(answer)), random);
      distractors.splice(correctIndex, 0, answer);
      return { choices: distractors, correctIndex, answer };
    });
  }

  function muted() { try { return !!window.KakaStorage?.loadState?.().muted; } catch { return false; } }
  function stopAudio() { $$('audio[data-story-demo]').forEach((audio) => { audio.pause(); audio.currentTime = 0; }); }
  function invalidatePlayback() { viewGen += 1; readToken += 1; reading = false; stopAudio(); speech.cancelAllSpeech?.(); }
  function show(name) {
    invalidatePlayback();
    $$('.screen').forEach((screen) => screen.classList.remove('active'));
    const screen = $(`#screen-${name}`);
    screen?.classList.add('active');
    window.KakaStarFx?.mountPlayScreen?.(screen);
  }
  function home() {
    invalidatePlayback();
    activeBookId = null;
    if (window.KakaPhonics?.openEnglishHub) window.KakaPhonics.openEnglishHub();
    else if (window.KakaLearn?.goHome) window.KakaLearn.goHome();
    else show('home');
  }
  function activeBook() { return BOOKS.find((book) => book.id === activeBookId) || null; }
  function activeSeries() { return SERIES.find((series) => series.id === currentSeriesId) || SERIES[0]; }
  function pages() { return activeBook()?.pages || []; }
  function current() { return pages()[pageIndex]; }
  function totalPages(books = BOOKS) { return books.reduce((sum, book) => sum + book.pages.length, 0); }

  function renderSeriesChooser() {
    const grid = $('#story-series-grid');
    if (!grid) return;
    grid.innerHTML = SERIES.map((series) => `<button type="button" class="story-activity-card story-activity-card--read" data-series-id="${series.id}">
      <img class="story-activity-image" src="${series.image || ''}" alt="" loading="lazy" decoding="async">
      <strong>${series.title}</strong><small>${series.books.length} books · ${series.range}</small>
      <span class="story-activity-description">${series.description}</span><span class="story-activity-status">Open stories →</span>
    </button>`).join('');
    $$('[data-series-id]', grid).forEach((button) => button.addEventListener('click', () => openHub(button.dataset.seriesId)));
  }

  function renderHub() {
    const series = activeSeries();
    $('#story-demo-complete').textContent = `${BOOKS.length} books`;
    const heroCover = $('#story-demo-hero-cover');
    const heroKicker = $('#story-demo-kicker');
    const heroTitle = $('#story-demo-hero-title');
    if (heroCover) heroCover.src = BOOKS[0].cover || BOOKS[0].pages[0]?.image || '';
    if (heroKicker) heroKicker.textContent = `${series.label} · ${series.range}`;
    if (heroTitle) heroTitle.textContent = series.title;
    const reviewNote = $('#story-demo-review-note');
    if (reviewNote) {
      const review = window.KakaWackyRickyManifest?.reviewSummary;
      reviewNote.hidden = currentSeriesId !== 'wacky-ricky';
      reviewNote.textContent = currentSeriesId === 'wacky-ricky' && review
        ? `Adult preview: all ${review.pageClips} page recordings are awaiting listening review; ${review.priorityListenPages} are priority checks. ${review.unavailablePages} pages have no reliable clip and are unavailable.`
        : '';
    }
    const grid = $('#story-demo-activity-grid');
    const showCompletion = currentSeriesId === 'wacky-ricky';
    const passedKeys = showCompletion ? passedStoryKeys() : {};
    grid.innerHTML = BOOKS.map((book) => bookShelfCardHtml(book, {
      complete: showCompletion && isWackyBookComplete(book, passedKeys),
    })).join('');
    $$('[data-book-id]', grid).forEach((button) => {
      button.addEventListener('click', () => startBook(button.dataset.bookId));
    });
  }

  function openSeriesChooser() { activeBookId = null; renderSeriesChooser(); show('story-series'); }
  function openHub(seriesId = currentSeriesId) {
    const series = SERIES.find((item) => item.id === seriesId);
    if (!series?.books?.length) return;
    currentSeriesId = series.id;
    BOOKS = series.books;
    activeBookId = null;
    renderHub();
    show('story-demo');
  }
  function startBook(bookId) {
    const book = BOOKS.find((item) => item.id === bookId);
    if (!book) return;
    activeBookId = bookId;
    pageIndex = 0;
    questionPlan = createQuestionPlan(book, Math.random, BOOKS);
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
    const listenBtn = $('#btn-story-listen');
    if (!audio) return;
    if (feedback) { feedback.textContent = 'Listening…'; feedback.className = 'feedback'; }
    if (listenBtn) listenBtn.disabled = true;
    audio.currentTime = 0;
    audio.onended = () => {
      if (listenBtn) listenBtn.disabled = false;
      if (after) after();
      else if (feedback) {
        feedback.textContent = pageHasFill(current()) ? 'Now fill the missing word.' : 'Now tap Next page.';
      }
    };
    audio.onerror = () => {
      if (listenBtn) listenBtn.disabled = false;
      if (feedback) { feedback.textContent = 'Audio could not play. Please try again.'; feedback.className = 'feedback retry'; }
    };
    audio.play().catch(() => {
      if (listenBtn) listenBtn.disabled = false;
      if (feedback) { feedback.textContent = 'Tap Listen to play the story.'; feedback.className = 'feedback retry'; }
    });
  }

  function pageHasFill(item) {
    return Boolean(item?.blanks?.[0]);
  }

  function lastTokenIndex(sentence, word) {
    for (let index = sentence.length - 1; index >= 0; index -= 1) {
      if (sentence[index] === word) return index;
    }
    return -1;
  }

  function lastPhraseIndex(sentence, first, second) {
    for (let index = sentence.length - 2; index >= 0; index -= 1) {
      if (sentence[index] === first && sentence[index + 1] === second) return index;
    }
    return -1;
  }

  function tokenMarkup(item, { filled = false } = {}) {
    const blanks = item.blanks || [];
    const phrase = blanks.length >= 2;
    const answer = blankAnswer(item);
    const phraseStart = phrase ? lastPhraseIndex(item.sentence, blanks[0], blanks[1]) : -1;
    const wordIndex = phrase ? -1 : lastTokenIndex(item.sentence, blanks[0]);
    return item.sentence.map((word, index) => {
      const isStart = phrase ? index === phraseStart : index === wordIndex;
      const isTail = phrase && index === phraseStart + 1;
      if (isTail) return '';
      if (isStart && !filled) {
        return `<button type="button" class="story-fill-blank story-sentence-token${phrase ? ' is-phrase' : ''}" data-sentence-index="${index}" data-blank="${answer}" aria-label="${phrase ? 'Missing words' : 'Missing word'}">${selectedWord || (phrase ? '? ?' : '?')}</button>`;
      }
      if (isStart && filled) {
        return `<span class="story-sentence-word story-sentence-token is-filled" data-sentence-index="${index}">${selectedWord || answer || word}</span>`;
      }
      return `<span class="story-sentence-word story-sentence-token" data-sentence-index="${index}">${word}</span>`;
    }).filter(Boolean).join(' ');
  }

  function setReadingUi(disabled) {
    const fillLocked = phase !== 'fill' || solved;
    $$('.story-fill-tile, #btn-story-submit, #btn-story-read-sentence, #btn-story-listen').forEach((element) => {
      if (element.id === 'btn-story-listen') {
        element.disabled = disabled || busy;
        return;
      }
      element.disabled = disabled || busy || fillLocked || (element.id === 'btn-story-submit' && !selectedWord);
    });
  }

  function clearSentenceHighlight() {
    $$('.story-sentence-token').forEach((element) => element.classList.remove('is-speaking'));
  }

  function unlockFill() {
    if (solved || phase === 'fill') return;
    phase = 'fill';
    $('#story-play-lead').textContent = '聽英文句子，揀字，再按 Submit。';
    const help = $('.story-fill-help');
    if (help) help.hidden = false;
    $('#btn-story-read-sentence')?.removeAttribute('hidden');
    $('#btn-story-submit')?.removeAttribute('hidden');
    $$('.story-fill-tile').forEach((tile) => {
      tile.disabled = false;
      tile.draggable = true;
    });
    $$('.story-fill-blank').forEach((blank) => { blank.disabled = false; });
    const submit = $('#btn-story-submit');
    if (submit) submit.disabled = !selectedWord;
    const feedback = $('#story-play-feedback');
    if (feedback && !feedback.classList.contains('ok')) {
      feedback.textContent = 'Now fill the missing word.';
      feedback.className = 'feedback';
    }
  }

  function lockFillForStory() {
    phase = 'listen';
    $('#story-play-lead').textContent = '先聽這一頁故事；聽完就可以揀字。';
    const help = $('.story-fill-help');
    if (help) help.hidden = true;
    $('#btn-story-read-sentence')?.setAttribute('hidden', '');
    $('#btn-story-submit')?.setAttribute('hidden', '');
    $$('.story-fill-tile').forEach((tile) => {
      tile.disabled = true;
      tile.draggable = false;
    });
    $$('.story-fill-blank').forEach((blank) => { blank.disabled = true; });
  }

  function readSentenceWithHighlight(item, onEnd = null) {
    if (phase !== 'fill' || solved) return;
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
      fallbackTimer = setTimeout(moveOn, (speech.estimateSpeakMs?.(item.sentence[wordIndex], { rate: 0.98, delayMs: 60 }) || 1200) + 280);
      speech.speakEnglishTerm?.(item.sentence[wordIndex], { rate: 0.98, pitch: 1.05, onEnd: moveOn });
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

  function awardStoryPageStar(item) {
    const storage = window.KakaStorage;
    if (!storage?.loadState || !storage?.tryEarnStar || !storage?.updateState) return Promise.resolve(false);
    const pageKey = storyPageKey(activeBookId, item, pageIndex);
    const before = storage.loadState();
    if (before.passedKeys?.[pageKey]) return Promise.resolve(false);
    const result = storage.tryEarnStar();
    const after = storage.loadState();
    storage.updateState({ passedKeys: { ...(after.passedKeys || {}), [pageKey]: true } });
    const screen = $('#screen-story-play');
    window.KakaStarFx?.mountPlayScreen?.(screen);
    if (!result.gained || !window.KakaStarFx?.flyStarFromRanger) return Promise.resolve(result.gained);
    return new Promise((resolve) => window.KakaStarFx.flyStarFromRanger(screen, () => resolve(true)));
  }

  function selectWord(word) {
    const item = current();
    const choices = questionPlan[pageIndex]?.choices || item.choices;
    if (busy || reading || solved || phase !== 'fill' || !choices.includes(word)) return;
    selectedWord = word;
    const blank = $('.story-fill-blank');
    if (blank) { blank.textContent = word; blank.classList.add('has-selection'); }
    $$('.story-fill-tile').forEach((tile) => tile.classList.toggle('selected', tile.dataset.word === word));
    const submit = $('#btn-story-submit');
    if (submit) submit.disabled = false;
    $('#story-play-feedback').textContent = 'Now press Submit.';
    $('#story-play-feedback').className = 'feedback';
    speech.cancelAllSpeech?.();
    speech.speakEnglishTerm?.(word, { rate: 1.0, pitch: 1.05 });
  }

  function completeListenOnlyPage(item) {
    if (solved) return;
    solved = true;
    busy = false;
    phase = 'fill';
    const list = pages();
    const feedback = $('#story-play-feedback');
    if (feedback) { feedback.textContent = 'Great listening!'; feedback.className = 'feedback ok'; }
    $('#story-play-lead').textContent = '呢一頁聽完就可以去下一頁。';
    $('#story-play-stage')?.classList.add('is-solved');
    $('#story-play-stage')?.classList.remove('is-listening');
    const panel = $('.story-fill-panel');
    if (panel && !$('#btn-story-next')) {
      panel.insertAdjacentHTML('beforeend', `<button type="button" class="btn btn-primary story-next-page" id="btn-story-next">${pageIndex === list.length - 1 ? 'Finish story →' : 'Next page →'}</button>`);
      $('#btn-story-next')?.addEventListener('click', nextPage);
    }
    void awardStoryPageStar(item);
    speakPraise();
  }

  function afterStoryAudio(item) {
    $('#story-play-stage')?.classList.remove('is-listening');
    if (solved) return;
    if (pageHasFill(item)) unlockFill();
    else completeListenOnlyPage(item);
  }

  function renderChallenge({ autoPlay = false } = {}) {
    const book = activeBook();
    const item = current();
    const hasFill = pageHasFill(item);
    const choices = hasFill ? (questionPlan[pageIndex]?.choices || item.choices || []) : [];
    const list = pages();
    const stage = $('#story-play-stage');
    const locked = phase === 'listen' && !solved;
    $('#btn-back-story-play').textContent = `← ${activeSeries().title} 書架`;
    $('#story-play-title').textContent = 'Read & Fill';
    const phrase = pageHasPhrase(item);
    $('#story-play-lead').textContent = !hasFill
      ? (locked ? '先聽這一頁故事。' : '呢一頁聽完就可以去下一頁。')
      : locked
        ? '先聽這一頁故事；聽完就可以揀字。'
        : (phrase ? '聽英文句子，揀兩個字，再按 Submit。' : '聽英文句子，揀字，再按 Submit。');
    $('#story-round-progress').textContent = `${pageIndex + 1}/${list.length}`;
    stage.classList.add('story-page-challenge');
    stage.classList.toggle('is-listening', locked);
    stage.classList.toggle('is-solved', solved);
    stage.innerHTML = `<div class="story-challenge-story">
        <div class="story-challenge-image-wrap"><img class="story-challenge-page" src="${item.image}" alt="${book.title}, page ${pageIndex + 1}" decoding="async"></div>
        <button type="button" class="btn btn-secondary story-story-listen" id="btn-story-listen">🔊 Listen to the story</button>
        <audio data-story-demo preload="metadata" src="${item.audio}"></audio>
      </div>
      <section class="story-fill-panel" aria-label="${hasFill ? 'Sentence fill activity' : 'Story listen activity'}">
        <p class="story-source-tag">${book.title} · PDF page ${item.pdfPage}</p>
        <h2>${hasFill ? (phrase ? 'Fill the missing words' : 'Fill the missing word') : 'Listen to this page'}</h2>
        <p class="story-fill-sentence">${tokenMarkup(item, { filled: solved || !hasFill })}</p>
        <button type="button" class="btn btn-ghost story-sentence-listen" id="btn-story-read-sentence"${!hasFill || locked || solved ? ' hidden' : ''}>🔊 Read this sentence</button>
        <p class="story-fill-help"${!hasFill || locked ? ' hidden' : ''}>${phrase ? 'Choose the two missing words, then press Submit.' : 'Choose one word, then press Submit.'}</p>
        ${hasFill ? `<div class="story-fill-bank" id="story-fill-bank">${choices.map((word, index) => `<button type="button" class="story-fill-tile${selectedWord === word ? ' selected' : ''}${solved && normalizeOption(word) === normalizeOption(blankAnswer(item)) ? ' correct' : ''}" draggable="${!locked && !busy && !reading && !solved}" data-word="${word}"${locked || busy || reading || solved ? ' disabled' : ''}><span class="story-choice-label" aria-hidden="true">${OPTION_LABELS[index]}</span><span class="story-choice-word">${word}</span></button>`).join('')}</div>
        <button type="button" class="btn btn-primary story-fill-submit" id="btn-story-submit"${locked || solved ? ' hidden' : ''}${!selectedWord || busy || reading ? ' disabled' : ''}>Submit</button>` : ''}
      </section>`;
    $('#story-play-actions').innerHTML = '';
    $('#story-play-options').innerHTML = '';
    $('#btn-story-listen')?.addEventListener('click', () => {
      if (busy || reading) return;
      speech.cancelAllSpeech?.();
      if (!solved && hasFill) lockFillForStory();
      stage.classList.add('is-listening');
      playPageAudio({ after: () => afterStoryAudio(item) });
    });
    $('#btn-story-read-sentence')?.addEventListener('click', () => readSentenceWithHighlight(item));
    $$('.story-fill-tile', stage).forEach((tile) => {
      tile.addEventListener('click', () => selectWord(tile.dataset.word));
      tile.addEventListener('dragstart', (event) => event.dataTransfer?.setData('text/plain', tile.dataset.word));
    });
    $$('.story-fill-blank', stage).forEach((blank) => {
      blank.disabled = locked || solved;
      blank.addEventListener('dragover', (event) => event.preventDefault());
      blank.addEventListener('drop', (event) => { event.preventDefault(); selectWord(event.dataTransfer?.getData('text/plain')); });
    });
    $('#btn-story-submit')?.addEventListener('click', submitWord);
    if (autoPlay) {
      playPageAudio({ after: () => afterStoryAudio(item) });
    }
  }

  function submitWord() {
    const item = current();
    const list = pages();
    const word = selectedWord;
    if (busy || reading || solved || phase !== 'fill' || !word) return;
    const blank = $('.story-fill-blank');
    if (normalizeOption(word) !== normalizeOption(blankAnswer(item))) {
      const tile = $$('.story-fill-tile').find((candidate) => candidate.dataset.word === word);
      tile?.classList.add('wrong');
      speech.playTryAgainCue?.({ muted: muted() });
      $('#story-play-feedback').textContent = 'That’s okay. Try again!';
      $('#story-play-feedback').className = 'feedback retry';
      selectedWord = null;
      if (blank) { blank.textContent = pageHasPhrase(item) ? '? ?' : '?'; blank.classList.remove('has-selection'); }
      $$('.story-fill-tile').forEach((candidate) => candidate.classList.remove('selected'));
      const submit = $('#btn-story-submit');
      if (submit) submit.disabled = true;
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
    $$('.story-fill-blank').forEach((el) => { el.disabled = true; });
    $('#btn-story-submit')?.setAttribute('hidden', '');
    $('#btn-story-read-sentence')?.setAttribute('hidden', '');
    $('.story-fill-help')?.setAttribute('hidden', '');
    $('#story-play-stage')?.classList.add('is-solved');
    $('#story-play-stage')?.classList.remove('is-listening');
    speech.playCorrectCue?.({ muted: muted() });
    const feedback = $('#story-play-feedback');
    feedback.textContent = 'Great job!'; feedback.className = 'feedback ok';
    // A correct answer must never be held hostage by a speech or animation
    // completion callback (both can be delayed on iPad Safari).
    $('#btn-story-submit')?.remove();
    if (!$('#btn-story-next')) {
      $('#story-fill-bank').insertAdjacentHTML('afterend', `<button type="button" class="btn btn-primary story-next-page" id="btn-story-next">${pageIndex === list.length - 1 ? 'Finish story →' : 'Next page →'}</button>`);
      $('#btn-story-next')?.addEventListener('click', nextPage);
    }
    void awardStoryPageStar(item);
    speakPraise();
  }

  function nextPage() {
    invalidatePlayback();
    const list = pages();
    if (pageIndex >= list.length - 1) return finish();
    pageIndex += 1; phase = 'listen'; busy = false; selectedWord = null; solved = false; renderPage();
  }

  function finish() {
    invalidatePlayback();
    const book = activeBook();
    const list = pages();
    $('#story-play-title').textContent = 'Great reading!';
    $('#story-play-lead').textContent = 'You listened to the story and filled every sentence.';
    $('#story-round-progress').textContent = `${list.length}/${list.length}`;
    $('#story-play-stage').classList.remove('story-page-challenge', 'is-listening', 'is-solved');
    const missingPages = book.unavailablePages?.length || 0;
    const finishNote = missingPages ? `${missingPages} page${missingPages === 1 ? ' is' : 's are'} unavailable because no reliable recording is ready yet.` : 'Read the story again whenever you like.';
    if (currentSeriesId === 'wacky-ricky') markStoryBookComplete(book);
    $('#story-play-stage').innerHTML = `<div class="story-finish"><span>★</span><h2>${book.title} Complete!</h2><p>${finishNote}</p></div>`;
    $('#story-play-actions').innerHTML = '<button type="button" class="btn btn-secondary" id="btn-story-restart">Read again</button>';
    $('#story-play-options').innerHTML = `<button type="button" class="story-answer" id="btn-story-home">Back to ${activeSeries().title} Books</button>`;
    $('#btn-story-restart')?.addEventListener('click', () => startBook(book.id));
    $('#btn-story-home')?.addEventListener('click', () => openHub());
  }

  function renderPage() {
    stopAudio(); viewGen += 1;
    const feedback = $('#story-play-feedback'); feedback.textContent = ''; feedback.className = 'feedback';
    $('#story-play-stage').classList.remove('story-page-challenge', 'is-listening', 'is-solved');
    renderChallenge({ autoPlay: phase === 'listen' && !solved });
  }

  function init() {
    speech.warmVoices?.();
    speech.warmEnglishVoice?.();
    $('#btn-start-story-demo')?.addEventListener('click', openSeriesChooser);
    $('#btn-back-story-series')?.addEventListener('click', home);
    $('#btn-back-story-demo')?.addEventListener('click', openSeriesChooser);
    $('#btn-back-story-play')?.addEventListener('click', () => openHub());
  }

  init();
  window.KakaStoryDemo = {
    open: openSeriesChooser,
    openSeries: openHub,
    series: SERIES.map((series) => ({ id: series.id, title: series.title, bookCount: series.books.length, pageCount: totalPages(series.books) })),
    books: CARTER_BOOKS.map((book) => ({ id: book.id, title: book.title, pageCount: book.pages.length })),
    pageCount: totalPages(CARTER_BOOKS),
    createQuestionPlan,
    storyPageKey,
    storyBookKey,
    isWackyBookComplete,
    bookShelfCardHtml,
    markStoryBookComplete,
  };
}());

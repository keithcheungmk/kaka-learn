/* STORY ENGLISH — CF001 Game Night.
 * PDF page pictures and matching page clips are selected derivatives of the
 * school-supplied Carter Family source. Mission lines cite their source clip.
 */
(function () {
  const speech = window.KakaSpeech;
  if (!speech) return console.error('KakaStoryDemo: KakaSpeech is required.');

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const unitDone = { read: false, mission: false };
  let activeKind = null;
  let activeIndex = 0;
  let busy = false;
  let viewGen = 0;
  let delayedAdvance = null;

  const pageImage = (page) => `./assets/story-demo/pages/page-${String(page).padStart(2, '0')}.jpg`;
  const pageAudio = (page) => `./assets/story-demo/cf001-game-night-page-${String(page).padStart(2, '0')}.mp3`;
  const STORY_PAGES = Array.from({ length: 12 }, (_, i) => ({ page: i + 1, image: pageImage(i + 1), audio: pageAudio(i + 1) }));

  // PDF page refers to the supplied PDF. sourceClip is the original pre-derivative clip.
  const STORY_LINES = {
    invitation: { text: 'Let’s have a Game Night!', page: 1, pdfPage: 3, sourceClip: '86.mp3' },
    boardGame: { text: 'First everybody played a board game.', page: 1, pdfPage: 3, sourceClip: '86.mp3' },
    sixSpaces: { text: 'I get to move six spaces!', page: 3, pdfPage: 5, sourceClip: '88.mp3' },
    won: { text: 'I won!', page: 5, pdfPage: 7, sourceClip: '90.mp3' },
    sport: { text: 'Be a good sport, Harry.', page: 5, pdfPage: 7, sourceClip: '90.mp3' },
    seal: { text: 'Are you a seal?', page: 9, pdfPage: 11, sourceClip: '94.mp3' },
  };

  const MISSION = [
    { type: 'scene', line: STORY_LINES.invitation, choices: [1, 5, 9], prompt: 'Listen. Which story picture matches?' },
    { type: 'scene', line: STORY_LINES.won, choices: [1, 5, 9], prompt: 'Listen. Which story picture matches?' },
    { type: 'word', line: STORY_LINES.invitation, target: 'Game', choices: ['Game', 'Night', 'have'] },
    { type: 'word', line: STORY_LINES.boardGame, target: 'board', choices: ['everybody', 'board', 'played'] },
    { type: 'word', line: STORY_LINES.sixSpaces, target: 'six', choices: ['move', 'six', 'spaces'] },
    { type: 'build', line: STORY_LINES.won, words: ['I', 'won!'] },
    { type: 'build', line: STORY_LINES.sport, words: ['Be', 'a', 'good', 'sport,', 'Harry.'] },
    { type: 'sentence', line: STORY_LINES.seal, choices: ['Are you a seal?', 'I am a seal.', 'Are you a bird?'] },
    { type: 'meaning', line: STORY_LINES.won, question: 'Who won the board game?', choices: ['Harry', 'Emmy', 'Aunt Judy'], answer: 'Harry' },
    { type: 'echo', line: STORY_LINES.invitation },
  ];

  const ACTIVITIES = {
    read: { title: 'Read the Story', count: 12, countLabel: 'pages', lead: '撳 Listen，跟住原本故事錄音逐頁聽。', items: STORY_PAGES },
    mission: { title: 'Story Mission', count: MISSION.length, countLabel: 'questions', lead: '同一個故事，聽句子、找字、砌句子、再讀一次。', items: MISSION },
  };

  function muted() { try { return !!window.KakaStorage?.loadState?.().muted; } catch { return false; } }
  function clearDelayedAdvance() { if (delayedAdvance) clearTimeout(delayedAdvance); delayedAdvance = null; }
  function stopAudio() { $$('audio[data-story-demo]').forEach((audio) => { audio.pause(); audio.currentTime = 0; }); }
  function invalidatePlayback() { viewGen += 1; clearDelayedAdvance(); stopAudio(); speech.cancelAllSpeech?.(); }
  function show(name) { invalidatePlayback(); $$('.screen').forEach((screen) => screen.classList.remove('active')); $(`#screen-${name}`)?.classList.add('active'); window.KakaStarFx?.hideRanger?.(); }
  function home() { invalidatePlayback(); if (window.KakaLearn?.goHome) window.KakaLearn.goHome(); else show('home'); }
  function completeCount() { return Object.values(unitDone).filter(Boolean).length; }

  function renderHub() {
    const complete = $('#story-demo-complete');
    if (complete) complete.textContent = `${completeCount()}/2`;
    const grid = $('#story-demo-activity-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(ACTIVITIES).map(([kind, activity]) => {
      const done = unitDone[kind];
      const cover = kind === 'read' ? pageImage(1) : pageImage(5);
      const description = kind === 'read' ? '電子書・原本逐頁錄音' : '故事句子・10 題任務';
      return `<button type="button" class="story-activity-card story-activity-card--${kind}${done ? ' is-done' : ''}" data-story-kind="${kind}">
        <img class="story-activity-image" src="${cover}" alt="" loading="lazy" decoding="async"><strong>${activity.title}</strong>
        <small>${activity.count} ${activity.countLabel}</small><span class="story-activity-description">${description}</span>
        <span class="story-activity-status">${done ? '✓ Finished' : 'Start →'}</span></button>`;
    }).join('');
    $$('[data-story-kind]', grid).forEach((button) => button.addEventListener('click', () => start(button.dataset.storyKind)));
  }

  function openHub() { activeKind = null; renderHub(); show('story-demo'); }
  function start(kind) { if (!ACTIVITIES[kind]) return; activeKind = kind; activeIndex = 0; busy = false; show('story-play'); renderPlay(); }
  function goToMissionFinish() { unitDone.mission = true; activeKind = 'mission-finish'; renderPlay(); }
  function advance() {
    const activity = ACTIVITIES[activeKind];
    if (!activity) return;
    if (activeIndex >= activity.items.length - 1) {
      if (activeKind === 'mission') return goToMissionFinish();
      unitDone[activeKind] = true;
      speech.playCorrectCue?.({ muted: muted() });
      const feedback = $('#story-play-feedback');
      if (feedback) { feedback.textContent = 'Great job! Finished!'; feedback.className = 'feedback ok'; }
      const currentGen = viewGen;
      delayedAdvance = setTimeout(() => { if (currentGen === viewGen) openHub(); }, 700);
      return;
    }
    activeIndex += 1; busy = false; renderPlay();
  }
  function previousPage() { if (activeKind === 'read' && activeIndex > 0) { activeIndex -= 1; renderPlay(); } }

  function audioMarkup(page) { return `<button type="button" class="btn btn-secondary" id="btn-story-audio">🔊 Listen to this page</button><audio data-story-demo preload="metadata" src="${pageAudio(page)}"></audio>`; }
  function bindPageAudio({ onEnded = null } = {}) {
    $('#btn-story-audio')?.addEventListener('click', () => {
      const audio = $('audio[data-story-demo]');
      if (!audio) return;
      const feedback = $('#story-play-feedback');
      if (feedback) { feedback.textContent = 'Listening…'; feedback.className = 'feedback'; }
      audio.currentTime = 0;
      audio.onended = () => { if (typeof onEnded === 'function') onEnded(); else if (feedback) feedback.textContent = 'Now try the story activity.'; };
      audio.onerror = () => { if (feedback) { feedback.textContent = 'Audio could not play. Please try again.'; feedback.className = 'feedback retry'; } };
      audio.play().catch(() => { if (feedback) { feedback.textContent = 'Audio could not play. Please try again.'; feedback.className = 'feedback retry'; } });
    });
  }

  function renderRead(item) {
    $('#story-play-stage').innerHTML = `<div class="story-book-frame"><img class="story-book-page" src="${item.image}" alt="Game Night, page ${item.page}" decoding="async"></div>`;
    $('#story-play-actions').innerHTML = `<button type="button" class="btn btn-ghost" id="btn-story-prev" ${item.page === 1 ? 'disabled' : ''}>← Previous</button>${audioMarkup(item.page)}`;
    $('#btn-story-prev')?.addEventListener('click', previousPage);
    bindPageAudio({ onEnded: advance });
  }
  function resolveAnswer(item) { if (item.type === 'scene') return String(item.line.page); if (item.type === 'word') return item.target; if (item.type === 'sentence') return item.line.text; return item.answer || ''; }
  function finishCorrect(button, success = 'Great reading!') {
    if (busy) return; busy = true; button?.classList.add('correct'); speech.playCorrectCue?.({ muted: muted() });
    const feedback = $('#story-play-feedback'); if (feedback) { feedback.textContent = success; feedback.className = 'feedback ok'; }
    const currentGen = viewGen; delayedAdvance = setTimeout(() => { if (currentGen === viewGen) advance(); }, 760);
  }
  function markWrong(button) { button.classList.add('wrong'); setTimeout(() => button.classList.remove('wrong'), 420); speech.playTryAgainCue?.({ muted: muted() }); const feedback = $('#story-play-feedback'); if (feedback) { feedback.textContent = 'Try again! Listen once more if you need to.'; feedback.className = 'feedback retry'; } }

  function renderChoiceQuestion(item) {
    const { line } = item;
    const stage = $('#story-play-stage'); const options = $('#story-play-options');
    $('#story-play-actions').innerHTML = audioMarkup(line.page); bindPageAudio();
    if (item.type === 'scene') {
      stage.innerHTML = `<h2>${item.prompt}</h2><p class="story-sentence-hint">Tap Listen, then choose the matching story picture.</p>`;
      options.innerHTML = item.choices.map((page) => `<button type="button" class="story-scene-option" data-answer="${page}"><img src="${pageImage(page)}" alt="Game Night story picture ${page}" decoding="async"></button>`).join('');
    } else {
      const question = item.type === 'meaning' ? item.question : 'Find the word in the story sentence.';
      stage.innerHTML = `<img class="story-learning-image" src="${pageImage(line.page)}" alt="Game Night story scene" decoding="async"><p class="story-source-tag">Game Night · PDF page ${line.pdfPage} · source clip ${line.sourceClip}</p><h2>${question}</h2><p class="story-sentence-strip">${line.text}</p>`;
      options.innerHTML = item.choices.map((choice) => `<button type="button" class="story-answer" data-answer="${choice}">${choice}</button>`).join('');
    }
    const answer = resolveAnswer(item);
    $$('[data-answer]', options).forEach((button) => button.addEventListener('click', () => button.dataset.answer === answer ? finishCorrect(button) : markWrong(button)));
  }

  function renderBuild(item) {
    const order = [...item.words].sort((a, b) => a.localeCompare(b)); const chosen = [];
    $('#story-play-stage').innerHTML = `<img class="story-learning-image" src="${pageImage(item.line.page)}" alt="Game Night story scene" decoding="async"><h2>Build the sentence</h2><p class="story-sentence-hint">Listen, then tap the words in order.</p><div class="story-build-slots" id="story-build-slots" aria-label="Sentence being built"></div>`;
    $('#story-play-actions').innerHTML = audioMarkup(item.line.page); bindPageAudio();
    $('#story-play-options').innerHTML = order.map((word, index) => `<button type="button" class="story-answer" data-build-index="${index}">${word}</button>`).join('');
    const slots = $('#story-build-slots');
    const updateSlots = () => { slots.innerHTML = item.words.map((_, index) => `<span class="story-build-slot">${chosen[index] || '…'}</span>`).join(''); };
    updateSlots();
    $$('[data-build-index]').forEach((button) => button.addEventListener('click', () => {
      if (busy || button.disabled) return;
      const word = button.textContent;
      if (word !== item.words[chosen.length]) return markWrong(button);
      chosen.push(word); button.disabled = true; button.classList.add('selected'); updateSlots();
      if (chosen.length === item.words.length) finishCorrect(button, `You built: ${item.line.text}`);
    }));
  }

  function renderEcho(item) {
    $('#story-play-stage').innerHTML = `<img class="story-learning-image" src="${pageImage(item.line.page)}" alt="Game Night story scene" decoding="async"><h2>Read it with the story</h2><p class="story-sentence-strip">${item.line.text}</p><p>Tap Listen, say the sentence aloud, then press “I read it!”</p>`;
    $('#story-play-actions').innerHTML = audioMarkup(item.line.page); bindPageAudio();
    $('#story-play-options').innerHTML = '<button type="button" class="story-answer story-read-it" id="btn-story-read-it">I read it!</button>';
    $('#btn-story-read-it')?.addEventListener('click', (event) => finishCorrect(event.currentTarget, 'Wonderful reading!'));
  }

  function renderMissionFinish() {
    const recap = [STORY_LINES.invitation, STORY_LINES.won, STORY_LINES.seal];
    $('#story-play-stage').innerHTML = `<div class="story-mission-finish"><span>★</span><h2>Story Mission Complete!</h2><p>You listened, found words, built sentences, and read with Game Night.</p><div class="story-recap-lines">${recap.map((line) => `<button type="button" data-recap-page="${line.page}">${line.text}</button>`).join('')}</div></div>`;
    $('#story-play-actions').innerHTML = '<button type="button" class="btn btn-secondary" id="btn-story-replay">Read the story again</button>';
    $('#story-play-options').innerHTML = '<button type="button" class="story-answer" id="btn-story-finish">Back to Game Night</button>';
    $$('[data-recap-page]').forEach((button) => button.addEventListener('click', () => new Audio(pageAudio(Number(button.dataset.recapPage))).play().catch(() => {})));
    $('#btn-story-replay')?.addEventListener('click', () => start('read'));
    $('#btn-story-finish')?.addEventListener('click', openHub);
  }

  function renderPlay() {
    clearDelayedAdvance(); stopAudio(); viewGen += 1;
    const feedback = $('#story-play-feedback'); if (feedback) { feedback.textContent = ''; feedback.className = 'feedback'; }
    if (activeKind === 'mission-finish') {
      $('#story-play-title').textContent = 'Story Mission'; $('#story-play-lead').textContent = 'Read the story sentences again whenever you like.'; $('#story-round-progress').textContent = '10/10'; renderMissionFinish(); return;
    }
    const activity = ACTIVITIES[activeKind]; const item = activity?.items[activeIndex]; if (!activity || !item) return openHub();
    $('#story-play-title').textContent = activity.title; $('#story-play-lead').textContent = activity.lead; $('#story-round-progress').textContent = `${activeIndex + 1}/${activity.items.length}`; $('#story-play-options').innerHTML = '';
    if (activeKind === 'read') renderRead(item);
    else if (item.type === 'build') renderBuild(item);
    else if (item.type === 'echo') renderEcho(item);
    else renderChoiceQuestion(item);
  }

  function init() { $('#btn-start-story-demo')?.addEventListener('click', openHub); $('#btn-back-story-demo')?.addEventListener('click', home); $('#btn-back-story-play')?.addEventListener('click', openHub); }
  init();
  window.KakaStoryDemo = { open: openHub, missionLength: MISSION.length };
}());

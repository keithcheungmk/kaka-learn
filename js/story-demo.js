/* STORY ENGLISH demo — CF001 Game Night.
 * The book pages and matching page clips are selected derivatives of the school-supplied source.
 */
(function () {
  const speech = window.KakaSpeech;
  if (!speech) {
    console.error('KakaStoryDemo: KakaSpeech is required.');
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const unitDone = { listen: false, words: false, sentences: false, picture: false };
  let activeKind = null;
  let activeIndex = 0;
  let busy = false;
  let viewGen = 0;
  let delayedPrompt = null;

  const pageImage = (page) => `./assets/story-demo/pages/page-${String(page).padStart(2, '0')}.jpg`;
  const pageAudio = (page) => `./assets/story-demo/cf001-game-night-page-${String(page).padStart(2, '0')}.mp3`;
  const STORY_PAGES = Array.from({ length: 12 }, (_, i) => ({
    page: i + 1,
    image: pageImage(i + 1),
    audio: pageAudio(i + 1),
  }));

  const ACTIVITIES = {
    listen: {
      title: 'Listen to the Story', cover: pageImage(1), count: 12,
      lead: '撳 Listen；每頁錄音完結後會自動翻到下一頁。', items: STORY_PAGES,
    },
    words: {
      title: 'Word Cards', cover: pageImage(1), count: 6, lead: '聽個字，再揀返啱嘅英文。',
      items: [
        { word: 'game', image: pageImage(1), choices: ['family', 'game', 'night'] },
        { word: 'night', image: pageImage(1), choices: ['night', 'board', 'happy'] },
        { word: 'board', image: pageImage(1), choices: ['play', 'board', 'win'] },
        { word: 'family', image: pageImage(2), choices: ['family', 'turn', 'game'] },
        { word: 'play', image: pageImage(3), choices: ['night', 'play', 'board'] },
        { word: 'happy', image: pageImage(4), choices: ['happy', 'game', 'family'] },
      ],
    },
    sentences: {
      title: 'Say It', cover: pageImage(1), count: 2, lead: '聽一聽，揀一句完整說話。',
      items: [
        { prompt: 'Let’s have a game night.', image: pageImage(1), answer: 'Let’s have a game night.', choices: ['Let’s have a game night.', 'Have game a night.', 'A game is night.'] },
        { prompt: 'Everybody played a board game.', image: pageImage(1), answer: 'Everybody played a board game.', choices: ['Everybody played a board game.', 'Everybody a game played.', 'A board played everybody.'] },
      ],
    },
    picture: {
      title: 'Picture Talk', cover: pageImage(2), count: 3, lead: '睇故事圖，用一句英文回答。',
      items: [
        { question: 'What do you see?', image: pageImage(1), answer: 'I see a family.', choices: ['I see a family.', 'I see a game.', 'I am happy.'] },
        { question: 'What are they doing?', image: pageImage(1), answer: 'They are playing a board game.', choices: ['They are playing a board game.', 'They are a board game.', 'They are family.'] },
        { question: 'What is it?', image: pageImage(1), answer: 'It is game night.', choices: ['It is game night.', 'It is a family.', 'It is playing.'] },
      ],
    },
  };

  function muted() {
    try { return !!window.KakaStorage?.loadState?.().muted; } catch { return false; }
  }

  function clearDelayedPrompt() {
    if (delayedPrompt) clearTimeout(delayedPrompt);
    delayedPrompt = null;
  }

  function stopAudio() {
    $$('audio[data-story-demo]').forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  function invalidatePlayback() {
    viewGen += 1;
    clearDelayedPrompt();
    stopAudio();
    speech.cancelAllSpeech?.();
  }

  function show(name) {
    invalidatePlayback();
    $$('.screen').forEach((screen) => screen.classList.remove('active'));
    $(`#screen-${name}`)?.classList.add('active');
    window.KakaStarFx?.hideRanger?.();
  }

  function home() {
    invalidatePlayback();
    if (window.KakaLearn?.goHome) window.KakaLearn.goHome();
    else show('home');
  }

  function completeCount() { return Object.values(unitDone).filter(Boolean).length; }

  function renderHub() {
    const complete = $('#story-demo-complete');
    if (complete) complete.textContent = `${completeCount()}/4`;
    const grid = $('#story-demo-activity-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(ACTIVITIES).map(([kind, activity]) => {
      const done = unitDone[kind];
      const countLabel = kind === 'listen' ? 'pages' : kind === 'words' ? 'words' : kind === 'sentences' ? 'sentences' : 'questions';
      return `<button type="button" class="story-activity-card${done ? ' is-done' : ''}" data-story-kind="${kind}">
        <img class="story-activity-image" src="${activity.cover}" alt="" loading="lazy" decoding="async">
        <strong>${activity.title}</strong>
        <small>${activity.count} ${countLabel}</small>
        <span class="story-activity-status">${done ? '✓ Finished' : 'Start →'}</span>
      </button>`;
    }).join('');
    $$('[data-story-kind]', grid).forEach((button) => button.addEventListener('click', () => start(button.dataset.storyKind)));
  }

  function openHub() {
    activeKind = null;
    renderHub();
    show('story-demo');
  }

  function start(kind) {
    if (!ACTIVITIES[kind]) return;
    activeKind = kind;
    activeIndex = 0;
    busy = false;
    show('story-play');
    renderPlay();
  }

  function advance() {
    const activity = ACTIVITIES[activeKind];
    if (!activity) return;
    if (activeIndex >= activity.items.length - 1) {
      unitDone[activeKind] = true;
      speech.playCorrectCue?.({ muted: muted() });
      const feedback = $('#story-play-feedback');
      if (feedback) {
        feedback.textContent = 'Great job! Finished!';
        feedback.className = 'feedback ok';
      }
      const currentGen = viewGen;
      delayedPrompt = setTimeout(() => {
        if (currentGen === viewGen) openHub();
      }, 700);
      return;
    }
    activeIndex += 1;
    busy = false;
    renderPlay();
  }

  function previousPage() {
    if (activeKind !== 'listen' || activeIndex <= 0) return;
    activeIndex -= 1;
    renderPlay();
  }

  function playPrompt(text) {
    speech.cancelAllSpeech?.();
    speech.speakEnglishTerm?.(text, { muted: muted(), rate: .82, pitch: 1.05, delayMs: 0 });
  }

  function schedulePrompt(text, delay = 180) {
    const currentGen = viewGen;
    clearDelayedPrompt();
    delayedPrompt = setTimeout(() => {
      if (currentGen === viewGen) playPrompt(text);
    }, delay);
  }

  function renderListen(item, activity) {
    const page = item.page;
    const isLast = activeIndex === activity.items.length - 1;
    const stage = $('#story-play-stage');
    if (stage) stage.innerHTML = `<div class="story-book-frame">
      <img class="story-book-page" src="${item.image}" alt="Game Night, page ${page}" decoding="async">
    </div>`;
    const actions = $('#story-play-actions');
    if (actions) actions.innerHTML = `
      <button type="button" class="btn btn-ghost" id="btn-story-prev" ${page === 1 ? 'disabled' : ''}>← Previous</button>
      <button type="button" class="btn btn-secondary" id="btn-story-audio">🔊 Listen to page ${page}</button>
      <audio data-story-demo preload="metadata" src="${item.audio}"></audio>`;
    $('#btn-story-prev')?.addEventListener('click', previousPage);
    $('#btn-story-audio')?.addEventListener('click', () => {
      const audio = $('audio[data-story-demo]');
      if (!audio) return;
      const feedback = $('#story-play-feedback');
      if (feedback) { feedback.textContent = isLast ? 'Listening…' : 'Listening… the page will turn when the audio ends.'; feedback.className = 'feedback'; }
      audio.currentTime = 0;
      audio.onended = () => advance();
      audio.onerror = () => {
        if (feedback) { feedback.textContent = 'Audio could not play. Please try again.'; feedback.className = 'feedback retry'; }
      };
      audio.play().catch(() => {
        if (feedback) { feedback.textContent = 'Audio could not play. Please try again.'; feedback.className = 'feedback retry'; }
      });
    });
  }

  function renderQuestion(item, config) {
    const prompt = item[config.promptKey];
    const stage = $('#story-play-stage');
    if (stage) stage.innerHTML = `
      <img class="story-learning-image" src="${item.image}" alt="Story picture for ${config.question || prompt}" decoding="async">
      <div class="story-word">${config.showWord ? item.word : ''}</div>
      <h2>${config.question || prompt}</h2>
      <p>${config.copy}</p>`;
    const actions = $('#story-play-actions');
    if (actions) actions.innerHTML = `<button type="button" class="btn btn-secondary" id="btn-story-hear">🔊 Hear it</button>`;
    const options = $('#story-play-options');
    if (options) options.innerHTML = item.choices.map((choice) => `<button type="button" class="story-answer" data-answer="${choice}">${choice}</button>`).join('');
    $('#btn-story-hear')?.addEventListener('click', () => playPrompt(config.speak(item)));
    $$('[data-answer]', options).forEach((button) => button.addEventListener('click', () => {
      if (busy) return;
      const correct = button.dataset.answer === item.answer || button.dataset.answer === item.word;
      const feedback = $('#story-play-feedback');
      if (!correct) {
        button.classList.add('wrong');
        setTimeout(() => button.classList.remove('wrong'), 420);
        speech.playTryAgainCue?.({ muted: muted() });
        if (feedback) { feedback.textContent = 'Try again!'; feedback.className = 'feedback retry'; }
        return;
      }
      busy = true;
      button.classList.add('correct');
      speech.playCorrectCue?.({ muted: muted() });
      playPrompt(item.answer || item.word);
      if (feedback) { feedback.textContent = config.success; feedback.className = 'feedback ok'; }
      const currentGen = viewGen;
      delayedPrompt = setTimeout(() => {
        if (currentGen === viewGen) advance();
      }, 900);
    }));
  }

  function renderPlay() {
    clearDelayedPrompt();
    stopAudio();
    viewGen += 1;
    const activity = ACTIVITIES[activeKind];
    const item = activity?.items[activeIndex];
    if (!activity || !item) return openHub();
    const title = $('#story-play-title');
    const lead = $('#story-play-lead');
    const progress = $('#story-round-progress');
    const feedback = $('#story-play-feedback');
    if (title) title.textContent = activity.title;
    if (lead) lead.textContent = activity.lead;
    if (progress) progress.textContent = `${activeIndex + 1}/${activity.items.length}`;
    if (feedback) { feedback.textContent = ''; feedback.className = 'feedback'; }
    $('#story-play-options').innerHTML = '';
    if (activeKind === 'listen') renderListen(item, activity);
    if (activeKind === 'words') renderQuestion(item, { promptKey: 'word', showWord: true, question: 'Which word is this?', copy: 'Listen, then choose the same word.', speak: (entry) => entry.word, success: `Yes! Say it: ${item.word}` });
    if (activeKind === 'sentences') renderQuestion(item, { promptKey: 'prompt', question: 'Choose the full sentence.', copy: 'Listen carefully, then say it with me.', speak: (entry) => entry.prompt, success: 'Great sentence! Say it with me.' });
    if (activeKind === 'picture') renderQuestion(item, { promptKey: 'question', question: item.question, copy: 'Choose a full answer, then say it aloud.', speak: (entry) => entry.question, success: 'Great answer! Say it with me.' });
    if (activeKind !== 'listen') schedulePrompt(activeKind === 'words' ? item.word : item.prompt || item.question);
  }

  function init() {
    $('#btn-start-story-demo')?.addEventListener('click', openHub);
    $('#btn-back-story-demo')?.addEventListener('click', home);
    $('#btn-back-story-play')?.addEventListener('click', openHub);
  }

  init();
  window.KakaStoryDemo = { open: openHub };
}());

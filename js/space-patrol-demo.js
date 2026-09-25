/* Space Patrol pilot: lesson → 10-question word quiz → 10 stars. */
import {
  SPACE_PATROL_BLUE_MOON_ARC,
  SPACE_PATROL_PILOT_QUESTIONS,
} from '../data/space-patrol/blue-moon-arc.mjs';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const arc = SPACE_PATROL_BLUE_MOON_ARC;
const questions = SPACE_PATROL_PILOT_QUESTIONS;
let activeBook = null;
let pageIndex = 0;
let questionIndex = 0;
let correctCount = 0;
let busy = false;
let storyAudio = null;

function show(screen) {
  $$('.sp-screen').forEach((item) => item.classList.remove('active'));
  $(`#sp-${screen}`)?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderStars() {
  const text = `${correctCount}/10 ★`;
  $$('.sp-star-count').forEach((item) => { item.textContent = text; });
  const bar = $('#sp-quiz-stars');
  if (bar) bar.innerHTML = Array.from({ length: 10 }, (_, index) => `<span class="sp-star${index < correctCount ? ' is-on' : ''}" aria-hidden="true">★</span>`).join('');
}

function stopStoryAudio() {
  if (!storyAudio) return;
  storyAudio.pause();
  storyAudio.currentTime = 0;
  storyAudio = null;
}

function bookCard(book) {
  return `<button type="button" class="sp-book-card" data-book="${book.id}">
    <img src="${book.pages[0].image}" alt="" loading="lazy" decoding="async">
    <span class="sp-book-episode">EPISODE ${book.episode}</span>
    <strong>${book.title}</strong>
    <small>${book.pages.length} story pages · ${book.words.length} target words</small>
  </button>`;
}

function renderHub() {
  $('#sp-arc-title').textContent = arc.title;
  $('#sp-arc-books').innerHTML = arc.books.map(bookCard).join('');
  $$('#sp-arc-books [data-book]').forEach((button) => {
    button.addEventListener('click', () => startLesson(button.dataset.book));
  });
}

function startLesson(bookId) {
  activeBook = arc.books.find((book) => book.id === bookId) || null;
  if (!activeBook) return;
  pageIndex = 0;
  renderLesson();
  show('lesson');
}

function renderLesson() {
  if (!activeBook) return;
  const page = activeBook.pages[pageIndex];
  $('#sp-lesson-title').textContent = `${activeBook.title} · Episode ${activeBook.episode}`;
  $('#sp-lesson-progress').textContent = `Page ${pageIndex + 1}/${activeBook.pages.length}`;
  $('#sp-lesson-image').src = page.image;
  $('#sp-lesson-image').alt = `${activeBook.title}, story page ${page.pdfPage}`;
  $('#sp-lesson-source').textContent = `Source PDF page ${page.pdfPage} · original story audio`;
  $('#sp-word-cards').innerHTML = activeBook.words.map((item) => `<article class="sp-word-card">
    <div><strong>${item.word}</strong><span>${item.meaning}</span></div>
    <button type="button" class="sp-listen-word" data-word="${item.word}" aria-label="Listen to ${item.word}">🔊</button>
    <small>PDF p.${item.storyPage}: “${item.quote}”</small>
  </article>`).join('');
  $$('#sp-word-cards [data-word]').forEach((button) => button.addEventListener('click', () => speakWord(button.dataset.word)));
  const previous = $('#sp-lesson-prev');
  const next = $('#sp-lesson-next');
  previous.disabled = pageIndex === 0;
  next.textContent = pageIndex === activeBook.pages.length - 1 ? '完成學習・開始測驗 →' : '下一頁 →';
  next.onclick = () => {
    if (pageIndex === activeBook.pages.length - 1) startQuiz();
    else { pageIndex += 1; renderLesson(); }
  };
  previous.onclick = () => { pageIndex = Math.max(0, pageIndex - 1); renderLesson(); };
  $('#sp-listen-story').onclick = () => playStoryAudio();
}

function playStoryAudio() {
  if (!activeBook) return;
  stopStoryAudio();
  storyAudio = new Audio(activeBook.derivedAudio);
  storyAudio.preload = 'auto';
  storyAudio.play().catch(() => {
    $('#sp-lesson-feedback').textContent = '請再按一次播放故事。';
  });
  $('#sp-lesson-feedback').textContent = '正在播放原故事錄音…';
  storyAudio.onended = () => { $('#sp-lesson-feedback').textContent = '故事聽完喇，可以按下一頁。'; };
}

function speakWord(word) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
}

function questionOptions(question) {
  const distractors = questions
    .filter((item) => item.answer !== question.answer)
    .map((item) => item.answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  return [question.answer, ...distractors].sort(() => Math.random() - 0.5);
}

function startQuiz() {
  stopStoryAudio();
  questionIndex = 0;
  correctCount = 0;
  busy = false;
  renderQuestion();
  show('quiz');
}

function renderQuestion() {
  const question = questions[questionIndex];
  if (!question) return finishQuiz();
  busy = false;
  renderStars();
  $('#sp-question-number').textContent = `Question ${questionIndex + 1}/10`;
  $('#sp-question-prompt').textContent = `Which word means “${question.meaning}”?`;
  $('#sp-question-source').textContent = `${question.bookId.replaceAll('-', ' ')} · verified word-list pairing`;
  $('#sp-quiz-options').innerHTML = questionOptions(question).map((answer) => `<button type="button" class="sp-option" data-answer="${answer}">${answer}</button>`).join('');
  $$('#sp-quiz-options [data-answer]').forEach((button) => button.addEventListener('click', () => answerQuestion(button, question)));
}

function answerQuestion(button, question) {
  if (busy) return;
  busy = true;
  const correct = button.dataset.answer === question.answer;
  button.classList.add(correct ? 'is-correct' : 'is-wrong');
  if (correct) {
    correctCount += 1;
    $('#sp-quiz-feedback').textContent = 'Great job! Star collected.';
    $('#sp-quiz-feedback').className = 'sp-feedback is-good';
    renderStars();
  } else {
    $('#sp-quiz-feedback').textContent = `Almost — the answer is ${question.answer}.`;
    $('#sp-quiz-feedback').className = 'sp-feedback is-retry';
  }
  setTimeout(() => {
    questionIndex += 1;
    $('#sp-quiz-feedback').className = 'sp-feedback';
    if (questionIndex >= questions.length) finishQuiz();
    else renderQuestion();
  }, 650);
}

function finishQuiz() {
  renderStars();
  $('#sp-finish-score').textContent = `${correctCount}/10 stars collected`;
  show('finish');
}

$('#sp-back-home').addEventListener('click', () => { stopStoryAudio(); show('hub'); });
$('#sp-finish-back').addEventListener('click', () => show('hub'));
$('#sp-finish-again').addEventListener('click', () => { if (activeBook) startLesson(activeBook.id); });
renderHub();

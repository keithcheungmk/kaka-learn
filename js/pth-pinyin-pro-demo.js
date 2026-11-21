/**
 * Review demo: pinyin-pro on PTH example words.
 * Not wired into the live PTH lesson flow yet.
 */
const { pinyin } = window.pinyinPro;

const SAMPLES = [
  { word: '波波球', emoji: '🎈', curated: 'bō bō qiú' },
  { word: '巴士', emoji: '🚌', curated: 'bā shì' },
  { word: '白飯', emoji: '🍚', curated: 'bái fàn' },
  { word: '蘋果', emoji: '🍎', curated: 'píng guǒ' },
  { word: '洗手', emoji: '🧼', curated: 'xǐ shǒu' },
  { word: '老師', emoji: '🧑‍🏫', curated: 'lǎo shī' },
  { word: '蜘蛛', emoji: '🕷️', curated: 'zhī zhū' },
  { word: '青蛙', emoji: '🐸', curated: 'qīng wā' },
];

const $ = (sel) => document.querySelector(sel);

function analyze(word) {
  const parts = pinyin(word, { type: 'all', toneType: 'symbol' });
  return {
    full: parts.map((p) => p.pinyin).join(' '),
    parts,
  };
}

function markSyllable(part) {
  const initial = part.initial || '';
  const rest = String(part.pinyin || '').slice(initial.length);
  return `<span class="syl"><span class="ini">${escapeHtml(initial)}</span><span class="fin">${escapeHtml(rest)}</span></span>`;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function toneLabel(num) {
  return num ? `第 ${num} 聲` : '輕聲';
}

function renderFocusCards() {
  $('#focusGrid').innerHTML = SAMPLES.slice(0, 4).map((sample) => {
    const info = analyze(sample.word);
    const first = info.parts[0];
    return `<article class="focus-card">
      <span class="focus-emoji" aria-hidden="true">${sample.emoji}</span>
      <strong class="focus-word">${escapeHtml(sample.word)}</strong>
      <p class="focus-pinyin" lang="zh-Latn">${info.parts.map(markSyllable).join(' ')}</p>
      <p class="focus-meta">聲母 <b>${escapeHtml(first.initial || '—')}</b> · 韻母 <b>${escapeHtml(first.final || '—')}</b> · ${toneLabel(first.num)}</p>
      <p class="focus-badge">由 pinyin-pro 自動拆解</p>
    </article>`;
  }).join('');
}

function renderCompare() {
  $('#compareBody').innerHTML = SAMPLES.map((sample) => {
    const info = analyze(sample.word);
    const same = info.full.replace(/\s+/g, ' ') === sample.curated.replace(/\s+/g, ' ');
    return `<tr>
      <td>${sample.emoji} ${escapeHtml(sample.word)}</td>
      <td lang="zh-Latn">${escapeHtml(sample.curated)}</td>
      <td lang="zh-Latn">${escapeHtml(info.full)}</td>
      <td>${info.parts.map((p) => escapeHtml(p.initial || '∅')).join(' · ')}</td>
      <td class="${same ? 'ok' : 'diff'}">${same ? '一致' : '有差異'}</td>
    </tr>`;
  }).join('');
}

function stripTone(py) {
  return String(py).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function buildOptions(answer, pool) {
  const options = new Set([answer]);
  for (const item of pool) {
    if (options.size >= 4) break;
    if (stripTone(item) === stripTone(answer)) continue;
    options.add(item);
  }
  return [...options].sort(() => Math.random() - 0.5);
}

let quizIndex = 0;
let quizLocked = false;

function renderQuiz() {
  quizLocked = false;
  const sample = SAMPLES[quizIndex % SAMPLES.length];
  const info = analyze(sample.word);
  const pool = SAMPLES.map((s) => analyze(s.word).full);
  const options = buildOptions(info.full, pool);
  $('#quizPrompt').innerHTML = `睇字 <strong>${escapeHtml(sample.word)}</strong>，揀啱拼音`;
  $('#quizEmoji').textContent = sample.emoji;
  $('#quizWord').textContent = sample.word;
  $('#quizFeedback').textContent = '用 pinyin-pro 產生正確答案同干擾項。';
  $('#quizFeedback').className = 'feedback';
  $('#quizOptions').innerHTML = options.map((opt) =>
    `<button type="button" class="option" data-answer="${escapeHtml(opt)}" lang="zh-Latn">${escapeHtml(opt)}</button>`
  ).join('');
  $('#quizOptions').dataset.answer = info.full;
  document.querySelectorAll('#quizOptions .option').forEach((button) => {
    button.onclick = () => {
      if (quizLocked) return;
      quizLocked = true;
      const correct = $('#quizOptions').dataset.answer;
      const ok = button.dataset.answer === correct;
      button.classList.add(ok ? 'correct' : 'wrong');
      document.querySelectorAll('#quizOptions .option').forEach((el) => {
        if (el.dataset.answer === correct) el.classList.add('correct');
        el.disabled = true;
      });
      $('#quizFeedback').textContent = ok
        ? `答啱！${info.full}（聲母 ${info.parts.map((p) => p.initial).join('·')}）`
        : `再試：正確係 ${info.full}`;
      $('#quizFeedback').className = `feedback ${ok ? 'good' : ''}`;
    };
  });
}

$('#nextQuiz').onclick = () => {
  quizIndex = (quizIndex + 1) % SAMPLES.length;
  renderQuiz();
};

renderFocusCards();
renderCompare();
renderQuiz();

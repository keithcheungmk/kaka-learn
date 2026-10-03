import {sounds, groups, groupNames, buildQuestions} from './pth-content.js?v=20261004';
import {wordAudioClips} from './pth-word-audio.js?v=20261004';
import {createProgress} from './pth-progress.js?v=20261004';
import {createAudioController} from './pth-audio.js?v=20261004b';

const $ = selector => document.querySelector(selector);
const guestMemory = new Map();
const guestStore = {getItem: k => guestMemory.get(k) ?? null, setItem: (k, v) => guestMemory.set(k, v)};
let profile = window.KakaStorage?.getActiveProfileId() || 'guest';
let store;
try { store = localStorage; store.setItem('kaka-pth-storage-check', '1'); store.removeItem('kaka-pth-storage-check'); }
catch { store = guestStore; $('#storageNotice').hidden = false; }
let progress = createProgress(profile === 'guest' ? guestStore : store, profile);
let activeGroup = 'bpmf', tab = 'learn', question, round, selected = null;
let heard = false, locked = false, next = false, generation = 0, animation;
const audio = createAudioController($('#sharedAudio'), $('#wordAudioStatus'), () => document.querySelectorAll('video'), busy => {
  if (tab !== 'quiz' || !question) return;
  const blocked = busy || locked || next || (question.type === 'listen' && !heard);
  document.querySelectorAll('.option').forEach(button => button.disabled = blocked);
  $('#submitAnswer').disabled = busy || locked || (!next && !selected);
});
const currentSounds = () => sounds.filter(sound => sound.group === activeGroup);
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function pinyin(word) {
  const n = word.initial.length;
  return `<span class="pinyin-initial">${escape(word.pinyin.slice(0, n))}</span>${escape(word.pinyin.slice(n))}`;
}
function playWord(word, ended) {
  const clip = wordAudioClips[word.audioKey];
  if (!clip) { audio.message('這個詞語未有普通話錄音，請先練習其他詞語。'); return; }
  audio.play(clip.src, ended);
}
function leaveScreen() {
  generation++; audio.stop(); audio.message(''); animation?.cancel();
  document.querySelectorAll('.flying-star,.ranger-shooter').forEach(el => el.remove());
  locked = false; next = false;
}
function renderStars(displayIndex = progress.load(activeGroup).index) {
  const cells = Array.from({length: 10}, (_, i) => `<span class="star ${i < displayIndex ? 'on' : ''}" aria-label="第${i+1}粒星${i < displayIndex ? '已完成' : '未完成'}">${i < displayIndex ? '★' : '☆'}</span>`).join('');
  $('#miniStars').innerHTML = cells; $('#starTrack').innerHTML = cells;
  $('#progressBadge').textContent = `${displayIndex}/10 ⭐`;
  $('#quizTabCount').textContent = `${displayIndex}/10`;
  $('#starsTotal').textContent = `累積 ${progress.total()} 粒星`;
  $('#completeMessage').hidden = displayIndex < 10;
  $('#completeText').textContent = `已完成 ${groupNames[activeGroup]} 的 10 題練習！`;
  $('#rewardNote').textContent = profile === 'guest' ? '訪客試玩：離開後不保留進度。' :
    progress.awarded(activeGroup) ? '⭐ 本課已領星；重溫仍會射星，但不會重複增加累積星星。' : '首次完成本課可記錄 10 粒星；同一玩家重溫不會重複領取。';
  $('#courseRecords').innerHTML = groups.map(group => `<li>${groupNames[group]}：${progress.awarded(group) ? '⭐ 已領星' : '未領星'}</li>`).join('');
}
function renderGroups() {
  $('h1').textContent = `${activeGroup === 'yw' ? '拼音字母' : '聲母'}小隊：${groupNames[activeGroup]}`;
  $('#groupNav').innerHTML = groups.map(group => `<button class="group-btn ${group === activeGroup ? 'active' : ''}" aria-pressed="${group === activeGroup}" data-group="${group}">${groupNames[group]}${progress.awarded(group) ? ' ⭐' : ''}</button>`).join('');
  document.querySelectorAll('[data-group]').forEach(button => button.onclick = () => {
    leaveScreen(); activeGroup = button.dataset.group; renderGroups(); renderLearn(); showTab('learn');
  });
}
function renderLearn() {
  $('#lessonGrid').style.setProperty('--lesson-count', currentSounds().length);
  $('#lessonGrid').innerHTML = currentSounds().map(sound => `<article class="lesson">
    <h3>${sound.name}</h3><p>${sound.tip}</p><div class="example-list">${sound.examples.map(word => `<div class="example-item">
      <span class="example-emoji" role="img" aria-label="${word.imageLabel}">${word.emoji}</span>
      <strong>${word.word}</strong><span class="example-pinyin" lang="zh-Latn">${pinyin(word)}</span>
      <button class="word-audio" data-word-audio="${word.audioKey}" aria-label="播放${word.word}普通話">🔊</button>
    </div>`).join('')}</div>
    <video controls playsinline preload="none" poster="assets/pth/initials/posters/${sound.id}.jpg" src="${sound.video}" aria-label="${sound.name} 教材口形影片"></video>
    <button class="audio-btn" data-play-video>▶ 重播 ${sound.name} 口形示範</button></article>`).join('');
  document.querySelectorAll('[data-word-audio]').forEach(button => button.onclick = () => {
    const word = sounds.flatMap(s => s.examples).find(w => w.audioKey === button.dataset.wordAudio); playWord(word);
  });
  document.querySelectorAll('video').forEach(video => audio.bindVideo(video));
  document.querySelectorAll('[data-play-video]').forEach(button => button.onclick = () => {
    audio.stop(); const video = button.previousElementSibling; video.currentTime = 0;
    video.play().catch(() => audio.message('教材影片未能播放，請再試。'));
  });
}
function showTab(id) {
  leaveScreen();
  tab = id === 'quiz' && progress.load(activeGroup).index === 10 ? 'stars' : id;
  document.body.dataset.tab = tab;
  document.querySelectorAll('.panel').forEach(panel => panel.hidden = panel.id !== tab);
  document.querySelectorAll('.tab').forEach(button => { button.classList.toggle('active', button.dataset.tab === tab); button.setAttribute('aria-pressed', String(button.dataset.tab === tab)); });
  renderStars(); if (tab === 'quiz') renderQuestion(); window.scrollTo(0, 0);
}
function selectAnswer(answer) {
  if (audio.busy || locked || next || (question.type === 'listen' && !heard)) return;
  selected = answer; $('#answerSlot').textContent = answer; $('#answerSlot').classList.add('filled');
  document.querySelectorAll('.option').forEach(button => { button.classList.toggle('selected', button.dataset.answer === answer); button.setAttribute('aria-pressed', String(button.dataset.answer === answer)); });
  $('#submitAnswer').disabled = false;
}
function renderQuestion() {
  round = progress.load(activeGroup);
  if (round.index >= 10) { showTab('stars'); return; }
  question = buildQuestions(activeGroup, round.seed)[round.index];
  selected = null; heard = false; next = false; locked = false;
  $('#questionNo').textContent = round.index + 1; $('#questionPrompt').textContent = question.prompt;
  $('#feedback').textContent = question.type === 'listen' ? '先按「聽一聽」，聽完再選。' : '選一個字母，再提交答案。';
  $('#feedback').className = 'feedback'; $('#submitAnswer').textContent = '提交答案'; $('#submitAnswer').disabled = true;
  const word = question.word;
  $('#quizMedia').innerHTML = `<div class="word-challenge">
    <div class="challenge-emoji" role="img" aria-label="${question.type === 'listen' ? '聆聽詞語' : word.imageLabel}">${question.type === 'listen' ? '👂' : word.emoji}</div>
    <strong id="quizWord">${question.type === 'listen' ? '聽一聽這個詞語' : word.word}</strong>
    <span id="quizPinyin" class="example-pinyin" hidden></span>
    <button class="audio-btn" id="challengeAudio">🔊 聽一聽</button></div>
    <div class="answer-prompt">第一個${activeGroup === 'yw' ? '拼音字母' : '聲母'}<span id="answerSlot" class="answer-slot">選字母</span></div>`;
  const request = generation;
  $('#challengeAudio').onclick = () => playWord(word, () => {
    if (request !== generation || next || locked) return;
    heard = true; document.querySelectorAll('.option').forEach(button => button.disabled = false);
    $('#feedback').textContent = '聽到了！選一個字母，再提交。';
  });
  $('#options').innerHTML = currentSounds().map(sound => `<button class="option" data-answer="${sound.id}" aria-pressed="false" draggable="true" ${question.type === 'listen' ? 'disabled' : ''}>${sound.name}</button>`).join('');
  document.querySelectorAll('.option').forEach(button => {
    button.onclick = () => selectAnswer(button.dataset.answer);
    button.ondragstart = event => { if (button.disabled || locked || next) { event.preventDefault(); return; } event.dataTransfer.setData('text/plain', button.dataset.answer); };
  });
  $('#answerSlot').ondragover = event => event.preventDefault();
  $('#answerSlot').ondrop = event => { event.preventDefault(); const answer = event.dataTransfer.getData('text/plain'); if (currentSounds().some(s => s.id === answer)) selectAnswer(answer); };
}
async function fireStar(index) {
  const target = $('#miniStars').children[index - 1].getBoundingClientRect();
  const source = $('#quizMedia').getBoundingClientRect();
  const ranger = document.createElement('img'); ranger.src = 'assets/kaka-ranger-solo.png'; ranger.alt = ''; ranger.className = 'ranger-shooter';
  ranger.style.left = `${source.left + 8}px`; ranger.style.top = `${source.bottom - 96}px`;
  const star = document.createElement('span'); star.className = 'flying-star'; star.textContent = '★';
  const x = source.left + 80, y = source.bottom - 65;
  star.style.left = `${x}px`; star.style.top = `${y}px`; document.body.append(ranger, star);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  animation = star.animate([{transform: 'translate(0,0) scale(.7)'}, {transform: `translate(${target.left - x}px,${target.top - y}px) scale(.55)`}], {duration: reduced ? 120 : 800, easing: 'ease-in-out', fill: 'forwards'});
  try { await animation.finished; } catch { /* Navigation only cancels presentation. */ }
  ranger.remove(); star.remove();
}
$('#submitAnswer').onclick = async () => {
  if (audio.busy || locked || $('#submitAnswer').disabled) return;
  if (next) { showTab(progress.load(activeGroup).index === 10 ? 'stars' : 'quiz'); return; }
  if (selected !== question.answer) { $('#feedback').textContent = `再試一次。${question.hint}`; return; }
  locked = true; audio.stop(); const request = generation;
  if (!progress.accept(activeGroup, round.index, round.seed)) { showTab('quiz'); return; }
  $('#submitAnswer').disabled = true; document.querySelectorAll('.option').forEach(button => button.disabled = true);
  $('#quizWord').textContent = question.word.word; $('#quizPinyin').innerHTML = pinyin(question.word); $('#quizPinyin').hidden = false;
  $('.challenge-emoji').textContent = question.word.emoji;
  $('#feedback').textContent = '答對了！卡卡射出一粒星！'; $('#feedback').className = 'feedback good';
  await fireStar(round.index + 1); if (request !== generation) return;
  renderStars(); renderGroups(); locked = false; next = true;
  $('#submitAnswer').textContent = round.index === 9 ? '查看星星記錄 →' : '下一題 →'; $('#submitAnswer').disabled = false;
};
$('#startQuiz').onclick = () => showTab('quiz');
document.querySelectorAll('.tab').forEach(button => button.onclick = () => showTab(button.dataset.tab));
$('#resetProgress').onclick = () => { progress.restart(activeGroup); showTab('quiz'); };
$('#profileSelect').value = profile;
$('#profileSelect').onchange = () => {
  leaveScreen(); profile = $('#profileSelect').value;
  if (profile !== 'guest') window.KakaStorage?.setActiveProfile(profile);
  progress = createProgress(profile === 'guest' ? guestStore : store, profile); renderGroups(); renderLearn(); showTab('learn');
};
document.addEventListener('visibilitychange', () => { if (document.hidden) audio.stop(); });
window.addEventListener('pagehide', () => audio.stop());
window.addEventListener('storage', event => { if (event.key?.startsWith(`kaka-pth-v2:${profile}:`)) { renderGroups(); showTab(tab); } });
renderGroups(); renderLearn(); showTab('learn');

import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import vm from 'node:vm';

const source = await readFile(new URL('../js/story-demo.js', import.meta.url), 'utf8');
const manifestSource = await readFile(new URL('../data/carter-family-manifest.js', import.meta.url), 'utf8');
const magicManifestSource = await readFile(new URL('../data/magic-marker-manifest.js', import.meta.url), 'utf8');
const magicExpansionSource = await readFile(new URL('../data/magic-marker-expansion.js', import.meta.url), 'utf8');
const magicRestSource = await readFile(new URL('../data/magic-marker-rest.js', import.meta.url), 'utf8');
const wackyManifestSource = await readFile(new URL('../data/wacky-ricky-manifest.js', import.meta.url), 'utf8');
const starFx = await readFile(new URL('../js/star-fx.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/story-demo.css', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const manifestSandbox = { window: {} };
vm.runInNewContext(manifestSource, manifestSandbox);
const manifestBooks = manifestSandbox.window.KakaCarterManifest.books;
const magicManifestSandbox = { window: {} };
vm.runInNewContext(magicManifestSource, magicManifestSandbox);
vm.runInNewContext(magicExpansionSource, magicManifestSandbox);
vm.runInNewContext(magicRestSource, magicManifestSandbox);
const magicBooks = magicManifestSandbox.window.KakaMagicMarkerManifest.books;
const wackyManifestSandbox = { window: {} };
vm.runInNewContext(wackyManifestSource, wackyManifestSandbox);
const wackyManifest = wackyManifestSandbox.window.KakaWackyRickyManifest;
const wackyBooks = wackyManifest.books;

assert.match(source, /const BASE_BOOKS = \[/, 'Read & Fill should keep the three-book template catalogue');
assert.match(source, /BASE_BOOKS\.concat\(window\.KakaCarterManifest/, 'Additional Carter books should come from the manifest');
assert.match(source, /window\.KakaMagicMarkerManifest\?\.books/, 'Magic Marker books should come from their own manifest');
assert.match(source, /window\.KakaWackyRickyManifest\?\.books/, 'Wacky Ricky should use its independent collection manifest');
assert.match(source, /story-demo-review-note/, 'Wacky Ricky pending audio review must be visible in the hub');
assert.match(source, /function openSeriesChooser/, 'English story entry should lead to the series chooser');
assert.match(source, /id: 'cf001'/, 'CF001 Game Night should remain available');
assert.match(source, /id: 'cf002'/, 'CF002 The Tree House should be available');
assert.match(source, /id: 'cf003'/, 'CF003 The School Play should be available');
assert.match(source, /function startBook/, 'Hub cards should start a chosen book');
assert.match(source, /pageCount: totalPages\(CARTER_BOOKS\)/, 'Total Carter page count should remain exposed for the demo');

const sourceClipCount = (source.match(/sourceClip: '/g) || []).length;
const blankCount = (source.match(/blanks: \[/g) || []).length;
const choiceCount = (source.match(/choices: \[/g) || []).length;
assert.equal(sourceClipCount, 38, 'Every story page needs a source audio trace (12+12+14)');
assert.equal(blankCount, 38, 'Every story page needs one short fill activity');
assert.equal(choiceCount, 38, 'Every story page should define answer choices');

assert.equal(manifestBooks.length, 82, 'Manifest should add CF004–CF085');
assert.equal(wackyBooks.length, 100, 'Wacky Ricky should contain WR001–WR100');
assert.equal(wackyManifest.status, 'first_pass_review_required');
assert.deepEqual(JSON.parse(JSON.stringify(wackyManifest.reviewSummary)), { pageClips: 960, priorityListenPages: 477, unavailablePages: 9, manualListeningVerified: 0 });
assert.equal(wackyBooks.reduce((sum, book) => sum + book.unavailablePages.length, 0), 9);
assert.deepEqual(Array.from(manifestBooks.slice(0, 7), (book) => book.cfLabel), ['CF004', 'CF005', 'CF006', 'CF007', 'CF008', 'CF009', 'CF010']);
assert.deepEqual(Array.from(manifestBooks.slice(-20), (book) => book.cfLabel), Array.from({ length: 20 }, (_, index) => `CF${String(index + 66).padStart(3, '0')}`));
assert.equal(manifestBooks.slice(0, 7).reduce((sum, book) => sum + book.pages.length, 0), 96, 'CF004–CF010 should add 96 story pages');
assert.equal(manifestBooks.reduce((sum, book) => sum + book.pages.length, 0), 995, 'CF004–CF085 should add 995 manifest story pages');
for (const book of manifestBooks) {
  assert.equal(book.pages.length, book.pages.filter((item) => item.verificationStatus === 'verified').length, `${book.id} pages must be verified`);
  for (const item of book.pages) {
    assert.equal(item.choices.length, 3, `${book.id} page ${item.printedPage} should provide the answer plus two reviewed distractors; runtime adds a fourth`);
    assert.ok(item.blanks.length === 1 || item.blanks.length === 2, `${book.id} page ${item.printedPage} should have one or two content blanks`);
    for (const blank of item.blanks) {
      assert.ok(item.sentence.includes(blank), `${book.id} blank ${blank} must occur in the sentence`);
    }
    if (item.blanks.length === 2) {
      const phraseStart = item.sentence.reduce((found, word, index) => (
        word === item.blanks[0] && item.sentence[index + 1] === item.blanks[1] ? index : found
      ), -1);
      assert.equal(item.sentence[phraseStart + 1], item.blanks[1], `${book.id} page ${item.printedPage} two-word blank must be consecutive`);
    }
    await access(new URL(`../${item.image.slice(2)}`, import.meta.url), fsConstants.R_OK);
    await access(new URL(`../${item.audio.slice(2)}`, import.meta.url), fsConstants.R_OK);
  }
}

const storySandbox = {
  window: { KakaCarterManifest: { books: manifestBooks }, KakaMagicMarkerManifest: { books: magicBooks }, KakaWackyRickyManifest: wackyManifest, KakaSpeech: {} },
  document: { querySelector: () => null, querySelectorAll: () => [] },
  console,
};
vm.runInNewContext(source, storySandbox);
const storyDemo = storySandbox.window.KakaStoryDemo;
assert.equal(storyDemo.books.length, 85, 'The balanced answer system should include all 85 Carter books');
assert.equal(storyDemo.pageCount, 1033, 'The balanced answer system should cover all 1,033 story pages');
assert.deepEqual(Array.from(storyDemo.series, (series) => [series.id, series.bookCount, series.pageCount]), [['carter', 85, 1033], ['magic-marker', 73, 655], ['wacky-ricky', 100, 960]], 'All story collections should remain independent');
assert.deepEqual(Array.from(magicBooks, (book) => book.id), Array.from({ length: 73 }, (_, index) => `mm${String(index + 1).padStart(3, '0')}`), 'The Magic Marker catalogue should run continuously through MM073');
const normalize = (word) => String(word).toLowerCase().replace(/[^a-z]/g, '');
const seededRandom = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0x100000000;
};
for (const book of magicBooks) {
  assert.ok(book.pages.length >= 6 && book.pages.length <= 17, `${book.id} should expose its source-mapped playable story pages`);
  assert.equal(book.sourceSet, 'magic-marker', `${book.id} should preserve its source collection`);
  for (const item of book.pages) {
    assert.equal(item.verificationStatus, 'verified', `${book.id} page ${item.printedPage} should be source-checked`);
    assert.equal(item.blanks.length, 1, `${book.id} page ${item.printedPage} should have one blank`);
    assert.equal(item.choices.length, 3, `${book.id} page ${item.printedPage} should define the answer and two reviewed distractors`);
    assert.ok(item.sentence.includes(item.blanks[0]), `${book.id} blank should appear in the sentence`);
    await access(new URL(`../${item.image.slice(2)}`, import.meta.url), fsConstants.R_OK);
    await access(new URL(`../${item.audio.slice(2)}`, import.meta.url), fsConstants.R_OK);
  }
  const plan = Array.from(storyDemo.createQuestionPlan(book, seededRandom(book.id.charCodeAt(2)), magicBooks));
  assert.equal(plan.length, book.pages.length, `${book.id} should build one balanced exercise per page`);
  assert.ok(plan.every((question) => question.choices.length === 4 && question.choices[question.correctIndex] === question.answer), `${book.id} answers should render with one correct choice among four`);
  assert.ok(plan.every((question) => new Set(question.choices.map(normalize)).size === 4), `${book.id} should have four different choices on every page`);
}
const rejectedWackyNames = new Set([
  'ricky', 'rachel', 'brenda', 'brian', 'kitty', 'richard', 'veronica',
  'mom', 'dad', 'mommy', 'daddy', 'mrs', 'mr', 'ms',
]);
const isWackyName = (key) => rejectedWackyNames.has(key) || rejectedWackyNames.has(key.replace(/s$/, ''));
assert.match(source, /listenOnly/, 'Runtime may keep a listen-only safety path, but Wacky pages must all have fills');
assert.match(source, /lastTokenIndex/, 'Repeated content words should blank only the last occurrence');
for (const book of wackyBooks) {
  assert.equal(book.editorialStatus, 'review_required', `${book.id} should remain marked as unreviewed`);
  for (const item of book.pages) {
    assert.equal(item.contentStatus, 'auto_generated_pending_review');
    assert.equal(item.listeningStatus, 'pending');
    assert.ok(item.blanks.length === 1 || item.blanks.length === 2, `${book.id} page ${item.printedPage} should have one or two content blanks`);
    assert.equal(item.choices.length, 3, `${book.id} page ${item.printedPage} should define the answer and two distractors`);
    const pageKeys = item.sentence.map((word) => normalize(word)).filter(Boolean);
    const onlyNames = pageKeys.every((key) => isWackyName(key) || /^\d+$/.test(key));
    for (const blank of item.blanks) {
      assert.ok(item.sentence.includes(blank), `${book.id} blank ${blank} should appear in the sentence`);
      const blankKey = normalize(blank);
      if (!onlyNames) {
        assert.ok(!isWackyName(blankKey), `${book.id} page ${item.printedPage} blank ${blank} must not be a name`);
      }
    }
    if (item.blanks.length === 2) {
      const phraseStart = item.sentence.reduce((found, word, index) => (
        word === item.blanks[0] && item.sentence[index + 1] === item.blanks[1] ? index : found
      ), -1);
      assert.equal(item.sentence[phraseStart + 1], item.blanks[1], `${book.id} page ${item.printedPage} two-word blank must be consecutive`);
      assert.ok(item.choices[0].includes(' '), `${book.id} page ${item.printedPage} phrase choices should be two words`);
    }
    await access(new URL(`../${item.image.slice(2)}`, import.meta.url), fsConstants.R_OK);
    await access(new URL(`../${item.audio.slice(2)}`, import.meta.url), fsConstants.R_OK);
  }
  const plan = Array.from(storyDemo.createQuestionPlan(book, seededRandom(book.id.charCodeAt(2)), wackyBooks));
  assert.equal(plan.length, book.pages.length);
  assert.ok(plan.every((question) => question.choices.length === 4 && question.choices[question.correctIndex] === question.answer && !question.listenOnly));
}
for (const book of storyDemo.books) {
  let sawDifferentRun = false;
  let previousSignature = '';
  for (let run = 1; run <= 12; run += 1) {
    const plan = Array.from(storyDemo.createQuestionPlan(book.id, seededRandom(run * 997 + book.id.charCodeAt(2))));
    const counts = [0, 0, 0, 0];
    for (const [pageIndex, question] of plan.entries()) {
      const page = book.id.startsWith('cf00') && Number(book.id.slice(2)) <= 3
        ? null
        : manifestBooks.find((candidate) => candidate.id === book.id)?.pages[pageIndex];
      assert.equal(question.choices.length, 4, `${book.id} page ${pageIndex + 1} should have four choices`);
      assert.equal(new Set(question.choices.map(normalize)).size, 4, `${book.id} page ${pageIndex + 1} choices must be distinct`);
      assert.equal(question.choices[question.correctIndex], question.answer, `${book.id} page ${pageIndex + 1} answer must match its labelled position`);
      assert.equal(question.choices.filter((word) => normalize(word) === normalize(question.answer)).length, 1, `${book.id} page ${pageIndex + 1} must contain exactly one correct option`);
      if (page) assert.ok(!page.sentence.map(normalize).includes(normalize(question.choices.find((word) => normalize(word) !== normalize(question.answer) && !page.choices.some((choice) => normalize(choice) === normalize(word))))), `${book.id} page ${pageIndex + 1} extra distractor should not be exposed in its sentence`);
      counts[question.correctIndex] += 1;
      if (pageIndex > 0) assert.notEqual(question.correctIndex, plan[pageIndex - 1].correctIndex, `${book.id} should not repeat the same answer position on adjacent pages`);
    }
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `${book.id} answers should be evenly distributed across A–D`);
    const signature = plan.map((question) => question.correctIndex).join('');
    if (previousSignature && signature !== previousSignature) sawDifferentRun = true;
    previousSignature = signature;
  }
  assert.ok(sawDifferentRun, `${book.id} answer positions should change between plays`);
}

assert.match(source, /function renderChallenge/, 'Read & Fill should use one challenge layout for listen and fill');
assert.match(source, /balancedAnswerSlots/, 'Correct-answer positions should be balanced across A–D for each book run');
assert.match(source, /story-choice-label/, 'Each of the four answer choices should show its A–D label');
assert.match(source, /function unlockFill/, 'Story audio should unlock the fill controls when finished');
assert.match(source, /draggable="\$\{!locked && !busy && !reading && !solved\}/, 'Word tiles should support dragging before submission');
assert.match(source, /tile\.addEventListener\('click'/, 'Word tiles should also support tapping');
assert.match(source, /audio\.onended = \(\) => \{/, 'The fill activity must follow the original page audio');
assert.match(source, /function submitWord/, 'The fill activity should wait for Submit before judging');
assert.match(source, /That’s okay\. Try again!/, 'Wrong answers should use a gentle English retry message');
assert.match(source, /speakEnglishTerm/, 'The fill activity should use English TTS for the short sentence');
assert.match(source, /rate: 0\.98/, 'Sentence reading should use a quicker English rate');
assert.match(source, /function selectWord[\s\S]*speakEnglishTerm\?\.\(word/, 'Choosing a word tile should speak that word');
assert.match(source, /story-sentence-token/, 'The sentence should expose word-level highlight targets');
assert.match(source, /function readSentenceWithHighlight/, 'The short sentence should be read with word highlighting');
assert.match(source, /function speakPraise/, 'Correct answers should use a spoken praise line');
assert.match(source, /function awardStoryPageStar/, 'Story pages should award a tracked star');
assert.match(source, /function storyPageKey/, 'Story page keys should stay stable per book/page');
assert.match(source, /function isWackyBookComplete/, 'Wacky Ricky shelf stars should reuse passedKeys completion');
assert.match(source, /function markStoryBookComplete/, 'Finishing a Wacky episode should record the book key without extra coins');
assert.match(source, /currentSeriesId === 'wacky-ricky'/, 'Completion stars belong on the Wacky Ricky shelf only');
assert.match(css, /\.story-complete-star/, 'Completed Wacky episodes should show the existing gold star badge');
{
  const wr001 = wackyBooks[0];
  assert.equal(storyDemo.storyPageKey('wr001', { printedPage: 3 }, 0), 'story|wr001|page-3');
  assert.equal(storyDemo.storyPageKey('wr001', {}, 4), 'story|wr001|page-5');
  assert.equal(storyDemo.storyBookKey('wr001'), 'story|wr001');
  assert.equal(storyDemo.isWackyBookComplete(wr001, {}), false);
  assert.equal(storyDemo.isWackyBookComplete(wr001, { 'story|wr001': true }), true);
  const pageKeys = Object.fromEntries(wr001.pages.map((page, index) => [storyDemo.storyPageKey(wr001.id, page, index), true]));
  assert.equal(storyDemo.isWackyBookComplete(wr001, pageKeys), true);
  assert.equal(storyDemo.isWackyBookComplete(wr001, { [storyDemo.storyPageKey(wr001.id, wr001.pages[0], 0)]: true }), false);
  const doneCard = storyDemo.bookShelfCardHtml(wr001, { complete: true });
  const freshCard = storyDemo.bookShelfCardHtml(wr001, { complete: false });
  assert.match(doneCard, /story-complete-star/);
  assert.match(doneCard, /is-complete/);
  assert.match(doneCard, /已完成/);
  assert.doesNotMatch(freshCard, /story-complete-star/);
  assert.doesNotMatch(freshCard, /is-complete/);
  let tryEarnCalls = 0;
  const store = { passedKeys: {} };
  storySandbox.window.KakaStorage = {
    loadState: () => store,
    updateState: (patch) => { Object.assign(store, patch); },
    tryEarnStar: () => { tryEarnCalls += 1; return { gained: true }; },
  };
  storyDemo.markStoryBookComplete(wr001);
  assert.equal(store.passedKeys['story|wr001'], true, 'finish should persist the episode key');
  assert.equal(tryEarnCalls, 0, 'episode star must not award an extra AEON coin / tryEarnStar');
}
assert.match(source, /Great job, Kaka! You got it right!/, 'The praise lines should address Kaka in English');
assert.match(source, /if \(!\$\('#btn-story-next'\)\)[\s\S]*void awardStoryPageStar\(item\);\s*speakPraise\(\);/, 'Correct answers should show Next page immediately, then award the star and play praise');
assert.match(source, /\$\('#btn-story-submit'\)\?\.remove\(\)/, 'Submit should be removed after a correct answer');
assert.doesNotMatch(source, /function renderListen/, 'There should be no separate listen-only layout');
assert.doesNotMatch(source, /const MISSION/, 'The former separate multi-question mission should be removed');
assert.match(source, /autoPlay: phase === 'listen'/, 'Each page should auto-play the story clip in the challenge layout');

assert.match(css, /orientation:\s*landscape/, 'iPad landscape should have a dedicated media query');
assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1\.38fr\)\s*minmax\(280px,\s*1fr\)/, 'Landscape challenge columns should keep their gap inside the available width');
assert.match(css, /orientation:\s*portrait[\s\S]*flex:\s*1\s+1\s+0[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)[\s\S]*grid-template-rows:\s*minmax\(0,\s*1\.3fr\)\s*minmax\(0,\s*\.9fr\)/, 'iPad portrait should give the story display more room than the fill panel');
assert.match(css, /\.story-challenge-page\s*\{\s*width:\s*auto;\s*max-width:\s*100%;\s*height:\s*auto;\s*max-height:\s*39vh;\s*\}/, 'Portrait story page should preserve its aspect ratio and use the enlarged story area without clipping');
assert.match(css, /\.story-play-screen\.active\s*>\s*\.game-header h1\s*\{[^}]*white-space:\s*nowrap/s, 'Portrait Story English title should remain on one line and preserve stage height');
assert.match(css, /\.story-fill-tile\s*\{\s*min-height:\s*44px;\s*padding-block:\s*6px;\s*font-size:\s*clamp\(1rem,\s*1\.8vw,\s*1\.12rem\);\s*\}/, 'Portrait answer choices should stay comfortably readable after tightening the panel');
assert.match(css, /\.story-play-stage\s*\{[^}]*width:\s*100%;\s*max-width:\s*1180px/s, 'Story stage should size to its parent and avoid viewport-based margin overflow');
assert.match(css, /\.story-challenge-story/, 'Story listen control should sit with the page image');
assert.match(css, /\.story-fill-panel[\s\S]*padding:\s*clamp\(12px/, 'Fill panel should keep comfortable inner padding');
assert.match(source, /story-challenge-story/, 'Listen to the story should live in the left story column');
assert.doesNotMatch(source, /story-fill-tools/, 'Story listen should not share the right-hand quiz toolbar');
assert.match(index, /每頁先聽故事，再把剛才聽到的一個字放回短句/);
assert.match(index, /data\/carter-family-manifest\.js/, 'The Carter manifest must load before Story English');
assert.match(starFx, /'screen-story-play'/, 'Story play should use the shared ranger star animation');
assert.match(index, /id="btn-start-english"/, 'Home should expose one English learning entry');
assert.match(index, /id="btn-english-story"/, 'English hub should route to Story Reading');
assert.match(index, /id="btn-english-words"/, 'English hub should route to Topic Words');
assert.match(index, /id="btn-english-phonics"/, 'English hub should route to Phonics');
assert.match(index, /id="screen-story-series"/, 'Little Fox entry should expose a collection chooser');
assert.match(source, /window\.KakaPhonics\?\.openEnglishHub/, 'Story series back should return to the shared English hub');

const requiredAssets = [
  '../assets/story-demo/pages/page-01.webp',
  '../assets/story-demo/cf001-game-night-page-01.mp3',
  '../assets/story-demo/cf002/pages/page-12.webp',
  '../assets/story-demo/cf002/cf002-the-tree-house-page-12.mp3',
  '../assets/story-demo/cf003/pages/page-14.webp',
  '../assets/story-demo/cf003/cf003-the-school-play-page-14.mp3',
  '../assets/story-demo/mm001/pages/page-01.webp',
  '../assets/story-demo/mm001/mm001-page-01.mp3',
  '../assets/story-demo/mm002/pages/page-08.webp',
  '../assets/story-demo/mm002/mm002-page-08.mp3',
];
for (const relative of requiredAssets) {
  await access(new URL(relative, import.meta.url), fsConstants.R_OK);
}

console.log('story read-and-fill checks passed');

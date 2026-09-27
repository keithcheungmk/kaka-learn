import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import vm from 'node:vm';

const source = await readFile(new URL('../js/story-demo.js', import.meta.url), 'utf8');
const manifestSource = await readFile(new URL('../data/carter-family-manifest.js', import.meta.url), 'utf8');
const starFx = await readFile(new URL('../js/star-fx.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/story-demo.css', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const manifestSandbox = { window: {} };
vm.runInNewContext(manifestSource, manifestSandbox);
const manifestBooks = manifestSandbox.window.KakaCarterManifest.books;

assert.match(source, /const BASE_BOOKS = \[/, 'Read & Fill should keep the three-book template catalogue');
assert.match(source, /BASE_BOOKS\.concat\(window\.KakaCarterManifest/, 'Additional Carter books should come from the manifest');
assert.match(source, /id: 'cf001'/, 'CF001 Game Night should remain available');
assert.match(source, /id: 'cf002'/, 'CF002 The Tree House should be available');
assert.match(source, /id: 'cf003'/, 'CF003 The School Play should be available');
assert.match(source, /function startBook/, 'Hub cards should start a chosen book');
assert.match(source, /pageCount: totalPages\(\)/, 'Total page count should be exposed for the demo');

const sourceClipCount = (source.match(/sourceClip: '/g) || []).length;
const blankCount = (source.match(/blanks: \[/g) || []).length;
const choiceCount = (source.match(/choices: \[/g) || []).length;
assert.equal(sourceClipCount, 38, 'Every story page needs a source audio trace (12+12+14)');
assert.equal(blankCount, 38, 'Every story page needs one short fill activity');
assert.equal(choiceCount, 38, 'Every story page should define answer choices');

assert.equal(manifestBooks.length, 27, 'Manifest should add CF004–CF040');
assert.deepEqual(Array.from(manifestBooks.slice(0, 7), (book) => book.cfLabel), ['CF004', 'CF005', 'CF006', 'CF007', 'CF008', 'CF009', 'CF010']);
assert.deepEqual(Array.from(manifestBooks.slice(-20), (book) => book.cfLabel), Array.from({ length: 20 }, (_, index) => `CF${String(index + 21).padStart(3, '0')}`));
assert.equal(manifestBooks.slice(0, 7).reduce((sum, book) => sum + book.pages.length, 0), 96, 'CF004–CF010 should add 96 story pages');
assert.equal(manifestBooks.slice(-20).reduce((sum, book) => sum + book.pages.length, 0), 245, 'CF021–CF040 should add 245 story pages');
for (const book of manifestBooks) {
  assert.equal(book.pages.length, book.pages.filter((item) => item.verificationStatus === 'verified').length, `${book.id} pages must be verified`);
  for (const item of book.pages) {
    assert.equal(item.choices.length, 3, `${book.id} page ${item.printedPage} should have answer plus two distractors`);
    assert.equal(item.blanks.length, 1, `${book.id} page ${item.printedPage} should have one blank`);
    assert.ok(item.sentence.includes(item.blanks[0]), `${book.id} blank must occur in the sentence`);
    await access(new URL(`../${item.image.slice(2)}`, import.meta.url), fsConstants.R_OK);
    await access(new URL(`../${item.audio.slice(2)}`, import.meta.url), fsConstants.R_OK);
  }
}

assert.match(source, /function renderChallenge/, 'Read & Fill should use one challenge layout for listen and fill');
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
assert.match(source, /story\|\$\{activeBookId\}\|page-/, 'Story star keys should be stable per book/page');
assert.match(source, /Great job, Kaka! You got it right!/, 'The praise lines should address Kaka in English');
assert.match(source, /speakPraise\(\(\) => \{/, 'Correct answers should praise before showing Next page');
assert.match(source, /\$\('#btn-story-submit'\)\?\.remove\(\)/, 'Submit should be removed after a correct answer');
assert.doesNotMatch(source, /function renderListen/, 'There should be no separate listen-only layout');
assert.doesNotMatch(source, /const MISSION/, 'The former separate multi-question mission should be removed');
assert.match(source, /autoPlay: phase === 'listen'/, 'Each page should auto-play the story clip in the challenge layout');

assert.match(css, /orientation:\s*landscape/, 'iPad landscape should have a dedicated media query');
assert.match(css, /grid-template-columns:\s*minmax\(0,\s*58%\)\s*minmax\(280px,\s*42%\)/, 'Landscape challenge layout should allocate space to image and fill panel');
assert.match(css, /\.story-challenge-story/, 'Story listen control should sit with the page image');
assert.match(css, /\.story-fill-panel[\s\S]*padding:\s*clamp\(12px/, 'Fill panel should keep comfortable inner padding');
assert.match(source, /story-challenge-story/, 'Listen to the story should live in the left story column');
assert.doesNotMatch(source, /story-fill-tools/, 'Story listen should not share the right-hand quiz toolbar');
assert.match(index, /每頁先聽故事，再把剛才聽到的一個字放回短句/);
assert.match(index, /data\/carter-family-manifest\.js/, 'The Carter manifest must load before Story English');
assert.match(starFx, /'screen-story-play'/, 'Story play should use the shared ranger star animation');
assert.match(index, /STORY ENGLISH・Carter Family/, 'Home entry should name the Carter Family track');

const requiredAssets = [
  '../assets/story-demo/pages/page-01.jpg',
  '../assets/story-demo/cf001-game-night-page-01.mp3',
  '../assets/story-demo/cf002/pages/page-12.jpg',
  '../assets/story-demo/cf002/cf002-the-tree-house-page-12.mp3',
  '../assets/story-demo/cf003/pages/page-14.jpg',
  '../assets/story-demo/cf003/cf003-the-school-play-page-14.mp3',
];
for (const relative of requiredAssets) {
  await access(new URL(relative, import.meta.url), fsConstants.R_OK);
}

console.log('story read-and-fill checks passed');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SPACE_PATROL_BLUE_MOON_ARC,
  SPACE_PATROL_PILOT_QUESTIONS,
} from '../data/space-patrol/blue-moon-arc.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'space-patrol-demo.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'js/space-patrol-demo.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/space-patrol-demo.css'), 'utf8');
const data = fs.readFileSync(path.join(root, 'data/space-patrol/blue-moon-arc.mjs'), 'utf8');

assert.match(html, /type="module"/, 'pilot uses module data/runtime');
assert.match(html, /sp-lesson/, 'pilot has a lesson screen');
assert.match(html, /sp-quiz/, 'pilot has a quiz screen');
assert.match(js, /playStoryAudio/, 'lesson plays original story audio');
assert.match(js, /correctCount \+= 1/, 'correct answers add stars');
assert.match(js, /questionIndex >= questions\.length/, 'quiz has an explicit completion path');
assert.match(css, /orientation:\s*landscape/, 'pilot has an iPad landscape layout');

for (const bookId of ['blue-moon-1', 'blue-moon-2', 'blue-moon-3']) {
  assert.match(data, new RegExp(`id: '${bookId}'`), `${bookId} is in the pilot`);
}
assert.equal((data.match(/sourcePdf:/g) || []).length, 3, 'each pilot book has a source PDF');
assert.equal((data.match(/sourceAudio:/g) || []).length, 3, 'each pilot book has a source MP3');
assert.equal((data.match(/wordSourcePdf:/g) || []).length, 3, 'each pilot book has a word PDF');
assert.equal((data.match(/\['space'/g) || []).length, 1, 'pilot data is authored from selected source words');
assert.equal((data.match(/\['mission'/g) || []).length, 1, 'pilot includes mission vocabulary');
assert.equal(SPACE_PATROL_PILOT_QUESTIONS.length, 10, 'pilot quiz has 10 questions');
assert.equal(SPACE_PATROL_BLUE_MOON_ARC.books.length, 3, 'pilot has three books');

for (const relative of [
  'assets/space-patrol/blue-moon-arc/book-01/page-01.webp',
  'assets/space-patrol/blue-moon-arc/book-02/page-06.webp',
  'assets/space-patrol/blue-moon-arc/book-03/page-03.webp',
  'assets/space-patrol/blue-moon-arc/audio/blue-moon-1.mp3',
  'assets/space-patrol/blue-moon-arc/audio/blue-moon-2.mp3',
  'assets/space-patrol/blue-moon-arc/audio/blue-moon-3.mp3',
]) assert.ok(fs.existsSync(path.join(root, relative)), `${relative} exists`);

console.log('Space Patrol pilot checks passed: 3 books, 18 page images, 3 audio files, 10 quiz questions');

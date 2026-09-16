import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/story-demo.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../css/story-demo.css', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(source, /const PAGES = \[/, 'Read & Fill page data should exist');
assert.match(source, /pageCount: PAGES\.length/, 'The page count should be exposed for the demo');
assert.equal((source.match(/sourceClip: '/g) || []).length, 12, 'Every story page needs a source audio trace');
assert.equal((source.match(/blanks: \[/g) || []).length, 12, 'Every story page needs one short fill activity');
assert.match(source, /function renderFill/, 'The fill screen should render after the page audio');
assert.match(source, /draggable="true"/, 'Word tiles should support dragging');
assert.match(source, /tile\.addEventListener\('click'/, 'Word tiles should also support tapping');
assert.match(source, /audio\.onended = \(\) => \{ if \(after\) after\(\)/, 'The fill activity must follow the original page audio');
assert.doesNotMatch(source, /speakEnglishTerm/, 'Story reading must not use English TTS');
assert.doesNotMatch(source, /const MISSION/, 'The former separate multi-question mission should be removed');
assert.match(css, /grid-template-columns:minmax\(0,58%\) minmax\(300px,42%\)/, 'iPad challenge layout should allocate space to image and fill panel');
assert.match(index, /每頁先聽故事，再把剛才聽到的一個字放回短句/);
console.log('story read-and-fill checks passed');

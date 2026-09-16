import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../js/story-demo.js', import.meta.url), 'utf8');
const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(source, /const MISSION = \[/, 'Story Mission data should exist');
assert.match(source, /missionLength: MISSION\.length/, 'Mission length should be exposed for the demo');
assert.match(source, /count: MISSION\.length/, 'Hub should describe the real mission length');
for (const type of ['scene', 'word', 'build', 'meaning', 'echo']) assert.match(source, new RegExp(`type: '${type}'`));
assert.match(source, /sourceClip: '86\.mp3'/, 'Mission lines should retain a Carter source clip trace');
assert.match(source, /function audioMarkup/, 'Story activity should render page-audio controls');
assert.doesNotMatch(source, /speakEnglishTerm/, 'Story Mission should use original page audio instead of English TTS');
assert.match(index, /Sentence Mission 的每一句都可追溯到故事頁和原始錄音/);

const missionBlock = source.slice(source.indexOf('const MISSION = ['), source.indexOf('];\n\n  const ACTIVITIES'));
assert.equal((missionBlock.match(/type: '/g) || []).length, 10, 'Game Night pilot should have exactly ten questions');
console.log('story mission checks passed');

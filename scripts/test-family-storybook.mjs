#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const html = read('family-storybook.html');
const js = read('js/family-storybook.js');
const css = read('css/family-storybook.css');
const celebrateCss = read('css/celebrate-finish.css');

assert.match(html, /id="replay-story"/);
assert.match(html, /再玩一次/);
assert.match(html, /返回故事書目/);
assert.match(html, /id="story-finish-actions"/);
assert.match(html, /id="completion-line"/);
assert.match(html, /你好叻啊，完成咗啦，獎勵你一個金幣！/);
assert.match(html, /class="play-finish completion hidden"/);
assert.match(js, /function replayCurrentStory/);
assert.match(js, /root:\s*completion/);
assert.doesNotMatch(js, /scrollHeight/);
const afterHeard = js.match(/function afterPageHeard\([^)]*\) \{[\s\S]*?\n  \}/)?.[0] || '';
assert.match(afterHeard, /function afterPageHeard/);
assert.doesNotMatch(afterHeard, /audioLocked\s*=\s*true/);
assert.doesNotMatch(afterHeard, /speakStory\(/);
assert.match(celebrateCss, /position:\s*fixed/);
assert.match(css, /min-height:\s*52px/);

const context = { window: {} };
vm.runInNewContext(read('data/family-stories/manifest.js'), context);
const story = context.window.FAMILY_STORIES.find((item) => item.id === 'xiyu-fullmoon-party');
assert.ok(story, '要有浠榆滿月派對');
assert.equal(story.pages[2].dialogue.speaker, '爸爸');
assert.match(story.pages[2].sentence, /爸爸/);
assert.equal(JSON.stringify(story.pages[4].focusWords), JSON.stringify(['樓梯', '上上落落']));
assert.match(story.pages[4].sentence, /上上落落/);
assert.doesNotMatch(story.pages[4].sentence, /走上走下/);
assert.ok(story.characters.includes('爸爸'));

console.log('test-family-storybook: ok');

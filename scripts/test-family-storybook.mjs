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
assert.match(js, /!story\.hidden && !story\.retired/);
assert.match(css, /\.word-choice[\s\S]*transform:\s*none/);
assert.doesNotMatch(css, /\.word-choice:not\(:disabled\):hover[^}]*transform:\s*translateY/);
assert.doesNotMatch(css, /@keyframes\s+[^{]*(shake|bounce|pulse|flash|wiggle)/i);
assert.match(js, /if \(!state\.wordPool\) \{[\s\S]*?state\.wordPool = shuffle\(/);
assert.match(js, /const pool = state\.wordPool/);
assert.equal([...js.matchAll(/\bshuffle\(/g)].length, 1, 'shuffle 只可以喺入頁第一次組詞語池時叫');
assert.doesNotMatch(js, /addEventListener\('click'[\s\S]{0,500}shuffle\(/);
assert.match(js, /function speakPlacedChip/);
assert.match(js, /speakThen\(word, \{ muted, lang: 'zh-HK' \}/);
assert.match(js, /playCorrectCue\(\{ muted \}\)/);
assert.match(js, /speakPlacedChip\(word, word === activeSlots\[index\]\)/);
assert.match(html, /id="activity"[\s\S]*id="next-page"[\s\S]*id="completion"/);
assert.match(css, /\.storybook-shell\.is-reading[\s\S]*\.reader-controls/);
assert.match(css, /align-items:\s*start/);

const context = { window: {} };
vm.runInNewContext(read('data/family-stories/manifest.js'), context);
const hiddenIds = ['park-kite', 'red-balloon', 'zhuhai-aquarium', 'chimelong-safari'];
for (const id of hiddenIds) {
  const retired = context.window.FAMILY_STORIES.find((item) => item.id === id);
  assert.ok(retired, `要保留 ${id} 喺 catalog`);
  assert.ok(retired.hidden || retired.retired, `${id} 要 hidden/retired，唔好出現喺書架`);
}
const playable = context.window.FAMILY_STORIES.filter((item) => !item.hidden && !item.retired);
assert.equal(playable.length, 18);
assert.equal(context.window.FAMILY_STORIES.length, 22);
const farm = context.window.FAMILY_STORIES.find((item) => item.id === 'zhongshan-happy-farm');
assert.ok(farm, '要有中山開心農莊');
assert.equal(farm.pages.length, 8);
assert.equal(farm.hidden, undefined);
assert.ok(farm.characters.includes('蛙蛙'));
assert.ok(farm.characters.includes('禧禧'));
assert.doesNotMatch(JSON.stringify(farm), /娃娃/);
assert.equal(farm.pages[3].focusWords[0], '拖拉機');
const story = context.window.FAMILY_STORIES.find((item) => item.id === 'xiyu-fullmoon-party');
assert.ok(story, '要有浠榆滿月派對');
assert.equal(story.pages[2].dialogue.speaker, '爸爸');
assert.match(story.pages[2].sentence, /爸爸/);
assert.equal(JSON.stringify(story.pages[4].focusWords), JSON.stringify(['樓梯', '上上落落']));
assert.match(story.pages[4].sentence, /上上落落/);
assert.doesNotMatch(story.pages[4].sentence, /走上走下/);
assert.ok(story.characters.includes('爸爸'));

console.log('test-family-storybook: ok');

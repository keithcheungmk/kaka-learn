#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const html = read('index.html');
const css = read('css/listen-find.css');
const js = read('js/listen-find.js');
const dialogue = read('js/listen-find-dialogue.js');

const fruitBlock = js.match(/const FRUITS = \[([\s\S]*?)\];/);
assert.ok(fruitBlock, 'FRUITS list exists');
assert.match(fruitBlock[1], /\['apple', 19, 22, 12, 20\]/);
assert.match(fruitBlock[1], /\['banana', 38, 22, 16, 21\]/);
assert.match(fruitBlock[1], /\['orange', 25, 70, 15, 23\]/);
assert.match(fruitBlock[1], /\['grapes', 19, 46, 16, 22\]/);
assert.match(fruitBlock[1], /\['pear', 38, 45, 11, 22\]/);
assert.match(fruitBlock[1], /\['strawberry', 51, 71, 10, 19\]/);
assert.match(fruitBlock[1], /\['pineapple', 61, 30, 13, 37\]/);
assert.match(fruitBlock[1], /\['watermelon', 81, 58, 21, 35\]/);
assert.equal([...fruitBlock[1].matchAll(/\['[a-z]+'/g)].length, 8, 'still eight fruit targets');

assert.match(html, /id="btn-listen-find-back"/);
assert.match(html, /<h1 class="listen-find-title">Listen &amp; Find<\/h1>/);
assert.match(html, /id="listen-find-progress"/);
assert.match(html, /class="listen-find-topbar"[\s\S]*listen-find-title[\s\S]*listen-find-progress/);
assert.doesNotMatch(html, /KAKA'S LITTLE WORLD/);
assert.match(html, /LOOK · LISTEN · PLAY/);
assert.match(html, /🔊 Listen again/);
assert.match(html, /data-fruit="apple"/);
assert.match(html, /src="assets\/english-listen-find\/fruit-shop-scene\.webp"/);

assert.match(html, /class="listen-find-stage"/);
assert.match(
  html,
  /class="listen-find-wrap"[\s\S]*class="listen-find-game"[\s\S]*listen-find-stage[\s\S]*<\/aside>\s*<\/div>\s*<div class="listen-find-start-overlay"/,
  'start overlay covers the wrap, not the overflow-hidden stage',
);
assert.match(css, /object-fit:\s*contain/);
assert.doesNotMatch(css, /object-fit:\s*cover/);
assert.match(css, /minmax\(180px,\s*200px\)/);
assert.match(css, /100cqw/);
assert.doesNotMatch(css, /minmax\(250px,\s*320px\)/);
assert.match(css, /#screen-listen-find\.is-playing \.listen-find-intro \{\s*display:\s*none/);
assert.match(css, /@media \(orientation:\s*portrait\),\s*\(max-height:\s*620px\)/);
assert.match(css, /grid-template-rows:\s*minmax\(0,\s*1fr\) auto/);
assert.match(css, /\.listen-find-listen \{[\s\S]*min-height:\s*64px/);
assert.match(css, /#app:has\(#screen-listen-find\.active\)/);
assert.match(css, /safe-area-inset-bottom/);
assert.match(css, /safe-area-inset-top/);
assert.match(css, /\.listen-find-start-card \{[\s\S]*margin:\s*auto/);
assert.doesNotMatch(css, /\.listen-find-start-overlay \{[\s\S]*place-items:\s*center/);

assert.match(js, /function layoutScene\(/);
assert.match(js, /function containRect\(/);
assert.match(js, /screen\.classList\.add\('is-playing'\)/);
assert.match(js, /orientationchange/);
assert.match(js, /ResizeObserver/);
assert.match(js, /visualViewport/);
assert.match(js, /earnCoinForMode\(/);
assert.match(js, /getCoinModeForGame\?\.\('listen'\) \|\| 'listen'/);
assert.match(js, /tryEarnStar\?\.\(\)/);
assert.match(js, /speakEnglishTerm/);
assert.doesNotMatch(js, /object-fit:\s*cover/);

assert.match(dialogue, /\{fruit\}/);
assert.match(dialogue, /KAKA_FIND_PRAISE/);

console.log('listen-find layout contract: passed');

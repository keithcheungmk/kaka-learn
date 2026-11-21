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
const scenes = read('js/listen-find-scenes.js');
const dialogue = read('js/listen-find-dialogue.js');

const sceneTargets = (id) => {
  const match = scenes.match(new RegExp(`id: '${id}',[\\s\\S]*?targets: \\[([\\s\\S]*?)\\n    \\],`));
  return match?.[1] || '';
};
const fruitBlock = sceneTargets('fruit-shop');
assert.ok(fruitBlock, 'fruit-shop targets exist');
assert.match(fruitBlock, /\['apple', 19, 22, 12, 20\]/);
assert.match(fruitBlock, /\['banana', 38, 22, 16, 21\]/);
assert.match(fruitBlock, /\['orange', 25, 70, 15, 23\]/);
assert.match(fruitBlock, /\['grapes', 19, 46, 16, 22\]/);
assert.match(fruitBlock, /\['pear', 38, 45, 11, 22\]/);
assert.match(fruitBlock, /\['strawberry', 51, 71, 10, 19\]/);
assert.match(fruitBlock, /\['pineapple', 61, 30, 13, 37\]/);
assert.match(fruitBlock, /\['watermelon', 81, 58, 21, 35\]/);
assert.equal([...fruitBlock.matchAll(/\['[a-z]+'/g)].length, 8, 'still eight fruit targets');

const farmBlock = sceneTargets('farm');
assert.ok(farmBlock, 'farm targets exist');
for (const word of ['cow', 'pig', 'horse', 'chicken', 'duck', 'sheep', 'goat', 'rabbit']) {
  assert.match(farmBlock, new RegExp(`\\['${word}',\\s*\\d+`));
}
assert.equal([...farmBlock.matchAll(/\['[a-z]+'/g)].length, 8, 'farm has eight animal targets');
assert.match(farmBlock, /\['cow', 54, 36, 17, 28\]/);
assert.match(farmBlock, /\['rabbit', 83, 81, 12, 20\]/);

const zooBlock = sceneTargets('zoo');
assert.ok(zooBlock, 'zoo targets exist');
for (const word of ['lion', 'elephant', 'giraffe', 'monkey', 'panda', 'zebra', 'penguin', 'hippo']) {
  assert.match(zooBlock, new RegExp(`\\['${word}',\\s*\\d+`));
}
assert.equal([...zooBlock.matchAll(/\['[a-z]+'/g)].length, 8, 'zoo has eight animal targets');
assert.doesNotMatch(zooBlock, /\btiger\b|\bpony\b|\bchick\b|\bhorse\b|\bchicken\b/);
assert.doesNotMatch(scenes, /data-listen-find-chapter="(?:colours?|transport|clothes)"|id: '(?:colours?|transport|clothes)'/);
assert.doesNotMatch(html + js + scenes + dialogue, /聽聲搗圖|聽聲掽圖|聽聲揪圖|洠榆|希恩|浓榆|濃榆/);

assert.match(html, /聽聲搵圖/);
assert.match(html, /id="btn-listen-find-back"/);
assert.match(html, /<h1 class="listen-find-title">Listen &amp; Find<\/h1>/);
assert.match(html, /id="listen-find-progress"/);
assert.match(html, /class="listen-find-topbar"[\s\S]*listen-find-title[\s\S]*listen-find-progress/);
assert.match(html, /data-listen-find-chapter="fruit-shop"/);
assert.match(html, /data-listen-find-chapter="farm"/);
assert.match(html, /data-listen-find-chapter="zoo"/);
assert.match(html, />水果店</);
assert.match(html, />農場</);
assert.match(html, />動物園</);
assert.match(html, /Fruit shop/);
assert.match(html, />Farm</);
assert.match(html, />Zoo</);
assert.doesNotMatch(html, /KAKA'S LITTLE WORLD/);
assert.match(html, /LOOK · LISTEN · PLAY/);
assert.match(html, /🔊 Listen again/);
assert.match(html, /data-target="apple"/);
assert.match(html, /src="assets\/english-listen-find\/fruit-shop-scene\.webp"/);
assert.match(html, /src="assets\/english-listen-find\/farm-scene\.webp"/);
assert.match(html, /src="assets\/english-listen-find\/zoo-scene\.webp"/);
assert.match(html, /去揀場景/);

assert.match(html, /class="listen-find-stage"/);
assert.match(
  html,
  /class="listen-find-wrap"[\s\S]*class="listen-find-game"[\s\S]*listen-find-stage[\s\S]*<\/aside>\s*<\/div>\s*<div class="listen-find-start-overlay"/,
  'start overlay covers the wrap, not the overflow-hidden stage',
);
assert.match(css, /\.listen-find-scene \{[\s\S]*?object-fit:\s*contain/);
assert.doesNotMatch(css, /\.listen-find-scene \{[\s\S]*?object-fit:\s*cover/);
assert.match(css, /minmax\(180px,\s*200px\)/);
assert.match(css, /100cqw/);
assert.doesNotMatch(css, /minmax\(250px,\s*320px\)/);
assert.match(css, /#screen-listen-find\.is-playing \.listen-find-intro \{\s*display:\s*none/);
assert.match(css, /#screen-listen-find\.is-picking \.listen-find-picker \{\s*display:\s*flex/);
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
assert.match(js, /function chooseChapter\(/);
assert.match(js, /screen\.classList\.add\('is-playing'\)/);
assert.match(js, /orientationchange/);
assert.match(js, /ResizeObserver/);
assert.match(js, /visualViewport/);
assert.match(js, /earnCoinForMode\(/);
assert.match(js, /getCoinModeForGame\?\.\('listen'\) \|\| 'listen'/);
assert.match(js, /tryEarnStar\?\.\(\)/);
assert.match(js, /speakEnglishTerm/);
assert.match(js, /dataset\.target/);
assert.doesNotMatch(js, /object-fit:\s*cover/);

assert.match(dialogue, /\{word\}/);
assert.match(dialogue, /KAKA_FIND_PRAISE/);

assert.ok(fs.existsSync(path.join(root, 'assets/english-listen-find/farm-scene.webp')), 'farm scene artwork exists');
assert.ok(fs.existsSync(path.join(root, 'assets/english-listen-find/fruit-shop-scene.webp')), 'fruit shop artwork exists');
assert.ok(fs.existsSync(path.join(root, 'assets/english-listen-find/zoo-scene.webp')), 'zoo scene artwork exists');

console.log('listen-find layout contract: passed');

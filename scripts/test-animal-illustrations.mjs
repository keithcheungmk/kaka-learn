import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../js/words.js', import.meta.url), 'utf8');
const browser = {};
vm.runInNewContext(source, { window: browser });
const words = browser.KakaWords;
const zoo = words.getTopicById('zoo');
assert.ok(zoo, '動物園 topic exists');
const animalWordIds = new Set(['zoo', 'small_animals', 'dino', 'bugs', 'ocean']
  .flatMap((topicId) => words.getTopicById(topicId)?.wordIds || []));

const addedAnimals = [
  ['huanxiong', '浣熊'],
  ['mizhuan', '蜜獾'],
  ['xionghei', '黑熊'],
  ['xiongzong', '棕熊（灰熊）'],
];
for (const [id, term] of addedAnimals) {
  const word = words.getWordById(id);
  assert.ok(word, `${id} word exists`);
  assert.equal(word.term, term, `${id} uses the approved Traditional Chinese label`);
  assert.ok(zoo.wordIds.includes(id), `${id} is in 動物園`);
  assert.ok(words.isChineseConnectIllustratable(word), `${id} can be played in Connect`);
}
assert.notEqual(words.getWordById('huanxiong').id, words.getWordById('mizhuan').id,
  '浣熊 and 蜜獾 remain distinct vocabulary items');

const mappedAnimals = new Map([
  ['huanxiong', 'raccoon.webp'],
  ['mizhuan', 'honey-badger.webp'],
  ['xionghei', 'black-bear.webp'],
  ['xiongzong', 'brown-bear.webp'],
  ['xiongmao', 'panda.webp'],
  ['huli', 'fox.webp'],
  ['shizi', 'lion.webp'],
  ['laohu', 'tiger.webp'],
  ['daxiang', 'elephant.webp'],
  ['changjinglu', 'giraffe.webp'],
  ['banma', 'zebra.webp'],
  ['qie', 'penguin.webp'],
  ['hou', 'monkey.webp'],
  ['hema', 'hippo.webp'],
  ['xiniu', 'rhino.webp'],
  ['luotuo', 'camel.webp'],
  ['daishu', 'kangaroo.webp'],
  ['shuxiong', 'koala.webp'],
  ['eyu', 'crocodile.webp'],
  ['maotouying', 'owl.webp'],
  ['lang', 'wolf.webp'],
  ['haitun', 'dolphin.webp'],
  ['haibao', 'seal.webp'],
  ['kongque', 'peacock.webp'],
  ['honghe', 'flamingo.webp'],
  ['she', 'snake.webp'],
  ['gou', 'dog.webp'],
  ['mao', 'cat.webp'],
  ['tu', 'rabbit.webp'],
  ['yang', 'sheep.webp'],
  ['niu', 'cow.webp'],
  ['ma', 'horse.webp'],
  ['zhu', 'pig.webp'],
  ['ji', 'chicken.webp'],
  ['ya', 'duck.webp'],
  ['wa', 'frog.webp'],
  ['bianfu', 'bat.webp'],
  ['ciwei', 'hedgehog.webp'],
  ['hudie', 'butterfly.webp'],
  ['mifeng', 'bee.webp'],
  ['mayi', 'ant.webp'],
  ['jiachong', 'beetle.webp'],
  ['zhizhu', 'spider.webp'],
  ['woniu', 'snail.webp'],
  ['maomaochong', 'caterpillar.webp'],
  ['qingting', 'dragonfly.webp'],
  ['shayu', 'shark.webp'],
  ['jingyu', 'whale.webp'],
  ['bazhaoyu', 'octopus.webp'],
  ['shuimu', 'jellyfish.webp'],
  ['haigui', 'sea-turtle.webp'],
  ['haixing', 'starfish.webp'],
  ['xiaochouyu', 'clownfish.webp'],
  ['youyu', 'squid.webp'],
]);
for (const [id, filename] of mappedAnimals) {
  const word = words.getWordById(id);
  assert.ok(animalWordIds.has(id), `${id} is in a Chinese animal topic`);
  const expectedPath = `assets/animals/wild/${filename}`;
  const markup = words.wordIllustHtml(word);
  assert.ok(markup.includes(`src="${expectedPath}"`), `${id} maps to ${filename}`);
  assert.match(markup, /class="word-photo"/, `${id} renders as an illustration`);
  assert.equal(words.isChineseConnectIllustratable(word), true, `${id} is Connect eligible`);
  const bytes = await readFile(new URL(`../${expectedPath}`, import.meta.url));
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', `${filename} has a RIFF container`);
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', `${filename} is WebP`);
  assert.equal(bytes.toString('ascii', 12, 16), 'VP8X', `${filename} uses extended WebP for alpha`);
  assert.ok((bytes[20] & 0x10) !== 0, `${filename} retains transparent background`);
  assert.ok(bytes.byteLength < 400 * 1024, `${filename} stays below the 400 KiB asset limit`);
}

const genericAnimalIds = ['xiong', 'yu', 'niao', 'chong', 'long', 'konglong', 'konglongdan'];
for (const id of genericAnimalIds) {
  const word = words.getWordById(id);
  assert.ok(word, `${id} generic animal category exists`);
  assert.ok(words.wordIllustHtml(word).includes('class="emoji-face"'),
    `${id} keeps its emoji fallback`);
  assert.ok(!words.wordIllustHtml(word).includes('word-photo'),
    `${id} remains a generic category rather than a species illustration`);
}

console.log(`Animal illustration checks passed (${mappedAnimals.size} mapped assets, 4 new zoo words, alpha and size limits, emoji fallback).`);

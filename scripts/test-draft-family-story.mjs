import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'draft-family-story.mjs');
const page = { sentence:'卡卡和禧禧看書。', focusWords:['卡卡','看書'], distractors:['跑步','畫畫'], tiles:['卡卡','和','禧禧','看書','。'] };
const story = { id:'sample-story', title:'小故事', place:'圖書館', summary:'大家一起看書。', characters:['卡卡','禧禧'], pages:Array.from({length:6}, () => ({...page})) };
function run(value) { return spawnSync(process.execPath, [script], {input:JSON.stringify(value), encoding:'utf8'}); }
let result = run(story);
assert.equal(result.status, 0, result.stderr);
const output = JSON.parse(result.stdout);
assert.deepEqual(output.pages[0].tiles, page.tiles);
assert.deepEqual(output.pages[0].learn, page.focusWords);
assert.deepEqual(output.pages[0].focusWords, page.focusWords);
assert.deepEqual(output.extensionWords, ['卡卡','看書']);
assert.deepEqual(output.sourceBooks, []);
assert.deepEqual(story.pages[0].tiles, page.tiles);
result = run({...story,pages:story.pages.map(p=>({...p,tiles:undefined}))});
assert.deepEqual(JSON.parse(result.stdout).pages[0].tiles, [page.sentence]);
for (const bad of [
  {...page, tiles:['錯字']},
  {...page, focusWords:['看書','卡卡']},
  {...page, focusWords:['卡卡','不見']},
  {...page, distractors:['卡卡','畫畫']},
  {...page, distractors:['跑步','跑步']},
  {...page, sentence:'卡卡和禧禧看書'},
  {...page, focusWords:['卡卡']},
]) {
  result = run({...story,pages:[bad,...story.pages.slice(1)]});
  assert.notEqual(result.status, 0); assert.equal(result.stdout, '');
}
result = run({...story,pages:story.pages.slice(0,5)}); assert.notEqual(result.status, 0);
console.log('family story draft: valid story and invalid input cases passed');

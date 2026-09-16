#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'js/book-scene-demo.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'book-scene-demo.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
assert.match(source, /id: 'balloon'/);
assert.match(source, /id: 'anan'/);
assert.equal((source.match(/image: 'assets\/book-scenes\//g) || []).length, 6);
for (const term of ['紅氣球', '藍氣球', '黃氣球', '綠氣球', '氣球', '飛走了', '花生', '糖果', '餅乾', '水果', '薯片', '汽水']) assert.ok(source.includes(`word: '${term}'`));
assert.equal((source.match(/distractors:/g) || []).length, 6);
for (const file of ['balloon-colours-a.jpg', 'balloon-colours-b.jpg', 'balloon-flew-away.jpg', 'anan-snacks.jpg', 'anan-biscuits-fruit.jpg', 'anan-chips-drink.jpg']) assert.ok(fs.existsSync(path.join(root, 'assets/book-scenes', file)));
assert.match(source, /draggable=/);
assert.match(source, /addEventListener\('drop'/);
assert.match(source, /scene-submit/);
assert.match(html, /js\/speech\.js/);
assert.match(app, /book-scene-demo\.html/);
assert.match(app, /紅輯場景遊戲・試玩兩本書/);
console.log('Book scene demo tests: 9 passed');

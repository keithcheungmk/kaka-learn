#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert.match(app, /\['肥牛烏冬', '冬天', '天氣', '氣球', '球鞋'\]/);
assert.equal((app.match(/\['肥牛烏冬'/g) || []).length, 1);
assert.match(app, /getCoinModeForGame\('chain'\)/);
assert.doesNotMatch(app, /for \(let i = 0; i < 10; i \+= 1\) tryEarnStar\(\)/);
assert.match(html, /完成詞語鏈可得一粒星/);
console.log('chain tests: 4 passed');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'js/saturn-demo.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'saturn-demo.html'), 'utf8');

assert.match(source, /Array\(16\)\.fill\(null\)/, 'board should preserve 16 fixed cells');
assert.match(source, /function filledCount\(\)/, 'board should count filled cells separately');
assert.match(source, /const oldCell = placed\.indexOf\(index\)/, 'moving a block should locate its old cell');
assert.doesNotMatch(source, /placed\.splice\(/, 'deleting a block must not compact the board');
assert.doesNotMatch(source, /placed = placed\.filter\(/, 'deleting a block must not shift later cells');
assert.match(source, /if \(!Number\.isInteger\(index\).*return;/, 'drop handler should reject invalid indices');
assert.match(source, /placed\[nextCell\] = index/, 'tap should place into the first empty cell');
assert.match(html, /data-mode="stack"/, 'stack mode should remain available');
assert.match(html, /id="btn-answer"/, 'demo should expose an answer button');
assert.match(html, /id="btn-stairs"/, 'demo should expose the stairs challenge');

console.log('saturn-demo tests: 9 passed');

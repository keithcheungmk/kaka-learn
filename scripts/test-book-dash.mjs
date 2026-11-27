import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const html = fs.readFileSync(path.join(root, 'book-dash-demo.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/book-dash-demo.css'), 'utf8');
const source = fs.readFileSync(path.join(root, 'data/book-dash/its-my-birthday.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const manifest = context.window.KAKA_BOOK_DASH;

assert.match(html, /data\/book-dash\/its-my-birthday\.js/);
assert.match(html, /js\/book-dash-demo\.js/);
assert.match(css, /\.word\{[^}]*border:0/);
assert.match(css, /\.word:focus-visible/);
assert.match(css, /\.word\.active/);
assert.doesNotMatch(css, /\.word:hover/);
assert.equal(manifest.pages.length, 12);
assert.equal(manifest.narration.originalAuthorAudioUsed, false);

for (const page of manifest.pages) {
  for (const key of ['image', 'audio']) {
    const file = path.join(root, page[key].replace(/^\.\//, ''));
    assert.ok(fs.existsSync(file), `${page.id} ${key} exists`);
    assert.ok(fs.statSync(file).size > 0, `${page.id} ${key} non-empty`);
  }
  assert.ok(page.words.length > 0, `${page.id} has word targets`);
  for (const word of page.words) {
    for (const key of ['xPercent', 'yPercent', 'widthPercent', 'heightPercent', 'startMs', 'endMs']) {
      assert.equal(typeof word[key], 'number', `${page.id} ${word.text} has ${key}`);
    }
    assert.ok(word.endMs >= word.startMs, `${page.id} ${word.text} timing order`);
  }
}

console.log(`Book Dash manifest passed: ${manifest.pages.length} pages, ${manifest.pages.reduce((n, p) => n + p.words.length, 0)} word targets.`);

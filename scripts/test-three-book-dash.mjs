import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

for (const [slug, count] of [['a-house-for-mouse', 14], ['a-beautiful-day', 12], ['a-tiny-seed', 12]]) {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(`data/book-dash/${slug}.js`, 'utf8'), ctx);
  const pages = ctx.window.KAKA_BOOK_DASH.pages;
  assert.equal(pages.length, count, slug);
  for (const page of pages) {
    assert.ok(fs.statSync(page.image).size > 0, page.image);
    if (page.words.length) assert.ok(fs.statSync(page.audio).size > 0, page.audio);
    for (const w of page.words) {
      assert.ok(w.xPercent >= 0 && w.yPercent >= 0 && w.xPercent + w.widthPercent <= 100 && w.yPercent + w.heightPercent <= 100, w.text);
      assert.ok(w.startMs >= 0 && w.endMs >= w.startMs, w.text);
    }
  }
}
console.log('Three Book Dash stories: pages, assets, coordinates and timings passed');

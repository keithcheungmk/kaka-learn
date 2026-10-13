#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const navSrc = read('js/nav-back.js');
const appSrc = read('js/app.js');
const fourJs = read('js/four-panel-story.js');
const commonSenseJs = read('js/common-sense.js');
const commonSenseHtml = read('common-sense.html');
const familyJs = read('js/family-storybook.js');
const familyEnJs = read('js/family-storybook-en.js');

function loadNav({ referrer = '', assign } = {}) {
  const location = {
    href: 'https://keithcheungmk.github.io/kaka-learn/four-panel-story.html',
    origin: 'https://keithcheungmk.github.io',
    assign: assign || (() => {}),
  };
  const history = { backCalls: 0, back() { this.backCalls += 1; } };
  const context = {
    window: { location, history },
    document: { referrer },
    location,
    history,
    URL,
  };
  context.window = { ...context.window, location, history };
  vm.createContext(context);
  vm.runInContext(navSrc, context);
  return { nav: context.window.KakaNav, history, location };
}

const noRef = loadNav({ referrer: '' });
assert.equal(noRef.nav.canHistoryBack(), false);
let assigned = '';
const fallback = loadNav({
  referrer: '',
  assign(href) { assigned = href; },
});
fallback.nav.goBackOr('index.html#screen-topics');
assert.equal(fallback.history.backCalls, 0);
assert.equal(assigned, 'index.html#screen-topics');

const withRef = loadNav({ referrer: 'https://keithcheungmk.github.io/kaka-learn/index.html#screen-topics' });
assert.equal(withRef.nav.canHistoryBack(), true);
withRef.nav.goBackOr('index.html#screen-topics');
assert.equal(withRef.history.backCalls, 1);

const external = loadNav({ referrer: 'https://example.com/' });
assert.equal(external.nav.canHistoryBack(), false);

assert.match(appSrc, /applyLocationHash/);
assert.match(appSrc, /kaka-return-screen/);
assert.match(appSrc, /back_forward/);
assert.match(appSrc, /screen-topics/);
assert.match(appSrc, /screen-english-hub/);
assert.match(appSrc, /screen-story-series/);
assert.match(fourJs, /leavePlay\(\)/);
assert.match(fourJs, /goBackOr\('index\.html#screen-topics'\)/);
assert.match(familyJs, /leaveReader\(\)/);
assert.match(familyJs, /goBackOr\('index\.html#screen-topics'\)/);
assert.match(familyEnJs, /leaveReader\(\)/);
assert.match(familyEnJs, /goBackOr\('index\.html#screen-story-series'\)/);
assert.doesNotMatch(familyEnJs, /goBackOr\('index\.html#screen-english-hub'\)/);
assert.match(commonSenseHtml, /href="index.html#screen-home"/);
assert.match(commonSenseHtml, /nav-back\.js/);
assert.match(commonSenseJs, /HOME_HREF = 'index\.html#screen-home'/);
assert.match(commonSenseJs, /goBackOr\(HOME_HREF\)/);

console.log('PASS: one-level back — history.back when same-origin, else parent hash.');

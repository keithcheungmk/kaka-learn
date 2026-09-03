#!/usr/bin/env node
/** version-check.js 單元測試：新版唔可以打斷遊戲，只可喺安全畫面 reload。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/version-check.js'), 'utf8');

function makeHarness({ current = 'old', latest = 'new', screen = 'screen-home' } = {}) {
  let activeScreenId = screen;
  let reloads = 0;
  let observerCallback = null;
  const timers = [];
  const documentListeners = {};
  const windowListeners = {};

  const document = {
    currentScript: { src: `https://example.test/js/version-check.js?v=${current}` },
    visibilityState: 'visible',
    querySelector(selector) {
      if (selector === '.screen.active') return { id: activeScreenId };
      if (selector === '#app') return {};
      return null;
    },
    addEventListener(name, fn) {
      documentListeners[name] = fn;
    },
  };

  class MutationObserver {
    constructor(fn) {
      observerCallback = fn;
    }
    observe() {}
  }

  const window = {
    location: {
      href: 'https://example.test/',
      reload() {
        reloads += 1;
      },
    },
    addEventListener(name, fn) {
      windowListeners[name] = fn;
    },
    setTimeout(fn) {
      timers.push(fn);
      return timers.length;
    },
    setInterval() {
      return 1;
    },
  };

  const context = {
    window,
    document,
    MutationObserver,
    URL,
    fetch: async () => ({ ok: true, json: async () => ({ version: latest }) }),
  };
  vm.createContext(context);
  vm.runInContext(code, context);

  return {
    async runFirstCheck() {
      await timers[0]();
    },
    setScreen(id) {
      activeScreenId = id;
      observerCallback?.();
    },
    reloads() {
      return reloads;
    },
    documentListeners,
    windowListeners,
  };
}

console.log('version-check.js tests');

{
  const h = makeHarness({ screen: 'screen-listen' });
  await h.runFirstCheck();
  assert.equal(h.reloads(), 0, '聽一聽進行中唔可以 reload');
  h.setScreen('screen-home');
  assert.equal(h.reloads(), 1, '返主頁後應套用等候中嘅新版');
  console.log('  ✓ 遊戲中延後更新，返安全畫面先 reload');
}

{
  const h = makeHarness({ current: 'same', latest: 'same', screen: 'screen-home' });
  await h.runFirstCheck();
  assert.equal(h.reloads(), 0);
  console.log('  ✓ 版本相同唔 reload');
}

{
  const h = makeHarness({ screen: 'screen-learn' });
  await h.runFirstCheck();
  h.setScreen('screen-play');
  assert.equal(h.reloads(), 0, '學習／揀玩法途中都唔應該 reload');
  h.setScreen('screen-topics');
  assert.equal(h.reloads(), 1);
  console.log('  ✓ 學習流程延後更新，返主題頁先 reload');
}

console.log('\n3 passed');

#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const js = read('js/celebrate-finish.js');
const css = read('css/celebrate-finish.css');
const app = read('js/app.js');
const index = read('index.html');

assert.match(js, /你好叻啊，完成咗啦，獎勵你一個金幣！/);
assert.match(js, /kaka-ranger-celebrate\.png/);
assert.match(js, /kaka-ranger-star\.png/);
assert.match(js, /speakTerm/);
assert.match(js, /kaka-celebrate-skip/);
assert.match(css, /kaka-ranger-star\.png/);
assert.match(css, /kaka-celebrate-waiting/);
assert.match(css, /position:\s*fixed/);
assert.match(css, /align-items:\s*center/);
assert.match(css, /justify-content:\s*center/);
assert.match(css, /\.play-finish\[hidden\]/);
assert.match(index, /id="btn-mode-match"[^>]*\bhidden\b/);
assert.match(index, /celebrate-finish\.js/);
assert.match(app, /matchBtn\.hidden = true/);
assert.match(app, /KakaCelebrate/);
assert.match(read('css/phonics.css'), /@media \(min-width: 700px\)/);
assert.match(read('css/phonics.css'), /connect-picture-main \.emoji-plate/);
assert.match(read('css/phonics.css'), /min\(120px, 15vw, 18vh\)/);
assert.match(app, /minmax\(0, 1\.22fr\) minmax\(0, 1fr\)/);

for (const page of [
  'index.html',
  'common-sense.html',
  'four-panel-story.html',
  'interview-comics.html',
  'family-storybook.html',
  'family-storybook-en.html',
  'book-scene-demo.html',
  'pth-demo.html',
]) {
  const html = read(page);
  assert.match(html, /celebrate-finish\.js/, `${page} 要載入完成獎勵腳本`);
  assert.match(html, /celebrate-finish\.css/, `${page} 要載入完成獎勵樣式`);
}

for (const file of [
  'js/phonics-app.js',
  'js/math-app.js',
  'js/common-sense.js',
  'js/four-panel-story.js',
  'js/interview-comics.js',
  'js/family-storybook.js',
  'js/book-scene-demo.js',
]) {
  assert.match(read(file), /KakaCelebrate/, `${file} 完成流程要呼叫 KakaCelebrate`);
}

assert.match(read('family-storybook.html'), /再玩一次/);
assert.match(read('js/family-storybook.js'), /root:\s*completion/);

class MockEl {
  constructor(tag, attrs = {}) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.attrs = { ...attrs };
    this.children = [];
    this.parent = null;
    this.className = attrs.class || '';
    this.id = attrs.id || '';
    this.hidden = attrs.hidden != null;
    this.innerHTML = '';
    this.textContent = '';
    this.onclick = null;
    this.style = {};
    this.classList = {
      add: (...names) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((n) => set.add(n));
        this.className = [...set].join(' ');
      },
      remove: (...names) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        names.forEach((n) => set.delete(n));
        this.className = [...set].join(' ');
      },
      toggle: (name, force) => {
        const set = new Set(this.className.split(/\s+/).filter(Boolean));
        const on = force == null ? !set.has(name) : Boolean(force);
        if (on) set.add(name); else set.delete(name);
        this.className = [...set].join(' ');
        return on;
      },
      contains: (name) => this.className.split(/\s+/).includes(name),
    };
  }
  setAttribute(name, value) { this.attrs[name] = String(value); if (name === 'id') this.id = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  removeAttribute(name) { delete this.attrs[name]; }
  appendChild(child) { child.parent = this; this.children.push(child); return child; }
  insertBefore(child, before) {
    child.parent = this;
    const i = this.children.indexOf(before);
    if (i < 0) this.children.push(child);
    else this.children.splice(i, 0, child);
    return child;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  querySelectorAll(sel) {
    const out = [];
    const walk = (node) => {
      if (matchSel(node, sel)) out.push(node);
      node.children.forEach(walk);
    };
    this.children.forEach(walk);
    if (this.innerHTML && sel.includes('kaka-celebrate-skip') && /kaka-celebrate-skip/.test(this.innerHTML)) {
      const skip = new MockEl('button', { class: 'kaka-celebrate-skip' });
      skip.textContent = '跳過';
      out.push(skip);
      this.children.push(skip);
    }
    return out;
  }
  contains(node) {
    if (node === this) return true;
    return this.children.some((child) => child.contains?.(node));
  }
}

function matchSel(node, sel) {
  if (!sel) return false;
  if (sel.startsWith('.')) return node.className.split(/\s+/).includes(sel.slice(1));
  if (sel.startsWith('#')) return node.id === sel.slice(1);
  if (sel.includes(',')) return sel.split(',').some((part) => matchSel(node, part.trim()));
  if (sel.startsWith('[')) {
    const key = sel.replace(/[\[\]\]]/g, '').split('=')[0];
    return node.attrs[key] != null;
  }
  return node.tagName === sel.toUpperCase();
}

const body = new MockEl('body');
const overlayHost = body;
const document = {
  body,
  scripts: [{ src: 'https://example.test/js/celebrate-finish.js' }],
  getElementById: (id) => {
    const all = [];
    const walk = (n) => { all.push(n); n.children.forEach(walk); };
    walk(body);
    return all.find((n) => n.id === id) || null;
  },
  createElement: (tag) => new MockEl(tag),
  querySelector: (sel) => document.querySelectorAll(sel)[0] || null,
  querySelectorAll: (sel) => {
    const all = [];
    const walk = (n) => { if (matchSel(n, sel)) all.push(n); n.children.forEach(walk); };
    walk(body);
    return all;
  },
};

const spoken = [];
const context = {
  window: {
    KakaSpeech: {
      speakTerm: (text, opts = {}) => {
        spoken.push(text);
        setTimeout(() => opts.onEnd?.(), 20);
      },
      estimateSpeakMs: () => 40,
      playStarCue: () => {},
      playCoinHintCue: () => {},
      cancelAllSpeech: () => {},
    },
    matchMedia: () => ({ matches: true }),
  },
  document,
  setTimeout,
  clearTimeout,
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(js, context);

const api = context.window.KakaCelebrate;
assert.equal(api.LINE, '你好叻啊，完成咗啦，獎勵你一個金幣！');

const actions = new MockEl('div', { class: 'btn-row' });
actions.textContent = '再玩一次';
body.appendChild(actions);

await api.play({ actions, muted: false });
assert.equal(actions.hidden, false, '動畫完之後要再顯示再玩掣');
assert.equal(spoken[0], api.LINE);
assert.ok(document.getElementById('kaka-celebrate'), '要建立全頁獎勵層');

console.log('test-celebrate-finish: ok');

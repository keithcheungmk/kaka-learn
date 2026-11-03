#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const dataContext = { window: {} };
vm.runInNewContext(read('data/common-sense-construction-trucks.js'), dataContext);
const vehicles = dataContext.window.CONSTRUCTION_TRUCKS;
const ids = ['excavator', 'crane', 'loader', 'road-roller', 'forklift', 'mixer', 'dump-truck', 'tanker'];

assert.equal(vehicles.length, 8, 'must cover the eight toy vehicle types');
assert.deepEqual(Array.from(vehicles, (v) => v.id), ids, 'keep the illustration sprite order and learning records aligned');
for (const item of vehicles) {
  for (const key of ['yue', 'mandarin', 'english', 'fact', 'factMandarin', 'factEnglish', 'job', 'toy']) {
    assert.ok(item[key]?.trim(), `${item.id} needs ${key}`);
  }
  assert.ok(item.yue.length < 12, `${item.id} Cantonese label fits the card`);
}

const catalog = read('data/common-sense-catalog.js');
assert.match(catalog, /construction-trucks\.html/);
assert.match(catalog, /assets\/common-sense\/construction-trucks-v2\.webp/);
assert.match(read('common-sense.html'), /common-sense-catalog\.js\?v=cs-construction-trucks-art-v2-20261103/);
const page = read('construction-trucks.html');
assert.match(page, /data-say-name="mandarin"/);
assert.match(page, /data-say-name="english"/);
assert.match(page, /data-say-fact="mandarin"/);
assert.match(page, /data-say-fact="english"/);
assert.match(page, /安全提示：工程車很大，要站遠一點看/);
assert.match(page, /id="screen-quiz"/);
assert.match(page, /id="screen-finish"/);
assert.match(page, /id="detail-selector" role="group" aria-label="選擇工程車"/);
const app = read('js/construction-trucks.js');
assert.match(app, /aria-label="選擇\$\{vehicle\.yue\}" aria-pressed="\$\{index === selectedVehicle\}"/);
assert.match(app, /class="vehicle-art selector-art" data-vehicle="\$\{vehicle\.id\}"/);
assert.match(app, /addEventListener\('click', \(\) => openDetail\(Number\(button\.dataset\.select\)\)\)/);
assert.match(app, /earnCoinForMode\?\.\('common-sense-construction-trucks'\)/);
assert.match(app, /markTopicPassed\?\.\('common-sense', 'construction-trucks'\)/);
assert.match(app, /tryEarnStar/);
assert.match(app, /playTryAgainCue/);
assert.match(app, /playCorrectCue/);
assert.match(read('js/storage.js'), /'common-sense-construction-trucks'/);
const asset = fs.statSync(path.join(root, 'assets/common-sense/construction-trucks-v2.webp'));
assert.ok(asset.size <= 400_000, `vehicle contact sheet must stay within asset limit (${asset.size} bytes)`);

const elements = new Map();
const makeElement = (id) => {
  const listeners = {};
  let innerHTML = '';
  let selectorButtons;
  const element = {
    id,
    dataset: {},
    attributes: {},
    classList: { toggle() {}, add() {}, remove() {} },
    addEventListener(type, callback) { listeners[type] = callback; },
    click() { listeners.click?.(); },
    setAttribute(name, value) { this.attributes[name] = value; },
    querySelectorAll(selector) {
      if (id !== 'detail-selector' || selector !== '[data-select]') return [];
      if (selectorButtons) return selectorButtons;
      selectorButtons = Array.from(innerHTML.matchAll(/<button type="button" data-select="(\d+)" aria-label="([^"]+)" aria-pressed="(true|false)"><span class="vehicle-art selector-art" data-vehicle="([^"]+)" aria-hidden="true"><\/span><\/button>/g), (match) => {
        const button = makeElement(`selector-${match[1]}`);
        button.dataset.select = match[1];
        button.ariaLabel = match[2];
        button.ariaPressed = match[3];
        button.vehicle = match[4];
        return button;
      });
      return selectorButtons;
    },
  };
  Object.defineProperty(element, 'innerHTML', {
    get() { return innerHTML; },
    set(value) { innerHTML = value; selectorButtons = undefined; },
  });
  return element;
};
const documentStub = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  },
  querySelectorAll() { return []; },
};
const windowStub = {
  document: documentStub,
  CONSTRUCTION_TRUCKS: vehicles,
  scrollTo() {},
  addEventListener() {},
  KakaNav: { bindBackLink() {} },
};
vm.runInNewContext(app, { window: windowStub, document: documentStub });
windowStub.ConstructionTruckGame.openDetail(0);
const selector = elements.get('detail-selector');
assert.equal((selector.innerHTML.match(/data-select=/g) || []).length, 8, 'detail view must render eight icon choices');
assert.match(selector.innerHTML, /aria-label="選擇挖土機" aria-pressed="true"/);
const chooseLoader = selector.querySelectorAll('[data-select]')[2];
chooseLoader.click();
assert.equal(elements.get('detail-art').dataset.vehicle, 'loader', 'tapping a vehicle icon must switch the main illustration');
assert.equal(elements.get('detail-name').textContent, '鏟土機', 'tapping a vehicle icon must switch the displayed name');
assert.match(selector.innerHTML, /data-select="2" aria-label="選擇鏟土機" aria-pressed="true"/);

console.log('Construction Truck Squad: 8 icon selectors, live detail switching, 3-language content, toy missions, rewards, and asset checks passed.');

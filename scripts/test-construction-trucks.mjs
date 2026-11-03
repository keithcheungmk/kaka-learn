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
const app = read('js/construction-trucks.js');
assert.match(app, /earnCoinForMode\?\.\('common-sense-construction-trucks'\)/);
assert.match(app, /markTopicPassed\?\.\('common-sense', 'construction-trucks'\)/);
assert.match(app, /tryEarnStar/);
assert.match(app, /playTryAgainCue/);
assert.match(app, /playCorrectCue/);
assert.match(read('js/storage.js'), /'common-sense-construction-trucks'/);
const asset = fs.statSync(path.join(root, 'assets/common-sense/construction-trucks-v2.webp'));
assert.ok(asset.size <= 400_000, `vehicle contact sheet must stay within asset limit (${asset.size} bytes)`);

console.log('Construction Truck Squad: 8 vehicles, 3-language name/facts, toy missions, feedback, reward, and asset checks passed.');

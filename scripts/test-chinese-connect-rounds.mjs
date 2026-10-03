import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const smoke = await readFile(new URL('./smoke-shots.py', import.meta.url), 'utf8');
const plannerSource = app.match(/function splitChineseConnectRounds\(words\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(plannerSource, 'Chinese Connect round planner exists');
const splitRounds = new Function(`${plannerSource}; return splitChineseConnectRounds;`)();

for (const [count, expected] of [
  [2, [2]],
  [6, [3, 3]],
  [12, [3, 3, 3, 3]],
  [13, [4, 3, 3, 3]],
  [14, [4, 4, 3, 3]],
  [15, [5, 5, 5]],
  [16, [4, 4, 4, 4]],
]) {
  const words = Array.from({ length: count }, (_, index) => `word-${index}`);
  const rounds = splitRounds(words);
  assert.deepEqual(rounds.map((round) => round.length), expected, `${count} words split into balanced rounds`);
  assert.deepEqual(rounds.flat(), words, `${count} words appear once and in order`);
  assert.ok(rounds.every((round) => round.length <= 5), `no round exceeds five pairs (${count} words)`);
}

assert.match(app, /#screen-play \.play-choices/);
assert.match(app, /const CHINESE_CONNECT_TOPIC_IDS = new Set\(\['fruit', 'zoo', 'jobs'\]\)/, 'jobs topic is enabled for Chinese Connect');
assert.match(app, /enabledWords\(\)\.filter\(\(word\) => word\?\.emoji\)/);
assert.match(app, /const isTopicComplete = round\.roundIndex === round\.rounds\.length - 1/);
assert.match(app, /if \(isTopicComplete && !round\.topicStarAwarded\)/);
assert.match(app, /完成整個主題，獲得一粒星/);
assert.doesNotMatch(html, /id="btn-mode-listen"|id="screen-listen"/);
assert.doesNotMatch(smoke, /#btn-mode-listen|聽一聽/);
assert.match(smoke, /#btn-mode-chinese-connect/);
assert.match(smoke, /#screen-chinese-connect\.active #chinese-connect-pictures \.connect-picture-main/);
assert.match(html, /「連一連」完成一個主題，可獲一粒星。/);

console.log('Chinese Connect round and reward checks passed.');

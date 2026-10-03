import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const smoke = await readFile(new URL('./smoke-shots.py', import.meta.url), 'utf8');
const wordsSource = await readFile(new URL('../js/words.js', import.meta.url), 'utf8');
const wordsWindow = {};
vm.runInNewContext(wordsSource, { window: wordsWindow });
const wordLibrary = wordsWindow.KakaWords;
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
const topicAllowlist = app.match(/const CHINESE_CONNECT_TOPIC_IDS = new Set\(\[([\s\S]*?)\]\);/)?.[1];
assert.ok(topicAllowlist, 'Chinese Connect topic allowlist exists');
const enabledTopicIds = [...topicAllowlist.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const expectedConnectTopics = [...wordLibrary.TOPICS].filter((topic) => topic.id !== 'red_series' && topic.id !== 'orange_series').map((topic) => topic.id).sort();
assert.deepEqual(enabledTopicIds.sort(), expectedConnectTopics, 'every regular Chinese topic is enabled');
assert.match(app, /const CHINESE_CONNECT_BOOK_IDS = new Set\(/, 'book-level eligibility is curated');
assert.match(app, /activeBook && CHINESE_CONNECT_BOOK_IDS\.has\(activeBook\.id\)/, 'selected books can expose Chinese Connect');
assert.match(app, /enabledWords\(\)\.filter\(isChineseConnectIllustratable\)/, 'only drawable words enter a round');
assert.match(app, /picture\.innerHTML = chineseConnectIllustHtml\(word\)/, 'Connect-specific illustration is rendered');

const bookAllowlist = app.match(/const CHINESE_CONNECT_BOOK_IDS = new Set\(\[([\s\S]*?)\]\);/)?.[1];
const enabledBookIds = [...bookAllowlist.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const allBooks = wordLibrary.TOPICS.flatMap((topic) => topic.books || []);
assert.equal(enabledBookIds.length, 16, 'four verified red books and all twelve orange books are enabled');
for (const bookId of enabledBookIds) {
  const book = allBooks.find((entry) => entry.id === bookId);
  assert.ok(book, `enabled book ${bookId} exists`);
  const missingIllustrations = [...book.wordIds].filter((id) => !wordLibrary.isChineseConnectIllustratable(wordLibrary.getWordById(id)));
  assert.deepEqual(missingIllustrations, [], `${book.title} has a clear illustration for every word`);
}
for (const topic of wordLibrary.TOPICS.filter((entry) => expectedConnectTopics.includes(entry.id))) {
  const missingIllustrations = [...topic.wordIds].filter((id) => !wordLibrary.isChineseConnectIllustratable(wordLibrary.getWordById(id)));
  assert.deepEqual(missingIllustrations, [], `${topic.title} has a clear illustration for every word`);
}
assert.match(app, /const isTopicComplete = round\.roundIndex === round\.rounds\.length - 1/);
assert.match(app, /if \(isTopicComplete && !round\.topicStarAwarded\)/);
assert.match(app, /完成整個主題，獲得一粒星/);
assert.doesNotMatch(html, /id="btn-mode-listen"|id="screen-listen"/);
assert.doesNotMatch(smoke, /#btn-mode-listen|聽一聽/);
assert.match(smoke, /#btn-mode-chinese-connect/);
assert.match(smoke, /#screen-chinese-connect\.active #chinese-connect-pictures \.connect-picture-main/);
assert.match(html, /「連一連」完成一個主題，可獲一粒星。/);

console.log('Chinese Connect round and reward checks passed.');

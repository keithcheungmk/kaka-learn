import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [app, html, css, wordsSource] = await Promise.all([
  readFile(new URL('../js/app.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../css/styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../js/words.js', import.meta.url), 'utf8'),
]);
const wordsWindow = {};
vm.runInNewContext(wordsSource, { window: wordsWindow });
const { TOPICS, wordsForTopic } = wordsWindow.KakaWords;

assert.match(html, /id="learn-words-overview"[^>]*hidden/);
assert.match(html, /id="learn-words-grid"/);
assert.match(app, /learnWordsOverview = topic\.id !== 'red_series' && topic\.id !== 'orange_series'/);
assert.match(app, /function renderChineseWordWall\(\)/);
assert.match(app, /function makeChineseWordCard\(word/);
assert.match(app, /speakTerm\(wordSpeakText\(word\), \{ muted: state\.muted \}\)/);
assert.match(app, /row\.append\([\s\S]*makeChineseWordCard\(pair\.left[\s\S]*makeChineseWordCard\(pair\.right/);
assert.match(app, /learnPassedOnce = true;[\s\S]*開始挑戰 →/);
assert.match(css, /#screen-learn\.is-word-wall\.active\s*\{[\s\S]*overflow-y: auto/);
assert.match(css, /\.chinese-words-grid\s*\{[\s\S]*repeat\(5, minmax\(0, 1fr\)\)/);
assert.match(css, /\.chinese-word-pair-row\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);

const wallTopics = TOPICS.filter((topic) => topic.id !== 'red_series' && topic.id !== 'orange_series');
assert.ok(wallTopics.length >= 20, 'the word wall covers the regular Chinese topic library');
for (const topic of wallTopics) {
  assert.ok(wordsForTopic(topic.id).length > 0, `${topic.title} has words to render`);
}
assert.ok(TOPICS.find((topic) => topic.id === 'red_series').books.length > 0, 'Red series remains a separate book flow');
assert.ok(TOPICS.find((topic) => topic.id === 'orange_series').books.length > 0, 'Orange series remains a separate book flow');

const pairs = wordsWindow.KakaWords.oppositePairWords(null);
assert.equal(pairs.length, 8, 'opposites retain all eight curated pairs');
assert.deepEqual(JSON.parse(JSON.stringify(pairs.map((pair) => [pair.left.term, pair.right.term]))), [
  ['大', '小'], ['多', '少'], ['長', '短'], ['高', '矮'],
  ['上', '下'], ['前', '後'], ['左', '右'], ['裏面', '外面'],
]);

console.log(`Chinese word-wall checks passed (${wallTopics.length} ordinary topics; Red/Orange book flows and opposite pairs preserved).`);

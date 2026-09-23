import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'js/math-app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/math.css'), 'utf8');

for (const id of ['sort', 'pattern', 'position', 'ordinal']) {
  assert.match(source, new RegExp(`id: '${id}'`), `${id} backlog planet should be defined`);
  // Ordinal uses the final generator branch after the three specialised branches.
  if (id !== 'ordinal') {
    assert.match(source, new RegExp(`if \\(planetId === '${id}'\\)`), `${id} should have a question generator`);
  }
}
assert.match(source, /BACKLOG_PATTERN_SETS = \[/, 'pattern question bank should exist');
assert.match(source, /BACKLOG_POSITION_CELLS = \[/, 'position question bank should exist');
assert.match(source, /BACKLOG_ORDINAL_ANIMALS = \[/, 'ordinal question bank should exist');
assert.match(source, /backlogQuestionIndex >= 9/, 'every backlog mission should stop after ten questions');
assert.match(source, /tryEarnStar\(\)/, 'correct backlog answers should use math stars');
assert.match(source, /lightPlanet\(backlogPlanetId\)/, 'completed backlog mission should light its planet');
assert.match(source, /mastery\.recordAttempt/, 'backlog answers should feed math mastery');
assert.match(source, /mastery\.recordMission/, 'backlog rounds should record mission history');
assert.match(source, /math-backlog-options/, 'backlog should render an answer area');
assert.match(css, /\.math-backlog-options/, 'backlog answer area needs dedicated styles');
assert.match(css, /@media \(max-width: 700px\)/, 'backlog needs a narrow viewport layout');

console.log('math-backlog tests: 14 passed');

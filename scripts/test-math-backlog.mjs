import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = fs.readFileSync(path.join(root, 'js/math-app.js'), 'utf8');
const skills = fs.readFileSync(path.join(root, 'js/math-skills.js'), 'utf8');
const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(skills, context);

const planets = [...context.window.KakaMathSkills.MATH_PLANETS];
assert.deepEqual(planets.map((planet) => planet.body), ['mercury', 'venus', 'earth', 'moon']);
assert.deepEqual(planets.map((planet) => planet.id), ['number-relations', 'time', 'compare-size', 'moon']);
assert.equal(planets.length, 4, 'only the retained four math planets should appear in the galaxy');
for (const retired of ['shape', 'sort', 'pattern', 'position', 'ordinal']) {
  assert.ok(!planets.some((planet) => planet.id === retired), `${retired} must not be playable from the galaxy`);
}
assert.match(app, /MATH_PLANETS\.find\(\(candidate\) => candidate\.id === planetId\)/);
assert.match(app, /if \(!planet\) return openGalaxy\(\)/, 'stale planet IDs must return to the galaxy, not open Mercury');
assert.doesNotMatch(app, /window\.KakaNumberBondsGame\.init/);
assert.doesNotMatch(app, /openMars|openShape|openPattern|Backlog|BACKLOG|MARS_SHAPES/);
assert.doesNotMatch(app, /screen-math-earth-bonds|btn-open-number-bonds/);
assert.match(app, /const planet = MATH_PLANETS\.find/);
assert.match(app, /if \(!planet\) return openGalaxy\(\)/);

console.log('test-math-retired-planets: ok');

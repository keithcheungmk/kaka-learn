#!/usr/bin/env node
/** math-mastery.js 單元測試：首次答對、協助完成、掌握與重練。 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'js/math-mastery.js'), 'utf8');
const context = { window: {}, Date, Set, Error };
vm.createContext(context);
vm.runInContext(code, context);
const M = context.window.KakaMathMastery;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

console.log('math-mastery.js tests');

test('首次答對與提示完成分開記錄', () => {
  let state = {};
  state = M.recordAttempt(state, {
    skillId: 'count.oneToOne.1to5',
    firstTryCorrect: true,
    at: '2026-09-01T09:00:00Z',
  });
  state = M.recordAttempt(state, {
    skillId: 'count.oneToOne.1to5',
    firstTryCorrect: false,
    assisted: true,
    hints: 2,
    errorType: 'missedObject',
    answer: 4,
    expected: 5,
    representation: 'scatteredObjects',
    at: '2026-09-01T09:01:00Z',
  });
  const stat = state.skillProgress['count.oneToOne.1to5'];
  assert.equal(stat.attempts, 2);
  assert.equal(stat.firstTryCorrect, 1);
  assert.equal(stat.assistedCorrect, 1);
  assert.equal(stat.hintCount, 2);
  assert.equal(state.mistakeHistory[0].errorType, 'missedObject');
});

test('跨兩日最近十二次有十次首次答對才標記掌握', () => {
  let state = {};
  for (let i = 0; i < 12; i += 1) {
    state = M.recordAttempt(state, {
      skillId: 'count.quantityConservation.1to5',
      firstTryCorrect: i >= 2,
      at: `${i < 6 ? '2026-09-01' : '2026-09-02'}T09:${String(i).padStart(2, '0')}:00Z`,
    });
  }
  assert.equal(state.skillProgress['count.quantityConservation.1to5'].status, 'mastered');
  assert.equal(state.skillProgress['count.quantityConservation.1to5'].lastMasteredAt, '2026-09-02T09:11:00Z');
});

test('已掌握技能最近五次錯三次會進入重練', () => {
  const stat = M.emptySkillStat();
  stat.status = 'mastered';
  stat.attempts = 20;
  stat.recentResults = [
    { firstTryCorrect: true, at: '2026-09-01' },
    { firstTryCorrect: true, at: '2026-09-01' },
    { firstTryCorrect: false, at: '2026-09-03' },
    { firstTryCorrect: false, at: '2026-09-03' },
    { firstTryCorrect: true, at: '2026-09-03' },
    { firstTryCorrect: false, at: '2026-09-03' },
  ];
  assert.equal(M.determineStatus(stat), 'review');
});

test('歷史紀錄有上限，避免 localStorage 無限增長', () => {
  let state = {};
  for (let i = 0; i < 60; i += 1) {
    state = M.recordAttempt(state, {
      skillId: 'count.numberMatch.1to10',
      firstTryCorrect: false,
      errorType: 'offByOne',
      at: `2026-09-${String((i % 20) + 1).padStart(2, '0')}T09:00:00Z`,
    });
  }
  assert.equal(state.skillProgress['count.numberMatch.1to10'].recentResults.length, 12);
  assert.equal(state.mistakeHistory.length, 50);
  for (let i = 0; i < 40; i += 1) {
    state = M.recordMission(state, { missionId: `mission-${i}` });
  }
  assert.equal(state.missionHistory.length, 30);
});

test('缺少 skillId 或 missionId 時拒絕寫入', () => {
  assert.throws(() => M.recordAttempt({}, {}), /skillId/);
  assert.throws(() => M.recordMission({}, {}), /missionId/);
});

test('M7 pickSkillForReview 按 bucket 權重揀技能', () => {
  const state = {
    skillProgress: {
      'count.oneToOne.1to5': { status: 'review', attempts: 5, firstTryCorrect: 2, recentResults: [] },
      'count.subitize.1to5': { status: 'mastered', attempts: 20, firstTryCorrect: 18, recentResults: [] },
    },
  };
  let reviewHits = 0;
  for (let i = 0; i < 40; i += 1) {
    const id = M.pickSkillForReview(state, M.MERCURY_SKILL_IDS, () => 0.05);
    if (id === 'count.oneToOne.1to5') reviewHits += 1;
  }
  assert(reviewHits >= 30, `review bucket 應優先，而家 ${reviewHits}/40`);
});

test('M8 summarizeMathProgress 列出要練技能', () => {
  const state = {
    skillProgress: {
      'count.oneToOne.1to5': { status: 'learning', attempts: 3, firstTryCorrect: 1, recentResults: [] },
      'count.subitize.1to5': { status: 'mastered', attempts: 12, firstTryCorrect: 10, recentResults: [] },
    },
    missionHistory: [{ missionId: 'a' }, { missionId: 'b' }],
  };
  const summary = M.summarizeMathProgress(state);
  assert.equal(summary.counts.mastered, 1);
  assert.equal(summary.counts.learning, 1);
  assert.equal(summary.needPractice.length, 1);
  assert.equal(summary.missions, 2);
  assert.match(summary.summaryLine, /掌握 1/);
});

console.log(`\n${passed} passed`);

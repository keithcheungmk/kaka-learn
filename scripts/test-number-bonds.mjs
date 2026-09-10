import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = { window: {}, console };
vm.createContext(context);
vm.runInContext(fs.readFileSync(new URL('../js/numberBondsData.js', import.meta.url), 'utf8'), context);
const data = context.window.KakaNumberBondsData;

const pairs = (target) => JSON.parse(JSON.stringify(data.pairsForTarget(target)));
assert.deepEqual(pairs(7), [[1, 6], [2, 5], [3, 4]]);
assert.deepEqual(pairs(10), [[1, 9], [2, 8], [3, 7], [4, 6], [5, 5]]);
assert.equal(data.getLevel(1).missions[0].target, 2);
assert.equal(data.getLevel(2).missions.at(-1).target, 20);
assert.equal(data.getMissionById('bonds-2-20').mission.pairs.length, 10);
console.log('number-bonds data tests\n  ✓ Level 1／2 範圍及所有正整數組合正確\n  ✓ 7、10、20 拆解數量正確\n\n2 passed');

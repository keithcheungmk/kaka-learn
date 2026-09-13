#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const units = JSON.parse(fs.readFileSync(path.join(root, 'data/pth/units.json')));
const quiz = JSON.parse(fs.readFileSync(path.join(root, 'data/pth/questions-u1.json')));
const audio = JSON.parse(fs.readFileSync(path.join(root, 'data/pth/audio-manifest.json')));
const media = JSON.parse(fs.readFileSync(path.join(root, 'data/pth/initial-video-manifest.json')));
const demoSource = fs.readFileSync(path.join(root, 'js/pth-demo.js'), 'utf8');
const demoHtml = fs.readFileSync(path.join(root, 'pth-demo.html'), 'utf8');
assert.deepEqual(units.lessons.slice(0, 3).map((x) => x.id), ['tones-song', 'single-finals', 'initials-bpmf']);
assert.equal(quiz.questions.length, 10);
assert.equal(new Set(quiz.questions.map((q) => q.id)).size, 10);
assert.ok(quiz.questions.every((q) => q.options.includes(q.answer)));
assert.ok(quiz.questions.every((q) => !q.audioId || audio.items[q.audioId]?.source !== '粵語TTS'));
assert.equal(Object.values(audio.items).some((x) => x.src && x.source === '粵語TTS'), false);
assert.equal(media.entries.length, 23);
assert.deepEqual(media.entries.slice(0, 4).map((x) => x.id), ['b', 'p', 'm', 'f']);
assert.ok(media.entries.every((x) => x.sourceFile.startsWith('source-materials/')));
assert.ok(media.entries.every((x) => x.status === 'verified' && fs.existsSync(path.join(root, x.derivedVideo)) && fs.existsSync(path.join(root, x.derivedAudio))));
for (const [id, emoji] of Object.entries({ b: '🎈', p: '🍇', m: '🍚', f: '🎡' })) {
  assert.ok(demoSource.includes(`id:'${id}'`) && demoSource.includes(`emoji:'${emoji}'`));
}
assert.ok(!demoSource.includes('<small>${s.sentence}</small>'));
assert.ok(demoSource.includes('s.verified'));
assert.ok(demoSource.includes('groupNames[activeGroup]'));
assert.ok(demoSource.includes('if(!sounds.some(s=>s.group===activeGroup&&s.verified))'));
assert.ok(demoSource.includes('function hydrateGroup()') && demoSource.includes('state.roundStars=gp.roundStars||0') && demoSource.includes('state.completed=!!gp.completed'));
assert.ok(demoSource.includes("kaka-pth-preview-v1") && demoSource.includes('測試預覽') && demoSource.includes('preview-badge'));
assert.ok(demoSource.includes("type:'listen'") && demoSource.includes('draggable="true"') && demoSource.includes('answerSlot'));
assert.ok(!demoSource.includes('type:i<5?"listen":"shape"'));
assert.ok(!demoSource.includes("group-btn:not([disabled])"));
assert.equal((demoSource.match(/group:'[^']+'/g) || []).length, 23);
assert.ok(demoSource.includes('function persistGroup()') && demoSource.includes('state.roundIndex=qi;persistGroup();save();') && demoSource.includes('state.completed=true;qi=0;state.roundIndex=0;persistGroup();save();')); 
assert.ok(demoSource.includes("['chē','ch']") && demoSource.includes("['chū','ch']"));
for (const id of ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w']) {
  const row = demoSource.match(new RegExp(`\\{id:'${id}'[^\\n]+`))?.[0] ?? '';
  assert.match(row, new RegExp(`syllables:\\[\\['[^']+','${id}'\\]`));
}
for (const emoji of ['🎈', '🍇', '🍚', '🎡']) assert.ok(demoHtml.includes(emoji));
assert.ok(!demoHtml.includes('波波拿波波球。') && !demoHtml.includes('小明走上山坡。') && !demoHtml.includes('媽媽煮米飯。') && !demoHtml.includes('風車不停轉動。'));
for (const id of ['b', 'p', 'm', 'f']) {
  assert.equal(audio.items[`u1-initial-${id}`].status, 'verified');
  assert.ok(fs.existsSync(path.join(root, audio.items[`u1-initial-${id}`].src)));
  assert.ok(fs.existsSync(path.join(root, audio.items[`u1-initial-${id}`].videoSrc)));
}
assert.equal(Object.keys(audio.items).length, 23);
console.log('PTH content tests: 9 passed');

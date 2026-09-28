#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {wordAudioClips} from '../js/pth-word-audio.js';
import {wordAudioSourceSegments} from '../js/pth-word-audio-source.js';

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
assert.ok(media.entries.every((x) => x.status === 'awaiting-listening-review' && fs.existsSync(path.join(root, x.derivedVideo)) && !x.derivedAudio));
assert.deepEqual(media.derivation, {height: 360, videoCodec: 'h264', crf: 29, audioCodec: 'aac', audioBitrateKbps: 64, channels: 1, trimmed: false, sourceIsPreserved: true});
const textbookAudit = media.entries.filter((x) => x.textbookStatus);
assert.equal(textbookAudit.length, 19, '19 個後續聲母均有教材參照審核狀態');
assert.equal(textbookAudit.filter((x) => !x.textbookStatus.startsWith('pending')).length, 18, '18 個聲母已在掃描教材找到對應頁（l 另標示重複掃描）');
assert.equal(textbookAudit.filter((x) => x.textbookStatus.startsWith('pending')).length, 1, '未見個別教材頁的 d 必須保留 pending');
assert.ok(textbookAudit.every((x) => x.textbookRef.startsWith('PTH textbook K2 p.')));
assert.match(textbookAudit.find((x) => x.id === 'd').textbookRef, /d 個別示範頁未見/);
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
assert.ok(demoSource.includes('function playWord') && demoSource.includes('data-word') && demoSource.includes('currentSounds().flatMap'));
assert.ok(!demoSource.includes('speechSynthesis') && !demoSource.includes('SpeechSynthesisUtterance'), 'PTH word audio must never fall back to device TTS');
assert.ok(demoSource.includes('data-word-audio') && demoSource.includes('playWord(b.dataset.word,wordAudioClips[b.dataset.wordAudio])'));
assert.ok(demoSource.includes('wordAudioClips') && demoSource.includes('sharedAudio.currentTime=start'));
assert.ok(demoSource.includes('function normalizeAudioClip') && demoSource.includes('playAudio(audioClip.src,audioClip.start,audioClip.end)'), '詞語音檔物件必須拆出 src/start/end 播放');
assert.ok(demoSource.includes('let stopTimer=null') && demoSource.includes('let uiTimer=null') && demoSource.includes('sharedAudio.onerror=fail'), '快速重按及播放失敗必須可被正確處理');
assert.equal(Object.keys(wordAudioClips).length, 69, '23 個聲母各有 3 段固定普通話例詞錄音');
assert.deepEqual(Object.keys(wordAudioClips), Object.keys(wordAudioSourceSegments));
for (const [key, clip] of Object.entries(wordAudioClips)) {
  assert.equal(clip.src, `assets/pth/words/individual/${key}.m4a`);
  assert.ok(fs.existsSync(path.join(root, clip.src)), `Missing generated Mandarin audio: ${key}`);
  assert.ok(fs.statSync(path.join(root, clip.src)).size > 1024, `Generated Mandarin audio is empty: ${key}`);
  assert.ok(wordAudioSourceSegments[key].end > wordAudioSourceSegments[key].start, `Invalid source segment: ${key}`);
}
assert.ok(demoSource.includes('function playWord') && demoSource.includes('普通話錄音未能載入') && demoSource.includes('playAudio(audioClip.src,audioClip.start,audioClip.end)'), '缺少固定錄音時須明確報錯，不能代用系統語音');
assert.ok(demoSource.includes('if(start===0||sharedAudio.readyState>=1)begin()'), 'iPad 點擊播放須在同一手勢即時呼叫 play()');
assert.ok(demoHtml.includes('wordAudioStatus'));
assert.ok(demoSource.includes('preload="metadata"') && demoSource.includes('data-play-video'), '只載入目前小隊並可由頭播放完整示範');
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
assert.equal(Object.keys(audio.items).length, 0, '舊有的靜音偵測裁切檔不得再被引用');
console.log('PTH content tests: 9 passed');

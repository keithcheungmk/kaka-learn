#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const units = JSON.parse(fs.readFileSync(path.join(root, 'data/pth/units.json')));
const quiz = JSON.parse(fs.readFileSync(path.join(root, 'data/pth/questions-u1.json')));
const audio = JSON.parse(fs.readFileSync(path.join(root, 'data/pth/audio-manifest.json')));
assert.deepEqual(units.lessons.slice(0, 3).map((x) => x.id), ['tones-song', 'single-finals', 'initials-bpmf']);
assert.equal(quiz.questions.length, 10);
assert.equal(new Set(quiz.questions.map((q) => q.id)).size, 10);
assert.ok(quiz.questions.every((q) => q.options.includes(q.answer)));
assert.ok(quiz.questions.every((q) => !q.audioId || audio.items[q.audioId]?.source !== '粵語TTS'));
assert.equal(Object.values(audio.items).some((x) => x.src && x.source === '粵語TTS'), false);
console.log('PTH content tests: 5 passed');

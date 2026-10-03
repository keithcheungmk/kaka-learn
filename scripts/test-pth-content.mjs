import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sounds, groups, buildQuestions} from '../js/pth-content.js';
import {wordAudioClips} from '../js/pth-word-audio.js';
import {createProgress} from '../js/pth-progress.js';
import './test-pth-model.mjs';
const root = new URL('../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('assets/pth/words/mandarin-v2/manifest.json', root)));
assert.equal(manifest.locale,'zh_CN'); assert.equal(manifest.source,'macOS Tingting'); assert.equal(manifest.items.length,69);
for(const word of sounds.flatMap(s=>s.examples)) {
  const item=manifest.items.find(x=>x.id===word.audioKey);
  assert.equal(item.word,word.word);assert.equal(item.speechText,word.say);assert.equal(item.pinyin,word.pinyin);
  assert.ok(item.duration>.25&&item.duration<5);
  assert.ok(fs.statSync(new URL(wordAudioClips[word.audioKey].src,root)).size>1000);
}
const memory=new Map();const store={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
store.setItem('kaka-pth-v1',JSON.stringify({totalStars:20,groupProgress:{bpmf:{completed:true},dtnl:{roundStars:6,roundIndex:2}}}));
const kaka=createProgress(store,'kaka'),heihei=createProgress(store,'heihei');
assert.equal(kaka.total(),20);assert.equal(heihei.total(),0);assert.ok(kaka.awarded('bpmf'));assert.ok(!heihei.awarded('bpmf'));
assert.equal(kaka.load('bpmf').index,10);assert.equal(kaka.load('dtnl').index,6,'preserve partial count, not old modulo index');
for(let i=0;i<10;i++){assert.ok(heihei.accept('yw',i,0));assert.equal(heihei.accept('yw',i,0),false);}
assert.equal(heihei.total(),10);assert.equal(kaka.total(),20);
heihei.restart('yw');assert.equal(heihei.accept('yw',0,0),false);
for(let i=0;i<10;i++)assert.ok(heihei.accept('yw',i,1));
assert.equal(heihei.total(),10);assert.equal(createProgress(store,'heihei').load('yw').index,10);
for(const group of groups)assert.equal(buildQuestions(group).length,10);
const runtime=fs.readFileSync(new URL('js/pth-demo.js',root),'utf8')+fs.readFileSync(new URL('js/pth-audio.js',root),'utf8');
assert.doesNotMatch(runtime,/speechSynthesis|SpeechSynthesisUtterance/);
console.log('PTH audio provenance, migration, profiles, duplicate/replay rewards: passed');

#!/usr/bin/env node
import {mkdirSync, mkdtempSync, statSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {sounds} from '../js/pth-content.js';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'assets/pth/words/mandarin-v2');
const temp = mkdtempSync(join(tmpdir(), 'pth-mandarin-'));
mkdirSync(output, {recursive:true});
function run(bin, args) {
  const result = spawnSync(bin, args, {encoding:'utf8'});
  if (result.status !== 0) throw new Error(`${bin}: ${result.stderr || result.error}`);
  return result.stdout;
}
const voices = run('say', ['-v','?']);
if (!/^Tingting\s+zh_CN\s/m.test(voices)) throw new Error('Required Mandarin Tingting voice unavailable');
const manifest = {version:2, source:'macOS Tingting', locale:'zh_CN', kind:'synthetic-word-recordings', items:[]};
for (const word of sounds.flatMap(s => s.examples)) {
  const aiff = join(temp, `${word.id}.aiff`);
  const file = join(output, `${word.id}.m4a`);
  run('say', ['-v','Tingting','-r','145','-o',aiff,word.say]);
  run('ffmpeg', ['-hide_banner','-loglevel','error','-y','-i',aiff,'-af','loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=0.18','-ac','1','-ar','24000','-c:a','aac','-b:a','48k','-movflags','+faststart',file]);
  const duration = Number(run('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file]).trim());
  if (!(duration > .25 && duration < 5) || statSync(file).size > 400000) throw new Error(`Invalid audio ${word.id}`);
  manifest.items.push({id:word.id,word:word.word,speechText:word.say,pinyin:word.pinyin,duration,bytes:statSync(file).size});
}
writeFileSync(join(output, 'manifest.json'), JSON.stringify(manifest,null,2)+'\n');
console.log(`Built ${manifest.items.length} complete Mandarin words using Tingting zh_CN.`);

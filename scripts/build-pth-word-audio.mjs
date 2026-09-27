#!/usr/bin/env node
import {mkdirSync, existsSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {wordAudioSourceSegments} from '../js/pth-word-audio-source.js';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const outputDir=join(root,'assets/pth/words/individual');
const force=process.argv.includes('--force');
mkdirSync(outputDir,{recursive:true});

for(const [key,clip] of Object.entries(wordAudioSourceSegments)){
  const output=join(outputDir,`${key}.m4a`);
  if(existsSync(output)&&!force)continue;
  const speechSeconds=(clip.end-clip.start)/.78;
  const totalSeconds=speechSeconds+.28;
  const fadeStart=Math.max(.02,totalSeconds-.1);
  const filter=[
    `atrim=start=${clip.start}:end=${clip.end}`,
    'asetpts=PTS-STARTPTS',
    'atempo=.78',
    'apad=pad_dur=0.28',
    `atrim=duration=${totalSeconds.toFixed(3)}`,
    'afade=t=in:st=0:d=0.02',
    `afade=t=out:st=${fadeStart.toFixed(3)}:d=0.08`,
    'loudnorm=I=-18:TP=-2:LRA=7'
  ].join(',');
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',join(root,clip.src),'-af',filter,'-c:a','aac','-b:a','26k',output],{encoding:'utf8'});
  if(result.status!==0)throw new Error(`Could not build ${key}: ${result.stderr||result.error?.message||'unknown ffmpeg error'}`);
}

console.log(`Built ${Object.keys(wordAudioSourceSegments).length} individual Mandarin word clips.`);

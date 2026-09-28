#!/usr/bin/env node
import {mkdirSync, existsSync, statSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {wordAudioSourceSegments} from '../js/pth-word-audio-source.js';

const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const sourceDir=resolve(process.env.PTH_SOURCE_DIR || join(root,'source-materials/PTH/initials-video'));
const outputDir=join(root,'assets/pth/words/individual');
const force=process.argv.includes('--force');
mkdirSync(outputDir,{recursive:true});

for(const [key,clip] of Object.entries(wordAudioSourceSegments)){
  const initial=key.replace(/-\d+$/,'');
  const input=join(sourceDir,`${initial}.mp4`);
  const output=join(outputDir,`${key}.m4a`);
  if(!existsSync(input))throw new Error(`Missing source video for ${key}: ${input}`);
  if(existsSync(output)&&!force){
    if(statSync(output).size<1024)throw new Error(`Generated audio is unexpectedly small: ${output}`);
    continue;
  }
  const duration=clip.end-clip.start;
  if(duration<0.2||duration>1.5)throw new Error(`Suspicious segment duration for ${key}: ${duration}`);
  const spokenSeconds=duration/.78;
  const totalSeconds=spokenSeconds+.28;
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
  const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',input,'-map','0:a:0','-vn','-af',filter,'-ac','1','-ar','24000','-c:a','aac','-b:a','32k','-movflags','+faststart',output],{encoding:'utf8'});
  if(result.status!==0)throw new Error(`Could not build ${key}: ${result.stderr||result.error?.message||'unknown ffmpeg error'}`);
  if(statSync(output).size<1024)throw new Error(`Generated audio is unexpectedly small: ${output}`);
}

console.log(`Built ${Object.keys(wordAudioSourceSegments).length} Mandarin word clips from the supplied teaching videos.`);

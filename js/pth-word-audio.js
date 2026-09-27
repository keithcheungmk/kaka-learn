import {wordAudioSourceSegments} from './pth-word-audio-source.js?v=20260927-pth-audio-clean';

// Each tap plays one complete word file. The source-segment map stays separate
// so scripts/build-pth-word-audio.mjs can recreate these derived assets.
export const wordAudioClips=Object.fromEntries(Object.keys(wordAudioSourceSegments).map(key=>[
  key,{src:`assets/pth/words/individual/${key}.m4a`,start:0,end:0}
]));

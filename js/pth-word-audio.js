import {sounds} from './pth-content.js?v=20261004';
// Fixed zh_CN Tingting recordings of complete words, NOT cuts of initial videos.
export const wordAudioClips = Object.fromEntries(sounds.flatMap(sound => sound.examples)
  .map(word => [word.audioKey, {src: `assets/pth/words/mandarin-v2/${word.audioKey}.m4a`} ]));

import {wordAudioSourceSegments} from './pth-word-audio-source.js?v=20260929-mandarin-clips';

// The clips are generated from the supplied Mandarin teaching videos. Keeping
// each word as a separate M4A avoids device-dependent speech synthesis voices.
export const wordAudioClips = Object.fromEntries(
  Object.keys(wordAudioSourceSegments).map((key) => [key, {
    src: `assets/pth/words/individual/${key}.m4a`,
    start: 0,
    end: 0,
  }]),
);

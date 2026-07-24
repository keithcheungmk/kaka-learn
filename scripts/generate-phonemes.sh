#!/usr/bin/env bash
# Generate a–z synthetic-phonics MP3s for 卡卡字母隊.
# Requires: espeak-ng, ffmpeg
# Usage: ./scripts/generate-phonemes.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/phonemes"
TMP="${TMPDIR:-/tmp}/kaka-phonemes-src"
mkdir -p "$OUT" "$TMP"

# espeak-ng en-gb phoneme notation (not letter names).
# Stops get a tiny schwa so they are audible on tablet speakers.
declare -A P=(
  [a]='[[a]]'   # /æ/ as in cat
  [b]='[[b@]]'
  [c]='[[k@]]'  # hard c
  [d]='[[d@]]'
  [e]='[[E]]'   # /ɛ/ as in bed
  [f]='[[fff]]'
  [g]='[[g@]]'  # hard g
  [h]='[[h@]]'
  [i]='[[I]]'   # /ɪ/ as in pin
  [j]='[[dZ@]]'
  [k]='[[k@]]'
  [l]='[[lll]]'
  [m]='[[mmm]]'
  [n]='[[nnn]]'
  [o]='[[Q:]]'  # /ɒ/ lengthened
  [p]='[[p@]]'
  [q]='[[kw@]]'
  [r]='[[rrr]]'
  [s]='[[sss]]'
  [t]='[[t@]]'
  [u]='[[V]]'   # /ʌ/ as in cup
  [v]='[[vvv]]'
  [w]='[[w@]]'
  [x]='[[ks]]'
  [y]='[[j@]]'
  [z]='[[zzz]]'
)

for ch in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
  wav="$TMP/${ch}.wav"
  mp3="$OUT/${ch}.mp3"
  espeak-ng -v en-gb -s 105 -a 200 -w "$wav" "${P[$ch]}"
  ffmpeg -y -loglevel error -i "$wav" \
    -af "apad=pad_dur=0.1,volume=2.0,alimiter=limit=0.95" \
    -ar 22050 -codec:a libmp3lame -q:a 3 "$mp3"
  echo "wrote $mp3"
done
echo "Done → $OUT"

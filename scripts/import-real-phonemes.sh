#!/usr/bin/env bash
# Import real-voice phonics clips into assets/phonemes/{a-z}.mp3
#
# Usage:
#   ./scripts/import-real-phonemes.sh recordings/phonemes
#
# Accepts per-letter files named a.wav / a.m4a / a.mp3 / a.caf (lowercase).
# Missing letters are skipped (keeps existing synthetic clip).
#
# Requires: ffmpeg
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/assets/phonemes"
SRC="${1:-}"

if [[ -z "$SRC" || ! -d "$SRC" ]]; then
  echo "Usage: $0 <folder-with-a.wav|a.m4a|…>" >&2
  echo "See: assets/phonemes/HOW-TO-RECORD.txt" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg required" >&2
  exit 1
fi

imported=0
skipped=0

for ch in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
  src_file=""
  for ext in wav m4a mp3 caf aac flac; do
    if [[ -f "$SRC/${ch}.${ext}" ]]; then
      src_file="$SRC/${ch}.${ext}"
      break
    fi
  done

  if [[ -z "$src_file" ]]; then
    echo "skip  $ch  (no source file)"
    skipped=$((skipped + 1))
    continue
  fi

  tmp_wav="$(mktemp /tmp/kaka-ph-XXXXXX.wav)"
  # mono 22050 → trim silence → gentle loudness → mp3
  ffmpeg -y -loglevel error -i "$src_file" -ac 1 -ar 22050 "$tmp_wav"
  ffmpeg -y -loglevel error -i "$tmp_wav" \
    -af "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.05:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.05:detection=peak,areverse,apad=pad_dur=0.08,dynaudnorm=f=75:g=12,volume=1.15,alimiter=limit=0.94" \
    -codec:a libmp3lame -q:a 2 "$OUT/${ch}.mp3"
  rm -f "$tmp_wav"
  echo "ok    $ch  ← $src_file  → $OUT/${ch}.mp3"
  imported=$((imported + 1))
done

echo
echo "Imported: $imported   Skipped: $skipped"
echo "Next:"
echo "  1) Bump PHONEME_ASSET_VERSION in js/phonics-app.js (so iPad drops old cache)"
echo "  2) Commit assets/phonemes/*.mp3 + the version bump"
echo "  3) Merge to main / refresh on device"
echo
echo "Guide: assets/phonemes/HOW-TO-RECORD.txt"

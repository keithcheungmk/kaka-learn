#!/usr/bin/env bash
# LOCAL TRIAL ONLY — split Yellow Door free Phonic_letter_sounds.mp3 into a–z clips.
#
# License caution (read before using):
#   Yellow Door offers this as a free parent/education download, but still holds
#   copyright. Their Website Terms say free downloads are for personal /
#   non-commercial educational use and must NOT be modified. Splitting for a
#   private local trial is for evaluation only — do NOT commit/push/deploy to
#   public GitHub Pages unless Yellow Door grants written permission + credit.
#
# Usage:
#   ./scripts/split-yellowdoor-local.sh
#   ./scripts/split-yellowdoor-local.sh --apply-local
#       also copies clips into assets/phonemes/ for localhost preview
#       (git status will show changes — do NOT commit those mp3s)
#
# Requires: curl, ffmpeg
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT/recordings/yellowdoor-trial-src"
OUT_DIR="$ROOT/recordings/yellowdoor-trial"
URL="https://www.yellow-door.net/file-downloads/Phonic_letter_sounds.mp3"
APPLY=0

for arg in "$@"; do
  case "$arg" in
    --apply-local) APPLY=1 ;;
    -h|--help)
      sed -n '1,25p' "$0"
      exit 0
      ;;
  esac
done

mkdir -p "$SRC_DIR" "$OUT_DIR"
SRC_MP3="$SRC_DIR/Phonic_letter_sounds.mp3"

if [[ ! -f "$SRC_MP3" ]]; then
  echo "Downloading source MP3 (local cache only)…"
  curl -fsSL -o "$SRC_MP3" "$URL"
fi

echo "Source: $SRC_MP3 ($(wc -c < "$SRC_MP3") bytes)"
echo "Splitting a–z → $OUT_DIR"
echo "NOTE: local trial only — do not publish without permission."

# File layout: 26 phonemes, roughly one every 2.0s starting at 0.
# Take a short window and trim silence for cleaner taps.
i=0
for ch in a b c d e f g h i j k l m n o p q r s t u v w x y z; do
  # bash arithmetic: starts at 0,2,4,...
  start=$(python3 -c "print(max(0, $i * 2.0 - 0.05))")
  out="$OUT_DIR/${ch}.mp3"
  ffmpeg -y -loglevel error -ss "$start" -t 0.95 -i "$SRC_MP3" \
    -af "silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.02:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-38dB:start_silence=0.02:detection=peak,areverse,apad=pad_dur=0.08,dynaudnorm=f=75:g=12,volume=1.1,alimiter=limit=0.94" \
    -ar 22050 -ac 1 -codec:a libmp3lame -q:a 2 \
    "$out"
  dur=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$out")
  printf "  %s  %.2fs\n" "$ch" "$dur"
  i=$((i + 1))
done

echo
echo "Done. Clips in: $OUT_DIR"
echo "Play one:  ffplay -autoexit $OUT_DIR/a.mp3"

if [[ "$APPLY" -eq 1 ]]; then
  echo
  echo "Applying to assets/phonemes/ for LOCAL preview only…"
  # Backup current synthetic set once
  BAK="$ROOT/recordings/phonemes-backup-before-yellowdoor"
  if [[ ! -d "$BAK" ]]; then
    mkdir -p "$BAK"
    cp -a "$ROOT/assets/phonemes/"*.mp3 "$BAK/" 2>/dev/null || true
    echo "Backup of previous clips → $BAK"
  fi
  cp -a "$OUT_DIR/"*.mp3 "$ROOT/assets/phonemes/"
  # Bump local cache version so browser picks up new files on refresh
  if grep -q "PHONEME_ASSET_VERSION" "$ROOT/js/phonics-app.js"; then
    python3 - <<'PY'
from pathlib import Path
p = Path("/workspace/js/phonics-app.js")
t = p.read_text()
import re
t2, n = re.subn(
    r"const PHONEME_ASSET_VERSION = '[^']*'",
    "const PHONEME_ASSET_VERSION = 'local-yellowdoor-trial'",
    t,
    count=1,
)
if n:
    p.write_text(t2)
    print("Set PHONEME_ASSET_VERSION = 'local-yellowdoor-trial' (local only)")
PY
  fi
  echo
  echo "Preview locally:"
  echo "  python3 -m http.server 5173"
  echo "  open http://localhost:5173 → 卡卡字母隊 → 字母溫習"
  echo
  echo "RESTORE previous sounds:"
  echo "  cp recordings/phonemes-backup-before-yellowdoor/*.mp3 assets/phonemes/"
  echo "  git checkout -- js/phonics-app.js assets/phonemes"
  echo
  echo "Do NOT git add/commit/push these mp3s or merge to main."
fi

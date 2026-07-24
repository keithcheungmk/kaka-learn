#!/usr/bin/env bash
# Regenerate a–z classroom phonics MP3s (all Ana child voice).
# Requires: python3, ffmpeg, network；pip install edge-tts numpy
# Usage: ./scripts/generate-phonemes.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 "$ROOT/scripts/generate-phonemes.py"

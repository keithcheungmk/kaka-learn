#!/usr/bin/env bash
# Regenerate a–z phonics letter-sound MP3s (human-like neural voices).
# Requires: python3, ffmpeg, network (first run downloads Piper voice + uses Edge TTS)
#   pip install edge-tts piper-tts
# Usage: ./scripts/generate-phonemes.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 "$ROOT/scripts/generate-phonemes.py"

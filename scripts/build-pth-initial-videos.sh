#!/usr/bin/env bash
# Build complete web copies of the supplied Mandarin initials videos.
# The originals in source-materials/PTH/initials-video are never modified.
set -euo pipefail

SOURCE_DIR="source-materials/PTH/initials-video"
OUTPUT_DIR="assets/pth/initials/video"

command -v ffmpeg >/dev/null || { echo "ffmpeg is required" >&2; exit 1; }
mkdir -p "$OUTPUT_DIR"

for source in "$SOURCE_DIR"/*.mp4; do
  [ -f "$source" ] || { echo "No source videos found in $SOURCE_DIR" >&2; exit 1; }
  name="${source##*/}"
  ffmpeg -hide_banner -loglevel error -y -i "$source" \
    -vf "scale=-2:360:flags=lanczos" \
    -c:v libx264 -preset medium -crf 29 -pix_fmt yuv420p \
    -c:a aac -ac 1 -b:a 64k -ar 24000 \
    -movflags +faststart "$OUTPUT_DIR/$name"
done

echo "Built complete 360p videos in $OUTPUT_DIR"

#!/usr/bin/env bash
# Classify changed paths supplied on stdin. Base selection remains in each workflow.
set -euo pipefail
full=false
hanzi=false
while IFS= read -r path; do
  case "$path" in
    index.html|css/styles.css|js/app.js|js/storage.js|js/speech.js|js/nav-back.js) full=true ;;
  esac
  case "$path" in
    hanzi-write-demo.html|js/hanzi-write-demo.js|css/hanzi-write-demo.css|data/hanzi-write-chars.js|data/hanzi-family-names.js|data/hanzi-writer/life-word-data.js|scripts/test-hanzi-family-names.py|scripts/test-hanzi-replay.py) hanzi=true ;;
  esac
done
printf 'full=%s\nhanzi=%s\n' "$full" "$hanzi"

#!/usr/bin/env bash
# Classify changed paths supplied on stdin. Base selection remains in each workflow.
set -euo pipefail
full=false
hanzi=false
listen_find=false
while IFS= read -r path; do
  case "$path" in
    index.html|css/styles.css|js/app.js|js/storage.js|js/speech.js|js/nav-back.js) full=true ;;
  esac
  case "$path" in
    hanzi-write-demo.html|js/hanzi-write-demo.js|css/hanzi-write-demo.css|data/hanzi-write-chars.js|data/hanzi-family-names.js|data/hanzi-writer/life-word-data.js|scripts/test-hanzi-family-names.py|scripts/test-hanzi-replay.py) hanzi=true ;;
  esac
  case "$path" in
    js/listen-find.js|js/listen-find-scenes.js|js/listen-find-dialogue.js|css/listen-find.css|assets/english-listen-find/*|scripts/test-listen-find.mjs|scripts/test-listen-find-layout.py) listen_find=true ;;
  esac
done
printf 'full=%s\nhanzi=%s\nlisten_find=%s\n' "$full" "$hanzi" "$listen_find"

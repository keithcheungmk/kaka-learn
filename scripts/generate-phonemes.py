#!/usr/bin/env python3
"""Retired: isolated phonics sounds must not be generated with general TTS."""

import sys

print(
    "This generator is retired because TTS added schwa sounds such as 'buh' and 'tuh'.\n"
    "Record human pure sounds using docs/phonics-audio-standard.md, then run\n"
    "scripts/import-phonemes.py <recording-folder> --install.",
    file=sys.stderr,
)
raise SystemExit(2)

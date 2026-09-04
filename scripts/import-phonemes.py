#!/usr/bin/env python3
"""Validate and normalize a reviewed a-z human phonics recording set."""

from __future__ import annotations

import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Optional

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / "assets" / "phonemes"
LETTERS = "abcdefghijklmnopqrstuvwxyz"
EXTENSIONS = (".wav", ".m4a", ".mp3", ".aac", ".flac", ".ogg")


def find_source(folder: Path, letter: str) -> Optional[Path]:
    found = [folder / f"{letter}{extension}" for extension in EXTENSIONS if (folder / f"{letter}{extension}").is_file()]
    if len(found) > 1:
        raise ValueError(f"{letter}: more than one recording found ({', '.join(path.name for path in found)})")
    return found[0] if found else None


def duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def normalize(source: Path, destination: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(source),
            "-af",
            "highpass=f=70,silenceremove=start_periods=1:start_silence=0.025:start_threshold=-42dB:stop_periods=1:stop_silence=0.08:stop_threshold=-42dB,loudnorm=I=-18:TP=-2:LRA=7,apad=pad_dur=0.06",
            "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "128k", str(destination),
        ],
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", type=Path, help="folder containing a.wav through z.wav (other common formats accepted)")
    parser.add_argument("--install", action="store_true", help="replace assets/phonemes after all checks pass")
    args = parser.parse_args()

    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg and ffprobe are required")
    folder = args.folder.expanduser().resolve()
    if not folder.is_dir():
        raise SystemExit(f"recording folder not found: {folder}")

    sources: Dict[str, Path] = {}
    problems = []
    for letter in LETTERS:
        try:
            source = find_source(folder, letter)
        except ValueError as error:
            problems.append(str(error))
            continue
        if source is None:
            problems.append(f"{letter}: recording missing")
            continue
        seconds = duration(source)
        if seconds < 0.12 or seconds > 2.0:
            problems.append(f"{letter}: duration {seconds:.2f}s is outside 0.12–2.00s")
        sources[letter] = source
        print(f"{letter}: {source.name} ({seconds:.2f}s)")

    if problems:
        for problem in problems:
            print(f"ERROR {problem}")
        raise SystemExit(f"{len(problems)} problem(s); no files changed")
    if not args.install:
        print("Structural checks passed. Listen against docs/phonics-audio-standard.md, then rerun with --install.")
        return

    with tempfile.TemporaryDirectory(prefix="kaka-phonemes-") as temp_dir:
        staged = Path(temp_dir)
        for letter, source in sources.items():
            normalize(source, staged / f"{letter}.mp3")
        for letter in LETTERS:
            seconds = duration(staged / f"{letter}.mp3")
            if seconds < 0.12 or seconds > 2.1:
                raise SystemExit(f"{letter}: normalized duration {seconds:.2f}s is invalid; no files changed")
        DESTINATION.mkdir(parents=True, exist_ok=True)
        for letter in LETTERS:
            shutil.copy2(staged / f"{letter}.mp3", DESTINATION / f"{letter}.mp3")

    print(f"Installed 26 normalized human recordings in {DESTINATION}")
    print("Update PHONEME_ASSET_VERSION and complete the listening checklist before deployment.")


if __name__ == "__main__":
    main()

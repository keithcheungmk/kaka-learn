#!/usr/bin/env python3
"""Create web-ready copies of Mama's 49 phonics recordings.

The source folder is read-only by design. Each source contains three takes separated
by silence; this importer selects the middle take, adds a short safety pad, normalizes
volume, and writes compact mono MP3 copies into assets/phonemes.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "mama phonic recording"
DESTINATION = ROOT / "assets" / "phonemes"
SOUNDS = (
    *tuple("abcdefghijklmnoprstuvwxyz"),
    "qu", "ck", "ff", "ll", "ss", "zz", "ch", "sh", "th", "ng",
    "ai", "ee", "igh", "oa", "oo-long", "oo-short", "ar", "or", "ur",
    "ow", "oi", "ear", "air", "er",
)


def source_name(sound: str) -> str:
    if sound in {"oo-long", "oo-short"}:
        return f"OO_{sound.removeprefix('oo-')}.mp3"
    return f"{sound.upper()}.mp3"


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, check=True, capture_output=True, text=True)


def duration(ffmpeg: Path, path: Path) -> float:
    result = run([str(ffmpeg), "-hide_banner", "-i", str(path), "-f", "null", "-"])
    match = re.search(r"Duration: (\d+):(\d+):([\d.]+)", result.stderr)
    if not match:
        raise RuntimeError(f"Cannot read duration: {path}")
    return int(match[1]) * 3600 + int(match[2]) * 60 + float(match[3])


def active_spans(ffmpeg: Path, source: Path) -> list[tuple[float, float]]:
    total = duration(ffmpeg, source)
    result = run([
        str(ffmpeg), "-hide_banner", "-i", str(source),
        "-af", "silencedetect=noise=-38dB:d=0.12", "-f", "null", "-",
    ])
    silences: list[tuple[float, float]] = []
    start: float | None = None
    for line in result.stderr.splitlines():
        start_match = re.search(r"silence_start: ([\d.]+)", line)
        end_match = re.search(r"silence_end: ([\d.]+)", line)
        if start_match:
            start = float(start_match[1])
        if end_match and start is not None:
            silences.append((start, float(end_match[1])))
            start = None
    if start is not None:
        silences.append((start, total))

    spans: list[tuple[float, float]] = []
    cursor = 0.0
    for silence_start, silence_end in silences:
        if silence_start - cursor >= 0.035:
            spans.append((cursor, silence_start))
        cursor = max(cursor, silence_end)
    if total - cursor >= 0.035:
        spans.append((cursor, total))
    return spans


def normalize_copy(ffmpeg: Path, source: Path, destination: Path) -> tuple[float, float]:
    spans = active_spans(ffmpeg, source)
    if len(spans) < 2:
        raise RuntimeError(f"Expected repeated takes separated by silence: {source.name}")
    start, end = spans[len(spans) // 2]
    clip_start = max(0.0, start - 0.10)
    clip_end = min(duration(ffmpeg, source), end + 0.14)
    run([
        str(ffmpeg), "-y", "-loglevel", "error", "-ss", f"{clip_start:.4f}",
        "-to", f"{clip_end:.4f}", "-i", str(source),
        "-af", "highpass=f=70,loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:d=0.025,areverse,afade=t=in:d=0.04,areverse",
        "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "96k",
        str(destination),
    ])
    return start, end


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--ffmpeg", type=Path, default=Path(shutil.which("ffmpeg") or "ffmpeg"))
    parser.add_argument("--install", action="store_true", help="install staged copies into assets/phonemes")
    args = parser.parse_args()
    source_folder = args.source.resolve()
    ffmpeg = args.ffmpeg.resolve()
    if not source_folder.is_dir():
        raise SystemExit(f"Source folder not found: {source_folder}")
    if not ffmpeg.is_file():
        raise SystemExit("ffmpeg not found; pass --ffmpeg /path/to/ffmpeg")

    expected = {source_name(sound) for sound in SOUNDS}
    present = {path.name for path in source_folder.glob("*.mp3")}
    missing, extra = sorted(expected - present), sorted(present - expected)
    if missing or extra:
        raise SystemExit(f"Recording inventory mismatch. Missing={missing}; extra={extra}")

    with tempfile.TemporaryDirectory(prefix="kaka-mama-phonemes-") as temp:
        staged = Path(temp)
        for sound in SOUNDS:
            output = staged / f"{sound}.mp3"
            start, end = normalize_copy(ffmpeg, source_folder / source_name(sound), output)
            seconds = duration(ffmpeg, output)
            if not 0.18 <= seconds <= 1.4:
                raise SystemExit(f"{sound}: processed duration {seconds:.2f}s is outside 0.18–1.40s")
            print(f"{sound:8} middle take {start:.2f}–{end:.2f}s -> {seconds:.2f}s")

        if not args.install:
            print("Preview checks passed; source files were not changed. Add --install to copy outputs.")
            return 0
        DESTINATION.mkdir(parents=True, exist_ok=True)
        for sound in SOUNDS:
            shutil.copy2(staged / f"{sound}.mp3", DESTINATION / f"{sound}.mp3")

    print(f"Installed {len(SOUNDS)} processed copies in {DESTINATION}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

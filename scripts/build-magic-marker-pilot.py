#!/usr/bin/env python3
"""Build selected, web-sized Magic Marker derivatives from local originals."""

from __future__ import annotations

import json
import argparse
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source-materials" / "Magic Marker"
OUTPUT = ROOT / "assets" / "story-demo"
TEMP = ROOT / "tmp" / "pdfs" / "magic-marker-build"

def run(command: list[str]) -> None:
    subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def one_file(folder: Path, prefix: str, suffix: str) -> Path:
    matches = sorted(folder.glob(f"{prefix}*{suffix}"))
    if len(matches) != 1:
        raise SystemExit(f"Expected one {prefix}*{suffix} in {folder}; found {len(matches)}")
    return matches[0]


def build_book(number: int, scale_to: int, quality: int, audio_bitrate: str) -> None:
    label = f"MM{number:03d}"
    source_id = f"{number:03d}"
    pdf_dir = SOURCE / "Magic Marker 制作故事书"
    audio_dir = SOURCE / "Magic Marker MP3"
    clips_root = SOURCE / "Page-level clips"
    pdf = one_file(pdf_dir, f"{source_id}_Magic Marker", ".pdf")
    full_audio = one_file(audio_dir, f"{source_id}_Magic Marker", ".mp3")
    book_folder = next((p for p in clips_root.glob(f"Book {number:02d} - *") if p.is_dir()), None)
    if not book_folder:
        raise SystemExit(f"No clip folder for {label}")
    clip_map = json.loads((book_folder / "clip-map.json").read_text(encoding="utf-8"))
    page_rows = clip_map.get("clips", clip_map.get("pages", []))
    playable = [row for row in page_rows if row.get("file") and row.get("pdf_page") and row.get("printed_page")]
    if not playable:
        raise SystemExit(f"No mapped story clips for {label}")

    temp_book = TEMP / label.lower()
    temp_book.mkdir(parents=True, exist_ok=True)
    image_dir = OUTPUT / label.lower() / "pages"
    audio_output_dir = OUTPUT / label.lower()
    image_dir.mkdir(parents=True, exist_ok=True)
    audio_output_dir.mkdir(parents=True, exist_ok=True)
    first_pdf_page = min(int(row["pdf_page"]) for row in playable)
    last_pdf_page = max(int(row["pdf_page"]) for row in playable)
    page_prefix = temp_book / "page"
    run([
        "pdftoppm", "-f", str(first_pdf_page), "-l", str(last_pdf_page),
        "-scale-to", str(scale_to), "-jpeg", "-jpegopt", "quality=90",
        str(pdf), str(page_prefix),
    ])

    for row in playable:
        pdf_page = int(row["pdf_page"])
        printed_page = int(row["printed_page"])
        page_number = int(row.get("story_page", printed_page))
        jpg = temp_book / f"page-{pdf_page:02d}.jpg"
        image = image_dir / f"page-{page_number:02d}.webp"
        clip = book_folder / row["file"]
        audio = audio_output_dir / f"{label.lower()}-page-{page_number:02d}.mp3"
        if not jpg.exists() or not clip.exists():
            raise SystemExit(f"Missing rendered page or audio: {label} page {page_number}")
        run(["magick", str(jpg), "-strip", "-quality", str(quality), str(image)])
        run([
            "ffmpeg", "-nostdin", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(clip), "-ac", "1", "-ar", "22050", "-codec:a", "libmp3lame",
            "-b:a", audio_bitrate, "-write_xing", "0", str(audio),
        ])
        if image.stat().st_size > 400_000 or audio.stat().st_size > 400_000:
            raise SystemExit(f"Asset exceeds 400 KB: {image} or {audio}")
        print(f"{label} p{printed_page}: {image.stat().st_size:,}B image, {audio.stat().st_size:,}B audio")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int, default=2)
    parser.add_argument("--source-root", type=Path, default=ROOT / "source-materials")
    parser.add_argument("--scale-to", type=int, default=900)
    parser.add_argument("--quality", type=int, default=82)
    parser.add_argument("--audio-bitrate", default="32k")
    args = parser.parse_args()
    SOURCE = args.source_root / "Magic Marker"
    if not 1 <= args.start <= args.end <= 73:
        raise SystemExit("Expected a Magic Marker range between MM001 and MM073.")
    if not SOURCE.exists():
        raise SystemExit("The local source-materials folder must be available; originals remain read-only.")
    if not shutil.which("pdftoppm"):
        raise SystemExit("pdftoppm is required to render selected source pages.")
    if not shutil.which("ffmpeg") or not shutil.which("magick"):
        raise SystemExit("ffmpeg and ImageMagick are required to build web derivatives.")
    for book_number in range(args.start, args.end + 1):
        build_book(book_number, args.scale_to, args.quality, args.audio_bitrate)

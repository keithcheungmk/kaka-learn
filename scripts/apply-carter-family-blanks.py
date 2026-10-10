#!/usr/bin/env python3
"""Regenerate Carter Family Read & Fill blanks only.

Leaves audio, images, sentence tokens, and source clips untouched.
CF001–CF003 live in js/story-demo.js; CF004–CF085 live in the Carter manifest.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from wacky_ricky_blanks import (  # noqa: E402
    apply_blanks_to_manifest,
    load_carter_manifest,
    write_carter_manifest,
)

STORY_DEMO = ROOT / "js" / "story-demo.js"
BASE_START = "  const BASE_BOOKS = ["
BASE_END = "  // Carter Family and Magic Marker keep separate catalogues"


def js_quote(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def js_array(items: list[str]) -> str:
    return "[" + ", ".join(js_quote(item) for item in items) + "]"


def parse_js_string_array(text: str) -> list[str]:
    return [item.replace("\\'", "'").replace("\\\\", "\\") for item in re.findall(r"'((?:\\'|[^'])*)'", text)]


def blank_counts(books: list[dict]) -> tuple[int, int, int]:
    one = two = empty = 0
    for book in books:
        for page in book.get("pages", []):
            blanks = page.get("blanks") or []
            if not blanks:
                empty += 1
            elif len(blanks) == 2:
                two += 1
            else:
                one += 1
    return one, two, empty


def patch_base_books(books: list[dict]) -> int:
    text = STORY_DEMO.read_text(encoding="utf-8")
    start = text.index(BASE_START)
    end = text.index(BASE_END, start)
    chunk = text[start:end]
    by_audio = {
        page["audio"]: (page["blanks"], page["choices"])
        for book in books
        for page in book["pages"]
    }

    def replace_line(match: re.Match[str]) -> str:
        line = match.group(0)
        audio_match = re.search(r"audio: '([^']+)'", line)
        if not audio_match:
            return line
        blanks, choices = by_audio[audio_match.group(1)]
        line = re.sub(r"blanks: \[[^\]]*\]", f"blanks: {js_array(blanks)}", line, count=1)
        line = re.sub(r"choices: \[[^\]]*\]", f"choices: {js_array(choices)}", line, count=1)
        return line

    new_chunk, count = re.subn(r"\{ pdfPage:.*?audio: '.*?' \}", replace_line, chunk)
    if count != 38:
        raise RuntimeError(f"expected to patch 38 CF001–CF003 pages, patched {count}")
    STORY_DEMO.write_text(text[:start] + new_chunk + text[end:], encoding="utf-8")
    return count


def main() -> int:
    payload = load_carter_manifest()
    apply_blanks_to_manifest(payload)
    write_carter_manifest(payload)

    base = {"books": []}
    # Build CF001–CF003 page dicts from the current story-demo sentences, then rewrite blanks.
    text = STORY_DEMO.read_text(encoding="utf-8")
    start = text.index(BASE_START)
    end = text.index(BASE_END, start)
    chunk = text[start:end]
    books: list[dict] = []
    current: dict | None = None
    for match in re.finditer(
        r"id: '(cf00[123])'|\{ pdfPage: (\d+), sourceClip: '[^']+', sentence: (\[[^\]]+\]), blanks: \[[^\]]*\], choices: \[[^\]]*\], image: '[^']+', audio: '([^']+)' \}",
        chunk,
    ):
        if match.group(1):
            current = {"id": match.group(1), "pages": []}
            books.append(current)
            continue
        if current is None:
            raise RuntimeError("found a CF001–CF003 page before a book id")
        current["pages"].append({
            "pdfPage": int(match.group(2)),
            "sentence": parse_js_string_array(match.group(3)),
            "audio": match.group(4),
        })
    if sum(len(book["pages"]) for book in books) != 38:
        raise RuntimeError("could not parse all 38 CF001–CF003 pages from story-demo.js")
    apply_blanks_to_manifest({"books": books})
    patched = patch_base_books(books)

    manifest_one, manifest_two, manifest_empty = blank_counts(payload["books"])
    base_one, base_two, base_empty = blank_counts(books)
    print(json.dumps({
        "manifest_pages": manifest_one + manifest_two + manifest_empty,
        "manifest_one_word": manifest_one,
        "manifest_two_word": manifest_two,
        "manifest_skipped": manifest_empty,
        "base_pages": patched,
        "base_one_word": base_one,
        "base_two_word": base_two,
        "base_skipped": base_empty,
        "total_one_word": manifest_one + base_one,
        "total_two_word": manifest_two + base_two,
        "total_skipped": manifest_empty + base_empty,
        "total_pages": manifest_one + manifest_two + manifest_empty + base_one + base_two + base_empty,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

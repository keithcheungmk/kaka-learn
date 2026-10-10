#!/usr/bin/env python3
"""Regenerate Magic Marker Read & Fill blanks only.

Leaves audio, images, sentence tokens, and source clips untouched.
MM001–MM002 live in data/magic-marker-manifest.js;
MM003–MM020 in data/magic-marker-expansion.js;
MM021–MM073 in data/magic-marker-rest.js.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from wacky_ricky_blanks import (  # noqa: E402
    apply_blanks_to_manifest,
    is_name_blank,
    load_magic_marker_payload,
    write_magic_marker_payload,
)


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


def snapshot(books: list[dict]) -> dict[str, tuple[str, list[str]]]:
    seen: dict[str, tuple[str, list[str]]] = {}
    for book in books:
        for page in book.get("pages", []):
            key = f"{book.get('id')} p{page.get('printedPage') or page.get('pdfPage')}"
            sentence = " ".join(page.get("sentence") or [])
            seen[key] = (sentence, list(page.get("blanks") or []))
    return seen


def main() -> int:
    payload = load_magic_marker_payload()
    before = snapshot(payload["books"])
    apply_blanks_to_manifest(payload)
    write_magic_marker_payload(payload)
    after = snapshot(payload["books"])

    one, two, empty = blank_counts(payload["books"])
    pages = one + two + empty
    changed = [
        {
            "page": key,
            "sentence": before[key][0],
            "before": before[key][1],
            "after": after[key][1],
        }
        for key in before
        if before[key][1] != after[key][1]
    ]
    name_to_content = [
        item
        for item in changed
        if any(is_name_blank(word) for word in item["before"])
        and not any(is_name_blank(word) for word in item["after"])
    ]
    two_word = [item for item in changed if len(item["after"]) == 2]
    report = {
        "pages": pages,
        "one_word": one,
        "two_word": two,
        "skipped": empty,
        "two_word_share": round(two / pages, 4) if pages else 0,
        "pages_changed": len(changed),
        "name_to_content": len(name_to_content),
        "name_to_content_examples": name_to_content[:12],
        "two_word_examples": two_word[:8],
        "unchanged_examples": [
            {"page": key, "sentence": before[key][0], "blanks": before[key][1]}
            for key in list(before)[:8]
            if before[key][1] == after[key][1]
        ][:6],
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Manifest + CF001–CF003 checks for Carter Family content-word blanks."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from wacky_ricky_blanks import (  # noqa: E402
    FAMILY_NAMES,
    is_leaked_page_number,
    is_name_blank,
    load_carter_manifest,
    normalize_blank,
    pick_blank,
    tokenize,
)

STORY_DEMO = ROOT / "js" / "story-demo.js"


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def _page_only_has_names(sentence: list[str]) -> bool:
    for index, word in enumerate(sentence):
        key = normalize_blank(word)
        if not key:
            continue
        if is_leaked_page_number(word, index, sentence):
            continue
        if key.isdigit():
            return False
        if not is_name_blank(word):
            return False
    return True


def parse_js_string_array(text: str) -> list[str]:
    return [item.replace("\\'", "'").replace("\\\\", "\\") for item in re.findall(r"'((?:\\'|[^'])*)'", text)]


def load_base_books() -> list[dict]:
    text = STORY_DEMO.read_text(encoding="utf-8")
    start = text.index("  const BASE_BOOKS = [")
    end = text.index("  // Carter Family and Magic Marker keep separate catalogues", start)
    chunk = text[start:end]
    books: list[dict] = []
    current: dict | None = None
    for match in re.finditer(
        r"id: '(cf00[123])'|\{ pdfPage: (\d+), sourceClip: '[^']+', sentence: (\[[^\]]+\]), blanks: (\[[^\]]*\]), choices: (\[[^\]]*\]), image: '[^']+', audio: '([^']+)' \}",
        chunk,
    ):
        if match.group(1):
            current = {"id": match.group(1), "pages": []}
            books.append(current)
            continue
        if current is None:
            raise AssertionError("CF001–CF003 page appeared before a book id")
        current["pages"].append({
            "pdfPage": int(match.group(2)),
            "printedPage": len(current["pages"]) + 1,
            "sentence": parse_js_string_array(match.group(3)),
            "blanks": parse_js_string_array(match.group(4)),
            "choices": parse_js_string_array(match.group(5)),
            "audio": match.group(6),
        })
    assert_true(sum(len(book["pages"]) for book in books) == 38, "CF001–CF003 should still be 38 pages")
    return books


def check_books(books: list[dict], label: str) -> tuple[int, int, int]:
    rejected: list[str] = []
    empty = one = two = 0
    for book in books:
        for page in book.get("pages", []):
            blanks = page.get("blanks") or []
            sentence = page.get("sentence") or tokenize(page.get("sourceText", ""))
            if not blanks:
                empty += 1
                rejected.append(f"{book.get('id')} p{page.get('printedPage') or page.get('pdfPage')}: missing blank")
                continue
            if len(blanks) == 2:
                two += 1
                if not any(
                    sentence[index] == blanks[0] and sentence[index + 1] == blanks[1]
                    for index in range(len(sentence) - 1)
                ):
                    rejected.append(f"{book.get('id')} p{page.get('printedPage')}: phrase {blanks!r} is not consecutive")
            elif len(blanks) == 1:
                one += 1
            else:
                rejected.append(f"{book.get('id')} p{page.get('printedPage')}: unexpected blank count {blanks!r}")
            for answer in blanks:
                if is_name_blank(answer) and not _page_only_has_names(sentence):
                    rejected.append(f"{book.get('id')} p{page.get('printedPage')}: name {answer!r}")
                if is_name_blank(answer) and len(blanks) == 2:
                    rejected.append(f"{book.get('id')} p{page.get('printedPage')}: name inside phrase {blanks!r}")
                if answer not in sentence:
                    rejected.append(f"{book.get('id')} p{page.get('printedPage')}: blank {answer!r} missing from sentence")
    assert_true(empty == 0, f"{label}: every page must have a fill, got {empty} skipped")
    assert_true(not rejected, f"rejected {label} blanks:\n  " + "\n  ".join(rejected[:20]))
    return one, two, empty


def test_carter_picker_examples() -> None:
    cases = [
        ("Be a good sport, Emmy.", "sport,"),
        ("Where is Oliver?", "Where"),
        ("Dad and the kids were building a tree house.", "house."),
        ("“Yay!” said Harry.", "“Yay!”"),
        ("I won!", "won!"),
    ]
    for source, expected in cases:
        got = pick_blank(source)
        assert_true(got == expected, f"pick_blank({source!r}) -> {got!r}, expected {expected!r}")
        assert_true(bool(got), f"every Carter page must have a fill, got empty for {source!r}")
    assert_true(not is_name_blank(pick_blank("Be a good sport, Emmy.")), "Emmy must not win when sport exists")
    assert_true(is_name_blank("Harry.") and is_name_blank("Oliver?"), "Carter names must stay rejected")


def main() -> int:
    test_carter_picker_examples()
    payload = load_carter_manifest()
    one_m, two_m, empty_m = check_books(payload.get("books", []), "Carter manifest")
    one_b, two_b, empty_b = check_books(load_base_books(), "CF001–CF003")
    pages = one_m + two_m + empty_m + one_b + two_b + empty_b
    two = two_m + two_b
    one = one_m + one_b
    share = two / pages if pages else 0
    assert_true(pages == 1033, f"Carter should still have 1,033 pages, got {pages}")
    assert_true(0.18 <= share <= 0.32, f"two-word share should stay near 20-30%, got {share:.1%} ({two}/{pages})")
    assert_true("harry" in FAMILY_NAMES and "emmy" in FAMILY_NAMES and "oliver" in FAMILY_NAMES, "Carter names missing")
    print(
        f"carter family blank checks passed ({pages} pages, {one} one-word, {two} two-word, "
        f"{empty_m + empty_b} skipped, 0 rejected)"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(f"FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)

#!/usr/bin/env python3
"""Manifest checks for Magic Marker content-word blanks."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from wacky_ricky_blanks import (  # noqa: E402
    FAMILY_NAMES,
    is_leaked_page_number,
    is_name_blank,
    load_magic_marker_payload,
    normalize_blank,
    pick_blank,
    tokenize,
)


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


def test_magic_marker_picker_examples() -> None:
    cases = [
        ("Oh, hello! I’m Alex.", "hello!"),
        ("This is my sister, Sue.", "sister,"),
        ("My name is Alex.", "name"),
        ("Your name is Taco, okay?", "name"),
        ("My name is Maxie.", "name"),
        ("I like your name.", "name."),
        ("This is Taco.", "This"),
        ("Taco?", "Taco?"),
        ("What do you have, Alex?", "What"),
        ("It is a magic marker.", "marker."),
        ("Let’s have fun!", "fun!"),
    ]
    for source, expected in cases:
        got = pick_blank(source)
        assert_true(got == expected, f"pick_blank({source!r}) -> {got!r}, expected {expected!r}")
        assert_true(bool(got), f"every Magic Marker page must have a fill, got empty for {source!r}")
    assert_true(not is_name_blank(pick_blank("Oh, hello! I’m Alex.")), "Alex must not win when hello exists")
    assert_true(not is_name_blank(pick_blank("This is my sister, Sue.")), "Sue must not win when sister exists")
    assert_true(is_name_blank("Alex.") and is_name_blank("Sue?"), "Alex/Sue must stay rejected")
    assert_true(is_name_blank("Maxie.") and is_name_blank("Taco,"), "Maxie/Taco must stay rejected")
    assert_true(is_name_blank("Maxie's") and is_name_blank("Alex’s"), "Magic Marker possessives must stay names")


def check_books(books: list[dict]) -> tuple[int, int, int]:
    rejected: list[str] = []
    empty = one = two = 0
    for book in books:
        for page in book.get("pages", []):
            blanks = page.get("blanks") or []
            sentence = page.get("sentence") or tokenize(page.get("sourceText", ""))
            label = f"{book.get('id')} p{page.get('printedPage') or page.get('pdfPage')}"
            if not blanks:
                empty += 1
                rejected.append(f"{label}: missing blank")
                continue
            if len(blanks) == 2:
                two += 1
                if not any(
                    sentence[index] == blanks[0] and sentence[index + 1] == blanks[1]
                    for index in range(len(sentence) - 1)
                ):
                    rejected.append(f"{label}: phrase {blanks!r} is not consecutive")
            elif len(blanks) == 1:
                one += 1
            else:
                rejected.append(f"{label}: unexpected blank count {blanks!r}")
            for answer in blanks:
                if is_name_blank(answer) and not _page_only_has_names(sentence):
                    rejected.append(f"{label}: name {answer!r}")
                if is_name_blank(answer) and len(blanks) == 2:
                    rejected.append(f"{label}: name inside phrase {blanks!r}")
                if answer not in sentence:
                    rejected.append(f"{label}: blank {answer!r} missing from sentence")
    assert_true(empty == 0, f"every Magic Marker page must have a fill, got {empty} skipped")
    assert_true(not rejected, "rejected Magic Marker blanks:\n  " + "\n  ".join(rejected[:20]))
    return one, two, empty


def main() -> int:
    test_magic_marker_picker_examples()
    payload = load_magic_marker_payload()
    one, two, empty = check_books(payload.get("books", []))
    pages = one + two + empty
    share = two / pages if pages else 0
    assert_true(pages == 655, f"Magic Marker should still have 655 pages, got {pages}")
    assert_true(0.18 <= share <= 0.32, f"two-word share should stay near 20-30%, got {share:.1%} ({two}/{pages})")
    assert_true(
        "alex" in FAMILY_NAMES and "sue" in FAMILY_NAMES and "maxie" in FAMILY_NAMES and "taco" in FAMILY_NAMES,
        "Magic Marker names missing",
    )
    print(
        f"magic marker blank checks passed ({pages} pages, {one} one-word, {two} two-word, "
        f"{empty} skipped, 0 rejected)"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(f"FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)

#!/usr/bin/env python3
"""Unit + manifest checks for Wacky Ricky content-word blanks."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from wacky_ricky_blanks import (  # noqa: E402
    FAMILY_NAMES,
    STOP_WORDS,
    find_phrase_pair,
    is_rejected_blank,
    load_wacky_manifest,
    normalize_blank,
    pick_blank,
)


def assert_true(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def test_picker_examples() -> None:
    cases = [
        (
            "There’s my dad. He’s a computer programmer. Hello, Dad! Hi, Ricky. Play nicely with your sister.",
            "sister.",
        ),
        (
            "There’s my mom. She is a dentist. Hi, Mom. Hello, Ricky! Dinner will be ready soon.",
            "soon.",
        ),
        (
            "Hi. I’m Ricky Raccoon. Welcome to my house. And I’m Rachel, Ricky’s sister.",
            "sister.",
        ),
        (
            "Yes, she is my baby sister. Come in and meet my parents. I’m not a baby, Ricky!",
            "parents.",
        ),
        (
            "Merry Christmas, Ricky. Merry Christmas, Rachel.",
            "",
        ),
        (
            "Yes, Mr. Brown.",
            "",
        ),
        (
            "Ha-ha-ha! Way to go, Ricky! Now you can have a truce.",
            "truce.",
        ),
        (
            "I’m Ricky Raccoon. This is my sister, Rachel. W-w-who are y-y-you?",
            "sister,",
        ),
        (
            "I will miss you.",
            "miss",
        ),
        (
            "Hello, Miss Kitty.",
            "",
        ),
    ]
    for source, expected in cases:
        got = pick_blank(source)
        assert_true(
            got == expected,
            f"pick_blank({source!r}) -> {got!r}, expected {expected!r}",
        )
        if got:
            assert_true(not is_rejected_blank(got), f"picked rejected word {got!r} from {source!r}")


def test_phrase_pairs() -> None:
    assert_true(
        find_phrase_pair("There’s my dad. He’s a computer programmer. Hello, Dad! Hi, Ricky. Play nicely with your sister.")
        == ("computer", "programmer."),
        "computer programmer should be the two-word phrase",
    )
    assert_true(
        find_phrase_pair("That sounds fun! I have an idea. Let’s make breakfast.") == ("make", "breakfast."),
        "make breakfast should be a verb-object phrase",
    )
    assert_true(
        find_phrase_pair("Merry Christmas, Ricky. Merry Christmas, Rachel.") is None,
        "name-only pages should not invent a phrase",
    )


def test_never_falls_back_to_names_or_stops() -> None:
    for source in (
        "Hi, Ricky.",
        "Hello, Rachel!",
        "Yes, Mom.",
        "Okay, Dad!",
        "Mrs. Kitty.",
        "What?",
    ):
        got = pick_blank(source)
        assert_true(got == "", f"expected no blank for {source!r}, got {got!r}")
    assert_true(is_rejected_blank("Ricky.") and is_rejected_blank("Rachel"), "Ricky/Rachel must be rejected")
    assert_true(is_rejected_blank("Mom") and is_rejected_blank("Dad!"), "Mom/Dad must be rejected")
    assert_true(is_rejected_blank("Mrs.") and is_rejected_blank("the"), "Mrs/the must be rejected")
    assert_true(is_rejected_blank("Ricky's") and is_rejected_blank("Brian"), "Ricky's/Brian must be rejected")


def test_manifest_has_no_rejected_blanks() -> None:
    payload = load_wacky_manifest()
    rejected: list[str] = []
    empty = 0
    one = 0
    two = 0
    pages = 0
    for book in payload.get("books", []):
        for page in book.get("pages", []):
            pages += 1
            blanks = page.get("blanks") or []
            sentence = page.get("sentence") or []
            if not blanks:
                empty += 1
                continue
            if len(blanks) == 2:
                two += 1
                joined = " ".join(sentence)
                if " ".join(blanks) not in joined and not any(
                    sentence[index] == blanks[0] and sentence[index + 1] == blanks[1]
                    for index in range(len(sentence) - 1)
                ):
                    rejected.append(f"{book.get('id')} p{page.get('printedPage')}: phrase {blanks!r} is not consecutive")
            elif len(blanks) == 1:
                one += 1
            else:
                rejected.append(f"{book.get('id')} p{page.get('printedPage')}: unexpected blank count {blanks!r}")
            for answer in blanks:
                if is_rejected_blank(answer):
                    rejected.append(f"{book.get('id')} p{page.get('printedPage')}: {answer!r}")
                if answer not in sentence:
                    rejected.append(f"{book.get('id')} p{page.get('printedPage')}: blank {answer!r} missing from sentence")
    assert_true(not rejected, "rejected Wacky Ricky blanks:\n  " + "\n  ".join(rejected[:20]))
    share = two / pages if pages else 0
    assert_true(0.18 <= share <= 0.32, f"two-word share should stay near 20-30%, got {share:.1%} ({two}/{pages})")
    print(f"wacky ricky blank checks passed ({pages} pages, {one} one-word, {two} two-word, {empty} listen-only, 0 rejected)")


def main() -> int:
    test_picker_examples()
    test_phrase_pairs()
    test_never_falls_back_to_names_or_stops()
    test_manifest_has_no_rejected_blanks()
    assert_true("ricky" in FAMILY_NAMES and "the" in STOP_WORDS, "reject lists incomplete")
    assert_true(normalize_blank("Ricky's") == "rickys", "normalize should strip punctuation")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as error:
        print(f"FAIL: {error}", file=sys.stderr)
        raise SystemExit(1)

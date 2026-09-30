#!/usr/bin/env python3
"""Compile MM003–MM020 source-anchored Read & Fill pages into a browser manifest.

The visible PDF text, not speech recognition, is the source of every question.
Page clips are first-pass source cuts; their alignment confidence is preserved.
"""

from __future__ import annotations

import glob
import json
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source-materials" / "Magic Marker"
OUTPUT = ROOT / "data" / "magic-marker-expansion.js"

# One explicitly chosen answer per playable printed page, in clip-map order.
# Each answer is checked against the exact visible PDF text during compilation.
TARGETS = {
    3: "Taco Hammie running friend meet doing drawing eating",
    4: "key that chair doing window feather Taco",
    5: "Benny Benny brother friend Smiley close",
    6: "bread milk pizza soup cake full",
    7: "soccer goal go hide-and-seek nine win",
    8: "Maxie store Taco playground station playground Maxie they",
    9: "horse skate drive idea fly green course fly",
    10: "draw house car flower raining umbrella green",
    11: "Watch fun wet marker Watch marker this she",
    12: "book sleep lunch steak do eat now home",
    13: "Sue angry angry sorry sorry marker that",
    14: "marker magic draw rope hoop helmet marker magic",
    15: "artist turn artist not it guitar artist time singer",
    16: "game bike skateboard draw skateboard help help go",
    17: "cupcakes short tall Black dog know sad she",
    18: "cupcakes cupcakes Thank Maxie pets cat marker run",
    19: "bed dog boxes back tree chair chair go",
    20: "strawberries pineapples grapes bananas ice witch Run",
}

GROUPS = [
    "Taco Maxie Alex Sue Benny Hammie Heddy Fishy Smiley Happy",
    "key chair feather marker window helmet rope hoop doll boxes",
    "bread milk pizza soup cake steak lunch cupcakes chocolate ice",
    "cat dog bird horse fish parrot hamsters pets mouse",
    "blue green purple red orange yellow brown",
    "store playground station supermarket home school house",
    "run walk draw eat sleep skate drive fly dance swim",
    "one two three four five six seven eight nine ten",
    "strawberries pineapples grapes bananas watermelon",
]
POOLS = [group.split() for group in GROUPS]
DISTRACTORS = {
    "that": ["this", "these"], "they": ["we", "you"], "she": ["he", "they"],
    "doing": ["reading", "playing"], "drawing": ["running", "eating"],
    "running": ["drawing", "sleeping"], "eating": ["running", "sleeping"],
    "opening": ["closing", "drawing"], "draw": ["read", "write"],
    "friend": ["brother", "sister"], "brother": ["friend", "sister"],
    "meet": ["see", "help"], "close": ["scary", "funny"],
    "full": ["hungry", "tired"], "goal": ["ball", "net"],
    "go": ["stop", "wait"], "win": ["lose", "play"],
    "idea": ["plan", "game"], "course": ["sorry", "maybe"],
    "house": ["school", "store"], "car": ["bike", "bus"],
    "flower": ["tree", "leaf"], "raining": ["snowing", "sunny"],
    "umbrella": ["hat", "coat"], "watch": ["look", "listen"],
    "fun": ["work", "sleep"], "wet": ["dry", "warm"],
    "this": ["that", "these"], "now": ["later", "tomorrow"],
    "angry": ["happy", "sad"], "sorry": ["happy", "angry"],
    "magic": ["red", "blue"], "artist": ["singer", "teacher"],
    "turn": ["game", "time"], "not": ["ready", "here"],
    "it": ["that", "this"], "guitar": ["piano", "drum"],
    "time": ["turn", "game"], "singer": ["artist", "dancer"],
    "game": ["book", "song"], "bike": ["car", "horse"],
    "skateboard": ["bike", "scooter"], "help": ["find", "see"],
    "short": ["tall", "small"], "tall": ["short", "small"],
    "black": ["Brown", "White"], "know": ["see", "think"],
    "sad": ["happy", "angry"], "thank": ["Hello", "Sorry"],
    "back": ["home", "here"], "run": ["walk", "jump"],
    "ice": ["chocolate", "strawberry"], "witch": ["teacher", "friend"],
    "read": ["draw", "write"], "sleep": ["eat", "play"],
    "do": ["go", "play"], "eat": ["sleep", "play"],
    "marker": ["pencil", "crayon"], "rope": ["ball", "hoop"],
    "hoop": ["rope", "ball"], "helmet": ["hat", "cap"],
    "boxes": ["chairs", "tables"], "bed": ["chair", "sofa"],
    "nine": ["six", "seven"], "pets": ["friends", "toys"],
}


def find_one(pattern: str) -> Path:
    paths = sorted(glob.glob(pattern))
    if len(paths) != 1:
        raise RuntimeError(f"Expected one source for {pattern}, found {len(paths)}")
    return Path(paths[0])


def clean_pdf_text(page: fitz.Page, printed: int) -> str:
    text = " ".join(page.get_text().split())
    text = re.sub(rf"\s+{printed}$", "", text)
    return text


def select_sentence(text: str, target: str) -> list[str]:
    text = text.replace(" . . .", " …").replace("Mrs.", "Mrs¤")
    clauses = [piece.strip().replace("Mrs¤", "Mrs.") for piece in re.findall(r"[^.!?]+[.!?]+|[^.!?]+$", text) if piece.strip()]
    matching = [part for part in clauses if re.search(rf"\b{re.escape(target)}\b", part, re.I)]
    if not matching:
        raise RuntimeError(f"Target {target!r} absent from printed text {text!r}")
    # Prefer a meaningful whole sentence to a single interjection.
    chosen = max(matching, key=lambda part: (len(part.split()) >= 3, len(part.split())))
    return chosen.split()


def answer_token(sentence: list[str], target: str) -> str:
    matches = [token for token in sentence if re.search(rf"\b{re.escape(target)}\b", token, re.I)]
    if not matches:
        raise RuntimeError(f"Target {target!r} absent from chosen sentence {sentence!r}")
    return matches[-1]


def choices_for(answer: str, target: str, book_targets: list[str], sentence: list[str]) -> list[str]:
    suffix = answer[len(target):] if answer.lower().startswith(target.lower()) else ""
    pool = next((group for group in POOLS if target.lower() in {word.lower() for word in group}), None)
    options = DISTRACTORS.get(target.lower(), []) + list(pool or []) + book_targets + ["dog", "book", "tree", "car", "home", "play"]
    sentence_words = {re.sub(r"[^a-z]", "", word.lower()) for word in sentence}
    wrong = []
    for word in options:
        normalized = re.sub(r"[^a-z]", "", word.lower())
        if normalized and normalized not in sentence_words and normalized not in {re.sub(r"[^a-z]", "", item.lower()) for item in wrong}:
            wrong.append(word + suffix)
        if len(wrong) == 2:
            break
    if len(wrong) != 2:
        raise RuntimeError(f"No distinct distractors for {answer!r}")
    return [answer, *wrong]


def main() -> None:
    books = []
    for number in range(3, 21):
        label = f"mm{number:03d}"
        pdf = find_one(str(SOURCE / "Magic Marker 制作故事书" / f"{number:03d}_Magic Marker*.pdf"))
        full_audio = find_one(str(SOURCE / "Magic Marker MP3" / f"{number:03d}_Magic Marker*.mp3"))
        folder = find_one(str(SOURCE / "Page-level clips" / f"Book {number:02d} - *"))
        mapping = json.loads((folder / "clip-map.json").read_text(encoding="utf-8"))
        rows = [row for row in mapping.get("pages", mapping.get("clips", [])) if row.get("file") and row.get("printed_page")]
        targets = TARGETS[number].split()
        if len(rows) != len(targets):
            raise RuntimeError(f"{label}: {len(rows)} playable pages, {len(targets)} targets")
        doc = fitz.open(pdf)
        pages = []
        for row, target in zip(rows, targets):
            pdf_page = int(row["pdf_page"])
            printed = int(row["printed_page"])
            text = clean_pdf_text(doc[pdf_page - 1], printed)
            sentence = select_sentence(text, target)
            answer = answer_token(sentence, target)
            choices = choices_for(answer, target, targets, sentence)
            image = f"./assets/story-demo/{label}/pages/page-{printed:02d}.webp"
            audio = f"./assets/story-demo/{label}/{label}-page-{printed:02d}.mp3"
            for asset in (image, audio):
                if not (ROOT / asset[2:]).is_file():
                    raise RuntimeError(f"Missing derivative {asset}")
            pages.append({
                "pdfPage": pdf_page,
                "printedPage": printed,
                "sourceClip": row["file"],
                "sentence": sentence,
                "blanks": [answer],
                "choices": choices,
                "image": image,
                "audio": audio,
                "verificationStatus": "verified",
                "audioAlignmentStatus": "first-pass" if row.get("exact_word_match_ratio", 0) < 0.7 else "source-matched",
                "audioMatchRatio": row.get("exact_word_match_ratio"),
                "reviewNote": f"PDF p{pdf_page} printed p{printed}: exact visible sentence; clip-map source {row['file']} (first-pass alignment).",
            })
        books.append({
            "id": label,
            "mmLabel": label.upper(),
            "title": folder.name.split(" - ", 1)[1],
            "sourceSet": "magic-marker",
            "sourcePdf": str(pdf.relative_to(ROOT)),
            "sourceFullAudio": str(full_audio.relative_to(ROOT)),
            "clipFolder": str(folder.relative_to(ROOT)),
            "cover": pages[0]["image"],
            "pages": pages,
        })
        print(f"{label.upper()}: {len(pages)} PDF-checked playable pages")
    OUTPUT.write_text(
        "/* Generated from local Magic Marker PDFs and page-level clip maps by scripts/build-magic-marker-expansion.py. */\n"
        "window.KakaMagicMarkerManifest.books.push(..." + json.dumps(books, ensure_ascii=False, indent=2) + ");\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

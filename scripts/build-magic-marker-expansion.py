#!/usr/bin/env python3
"""Compile source-anchored Magic Marker Read & Fill pages into a browser manifest.

The visible PDF text, not speech recognition, is the source of every question.
Page clips are first-pass source cuts; their alignment confidence is preserved.
"""

from __future__ import annotations

import glob
import json
import re
import argparse
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
    "Taco Maxie Alex Sue Benny Hammie Heddy Fishy Smiley Happy Betty Jack Lulu Gisella Teddy",
    "grandmother grandfather grandma uncle brother sister mother father children friends neighbors guest reporter photographer artist teacher doctor",
    "key chair feather marker markers pencil crayon window helmet rope hoop doll boxes box book books picture pictures photos camera clip fork chopsticks telephone refrigerator",
    "bread milk pizza soup cake steak lunch cupcakes chocolate ice snack soda cookies popcorn bananas watermelon strawberries pineapples grapes food drink",
    "cat cats dog dogs bird horse fish parrot hamsters pets mouse frogs monkeys tiger skunks shark panda dragon animals crocodile kitty",
    "blue green purple red orange yellow brown black white",
    "store playground station supermarket home school house zoo park library bedroom bathroom kitchen airport",
    "ship plane bus truck car bike bicycle bicycles rollerblades",
    "road street path bridge",
    "run walk draw eat sleep skate drive fly dance swim cook jump hide chase catch touch pull push follow help shout cry sing read write listen watch look",
    "running walking drawing eating swimming fishing flying stopping moving waiting helping following chasing crying sitting looking coming going",
    "one two three four five six seven eight nine ten fifteen",
    "monday tuesday wednesday thursday friday saturday sunday today tomorrow yesterday morning night week",
    "happy sad angry tired scared worried sick safe lucky lonely beautiful ugly nice bad good little big long short fast slow tall old young",
    "inside outside behind next over under away back here there home down up",
    "party game picnic concert show journey adventure story flight music subject soccer basketball swimming skating",
    "tree flower flowers ocean land swamp swamps beach stars sun rain sky",
]
POOLS = [group.split() for group in GROUPS]
AUTO_STOP = {"about", "again", "also", "are", "can", "could", "does", "don", "have", "has", "here", "how", "isn", "just", "let", "lets", "im", "ill", "hes", "shes", "theyre", "we", "were", "like", "look", "many", "more", "much", "name", "not", "now", "only", "our", "please", "some", "something", "that", "them", "there", "these", "they", "this", "those", "very", "want", "was", "what", "when", "where", "which", "who", "why", "will", "with", "would", "your", "you", "its", "the", "and", "for", "from", "into", "she", "he", "too"}
AUTO_SEMANTIC = {word.lower() for group in POOLS[1:] for word in group}
AUTO_STOP.update({"dont", "cant", "wont", "wouldnt", "couldnt", "isnt", "didnt", "wasnt", "arent", "shouldnt", "couldve", "youre", "thats", "whats", "wheres"})
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
DISTRACTORS.update({
    "gone": ["here", "back"], "oh": ["Wow", "Hey"], "her": ["him", "them"],
    "yes": ["No", "Maybe"], "bite": ["lick", "kiss"], "stairs": ["elevator", "ladder"],
    "china": ["Brazil", "Hawaii"], "english": ["Chinese", "Spanish"],
    "either": ["yet", "before"], "else": ["more", "again"],
    "aahchoo": ["Hooray", "Oh no"], "took": ["gave", "lost"],
    "mine": ["yours", "hers"], "doctors": ["dentist", "teacher"],
    "tuesdays": ["Mondays", "Fridays"], "shorts": ["pants", "shoes"],
    "tshirt": ["sweater", "jacket"], "get": ["find", "take"],
    "excuse": ["Pardon", "Hello"], "brazil": ["China", "Hawaii"],
    "give": ["show", "lend"], "yippie": ["Hooray", "Oh no"],
    "out": ["in", "back"], "careful": ["quiet", "ready"],
    "where": ["when", "why"], "wake": ["sleep", "rest"],
    "watched": ["played", "read"], "actually": ["maybe", "really"],
    "what": ["where", "who"], "hat": ["cap", "helmet"],
    "looks": ["sounds", "feels"], "finds": ["loses", "sees"],
    "almost": ["never", "always"], "gave": ["took", "found"],
    "heeheehee": ["Ha ha ha", "Oh no"], "ticklish": ["sleepy", "hungry"],
    "wanted": ["needed", "liked"], "off": ["on", "down"],
    "sir": ["Ma’am", "Mister"], "say": ["hear", "write"],
    "sure": ["ready", "sorry"], "pose": ["smile", "wave"],
    "noise": ["sound", "music"], "come": ["go", "stay"],
    "everyone": ["someone", "no one"], "titanic": ["ship", "boat"],
    "problem": ["question", "idea"], "ate": ["made", "bought"],
    "bao": ["Lian", "Taco"], "trouble": ["danger", "fun"],
    "tasty": ["salty", "sweet"], "eyes": ["ears", "hands"],
    "escape": ["hide", "wait"], "caught": ["lost", "found"],
    "plan": ["idea", "story"], "lose": ["win", "find"],
    "hurts": ["helps", "tickles"], "did": ["saw", "had"],
    "door": ["window", "gate"], "california": ["Hawaii", "China"],
    "soon": ["later", "tomorrow"], "sunny": ["rainy", "cloudy"],
    "color": ["shape", "size"], "see": ["hear", "feel"],
    "truth": ["lie", "story"], "wonder": ["know", "think"],
    "everything": ["something", "nothing"],
})


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


def auto_sentence_and_target(text: str) -> tuple[list[str], str]:
    text = text.replace(" . . .", " …").replace("Mrs.", "Mrs¤")
    clauses = [piece.strip().replace("Mrs¤", "Mrs.") for piece in re.findall(r"[^.!?]+[.!?]+|[^.!?]+$", text) if piece.strip()]
    ranked = []
    for part in clauses:
        words = part.split()
        candidates = [(re.sub(r"[^A-Za-z-]", "", token.replace("’s", "").replace("'s", "")), token) for token in words]
        candidates = [(bare, token) for bare, token in candidates if (len(bare) >= 3 or bare.lower() in {"go", "do", "no"}) and bare.lower() not in AUTO_STOP]
        if not candidates:
            continue
        semantic = [pair for pair in candidates if pair[0].lower() in AUTO_SEMANTIC]
        target = (semantic or candidates)[-1][0]
        count = len(words)
        score = (3 <= count <= 12, bool(semantic), -abs(count - 6), len(target))
        ranked.append((score, words, target))
    if not ranked:
        words = max((part.split() for part in clauses), key=len, default=[])
        fallback = [re.sub(r"[^A-Za-z]", "", token) for token in words]
        fallback = [word for word in fallback if len(word) >= 2]
        if not fallback:
            raise RuntimeError(f"No suitable Read & Fill sentence on printed page: {text!r}")
        return words, max(fallback, key=len)
    _, sentence, target = max(ranked, key=lambda item: item[0])
    return sentence, target


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
    parser = argparse.ArgumentParser()
    parser.add_argument("--start", type=int, default=3)
    parser.add_argument("--end", type=int, default=20)
    parser.add_argument("--source-root", type=Path, default=ROOT / "source-materials")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    if not 3 <= args.start <= args.end <= 73:
        raise RuntimeError("Expected range MM003–MM073")
    source = args.source_root / "Magic Marker"
    books = []
    for number in range(args.start, args.end + 1):
        label = f"mm{number:03d}"
        pdf = find_one(str(source / "Magic Marker 制作故事书" / f"{number:03d}_Magic Marker*.pdf"))
        full_audio = find_one(str(source / "Magic Marker MP3" / f"{number:03d}_Magic Marker*.mp3"))
        folder = find_one(str(source / "Page-level clips" / f"Book {number:02d} - *"))
        mapping = json.loads((folder / "clip-map.json").read_text(encoding="utf-8"))
        rows = [row for row in mapping.get("pages", mapping.get("clips", [])) if row.get("file") and row.get("printed_page")]
        targets = TARGETS[number].split() if number in TARGETS else None
        if targets is not None and len(rows) != len(targets):
            raise RuntimeError(f"{label}: {len(rows)} playable pages, {len(targets)} targets")
        doc = fitz.open(pdf)
        pages = []
        prepared = []
        for index, row in enumerate(rows):
            pdf_page = int(row["pdf_page"])
            printed = int(row["printed_page"])
            text = clean_pdf_text(doc[pdf_page - 1], printed)
            if targets is not None:
                target = targets[index]
                sentence = select_sentence(text, target)
            else:
                sentence, target = auto_sentence_and_target(text)
            prepared.append((row, text, sentence, target))
        book_targets = targets or [item[3] for item in prepared]
        for row, text, sentence, target in prepared:
            pdf_page = int(row["pdf_page"])
            printed = int(row["printed_page"])
            answer = answer_token(sentence, target)
            choices = choices_for(answer, target, book_targets, sentence)
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
            "sourcePdf": "source-materials/Magic Marker/" + pdf.relative_to(source).as_posix(),
            "sourceFullAudio": "source-materials/Magic Marker/" + full_audio.relative_to(source).as_posix(),
            "clipFolder": "source-materials/Magic Marker/" + folder.relative_to(source).as_posix(),
            "cover": pages[0]["image"],
            "pages": pages,
        })
        print(f"{label.upper()}: {len(pages)} PDF-checked playable pages")
    args.output.write_text(
        "/* Generated from local Magic Marker PDFs and page-level clip maps by scripts/build-magic-marker-expansion.py. */\n"
        "window.KakaMagicMarkerManifest.books.push(..." + json.dumps(books, ensure_ascii=False, indent=2) + ");\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()

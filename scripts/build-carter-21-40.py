#!/usr/bin/env python3
"""Build Carter Family CF021–CF040 from the verified source library.

The source PDFs and page clips remain in source-materials/. This script only
publishes the same small derivative set used by the first ten books: one
rendered story page, one compressed page clip, and one short read-and-fill
sentence per page. The sentence is always taken verbatim from its source PDF.
"""

from __future__ import annotations

import io
import json
import re
import subprocess
from pathlib import Path

import fitz
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-materials" / "Carter Family"
PDF_DIR = SOURCE / "Book pdf"
CLIP_DIR = SOURCE / "Page-level clips"
ASSET_DIR = ROOT / "assets" / "story-demo"
MANIFEST = ROOT / "data" / "carter-family-manifest.js"

STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "did",
    "do", "for", "from", "get", "got", "had", "has", "have", "he", "her",
    "him", "his", "i", "if", "in", "into", "is", "it", "its", "just", "let",
    "like", "me", "my", "no", "not", "of", "off", "on", "or", "our", "out",
    "said", "she", "so", "some", "that", "the", "their", "them", "then", "there",
    "they", "this", "to", "too", "up", "us", "was", "we", "were", "what", "when",
    "where", "who", "will", "with", "you", "your",
}
FAMILY_NAMES = {"aunt", "dad", "daddy", "emmy", "grandpa", "harry", "judy", "mom", "oliver", "rover"}
DISTRACTOR_POOL = [
    "park", "school", "house", "book", "ball", "happy", "little", "green", "quick", "funny",
    "water", "friend", "morning", "outside", "today", "big", "warm", "new", "play", "look",
]


def pdf_for(number: int) -> Path:
    matches = sorted(PDF_DIR.glob(f"The Carter Family {number:03d}. *.pdf"))
    if len(matches) != 1:
        raise FileNotFoundError(f"expected one PDF for CF{number:03d}, got {matches}")
    return matches[0]


def clip_folder(number: int) -> Path:
    matches = sorted(CLIP_DIR.glob(f"Book {number:02d} - *"))
    if len(matches) != 1:
        raise FileNotFoundError(f"expected one clip folder for CF{number:03d}, got {matches}")
    return matches[0]


def clean_text(raw: str) -> str:
    text = " ".join(raw.split())
    # Printed page numbers are separate tokens at the start/end of many scans.
    text = re.sub(r"^\d+\s+", "", text)
    text = re.sub(r"\s+\d+$", "", text)
    return text.strip()


def sentences(text: str) -> list[str]:
    found = re.findall(r".+?[.!?](?:[”\"])?(?=\s|$)", text)
    found = [item.strip() for item in found if item.strip()]
    # The PDF text layer often separates a quoted exclamation from its
    # attribution (e.g. “Oh no!” Mom cried.). Join that attribution back so
    # the child sees a complete sentence rather than a fragment.
    merged: list[str] = []
    index = 0
    while index < len(found):
        current = found[index]
        # A quoted line may contain an exclamation before the spoken sentence
        # ends (e.g. “Emmy! I put bait on your hook!”). Keep joining until its
        # opening and closing quotation marks are balanced.
        while current.count("“") > current.count("”") and index + 1 < len(found):
            index += 1
            current = f"{current} {found[index]}"
        if current.endswith("”") and index + 1 < len(found) and not found[index + 1].startswith("“"):
            current = f"{current} {found[index + 1]}"
            index += 1
        merged.append(current)
        index += 1
    return merged


def first_sentence(text: str) -> str:
    found = sentences(text)
    if not found:
        raise ValueError(f"could not find a complete sentence in {text!r}")
    return found[0]


def word_tokens(sentence: str) -> list[str]:
    return sentence.split()


def plain_word(token: str) -> str:
    return token.strip("“”\"'()[]{}.,!?;:")


def choose_words(sentence: str, page_text: str, book_words: list[str]) -> tuple[str, tuple[str, str]]:
    tokens = word_tokens(sentence)
    candidates = [
        token for token in tokens
        if len(plain_word(token)) >= 4
        and plain_word(token).lower() not in STOP_WORDS
        and plain_word(token).lower() not in FAMILY_NAMES
        and re.search(r"[A-Za-z]", plain_word(token))
    ]
    if not candidates:
        candidates = [token for token in tokens if re.search(r"[A-Za-z]{3,}", plain_word(token))]
    if not candidates:
        raise ValueError(f"no usable blank in {sentence!r}")
    answer = candidates[-1]
    used = {plain_word(answer).lower()}
    distractors: list[str] = []
    # Prefer real words from the same page/book, so choices stay story-related.
    # Local distractors are more meaningful and less repetitive than always
    # taking the first eligible words from the start of the whole book.
    for token in [plain_word(t) for t in word_tokens(page_text)] + book_words:
        word = plain_word(token)
        low = word.lower()
        if len(word) < 3 or low in used or low in STOP_WORDS or low in FAMILY_NAMES or not re.fullmatch(r"[A-Za-z]+", word):
            continue
        if word not in distractors:
            distractors.append(word)
        if len(distractors) == 2:
            break
    for word in DISTRACTOR_POOL:
        if len(distractors) == 2:
            break
        if word.lower() not in used and word not in distractors:
            distractors.append(word)
    if len(distractors) != 2:
        raise ValueError(f"could not create two distractors for {sentence!r}")
    return answer, (distractors[0], distractors[1])


def render_page(pdf: fitz.Document, pdf_page: int, dest: Path) -> None:
    page_obj = pdf[pdf_page - 1]
    scale = 900 / page_obj.rect.width
    pix = page_obj.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    image.save(dest, format="WEBP", quality=75, method=6)


def encode_audio(source: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(source),
        "-ac", "1", "-ar", "22050", "-b:a", "32k", str(dest),
    ], check=True)


def read_existing_manifest() -> dict:
    text = MANIFEST.read_text(encoding="utf-8")
    prefix = "window.KakaCarterManifest = "
    if not text.startswith(prefix):
        raise ValueError("unexpected Carter manifest prefix")
    return json.loads(text[len(prefix):].rstrip().removesuffix(";"))


def build_book(number: int) -> dict:
    pdf_path = pdf_for(number)
    folder = clip_folder(number)
    clip_paths = sorted((p for p in folder.glob("*.mp3") if p.stem.isdigit()), key=lambda p: int(p.stem))
    doc = fitz.open(pdf_path)
    story_pages: list[tuple[int, str]] = []
    for index in range(len(doc)):
        if index == 0:
            continue
        text = clean_text(doc[index].get_text("text"))
        if not text or "Copyright ©" in text:
            continue
        try:
            sentence = first_sentence(text)
        except ValueError:
            continue
        story_pages.append((index + 1, text))
    if len(story_pages) != len(clip_paths):
        raise ValueError(f"CF{number:03d}: PDF story pages {len(story_pages)} != clips {len(clip_paths)}")
    book_words = []
    for _, text in story_pages:
        book_words.extend(plain_word(token) for token in text.split())
    book_id = f"cf{number:03d}"
    title = pdf_path.stem.split(". ", 1)[1]
    pages = []
    for printed_page, ((pdf_page, page_text), source_clip) in enumerate(zip(story_pages, clip_paths), start=1):
        sentence = first_sentence(page_text)
        answer = distractors = None
        candidates = sentences(page_text)
        # Prefer a sentence with enough context for a child to understand the
        # missing word; fall back only when the page is genuinely short.
        candidates = sorted(candidates, key=lambda item: (len(item.split()) >= 5, len(item.split())), reverse=True)
        for candidate in candidates:
            if candidate.count("“") != candidate.count("”"):
                continue
            try:
                answer, distractors = choose_words(candidate, page_text, book_words)
                sentence = candidate
                break
            except ValueError:
                continue
        if answer is None or distractors is None:
            raise ValueError(f"CF{number:03d} page {pdf_page}: no playable sentence")
        if sentence not in clean_text(doc[pdf_page - 1].get_text("text")):
            raise ValueError(f"CF{number:03d} PDF page {pdf_page}: sentence not found")
        image_rel = f"./assets/story-demo/{book_id}/pages/page-{printed_page:02d}.webp"
        audio_rel = f"./assets/story-demo/{book_id}/{book_id}-page-{printed_page:02d}.mp3"
        render_page(doc, pdf_page, ROOT / image_rel.removeprefix("./"))
        encode_audio(source_clip, ROOT / audio_rel.removeprefix("./"))
        pages.append({
            "pdfPage": pdf_page,
            "printedPage": printed_page,
            "sourceClip": source_clip.name,
            "sentence": sentence.split(),
            "blanks": [answer],
            "choices": [answer, *distractors],
            "image": image_rel,
            "audio": audio_rel,
            "verificationStatus": "verified",
            "reviewNote": f"PDF page {pdf_page} paired with page clip {source_clip.name}; sentence copied from source page.",
        })
    doc.close()
    return {
        "id": book_id,
        "title": title,
        "cfLabel": f"CF{number:03d}",
        "sourcePdf": f"source-materials/Carter Family/Book pdf/{pdf_path.name}",
        "sourceFullAudio": f"source-materials/Carter Family/Carter Family MP3/{number}.mp3",
        "clipFolder": f"source-materials/Carter Family/Page-level clips/{folder.name}",
        "pages": pages,
    }


def main() -> None:
    manifest = read_existing_manifest()
    existing = {book["id"]: book for book in manifest["books"]}
    for number in range(21, 41):
        book = build_book(number)
        if book["id"] in existing:
            manifest["books"] = [item for item in manifest["books"] if item["id"] != book["id"]]
        manifest["books"].append(book)
    manifest["books"].sort(key=lambda book: int(book["cfLabel"][2:]))
    MANIFEST.write_text(
        "window.KakaCarterManifest = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"built CF021–CF040: {20} books / {sum(len(existing.get(b['id'], {}).get('pages', [])) for b in manifest['books'])} total manifest pages")


if __name__ == "__main__":
    main()

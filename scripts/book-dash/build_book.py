#!/usr/bin/env python3
"""Build a reviewable Book Dash page manifest from a real PDF.

The script keeps three concerns separate. PyMuPDF supplies reading-order word
boxes, the narration JSON supplies the words the learner will hear, and Edge
TTS supplies audio plus WordBoundary timing. A page is not marked ready when
any of those sources fail to match.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Iterable

try:
    import fitz
except ImportError as exc:  # pragma: no cover - exercised by environment
    raise SystemExit("PyMuPDF is required. Install requirements.txt first.") from exc


TOKEN_RE = re.compile(r"[\w]+(?:[-’'][\w]+)*", re.UNICODE)


@dataclass(frozen=True)
class PdfWord:
    text: str
    x0: float
    y0: float
    x1: float
    y1: float
    block: int
    line: int
    word: int


@dataclass(frozen=True)
class WordMatch:
    narration: str
    pdf: str
    pdf_index: int
    x_percent: float
    y_percent: float
    width_percent: float
    height_percent: float


def normalise(value: str) -> str:
    """Normalise typography without hiding a content mismatch."""

    value = unicodedata.normalize("NFKC", value)
    value = value.replace("’", "'").replace("“", '"').replace("”", '"')
    value = value.casefold().strip()
    value = value.strip(".,!?;:\"'()[]{}<>…")
    return value


def narration_tokens(text: str) -> list[str]:
    return TOKEN_RE.findall(unicodedata.normalize("NFKC", text))


def extract_pdf_words(page: Any) -> list[PdfWord]:
    """Extract words in PyMuPDF's block, line, and word reading order."""

    words = []
    for x0, y0, x1, y1, text, block, line, word in page.get_text("words", sort=False):
        if text.strip():
            words.append(PdfWord(text, x0, y0, x1, y1, block, line, word))
    return sorted(words, key=lambda item: (item.block, item.line, item.word))


def _rules_for_page(rules: dict[str, Any], page_number: int) -> dict[str, Any]:
    pages = rules.get("pages", rules)
    return pages.get(str(page_number), pages.get(page_number, {}))


def _canonical(value: str, replacements: dict[str, str]) -> str:
    value = normalise(value)
    for source, target in replacements.items():
        if value == normalise(source):
            return normalise(target)
    return value


def match_page_words(
    pdf_words: list[PdfWord],
    narration: str,
    page_rect: Any,
    page_rules: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Match narration words to PDF words and report every disagreement.

    The matcher searches forward only a small window. This tolerates a line
    break or an omitted punctuation mark, but it cannot silently reorder text.
    Corrections and ignored PDF tokens must be explicit in the page rules.
    """

    page_rules = page_rules or {}
    block_order = page_rules.get("block_order")
    if block_order:
        rank = {int(block): index for index, block in enumerate(block_order)}
        pdf_words = sorted(
            pdf_words,
            key=lambda item: (rank.get(item.block, len(rank)), item.line, item.word),
        )
    replacements = page_rules.get("replacements", {})
    ignored_pdf = {_canonical(x, replacements) for x in page_rules.get("ignore_pdf", [])}
    usable = [
        (index, item)
        for index, item in enumerate(pdf_words)
        if _canonical(item.text, replacements) not in ignored_pdf
    ]
    wanted = narration_tokens(narration)
    matches: list[WordMatch] = []
    unmatched_narration: list[str] = []
    used: set[int] = set()
    cursor = 0
    search_window = int(page_rules.get("search_window", 5))

    for token in wanted:
        target = _canonical(token, replacements)
        found_at = None
        for candidate in range(cursor, min(len(usable), cursor + search_window + 1)):
            if _canonical(usable[candidate][1].text, replacements) == target:
                found_at = candidate
                break
        if found_at is None:
            unmatched_narration.append(token)
            continue
        cursor = found_at + 1
        pdf_index, item = usable[found_at]
        used.add(pdf_index)
        matches.append(
            WordMatch(
                narration=token,
                pdf=item.text,
                pdf_index=pdf_index,
                x_percent=round(item.x0 / page_rect.width * 100, 4),
                y_percent=round(item.y0 / page_rect.height * 100, 4),
                width_percent=round((item.x1 - item.x0) / page_rect.width * 100, 4),
                height_percent=round((item.y1 - item.y0) / page_rect.height * 100, 4),
            )
        )

    unmatched_pdf = [
        item.text
        for index, item in usable
        if index not in used and _canonical(item.text, replacements) not in ignored_pdf
    ]
    return {
        "matches": [asdict(item) for item in matches],
        "unmatched_narration": unmatched_narration,
        "unmatched_pdf": unmatched_pdf,
        "status": "matched" if not unmatched_narration and not unmatched_pdf else "needs-review",
        "rules": page_rules,
    }


def _match_timing(words: list[dict[str, Any]], boundaries: list[dict[str, Any]]) -> dict[str, Any]:
    cursor = 0
    timed = []
    unmatched = []
    for word in words:
        target = normalise(word["narration"])
        found = None
        for index in range(cursor, min(len(boundaries), cursor + 5)):
            if normalise(boundaries[index]["text"]) == target:
                found = index
                break
        if found is None:
            unmatched.append(word["narration"])
            continue
        event = boundaries[found]
        cursor = found + 1
        timed.append({**word, "startMs": round(event["offset"] / 10000), "endMs": round((event["offset"] + event["duration"]) / 10000)})
    return {"words": timed, "unmatched": unmatched, "status": "matched" if not unmatched else "needs-review"}


def _ui_word(word: dict[str, Any]) -> dict[str, Any]:
    """Convert the internal match shape to the static player's data shape."""

    result = {
        "text": word["narration"],
        "xPercent": word["x_percent"],
        "yPercent": word["y_percent"],
        "widthPercent": word["width_percent"],
        "heightPercent": word["height_percent"],
    }
    if "startMs" in word and "endMs" in word:
        result.update({"startMs": word["startMs"], "endMs": word["endMs"]})
    return result


async def synthesize(text: str, voice: str, audio_path: Path) -> list[dict[str, Any]]:
    """Write MP3 and return Edge TTS WordBoundary events in 100 ns units."""

    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError("edge-tts is required for --generate-audio") from exc
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    boundaries: list[dict[str, Any]] = []
    communicator = edge_tts.Communicate(text, voice=voice, boundary="WordBoundary")
    with audio_path.open("wb") as audio_file:
        async for chunk in communicator.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                boundaries.append({key: chunk[key] for key in ("offset", "duration", "text")})
    return boundaries


def render_page(page: Any, image_path: Path, scale: float = 2.0) -> None:
    image_path.parent.mkdir(parents=True, exist_ok=True)
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    pixmap.save(str(image_path))


def build(args: argparse.Namespace) -> dict[str, Any]:
    narration_config = json.loads(Path(args.narration).read_text(encoding="utf-8"))
    source = json.loads(Path(args.source).read_text(encoding="utf-8")) if args.source else {}
    pages_config = narration_config.get("pages", narration_config)
    document = fitz.open(args.pdf)
    selected = {int(item["pdf_page"]): item for item in pages_config}
    output = Path(args.out)
    output.mkdir(parents=True, exist_ok=True)
    pages = []
    blocked = False

    for pdf_page, config in selected.items():
        if pdf_page < 1 or pdf_page > len(document):
            blocked = True
            pages.append({"pdf_page": pdf_page, "status": "blocked", "error": "PDF page is out of range"})
            continue
        page = document[pdf_page - 1]
        page_id = config.get("id", f"page-{pdf_page:02d}")
        image_path = output / config.get("image", f"assets/{page_id}.jpg")
        render_page(page, image_path)
        words = extract_pdf_words(page)
        match = match_page_words(words, config["text"], page.rect, config.get("rules"))
        page_record: dict[str, Any] = {
            "id": page_id,
            "pdfPage": pdf_page,
            "image": str(image_path.relative_to(output)),
            "text": config["text"],
            "words": [_ui_word(item) for item in match["matches"]],
            "review": {"status": "generated-needs-human-review", "alignment": "PyMuPDF word boxes", "coordinates": "PDF page coordinates converted to percentages", "match": match},
        }
        if match["status"] != "matched":
            blocked = True
        if args.generate_audio:
            audio_path = output / config.get("audio", f"assets/{page_id}.mp3")
            try:
                boundaries = asyncio.run(synthesize(config["text"], args.voice, audio_path))
                timing = _match_timing(match["matches"], boundaries)
                page_record["audio"] = str(audio_path.relative_to(output))
                page_record["words"] = [_ui_word(item) for item in timing["words"]]
                page_record["review"]["timing"] = {"provider": "Microsoft Edge TTS", "voice": args.voice, "status": timing["status"], "unmatched": timing["unmatched"]}
                if timing["status"] != "matched":
                    blocked = True
            except Exception as exc:
                blocked = True
                page_record["review"]["timing"] = {"status": "blocked", "error": str(exc)}
        else:
            page_record["review"]["timing"] = {"status": "not-generated"}
        pages.append(page_record)

    manifest = {
        "title": args.title,
        "source": source,
        "narration": {"kind": "generated-tts" if args.generate_audio else "not-generated", "voice": args.voice if args.generate_audio else None, "originalAuthorAudioUsed": False},
        "pages": pages,
    }
    (output / "data.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (output / "data.js").write_text("window.KAKA_BOOK_DASH=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
    report = {"status": "blocked" if blocked else "ready-for-human-review", "pages": [{"id": p.get("id"), "review": p.get("review"), "error": p.get("error")} for p in pages]}
    (output / "review-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--pdf", required=True, help="Input PDF. Page numbers in --narration are one-based.")
    result.add_argument("--narration", required=True, help="JSON containing pages with pdf_page and text.")
    result.add_argument("--out", required=True, help="Output directory for images, audio, and manifest.")
    result.add_argument("--title", required=True)
    result.add_argument("--source", help="JSON containing source URL, licence, and credits.")
    result.add_argument("--voice", default="en-US-AvaMultilingualNeural")
    result.add_argument("--generate-audio", action="store_true")
    result.add_argument("--strict", action="store_true", help="Exit non-zero when any page needs review.")
    return result


if __name__ == "__main__":
    report = build(parser().parse_args())
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if report["status"] == "blocked" and "--strict" in sys.argv:
        raise SystemExit(2)

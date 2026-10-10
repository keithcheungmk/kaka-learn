#!/usr/bin/env python3
"""Stage first-pass Wacky Ricky story page media and build its independent manifest.

Generated exercises are intentionally marked pending editorial review. This script
does not change source PDFs, source MP3s, local master clips, or alignment decisions.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import shutil
from pathlib import Path

from wacky_ricky_blanks import (
    MANIFEST,
    apply_blanks_to_manifest,
    choose_choices,
    load_wacky_manifest,
    normalize_blank,
    pick_blank,
    tokenize,
    write_wacky_manifest,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-materials/Wacky Ricky/Page-level clips"
ASSET_ROOT = ROOT / "assets/wacky-ricky"


def tokens(text: str) -> list[str]:
    return tokenize(text)


def norm(word: str) -> str:
    return normalize_blank(word)


def refresh_existing_blanks(*, dry_run: bool = False) -> None:
    """Rewrite blanks from existing page text without touching audio or images."""
    payload = load_wacky_manifest()
    apply_blanks_to_manifest(payload)
    empty = sum(1 for book in payload["books"] for page in book["pages"] if not page.get("blanks"))
    pages = sum(len(book["pages"]) for book in payload["books"])
    if not dry_run:
        write_wacky_manifest(payload)
    print(json.dumps({
        "mode": "blanks-only",
        "books": len(payload["books"]),
        "pages": pages,
        "pages_without_blank": empty,
        "manifest": str(MANIFEST),
        "dry_run": dry_run,
    }, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--blanks-only",
        action="store_true",
        help="Regenerate blanks/choices from the existing manifest; leave media untouched.",
    )
    args = parser.parse_args()
    if args.blanks_only:
        refresh_existing_blanks(dry_run=args.dry_run)
        return

    index = json.loads((SOURCE / "index.json").read_text())
    books_out = []
    copied: dict[str, str] = {}
    skipped = []
    total_pages = 0

    for entry in sorted(index["books"], key=lambda book: book["book_id"]):
        folder = ROOT / entry["output"]
        clip_map = json.loads((folder / "clip-map.json").read_text())
        story_pages = [page for page in clip_map["pages"] if page.get("page_type") == "story_narration"]
        vocabulary = []
        for page in story_pages:
            vocabulary.extend(word for word in tokens(page.get("text", "")) if norm(word))
        vocab_by_norm = {}
        for word in vocabulary:
            vocab_by_norm.setdefault(norm(word), word)

        pages_out = []
        for page in story_pages:
            total_pages += 1
            clip_name = page.get("web_audio")
            image_name = page.get("image")
            if not clip_name or not image_name:
                skipped.append({"book": entry["book_id"], "pdf_page": page["pdf_page"], "reason": "no reliable page media candidate"})
                continue
            image_source = folder / image_name
            audio_source = ROOT / "source-materials/Wacky Ricky/Page-level clips" / clip_name
            if not image_source.is_file() or not audio_source.is_file():
                raise SystemExit(f"Missing candidate for {entry['book_id']} page {page['pdf_page']}: {image_source} / {audio_source}")

            image_dest_rel = f"wacky-ricky/{entry['book_id'].lower()}/pages/{Path(image_name).name}"
            audio_dest_rel = f"wacky-ricky/{entry['book_id'].lower()}/{Path(clip_name).name}"
            for source, dest_rel in ((image_source, image_dest_rel), (audio_source, audio_dest_rel)):
                size = source.stat().st_size
                if size > 400_000:
                    raise SystemExit(f"Candidate exceeds per-file limit ({size} bytes): {source}")
                copied[dest_rel] = str(source)
                if not args.dry_run:
                    destination = ASSET_ROOT / dest_rel.removeprefix("wacky-ricky/")
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    if not destination.exists() or destination.stat().st_size != size or hashlib.sha256(destination.read_bytes()).digest() != hashlib.sha256(source.read_bytes()).digest():
                        shutil.copy2(source, destination)

            words = tokens(page.get("text", ""))
            target = pick_blank(page.get("text", ""), words)
            rng = random.Random(f"{entry['book_id']}:{page['pdf_page']}")
            choices = choose_choices(target, words, vocab_by_norm, rng)
            pages_out.append({
                "pdfPage": page["pdf_page"],
                "printedPage": page.get("printed_page"),
                "sentence": words,
                "blanks": [target] if target else [],
                "choices": choices,
                "image": f"./assets/{image_dest_rel}",
                "audio": f"./assets/{audio_dest_rel}",
                "sourceText": page.get("text", ""),
                "alignmentBand": page.get("confidence"),
                "alignmentScore": page.get("alignment_score"),
                "contentStatus": "auto_generated_pending_review",
                "listeningStatus": "pending",
            })

        unavailable_pages = [page for page in skipped if page["book"] == entry["book_id"]]
        books_out.append({
            "id": entry["book_id"].lower(),
            "title": entry["title"],
            "cfLabel": entry["book_id"],
            "series": "wacky-ricky",
            "cover": pages_out[0]["image"] if pages_out else "",
            "sourcePdf": clip_map["source_pdf"],
            "sourceFullAudio": clip_map["source_mp3"],
            "sourcePdfSha256": clip_map["source_pdf_sha256"],
            "sourceMp3Sha256": clip_map["source_mp3_sha256"],
            "editorialStatus": "review_required",
            "unavailablePages": unavailable_pages,
            "pages": pages_out,
        })

    payload = {
        "series": "Wacky Ricky",
        "status": "first_pass_review_required",
        "reviewSummary": {
            "pageClips": sum(book["clips"] for book in index["books"]),
            "priorityListenPages": sum(len(book.get("review_pages", [])) for book in index["books"]),
            "unavailablePages": len(skipped),
            "manualListeningVerified": 0,
        },
        "books": books_out,
        "skippedPages": skipped,
    }
    encoded = json.dumps(payload, ensure_ascii=False, indent=2)
    if not args.dry_run:
        MANIFEST.write_text("window.KakaWackyRickyManifest = " + encoded + ";\n")
    staged_bytes = sum((ROOT / "assets" / path).stat().st_size if (ROOT / "assets" / path).exists() else Path(src).stat().st_size for path, src in copied.items())
    print(json.dumps({"books": len(books_out), "narrated_pages": total_pages, "pages_with_media": sum(len(book["pages"]) for book in books_out), "skipped_pages": skipped, "media_files": len(copied), "media_bytes": staged_bytes, "manifest": str(MANIFEST), "dry_run": args.dry_run}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

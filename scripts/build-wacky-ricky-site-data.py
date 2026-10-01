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

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "source-materials/Wacky Ricky/Page-level clips"
ASSET_ROOT = ROOT / "assets/wacky-ricky"
MANIFEST = ROOT / "data/wacky-ricky-manifest.js"
STOP = set("a an and are arent as at be been but by can did didnt do does doesnt for from had has have he hes her him his i if ill im in into is isnt it its ive like me my not of on or our out said she shes so that the their them then there they theyre this to up was wasnt we were were weve what when where who will with you youre your".split())


def tokens(text: str) -> list[str]:
    return text.replace("\n", " ").split()


def norm(word: str) -> str:
    return "".join(char.lower() for char in word if char.isalnum())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

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
            counts = {}
            for word in words:
                if norm(word):
                    counts[norm(word)] = counts.get(norm(word), 0) + 1
            unique_words = [word for word in words if norm(word) and counts[norm(word)] == 1]
            possible = [word for word in unique_words if norm(word) not in STOP and len(norm(word)) >= 3]
            if not possible:
                possible = unique_words
            target = possible[len(possible) // 2] if possible else ""
            target_key = norm(target)
            page_keys = {norm(word) for word in words if norm(word)}
            distractors = [word for key, word in vocab_by_norm.items() if key != target_key and key not in page_keys and len(key) >= 2]
            rng = random.Random(f"{entry['book_id']}:{page['pdf_page']}")
            distractors.sort(key=lambda word: (abs(len(norm(word)) - len(target_key)), norm(word)))
            distractors = distractors[: min(len(distractors), 24)]
            rng.shuffle(distractors)
            choices = [target, *distractors[:2]]
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

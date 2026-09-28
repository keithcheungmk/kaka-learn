#!/usr/bin/env python3
"""Build Carter Family CF041–CF085 for the Story English Read & Fill library.

Source PDFs and original clips remain untouched in source-materials/. Each
published page uses the same 900px WebP, 32kbps mono MP3, and source-derived
Read & Fill question structure as CF021–CF040.
"""

from __future__ import annotations

import json
import runpy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "scripts" / "build-carter-21-40.py"


def main() -> None:
    namespace = runpy.run_path(str(BUILDER), run_name="carter_builder")
    manifest_path: Path = namespace["MANIFEST"]
    manifest = namespace["read_existing_manifest"]()
    books = {book["id"]: book for book in manifest["books"]}

    for number in range(41, 86):
        book = namespace["build_book"](number)
        books[book["id"]] = book
        print(f"built {book['cfLabel']}: {len(book['pages'])} pages — {book['title']}", flush=True)

    manifest["books"] = sorted(books.values(), key=lambda book: int(book["cfLabel"][2:]))
    manifest_path.write_text(
        "window.KakaCarterManifest = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"built CF041–CF085; catalogue now has {len(manifest['books'])} books / {sum(len(book['pages']) for book in manifest['books'])} pages")


if __name__ == "__main__":
    main()

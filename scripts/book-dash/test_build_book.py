#!/usr/bin/env python3
"""Focused checks for the PDF-to-manifest pipeline."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parent


class BuildBookTests(unittest.TestCase):
    def make_fixture(self, text: str) -> tuple[Path, Path, Path]:
        folder = Path(tempfile.mkdtemp(prefix="bookdash-test-"))
        pdf = folder / "fixture.pdf"
        document = fitz.open()
        page = document.new_page(width=600, height=400)
        page.insert_text((60, 100), text, fontsize=26)
        document.save(pdf)
        document.close()
        narration = folder / "narration.json"
        narration.write_text(json.dumps({"pages": [{"pdf_page": 1, "text": "Mama, Mama! It is my birthday.", "rules": {}}]}))
        return folder, pdf, narration

    def run_builder(self, folder: Path, pdf: Path, narration: Path, *extra: str) -> tuple[int, dict]:
        output = folder / "out"
        command = [sys.executable, str(ROOT / "build_book.py"), "--pdf", str(pdf), "--narration", str(narration), "--out", str(output), "--title", "Fixture", *extra]
        result = subprocess.run(command, capture_output=True, text=True)
        report = json.loads((output / "review-report.json").read_text())
        return result.returncode, report

    def test_pdf_word_boxes_and_player_shape(self) -> None:
        folder, pdf, narration = self.make_fixture("Mama, Mama! It is my birthday.")
        code, report = self.run_builder(folder, pdf, narration)
        self.assertEqual(code, 0)
        self.assertEqual(report["status"], "ready-for-human-review")
        data = json.loads((folder / "out" / "data.json").read_text())
        self.assertEqual(len(data["pages"][0]["words"]), 6)
        self.assertEqual(set(data["pages"][0]["words"][0]), {"text", "xPercent", "yPercent", "widthPercent", "heightPercent"})

    def test_unmatched_pdf_word_blocks_strict_build(self) -> None:
        folder, pdf, narration = self.make_fixture("Mama, Mama! It is my birthday. 2")
        code, report = self.run_builder(folder, pdf, narration, "--strict")
        self.assertEqual(code, 2)
        self.assertEqual(report["status"], "blocked")
        self.assertEqual(report["pages"][0]["review"]["match"]["unmatched_pdf"], ["2"])

    def test_explicit_ignore_rule_allows_known_page_number(self) -> None:
        folder, pdf, narration = self.make_fixture("Mama, Mama! It is my birthday. 2")
        narration.write_text(json.dumps({"pages": [{"pdf_page": 1, "text": "Mama, Mama! It is my birthday.", "rules": {"ignore_pdf": ["2"]}}]}))
        code, report = self.run_builder(folder, pdf, narration, "--strict")
        self.assertEqual(code, 0)
        self.assertEqual(report["status"], "ready-for-human-review")


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Build selected Carter Family derivatives for CF004–CF010.

Original PDFs and clips stay under source-materials/. This script only writes
selected page images, compressed page audio, and the browser manifest consumed by
Story English.
"""

from __future__ import annotations

import json
import io
import re
import shutil
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


def page(sentence: str, answer: str, distractors: tuple[str, str]) -> tuple[str, str, tuple[str, str]]:
    words = sentence.split()
    if answer not in words:
        quoted = [
            word for word in words
            if (word.startswith(answer) and word[len(answer):] in ('”', '"'))
            or (word.endswith(answer) and word[:-len(answer)] in ('“', '"'))
            or (word.startswith('“') and word.endswith('”') and word[1:-1] == answer)
        ]
        if len(quoted) == 1:
            answer = quoted[0]
    if answer not in words:
        raise ValueError(f"answer {answer!r} is not a word in {sentence!r}")
    if answer in distractors:
        raise ValueError(f"answer repeated in choices: {sentence!r}")
    return sentence, answer, distractors


BOOKS = {
    "cf004": {
        "title": "A Camping Trip!", "number": 4, "story_start_pdf": 3,
        "clip_start": 124, "pages": [
            page('“Yay!” said Harry.', 'Harry.', ('Mom.', 'Dad.')),
            page('The kids played in the yard.', 'yard.', ('car.', 'woods.')),
            page('“Everybody in the car!” Dad said.', 'car!”', ('tent!”', 'woods!”')),
            page('Rover was still looking for the stick.', 'stick.', ('food.', 'tent.')),
            page('Dad drove, and Rover barked loudly.', 'loudly.', ('quietly.', 'slowly.')),
            page('Mom and Harry set up the tent.', 'tent.', ('fire.', 'car.')),
            page('Rover sniffed all around.', 'around.', ('inside.', 'upstairs.')),
            page('We need to tie up our food.', 'food.', ('bags.', 'tent.')),
            page('“I like bears,” said Oliver.', 'bears,', ('dogs,', 'birds,')),
            page('Suddenly the bushes moved.', 'moved.', ('stopped.', 'opened.')),
            page('A sound came from the bushes.', 'bushes.', ('tent.', 'car.')),
            page('Rover had a new stick.', 'stick.', ('ball.', 'bag.')),
        ],
    },
    "cf005": {
        "title": "The Grocery Store", "number": 5, "story_start_pdf": 2,
        "clip_start": 136, "pages": [
            page('Everyone was at the grocery store.', 'store.', ('park.', 'school.')),
            page('“We need fruit,” said Mom.', 'fruit,', ('water,', 'bread,')),
            page('“We also need vegetables,” said Mom.', 'vegetables,', ('cookies,', 'candy,')),
            page('“Cookies are junk food,” said Mom.', 'junk', ('good', 'healthy')),
            page('Mom took the cookies out of the cart.', 'cookies', ('apples', 'chips')),
            page('Emmy put a bottle of soda into the cart.', 'soda', ('water', 'juice')),
            page('“We’re not buying soda,” said Mom.', 'buying', ('making', 'selling')),
            page('Oliver tried to sneak candy into the cart.', 'candy', ('fruit', 'bread')),
            page('Soon the shopping was done.', 'done.', ('started.', 'lost.')),
            page('Everyone put the food on the counter.', 'counter.', ('shelf.', 'floor.')),
            page('“Who put the chips in here?”', 'chips', ('books', 'shoes')),
            page('“It wasn’t me!” said Oliver.', 'me!', ('him!', 'you!')),
            page('“I’ll put them back,” he said.', 'back,”', ('away,”', 'down,”')),
        ],
    },
    "cf006": {
        "title": "Don’t Get Dirty!", "number": 6, "story_start_pdf": 2,
        "clip_start": 149, "pages": [
            page('“We’re going to a fancy restaurant,” said Mom.', 'restaurant,', ('school,', 'park,')),
            page('Emmy put on a pretty dress.', 'dress.', ('hat.', 'coat.')),
            page('Harry put on his favorite sweater.', 'sweater.', ('jacket.', 'shirt.')),
            page('Oliver put on a nice shirt and pants.', 'shirt', ('dress', 'coat')),
            page('The kids waited.', 'waited.', ('ran.', 'slept.')),
            page('“But don’t get dirty.”', 'dirty.', ('wet.', 'lost.')),
            page('Puddles were everywhere.', 'everywhere.', ('nowhere.', 'upstairs.')),
            page('“We need to look nice.”', 'nice.', ('fast.', 'quiet.')),
            page('“We can’t get dirty, Oliver!” said Harry.', 'dirty,', ('ready,', 'lost,')),
            page('“Where are the kids?” she asked.', 'kids?', ('bags?', 'shoes?')),
            page('“The kids will get dirty!”', 'dirty!', ('hungry!', 'late!')),
            page('But the kids were still clean!', 'clean!', ('wet!', 'tired!')),
            page('“Don’t we all look nice?” asked Mom.', 'nice?', ('happy?', 'ready?')),
            page('“Oops,” said Dad.', 'Oops,', ('Wow,', 'Sorry,')),
        ],
    },
    "cf007": {
        "title": "New Glasses for Oliver", "number": 7, "story_start_pdf": 3,
        "clip_start": 163, "pages": [
            page('Oliver was getting glasses.', 'glasses.', ('shoes.', 'books.')),
            page('“I can see fine now,” Oliver grumbled.', 'fine', ('well', 'badly')),
            page('Oliver put on his new glasses.', 'new', ('old', 'blue')),
            page('That night the ice cream truck came.', 'night', ('morning', 'afternoon')),
            page('The kids ran after the ice cream truck.', 'truck.', ('dog.', 'car.')),
            page('Suddenly Harry tripped.', 'tripped.', ('jumped.', 'laughed.')),
            page('Coins bounced all over the sidewalk.', 'Coins', ('Shoes', 'Books')),
            page('“We don’t have enough money.”', 'enough', ('much', 'little')),
            page('It was two shiny quarters!', 'quarters!', ('pennies!', 'buttons!')),
            page('“Good job, Oliver!” said Emmy.', 'Emmy.', ('Harry.', 'Mom.')),
            page('“I love ice cream,” said Emmy.', 'Emmy.', ('Oliver.', 'Harry.')),
            page('“I’m so glad that I got new glasses!”', 'glad', ('sad', 'tired')),
        ],
    },
    "cf008": {
        "title": "Good Dog, Rover!", "number": 8, "story_start_pdf": 3,
        "clip_start": 175, "pages": [
            page('Rover was a nice dog.', 'nice', ('mean', 'small')),
            page('But he chewed on shoes and socks.', 'shoes', ('books', 'sticks')),
            page('Then one day Rover chased Mrs. Hart’s kitten.', 'chased', ('helped', 'found')),
            page('“No, Rover!” cried Emmy.', 'Rover!', ('Ginger!', 'Harry!')),
            page('“But he needs to learn some manners!”', 'manners!', ('tricks!', 'songs!')),
            page('Dad and Emmy took Rover to school.', 'school.', ('park.', 'store.')),
            page('All the dogs sat—except Rover.', 'Rover.', ('Emmy.', 'Ginger.')),
            page('All the dogs barked—except Rover.', 'barked—except', ('ran—except', 'slept—except')),
            page('All the dogs fetched—except Rover.', 'fetched—except', ('jumped—except', 'waited—except')),
            page('“Rover is a hopeless dog,” said Emmy.', 'hopeless', ('helpful', 'happy')),
            page('Mrs. Hart was outside.', 'outside.', ('inside.', 'upstairs.')),
            page('“Mrs. Hart’s kitten is lost!”', 'lost!', ('safe!', 'hungry!')),
            page('Suddenly Rover sat.', 'sat.', ('ran.', 'barked.')),
            page('Soon he came back—with Ginger!', 'Ginger!', ('Rover!', 'Emmy!')),
            page('“You know how to sit, speak, and fetch.”', 'fetch.', ('sleep.', 'hide.')),
            page('Then he ran to the garden.', 'garden.', ('kitchen.', 'school.')),
        ],
    },
    "cf009": {
        "title": "A Good Day for Painting", "number": 9, "story_start_pdf": 3,
        "clip_start": 191, "pages": [
            page('“It’s a good day for painting,” said Mom.', 'painting,', ('cooking,', 'reading,')),
            page('Mom got some paint from the basement.', 'basement.', ('kitchen.', 'garden.')),
            page('Then she started painting the kitchen.', 'painting', ('cleaning', 'building')),
            page('“Catch, Oliver!” yelled Harry.', 'Oliver!', ('Mom!', 'Rover!')),
            page('Paint went everywhere.', 'everywhere.', ('nowhere.', 'upstairs.')),
            page('Mom cleaned up the paint.', 'cleaned', ('spilled', 'mixed')),
            page('Aunt Judy came home from shopping.', 'shopping.', ('school.', 'work.')),
            page('Aunt Judy bumped into the wet paint!', 'paint!', ('water!', 'mud!')),
            page('“My new sweater!” said Aunt Judy.', 'sweater!', ('hat!', 'dress!')),
            page('Mom started painting again.', 'painting', ('cleaning', 'resting')),
            page('“Sit, Rover!” said Emmy.', 'Sit,', ('Stay,', 'Come,')),
            page('Paint spilled all over the sheet.', 'spilled', ('dried', 'stayed')),
            page('Mom sat down and sighed.', 'sighed.', ('smiled.', 'laughed.')),
            page('Then she washed the paint roller.', 'washed', ('painted', 'dropped')),
            page('Mom put everything back in the basement.', 'basement.', ('kitchen.', 'garden.')),
            page('“It’s a good day for resting!”', 'resting!', ('playing!', 'running!')),
        ],
    },
    "cf010": {
        "title": "Going to the Dentist", "number": 10, "story_start_pdf": 2,
        "clip_start": 207, "pages": [
            page('The kids had to go to the dentist.', 'dentist.', ('doctor.', 'school.')),
            page('“The dentist won’t hurt you,” said Harry.', 'hurt', ('help', 'see')),
            page('“Her chair goes up and down,” said Emmy.', 'chair', ('car', 'door')),
            page('They were going to be late.', 'late.', ('early.', 'ready.')),
            page('“I know what to do,” said Emmy.', 'know', ('forget', 'like')),
            page('Your teddy bear likes the dentist.', 'likes', ('needs', 'sees')),
            page('“Okay. Let’s go!”', 'go!', ('stay!', 'wait!')),
            page('“Your teeth look great, Oliver,” said Dr. Cool.', 'great,', ('bad,', 'small,')),
            page('Next it was Harry’s turn.', 'turn.', ('game.', 'story.')),
            page('“My teeth always look great.”', 'always', ('never', 'sometimes')),
            page('“You’ll have to come back for a filling.”', 'filling.', ('checkup.', 'brush.')),
            page('“I don’t want to go to the dentist!” yelled Emmy.', 'dentist!', ('doctor!', 'school!')),
            page('It was his teddy bear.', 'teddy', ('school', 'toy')),
        ],
    },
}


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


def render_page(pdf: fitz.Document, pdf_page: int, dest: Path) -> None:
    page_obj = pdf[pdf_page - 1]
    scale = 900 / page_obj.rect.width
    pix = page_obj.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    dest.parent.mkdir(parents=True, exist_ok=True)
    image = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    image.save(dest, format='JPEG', quality=82, optimize=True, progressive=True)


def encode_audio(source: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(source),
        "-ac", "1", "-ar", "22050", "-b:a", "32k", str(dest),
    ], check=True)


def build() -> None:
    manifest_books = []
    for book_id, spec in BOOKS.items():
        number = spec["number"]
        pdf_path = pdf_for(number)
        folder = clip_folder(number)
        doc = fitz.open(pdf_path)
        book_dir = ASSET_DIR / book_id
        pages = []
        for index, (sentence, answer, distractors) in enumerate(spec["pages"], start=1):
            pdf_page = spec["story_start_pdf"] + index - 1
            clip_number = spec["clip_start"] + index - 1
            source_clip = folder / f"{clip_number}.mp3"
            if not source_clip.exists():
                raise FileNotFoundError(source_clip)
            printed_text = " ".join(doc[pdf_page - 1].get_text("text").split())
            if sentence not in printed_text:
                raise ValueError(f"{book_id} page {pdf_page}: sentence is not present in the source PDF page")
            image_rel = f"./assets/story-demo/{book_id}/pages/page-{index:02d}.webp"
            audio_rel = f"./assets/story-demo/{book_id}/{book_id}-page-{index:02d}.mp3"
            image_path = ROOT / image_rel.removeprefix("./")
            audio_path = ROOT / audio_rel.removeprefix("./")
            render_page(doc, pdf_page, image_path)
            encode_audio(source_clip, audio_path)
            pages.append({
                "pdfPage": pdf_page,
                "printedPage": index,
                "sourceClip": f"{clip_number}.mp3",
                "sentence": sentence.split(),
                "blanks": [answer],
                "choices": [answer, *distractors],
                "image": image_rel,
                "audio": audio_rel,
                "verificationStatus": "verified",
                "reviewNote": f"PDF page {pdf_page} paired with page clip {clip_number}.mp3.",
            })
        doc.close()
        manifest_books.append({
            "id": book_id,
            "title": spec["title"],
            "cfLabel": f"CF{number:03d}",
            "sourcePdf": f"source-materials/Carter Family/Book pdf/{pdf_path.name}",
            "sourceFullAudio": f"source-materials/Carter Family/Carter Family MP3/{number}.mp3",
            "clipFolder": f"source-materials/Carter Family/Page-level clips/{folder.name}",
            "pages": pages,
        })
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(
        "window.KakaCarterManifest = " + json.dumps({"books": manifest_books}, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"built {len(manifest_books)} books / {sum(len(b['pages']) for b in manifest_books)} pages")


if __name__ == "__main__":
    build()

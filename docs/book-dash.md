# Book Dash English pilot

`book-dash-demo.html` is a static 12-page pilot for Book Dash's *It's My Birthday!*.
The story page image files are derived from Book Dash's public page images. The
book is published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
and the page credits are shown in the player.

The deployed narration is newly generated with Microsoft Edge TTS. It does not
reuse the author's audio. Each page has PDF-derived percentage coordinates and
WordBoundary timings. Normal word targets are transparent. Keyboard focus and
the currently narrated word remain visible.

The official Book Dash page is the primary licence and credit reference. The
PDF text and coordinates used for this pilot came from the public mirror recorded
in `data/book-dash/its-my-birthday-source.json`; the protected official source
files endpoint was not used. The original PDF is not committed.

To rebuild the manifest and audio after a source refresh, install
`scripts/book-dash/requirements.txt`, obtain the source PDF lawfully, and run:

```sh
python3 scripts/book-dash/build_book.py \
  --pdf /path/to/its-my-birthday.pdf \
  --narration data/book-dash/its-my-birthday-narration.json \
  --source data/book-dash/its-my-birthday-source.json \
  --out /tmp/book-dash-build \
  --title "It's My Birthday!" \
  --generate-audio --strict
```

The generated report must show matched PDF words and matched WordBoundary
timings for every page. `generated-needs-human-review` remains intentional until
an adult has listened through the audio and checked the page alignment.

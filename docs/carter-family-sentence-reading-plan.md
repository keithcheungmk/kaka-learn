# Carter Family Read & Fill and reading exercises

This is the content specification for the first ten Carter Family books. The
existing CF001–CF003 implementation is the visual and interaction template; the
remaining books extend the content catalogue without creating a second game.

## Aim

Turn each Carter Family story page into one small reading action: listen to the page,
then put one missing whole word back into a short sentence from that same page. The
school-supplied PDF is the scene and the matching original page clip is the model, so
the app does not need invented illustrations or synthetic story audio.

## Source-to-app workflow

1. Catalogue the source PDF, full-book recording, page clip folder, and page numbers.
   Originals remain in `source-materials/Carter Family/`.
2. For each chosen page, transcribe one short printed sentence and replay its matching
   clip. Record the PDF page and clip filename in the web data.
3. Select one useful whole word to remove. The current UI uses three choices in
   total: the answer and two gentle distractors. Keep one blank per page.
4. Deploy only selected page images and clips as derivatives. Keep the original files
   private and traceable.

## Scope: CF001–CF010 Read & Fill

Published Story English books:

| Book | Title | Story pages | Clips |
| --- | --- | ---: | --- |
| CF001 | *Game Night* | 12 | `86.mp3`–`97.mp3` |
| CF002 | *The Tree House* | 12 | `98.mp3`–`109.mp3` |
| CF003 | *The School Play* | 14 | `110.mp3`–`123.mp3` |
| CF004 | *A Camping Trip!* | 12 | `124.mp3`–`135.mp3` |
| CF005 | *The Grocery Store* | 13 | `136.mp3`–`148.mp3` |
| CF006 | *Don't Get Dirty!* | 14 | `149.mp3`–`162.mp3` |
| CF007 | *New Glasses for Oliver* | 12 | `163.mp3`–`174.mp3` |
| CF008 | *Good Dog, Rover!* | 16 | `175.mp3`–`190.mp3` |
| CF009 | *A Good Day for Painting* | 16 | `191.mp3`–`206.mp3` |
| CF010 | *Going to the Dentist* | 13 | `207.mp3`–`219.mp3` |

CF001–CF003 currently provide 38 verified story pages. CF004–CF010 add 96
further story pages, for 134 pages in the first-ten scope.

## Content manifest contract

The runtime should consume one Carter content manifest rather than adding another
large hard-coded block to the UI engine. The existing `js/story-demo.js` remains
the Read & Fill renderer and controller; the manifest is only the book/page data.

Each book record must contain:

```text
id, title, cfLabel, sourcePdf, sourceFullAudio, clipFolder, pages[]
```

Each page record must contain:

```text
pdfPage, printedPage, sourceClip, sentence[], blanks[], choices[],
image, audio, verificationStatus, reviewNote
```

`sentence[]` must preserve the printed wording, case and punctuation. `blanks[]`
contains exactly one complete word from that sentence. `choices[]` contains the
answer plus two plausible but incorrect choices. `verificationStatus` is
`verified` only after the PDF page, printed sentence and page-level clip have been
checked together.

Each book uses the same Read & Fill loop:

1. The child sees a large page and taps **Listen to this page**.
2. When the official recording finishes, the same page remains on screen.
3. A short sentence from that page appears with one missing word.
4. The child drags or taps a word tile into the blank.
5. The full sentence remains visible after a correct answer. The child chooses the
   next page, retaining control of the pace.

On iPad landscape, the page is the main left-hand visual and the sentence activity is
on the right. On a phone, the same elements stack vertically. This keeps the image,
sound and word recognition together rather than turning the story into a separate quiz.

## Progression for later books

| Stage | Child action | Evidence of progress |
| --- | --- | --- |
| Listen | Hear one page clip while seeing its PDF scene | Stays with a page of story English. |
| Notice | See a short sentence from that same page | Connects spoken language with print. |
| Fill | Restore one whole word by tap or drag | Recognises the word in context. |
| Read again | Replay the source clip with the completed sentence visible | Builds familiarity without testing pressure. |

Useful sentence frames are added only when they occur word-for-word in a verified
Carter Family page. New books are added only after their PDF page and page clip are
checked together. Cover, title, copyright, blank, word-card and other non-story
pages are excluded from the playable page list.

## Quality rules

- Every published fill sentence points to a Carter Family book, source PDF page and
  matching page clip.
- The child-facing model remains the official page recording, never English TTS.
- The final interactive action must be visible and reachable on iPad portrait,
  landscape and phone.
- A correct answer may award a star only once for its stable book/page activity key;
  replaying a completed page must not duplicate the reward.
- A book completion record must identify the Carter book ID and not rely on the
  visible page count alone.
- Content tests must validate every manifest page, not a hard-coded CF001–CF003
  count. Run Story tests, invariant checks and the three target viewport checks
  before deployment.

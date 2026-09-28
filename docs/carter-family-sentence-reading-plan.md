# Carter Family Read & Fill and reading exercises

This is the content specification for Carter Family books CF001–CF040. The
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

## Scope: CF001–CF020 Read & Fill

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
| CF011 | *Harry's Friend Comes Over* | 17 | `220.mp3`–`236.mp3` |
| CF012 | *Summer Vacation* | 12 | `237.mp3`–`248.mp3` |
| CF013 | *The Yard Sale* | 13 | `249.mp3`–`261.mp3` |
| CF014 | *At the Beach* | 15 | `262.mp3`–`276.mp3` |
| CF015 | *The Movie Theater* | 17 | `277.mp3`–`293.mp3` |
| CF016 | *The Cake* | 11 | `294.mp3`–`304.mp3` |
| CF017 | *Space Wands* | 12 | `305.mp3`–`316.mp3` |
| CF018 | *A Picnic in the Park* | 15 | `317.mp3`–`331.mp3` |
| CF019 | *Oliver's Library Book* | 13 | `332.mp3`–`344.mp3` |
| CF020 | *A Surprise for Emmy* | 14 | `345.mp3`–`358.mp3` |

CF001–CF003 provide 38 verified story pages. CF004–CF010 add 96 pages,
CF011–CF020 add 139 pages, and CF021–CF040 add 245 pages, for 518 pages across
the published CF001–CF040 catalogue.

## Scope: CF021–CF040 Read & Fill

| Book | Title | Story pages | Clips |
| --- | --- | ---: | --- |
| CF021 | *It's Mother's Day!* | 12 | `359.mp3`–`370.mp3` |
| CF022 | *The Backyard* | 13 | `371.mp3`–`383.mp3` |
| CF023 | *The Amusement Park* | 13 | `384.mp3`–`396.mp3` |
| CF024 | *The Purple Scarf* | 14 | `397.mp3`–`410.mp3` |
| CF025 | *Everyone Babysits* | 12 | `411.mp3`–`422.mp3` |
| CF026 | *Aunt Judy's Mystery Adventure* | 12 | `423.mp3`–`434.mp3` |
| CF027 | *Rover's Walk* | 12 | `435.mp3`–`446.mp3` |
| CF028 | *A Silly Snowman* | 12 | `447.mp3`–`458.mp3` |
| CF029 | *The Club in the Tree House* | 12 | `459.mp3`–`470.mp3` |
| CF030 | *A Rainy Day* | 12 | `471.mp3`–`482.mp3` |
| CF031 | *The Class Pet* | 12 | `483.mp3`–`494.mp3` |
| CF032 | *The Fire Drill* | 12 | `495.mp3`–`506.mp3` |
| CF033 | *A Hike to the Top* | 12 | `507.mp3`–`518.mp3` |
| CF034 | *Harry's Sick Day* | 12 | `519.mp3`–`530.mp3` |
| CF035 | *Aunt Judy's Closet* | 12 | `531.mp3`–`542.mp3` |
| CF036 | *Planting Seeds* | 12 | `543.mp3`–`554.mp3` |
| CF037 | *The Airplane Trip* | 13 | `555.mp3`–`567.mp3` |
| CF038 | *Harry's Map* | 12 | `568.mp3`–`579.mp3` |
| CF039 | *A Visit with Grandpa* | 12 | `580.mp3`–`591.mp3` |
| CF040 | *Picking Berries* | 12 | `592.mp3`–`603.mp3` |

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

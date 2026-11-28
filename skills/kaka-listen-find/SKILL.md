---
name: kaka-listen-find
description: Build, extend, or release KAKA Learn's scene-based Listen & Find vocabulary game.
---

# KAKA Listen & Find

Use this skill when adding or maintaining an English listening-and-picture-search activity in KAKA Learn. Keep it distinct from Topic Words spelling and Phonics decoding: the child hears one English word, then finds it in a familiar illustrated scene by circling or tapping.

## Product rules

- Use a recognizable everyday scene with clearly visible, non-overlapping targets. Store each scene's target names, hit regions and spoken prompt data together so they can be checked against the artwork.
- Support finger circling and a direct tap. Make the hit area forgiving, size it against the displayed image, and keep the drawing overlay aligned after resize and device rotation.
- Start audio only after a child-initiated action. Use `KakaSpeech.speakEnglishTerm`, respect the app's mute preference, and let the app's English voice selection prefer a female voice when available. Device voice availability varies, so don't promise a voice that is not installed.
- Advance after speech ends, with a duration-based fallback because iOS Safari can miss `onend`. Cancel the fallback and invalidate stale callbacks whenever the game restarts or closes.
- Keep praise varied and editable in a clearly named dialogue data file. Avoid repeating the target prompt after a correct answer; praise the child, celebrate the found picture, then continue after speech finishes.
- Award one shared star per correctly found target and one daily `listen` AEON coin when the full round is completed, using the shared storage/reward helpers and refreshing the global reward display.
- Animate the found target and Kaka gently. Respect reduced-motion settings and provide a clear, spoken repeat control and progress count.
- A new scene must reuse the same interaction flow while supplying its own validated scene art and target regions. Do not copy third-party game assets or audio.

## Workflow

1. Read repository `AGENTS.md` and `docs/handover.md`; check `git status` and the current branch tip. Preserve unrelated work and implement in an isolated checkout when the shared checkout is dirty.
2. Confirm the target list against the scene artwork. Keep scene assets under `assets/english-listen-find/` (or a clearly named sibling directory), optimize images for the existing asset budget, and update the image-format lock through its approved owner/workflow.
3. Place the game entry in the English learning route that best matches listening plus picture recognition. Reuse the project's speech, mute and screen navigation helpers; keep scene geometry, dialogue, presentation and interaction logic in their existing project layers.
4. Validate script syntax, target/data/art alignment, the focused game path, return navigation, responsive iPad portrait and landscape layouts, and reduced motion. Keep automated browser checks silent by mocking speech. Do not claim live audio or real-device touch verification unless performed on that device. `scripts/test-listen-find-layout.py` runs in CI for the `listen` scope (`index.html`, `css/listen-find.css`, `js/listen-find*.js`, `assets/english-listen-find/*`): it opens a chapter before checking the start card, asserts picker columns per orientation, taps hit regions and plays a full round on iPad portrait and landscape.
5. For a release, follow current project checks and verify each stage separately: focused checks, reviewable branch/PR, required CI, merge, Pages deployment and live version. State any unverified device/audio behavior.

## Current chapters

English hub → 聽聲搵圖 (Listen & Find) opens a chapter picker. After a chapter is chosen, the existing start card and play flow run for that scene.

- Fruit shop: apple, banana, orange, grapes, pear, strawberry, pineapple, watermelon.
- Farm: cow, pig, horse, chicken, duck, sheep, goat, rabbit.
- Zoo: lion, elephant, giraffe, monkey, panda, zebra, penguin, hippo. No tiger. Do not reuse Farm words such as pony or chick.
- Construction site: excavator, crane, forklift, dump truck, mixer truck, road roller, tanker truck, front loader. Artwork has background tower cranes, so keep spoken prompts to the target word and treat taps on the background as a miss.

The chapter picker sets `data-chapters` on `.listen-find-chapters` from the number of cards. With four cards it lays out one row of four in landscape and 2×2 in portrait (`max-width: 560px` stays a single column). Adding a fifth chapter needs a new CSS rule, otherwise the last card is orphaned on its own row.

The on-screen feature name is 聽聲搵圖 (Listen & Find). Never write 聽聲搗圖, 聽聲掽圖, or 聽聲揪圖. If a family name is needed, the baby sister is 浠榆妹妹 (HeiYu). Never write 洠榆, 希恩, or 浓榆. On-screen body copy is formal written Traditional Chinese; spoken lines may be Cantonese.

`js/listen-find-scenes.js` stores each scene's image, target names and percentage hit regions. `js/listen-find-dialogue.js` contains the editable praise lines (`{word}`; `{fruit}` still works). If scene art changes, recheck all eight regions at desktop and iPad aspect ratios. Zoo art must be a new unified 16:9 scene under `assets/english-listen-find/`; do not crop diary comic panels or collage `assets/animals/wild` sprites.

Play layout (approved iPad change): collapse the LOOK · LISTEN · PLAY intro during play so the top bar keeps only back, a short title, and the progress count. Landscape uses a slim 180–200px mission panel; portrait puts the scene on top and a slim control bar below. Scene art uses `object-fit: contain` (do not crop targets). `layoutScene()` maps the drawing overlay and hit regions to the painted image and must run after resize, rotation, and intro collapse.

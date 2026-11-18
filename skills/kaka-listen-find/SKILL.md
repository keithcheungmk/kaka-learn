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
4. Validate script syntax, target/data/art alignment, the focused game path, return navigation, responsive iPad portrait and landscape layouts, and reduced motion. Keep automated browser checks silent by mocking speech. Do not claim live audio or real-device touch verification unless performed on that device.
5. For a release, follow current project checks and verify each stage separately: focused checks, reviewable branch/PR, required CI, merge, Pages deployment and live version. State any unverified device/audio behavior.

## Current fruit-shop reference

The first scene uses eight fruits: apple, banana, orange, grapes, pear, strawberry, pineapple and watermelon. `js/listen-find-dialogue.js` contains the editable praise lines. Its artwork hit regions live in `js/listen-find.js`; if the scene art changes, recheck all eight regions at desktop and iPad aspect ratios.

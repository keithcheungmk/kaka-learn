---
name: kaka-story-based-chinese-learning
description: Create or extend personalized Traditional Chinese read-along stories and vocabulary games for Kaka and family, including age-appropriate dialogue, illustrations, audio, and per-page word missions.
---

# 度身幫卡卡寫故事學中文

Use this skill for original KAKA family stories and story-based Chinese learning activities. Keep story writing distinct from red-book OCR or verified-source vocabulary work.

## Workflow

1. Read `AGENTS.md`, `docs/handover.md`, `docs/family-story-character-bible.md`, and `docs/family-storybook-first-edition.md`. Inspect `data/family-stories/manifest.js` and the current story renderer before editing.
2. Turn the brief into a short, continuous plot of 6–8 illustrated pages. Use Hong Kong Traditional Chinese. Keep each page to one readable narrative sentence plus one short character line with a speaker label; dialogue stays in the same reading style, not a separate callout.
3. Give each page exactly two unique focus words that occur once in the sentence, in sentence order, and at least two plausible distractors. The shuffled `tiles` must reconstruct the sentence exactly. Keep source-backed `bookWords` separate from original `extensionWords`; never claim an unverified red-book word came from a book.
4. Keep character ages, appearance, clothes, relationships, names, and proportions aligned with the character bible. Depict babies safely in an adult's arms or a safe cot. Use image generation with relevant turnaround references; illustrations must contain no text, labels, logos, or speech bubbles.
5. Save page art under `assets/family-stories/scenes/` as 900×600 WebP and keep each image below 400 KB. Match each page's action to its illustration; inspect every generated image before adding it.
6. Add the story to `data/family-stories/manifest.js` using the existing reader/game schema. Preserve the established read-aloud and two-word fill-in flow. Add the story to `docs/family-storybook-first-edition.md` and record active ownership or completed integration in `docs/handover.md` as appropriate.
7. Run `python3 scripts/check-family-stories.py`, `python3 scripts/check-invariants.py`, `node --check js/family-storybook.js`, the relevant story mission tests, and `git diff --check`. Check story/page totals, every image path and size, speaker membership, and exact sentence reconstruction. Automated checks do not prove voice quality or child-device visual QA; state those limits accurately.

## Project references

- Character continuity and newborn safety: `docs/family-story-character-bible.md`
- Story catalogue, reader layout, audio, and game rules: `docs/family-storybook-first-edition.md`
- Runtime story schema and curated content: `data/family-stories/manifest.js`
- Project-level rules and release boundaries: `AGENTS.md` and `docs/handover.md`

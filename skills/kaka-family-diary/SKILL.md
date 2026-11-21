---
name: kaka-family-diary
description: Create or update KAKA Learn family diary stories and their child-friendly Chinese reading activities.
---

# KAKA family diary

Use the current `data/family-stories/manifest.js`, `js/family-storybook.js`, and project handover as the implementation model. Preserve existing stories, progress keys, and unrelated changes. Use only events supplied or confirmed by the family; do not invent people, actions, dates, or outcomes.

Write short, natural Traditional Chinese sentences suitable for young children. The on-screen text is written Chinese; read that text aloud using Cantonese rather than rewriting it into colloquial text. Provide a small set of relevant clickable listening words on each page and use the existing simple word-recognition activity: listen to the page first, then work towards reading it independently. Each target must appear unambiguously in its page sentence, and every answer and distractor must match the image and text.

Follow existing character designs. Protect children's privacy: depict bath or changing contexts with everyone fully clothed in bathrobes, and avoid identifiable personal details. Verify each image depicts the described action, and distinguish real source material from generated illustrations.

Check the affected story's data, images, playback/fallback, word selection and progression silently, plus relevant device layouts. Report separately whether Cantonese pronunciation was heard on a real iPad. Prepare a reviewable commit and release only when authorized.

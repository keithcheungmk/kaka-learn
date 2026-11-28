---
name: kaka-scenario-learning-game
description: Design or improve a KAKA child-facing learning game as a clear, playable everyday scenario with visual reasoning, concise Cantonese guidance, and responsive playground-style UI.
---

# KAKA Scenario-Based Learning Game

Use this skill when creating or revising an interactive KAKA learning activity, especially when a worksheet-like quiz needs to become a playful, understandable experience for a young child. Reuse the principles below, not the fruit-shop setting or its exact layout.

## Start from the child’s task

- Identify the one thing the child should understand or do in each turn. Put that task first; avoid a long intro, unnecessary instructions, or making the child listen before they can begin.
- Use a familiar, concrete situation (for example shopping, sharing fruit, catching a bus, or reading a clock) only when it naturally explains the learning goal. The scene should help answer “why am I doing this?” without competing with the activity.
- Phrase prompts in short, natural Hong Kong Cantonese suitable for the child. Use the child’s current task vocabulary and say exactly what action is expected.
- Keep each screen to two or three clear visual regions. Give the main manipulative/task the most area; keep scene art supportive, with legible contrast. On landscape tablets, use the available width; on portrait phones, reflow into a scrollable, touch-friendly layout rather than clipping content.

## Teach through visible action

- Prefer concrete objects, grouped counters, number frames, coin pieces, clock hands, or other manipulatives that show the mathematical relationship. Do not reduce a strategy lesson to an equation and multiple-choice answers when a visual model can teach the reasoning.
- Make controls discoverable: show what can be tapped, dragged, rotated, or selected; provide an obvious selected state and a way to undo. On touch devices, do not rely on hover, precision dragging, or hidden gestures when a direct tap works.
- Keep the prompt, visual model, expected action, and answer validation aligned. Before release, enumerate representative questions and verify every accepted answer is valid and every intended answer is available. If multiple solutions are mathematically valid, either accept all of them or word/constrain the task so it asks for one unambiguous answer.
- For a wrong answer, preserve the child’s work where possible and guide one small reasoning step at a time using the same objects on screen. Avoid simply saying “wrong” or revealing an unrelated explanation. For a correct answer, acknowledge it briefly and allow enough time for spoken feedback before advancing; do not rush into the next question.

## Art direction and assets

- Follow the current KAKA playground visual language: bright, warm, friendly, high-contrast surfaces, rounded cards, clear type, generous touch targets, and the project’s established native emoji where appropriate.
- Use an original, recognizable scene illustration as a poster or low-contrast background only when it strengthens the scenario. Keep important content and controls visually dominant. Do not imitate another service’s proprietary characters, exact artwork, or branded compositions.
- Draw or generate custom assets when a precise object matters educationally (such as Hong Kong coin denominations). Check silhouette, denomination/value, color, contrast, and small-screen legibility; do not rely on decorative approximations that could teach the wrong concept.
- Keep motion short and purposeful (for example, a selected coin visibly landing in a tray); respect reduced-motion preferences and ensure the game remains fully usable without animation or audio.

## Build and verify

- Inspect the existing activity, shared styles, data model, and project handover before editing. Preserve unrelated work and use the project’s current component conventions rather than creating a parallel framework unnecessarily.
- Keep the activity usable without audio; speech should reinforce concise on-screen instructions and feedback, not be the only way to learn what to do.
- Test question generation and answer logic across representative seeds, including edge cases and repeated attempts. Check first-question usability, correct/incorrect feedback, undo/retry, progression, and completion.
- Run the relevant focused tests, JavaScript/CSS or invariant checks, and the project’s device-viewport smoke tests when available. Check landscape tablet and portrait phone layouts separately. A simulated viewport is not evidence of physical-device testing; report that distinction accurately.
- Inspect the rendered screen when a browser is available. If visual testing is blocked, state what was and was not verified; do not claim visual acceptance based only on syntax or unit tests.
- Treat implementation, commit, merge, push, and live deployment as separate milestones. Follow the current user authorization and project release process; never publish unrelated branch history as part of a scoped activity change.

## Before calling it ready

Confirm that a young child can tell at a glance:

1. What is happening in this scene?
2. What should I do now?
3. Which objects or controls can I use, and how do I undo?
4. How does the visual action show why the answer is right?

If any answer is unclear, simplify the screen or interaction before adding more decoration or instructions.

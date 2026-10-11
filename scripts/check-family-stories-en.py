#!/usr/bin/env python3
"""Validate the English family-story shell: two approved books, two focus words, shared Chinese scene art."""
import json, re, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
manifest = "global.window={};require('./data/family-stories/manifest-en.js');process.stdout.write(JSON.stringify(window.FAMILY_STORIES_EN))"
stories = json.loads(subprocess.check_output(['node', '-e', manifest], cwd=ROOT, text=True))
errors = []
ALLOWED_IDS = ['rainbow-umbrella', 'park-kite']
ALLOWED_SPEAKERS = {'Karl', 'HeiHei', 'Froggie'}
WORD_RE = re.compile(r"^[A-Za-z][A-Za-z'-]*$")

if [story.get('id') for story in stories] != ALLOWED_IDS:
    errors.append(f'Expected story ids {ALLOWED_IDS}, found {[story.get("id") for story in stories]}')
if len(stories) != 2:
    errors.append(f'Expected 2 English family stories, found {len(stories)}')

blob = json.dumps(stories, ensure_ascii=False)
for bad in ('Heihei', 'heihei', 'HEIHEI', 'Hei-hei', '禧禧', '卡卡', '蛙蛙'):
    if bad in blob:
        errors.append(f'English stories must use Karl / HeiHei / Froggie, not {bad}')
if 'story-demo' in blob:
    errors.append('English family stories must not depend on Little Fox story-demo data')

def last_word_index(sentence, word):
    pattern = re.compile(rf'\b{re.escape(word)}\b')
    last = None
    for match in pattern.finditer(sentence):
        last = match
    return last.start() if last else -1

for story in stories:
    label = story.get('id', '?')
    pages = story.get('pages', [])
    if len(pages) != 6:
        errors.append(f'{label}: expected 6 pages, found {len(pages)}')
    if not story.get('place') or not story.get('title'):
        errors.append(f'{label}: needs place and title for place: story chrome')
    characters = set(story.get('characters') or [])
    if not characters <= ALLOWED_SPEAKERS:
        errors.append(f'{label}: characters must be a subset of {sorted(ALLOWED_SPEAKERS)}')
    for i, page in enumerate(pages, 1):
        sentence = page.get('sentence', '')
        focus = page.get('focusWords', [])
        distractors = page.get('distractors', [])
        if len(focus) != 2:
            errors.append(f'{label} page {i}: expected exactly two focus words')
        if len(distractors) < 2:
            errors.append(f'{label} page {i}: expected at least two distractors')
        if set(focus) & set(distractors):
            errors.append(f'{label} page {i}: a distractor duplicates a focus word')
        if not sentence:
            errors.append(f'{label} page {i}: missing sentence')
        elif not re.search(r'[.!?]$', sentence):
            errors.append(f'{label} page {i}: sentence must end with English punctuation')
        positions = []
        for word in focus:
            if not WORD_RE.match(word or ''):
                errors.append(f'{label} page {i}: focus word {word!r} is not a simple English word')
            start = last_word_index(sentence, word)
            if start < 0:
                errors.append(f'{label} page {i}: focus word {word} is absent from sentence')
            else:
                positions.append((start, start + len(word), word))
        positions.sort()
        for previous, following in zip(positions, positions[1:]):
            if following[0] < previous[1]:
                errors.append(f'{label} page {i}: focus words overlap in sentence')
        speech = page.get('dialogue') or {}
        if speech.get('speaker') not in ALLOWED_SPEAKERS:
            errors.append(f'{label} page {i}: dialogue speaker must be Karl, HeiHei or Froggie')
        if speech.get('speaker') not in characters:
            errors.append(f'{label} page {i}: dialogue speaker must be listed on the story')
        if not speech.get('text') or not re.search(r'[.!?]$', speech.get('text', '')):
            errors.append(f'{label} page {i}: dialogue must be a complete punctuated sentence')
    for asset in [f'{label}-p{i:02}.webp' for i in range(1, len(pages) + 1)]:
        if not (ROOT / 'assets/family-stories/scenes' / asset).exists():
            errors.append(f'{label}: missing shared Chinese scene art {asset}')

if errors:
    print('\n'.join('FAIL: ' + e for e in errors))
    sys.exit(1)
print(f'PASS: {len(stories)} English family stories; {sum(len(story.get("pages", [])) for story in stories)} pages; focus words, distractors, speakers and shared scene art validated.')

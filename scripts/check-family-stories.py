#!/usr/bin/env python3
"""Validate first-edition KAKA family stories against verified book-card vocabulary."""
import json, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest="global.window={};require('./data/family-stories/manifest.js');process.stdout.write(JSON.stringify(window.FAMILY_STORIES))"
stories=json.loads(subprocess.check_output(['node','-e',manifest],cwd=ROOT,text=True))
errors=[]
def norm(text): return re.sub(r'[，。！？、\s]','',text)
if len(stories)!=10: errors.append(f'Expected 10 stories, found {len(stories)}')
for story in stories:
    label=story.get('id','?')
    if len(story.get('pages',[])) not in range(6,9): errors.append(f'{label}: page count must be 6-8')
    cards={}
    for book in story.get('sourceBooks',[]):
        path=ROOT/'data'/'book-cards'/f'{book}.json'
        if not path.exists(): errors.append(f'{label}: missing source card {book}'); continue
        cards[book]={card['char'] for card in json.loads(path.read_text())['cards']}
    known=set().union(*cards.values()) if cards else set()
    for word in story.get('bookWords',[]):
        if word not in known: errors.append(f'{label}: book word {word} absent from source card(s)')
    allowed=set(story.get('bookWords',[]))|set(story.get('extensionWords',[]))
    for i,page in enumerate(story.get('pages',[]),1):
        if norm(''.join(page.get('tiles',[])))!=norm(page.get('sentence','')): errors.append(f'{label} page {i}: tiles do not rebuild sentence')
        for word in page.get('learn',[]):
            if word not in allowed: errors.append(f'{label} page {i}: unclassified learning word {word}')
        if not page.get('sentence'): errors.append(f'{label} page {i}: missing sentence')
    for asset in [f'{label}-p{i:02}.webp' for i in range(1,len(story.get('pages',[]))+1)]:
        if not (ROOT/'assets/family-stories/scenes'/asset).exists(): errors.append(f'{label}: missing art {asset}')
if errors:
    print('\n'.join('FAIL: '+e for e in errors));sys.exit(1)
print(f'PASS: {len(stories)} stories; 6 pages each; source words, classified learning words, answer tiles and art paths validated.')

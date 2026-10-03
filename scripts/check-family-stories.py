#!/usr/bin/env python3
"""Validate first-edition KAKA family stories against verified book-card vocabulary."""
import json, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest="global.window={};require('./data/family-stories/manifest.js');process.stdout.write(JSON.stringify(window.FAMILY_STORIES))"
stories=json.loads(subprocess.check_output(['node','-e',manifest],cwd=ROOT,text=True))
errors=[]
def norm(text): return re.sub(r'[，。！？、\s]','',text)
if len(stories)!=17: errors.append(f'Expected 17 stories, found {len(stories)}')
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
        focus=page.get('focusWords',[])
        if len(focus)!=2: errors.append(f'{label} page {i}: expected exactly two focus words')
        if page.get('learn',[])!=focus: errors.append(f'{label} page {i}: learn words must match focusWords in sentence order')
        if len(page.get('distractors',[]))<2: errors.append(f'{label} page {i}: expected at least two distractors')
        positions=[]
        for word in focus:
            if word not in allowed: errors.append(f'{label} page {i}: focus word {word} has no source classification')
            start=page.get('sentence','').find(word)
            if start<0: errors.append(f'{label} page {i}: focus word {word} is absent from sentence')
            elif page.get('sentence','').count(word)!=1: errors.append(f'{label} page {i}: focus word {word} must occur once for an unambiguous blank')
            else: positions.append((start,start+len(word),word))
        positions.sort()
        for previous,following in zip(positions,positions[1:]):
            if following[0]<previous[1]: errors.append(f'{label} page {i}: focus words overlap in sentence')
        if [word for _,_,word in positions] != focus:
            errors.append(f'{label} page {i}: focusWords must follow sentence order')
        if set(focus) & set(page.get('distractors',[])):
            errors.append(f'{label} page {i}: a distractor duplicates a focus word')
        if not page.get('sentence'): errors.append(f'{label} page {i}: missing sentence')
        elif not re.search(r'[。！？]$',page['sentence']) or re.search(r'[。！？].+[。！？]',page['sentence']): errors.append(f'{label} page {i}: story text must be one complete sentence')
        speech=page.get('dialogue',{})
        if speech.get('speaker') not in story.get('characters',[]): errors.append(f'{label} page {i}: dialogue speaker must be a listed story character')
        if not speech.get('text') or not re.search(r'[。！？]$',speech.get('text','')): errors.append(f'{label} page {i}: dialogue must be a complete punctuated sentence')
    for asset in [f'{label}-p{i:02}.webp' for i in range(1,len(story.get('pages',[]))+1)]:
        if not (ROOT/'assets/family-stories/scenes'/asset).exists(): errors.append(f'{label}: missing art {asset}')
if errors:
    print('\n'.join('FAIL: '+e for e in errors));sys.exit(1)
total_pages=sum(len(story.get('pages',[])) for story in stories)
print(f'PASS: {len(stories)} stories; {total_pages} pages total (6-8 each); source words, classified learning words, answer tiles and art paths validated.')

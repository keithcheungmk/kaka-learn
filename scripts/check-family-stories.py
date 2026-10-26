#!/usr/bin/env python3
"""Validate first-edition KAKA family stories against verified book-card vocabulary."""
import json, re, subprocess, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
manifest="global.window={};require('./data/family-stories/manifest.js');process.stdout.write(JSON.stringify(window.FAMILY_STORIES))"
stories=json.loads(subprocess.check_output(['node','-e',manifest],cwd=ROOT,text=True))
errors=[]
def norm(text): return re.sub(r'[，。！？、\s]','',text)

# Keith 2026-10-26：故事／生字任務用香港正式書面中文。
# 只掃學習欄位；唔掃「的／了」、角色專有名詞、英文 manifest、四格口語模式。
# 「係」單獨不掃（會誤殺「關係／系統」）；「係咪」用詞組。
ORAL_CHARS = '哋唔嚟咗喺冇睇攞俾啲咁喇啦喎㗎咩嘢嘅哦'
ORAL_PHRASES = (
    '係咪', '你哋', '我哋', '佢哋',
    '唔好', '唔係', '唔使',
    '掛住', '揸車', '沖涼', '好味', '落樓', '食雪糕',
    '好開心', '好忙', '好多', '好香', '好漂亮', '好清楚',
    '好好吃', '好好玩', '今日',
)
# 已係書面或專有名詞，即使含口語字亦不報。
ORAL_ALLOW_EXACT = set()

def oral_hits(text):
    if not text:
        return []
    remaining = str(text)
    hits = []
    for allowed in ORAL_ALLOW_EXACT:
        remaining = remaining.replace(allowed, '\u25a1' * len(allowed))
    for phrase in sorted(ORAL_PHRASES, key=len, reverse=True):
        if phrase in remaining:
            hits.append(phrase)
            remaining = remaining.replace(phrase, '\u25a1' * len(phrase))
    for ch in ORAL_CHARS:
        if ch in remaining:
            hits.append(ch)
    return hits

def scan_oral(label, field, value):
    if isinstance(value, (list, tuple)):
        for item in value:
            scan_oral(label, field, item)
        return
    hits = oral_hits(value)
    if hits:
        shown = '、'.join(hits)
        errors.append(f'{label}: {field} 要用香港正式書面中文，唔好用粵語口語「{shown}」')

# 自衛：掃描器要捉到口語，亦唔好誤殺書面「的／了」。
if '你哋' not in oral_hits('我好掛住你哋！') or '掛住' not in oral_hits('我好掛住你哋！'):
    errors.append('oral-scanner: must flag 你哋／掛住')
if oral_hits('我們的雨停了。'):
    errors.append('oral-scanner: must not flag written 的／了')
if oral_hits('這是系統關係。'):
    errors.append('oral-scanner: must not flag 係 inside 關係／系統')
HIDDEN_IDS={'park-kite','red-balloon','zhuhai-aquarium','chimelong-safari'}
if len(stories)!=24: errors.append(f'Expected 24 stories in catalog, found {len(stories)}')
playable=[story for story in stories if not story.get('hidden') and not story.get('retired')]
if len(playable)!=20: errors.append(f'Expected 20 playable stories, found {len(playable)}')
for hid in sorted(HIDDEN_IDS):
    story=next((item for item in stories if item.get('id')==hid), None)
    if not story: errors.append(f'missing retired story {hid}')
    elif not story.get('hidden') and not story.get('retired'): errors.append(f'{hid} must set hidden or retired so kids do not see it on the shelf')
if any(story.get('id') in HIDDEN_IDS for story in playable):
    errors.append('hidden/retired stories must not appear in the playable shelf list')
for story in stories:
    label=story.get('id','?')
    if len(story.get('pages',[])) not in range(6,9): errors.append(f'{label}: page count must be 6-8')
    zh_blob=' '.join([
        str(story.get('title','')),
        str(story.get('summary','')),
        ' '.join(story.get('extensionWords',[])),
        ' '.join(
            ' '.join([
                page.get('sentence',''),
                page.get('dialogue',{}).get('text',''),
                ' '.join(page.get('tiles',[])),
                ' '.join(page.get('focusWords',[])),
                ' '.join(page.get('learn',[])),
                ' '.join(page.get('distractors',[])),
            ])
            for page in story.get('pages',[])
        ),
    ])
    if re.search(r'(?i)\b(?:bb\s*)?spa\b', zh_blob) or 'Spa' in zh_blob or 'SPA' in zh_blob:
        errors.append(f'{label}: story Chinese fields must not use English Spa / BB Spa')
    if 'spa' in label.lower():
        errors.append(f'{label}: story id must not contain spa')
    scan_oral(label, 'title', story.get('title', ''))
    scan_oral(label, 'summary', story.get('summary', ''))
    scan_oral(label, 'extensionWords', story.get('extensionWords', []))
    if story.get('artNote'):
        scan_oral(label, 'artNote', story.get('artNote'))
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
        page_label=f'{label} page {i}'
        if norm(''.join(page.get('tiles',[])))!=norm(page.get('sentence','')): errors.append(f'{page_label}: tiles do not rebuild sentence')
        for word in page.get('learn',[]):
            if word not in allowed: errors.append(f'{page_label}: unclassified learning word {word}')
        focus=page.get('focusWords',[])
        expected_focus=3 if (label=='tianye-happy-day' and i==8) or (label=='sam-supermarket-zoo' and i==8) else 2
        if len(focus)!=expected_focus: errors.append(f'{page_label}: expected exactly {expected_focus} focus words')
        if page.get('learn',[])!=focus: errors.append(f'{page_label}: learn words must match focusWords in sentence order')
        if len(page.get('distractors',[]))<2: errors.append(f'{page_label}: expected at least two distractors')
        positions=[]
        for word in focus:
            if word not in allowed: errors.append(f'{page_label}: focus word {word} has no source classification')
            start=page.get('sentence','').find(word)
            if start<0: errors.append(f'{page_label}: focus word {word} is absent from sentence')
            elif page.get('sentence','').count(word)!=1: errors.append(f'{page_label}: focus word {word} must occur once for an unambiguous blank')
            else: positions.append((start,start+len(word),word))
        positions.sort()
        for previous,following in zip(positions,positions[1:]):
            if following[0]<previous[1]: errors.append(f'{page_label}: focus words overlap in sentence')
        if [word for _,_,word in positions] != focus:
            errors.append(f'{page_label}: focusWords must follow sentence order')
        if set(focus) & set(page.get('distractors',[])):
            errors.append(f'{page_label}: a distractor duplicates a focus word')
        if not page.get('sentence'): errors.append(f'{page_label}: missing sentence')
        elif not re.search(r'[。！？]$',page['sentence']) or re.search(r'[。！？].+[。！？]',page['sentence']): errors.append(f'{page_label}: story text must be one complete sentence')
        speech=page.get('dialogue',{})
        if speech.get('speaker') not in story.get('characters',[]): errors.append(f'{page_label}: dialogue speaker must be a listed story character')
        if not speech.get('text') or not re.search(r'[。！？]$',speech.get('text','')): errors.append(f'{page_label}: dialogue must be a complete punctuated sentence')
        scan_oral(page_label, 'sentence', page.get('sentence', ''))
        scan_oral(page_label, 'tiles', page.get('tiles', []))
        scan_oral(page_label, 'learn', page.get('learn', []))
        scan_oral(page_label, 'focusWords', page.get('focusWords', []))
        scan_oral(page_label, 'distractors', page.get('distractors', []))
        scan_oral(page_label, 'dialogue', speech.get('text', ''))
    for asset in [f'{label}-p{i:02}.webp' for i in range(1,len(story.get('pages',[]))+1)]:
        if not (ROOT/'assets/family-stories/scenes'/asset).exists(): errors.append(f'{label}: missing art {asset}')
    warmup=story.get('warmupPairs')
    focus_words={word for page in story.get('pages',[]) for word in page.get('focusWords',[])}
    if label=='zhongshan-happy-farm':
        if not warmup or len(warmup)!=3: errors.append(f'{label}: farm pilot must have exactly 3 warmupPairs')
    elif warmup:
        errors.append(f'{label}: warmupPairs is a farm-only pilot')
    if warmup:
        seen=set()
        for pair in warmup:
            word=str(pair.get('word') or '')
            image=str(pair.get('image') or '')
            if word not in focus_words: errors.append(f'{label}: warmup word {word} must be a page focusWord')
            if word in seen: errors.append(f'{label}: warmup word {word} is duplicated')
            seen.add(word)
            if not image.startswith(f'assets/family-stories/scenes/{label}-') or not (ROOT/image).exists():
                errors.append(f'{label}: warmup image for {word} must be an existing story scene')
if errors:
    print('\n'.join('FAIL: '+e for e in errors));sys.exit(1)
total_pages=sum(len(story.get('pages',[])) for story in stories)
print(f'PASS: {len(stories)} stories in catalog ({len(playable)} playable, {len(stories)-len(playable)} hidden); {total_pages} pages total (6-8 each); source words, classified learning words, answer tiles, written Chinese and art paths validated.')

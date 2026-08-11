#!/usr/bin/env python3
"""用故事內文抽到嘅實際生字，校準 3 本書嘅字詞表。"""
import re, sys
from pathlib import Path

p = Path('js/words.js')
src = p.read_text()
pairs = re.findall(r"id: '([^']+)',\s*term: '([^']+)'", src)
by_term = {t: i for i, t in pairs}

UPD = {
  'rb_yusan': ['雨傘','下雨','水','雲朵','太陽','大風','紅色','黃色','藍色','綠色','收','出','小','大','看見','聽見'],
  'rb_xiaoming': ['和','氣球','爸爸','送','一','個','帶','飛','天空','大','海','月亮','上','去','開心'],
  'ob_xiezi': ['鞋子','鞋櫃','脫','放','回','家','放學','對','大','小','爸爸','媽媽','姐姐','妹妹','哥哥','弟弟','多少','誰','在','裏面'],
}

def replace_book(src, bid, terms):
    ids = []
    for t in terms:
        wid = by_term.get(t)
        if not wid:
            raise SystemExit(f'未知詞 {t}（{bid}）')
        if wid not in ids:
            ids.append(wid)
    # 搵到該書物件，再換佢嘅 wordIds 陣列內容
    bre = re.compile(r"(id: '" + re.escape(bid) + r"',[\s\S]*?wordIds: \[)[^\]]*(\])", re.M)
    m = bre.search(src)
    if not m:
        raise SystemExit(f'搵唔到書 {bid}')
    inner = ' ' + ', '.join(f"'{x}'" for x in ids) + ' '
    return src[:m.end(1)] + inner + src[m.start(2):]

for bid, terms in UPD.items():
    src = replace_book(src, bid, terms)

p.write_text(src)
print('校準咗 3 本：', '、'.join(UPD.keys()))

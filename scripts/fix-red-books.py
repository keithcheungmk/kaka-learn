#!/usr/bin/env python3
"""修正紅輯書名（之前誤用藍輯書名）＋按書名主題分組；橙輯《鞋子》補字。"""
import re, sys
from pathlib import Path

p = Path('js/words.js')
src = p.read_text()

_pairs = re.findall(r"id: '([^']+)',\s*term: '([^']+)'", src)
by_term = {term: wid for (wid, term) in _pairs}
existing_ids = {wid for (wid, term) in _pairs}

# 新字（書名／故事透露）
NEW = [
  ('信','xin_letter','✉️','','#1a3050',False),
  ('分','fen_share','➗','','#3a3010',False),
  ('請','qing_invite','🙇','','#143828',False),
  ('贏','ying_win','🏆','','#3a3410',False),
  ('吹','chui_blow','💨','吹','#243848',False),
  ('黃葉','huangye','🍂','','#3a3010',False),
  ('束','shu_bunch','💐','束','#402038',False),
  # 橙輯《鞋子》故事入面有
  ('鞋櫃','xiegui','👟','櫃','#2a3548',False),
  ('對','dui_pair','👟👟','','#1a3050',True),
]

lines = []
for (t,i,e,b,pl,d) in NEW:
    if t in by_term:
        continue
    if i in existing_ids:
        print('ID COLLISION:', i); sys.exit(1)
    duo = ", emojiDuo: true" if d else ''
    lines.append(f"  {{ id: '{i}', term: '{t}', isDeer: false, emoji: '{e}'{duo}, badge: '{b}', plate: '{pl}' }},")
    by_term[t] = i
    existing_ids.add(i)

marker = "];\n\n/** 主題：先學再開考 */"
assert marker in src
src = src.replace(marker, "  // 紅橙輯書名透露嘅補充字\n" + "\n".join(lines) + "\n" + marker)

def ids_of(terms, book):
    out = []
    for t in terms:
        wid = by_term.get(t)
        if not wid:
            raise SystemExit(f'未知詞：{t}（{book}）')
        if wid not in out:
            out.append(wid)
    return out

# 紅輯正確 12 本（書店資料核實）。主題分組係推測，待字卡校準。
RED_BOOKS = [
  ('rb_qiqiu', '我的氣球呢？', '🎈', ['我','的','呢','氣球','找','在','哪裏','這裏','那裏','這','那','有','沒有','飛','哭','笑','紅色','高']),
  ('rb_anan', '貪吃的安安', '😋', ['吃','喝','白飯','麵條','麵包','雞蛋','牛奶','果汁','糖果','餅乾','蛋糕','甜','香','肚子','餓','牙齒','嘴巴','多','少','大']),
  ('rb_yusan', '雨傘', '☂️', ['雨傘','下雨','水','雲朵','太陽','大風','紅色','黃色','藍色','綠色','開','關','出','入','收','看見','聽見']),
  ('rb_xin', '信', '✉️', ['信','寫','讀','畫','紙','筆','給','你','爸爸','媽媽','愛','謝謝','想','說']),
  ('rb_fenguo', '分果果', '🍎', ['分','一','二','三','四','五','六','七','八','九','十','個','隻','把','多','少','大家','朋友','蘋果','橙子','西瓜']),
  ('rb_kuaipao', '快跑呀', '🏃', ['跑','走','跳','站','坐','快','慢','贏','追','來','去','回']),
  ('rb_shuijiao', '誰在叫', '📣', ['誰','叫','聽見','聲音','在','小狗','小貓','小鳥','小雞','小鴨','小蟲','青蛙']),
  ('rb_huangye', '黃葉', '🍂', ['黃葉','葉','樹','草','花','山','天空','星星','月亮','雪花','火']),
  ('rb_yishuhua', '一束花', '💐', ['束','花','漂亮','乖','心','寶寶','自己','抱','送','給','愛','媽媽']),
  ('rb_fengwan', '風跟我玩', '🌬️', ['風','玩','我','跑','笑','吹','飛','追','天空','高','開心']),
  ('rb_xiaoming', '小明和氣球', '🎈', ['和','氣球','爸爸','送','一','個','帶','飛','天空','大','海','月亮','去','開心']),
  ('rb_dongdong', '冬冬請客', '🍽️', ['請','客人','吃','喝','來','大家','朋友','我們','你們','他們','爺爺','嫲嫲','婆婆','公公','哥哥','姐姐','弟弟','妹妹','白飯','謝謝','開心']),
]

def book_js(bid, title, cover, terms):
    ids = ids_of(terms, title)
    ids_js = ", ".join(f"'{x}'" for x in ids)
    return (f"    {{ id: '{bid}', title: '{title}', cover: '{cover}',\n"
            f"      wordIds: [{ids_js}] }}")

red_books_js = "books: [\n" + ",\n".join(book_js(*b) for b in RED_BOOKS) + ",\n    ]"

# 換走紅輯現有 books 陣列
red_re = re.compile(r"(id: 'red_series',[\s\S]*?)books: \[[\s\S]*?\n    \]", re.M)
m = red_re.search(src)
assert m, 'red books block not found'
src = src[:m.start()] + m.group(1) + red_books_js + src[m.end():]

# 橙輯《鞋子》補「鞋櫃」「對」：先加入橙輯 wordIds，再入 ob_xiezi
def add_words_to_topic(src, topic_id, new_terms):
    # topic wordIds array
    tre = re.compile(r"(id: '" + topic_id + r"',[\s\S]*?wordIds: \[)([\s\S]*?)(\n    \])", re.M)
    m = tre.search(src)
    assert m, topic_id + ' wordIds not found'
    body = m.group(2)
    existing = set(body.replace("'", '').replace(',', ' ').split())
    add = [by_term[t] for t in new_terms if by_term[t] not in existing]
    if not add: return src
    add_js = ''.join(f"\n      '{x}'," for x in add)
    return src[:m.end(2)] + add_js + src[m.end(2):]

def add_words_to_book(src, book_id, new_terms):
    bre = re.compile(r"(id: '" + book_id + r"',[\s\S]*?wordIds: \[)([\s\S]*?)(\])", re.M)
    m = bre.search(src)
    assert m, book_id + ' book not found'
    body = m.group(2)
    existing = set(body.replace("'", '').replace(',', ' ').split())
    add = [by_term[t] for t in new_terms if by_term[t] not in existing]
    if not add: return src
    add_js = ''.join(f" '{x}'," for x in add)
    return src[:m.end(2)].rstrip() + (', ' if m.group(2).strip() else ' ') + ', '.join(f"'{x}'" for x in add) + ' ' + src[m.end(2):]

src = add_words_to_topic(src, 'orange_series', ['鞋櫃','對'])
src = add_words_to_book(src, 'ob_xiezi', ['鞋櫃','對'])

p.write_text(src)
print(f'紅輯改用正確書名，新增 {len(lines)} 個字；橙輯《鞋子》補 鞋櫃／對')

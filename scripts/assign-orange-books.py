#!/usr/bin/env python3
"""橙輯：將 181 詞按書名推測分組入 12 本書（用戶之後對字卡校準）。"""
import re, sys
from pathlib import Path

p = Path('js/words.js')
src = p.read_text()

_pairs = re.findall(r"id: '([^']+)',\s*term: '([^']+)'", src)
by_term = {term: wid for (wid, term) in _pairs}

BOOKS = [
  ('ob_fangzi', '我的房子', '🏠', ['房子','門口','花園','樓梯','電梯','主人','客人','鄰居','先生','太太','伯伯','叔叔','阿姨','掃','抹','搬','乾淨','骯髒']),
  ('ob_fei', '飛', '🕊️', ['跌倒','追','拋','接','白鴿','烏鴉','蝴蝶','蜜蜂','氣球','旗','輕','重','尖','圓','繩']),
  ('ob_dangao', '誰吃了蛋糕', '🎂', ['誰','蛋糕','味道','早餐','午餐','晚餐','點心','湯','粥','問題','答案','問','答','告訴','袋','盒','碟','方','樽','桶','盆','被']),
  ('ob_xiezi', '鞋子', '👟', ['鞋子','換','試','舒服','硬','軟','濕','乾','滑']),
  ('ob_huijia', '回家', '🏡', ['從','到','剛才','已經','正在','終於','突然','今晚','帶','送','收','旅行','野餐','放假']),
  ('ob_woxiang', '我想', '💭', ['如果','或者','幫忙','借','還','用','禮物','高興','快樂','難過','害怕','生氣','真','正','讓']),
  ('ob_chuanyi', '弟弟穿衣', '👕', ['學','教','拉','按','癢','蓋','推','摸','累']),
  ('ob_huamao', '花貓和青蛙', '🐱🐸', ['花貓','青蛙','捉','藏','叫','喊','聲音','靜','嘈','聞','鸚鵡','螞蟻']),
  ('ob_zuowan', '昨晚', '🌙', ['昨晚','以前','以後','夢','故事','圖畫','顏色','寫字','讀書','唱歌','畫畫','遊戲','辦法','主意','一邊']),
  ('ob_diyi', '第一個', '🥇', ['第一','第二','最後','開始','完結','先','之後','接着','然後','比','比賽','越來越','排隊','輪流','踢','打','拍','搖','小朋友','學生','上學','放學','上課','下課','運動']),
  ('ob_dengyixia', '等一下', '⏳', ['等','等一下','一直','常常','有時','一起','還是','但是','可是','因為','所以']),
  ('ob_feng', '風在哪裏？', '🌬️', ['風','中間','旁邊','對面','前','後','左','右','每','邊','幾','多少','這樣','那樣','指','雨傘']),
]

# 校驗：term 全部已知；每個橙輯 id 出現喺剛好一本書；聯集 = 橙輯 wordIds
orange_ids = set(re.search(r"id: 'orange_series',[\s\S]*?wordIds: \[([\s\S]*?)\]", src).group(1).replace("'", '').replace(',', ' ').split())

seen = {}
errors = []
for (bid, title, cover, terms) in BOOKS:
    for t in terms:
        wid = by_term.get(t)
        if not wid:
            errors.append(f'未知詞：{t}（{title}）')
            continue
        if wid in seen:
            errors.append(f'重複分組：{t}（{seen[wid]} 同 {title}）')
        seen[wid] = title
        if wid not in orange_ids:
            errors.append(f'唔喺橙輯：{t}（{title}）')

missing = orange_ids - set(seen)
for wid in missing:
    term = next((t for (i, t) in _pairs if i == wid), wid)
    errors.append(f'未分組：{term}（{wid}）')

if errors:
    print('\n'.join(errors))
    sys.exit(1)

# 生成 books JS
def book_js(bid, title, cover, terms):
    ids = [by_term[t] for t in terms]
    ids_js = ", ".join(f"'{x}'" for x in ids)
    return (f"    {{ id: '{bid}', title: '{title}', cover: '{cover}',\n"
            f"      wordIds: [{ids_js}] }}")

books_js = ",\n".join(book_js(*b) for b in BOOKS)
books_block = ",\n    books: [\n" + books_js + ",\n    ]"

# 插入橙輯 topic：喺其 wordIds `],` 之後、`},` 之前
anchor = re.compile(r"(id: 'orange_series',[\s\S]*?\n    \])", re.M)
m = anchor.search(src)
assert m, 'orange_series anchor not found'
src = src[:m.end(1)] + books_block + src[m.end(1):]

p.write_text(src)
total = sum(len(b[3]) for b in BOOKS)
print(f'12 本書分好，共 {total} 詞')

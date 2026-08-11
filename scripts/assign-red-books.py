#!/usr/bin/env python3
"""紅輯：加書名透露嘅新詞，再將全部詞按書名推測分組入 12 本書（待用戶字卡校準）。"""
import re, sys
from pathlib import Path

p = Path('js/words.js')
src = p.read_text()

_pairs = re.findall(r"id: '([^']+)',\s*term: '([^']+)'", src)
by_term = {term: wid for (wid, term) in _pairs}
existing_ids = {wid for (wid, term) in _pairs}

# 書名透露嘅新詞（誰／餓／蝸牛／上學／叔叔／夢 已存在於其他主題，可重用）
NEW = [
  ('肚子','duzi','🧍','肚','#3a2818',False),
  ('聖誕','shengdan','🎄','','#143828',False),
  ('聖誕公公','shengdan_gonggong','🎅','','#401018',False),
  ('夢想','mengxiang','💭🌟','','#2a1840',True),
  ('綿羊','mianyang','🐑','綿','#2a2a35',False),
  ('自行車','zixingche','🚲','','#143828',False),
]

lines = []
for (t,i,e,b,pl,d) in NEW:
    if t in by_term:
        continue
    if i in existing_ids:
        print('ID COLLISION:', i); sys.exit(1)
    duo = ", emojiDuo: true" if d else ''
    lines.append(f"  {{ id: '{i}', term: '{t}', isDeer: false, emoji: '{e}'{duo}, badge: '{b}', plate: '{pl}' }},")

marker = "];\n\n/** 主題：先學再開考 */"
assert marker in src
src = src.replace(marker, "  // 紅輯補充（書名透露嘅字）\n" + "\n".join(lines) + "\n" + marker)

for (t,i,*_ ) in NEW:
    if t not in by_term:
        by_term[t] = i

BOOKS = [
  ('rb_shengri', '生日禮物', '🎂', ['生日','蛋糕','糖果','餅乾','謝謝','愛','給','開心','好','香','甜','新','舊','拿','放','開','關','要','想','個','把','隻','玩具','球','公仔','爸爸','媽媽','一','二','三','四','五','六','七','八','九','十']),
  ('rb_xiayu', '下雨了', '🌧️', ['下雨','雲朵','太陽','大風','雪花','水','聽見','看見','出','入','街','跑','跳','熱','冷']),
  ('rb_feiji', '小飛機', '✈️', ['飛機','飛','天空','星星','月亮','高','矮','快','慢','長','短','游','爬','山','火','大']),
  ('rb_bushui', '我不要睡', '😴', ['我','不','睡','睡覺','晚上','晚安','床','醒','洗','穿','脫','抱','哭','笑','玩','要?','寶寶','自己','頭','臉','手','腳','手指','頭髮','衣服','燈','家']),
  ('rb_shizi', '獅子的肚子餓了', '🦁', ['白飯','麵條','麵包','雞蛋','牛奶','果汁','肚子','餓','牙齒','嘴巴','鼻子','吃','喝','都','的','了','杯子']),
  ('rb_shuilai', '是誰來了？', '🚪', ['是','誰','來','去','回','門','窗戶','大家','朋友','你','他','她','我們','你們','他們','眼睛','耳朵','說','今天','明天','現在']),
  ('rb_woniu', '小蝸牛上學', '🐌', ['小','蝸牛','上學','學校','老師','同學','書包','書本','筆','紙','讀','寫','畫','唱','坐','站','走','椅子','早上','下午','早晨','褲子','鞋子','襪子','帽子']),
  ('rb_zainali', '在哪裏？', '🔍', ['哪裏','這裏','那裏','哪','這','那','找','在','有','沒有','呢','嗎','什麼']),
  ('rb_shengdangong', '聖誕公公是怎樣來的？', '🎅', ['聖誕','聖誕公公','公公','爺爺','嫲嫲','婆婆','哥哥','姐姐','弟弟','妹妹','為什麼','怎麼','年','月','日','星期','昨天']),
  ('rb_mengxiang', '我的夢想', '💭', ['夢','夢想','心','會','可以','很','乖','漂亮']),
  ('rb_mianyang', '綿羊叔叔', '🐑', ['綿羊','叔叔','小羊','小牛','小馬','小豬','小雞','小鴨','小狗','小貓','小魚','小鳥','兔子','小蟲','草','樹','花']),
  ('rb_qiche', '汽車和自行車', '🚗', ['汽車','自行車','輪船','商場','公園','和','又','再','也','壞','多','少']),
]

# 「要?」係占位——要同想都喺 B1；呢度淨係想
BOOKS[3] = ('rb_bushui', '我不要睡', '😴', ['我','不','睡','睡覺','晚上','晚安','床','醒','洗','穿','脫','抱','哭','笑','玩','寶寶','自己','頭','臉','手','腳','手指','頭髮','衣服','燈','家'])

red_ids = set(re.search(r"id: 'red_series',[\s\S]*?wordIds: \[([\s\S]*?)\]", src).group(1).replace("'", '').replace(',', ' ').split())

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

# 紅輯 wordIds 要包含所有書詞（書可以收紅輯以外已有詞，例如誰／餓／蝸牛／上學／叔叔／夢）
extra_in_books = set(seen) - red_ids
missing = red_ids - set(seen)
for wid in missing:
    term = next((t for (i, t) in _pairs if i == wid), wid)
    errors.append(f'未分組：{term}（{wid}）')
if errors:
    print('\n'.join(errors))
    sys.exit(1)

# 將書入面先喺其他主題嘅詞加埋入紅輯 wordIds（等「全部紅輯」都涵蓋）
def book_js(bid, title, cover, terms):
    ids = [by_term[t] for t in terms]
    ids_js = ", ".join(f"'{x}'" for x in ids)
    return (f"    {{ id: '{bid}', title: '{title}', cover: '{cover}',\n"
            f"      wordIds: [{ids_js}] }}")

books_js = ",\n".join(book_js(*b) for b in BOOKS)
books_block = ",\n    books: [\n" + books_js + ",\n    ]"

anchor = re.compile(r"(id: 'red_series',[\s\S]*?\n    \])", re.M)
m = anchor.search(src)
assert m, 'red_series anchor not found'
src = src[:m.end(1)] + books_block + src[m.end(1):]

p.write_text(src)
total = sum(len(b[3]) for b in BOOKS)
print(f'12 本書分好，共 {total} 詞（新增字詞 {len(lines)} 個；書內重用其他主題 {len(extra_in_books)} 個）')

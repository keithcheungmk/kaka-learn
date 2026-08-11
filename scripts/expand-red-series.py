#!/usr/bin/env python3
"""擴充紅輯：重用已有詞形，新增書本詞形，重寫 red_series wordIds。"""
import re, sys
from pathlib import Path

p = Path('js/words.js')
src = p.read_text()

# 現有 term -> id
_pairs = re.findall(r"id: '([^']+)',\s*term: '([^']+)'", src)
existing = {term: wid for (wid, term) in _pairs}
existing_ids = {wid for (wid, term) in _pairs}

# (term, id, emoji, badge, plate, duo) — 只列要新增嘅；已有詞形由 existing map 重用
NEW = [
  # A 人稱・稱呼
  ('我們','women','👨‍👩‍👧‍👦','','#102848',False),
  ('你們','nimen','🧑‍🤝‍🧑','','#2a3548',False),
  ('他們','tamen','👥','','#1a3050',False),
  ('嫲嫲','maamaa','👵','嫲','#402038',False),
  ('公公','gonggong','👴','公','#2a3548',False),
  ('同學','tongxue','🧑‍🎓','','#102848',False),
  ('大家','dajia','👨‍👩‍👧‍👦','','#143828',False),
  ('自己','ziji','🪞','','#2a1840',False),
  # B 動作
  ('看見','kanjian','👀','','#2a1840',False),
  ('聽見','tingjian','👂','','#3a2818',False),
  ('讀','du','📖','','#1a3050',False),
  ('寫','xie','✍️','','#2a3548',False),
  ('畫','hua_draw','🎨','','#402038',False),
  ('唱','chang_sing','🎤','','#2a1840',False),
  ('回','hui','🔙','','#143828',False),
  ('出','chu','📤','','#3a3010',False),
  ('入','ru','📥','','#102848',False),
  ('站','zhan','🧍','','#2a2a35',False),
  ('跳','tiao','🤸','','#143820',False),
  ('飛','fei','🕊️','','#1a3050',False),
  ('游','you_swim','🏊','','#0f3550',False),
  ('爬','pa','🧗','','#3a2818',False),
  ('喝','he_drink','🥤','','#402410',False),
  ('睡','shui_sleep','😴','','#1a2a4a',False),
  ('醒','xing','⏰','','#3a3010',False),
  ('洗','xi','🛁','','#0f3550',False),
  ('穿','chuan_wear','👕','穿','#3a3010',False),
  ('脫','tuo','👕','脫','#402030',False),
  ('開','kai','🔓','','#143828',False),
  ('關','guan','🔒','','#401018',False),
  ('拿','na_take','🫴','','#3a2818',False),
  ('放','fang','🫳','','#2a3548',False),
  ('笑','xiao_laugh','😄','','#3a3410',False),
  ('哭','ku','😢','','#102848',False),
  ('抱','bao_hug','🤗','','#402038',False),
  ('想','xiang_think','💭','','#2a1840',False),
  ('要','yao_want','🙋','','#3a3010',False),
  # C 形容詞・感覺
  ('壞','huai','👎','','#401018',False),
  ('快','kuai','⚡','','#3a3410',False),
  ('慢','man','🐢','','#143828',False),
  ('新','xin_new','✨','','#3a3010',False),
  ('舊','jiu_old','🕰️','','#2a2a35',False),
  ('甜','tian','🍬','','#402038',False),
  ('乖','guai','😇','','#143828',False),
  ('漂亮','piaoliang','🌺','','#402038',False),
  # D 虛詞・功能字
  ('的','de','📌','','#2a3548',False),
  ('了','le','✅','','#143828',False),
  ('嗎','ma_q','❓','','#102848',False),
  ('呢','ne','❔','','#2a2a35',False),
  ('和','he_and','➕','','#3a3010',False),
  ('都','dou','💯','','#401820',False),
  ('也','ye_also','✌️','','#143820',False),
  ('又','you_again','🔁','','#2a1840',False),
  ('再','zai_again','🔂','','#1a3050',False),
  ('很','hen','🆙','','#3a3010',False),
  ('沒有','meiyou','🚫','','#401018',False),
  ('會','hui_can','💪','','#143828',False),
  ('可以','keyi','👍','','#143820',False),
  ('哪','na_which','❓','哪','#102848',False),
  ('什麼','shenme','🤔','','#2a3548',False),
  ('為什麼','weishenme','🤷','','#401820',False),
  ('怎麼','zenme','🧐','','#2a2a35',False),
  ('這裏','zheli','📍👇','','#1a3050',True),
  ('那裏','nali','📍👉','','#2a2a35',True),
  ('哪裏','nali_where','📍❓','','#102848',True),
  ('個','ge_mw','1️⃣','個','#1a3050',False),
  ('隻','zhi_mw','🐾','','#3a2818',False),
  ('把','ba_mw','🖐️','','#3a3010',False),
  # F 時間
  ('今天','jintian','📅','','#102848',False),
  ('昨天','zuotian','⏪','','#2a2a35',False),
  ('明天','mingtian','⏩','','#1a3050',False),
  ('早上','zaoshang','🌅','','#3a3410',False),
  ('下午','xiawu','🌞','','#402410',False),
  ('晚上','wanshang','🌃','','#1a2a4a',False),
  ('現在','xianzai','▶️','','#143828',False),
  ('年','nian','🎊','','#401820',False),
  ('月','yue_month','🗓️','','#102848',False),
  ('日','ri_day','📆','','#3a3010',False),
  ('星期','xingqi','7️⃣','','#2a1840',False),
  ('生日','shengri','🎉','','#401018',False),
  # G 自然
  ('山','shan_mountain','⛰️','','#2a3548',False),
  # H 身體
  ('臉','lian','🙂','','#3a2818',False),
  ('牙齒','yachi','🦷','','#2a3548',False),
  ('手指','shouzhi','☝️','','#3a3010',False),
  ('頭髮','toufa','💇','','#402038',False),
  # I 物件・屋企
  ('筆','bi_pen','🖊️','','#3a3010',False),
  ('紙','zhi_paper','📄','','#2a3548',False),
  ('玩具','wanju','🪀','','#402038',False),
  ('球','qiu_ball','🏀','','#3a3010',False),
  ('公仔','gongzai','🪆','','#402038',False),
  ('衣服','yifu','👔','','#102848',False),
  ('褲子','kuzi','👖','','#102848',False),
  ('鞋子','xiezi','👟','','#2a3548',False),
  ('襪子','wazi','🧦','','#401820',False),
  ('帽子','maozi','🧢','','#1a3050',False),
  # J 食物
  ('麵條','miantiao','🍜','','#3a3010',False),
  ('雞蛋','jidan','🥚','','#3a3a45',False),
  # K 動物（書用小X式）
  ('小狗','xiaogou','🐶','','#3a3010',False),
  ('小貓','xiaomao','🐱','','#4a2030',False),
  ('小魚','xiaoyu','🐟','','#0f3550',False),
  ('小鳥','xiaoniao','🐦','','#1a3050',False),
  ('小雞','xiaoji','🐤','','#402020',False),
  ('小鴨','xiaoya','🐥','','#143828',False),
  ('小馬','xiaoma','🐴','','#2a2520',False),
  ('小牛','xiaoniu','🐮','','#3a3010',False),
  ('小羊','xiaoyang','🐑','','#2a2a35',False),
  ('小豬','xiaozhu','🐷','','#402030',False),
  ('小蟲','xiaochong','🐛','','#2a3810',False),
  # L 地方・其他
  ('家','jia','🏠','','#1a3050',False),
  ('街','jie','🏘️','','#2a3548',False),
  ('早晨','zaochen','👋🌅','','#3a3410',True),
  ('晚安','wanan','🌙😴','','#1a2a4a',True),
]

# 紅輯最終詞序（按分類；term -> id 用 existing 或 NEW）
RED_TERMS = [
 # A
 '我','你','他','她','我們','你們','他們','爸爸','媽媽','爺爺','嫲嫲','婆婆','公公','哥哥','姐姐','弟弟','妹妹','寶寶','朋友','同學','老師','大家','自己',
 # B
 '看見','聽見','說','讀','寫','畫','唱','來','去','回','出','入','坐','站','走','跑','跳','飛','游','爬','吃','喝','睡','醒','洗','穿','脫','開','關','拿','放','找','給','玩','笑','哭','抱','想','要',
 # C
 '大','小','多','少','好','壞','高','矮','長','短','快','慢','新','舊','香','甜','熱','冷','開心','乖','漂亮',
 # D
 '的','了','嗎','呢','和','都','也','又','再','很','是','不','沒有','有','在','會','可以','這','那','哪','什麼','為什麼','怎麼','這裏','那裏','哪裏','個','隻','把',
 # E
 '一','二','三','四','五','六','七','八','九','十',
 # F
 '今天','昨天','明天','早上','下午','晚上','現在','年','月','日','星期','生日',
 # G
 '天空','太陽','月亮','星星','雲朵','下雨','大風','雪花','山','水','火','樹','花','草',
 # H
 '頭','臉','眼睛','耳朵','鼻子','嘴巴','牙齒','手','腳','手指','頭髮','心',
 # I
 '書本','筆','紙','書包','玩具','球','公仔','衣服','褲子','鞋子','襪子','帽子','門','窗戶','床','椅子','燈','杯子',
 # J（水喺 G 自然已收，呢度唔重複）
 '白飯','麵條','麵包','雞蛋','牛奶','果汁','糖果','餅乾','蛋糕',
 # K
 '小狗','小貓','小魚','小鳥','兔子','小雞','小鴨','小馬','小牛','小羊','小豬','小蟲',
 # L
 '家','學校','公園','街','商場','汽車','輪船','飛機','謝謝','睡覺','愛','早晨','晚安',
]

new_by_term = {t:(i,e,b,pl,d) for (t,i,e,b,pl,d) in NEW}

lines = []
for (t,i,e,b,pl,d) in NEW:
    if t in existing:
        print('SKIP existing term:', t)
        continue
    if i in existing_ids:
        print('ID COLLISION:', i); sys.exit(1)
    duo = ", emojiDuo: true" if d else ''
    lines.append(f"  {{ id: '{i}', term: '{t}', isDeer: false, emoji: '{e}'{duo}, badge: '{b}', plate: '{pl}' }},")

# 插喺 WORDS 結尾「];」之前
marker = "];\n\n/** 主題：先學再開考 */"
assert marker in src, 'WORDS end marker not found'
block = "  // 紅輯擴充（對齊《我自己會讀》紅輯溫習字表）\n" + "\n".join(lines) + "\n"
src = src.replace(marker, block + marker)

# term -> id 最終對照
def tid(term):
    if term in existing: return existing[term]
    if term in new_by_term: return new_by_term[term][0]
    raise SystemExit('NO ID for term: ' + term)

ids = [tid(t) for t in RED_TERMS]
print('紅輯詞數:', len(ids), ' 新增詞數:', len(lines))

# 重寫 red_series wordIds
topic_re = re.compile(r"(id: 'red_series',[\s\S]*?wordIds: \[)[\s\S]*?(\n    \],)")
m = topic_re.search(src)
assert m, 'red_series not found'
ids_js = "\n      " + ", ".join(f"'{x}'" for x in ids) + ","
src = topic_re.sub(lambda mm: mm.group(1) + ids_js + mm.group(2), src, count=1)

# blurb 更新
src = src.replace("blurb: '對齊《我自己會讀》紅輯：高頻字溫習（第一批）',",
                  "blurb: '對齊《我自己會讀》紅輯：讀完書考吓佢',")

p.write_text(src)
print('done')

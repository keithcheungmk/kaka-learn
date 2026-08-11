#!/usr/bin/env python3
"""新增橙輯：重用已有詞形，新增 Level 2 書本詞，插入 orange_series 主題。"""
import re, sys
from pathlib import Path

p = Path('js/words.js')
src = p.read_text()

_pairs = re.findall(r"id: '([^']+)',\s*term: '([^']+)'", src)
existing = {term: wid for (wid, term) in _pairs}
existing_ids = {wid for (wid, term) in _pairs}

# (term, id, emoji, badge, plate, duo)
NEW = [
  # A 人物・關係
  ('小朋友','xiaopengyou','🧒','','#3a3010',False),
  ('學生','xuesheng','🎒','','#102848',False),
  ('先生','xiansheng','👨','','#1a3050',False),
  ('太太','taitai','👩','','#402038',False),
  ('伯伯','bobo','👨‍🦳','','#2a3548',False),
  ('叔叔','shushu','👨‍🦱','','#1a3050',False),
  ('阿姨','ayi','👩‍🦰','','#402038',False),
  ('主人','zhuren','🤵','','#2a2a35',False),
  ('客人','keren','🧳','','#3a2818',False),
  ('鄰居','linju','🏠🏠','','#1a3050',True),
  # B 動作進階
  ('幫忙','bangmang','🤝','','#143828',False),
  ('問','wen','❓🗣️','','#102848',True),
  ('答','da','✅🗣️','','#143820',True),
  ('告訴','gaosu','🗯️','','#2a3548',False),
  ('叫','jiao_call','📣','','#401820',False),
  ('帶','dai','🎒','帶','#3a3010',False),
  ('追','zhui','🏃💨','','#402010',True),
  ('捉','zhuo','👐','','#143828',False),
  ('藏','cang','🙈','','#2a2a35',False),
  ('跌倒','diedao','💫','','#401018',False),
  ('喊','han','📢','','#401820',False),
  ('送','song','🎁','','#2a1840',False),
  ('收','shou_collect','🧺','','#3a3010',False),
  ('借','jie_borrow','🤲','','#143828',False),
  ('還','huan','↩️','','#102848',False),
  ('用','yong','🔧','','#2a3548',False),
  ('試','shi_try','🎯','','#3a3010',False),
  ('學','xue_learn','📚','','#102848',False),
  ('教','jiao_teach','🧑‍🏫','','#1a3050',False),
  ('換','huan_change','🔄','','#2a3548',False),
  ('掃','sao','🧹','','#3a2818',False),
  ('抹','mo','🧽','','#0f3550',False),
  ('蓋','gai','🛏️','蓋','#1a2a4a',False),
  ('搬','ban','📦','','#3a3010',False),
  ('推','tui','🛒','','#2a3548',False),
  ('拉','la','🪢','','#401820',False),
  ('拋','pao_throw','🤾','','#143820',False),
  ('接','jie_catch','🙌','','#143828',False),
  ('踢','ti','🦵','','#402010',False),
  ('打','da_hit','👊','','#401018',False),
  ('拍','pai','👏','','#3a3010',False),
  ('搖','yao_shake','🪇','','#402038',False),
  ('按','an','🔘','','#102848',False),
  ('指','zhi_point','👆','','#2a3548',False),
  ('摸','mo_touch','🤚','','#3a2818',False),
  ('聞','wen_smell','👃','聞','#402038',False),
  # C 形容詞・感覺進階
  ('高興','gaoxing','😁','','#3a3410',False),
  ('快樂','kuaile','🥳','','#402038',False),
  ('難過','nanguo','😔','','#1a3050',False),
  ('舒服','shufu','😌','','#143828',False),
  ('癢','yang_itch','🪶','','#402038',False),
  ('滑','hua_slide','🛝','','#0f3550',False),
  ('硬','ying','🪨','','#2a2a35',False),
  ('軟','ruan','🍮','','#402410',False),
  ('輕','qing','🎈','','#102848',False),
  ('重','zhong','🏋️','','#2a3548',False),
  ('乾淨','ganjing','🧼','','#0f3550',False),
  ('骯髒','angzang','🗑️','','#2a2a35',False),
  ('濕','shi_wet','💦','','#0f3550',False),
  ('乾','gan_dry','🌵','','#3a3410',False),
  ('尖','jian','🔺','','#401018',False),
  ('圓','yuan','⭕','','#143828',False),
  ('方','fang_shape','🔲','','#2a3548',False),
  ('靜','jing_quiet','🤫','','#1a2a4a',False),
  ('嘈','cao_noise','🔊','','#401820',False),
  # D 連接・虛詞進階
  ('因為','yinwei','🔗','','#102848',False),
  ('所以','suoyi','☑️','','#143828',False),
  ('但是','danshi','🚧','','#3a3010',False),
  ('可是','keshi_but','😕','','#2a3548',False),
  ('然後','ranhou','⏭️','','#1a3050',False),
  ('接着','jiezhe','🔜','','#102848',False),
  ('先','xian_first','🥇','','#3a3410',False),
  ('之後','zhihou','🕒','後','#2a2a35',False),
  ('以前','yiqian','📜','','#3a2818',False),
  ('以後','yihou','🔮','','#2a1840',False),
  ('剛才','gangcai','⏱️','','#1a3050',False),
  ('已經','yijing','🆗','','#143828',False),
  ('正在','zhengzai','🎬','','#401820',False),
  ('常常','changchang','🕛','常','#102848',False),
  ('有時','youshi','🌗','','#2a2a35',False),
  ('一起','yiqi','👨‍👩‍👧','','#402038',False),
  ('終於','zhongyu','🏁','','#143820',False),
  ('突然','turan','💥','','#401018',False),
  ('如果','ruguo','🎲','','#281840',False),
  ('或者','huozhe','🔀','','#2a3548',False),
  ('還是','haishi','⚖️','','#102848',False),
  ('被','bei','🛡️','被','#2a2a35',False),
  ('讓','rang','👌','','#143828',False),
  ('從','cong','👣','','#3a3010',False),
  ('到','dao','🛬','','#1a3050',False),
  ('比','bi_compare','🆚','','#401820',False),
  ('越來越','yuelaiyue','📈','','#143828',False),
  ('一邊','yibian','↔️','','#102848',False),
  # E 時間・次序
  ('第一','diyi','🥇','','#3a3410',False),
  ('第二','dier','🥈','','#2a3548',False),
  ('最後','zuihou','🔚','','#401018',False),
  ('開始','kaishi','🟢','','#143828',False),
  ('完結','wanjie','🔴','','#401018',False),
  ('等','deng_wait','⏳','','#1a3050',False),
  ('等一下','dengyixia','✋⏳','','#102848',True),
  ('一直','yizhi','♾️','','#2a1840',False),
  ('排隊','paidui','👥','隊','#2a3548',False),
  ('輪流','lunliu','🔄','','#143820',False),
  ('昨晚','zuowan','🌙⏪','','#1a2a4a',True),
  ('今晚','jinwan','🌙📅','','#1a2a4a',True),
  # F 家居・物件進階
  ('房子','fangzi','🏡','','#1a3050',False),
  ('門口','menkou','🚪','口','#2a3548',False),
  ('花園','huayuan','🌻','','#143820',False),
  ('樓梯','louti','🪜','','#3a2818',False),
  ('電梯','dianti','🛗','','#102848',False),
  ('袋','dai_bag','👜','','#402038',False),
  ('盒','he_box','📦','','#3a3010',False),
  ('樽','zun','🍾','','#143828',False),
  ('桶','tong_bucket','🪣','','#2a3548',False),
  ('盆','pen','🥣','盆','#3a3010',False),
  ('碟','die','🍽️','碟','#401820',False),
  ('雨傘','yusan','☂️','','#0f3550',False),
  ('禮物','liwu','🎀','','#401018',False),
  ('氣球','qiqiu','🎈','球','#3a3010',False),
  ('旗','qi_flag','🚩','','#401820',False),
  ('繩','sheng_rope','🧵','','#2a2a35',False),
  # G 食物進階
  ('早餐','zaocan','🍳','','#3a3410',False),
  ('午餐','wucan','🍱','','#402410',False),
  ('晚餐','wancan','🌆🍽️','','#1a2a4a',True),
  ('點心','dianxin','🧁','','#402038',False),
  ('湯','tang','🥣','湯','#3a3010',False),
  ('粥','zhou','🥣','粥','#3a3410',False),
  # H 動物進階
  ('花貓','huamao','🐈','花','#4a2030',False),
  ('烏鴉','wuya','🐦‍⬛','','#1a1a22',False),
  ('白鴿','baige','🕊️','鴿','#2a3548',False),
  ('鸚鵡','yingwu','🦜','','#143828',False),
  # I 學校・活動
  ('上學','shangxue','🎒🏫','','#102848',True),
  ('放學','fangxue','🏫🏠','','#1a3050',True),
  ('上課','shangke','📖','課','#102848',False),
  ('下課','xiake','🔔','','#3a3410',False),
  ('寫字','xiezi_write','✍️','字','#2a3548',False),
  ('讀書','dushu','📖','書','#1a3050',False),
  ('唱歌','changge','🎵🎤','','#2a1840',True),
  ('畫畫','huahua','🖍️','','#402038',False),
  ('遊戲','youxi','🧩','','#281840',False),
  ('比賽','bisai','🏆','','#3a3410',False),
  ('運動','yundong','🏃','動','#143828',False),
  ('旅行','lvxing','🗺️','','#0f3550',False),
  ('野餐','yecan','🌳🧺','','#143820',True),
  ('放假','fangjia','🏖️','假','#3a3010',False),
  # J 故事常用
  ('故事','gushi','🦄','','#2a1840',False),
  ('問題','wenti','❓','題','#102848',False),
  ('答案','daan','💡','','#3a3410',False),
  ('辦法','banfa','🗝️','','#2a3548',False),
  ('主意','zhuyi','🧠','','#402038',False),
  ('聲音','shengyin','🎶','','#2a1840',False),
  ('味道','weidao','👅','','#401820',False),
  ('顏色','yanse','🌈','色','#402038',False),
  ('圖畫','tuhua','🖼️','','#3a3010',False),
  ('夢','meng','🌙','夢','#1a2a4a',False),
  # K 位置
  ('中間','zhongjian','👉👈','','#102848',True),
  ('旁邊','pangbian','👫','旁','#2a3548',False),
  ('對面','duimian','🏙️','對','#1a3050',False),
  # L 其他常用
  ('誰','shui_who','🕵️','','#102848',False),
  ('風','feng_wind','🌬️','','#243848',False),
  ('這樣','zheyang','👉','樣','#3a3010',False),
  ('那樣','nayang','👈','樣','#2a2a35',False),
  ('真','zhen','💎','','#143828',False),
  ('正','zheng','❗','','#401820',False),
  ('幾','ji_howmany','🤏','','#102848',False),
  ('多少','duoshao','🧮','','#2a3548',False),
  ('邊','bian','📐','','#1a3050',False),
  ('每','mei','🌍','每','#143828',False),
]

ORANGE_TERMS = [
 # A
 '小朋友','學生','先生','太太','伯伯','叔叔','阿姨','主人','客人','鄰居',
 # B
 '幫忙','問','答','告訴','叫','帶','追','捉','藏','跌倒','喊','送','收','借','還','用','試','學','教','換','掃','抹','蓋','搬','推','拉','拋','接','踢','打','拍','搖','按','指','摸','聞',
 # C
 '高興','快樂','難過','害怕','生氣','舒服','癢','滑','硬','軟','輕','重','乾淨','骯髒','濕','乾','尖','圓','方','靜','嘈','累',
 # D
 '因為','所以','但是','可是','然後','接着','先','之後','以前','以後','剛才','已經','正在','常常','有時','一起','終於','突然','如果','或者','還是','被','讓','從','到','比','越來越','一邊',
 # E
 '第一','第二','最後','開始','完結','等','等一下','一直','排隊','輪流','昨晚','今晚',
 # F
 '房子','門口','花園','樓梯','電梯','袋','盒','樽','桶','盆','碟','雨傘','禮物','氣球','旗','繩',
 # G
 '早餐','午餐','晚餐','點心','湯','粥',
 # H
 '花貓','烏鴉','白鴿','鸚鵡','蝴蝶','蜜蜂','螞蟻','青蛙',
 # I
 '上學','放學','上課','下課','寫字','讀書','唱歌','畫畫','遊戲','比賽','運動','旅行','野餐','放假',
 # J
 '故事','問題','答案','辦法','主意','聲音','味道','顏色','圖畫','夢',
 # K
 '前','後','左','右','中間','旁邊','對面',
 # L
 '誰','風','這樣','那樣','真','正','幾','多少','邊','每','蛋糕','鞋子',
]

new_by_term = {t:(i,e,b,pl,d) for (t,i,e,b,pl,d) in NEW}

lines = []
for (t,i,e,b,pl,d) in NEW:
    if t in existing:
        continue
    if i in existing_ids:
        print('ID COLLISION:', i); sys.exit(1)
    duo = ", emojiDuo: true" if d else ''
    lines.append(f"  {{ id: '{i}', term: '{t}', isDeer: false, emoji: '{e}'{duo}, badge: '{b}', plate: '{pl}' }},")

marker = "];\n\n/** 主題：先學再開考 */"
assert marker in src, 'WORDS end marker not found'
block = "  // 橙輯（對齊《我自己會讀》橙輯溫習字表）\n" + "\n".join(lines) + "\n"
src = src.replace(marker, block + marker)

def tid(term):
    if term in existing: return existing[term]
    if term in new_by_term: return new_by_term[term][0]
    raise SystemExit('NO ID for term: ' + term)

ids = []
seen = set()
for t in ORANGE_TERMS:
    wid = tid(t)
    if wid in seen:
        raise SystemExit('DUP in topic: ' + t + ' -> ' + wid)
    seen.add(wid)
    ids.append(wid)
print('橙輯詞數:', len(ids), ' 新增詞數:', len(lines))

ids_js = "\n      " + ", ".join(f"'{x}'" for x in ids) + ","
topic_block = """  {
    id: 'orange_series',
    title: '橙輯',
    blurb: '對齊《我自己會讀》橙輯：讀完書考吓佢',
    cover: '📙',
    wordIds: [""" + ids_js + """
    ],
  },
"""

anchor = "  {\n    id: 'numbers',"
assert anchor in src, 'numbers anchor not found'
src = src.replace(anchor, topic_block + anchor, 1)

p.write_text(src)
print('done')

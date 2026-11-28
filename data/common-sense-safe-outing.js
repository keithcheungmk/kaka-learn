/** 卡卡常識樂園 · 安全出街 */
window.COMMON_SENSE_PACKS = window.COMMON_SENSE_PACKS || {};
window.COMMON_SENSE_PACKS["safe-outing"] = {
  "packId": "safe-outing",
  "topicId": "common-sense",
  "coinMode": "common-sense-safe",
  "title": "安全出街",
  "roundSize": 10,
  "goal": "出街識保護自己同屋企人",
  "intro": "卡卡返崇真幼稚園要去深水埗。過馬路牽大人手，識紅綠燈同保護自己。撳卡可以聽一聽。",
  "cover": "assets/common-sense/scenes/red-light.webp",
  "wrongHint": "唔係呢個喎，再諗吓同大人出街應該點保護自己？",
  "items": [
    {
      "id": "red-light",
      "name": "紅燈停一停",
      "image": "assets/common-sense/scenes/red-light.webp",
      "wallLine": "紅燈——停低，牽住大人手",
      "ask": "卡卡同大人返深水埗，見到紅燈應該點？",
      "correct": "停低等綠燈，牽住大人手",
      "wrong": [
        "自己衝過馬路快啲走",
        "跟唔識嘅人一齊過",
        "喺馬路中間玩波仔"
      ],
      "audio": "返學去深水埗，見到紅燈要停低，牽住大人手等綠燈，先至過馬路。"
    },
    {
      "id": "green-light",
      "name": "綠燈先過",
      "image": "assets/common-sense/scenes/green-light.webp",
      "wallLine": "綠燈——睇清楚先過，唔好跑",
      "ask": "綠燈亮咗，過馬路應該點？",
      "correct": "睇清楚先過，唔好跑步",
      "wrong": [
        "聽到綠燈就即刻衝",
        "喺馬路中間停低玩",
        "唔牽大人自己跑過"
      ],
      "audio": "綠燈亮咗都要睇清楚左右，牽住大人慢慢過，唔好跑步。"
    },
    {
      "id": "stranger-candy",
      "name": "唔跟陌生人",
      "image": "assets/common-sense/scenes/stranger-candy.webp",
      "wallLine": "陌生人請食糖——唔好跟，同大人講",
      "ask": "出街有唔識嘅人請卡卡食糖，應該點？",
      "correct": "唔好跟，快啲同大人講",
      "wrong": [
        "跟佢去拎多啲糖果",
        "自己行開都唔出聲",
        "上車去佢屋企裏面玩"
      ],
      "audio": "有唔識嘅人請你食糖或者一齊走，記住唔好跟，快啲同身邊大人講。"
    },
    {
      "id": "mall-help",
      "name": "商場搵職員",
      "image": "assets/common-sense/scenes/mall-help.webp",
      "wallLine": "商場唔見大人——搵穿制服職員",
      "ask": "商場裏面暫時唔見爸媽，卡卡應該搵邊個？",
      "correct": "搵穿制服職員或者警察",
      "wrong": [
        "跟任何笑住嘅人走",
        "自己去街口坐車走",
        "匿埋喺貨架後面等"
      ],
      "audio": "商場唔見大人唔使驚，企定定搵穿制服嘅職員或者警察幫忙。"
    },
    {
      "id": "fire-alarm",
      "name": "火警跟大人",
      "image": "assets/common-sense/scenes/fire-alarm.webp",
      "wallLine": "聽到火警鐘——跟大人快啲離開",
      "ask": "學校或者商場聽到火警鐘，應該點？",
      "correct": "跟大人快啲安全離開",
      "wrong": [
        "返轉頭攞玩具先走",
        "自己去睇下火大唔大",
        "匿喺廁所等到鐘停"
      ],
      "audio": "聽到火警鐘，跟住老師或者大人用安全路離開，唔好返轉頭攞嘢。"
    },
    {
      "id": "lift-door",
      "name": "唔玩電梯門",
      "image": "assets/common-sense/scenes/lift-door.webp",
      "wallLine": "電梯門開緊——唔好用手玩",
      "ask": "電梯門開嚟合埋，可唔可以玩門？",
      "correct": "企定定，唔好用手玩門",
      "wrong": [
        "用手擋住電梯門玩",
        "喺門中間跳入跳出",
        "叫朋友一齊去推門"
      ],
      "audio": "電梯門開緊合埋都唔好玩，企喺裏面等大人撳樓層就得。"
    },
    {
      "id": "hot-soup",
      "name": "熱嘢唔掂",
      "image": "assets/common-sense/scenes/hot-soup.webp",
      "wallLine": "熱湯熱飯——等大人話得先掂",
      "ask": "桌上有碗熱湯，卡卡可唔可以即刻掂？",
      "correct": "唔好掂，等大人話得先",
      "wrong": [
        "用手指試下熱唔熱",
        "端起成碗自己倒出嚟",
        "吹一吹就即刻抱住"
      ],
      "audio": "熱湯熱飯好燙，唔好自己掂，等大人話得、唔燙先至食。"
    },
    {
      "id": "no-run-road",
      "name": "過馬路唔跑",
      "image": "assets/common-sense/scenes/no-run-road.webp",
      "wallLine": "過馬路——牽大人，唔好跑",
      "ask": "過馬路去學校，要唔要跑快啲？",
      "correct": "唔好跑，牽住大人慢慢行",
      "wrong": [
        "自己衝過馬路最快",
        "喺斑馬線上面亂跳",
        "車未停就跑過對面"
      ],
      "audio": "過馬路唔好跑，牽住大人，喺斑馬線慢慢行過去。"
    },
    {
      "id": "seatbelt",
      "name": "坐車扣帶",
      "image": "assets/common-sense/scenes/seatbelt.webp",
      "wallLine": "坐車——要扣好安全帶",
      "ask": "同大人坐車出街，要唔要扣安全帶？",
      "correct": "一定要扣好安全帶",
      "wrong": [
        "坐近窗就可以唔扣",
        "短程車話可以唔扣",
        "扣帶好嬲所以唔扣"
      ],
      "audio": "坐私家車或者的士都要扣安全帶，車行緊先至安全。"
    },
    {
      "id": "call-adult",
      "name": "有人受傷叫大人",
      "image": "assets/common-sense/scenes/call-adult.webp",
      "wallLine": "有人受傷——叫大人，唔自己亂搬",
      "ask": "公園有人跌親受傷，卡卡先做乜？",
      "correct": "快啲叫大人或者職員",
      "wrong": [
        "自己搬佢起身再行",
        "當睇唔到繼續去玩",
        "倒凍水淋喺傷口度"
      ],
      "audio": "見到有人受傷，快啲叫身邊大人或者職員，唔好自己亂搬。"
    }
  ]
};

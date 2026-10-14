/** 卡卡常識樂園 · 天氣同四季 */
window.COMMON_SENSE_PACKS = window.COMMON_SENSE_PACKS || {};
window.COMMON_SENSE_PACKS["weather-seasons"] = {
  "packId": "weather-seasons",
  "topicId": "common-sense",
  "coinMode": "common-sense-weather",
  "title": "天氣同四季",
  "roundSize": 10,
  "goal": "睇天氣識着衫同帶邊啲嘢",
  "intro": "今朝天陰，書包掛遮返深水埗——先由落雨開始，再學熱凍同四季。",
  "cover": "assets/common-sense/scenes/rain-umbrella.webp",
  "wrongHint": "唔係呢個喎，再諗吓○○啦，可以再試。",
  "lifeAnchor": {
    "title": "落雨返學帶遮",
    "body": "香港忽然落雨好常見。同大人出門先睇天，書包掛遮；打風就聽大人決定。"
  },
  "items": [
    {
      "id": "rain-umbrella",
      "name": "落雨帶遮",
      "image": "assets/common-sense/scenes/rain-umbrella.webp",
      "wallLine": "今朝天陰——書包掛把遮返學",
      "ask": "深水埗今朝落雨，返學要帶咩？",
      "correct": "書包掛把遮先出街",
      "wrong": [
        "只帶太陽眼鏡出街",
        "着泳褲去學校就得",
        "唔使帶嘢照樣跑出去"
      ],
      "audio": "落雨返學，書包掛把遮，同大人一齊行，唔好自己衝出馬路。"
    },
    {
      "id": "typhoon",
      "name": "打風聽大人",
      "image": "assets/common-sense/scenes/typhoon.webp",
      "wallLine": "打風——出唔出街聽大人",
      "ask": "外面打風，卡卡可唔可以自己決定出街？",
      "correct": "打風聽大人決定出唔出",
      "wrong": [
        "風越大越好出去玩",
        "自己去海邊睇大浪",
        "唔使理警告照出街"
      ],
      "audio": "打風同天文台警告，一律聽屋企大人決定，細路唔好自己出街。"
    },
    {
      "id": "cold-coat",
      "name": "凍着外套",
      "image": "assets/common-sense/scenes/cold-coat.webp",
      "wallLine": "好凍——着厚外套先出門",
      "ask": "冬天朝早好凍，出街應該着咩？",
      "correct": "着厚外套同埋長褲",
      "wrong": [
        "只着背心就跑出去",
        "着泳褲去公園先凍",
        "唔着襪當完全冇事"
      ],
      "audio": "好凍要着外套、長褲，有時仲要頸巾，先至唔容易病。"
    },
    {
      "id": "hot-no-coat",
      "name": "熱唔好厚褸",
      "image": "assets/common-sense/scenes/hot-no-coat.webp",
      "wallLine": "好熱——唔好着厚外套",
      "ask": "夏天好熱，可唔可以着厚大褸出街？",
      "correct": "好熱唔好着厚外套",
      "wrong": [
        "越熱越要着兩件褸",
        "着滑雪衫先至啱熱",
        "用厚被包住先出門"
      ],
      "audio": "好熱着薄衫、戴帽、飲水；厚外套留返凍嗰陣先着。"
    },
    {
      "id": "four-seasons",
      "name": "春夏秋冬",
      "image": "assets/common-sense/scenes/four-seasons.webp",
      "wallLine": "四季——春、夏、秋、冬",
      "ask": "一年有四個季節，叫咩名？",
      "correct": "春夏秋冬一共四個季",
      "wrong": [
        "只有熱同凍兩個季",
        "季節叫朝晝晚半夜",
        "四季就係一二三四點"
      ],
      "audio": "香港一年有春、夏、秋、冬。夏天熱、冬天凍，着衫要睇季節。"
    },
    {
      "id": "summer-hot",
      "name": "夏天又熱又曬",
      "image": "assets/common-sense/scenes/summer-hot.webp",
      "wallLine": "夏天——好多時又熱又曬",
      "ask": "香港夏天最常見係點？",
      "correct": "夏天好多時又熱又曬",
      "wrong": [
        "夏天日日一定落大雪",
        "夏天日日着滑雪衫",
        "夏天夜晚一定會結冰"
      ],
      "audio": "香港夏天熱同曬，有時仲會有驟雨，出門戴帽同帶水。"
    },
    {
      "id": "winter-cold",
      "name": "冬天會凍",
      "image": "assets/common-sense/scenes/winter-cold.webp",
      "wallLine": "冬天——會凍，要着多件",
      "ask": "冬天朝早出街，常見會點？",
      "correct": "冬天會凍，要着多件",
      "wrong": [
        "冬天一定著短袖出街",
        "冬天熱過煮滾嘅開水",
        "冬天日日一定去游水"
      ],
      "audio": "冬天會凍，出門着多件褸，返到學校先至決定脫唔脫。"
    },
    {
      "id": "sun-hat",
      "name": "猛日戴帽",
      "image": "assets/common-sense/scenes/sun-hat.webp",
      "wallLine": "出街猛日——戴帽防晒",
      "ask": "太陽好猛出公園，應該戴咩？",
      "correct": "出街猛日戴帽防晒",
      "wrong": [
        "戴住泳鏡就當防晒",
        "用紙袋套住頭出街",
        "越猛曬越係唔使理"
      ],
      "audio": "猛日戴帽、行樹蔭，仲要飲水，皮膚先舒服。"
    },
    {
      "id": "wet-floor",
      "name": "濕地慢慢行",
      "image": "assets/common-sense/scenes/wet-floor.webp",
      "wallLine": "落完雨地面濕——慢慢行",
      "ask": "落完雨地面好濕，應該點行？",
      "correct": "濕地慢慢行，小心滑",
      "wrong": [
        "濕地上面大力踏步跑",
        "踩水窪當自己游水玩",
        "閉埋眼衝落濕斜路"
      ],
      "audio": "地面濕好易滑，慢慢行、牽大人，唔好跑。"
    },
    {
      "id": "adult-warning",
      "name": "警告聽大人",
      "image": "assets/common-sense/scenes/adult-warning.webp",
      "wallLine": "天文台警告——聽屋企大人",
      "ask": "電視講有打風警告，邊個決定出唔出街？",
      "correct": "警告要聽屋企大人決定",
      "wrong": [
        "細路自己決定出街",
        "問隔籬狗先至決定",
        "看誰跑得快就得出"
      ],
      "audio": "有警告就交畀爸媽或者老師決定，卡卡跟住大人就最安全。"
    }
  ]
};

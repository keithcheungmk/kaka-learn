/** 卡卡常識樂園 · 天氣同四季（四季入口＋季節活動卡） */
window.COMMON_SENSE_PACKS = window.COMMON_SENSE_PACKS || {};
window.COMMON_SENSE_PACKS["weather-seasons"] = {
  "packId": "weather-seasons",
  "topicId": "common-sense",
  "coinMode": "common-sense-weather",
  "kind": "seasons",
  "title": "天氣同四季",
  "roundSize": 10,
  "goal": "識香港四季天氣同當季活動",
  "intro": "香港一年有春、夏、秋、冬。撳季節卡入去睇天氣同活動，再答十題。",
  "cover": "assets/common-sense/scenes/four-seasons.webp",
  "wrongHint": "唔係呢個喎，再諗吓○○啦，可以再試。",
  "seasons": [
    {
      "id": "spring",
      "name": "春天",
      "cover": "assets/common-sense/scenes/season-spring.webp",
      "wallLine": "潮濕、大霧、清明前後多雨",
      "intro": "香港春天又潮濕又多霧，回南天地滑，清明前後成日落雨。",
      "audio": "香港春天又潮濕又多霧，回南天地滑，清明前後成日落雨。",
      "events": [
        {
          "id": "humid",
          "name": "潮濕",
          "image": "assets/common-sense/scenes/humid.webp",
          "wallLine": "春天空氣好濕，窗都會滴水",
          "ask": "春天屋企窗同牆點解會濕？",
          "correct": "春天空氣潮濕會滴水",
          "wrong": [
            "春天日日一定落大雪",
            "春天一定着滑雪衫",
            "春天窗濕係因為結冰"
          ],
          "audio": "春天空氣好潮濕，窗同牆有時會滴水，衣服都晾得慢。"
        },
        {
          "id": "returning-damp",
          "name": "回南天地濕",
          "image": "assets/common-sense/scenes/wet-floor.webp",
          "wallLine": "回南天地滑，要慢慢行",
          "ask": "回南天地面好濕，應該點行？",
          "correct": "回南天地濕要慢慢行",
          "wrong": [
            "回南天要喺水窪跑步",
            "回南天着泳褲出街",
            "回南天閉眼衝落斜路"
          ],
          "audio": "回南天地面好濕好滑，要慢慢行、牽大人，唔好跑。"
        },
        {
          "id": "fog",
          "name": "大霧",
          "image": "assets/common-sense/scenes/fog.webp",
          "wallLine": "春天常見大霧，牽大人行",
          "ask": "香港大霧多數喺邊個季節？",
          "correct": "大霧多數喺春天出現",
          "wrong": [
            "大霧只會喺夏天出現",
            "大霧一定喺冬天落雪",
            "大霧只會喺黑夜先有"
          ],
          "audio": "香港大霧多數喺春天。霧大就慢慢行，牽住大人，唔好自己衝。"
        },
        {
          "id": "qingming-rain",
          "name": "清明前後多雨",
          "image": "assets/common-sense/scenes/rain-umbrella.webp",
          "wallLine": "清明前後成日落雨，書包掛遮",
          "ask": "清明前後香港天氣常見點？",
          "correct": "清明前後成日會落雨",
          "wrong": [
            "清明前後一定好猛曬",
            "清明前後一定落大雪",
            "清明前後一定打邊爐"
          ],
          "audio": "清明前後成日會落雨，出門書包掛把遮，同大人一齊行。"
        }
      ]
    },
    {
      "id": "summer",
      "name": "夏天",
      "cover": "assets/common-sense/scenes/season-summer.webp",
      "wallLine": "又熱又曬、打風、去沙灘",
      "intro": "香港夏天又熱又曬，有時落大雨同打風。出門戴帽搽防曬，打風要聽天文台警告。",
      "audio": "香港夏天又熱又曬，有時落大雨同打風。出門戴帽搽防曬，打風要聽天文台警告。",
      "events": [
        {
          "id": "summer-hot",
          "name": "又熱又曬",
          "image": "assets/common-sense/scenes/summer-hot.webp",
          "wallLine": "夏天好多時又熱又曬",
          "ask": "香港夏天最常見係點？",
          "correct": "夏天好多時又熱又曬",
          "wrong": [
            "夏天日日一定落大雪",
            "夏天日日着滑雪衫",
            "夏天夜晚一定會結冰"
          ],
          "audio": "香港夏天好熱好曬，出門着薄衫、戴帽、帶水，厚外套留返冬天。"
        },
        {
          "id": "sun-hat",
          "name": "戴帽搽防曬",
          "image": "assets/common-sense/scenes/sun-hat.webp",
          "wallLine": "猛日戴帽，仲要搽防曬",
          "ask": "夏天出公園太陽猛，應該點？",
          "correct": "戴帽搽防曬先出街",
          "wrong": [
            "戴住泳鏡就當防曬",
            "用紙袋套住頭出街",
            "越猛曬越係唔使理"
          ],
          "audio": "太陽猛要戴帽、搽防曬、行樹蔭，仲要飲水，皮膚先舒服。"
        },
        {
          "id": "heavy-rain",
          "name": "落大雨",
          "image": "assets/common-sense/scenes/heavy-rain.webp",
          "wallLine": "夏天驟雨好大，記得帶遮",
          "ask": "夏天忽然落大雨，出街要帶咩？",
          "correct": "落大雨要帶遮出街",
          "wrong": [
            "落大雨着厚雪褸出街",
            "落大雨唔使理照跑出去",
            "落大雨去海邊睇大浪"
          ],
          "audio": "夏天忽然落大雨好常見，書包掛把遮，同大人行，唔好自己衝出馬路。"
        },
        {
          "id": "typhoon",
          "name": "打風聽警告",
          "image": "assets/common-sense/scenes/typhoon.webp",
          "wallLine": "打風聽天文台同大人",
          "ask": "打風要聽邊個警告？",
          "correct": "打風要聽天文台警告",
          "wrong": [
            "打風要聽隔籬狗決定",
            "打風越大越好出去玩",
            "打風唔使理照出街玩"
          ],
          "audio": "夏天好多時打風。出唔出街要聽天文台警告，同埋聽屋企大人決定。"
        },
        {
          "id": "ice-cream",
          "name": "食雪糕",
          "image": "assets/common-sense/scenes/ice-cream.webp",
          "wallLine": "夏天熱，可以食雪糕",
          "ask": "夏天好熱，常見會食咩涼嘢？",
          "correct": "夏天熱可以食雪糕",
          "wrong": [
            "夏天熱一定要食火鍋",
            "夏天熱只可以食年糕",
            "夏天熱要着厚外套食"
          ],
          "audio": "夏天好熱，可以問大人食雪糕，但唔好食太多，仲要飲清水。"
        },
        {
          "id": "beach",
          "name": "去沙灘玩",
          "image": "assets/common-sense/scenes/beach.webp",
          "wallLine": "夏天同大人去沙灘玩",
          "ask": "夏天一家人常見去邊度玩水？",
          "correct": "夏天可以去沙灘玩水",
          "wrong": [
            "夏天一定去滑雪場玩",
            "夏天只可以喺雪地玩",
            "夏天唔准去有水嘅地方"
          ],
          "audio": "夏天可以同大人去沙灘玩水，要戴帽搽防曬，跟住大人，唔好自己游出去。"
        }
      ]
    },
    {
      "id": "autumn",
      "name": "秋天",
      "cover": "assets/common-sense/scenes/season-autumn.webp",
      "wallLine": "天朗氣清、行山賞月",
      "intro": "香港秋天最舒服，天朗氣清，空氣乾燥要飲多啲水。",
      "audio": "香港秋天最舒服，天朗氣清，空氣乾燥要飲多啲水。",
      "events": [
        {
          "id": "clear-sky",
          "name": "天朗氣清",
          "image": "assets/common-sense/scenes/clear-sky.webp",
          "wallLine": "秋天又清又爽，天好藍",
          "ask": "香港秋天天氣多數點？",
          "correct": "秋天好多時天朗氣清",
          "wrong": [
            "秋天日日一定落大雪",
            "秋天一定日日打風",
            "秋天一定成日大霧"
          ],
          "audio": "香港秋天好多時天朗氣清，天空好藍，最舒服，適合出街行。"
        },
        {
          "id": "dry-drink",
          "name": "乾燥飲水",
          "image": "assets/common-sense/scenes/drink-water.webp",
          "wallLine": "秋天乾燥，要飲多啲水",
          "ask": "秋天空氣乾燥，應該點？",
          "correct": "乾燥要飲多啲清水",
          "wrong": [
            "乾燥就唔好飲清水",
            "乾燥要着泳褲出街",
            "乾燥就要去食雪糕"
          ],
          "audio": "秋天空氣乾燥，喉嚨同皮膚都易乾，要飲多啲清水。"
        },
        {
          "id": "hiking",
          "name": "去行山",
          "image": "assets/common-sense/scenes/season-autumn.webp",
          "wallLine": "秋天適合同大人行山",
          "ask": "秋天適合去做咩戶外活動？",
          "correct": "秋天適合同大人行山",
          "wrong": [
            "秋天一定要去滑雪",
            "秋天只可以打邊爐",
            "秋天唔准出街去玩"
          ],
          "audio": "秋天天氣清爽，適合同大人去行山，跟住大人，唔好自己走前。"
        },
        {
          "id": "moon-watch",
          "name": "中秋賞月",
          "image": "assets/common-sense/scenes/moon-watch.webp",
          "wallLine": "秋天中秋，一齊賞月",
          "ask": "中秋賞月通常係邊個季節？",
          "correct": "中秋賞月通常係秋天",
          "wrong": [
            "中秋賞月係春天先有",
            "中秋賞月一定係冬天",
            "中秋賞月只可以夏天"
          ],
          "audio": "中秋喺秋天。一家人可以賞月、食月餅，出街都要跟住大人。"
        }
      ]
    },
    {
      "id": "winter",
      "name": "冬天",
      "cover": "assets/common-sense/scenes/season-winter.webp",
      "wallLine": "着外套、打邊爐、出白氣",
      "intro": "香港冬天會凍，出街要着厚外套。屋企可以打邊爐，有時同大人去露營。",
      "audio": "香港冬天會凍，出街要着厚外套。屋企可以打邊爐，有時同大人去露營。",
      "events": [
        {
          "id": "winter-coat",
          "name": "着厚外套",
          "image": "assets/common-sense/scenes/season-winter.webp",
          "wallLine": "好凍要着厚外套先出門",
          "ask": "冬天朝早好凍，出街應該着咩？",
          "correct": "着厚外套同埋長褲",
          "wrong": [
            "只着背心就跑出去",
            "着泳褲去公園先凍",
            "唔着襪當完全冇事"
          ],
          "audio": "冬天好凍，出街要着厚外套、長褲，有時仲要頸巾，先至唔容易病。"
        },
        {
          "id": "hotpot",
          "name": "打邊爐",
          "image": "assets/common-sense/scenes/hotpot.webp",
          "wallLine": "冬天屋企一齊打邊爐",
          "ask": "打邊爐通常係邊個季節？",
          "correct": "打邊爐多數係冬天",
          "wrong": [
            "打邊爐只可以夏天食",
            "打邊爐一定係春天先有",
            "打邊爐要去沙灘先食"
          ],
          "audio": "打邊爐多數係冬天。熱辣辣一齊食好暖，湯同餸好熱，要小心，問大人先夾。"
        },
        {
          "id": "camping",
          "name": "去露營",
          "image": "assets/common-sense/scenes/camping.webp",
          "wallLine": "冬天同大人去露營",
          "ask": "冬天去露營，應該點先安全？",
          "correct": "露營要同大人一齊去",
          "wrong": [
            "自己一個去山露營",
            "露營唔使帶厚外套",
            "露營一定要去雪地"
          ],
          "audio": "冬天有時會同大人去露營，要着厚衫、跟住大人，唔好自己離開帳篷。"
        },
        {
          "id": "white-breath",
          "name": "凍到出白氣",
          "image": "assets/common-sense/scenes/winter-cold.webp",
          "wallLine": "凍到口裏會出白氣",
          "ask": "好凍出門，口裏成日會點？",
          "correct": "凍到口裏會出白氣",
          "wrong": [
            "凍到口裏會噴火花",
            "凍到一定會落大雪",
            "凍到就要着泳褲出街"
          ],
          "audio": "冬天好凍，出門口裏會出白氣。着厚外套就得，香港好少落雪。"
        }
      ]
    }
  ]
};

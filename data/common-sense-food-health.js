/** 卡卡常識樂園 · 飲食同健康 */
window.COMMON_SENSE_PACKS = window.COMMON_SENSE_PACKS || {};
window.COMMON_SENSE_PACKS["food-health"] = {
  "packId": "food-health",
  "topicId": "common-sense",
  "coinMode": "common-sense-food",
  "title": "飲食同健康",
  "roundSize": 10,
  "goal": "知常見食物點嚟，再識均衡同洗手",
  "intro": "先睇牛奶同麵包點嚟，再學食飯前洗手、口渴飲水。過程係橋，健康習慣先係關卡。",
  "cover": "assets/common-sense/scenes/milk-from-cow.webp",
  "wrongHint": "唔係呢個喎，再諗吓食物點嚟，或者食飯前應該點？",
  "lifeAnchor": {
    "title": "先睇食物點嚟",
    "body": "牛奶來自牛，麵包用小麥焗。知點嚟之後，先學邊啲食得健康。"
  },
  "items": [
    {
      "id": "milk-from-cow",
      "name": "牛奶來自牛",
      "image": "assets/common-sense/scenes/milk-from-cow.webp",
      "wallLine": "牛奶——主要來自奶牛",
      "ask": "卡卡朝早飲嘅牛奶，主要來自咩？",
      "correct": "牛奶主要來自奶牛",
      "wrong": [
        "牛奶主要來自石頭",
        "牛奶從樹上摘落嚟",
        "牛奶係落雨變成嘅"
      ],
      "audio": "牛奶主要來自奶牛。農場擠奶、裝盒，先至去到我哋杯。"
    },
    {
      "id": "bread-wheat",
      "name": "麵包用小麥",
      "image": "assets/common-sense/scenes/bread-wheat.webp",
      "wallLine": "麵包——主要用麵粉小麥",
      "ask": "麵包主要係用咩整出嚟？",
      "correct": "麵包主要用麵粉小麥",
      "wrong": [
        "麵包主要用玻璃整",
        "麵包從牛身上擠出",
        "麵包係石頭焗出嚟"
      ],
      "audio": "小麥磨成麵粉，揉麵、發酵、放入焗爐，先有香噴噴麵包。"
    },
    {
      "id": "rice",
      "name": "飯來自米",
      "image": "assets/common-sense/scenes/rice.webp",
      "wallLine": "白飯——米煮熟就係飯",
      "ask": "晚飯碗裏面嘅白飯，主要來自咩？",
      "correct": "白飯主要來自稻米",
      "wrong": [
        "白飯主要來自牛奶",
        "白飯係塑膠盒變嘅",
        "白飯從石頭磨出嚟"
      ],
      "audio": "稻米洗乾淨，加水煮飯，就係我哋日日食嘅白飯。"
    },
    {
      "id": "wash-eat",
      "name": "食飯前洗手",
      "image": "assets/common-sense/scenes/wash-eat.webp",
      "wallLine": "食飯前——洗手先至健康",
      "ask": "坐低食飯之前，最緊要做咩？",
      "correct": "食飯之前要先洗手",
      "wrong": [
        "食飯前先食糖十粒",
        "手有泥都即刻攞餸",
        "食完先至去洗手呀"
      ],
      "audio": "食飯前洗手，細菌先唔入肚，同禮貌包講嘅一樣。"
    },
    {
      "id": "drink-water",
      "name": "口渴飲水",
      "image": "assets/common-sense/scenes/drink-water.webp",
      "wallLine": "口渴——優先飲清水",
      "ask": "跑完公園好口渴，優先飲咩？",
      "correct": "口渴要優先飲清水",
      "wrong": [
        "口渴只可以飲汽水",
        "口渴要食糖先至得",
        "口渴就去飲洗頭水"
      ],
      "audio": "口渴要優先飲清水。汽水糖果偶爾得，唔可以當水。"
    },
    {
      "id": "fruit",
      "name": "水果例子",
      "image": "assets/common-sense/scenes/fruit.webp",
      "wallLine": "水果——蘋果香蕉都健康",
      "ask": "以下邊樣最似日常水果？",
      "correct": "蘋果香蕉都係水果",
      "wrong": [
        "汽水罐都算係水果",
        "橡皮擦都算係水果",
        "膠水樽都算係水果"
      ],
      "audio": "蘋果、香蕉、橙都係水果，飯後食少少好健康。"
    },
    {
      "id": "candy-not-meal",
      "name": "糖果唔當正餐",
      "image": "assets/common-sense/scenes/candy-not-meal.webp",
      "wallLine": "糖果——偶爾食，唔當飯",
      "ask": "糖果可唔可以當成餐午飯？",
      "correct": "糖果唔可以當正餐",
      "wrong": [
        "糖果當飯最有營養",
        "午餐只食糖果就夠",
        "飯都唔使有糖就得"
      ],
      "audio": "糖果好甜，偶爾食得。正餐要有飯、菜、肉或者蛋。"
    },
    {
      "id": "breakfast",
      "name": "早餐好重要",
      "image": "assets/common-sense/scenes/breakfast.webp",
      "wallLine": "早餐——返學前要食",
      "ask": "朝早返學之前，早餐重唔重要？",
      "correct": "早餐好重要，要食飽",
      "wrong": [
        "早餐一定要完全唔食",
        "早餐只可以食糖果",
        "早餐用牙膏代替飯"
      ],
      "audio": "早餐食飽先有力返學，牛奶同麵包都係常見早餐。"
    },
    {
      "id": "brush-tell",
      "name": "刷牙同告訴大人",
      "image": "assets/common-sense/scenes/brush-tell.webp",
      "wallLine": "牙齒——朝晚刷；唔舒服告訴大人",
      "ask": "食完甜嘢或者肚唔舒服，應該點？",
      "correct": "刷牙，唔舒服告訴大人",
      "wrong": [
        "痛都唔好出聲忍住",
        "自己食藥櫃全部藥",
        "用膠水去黏實牙齒"
      ],
      "audio": "朝晚刷牙。牙齒痛、肚唔舒服，一定告訴大人。"
    },
    {
      "id": "sit-share",
      "name": "坐定食問大人",
      "image": "assets/common-sense/scenes/sit-share.webp",
      "wallLine": "食飯——坐定；分享先問大人",
      "ask": "食飯同分享食物，卡卡應該點？",
      "correct": "坐定食，分享先問大人",
      "wrong": [
        "邊跑邊食最快最好",
        "隨便分畀唔識嘅人",
        "企喺沙發度跳住食"
      ],
      "audio": "坐定先食，走嚟走去易噎親。分享食物前問大人安唔安全。"
    }
  ],
  "sections": [
    {
      "type": "process",
      "id": "cs-food-process",
      "title": "食物點嚟",
      "intro": "牛奶同麵包唔係櫃桶變出來。睇完幾步，先至識食得健康。",
      "strips": [
        {
          "id": "milk",
          "title": "牛奶",
          "steps": [
            {
              "image": "assets/common-sense/process/milk-1.svg",
              "label": "牛"
            },
            {
              "image": "assets/common-sense/process/milk-2.svg",
              "label": "擠奶"
            },
            {
              "image": "assets/common-sense/process/milk-3.svg",
              "label": "裝盒"
            },
            {
              "image": "assets/common-sense/process/milk-4.svg",
              "label": "飲"
            }
          ]
        },
        {
          "id": "bread",
          "title": "麵包",
          "steps": [
            {
              "image": "assets/common-sense/process/bread-1.svg",
              "label": "小麥"
            },
            {
              "image": "assets/common-sense/process/bread-2.svg",
              "label": "揉麵"
            },
            {
              "image": "assets/common-sense/process/bread-3.svg",
              "label": "焗"
            },
            {
              "image": "assets/common-sense/process/bread-4.svg",
              "label": "出爐"
            }
          ]
        }
      ]
    }
  ]
};

/** 卡卡常識樂園 · 香港交通 */
window.COMMON_SENSE_PACKS = window.COMMON_SENSE_PACKS || {};
window.COMMON_SENSE_PACKS["transport-hk"] = {
  "packId": "transport-hk",
  "topicId": "common-sense",
  "coinMode": "common-sense-transport",
  "title": "香港交通",
  "roundSize": 10,
  "goal": "由屋企學校站識港鐵，再識巴士渡輪同車廂禮儀",
  "intro": "荃灣西係屋企，深水埗返學，沙田爸爸返工，馬鞍山探禧禧。先喺地圖搵站，再學車廂點做。",
  "cover": "assets/common-sense/scenes/priority.webp",
  "wrongHint": "唔係呢個喎，再睇吓地圖釘同卡卡身邊嘅站。",
  "items": [
    {
      "id": "home-tw",
      "name": "屋企近荃灣西",
      "image": "assets/common-sense/scenes/home-tw.webp",
      "wallLine": "卡卡屋企——近荃灣西站",
      "ask": "卡卡屋企近邊一個港鐵站？",
      "correct": "屋企就近荃灣西站",
      "wrong": [
        "屋企近羅湖邊境站",
        "屋企近機場先至近",
        "屋企近赤柱海邊站"
      ],
      "audio": "卡卡屋企喺荃灣西附近，返屋企就記呢個站。"
    },
    {
      "id": "school-ssp",
      "name": "學校喺深水埗",
      "image": "assets/common-sense/scenes/school-ssp.webp",
      "wallLine": "崇真幼稚園——喺深水埗",
      "ask": "卡卡返崇真幼稚園，學校喺邊一站附近？",
      "correct": "學校喺深水埗嗰邊",
      "wrong": [
        "學校喺迪士尼城堡",
        "學校喺馬鞍山海邊",
        "學校喺山頂纜車站"
      ],
      "audio": "卡卡返學去深水埗，崇真小學幼稚園就喺呢邊。"
    },
    {
      "id": "dad-st",
      "name": "爸爸返工沙田",
      "image": "assets/common-sense/scenes/dad-st.webp",
      "wallLine": "爸爸返工——去沙田",
      "ask": "爸爸返工坐車，主要去邊一站？",
      "correct": "爸爸返工去沙田站",
      "wrong": [
        "爸爸返工去羅湖站",
        "爸爸日日去迪士尼",
        "爸爸返工去山頂站"
      ],
      "audio": "爸爸返工多數去沙田，卡卡識得呢個站就識爸爸喺邊。"
    },
    {
      "id": "heihei-mos",
      "name": "禧禧住馬鞍山",
      "image": "assets/common-sense/scenes/heihei-mos.webp",
      "wallLine": "朋友禧禧——住馬鞍山",
      "ask": "想探朋友禧禧，要坐車去邊？",
      "correct": "禧禧住喺馬鞍山站",
      "wrong": [
        "禧禧住喺迪士尼站",
        "禧禧住喺機場裏面",
        "禧禧住喺天星碼頭"
      ],
      "audio": "禧禧屋企喺馬鞍山，探朋友就坐車去呢個站。"
    },
    {
      "id": "disney",
      "name": "地鐵去迪士尼",
      "image": "assets/common-sense/scenes/disney.webp",
      "wallLine": "想去玩——可以坐地鐵去迪士尼",
      "ask": "卡卡想去迪士尼玩，可唔可以坐地鐵去？",
      "correct": "可以坐地鐵去迪士尼",
      "wrong": [
        "地鐵一定去唔到玩",
        "只可以游水游過去",
        "一定要坐飛機先到"
      ],
      "audio": "坐地鐵好方便，想去迪士尼玩都可以坐車去。"
    },
    {
      "id": "tst-mk",
      "name": "出名站尖沙咀旺角",
      "image": "assets/common-sense/scenes/tst-mk.webp",
      "wallLine": "尖沙咀、旺角——都係出名站",
      "ask": "尖沙咀同旺角係咪香港好出名嘅站？",
      "correct": "尖沙咀同旺角都好出名",
      "wrong": [
        "呢兩個站唔存在嘅",
        "得羅湖先至叫出名",
        "出名站得牧場一個"
      ],
      "audio": "尖沙咀、旺角都係好出名嘅站，坐地鐵就去到。"
    },
    {
      "id": "call-mtr",
      "name": "地下鐵叫港鐵",
      "image": "assets/common-sense/scenes/call-mtr.webp",
      "wallLine": "地下鐵——日常叫港鐵、地鐵",
      "ask": "香港地下鐵，日常最常叫佢做咩？",
      "correct": "香港日常叫港鐵地鐵",
      "wrong": [
        "一定要叫飛行火車",
        "地下鐵只可以叫過山車",
        "香港只叫佢做渡輪"
      ],
      "audio": "地下鐵路喺香港，大家日常叫港鐵或者地鐵。"
    },
    {
      "id": "no-run-car",
      "name": "車廂唔好跑",
      "image": "assets/common-sense/scenes/no-run-car.webp",
      "wallLine": "坐車廂——唔好跑，企穩陣",
      "ask": "港鐵車廂裏面，可唔可以走嚟走去跑？",
      "correct": "車廂唔好跑，企穩陣",
      "wrong": [
        "車廂可以賽跑最快",
        "車停之前跳下車門",
        "企出黃線外面等車"
      ],
      "audio": "車廂好多人，唔好跑、唔好推，企穩或者坐好。"
    },
    {
      "id": "priority",
      "name": "優先座讓人",
      "image": "assets/common-sense/scenes/priority.webp",
      "wallLine": "優先座——畀有需要嘅人",
      "ask": "車廂優先座，應該留給邊啲人？",
      "correct": "優先座畀有需要嘅人",
      "wrong": [
        "得小朋友先可以坐",
        "得自己錫先至有位",
        "邊個跑得快邊個坐"
      ],
      "audio": "優先座留給婆婆公公、抱寶寶或者行動唔便嘅人；細路可以讓座。"
    },
    {
      "id": "yellow-line",
      "name": "等車企黃線內",
      "image": "assets/common-sense/scenes/yellow-line.webp",
      "wallLine": "等車——企喺黃線裏面",
      "ask": "月台等車，應該企喺邊？",
      "correct": "等車要企喺黃線裏面",
      "wrong": [
        "企出黃線外面睇車",
        "坐喺路軌邊等車來",
        "車未停就跳落車軌"
      ],
      "audio": "等車企喺黃線裏面安全啲，車停定先入。"
    }
  ],
  "sections": [
    {
      "type": "map",
      "id": "cs-mtr-map",
      "title": "我嘅港鐵地圖",
      "src": "assets/common-sense/mtr-family-map.svg",
      "caption": "示意用・非官方港鐵地圖。坐地鐵好方便，可以坐地鐵去迪士尼。",
      "pins": [
        {
          "n": "1",
          "name": "荃灣西",
          "note": "卡卡屋企"
        },
        {
          "n": "2",
          "name": "深水埗",
          "note": "崇真幼稚園"
        },
        {
          "n": "3",
          "name": "旺角",
          "note": "出名站"
        },
        {
          "n": "4",
          "name": "尖沙咀",
          "note": "出名站"
        },
        {
          "n": "5",
          "name": "沙田",
          "note": "爸爸返工"
        },
        {
          "n": "6",
          "name": "馬鞍山",
          "note": "禧禧屋企"
        },
        {
          "n": "7",
          "name": "迪士尼",
          "note": "去玩"
        }
      ]
    }
  ]
};

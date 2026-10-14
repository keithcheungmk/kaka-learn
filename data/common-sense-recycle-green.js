/** 卡卡常識樂園 · 環保回收 */
window.COMMON_SENSE_PACKS = window.COMMON_SENSE_PACKS || {};
window.COMMON_SENSE_PACKS["recycle-green"] = {
  "packId": "recycle-green",
  "topicId": "common-sense",
  "coinMode": "common-sense-recycle",
  "title": "環保回收",
  "roundSize": 10,
  "goal": "識分紙膠金屬玻璃去邊個箱",
  "intro": "飲完牛奶盒、膠樽，問大人去邊個箱。先由屋企分類開始，再學慳電同愛護公園。",
  "cover": "assets/common-sense/scenes/paper.webp",
  "wrongHint": "唔係呢個喎，再諗吓○○啦，可以再試。",
  "lifeAnchor": {
    "title": "由屋企分類開始",
    "body": "卡卡飲完牛奶或者膠水，問大人：呢樣去紙、膠、金屬定玻璃？出街帶可重用袋。"
  },
  "items": [
    {
      "id": "paper",
      "name": "報紙去紙箱",
      "image": "assets/common-sense/scenes/paper.webp",
      "wallLine": "乾淨報紙——入藍色紙箱",
      "ask": "屋企睇完嘅乾淨報紙，應該放去邊？",
      "correct": "乾淨報紙放入紙箱",
      "wrong": [
        "報紙全部掉入玻璃箱",
        "報紙倒去水渠沖走",
        "報紙塞入金屬罐裏"
      ],
      "audio": "乾淨報紙、課本紙入紙箱。問大人先至放，濕同污糟就唔好。"
    },
    {
      "id": "plastic",
      "name": "膠樽去膠箱",
      "image": "assets/common-sense/scenes/plastic.webp",
      "wallLine": "飲完膠樽——問大人入膠箱",
      "ask": "飲完牛奶或者水嘅膠樽，通常去邊個箱？",
      "correct": "空膠樽放入塑膠箱",
      "wrong": [
        "膠樽全部入玻璃箱",
        "膠樽塞入紙堆中間",
        "膠樽掉去公園花槽"
      ],
      "audio": "飲完膠樽問大人：乾淨嘅放入塑膠回收箱。"
    },
    {
      "id": "metal",
      "name": "汽水罐金屬",
      "image": "assets/common-sense/scenes/metal.webp",
      "wallLine": "汽水罐——入金屬箱",
      "ask": "空咗嘅汽水鋁罐，應該去邊？",
      "correct": "空鋁罐放入金屬箱",
      "wrong": [
        "空鋁罐放入玻璃箱",
        "鋁罐同蕉皮一齊倒",
        "鋁罐剪爛先丟馬桶"
      ],
      "audio": "空汽水罐係金屬，問大人放去金屬回收箱。"
    },
    {
      "id": "glass",
      "name": "玻璃瓶玻璃箱",
      "image": "assets/common-sense/scenes/glass.webp",
      "wallLine": "玻璃瓶——入玻璃箱，好易碎",
      "ask": "空咗嘅玻璃樽，應該細細力放去邊？",
      "correct": "玻璃樽放入玻璃箱",
      "wrong": [
        "玻璃樽丟去紙箱壓扁",
        "玻璃樽同香蕉皮一齊",
        "玻璃樽丟去馬路中間"
      ],
      "audio": "玻璃易碎，交畀大人放入玻璃箱，細路唔好自己扔。"
    },
    {
      "id": "banana",
      "name": "蕉皮唔入玻璃",
      "image": "assets/common-sense/scenes/banana.webp",
      "wallLine": "蕉皮——唔入玻璃箱，問大人",
      "ask": "食完香蕉嘅皮，可唔可以丟入玻璃回收箱？",
      "correct": "蕉皮唔好入玻璃箱",
      "wrong": [
        "蕉皮一定入玻璃箱",
        "蕉皮塞入金屬罐裏",
        "蕉皮貼喺地鐵車門"
      ],
      "audio": "蕉皮係廚餘，唔入紙膠金屬玻璃箱；問大人去邊。"
    },
    {
      "id": "reuse-bag",
      "name": "出街帶重用袋",
      "image": "assets/common-sense/scenes/reuse-bag.webp",
      "wallLine": "買嘢——帶可重用袋",
      "ask": "同大人去超市，點樣減少用膠袋？",
      "correct": "出街帶可重用布袋",
      "wrong": [
        "每次都要新膠袋十個",
        "用完袋即刻丟去海",
        "膠袋帶越多就越環保"
      ],
      "audio": "出門帶可重用袋，買餸少用新膠袋，地球輕鬆啲。"
    },
    {
      "id": "lights-off",
      "name": "唔 vis 燈要熄",
      "image": "assets/common-sense/scenes/lights-off.webp",
      "wallLine": "離開房間——記得熄燈",
      "ask": "出咗房冇人，電燈應該點？",
      "correct": "冇人房就要熄咗燈",
      "wrong": [
        "燈日夜都開住最靚",
        "人走咗都要開最大燈",
        "用厚被冚住燈當熄"
      ],
      "audio": "冇人喺房就要熄燈，慳電又安全。"
    },
    {
      "id": "park-flower",
      "name": "公園花唔摘",
      "image": "assets/common-sense/scenes/park-flower.webp",
      "wallLine": "公園花草——睇得，唔好摘",
      "ask": "同大人去公園，可唔可以摘花回家？",
      "correct": "公園花睇得唔好摘",
      "wrong": [
        "見到靚花就摘晒佢",
        "用腳踩低全部花朵",
        "摘完再倒去回收箱"
      ],
      "audio": "公園花草大家一齊欣賞，用手睇得，唔好摘、唔好踩。"
    },
    {
      "id": "straw",
      "name": "飲筒用完問大人",
      "image": "assets/common-sense/scenes/straw.webp",
      "wallLine": "膠飲筒用完——問大人點丟",
      "ask": "飲完嘢嘅膠飲筒，應該點？",
      "correct": "用完問大人點樣丟",
      "wrong": [
        "飲筒射去車廂地下",
        "飲筒塞入朋友書包",
        "飲筒丟去公園水池"
      ],
      "audio": "用完飲筒唔好亂丟，問大人丟入邊個桶。"
    },
    {
      "id": "clean-paper",
      "name": "乾淨紙先回收",
      "image": "assets/common-sense/scenes/clean-paper.webp",
      "wallLine": "廢紙——乾淨先好回收",
      "ask": "紙搓成團，但有油有醬，仲可唔可以當回收紙？",
      "correct": "乾淨紙先好去回收",
      "wrong": [
        "越污糟越要入紙箱",
        "有湯嘅紙一定回收",
        "濕紙巾全部當報紙"
      ],
      "audio": "乾淨紙先好回收。有油、有醬、好濕，問大人丟普通垃圾桶。"
    }
  ]
};

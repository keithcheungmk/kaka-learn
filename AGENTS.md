# AGENTS.md — kaka-learn

給 Cursor／自動化 agent 嘅專案指引。

## 專案係乜

幼兒繁體中文認字網頁（KAKA，約 4 歲）。粵語家庭、iPad 優先、亦要適合 Mac mini + TV 大掣操作。

## 硬性約束

- 所有 app 程式碼只可以寫喺本 repo（kaka-learn）。`keith-ops` 只係建議／營運筆記，唔好把遊戲實作放過去。
- 字詞表必須用呢 24 個繁體表面形，唔好自行加「麋鹿」或改「老虎／獅子／大象」做單字：

  鹿、梅花鹿、馴鹿、駝鹿、馬鹿、狗、貓、魚、鳥、兔、羊、牛、馬、豬、熊、獅子、老虎、大象、猴、雞、鴨、蛙、蟲、龍

- 無登入、廣告、追蹤、寫字練習、故事模式、真實付款／AEON API。
- UI 用繁體中文；主題係原創「小鹿 + 太空冒險」，唔好用迪士尼／彼思名稱、角色或素材。

## 點樣跑

```bash
python3 -m http.server 5173
# 開 http://localhost:5173
```

詳見 `README.md`。

## 架構速覽

| 檔案 | 職責 |
|------|------|
| `index.html` | 畫面骨架（主頁、兩種模式、家長／PIN modal） |
| `js/words.js` | 字詞資料 + 系統 Emoji 插圖（iPhone Apple Color Emoji） |
| `js/storage.js` | `localStorage`：星星、PIN、設定 |
| `js/speech.js` | `speechSynthesis`（優先 `zh-HK`）+ Web Audio 短音 |
| `js/app.js` | 模式循環、家長區、星星動畫 |
| `css/styles.css` | 太空／小鹿視覺、大 tap target |

## 改動時注意

- 每日星星硬上限 10；可兌換幣 = `floor(totalStars / 10)`。
- 模式 B 必須維持「先撳字 → 再撳圖」。
- 家長 PIN 預設 `1234`，要可以改。
- 鹿類重點開關會提高鹿詞抽中權重。
- 答錯要溫柔、無羞恥文案。
- 保持單頁、無 build step（純靜態 + ES modules），除非產品明確要求框架。

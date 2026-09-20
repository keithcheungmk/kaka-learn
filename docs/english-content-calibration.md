# English Content Calibration

呢份文件係 KAKA Learn chief lead 同 English Lead 共用嘅內容地圖。目的係對齊三套英文教材點樣支援網站／learning app；唔係將三套教材混成一套，亦唔係把來源 project 嘅工作規則搬過來。

## 三套主要內容來源

| Content set | Canonical source | Current material | Learning role | 主要 calibration 點 | 目前狀態 |
|---|---|---|---|---|---|
| **Carter Family** | `source-materials/Carter Family/` | 85 本故事書 PDF；85 個完整故事 MP3；`Page-level clips/` 逐頁音檔及頁面對應資料 | 故事為本嘅英文閱讀、聆聽、理解、生字及句子學習；作為最完整嘅日常英文內容來源 | 故事次序、頁面對應、自然句子、生活詞彙、完整音檔 vs 逐頁音檔、由理解去到複習 | 已有完整 source library；Story English Read & Fill 已上線 CF001–CF003 |
| **Space Patrol** | `/Users/keith/Claude Projects/kaka-learn/source-materials/Space Patrol/` | 約 96 本故事 PDF；約 96 個 MP3；54 本 `word` 練習 PDF；1 個 DOCX 原稿 | 太空／任務主題嘅延伸故事內容；用來學主題詞彙、句式、聆聽及故事理解 | 故事 arc、任務詞彙、句型重複、PDF–MP3–word 練習配對、由 Carter Family 學到嘅 unit framework 能否重用 | Source library 已放入；先做一個小 arc pilot，未整批落 app |
| **Phonics** | `/Users/keith/Claude Projects/kaka-learn/source-materials/Level 2 Phonics Ⅰ （25篇完结）/` | 25 本 phonics 故事 PDF；25 個 MP3；25 個 MP4；25 份 flash-card PDF | 聲音—字母／grapheme—拼讀能力；係 decoding foundation，唔係普通故事閱讀嘅另一個版本 | grapheme–phoneme 對應、blending／segmenting、目標音重複、flash card、故事內 target words、phonics progress vs vocabulary progress | Source library 已放入；網站已有 Phonics engine／音檔標準，內容對齊仍需 English Lead 校準 |

## 三套教材點樣一齊用

```text
Carter Family  = 日常故事語言／句子理解
Space Patrol   = 主題故事／任務詞彙／句式延伸
Phonics        = 讀音解碼／拼讀基礎
```

- Carter Family 同 Space Patrol 都可以產生 story unit，但要保留各自故事世界、角色及來源標記。
- Phonics 應該獨立記錄 sound／grapheme／blending 能力；唔可以因為識咗一個故事詞就當成 phonics mastery，亦唔可以用 phonics drill 取代故事理解。
- 三套教材可以共用資料欄位，例如 `sourceSet`、`unitId`、`sourceFile`、`audio`、`targetWords`、`sentenceFrames`、`activities`；但學習目標同 progress metric 要分開。
- 原始教材只作 read-only source。網站真正使用嘅 PDF／MP3／JSON／flash cards 必須係 KAKA Learn 自己揀選或產生嘅衍生資料，唔好整個 source library 複製入 app。

## English Lead 要先對齊嘅欄位

每個 learning unit 最少要能夠回答：

1. 呢個 unit 來自邊套教材、邊本書／邊一課？
2. 學生今次學邊幾個 target words？
3. 學邊一至兩個 sentence patterns？
4. 有邊個完整音檔、逐頁音檔或 phonics 音檔？
5. 係閱讀理解、聆聽、口語、Flash Card，定 phonics decoding？
6. 完成後嘅紀錄屬於 vocabulary、sentence、listening、reading 定 phonics skill？

第一輪 calibration 應先用少量 Carter Family、Space Patrol 同 Phonics unit 做 parallel sample，確認三套內容可以共用框架，但唔會誤合併學習目標。

## 來源使用規則

- Keith 只需要將新素材放入主 project `source-materials/`；分類、抽取、配對及建立索引由 agent 處理。
- Carter Family folder 係教材來源，不是 KAKA Learn 規則來源；其中點讀筆 sticker 編號、錄音工作流程等不會自動變成 KAKA Learn product rules。
- 唔修改 Carter Family 或其他來源 folder 原檔；衍生資料要保留 provenance，方便追溯返原本書、頁面及音檔。

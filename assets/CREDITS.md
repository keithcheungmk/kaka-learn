# 認字／主頁原創美術

| 檔案 | 用途 |
|------|------|
| `chinese-hero.jpg` | 主頁任務海報：原創 Q 版小鹿太空戰士（青綠護甲、紫飾邊、白盔；鹿角穿出 visor；胸口星星／小鹿章）同漢字隊員「鹿」「星」 |
| `chinese-space-bg.jpg` | 認字各屏全屏背景：深海軍藍＋淡紫 nebula，遠景漢字星塵 |

兩張都係為本 app 原創生成，**唔係**第三方角色、教材或品牌素材。唔用迪士尼／彼思名稱、樣貌或盔甲花紋。

# 卡卡字母隊字母音

`assets/phonemes/{a–z}.mp3` 由家庭錄音剪輯（一條 a–z 連續檔，按約 2 秒一格切開）。唔用第三方教材原檔上線。


## OpenMoji（`assets/openmoji/`）

全部字詞插圖用 [OpenMoji](https://openmoji.org) 彩色 SVG（505 個圖形，取自 openmoji npm 套件 17.0.0）。

- 授權：**CC BY-SA 4.0**
- 作者：OpenMoji — the open-source emoji and icon project
- 修改：冇改過圖本身，只係按 Unicode codepoint 重新命名檔案（去走 U+FE0F）。
- 由 `js/emoji-art.js` 按 `words.js` 嘅 `emoji` 欄位對應；揾唔到圖就自動跌返用系統 emoji。

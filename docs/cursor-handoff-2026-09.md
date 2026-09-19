# Kaka Learn → Cursor 接手摘要

更新：2026-09-20。呢份係俾 Cursor 開工時先讀嘅導覽；程式碼同測試先係事實來源，規則以 [`AGENTS.md`](../AGENTS.md) 及 [`docs/handover.md`](handover.md) 為準。

## 新增素材／library 提示（2026-09-20）

Keith 提到「crop project folder」最近加入咗好多 source material。喺目前機器嘅
`/Users/keith/Claude Projects/` 掃描唔到一個字面上叫 `crop` 嘅資料夾；應先把
`/Users/keith/Claude Projects/kaka-learn/` 視為現行 project，並由下面嘅
`source-materials/` 開始查。若 Keith 另行提供真正 crop 路徑，先把新路徑補入本節，
唔好靠估路徑或將另一個 sibling repo 當成主 project。

目前本地 source library 約 **2.7 GB**（Git ignore、未部署），主要容量如下：

| 本地資料夾 | 約容量 | 用途 |
|---|---:|---|
| `source-materials/Carter Family/` | 1.0 GB | 85 本英文故事 PDF、完整 MP3、逐頁 clips |
| `source-materials/Level 2 Phonics Ⅰ （25篇完结）/` | 672 MB | phonics 故事、音頻、MP4、flash cards、word |
| `source-materials/Space Patrol/` | 576 MB | 太空故事、MP3、word 練習 |
| `source-materials/PTH/` | 385 MB | 快樂拼音教材、initials video |
| `source-materials/Chinese book scans/` | 40 MB | 中文 PDF 及衍生紅輯頁面 |
| `source-materials/Phonics/` | 11 MB | phonics 原始／參考素材 |
| `source-materials/recording phonic/` | 348 KB | Keith 錄製嘅 `a_e`、`ice`、`i_e`、`igh`、`ar`、`or`、`ow` 等音檔 |

PTH 嘅 `assets/pth/words/*.aac` 及 `js/pth-word-audio.js` 已於 `d4a0274` commit，
但 Cursor 仍要以 GitHub Actions 結果確認是否已部署。Codex working tree 另外仍有一批
**只存在本機、未必已部署**嘅衍生 library／試作，例如 `tmp/`、紅輯高質頁面、
`data/red-series/sentence-game-data.mjs`、`js/red-sentence-engine.mjs`、Saturn demo
同 Supabase 草稿。Cursor 接手時要先用
`git status --short` 分辨 tracked、untracked、已 commit 及已部署；唔好把未驗證嘅
local asset 當成 production 功能，亦唔好刪除 source 原檔。

建議 Cursor 先執行：

```bash
du -sh source-materials/*
find source-materials -maxdepth 3 -type f | sort
git status --short
```

再按 `AGENTS.md` 嘅 source-material 規則，從原始檔建立可追溯衍生資料；原始 library
唔可以整個搬入 `assets/` 或 `_site/`。

## 先做呢幾步

```bash
cd "/Users/keith/Claude Projects/kaka-learn"
git fetch origin main
git status --short
git log --oneline -12
```

目前主分支最後一個已部署 commit 是 `746a7c7`（Story English 答啱後播放英文鼓勵語音）。工作樹有另一批尚未合併的修改，唔好用 `git reset --hard`、`git clean` 或大段覆寫清走；先讀 `docs/handover.md` 嘅「進行中（認領）」及「最近改動」，再認領你要做嘅檔案。

## 本機位置及原始教材

Repo 根目錄：

`/Users/keith/Claude Projects/kaka-learn/`

所有 Keith 投放嘅原始教材集中喺（Git ignore、唔會直接部署）：

`/Users/keith/Claude Projects/kaka-learn/source-materials/`

目前主要資料夾：

- `source-materials/Carter Family/`：85 本英文故事 PDF、完整 MP3、`Page-level clips/` 逐頁音檔；KAKA 已用 `Game Night` 做 Read & Fill 試點。
- `source-materials/Space Patrol/`：太空故事 PDF、MP3 及 word 練習，暫時只作內容來源，未整批接入網站。
- `source-materials/Level 2 Phonics Ⅰ （25篇完结）/`：phonics 故事、音頻、MP4、flash cards 及 word 素材。
- `source-materials/Phonics/mama phonic recording/`、`source-materials/recording phonic/`：Keith 錄製嘅原始 phonics 音檔；只用經整理嘅副本，唔改原檔。
- `source-materials/PTH/`：快樂拼音教材及 initials video。
- `source-materials/Chinese book scans/`：中文書本掃描及衍生頁面分析素材。

原始教材唔好搬入 `assets/`、`data/` 或 `_site/`。網站只放選定、可追溯嘅衍生圖、音檔及結構化資料。

## 網站架構

呢個係純靜態 app，冇 npm build、冇 backend；`index.html` 係單頁入口，透過多個 `.screen` 切換玩法。部署由 GitHub Actions 執行 `scripts/build-site.sh`，自動複製網站檔案、排除 `docs/`、`scripts/`、`source-materials/`，並用 commit SHA 做 `?v=` cache bust。

主要入口及資料層：

| 範圍 | 主要檔案 | 用途 |
|---|---|---|
| 共用 landing / routing | `index.html`, `js/app.js`, `css/styles.css` | Profile、主頁、中文認字三種玩法、progress、獎勵條 |
| 中文字詞 | `js/words.js`, `js/storage.js`, `js/emoji-art.js` | 主題、OpenMoji 圖、Profile 分倉及掌握度 |
| English / Phonics | `js/phonics-words.js`, `js/phonics-app.js`, `css/phonics.css` | Sight Words 主題、完整英文詞、phonics／拼字／blending |
| 語音 | `js/speech.js` | 粵語 TTS、英文 TTS、普通話 voice、短音效；唔好自行 fallback 到錯語言 |
| Carter Story English | `js/story-demo.js`, `css/story-demo.css`, `assets/story-demo/` | Game Night 12 頁故事圖及逐頁 audio、Read & Fill |
| 數理 | `js/math-app.js`, `js/math-*.js`, `js/additionGame.js`, `js/subtractionGame.js`, `css/math*.css` | 行星任務；數理 state 用 `kaka-math-v1`，同認字分開 |
| 普通話 | `pth-demo.html`, `js/pth-demo.js`, `js/pth-data.js`, `js/pth-word-audio.js`, `css/pth-demo.css` | K2 快樂拼音；音檔／voice 必須係普通話 |
| 中文紅輯試點 | `book-scene-demo.html`, `js/book-scene-demo.js`, `data/red-series/`, `css/book-scene-demo.css` | 用核實書頁砌自然詞組；現時仍係未部署支線 |

Landing 上 `SPACE RANGER ENGLISH` 下面係 `STORY ENGLISH・Game Night`。Phonics 下半部維持獨立 Sound Mission；Sight Words 放喺英文頁上半部。

## 已部署、Cursor 應保留嘅最新功能

### English Sight Words / Phonics

- 舊「常見字・1–4」已移除，唔好復原做新資料基礎。
- Sight Words 已有動物拼字園、Food、Vegetables、Places、Vehicles、Fruit、Household Items、School Items、Hong Kong Festivals，再加 My Body、Feelings、Clothes、Family & People、Weather；主題卡有中英文標題及 OpenMoji 圖。
- Phonics 係「完整英文詞＋拼字＋phonics」融合流程：先聽全字，再逐音，最後以真實字母格完成拼字；`rice` 保留 `r + ice → rice` 連音邏輯。
- 英文能力數據要分開 recognition／blending／segmenting，唔好把完整詞 TTS 當 phonics mastery。

### Carter Family `Game Night`

目前只有一條 `Read & Fill` 流程：

1. 每頁先按 `Listen to the story`，播放 Carter 原始逐頁錄音。
2. 錄音完先顯示同一頁短句，抽走一個完整英文詞。
3. 三個選擇加 `Submit`；答錯顯示 `That’s okay. Try again!`，唔會因撞答案跳題。
4. 填空頁嘅 `Read this sentence` 係裝置英文 TTS，逐字 highlight；呢個係答題前重聽用途。
5. 答啱後**唔再重讀原句**，改播四句輪替英文鼓勵語音，例如 `Great job, Kaka! You got it right!`，完成後先顯示下一頁。

題目及來源對應喺 `js/story-demo.js` 的 `PAGES`：PDF page、source clip、故事圖、句子、blank、三個 choices 都要保持可追溯。規格背景見 [`docs/carter-family-sentence-reading-plan.md`](carter-family-sentence-reading-plan.md)。

## 目前尚未合併／未部署工作

`git status` 現時可見一批另一條工作線嘅 dirty/untracked 檔案，重點包括：

- 紅輯按書頁砌句：`book-scene-demo.html`、`js/book-scene-demo.js`、`css/book-scene-demo.css`、`data/red-series/sentence-game-data.mjs`、`scripts/test-book-scene-demo.mjs`；只准用 `sourceVerified: true` 嘅原書頁句子，詳見 [`docs/red-series-sentence-game-framework.md`](red-series-sentence-game-framework.md)。
- PTH 普通話音檔：`assets/pth/words/`、`js/pth-word-audio.js` 及相關 PTH 修改；原始素材仍在 `source-materials/PTH/`。
- Saturn／數理試作：`saturn-demo.html`、`js/saturn-demo.js`、`css/saturn-demo.css`。
- Supabase PIN／跨裝置 progress 只係草稿：`supabase/`、`docs/supabase-progress-sync.md`、`memory/projects/supabase-profile-sync.md`；handover 已明確標為暫緩，未獲 Keith 重新交辦唔好執行 migration、設定 PIN 或部署。

呢批檔案唔等於已部署功能；Cursor 接手時要先分辨「已 commit／已部署」同「working tree 草稿」。

## 驗證、合併及部署

常用檢查：

```bash
node --check js/<changed-file>.js
node scripts/test-story-mission.mjs
node scripts/test-phonics-flow.mjs
python3 scripts/check-invariants.py
python3 scripts/smoke-shots.py --no-shots   # CSS／流程改動；需本地 5173
python3 scripts/qa-report.py
```

CI 會跑 `check-invariants.py`、storage tests、build-site 模擬部署及三個家庭 viewport layout smoke；main push 後由 `.github/workflows/deploy-pages.yml` 發佈至：

<https://keithcheungmk.github.io/kaka-learn/>

最近已部署的 Story English commits：

- `17cbeda`：三選項、Submit、溫柔答錯提示、英文 TTS 句子及逐字 highlight。
- `746a7c7`：答啱後改用四句英文鼓勵語音，唔再自動重讀句子。

## 接手守則

- 開工先 `git fetch origin main`、讀 `AGENTS.md`、`docs/handover.md`；改共享檔前喺 handover 認領。
- 唔好 reset／clean 其他 agent 嘅工作；只 stage 自己改嘅檔案。
- 版面／流程改動要以 iPad Pro 11 橫直及 iPhone 16 Pro Max 驗收；每個遊戲頁要保持主要內容一屏、按鈕至少 44px、冇重疊／404／console error。
- 任何新增圖像、漢字或音檔要遵守 OpenMoji、font subset、asset size、source provenance 規則。
- 完成後更新 `docs/handover.md` 最近改動、跑 CI，先 merge／deploy；唔好把 `source-materials/` 原檔提交。

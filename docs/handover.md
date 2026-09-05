# 交接簿 — Cursor ⇄ Claude (Cowork) ⇄ Codex (ChatGPT)

呢個 repo 由三個 agent 平行開工，大家都可能 push `main`，所以要有一個地方
寫低「其他人需要知」嘅嘢，唔係就會撞。

## 邊個係邊個

| 署名 | 係邊個 |
|---|---|
| **Cursor** | Keith 部機上嘅 Cursor，或者 Cursor Cloud Agent |
| **Claude**／**Claude (Cowork)** | Anthropic Claude，經 deploy key push |
| **Codex** | ChatGPT Codex 或 Codex CLI |

Keith 明確交俾邊個嘅任務，就由嗰個做。**唔好搶**已經寫死嘅擁有權（例如 Claude 嘅字卡 OCR／CI／獎勵條／image lock，Cursor 嘅 ranger／star-fx）——除非 Keith 開口叫你跨界。

## 點用呢個檔

三個 agent **同一套**開工／收工協議：

- **開工前**：`git fetch origin main` → 睇 `AGENTS.md`（硬性規則）→ 睇呢個檔（分工、進行中認領、地雷）。
- **改共享／高危檔之前**：喺下面「進行中（認領）」表認領；同一功能／同一批檔唔可以兩個人同時改。
- **merge 完之後**：喺「最近改動」加一段（日期、邊個做、改咗乜、掂咗邊啲檔），署名 **Cursor**／**Claude**／**Codex**。做完就清走認領。
- 只寫其他人要知嘅嘢：**擁有權、地雷、未完事項**。設計討論、需求分析唔好塞入嚟。
- 呢個檔唔係規則書。任何「以後都要咁做」嘅嘢要寫入 `AGENTS.md`，
  而且同時喺 `scripts/check-invariants.py` 加一個 `check_xxx()`，靠機器守住，唔好靠記憶。

## 進行中（認領）

改共享檔（尤其係下面「撞車高危檔案」）之前，先喺呢度認領。做完／merge 完就刪嗰行。**永遠唔好兩個人同時認領同一批檔／同一個功能。**

| 功能／範圍 | 認領人 | 主要檔案 | 開始日期 | 備註 |
|---|---|---|---|---|

<!-- 範本（複製一行，填完刪走「—」嗰行）：
| 短描述 | Cursor／Claude／Codex | `path/a`, `path/b` | YYYY-MM-DD | Keith 交辦／自己認領 backlog |
-->

## 而家嘅狀態（2026-09-05）

- 紅輯 12 本書的 `wordIds` 已按掃描書內認字卡核實（`verified: true`）；紅⑥《快跑呀》採用 2026-09-04 中文老師已審字卡，其餘新核實書採用 2026-09-05 掃描。除紅③《雨傘》暫以故事頁印刷詞為準外，不可再用書名或插圖推測字表。**唔好 merge Gemini #58**。
- 紅⑪ `rb_xiaoming`《小明和氣球》已用 2026-09-03 掃描字卡覆寫（`verified: true`；詞／短語；「快起牀」保留「牀」）。
- 紅③ `rb_yusan`《雨傘》已用 2026-08-11 書本 PDF 故事頁印刷詞覆寫（`verified: true`；詞／短語：橙／藍／綠／黃／花雨傘、收起小雨傘、太陽出來了、出來了）。**唔係獨立認字卡相**——若之後影到書後字卡，以字卡覆寫。
- 橙④ `ob_xiezi`《鞋子》已用 2026-09-03 掃描字卡覆寫（`verified: true`；詞／短語；「脫了」用肉月旁「脫」）。其他橙輯書仍係推測，唔好順手改。
- 卡卡／禧禧頭像已對調（PR #91 已入 `main`）：卡卡＝露齒笑、禧禧＝圓框較淡微笑（`assets/profile-kaka.jpg`、`assets/profile-heihei.jpg`）。顯示名「禧禧」，儲存 id 仍係 `heihei`。
- **小改動快徑**（Keith 2026-09-03 同意）：換圖／label／文案 → CI 綠即 merge；一張截圖；唔使片／computerUse／本地 smoke。詳見 `AGENTS.md`／`docs/qa-check.md`。
- `origin/main` 已含：P0 三項（PR #82）、KAKA RANGER 飛星（PR #83）、完成一輪慶祝 pose、favicon／og、sparkle、隨機 pose、UI 審查落地（PR #86）、ranger 朝右（PR #87）。

## 分工（點解要分：唔想兩個人同時改同一段 code）

| 範圍 | 擁有人 | 主要檔案 |
|---|---|---|
| 太空戰士造型、槍口射星動畫 | **Cursor** | `js/star-fx.js`、`scripts/crop-ranger-shooter.py`、`assets/` ranger 圖 |
| 獎勵條／幣／怪獸守幣 | **Claude** | `js/app.js` 嘅 `renderStarBars`／`renderRoundBar`／`renderCoinBar`、`js/storage.js` 經濟欄位、`.coin-*` CSS |
| 新主題內容、真實相片素材 | **Cursor** | `js/words.js`、`assets/food/`、`assets/food-hk/` |
| 《我自己會讀》字卡 OCR → `wordIds` | **Claude**（AGENTS.md 已寫死） | `docs/word-card-ocr.md`、`scripts/apply-book-cards.py` |
| 版面 no-scroll、重疊／剪裁回歸 | **Claude** | `scripts/smoke-shots.py`、`css/styles.css` 版面段 |
| CI／部署閘門／invariants | **Claude** | `.github/workflows/*`、`scripts/check-invariants.py`、`scripts/build-site.sh` |
| 圖片去背、壓縮、格式鎖 | **Claude** | `scripts/cutout-bg.py`、`assets/image-formats.lock.json`（用 `pngquant`，唔好用 Pillow `quantize()`） |
| Keith 明確交俾 Codex 嘅任務；無人擁有嘅 backlog | **Codex** | 以「進行中」認領為準。**未問 Keith 唔好**改 Claude 嘅 OCR／CI／獎勵條／image lock，或者 Cursor 嘅 star-fx |

呢個分工唔係死嘅——要跨界改，喺「進行中」認領並寫低就得。**但唔好兩個人同時改同一個功能。**

## 撞車高危檔案

Cursor／Claude／Codex 都可能掂到下面呢批檔——改之前先認領，唔好兩個人一齊改。

- `css/styles.css` — 三方都會掂。改之前認領 + `git fetch` + rebase，唔好用大段 rewrite，
  改細粒啲、貼住現有 selector 改。
- `js/app.js` — 同上。`renderStarBars` 一帶而家係 Claude 嘅，`flyStarToBar` 會
  delegate 去 `window.KakaStarFx.flyStarFromRanger`（Cursor 嘅），呢個 delegation
  就係 Cursor ⇄ Claude 嘅介面：**唔好其中一方刪咗個 fallback**。Codex 未認領唔好改呢度。
- `js/star-fx.js` — Cursor 擁有。Claude／Codex 通常只經 `window.KakaStarFx` 呼叫，唔改入面；
  **2026-09-02 有兩次例外**（都係 Keith 直接叫 Claude 做，唔係 Claude 自把自為）：
  （1）下午：加咗 3 個 sparkle span + 飛星圖由文字改 `<img>`，`MUZZLE_ANCHOR`／握拳
  發射邏輯冇郁；（2）夜晚：答啱一題 ranger 會隨機換 4 款 pose，**呢次 `MUZZLE_ANCHOR`
  改咗**（由精準對住握拳，簡化做身中心固定點 `{x:0.5, y:0.52}`——因為 pose 會變，
  握拳唔一定喺度），`scripts/crop-ranger-shooter.py`／`kaka-ranger-solo.png` 嘅
  預設 shooter 圖冇郁。詳情見上面「最近改動」。Cursor 改呢個檔之前對一對 git log，
  留意 `MUZZLE_ANCHOR` 已經唔再係「握拳精準座標」呢個假設。
- `assets/image-formats.lock.json` — Claude 擁有格式鎖。換圖之後要 `python3 scripts/check-invariants.py --update-image-lock`，
  唔係 CI 會紅。Codex／Cursor 換圖都要跑，但唔好未問就改 lock 規則。

## 最近改動

### 2026-09-05 — Cursor：地球加法星球（能量方塊）

- 重構地球 `compare-size`：舊大細長短 → 原創太空能量方塊加法（槽 A 預放 + 槽 B 拖放／點擊 + 倉庫方塊）
- `js/additionData.js`：5–10 關生活情境任務；`kaka-math-v1` `additionProgress` 預設解鎖 5、逐關解鎖
- 完成能量十（10-5）點亮地球；合併慶祝 + 粵語 TTS + 數理星
- 已驗證：`check-invariants.py` 35 項、math-storage 5 項；Playwright 關卡／遊戲／慶祝截圖
- **踩咗** `js/additionData.js`、`js/math-app.js`、`js/math-storage.js`、`index.html`、`css/math.css`、`js/math-skills.js`、`js/star-fx.js`、`scripts/check-invariants.py`、`scripts/test-math-storage.mjs`

### 2026-09-05 · Codex（Keith：Phonics 砌字完整英文聲音流程）

- 「砌一砌」每題載入後先以英式女聲 TTS 示範完整單字；拖放或點按正確入格均逐個播放媽媽的 phoneme 錄音
- 最後一格按「phoneme → 完整單字 → 英文鼓勵」順序播放；鼓勵會按 Profile 稱呼 Kaka／Hei Hei，錯誤提示亦改為短英文並不再重播答案
- 每個短音播完才接受下一格，避免快速連按截斷錄音；加入換題／離頁 generation guard，舊題延遲語音不會漏到新畫面
- 已驗證：實際瀏覽器聲序 `rat → r/a/t → rat → Great job, Kaka!`；invariants、storage／math-storage／version tests 全綠；5 種 iPad 及 2 種 iPhone 無裁切、重疊、404 或 console error
- **踩咗** `js/phonics-app.js`、`docs/handover.md`

### 2026-09-05 · Codex（Keith：Phonics 49 音分段清單＋透明 hero 圖）

- 「字母音訓練基地」由無語意的 01–10 橫列改為完整清單：基礎單字母音 25、輔音組合 10、母音組合 14；合共 3 大類、13 個具名 Sound Missions、49 音
- 每個音可在清單直接播放；每組保留「溫習本組」集中大卡及「小測驗」聽音辨形，最後一組只有 `ear／air` 亦可正常二選一
- `oo` 長音／短音以同字形加明確中文標示，避免只看檔名；清單屬純瀏覽頁，iPad／手機可安全捲動
- KAKA RANGER logo 原檔已有 alpha；方形底實為共用 `.phonics-hero img` 背景以較高 specificity 覆蓋。以精準 CSS 同時恢復 logo 及右側 Ranger 真透明背景，沒有重畫品牌圖
- 已驗證：invariants、storage／math-storage／version tests 全綠；5 種 iPad 及 2 種 iPhone 共 12 畫面無裁切、重疊、404 或 console error；本機人眼確認清單層級及 hero 透明效果
- **踩咗** `index.html`、`js/phonics-words.js`、`js/phonics-app.js`、`css/phonics.css`、`css/styles.css`、`scripts/smoke-shots.py`、`docs/handover.md`

### 2026-09-05 · Codex（Keith：媽媽 49 音錄音＋Phonics 聲音訓練基地）

- 保留 `mama phonic recording/` 49 個原始 MP3 完全不變並排除 Git／部署；網站只使用另外產生的副本
- 匯入器由每個三次讀音原檔選取中間一次，保留起落緩衝、統一音量並壓成 44.1kHz 單聲道 96kbps；49 個網站副本合共約 464KB
- 「字母音訓練基地」分成 10 個循序 Sound Missions，涵蓋單字母、雙字母及三字母音；每組可先逐音溫習，再做聽音辨形
- 移除音檔失敗時讀字母名稱的 TTS fallback，避免把 letter name 當 phoneme；音素能力紀錄繼續按 Profile 分倉
- 已驗證：原始檔處理前後 SHA-256 完全相同、49 個音檔 URL 全部 200、invariants／storage／math-storage／version tests 全綠；5 種 iPad 一屏到底，2 種 iPhone 無重疊／裁切，零 404／console error
- **踩咗** `.gitignore`、`assets/phonemes/`、`css/phonics.css`、`docs/phonics-audio-standard.md`、`index.html`、`js/phonics-app.js`、`js/phonics-words.js`、`scripts/build-site.sh`、`scripts/import-phonemes.py`、`docs/handover.md`

### 2026-09-05 · Codex（Keith：紅輯書本字表全面核實）

- 逐頁核對 11 本掃描紅書，將紅①②④⑤⑦⑧⑨⑩⑫由舊推測改為書內認字卡表面形；保留已核實的紅③、紅⑪
- 合併 Cursor 已完成的紅⑥《快跑呀》，統一共用「啊」的 `a_exclaim`，避免重複詞 entry
- 為 9 本新增 `data/book-cards/*.json` 證據檔，補齊詞條與中文字型 subset；所有 12 本紅書現已標記 `verified: true`
- 修正字卡檢查器把繁簡相同的「羊」誤判為簡體字

### 2026-09-04 · Cursor（Keith：紅⑥《快跑呀》字卡覆寫）

- `data/book-cards/rb_kuaipao.json`（`allow_words: true`）→ `apply-book-cards.py --write --sync-topic`
- 舊推測（走／跳／站／坐／慢／贏／追／來／去／回）作廢；12 張卡表面形入 `rb_kuaipao.wordIds`，`verified: true`
- 新詞補入 `js/words.js`（啊／呀／大火／小鹿／斑馬快跑／猴子快跑呀／森林大火啊）；呀用 `ya_exclaim`（`ya` 已係鴨）；短語整卡保留，冇拆斑馬／猴子
- `--sync-topic` 只把新 id 追加到紅輯總表；**其他未對卡嘅紅輯書 `wordIds` 冇改**；**冇掂橙輯**；**唔好 merge Gemini #58**
- 字體 subset 補「啊／呀／森／林」
- **踩咗** `js/words.js`、`data/book-cards/rb_kuaipao.json`、font subset、handover

### 2026-09-04 · Codex（Keith：Phonics Phase 3A 能力紀錄基礎）

- 每個 Profile 新增獨立 `phonicsSkillStats`，分開保存 `recognition`（認音）、`blending`（CVC 解碼／拼合）及 `segmenting`（砌字／拆音）
- 資料來源刻意收窄：單字母聆聽先計認音、看圖揀有 `letters` 的 CVC 字先計 blending、砌有 `letters` 的字先計 segmenting；Sight words、完整單字 TTS 揀圖及撳錯字格位置不計能力分
- 每項保存答對／答錯／streak、最後嘗試／答對日期及最近 10 次結果；舊 Profile 自動補空資料，卡卡／禧禧完全分倉，reset 亦會清理
- 暫時無改出題排序、自動重練或家長進度 UI；等 Phase 3B／3C 使用真實數據
- 新增 3 組 migration／分類／隔離測試及 invariant；同步更新 storage／Phonics app cache bust
- **踩咗** `js/storage.js`、`js/phonics-app.js`、`scripts/test-storage.mjs`、`scripts/check-invariants.py`、`index.html`、`AGENTS.md`、`docs/handover.md`

### 2026-09-04 · Codex（Keith：Profile 頁移除禧禧遊戲樂園入口）

- Profile 選擇頁只保留卡卡／禧禧兩張登入卡，移除底部重複的「禧禧遊戲樂園」外鏈
- 登入後主頁的「禧禧遊戲樂園」主要入口保留；禧禧 Profile、資料及遊戲內容完全不受影響
- 更新 Profile invariant，鎖定外鏈只可出現在主頁，不可再次加入 Profile 選擇頁
- **踩咗** `index.html`、`scripts/check-invariants.py`、`docs/handover.md`

### 2026-09-04 · Codex（Keith：SPACE RANGER PHONICS Phase 2 Sound Energy）

- 全面退役 Numberblocks 式擬人字母：共用元件已刪除眼、嘴、面孔及每個字母固定角色配色
- 「先學一學」「聽一聽」「砌一砌」統一改用深藍 Ranger Sound Energy 節點；點字母時以金色光環表示正在播放，砌啱後以綠色狀態表示完成
- 保留逐字母讀音、插圖、三種玩法、進度及派幣邏輯；插圖仍只顯示直接對應單字嘅現有素材
- 新增 invariant，禁止擬人字母元素／固定角色配色回歸；同步更新 CSS／JS cache bust
- 已驗證：invariants 33 項、storage 11 項、math storage 4 項、version checker 3 項全部通過；390px 手機學習卡及 1024×768 iPad 砌字畫面無溢出，點選字母再放入字格功能正常
- **踩咗** `js/phonics-words.js`、`js/phonics-app.js`、`css/phonics.css`、`index.html`、`scripts/check-invariants.py`、`AGENTS.md`、`docs/handover.md`

### 2026-09-04 · Codex（Keith：SPACE RANGER PHONICS Phase 1 品牌統一）

- Phonics 主題頁全面退役鹿仔視覺：背景改用既有深藍太空主題，hero 改為 KAKA Ranger、星球隊徽及 `c-a-t` 聲音能量設計
- 12 個主題卡統一加入 `MISSION 01–12` 任務編號；今階段只改品牌與導覽視覺，課程內容及玩法保持不變
- 新增 invariant，禁止 Phonics 再引用舊 `phonics-hero.jpg`／`phonics-space-bg.jpg`，並鎖定 KAKA Ranger hero 必要元素
- 已驗證：invariants 32 項、storage 11 項、math storage 4 項、version checker 3 項全部通過；iPad 橫向及 390px 手機實機瀏覽器驗證無重疊／橫向溢出，第一個字母任務可正常開啟
- **踩咗** `index.html`、`css/phonics.css`、`js/phonics-app.js`、`scripts/check-invariants.py`、`AGENTS.md`、`docs/handover.md`

### 2026-09-04 · Codex（Keith：主頁入口層級、Phonics 命名、底部工具列、「長」讀音）

- 「禧禧遊戲樂園」升級成第四個主要入口，視覺同其他學習入口同級；Profile 畫面連結亦同步改名
- 「卡卡字母隊」所有畫面標題及無障礙名稱統一做 `SPACE RANGER PHONICS`
- 「我的進度」「換小朋友」移到主頁內容底部；iPad 直向／橫向及 390px 手機實機瀏覽器驗證無重疊
- 單字「長」由「好長」改成只讀「長」，並加 invariant 防止回歸
- 已驗證：invariants 31 項、storage 11 項、math storage 4 項、version checker 3 項全部通過；瀏覽器 console 零錯誤
- **踩咗** `index.html`、`css/styles.css`、`js/words.js`、`scripts/check-invariants.py`、`AGENTS.md`、`docs/handover.md`

### 2026-09-03 · Codex（Keith：Profile 穩定性驗收 + 安全自動更新）

- 補齊雙 Profile 遷移、資料隔離同數理進度測試；修正舊 Profile 缺少 `economyVersion` 時可能重算並清零金幣嘅風險
- 新增 `version.json` 版本檢查：只會喺 Profile、主頁、進度、主題及書本等安全畫面自動更新；學習或遊戲途中會延後，避免打斷小朋友
- 已新增 storage、math storage、version checker 測試及部署版本檔驗證；GitHub OAuth 暫缺 `workflow` scope，所以今次先保留現有 CI workflow，待權限補齊後再接入三個新測試步驟
- 已驗證：storage 11 項、math storage 4 項、version checker 3 項、invariants 31 項全部通過；本機 build 同主要 Profile／進度畫面 smoke test 通過
- **踩咗** `.github/workflows/ci.yml`、`.gitignore`、`index.html`、`js/storage.js`、`js/version-check.js`、`scripts/build-site.sh`、`scripts/check-invariants.py`、`scripts/test-*.mjs`、`docs/handover.md`

### 2026-09-03 · Cursor（Keith 同意：小改動快徑寫入規則）

- 小改動（換圖、改 2 個 label、文案微調）：CI 綠 → 即刻 merge；證據一張截圖；唔使 demo 片／computerUse／本地 `smoke-shots.py`
- 真改版面／CSS／遊戲流程仍然要完整驗收；invariants 本地綠、font subset、唔跳 CI 仍然硬性
- **冇改** Claude 嘅 OCR／CI／獎勵條／image lock 擁有權，淨係澄清檢查節奏
- **踩咗** `AGENTS.md`、`docs/qa-check.md`、`docs/handover.md`

### 2026-09-03 · Cursor（Keith：對調頭像 + 顯示名禧禧）

- **已 squash-merge PR #91**（`d1bd4a5`）入 `main`；live 要閂 tab 再開

- 卡卡／禧禧頭像對調：卡卡＝露齒笑、禧禧＝圓框較淡微笑
- 畫面顯示名「希希」→「禧禧」；storage id 仍然係 `heihei`（唔改，進度唔會斷）
- 字體 subset 補「禧」
- **踩咗** `assets/profile-*.jpg`、`index.html`、`js/storage.js`、invariants／font subset、AGENTS／README／handover

### 2026-09-03 · Cursor（三方交接：加 Codex／ChatGPT）

- 交接簿改做 Cursor ⇄ Claude (Cowork) ⇄ Codex (ChatGPT)；加「邊個係邊個」同「進行中（認領）」表
- `AGENTS.md`／`CLAUDE.md`／新 `CODEX.md`／`README.md`／`docs/word-card-ocr.md` 對齊
- 字卡 OCR **仍然係 Claude only**；Codex 預設做 Keith 交辦同認領咗嘅 backlog，唔搶現有 lane
- `check_agent_collab_docs()`：CODEX.md／CLAUDE.md 要提 AGENTS.md；handover／AGENTS.md 要提 Codex
- **踩咗** `docs/handover.md`、`AGENTS.md`、`CLAUDE.md`、`CODEX.md`、`README.md`、`docs/word-card-ocr.md`、`scripts/check-invariants.py`

### 2026-09-03 · Cursor（Keith：紅③《雨傘》字表 + 新頭像）

- 紅③ `rb_yusan`：用 issue #57 書本 PDF 故事頁印刷詞覆寫（9 個表面形；舊推測看見／聽見／水／雲朵等作廢）
- JSON：`data/book-cards/rb_yusan.json`（`allow_words: true`）→ `apply-book-cards.py --write --sync-topic`
- **來源係書頁，唔係獨立認字卡相**；其他未對卡紅輯書 `wordIds` 冇改；**冇掂橙輯**；**唔好 merge Gemini #58**
- 卡卡／希希頭像換成太空戰士插畫 JPEG（384×384）；補 `assets/openmoji/1F302.svg`（🌂 收起小雨傘）
- **踩咗** `js/words.js`、`assets/profile-*.jpg`、handover

### 2026-09-03 · Cursor（Keith 授權：雙小朋友 Profile MVP）

- 主頁先揀「卡卡／希希」大頭像；選完先入認字／字母隊／數理
- `storage.js`／`math-storage.js` schemaVersion 3：按 profile 分倉；舊單一資料遷移入卡卡，希希空白
- 掹走家長 PIN／字詞開關／鹿類重點掣；改「換小朋友」+「我的進度」（近 14 日幣、要練嘅字、主題已過／未過，已過可重玩）
- 外鏈文案改「小遊戲樂園」
- 頭像：`assets/profile-kaka.jpg`、`assets/profile-heihei.jpg`
- **踩咗** `js/storage.js`、`js/app.js`、`js/math-storage.js`、`index.html`、`css/styles.css`、invariants／smoke

### 2026-09-03 · Cursor（Keith 實機：ranger 朝右 + 唔擋字池）

- `.space-ranger-img` 加 `transform: scaleX(-1)`（只翻 img，container／sparkle／laser 錨點唔翻）
- 直屏／手機：ranger 改右、抬高、縮小，避開字池／選項格；橫屏維持左下（砌一砌兩欄字池喺右）
- **唔做** ranger 跳入字池空格
- `check_ranger_mirror_dodge` + `smoke-shots.py` 加 ranger 蓋磚／朝右檢查（踩咗 Claude 嘅 smoke 檔，只加 ranger 規則）
- `MUZZLE_ANCHOR` 仍然係 container 中心 `{x:0.5,y:0.52}`；激光改 `-28deg` 向右上

### 2026-09-03 · Cursor（Keith 授權 UI 審查落地）

- 認字／字母隊玩法名統一「配一配」（副標先寫「睇圖，揀漢字」）
- 學習頁「去玩玩」常駐；學完先改「學完喇・去玩玩」
- 上一張／下一張加 ←／→；童面指示縮短；家長說明入家長區
- `.build-ghost` alpha 0.48；未賺幣格改虛線金圈＋聽／配／砌字
- 禧禧入口改細字連出去，唔再同三大 CTA 同級
- 橫屏：主頁 CTA 2 欄、學習卡左圖右字；主題卡藏長描述、分組＋掌握度點
- 今次**冇做**：P0-1 字體、P0-2 掌握度存儲（已喺 main）、P0-3 say、P1-5 version.json；Ranger 去背縮圖視余力

### 2026-09-03 · Cursor（Keith 授權）· 橙④《鞋子》實體字卡覆寫

- `data/book-cards/ob_xiezi.json`（`allow_words: true`）→ `apply-book-cards.py --write --sync-topic`
- 舊推測（鞋櫃／放學／回／家拆分等）作廢；16 張卡表面形入 `ob_xiezi.wordIds`，`verified: true`
- 新詞補入 `js/words.js`（含「脫了」「回家」「舒服地」「舒舒服服地」「地」）；「脫了」用肉月旁「脫」
- `--sync-topic` 只把新 id 追加到橙輯總表；**其他未對卡嘅橙輯書 `wordIds` 冇改**；**冇掂紅輯**

### 2026-09-03 · Cursor（Keith 授權）· 紅⑪《小明和氣球》實體字卡覆寫

- `data/book-cards/rb_xiaoming.json`（`allow_words: true`）→ `apply-book-cards.py --write --sync-topic`
- 舊單字腦補（朋／友／氣／球拆分等）作廢；29 張卡表面形入 `rb_xiaoming.wordIds`，`verified: true`
- 新詞補入 `js/words.js`（含「起牀」「快起牀」，字形係「牀」唔係「床」）；字體 subset 已加「牀」
- `AGENTS.md`：紅輯認字卡改「以卡上實際詞／字／短語為準」
- **唔好 merge Gemini #58**；其他未對卡嘅紅輯書 `wordIds` 冇郁

### 2026-09-02（夜晚）· Claude · 答啱一題 ranger 隨機換 pose

**背景**：Keith 睇完下晝嗰次 sparkle 效果，貼咗張圖出嚟指住 reference sheet 嗰 4 個
「握拳噴火／指嘢／揸手指公眨眼／招手」動作 pose（呢 4 張同 7 個裸頭表情唔同，**全部有
戴頭盔**），問可唔可以答啱一題就換一張出嚟，仲要保留飛星效果。**明確要求「討論先，未
落手」**，傾清楚幾個技術決定先做（見下面），唔係即刻改。

**同 Keith 對齊咗嘅決定**：
1. 發射點簡化——唔再逐張 pose 校準拳頭位，改做身中心固定點（見上面「撞車高危檔案」）。
2. 揸手指公嗰張（同 `kaka-ranger-celebrate.png` 完成一輪嗰張係同一個 pose）都照樣攞嚟
   一齊輪換，即係一輪入面有機會見到兩次（答啱一題見一次、完成一輪又見一次）。Keith 揀
   咗接受呢個重複。
3. 隨機揀，唔係固定順序輪。
4. Claude 今次直接做（同下畫嗰次一樣係例外，唔係常規分工）。

**做法**：
- 由 `docs/design/kaka-ranger-reference-sheet.png` 裁咗 3 張新 pose（握拳噴火／指嘢／
  招手），加埋已有嘅 `kaka-ranger-celebrate.png`（揸手指公），四張都 resize/置中做成
  同 `space-ranger-shooter.png` 一致嘅 192×192 畫布、差唔多嘅角色填滿比例，先唔會轉
  pose 嗰陣睇落忽大忽細：
  - `assets/space-ranger-pose-fistpump.png`（16KB）
  - `assets/space-ranger-pose-point.png`（16KB）
  - `assets/space-ranger-pose-wave.png`（17KB）
  - `assets/space-ranger-pose-thumbsup.png`（14KB，同 `kaka-ranger-celebrate.png` 同源
    但獨立一份、獨立畫布比例，`kaka-ranger-celebrate.png` 本身冇郁，`play-finish` 彈窗
    唔受影響）
  - 幾張都有少少鄰接 sprite bleed 殘留（一小撮火花／殘影），裁到依家嘅程度已經花咗
    幾輪嘗試，睇落唔顯眼，冇再摳落去。
- `js/star-fx.js`：`getGlobalRanger()` 個 `<img>` 加 `class="space-ranger-img"`
  俾 JS 揸到嚟換 `src`；新增 `SHOOT_POSES` 陣列 + `flashRandomPose()`——答啱一刻隨機揀
  一張换上去，`POSE_SWAP_MS`（550ms，同 `rangerShoot` 反彈動畫嗰 0.55s 對齊）之後自動
  換返 `DEFAULT_POSE`（即係而家嘅 `space-ranger-shooter.png`）。`hideRanger()` 加咗
  清 timer + 強制歸位，避免轉緊畫面嗰陣 pose 卡住唔變返。
- `MUZZLE_ANCHOR` 由 `{x:0.279,y:0.678}`（握拳精準座標）改做 `{x:0.5,y:0.52}`
  （身中心固定點）；`css/styles.css` 嘅 `.space-ranger-laser-flash::after` 位置同步
  由 `27.9%/67.8%` 改做 `50%/52%`。飛星軌跡、sparkle 位置冇郁（sparkle 本來就係
  「頭頂附近」，唔靠拳頭座標，換 pose 都合用）。
- `prefers-reduced-motion`：pose 換圖同飛星、閃光一齊喺 `flyStar()` 開頭 return，
  已經有保護，冇加多一重判斷。

**驗過**：`check-invariants.py`（含 `--update-image-lock`）綠、`smoke-shots.py --no-shots`
7 種尺寸 pass、Playwright 連續觸發 6 次答啱，`.space-ranger-img` 嘅 `src` 有隨機換到
4 款、冇 console error、人手 screenshot 逐張 pose 睇過冇明顯走位。

**呢次冇做**：7 個裸頭表情（同 2026-09-02 下畫嗰段講嘅一樣）仍然冇用——冇戴頭盔，同
成套「有頭盔」嘅視覺唔啱。

### 2026-09-02（下午）· Claude · Logo/favicon/分享圖 + 飛星改真圖 + 答啱 sparkle

**背景**：Keith 上傳埋 KAKA RANGER logo lockup（獨立高清圖，446×506，白底冇透明，
已存底喺 `docs/design/kaka-ranger-logo-source.png`），問（1）logo 擺邊、（2）答啱一題
可唔可以連 ranger pose／表情都變、加真星星特效、（3）指出 sheet 好多素材未用。
三點都先討論、AskUserQuestion 俾 Keith 揀先做嘢，唔係自己突擊改。

**1. Logo／favicon（Claude 範圍，冇撞 Cursor）**
- 成套 lockup 去白底（flood-fill 揀走同外框相連嘅白色／灰色，包括原圖左上角一嚿
  鄰接 sprite 嘅殘影），trim 完 421×439 → `assets/kaka-ranger-logo.png`。
- 淨徽章（星球+雙翼章，冇文字）裁成正方形 → `assets/icons/icon-{16,32,48,180,192,512}.png`
  + `assets/icons/favicon.ico`（16/32/48 合併）+ `assets/icons/site.webmanifest`。
  之前成個 app **完全冇 favicon/manifest**，依家 `<head>` 已加返晒 `<link rel="icon">`
  `apple-touch-icon` `manifest`。
- 完整 lockup 用喺分享連結預覽：合成一張 1200×630 嘅 `assets/og-image.png`
  （深紫底配 logo + 標題，字用 `scripts/font-src/NotoSansHK-Bold.otf` 現成起），
  加咗 `og:image`／`twitter:image` meta（絕對 URL）。
- ⚠️ **`scripts/check-invariants.py` 嘅 `check_no_build_step()` 加咗一個 allowlist
  例外**：`https://keithcheungmk.github.io`（自己個 GitHub Pages 域名）。呢個唔係
  runtime 依賴，淨係俾分享連結嗰陣 og:image 用絕對 URL 先啱規格，靜態頁本身唔會
  fetch 呢個 host。如果見到呢個 host 唔好誤刪佢，除非改咗部署域名。

**2. 飛星特效改用真星圖（踩咗 `js/star-fx.js`，見下面「⚠️ 一次性例外」）**
- `flyStar()` 由 `textContent = '★'` 改用 `<img src="./assets/kaka-ranger-star.png">`
  （由 reference sheet 裁 sheet 本身自帶嘅金色星星，65×43，真透明底，744B）。
  CSS `.fly-star`／`.fly-star-trail` 由 `font-size`+`text-shadow` 改做 `width`+多層
  `drop-shadow` filter，效果保持（睇落有光暈），發射／飛行嗰套 keyframe 邏輯全部冇郁。
- 加咗 `.space-ranger-sparkle`（3 粒細星，用返同一張 `kaka-ranger-star.png`），
  同 `.space-ranger-shoot` class 一齊觸發，答啱嗰下喺 ranger 頭頂爆開 3 粒細星
  （0.55s，錯開 delay），畫面上讀到「佢反應咗」。`prefers-reduced-motion` 有保護。

**3. 表情／pose 交換（做咗一半，另一半技術上做唔到，唔係唔想做）**
- Reference sheet 嗰 7 個「純面部表情」全部**冇戴頭盔**（裸頭），但 shooter／celebrate
  兩張已用嘅圖全部**有戴頭盔**——兩者換唔到，直接疊上去個樣會好突兀（斷晒角色連貫性），
  唔係「錢／時間」問題，係現有素材本身冇一張「戴住頭盔嘅第二個表情」。
  所以呢次冇做「換成另一張圖」，改做上面嘅 sparkle 頭頂爆星（唔換底圖，加疊加效果），
  已經喺人手 screenshot 驗過，睇落有「佢興奮咗」嘅感覺，冇搶漢字風頭（sparkle 好細粒）。
- 如果將來真係想要「戴頭盔嘅第二表情」（例如眨眼／張大口），要嘅係一張新畫，
  唔係裁現有 sheet 就有——呢個係俾 Keith／畫圖果邊嘅具體 spec，唔係 Cursor 要諗嘅嘢。

**⚠️ 一次性例外：`js/star-fx.js` 唔係 Claude 擁有，今次係 Keith 直接叫 Claude 踩過去做**
（見上面「而家嘅狀態」），唔代表分工表變咗——`js/star-fx.js` 嘅正常擁有人仍然係 Cursor。
今次改嘅範圍好窄：`getGlobalRanger()`（加 3 個 sparkle span）、`flyStar()`
（`star.innerHTML` 改用 `<img>`），`MUZZLE_ANCHOR`／`ensureSpaceRanger`／
`crop-ranger-shooter.py`／握拳發射邏輯**全部冇郁**。Cursor 下次改呢個檔之前
睇多一眼呢段同 git log，唔好同今次嘅改動打交。

**驗過**：`check-invariants.py`（含 `--update-image-lock`）綠、`smoke-shots.py --no-shots`
7 種尺寸全部 pass、`favicon.ico`／manifest／og-image 用 curl 200 過、Playwright 人手
screenshot 過飛星＋sparkle 兩個時間點都睇到效果（見上面第 2 點）。

### 2026-09-02 · Claude · 完成一輪慶祝畫面換 KAKA RANGER pose

- `play-finish`（認字／字母隊／數理答完一輪嗰個彈窗）個「★」大字換成
  `assets/kaka-ranger-celebrate.png`（由 reference sheet 裁「握拳比讚＋眨眼＋小星星」
  嗰個 pose，235×305、真透明底、29KB）。CSS 只加咗 `.play-finish-star img` 嘅
  sizing，原本嘅 `playFinishPop` 彈出動畫、reduced-motion 保護全部冇改。
- **同怪獸打贏動畫嘅時序**：兩樣嘢一齊由 `showPlayFinish()` 觸發（`refreshStarUI()`
  畫怪獸 `.is-defeated` 喺前，彈窗喺後），本身已經同步，冇加任何額外 glue code。
  右上角幣格會被彈窗嘅深色遮罩蒙住（設計上刻意——怪獸唔應該搶主角），
  中間彈窗嘅 KAKA RANGER 先係主慶祝畫面。
- `js/app.js` 完全冇郁，只改咗 `index.html`（play-finish 個 `<img>`）同
  `css/styles.css`（`.play-finish-star`）。呢個喺 Claude 擁有嘅「獎勵條／幣／怪獸」
  範圍入面，冇撞 Cursor 嘅 `star-fx.js`。
- iPad 5 種尺寸、iPhone 2 種尺寸都人手開彈窗核對過冇 overflow（`smoke-shots.py`
  嘅自動 walk 冇經過呢個彈窗，因為要答完成輪先觸發，暫時淨係人手驗）。

**（已跟進，見上面最新一段「Logo/favicon/分享圖 + 飛星改真圖 + 答啱 sparkle」）**：
Keith 之後直接叫 Claude 跟呢個 idea，落地做法係「頭頂爆幾粒 sparkle」而唔係「換一張
表情圖」——因為查完發現 sheet 嗰 7 個面部表情**冇戴頭盔**，同而家用緊嘅 shooter／
celebrate 圖（有頭盔）換唔到，直接疊會斷晒角色連貫性。想要真係換表情，要新畫一張
「戴頭盔嘅表情」，唔係裁而家 sheet 就有得用。

### 2026-09-02 · Cursor · KAKA RANGER 飛星接入

- **方案 (b)**：玩法頁縮圖改用 `kaka-ranger-solo.png` 衍生嘅 `space-ranger-shooter.png`，唔再手畫槍；
  飛星由**握拳**位射出（`MUZZLE_ANCHOR ≈ {x:0.279, y:0.678}`）。
- `scripts/crop-ranger-shooter.py` 改由 solo 縮放產圖，產物 meta 寫入
  `assets/space-ranger-shooter.meta.json`；`js/star-fx.js` + `css/styles.css` 激光閃光位同步。
- 主頁 hero（`chinese-hero.png`）今次**冇換**——只處理玩法頁 ranger／飛星軌跡。

### 2026-09-01 · Claude · `c5b1c23` → merge `2998374`

1. **主頁 logo 黑邊**：黑邊係烘焙咗喺 `chinese-hero.jpg` 入面（左 41／上 96／右 81／下 30px
   近黑框），唔係 CSS 問題。裁到圖畫真邊界（978×514，保住「士」字）→ 圓角殘留位用
   `cutout-bg.py` 去背 → `pngquant` 壓到 198KB → 出 `assets/chinese-hero.png`，
   `index.html` 嘅 `<img>` 更新 `width/height`。順手裁走 `phonics-hero.jpg` 頂部 23px 黑帶。
2. **怪獸守幣（試水溫版）**：一隻通用怪獸 👾（`assets/openmoji/1F47E.svg`）企喺右上角幣格
   上面，答啱一題就 `.is-hit` 抖一抖，儲夠一輪 `.is-defeated` 爆散，提示由「仲差 N 下」
   變「打贏喇！攞到一個幣」。有 `prefers-reduced-motion` 保護。
   **呢個係試水溫**：暫時全部主題共用同一隻，未分主題。等 KAKA 試玩過先決定要唔要鋪開。
3. **部署閘門漏洞**：`deploy-pages.yml` 之前淨係跑 `check-invariants`，唔跑版面回歸，
   所以 iPad 橫向主頁超出 18–26px 呢個 bug 漏咗上線。而家部署前會跑
   `smoke-shots.py --no-shots`。同時修咗嗰個 overflow（橫向矮螢幕 hero 收窄至 520px／26vh）。

### 2026-08-31 · Cursor（Keith）

- `js/star-fx.js`：太空戰士答啱由槍口射星去星星條（`MUZZLE_ANCHOR` 同
  `scripts/crop-ranger-shooter.py` 同步，改圖記得兩邊一齊改）
- 港式餐廳美食兩冊（經典小菜 15 + 茶餐廳招牌 11），真實相片喺 `assets/food-hk/`
- 主頁加禧禧小遊戲樂園外部連結
- 學習卡唔遮字修正

## 新素材：KAKA RANGER（2026-09-02）

Keith 提供咗一套新角色美術，已入 repo，`check-invariants.py` 綠：
- `assets/kaka-ranger-solo.png` —— 全身企定，真透明底，700px 寬，110KB
- `docs/design/kaka-ranger-reference-sheet.png` —— 多角度／表情／動作參考 sheet（未全部裁，
  唔係網頁用圖；已經裁咗幾個出嚟用：下面「已用」）
- `docs/design/kaka-ranger-logo-source.png` —— Keith 另外上傳嘅 logo lockup 獨立高清圖
  （446×506，比 reference sheet 入面嗰粒細圖清楚好多，白底冇透明；已經去底、裁好放
  `assets/`——下面「已用」）。**唔係網頁用圖**，淨係留返將來要重裁 logo 先用。
- `assets/kaka-ranger-celebrate.png` —— 由 sheet 裁嘅「握拳比讚＋眨眼」慶祝 pose，
  235×305、真透明底、29KB，用喺 `play-finish` 彈窗
- `assets/kaka-ranger-star.png` —— 由 reference sheet 裁嘅金色星星（sheet 本身自帶
  透明底），65×43、744B，用喺飛星特效同 ranger 頭頂 sparkle

同 Buzz Lightyear 撞衫呢一點已經同 Keith 傾過，佢決定接受、照用（`AGENTS.md` 已註明呢個
2026-09-02 決定，唔代表迪士尼／彼思禁令廢咗——將來新畫嘢仍然唔好特登臨摹）。

**已用**：Cursor 用 `kaka-ranger-solo.png` 接咗玩法頁飛星（`space-ranger-shooter.png`，
握拳發射，PR #83）；Claude 用裁出嚟嘅慶祝 pose 換咗完成一輪彈窗嘅「★」；Claude 依家呢次
再用埋星星圖（飛星＋sparkle）同 logo（favicon／icon／og:image，`assets/kaka-ranger-logo.png`
＋ `assets/icons/*` ＋ `assets/og-image.png`）（見上面「最近改動」）。**未用**：sheet 入面
仲有側面／背面／企定／揮手／指嘢／握拳噴火／背噴射／7 個裸頭表情頭像／獨立頭盔背包手套
靴部件圖未裁，留返將來要用先裁（唔好一次過全部裁晒——冇實際用途嘅圖唔好塞入 `assets/`，
靠 `check_asset_weight` 嘅 400KB／12MB 上限）。7 個表情頭像**冇戴頭盔**，同而家用緊嘅
有頭盔造型唔啱直接疊用，詳情見上面「最近改動」第 3 點。

## 全站審查（2026-09-01）

Claude 做咗一次完整審查，結果喺 **`docs/site-review-2026-09.md`** —— 按 P0/P1/P2/P3 排好，
每項有問題、量到嘅證據、建議做法同驗收條件。**Cursor 開工前睇嗰個檔，唔使喺呢度重複。**

重點三項（P0）：字形改用香港標準 + 自己 host 字體、加每隻字嘅掌握度記錄、單字讀音要有得校正。
入面有一節「我睇過但冇問題、唔好去郁」，避免順手優化整壞嘢。

## 未做／待 Keith 話事

| 項目 | 狀態 | 建議擁有人 |
|---|---|---|
| `version.json` 自動 reload（KAKA 部 iPad 冇人幫佢 hard-reload，長遠一定要） | 未開工 | Claude |
| 行星圖黑底去背（技術已驗證） | 未開工 | Claude |
| 字詞 union：13 本書有字未計入系列總數（紅輯 212→255、橙輯 183→197） | 未開工 | Claude |
| 🫎 駝鹿 OpenMoji 淨係得對角，要換圖 | 未開工 | 任一邊 |
| 已兌換記錄（唔記錄嘅話累積幣數唔誠實） | 未開工 | Claude |
| 怪獸 phase 2：每個主題一隻、原創畫、家長開關 | **等 KAKA 試玩結果** | Claude |
| ~~太空戰士造型同 Buzz Lightyear 似唔似~~ | ✅ 已決定接受（2026-09-02，見 AGENTS.md） | — |
| 每日 3 個幣（真錢）會唔會太鬆手 | **等 Keith 決定** | Keith |
| ~~答啱每一題要唔要換 ranger 反應~~ | ✅ 已做：頭頂 sparkle（下畫）+ 隨機換 4 款動作 pose（夜晚），兩次都 2026-09-02 | — |
| 純面部表情（開心／眨眼等 7 款）想真係用得到，要新畫一版有戴頭盔嘅版本 | idea，未開工 | 新畫要 Keith／畫圖果邊 |
| KAKA RANGER logo 擺喺主頁 `.brand-mark`（同而家 CSS 畫嘅 `.brand-orbit` 二揀一） | 未開工，今次冇做（範圍係 favicon／og-image） | Claude |

無人擁有／「任一邊」嘅項目，三個 agent 都可以經「進行中」認領；已有擁有人嘅唔好搶。

## 開工前／收工 checklist

三個 agent 都跟呢套（唔係淨係「兩邊」）：

```bash
git fetch origin main && git rebase origin/main   # 開工第一件事；三個 agent 都可能 push main
# 認領「進行中」→ 改嘢 → 清認領
python3 scripts/check-invariants.py               # 一定要 exit 0
python3 scripts/smoke-shots.py                    # 改過版面／CSS／遊戲流程就一定要跑；小改動（換圖／label／文案）唔使本地重跑，CI 已跑
python3 scripts/qa-report.py                      # 跟 docs/qa-check.md
# merge 入 main → Pages 自動上線 → 返嚟更新呢個檔嘅「最近改動」（署名 Cursor／Claude／Codex）
```

⚠️ 部署完，iPhone／iPad 要**閂咗個 tab 再開**先睇到新版（單純 refresh 唔夠，
`index.html` 本身會被瀏覽器 cache）。呢個就係上面 `version.json` 嗰項想解決嘅問題。

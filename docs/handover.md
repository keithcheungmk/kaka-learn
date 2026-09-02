# 交接簿 — Cursor ⇄ Claude (Cowork)

呢個 repo 由兩個 agent 平行開工：**Cursor**（喺 Keith 部機／Cloud Agent）同
**Claude (Cowork)**（喺 Anthropic cloud，經 deploy key push）。兩邊都直接 push
`main`，所以要有一個地方寫低「另一邊需要知」嘅嘢，唔係就會撞。

## 點用呢個檔

- **開工前**：`git fetch origin main` → 睇 `AGENTS.md`（硬性規則）→ 睇呢個檔（分工同地雷）。
- **merge 完之後**：喺「最近改動」加一段（日期、邊個做、改咗乜、掂咗邊啲檔）。
- 只寫另一邊要知嘅嘢：**擁有權、地雷、未完事項**。設計討論、需求分析唔好塞入嚟。
- 呢個檔唔係規則書。任何「以後都要咁做」嘅嘢要寫入 `AGENTS.md`，
  而且同時喺 `scripts/check-invariants.py` 加一個 `check_xxx()`，靠機器守住，唔好靠記憶。

## 而家嘅狀態（2026-09-02）

- `origin/main` 已含：P0 三項（字形／掌握度／讀音，PR #82）、KAKA RANGER 飛星接入（PR #83，
  握拳發射，方案 b）、依家呢次 Claude 加嘅「完成一輪」慶祝 pose（見下面「最近改動」）。

## 分工（點解要分：唔想兩邊改同一段 code）

| 範圍 | 擁有人 | 主要檔案 |
|---|---|---|
| 太空戰士造型、槍口射星動畫 | **Cursor** | `js/star-fx.js`、`scripts/crop-ranger-shooter.py`、`assets/` ranger 圖 |
| 獎勵條／幣／怪獸守幣 | **Claude** | `js/app.js` 嘅 `renderStarBars`／`renderRoundBar`／`renderCoinBar`、`js/storage.js` 經濟欄位、`.coin-*` CSS |
| 新主題內容、真實相片素材 | **Cursor** | `js/words.js`、`assets/food/`、`assets/food-hk/` |
| 《我自己會讀》字卡 OCR → `wordIds` | **Claude**（AGENTS.md 已寫死） | `docs/word-card-ocr.md`、`scripts/apply-book-cards.py` |
| 版面 no-scroll、重疊／剪裁回歸 | **Claude** | `scripts/smoke-shots.py`、`css/styles.css` 版面段 |
| CI／部署閘門／invariants | **Claude** | `.github/workflows/*`、`scripts/check-invariants.py`、`scripts/build-site.sh` |
| 圖片去背、壓縮、格式鎖 | **Claude** | `scripts/cutout-bg.py`、`assets/image-formats.lock.json`（用 `pngquant`，唔好用 Pillow `quantize()`） |

呢個分工唔係死嘅——要跨界改，喺呢度寫低就得。**但唔好兩邊同時改同一個功能。**

## 撞車高危檔案

- `css/styles.css` — 兩邊都會掂。改之前 `git fetch` + rebase，唔好用大段 rewrite，
  改細粒啲、貼住現有 selector 改。
- `js/app.js` — 同上。`renderStarBars` 一帶而家係 Claude 嘅，`flyStarToBar` 會
  delegate 去 `window.KakaStarFx.flyStarFromRanger`（Cursor 嘅），呢個 delegation
  就係兩邊嘅介面：**唔好其中一邊刪咗個 fallback**。
- `js/star-fx.js` — Cursor 擁有。Claude 只經 `window.KakaStarFx` 呼叫，唔改入面。
- `assets/image-formats.lock.json` — 換圖之後要 `python3 scripts/check-invariants.py --update-image-lock`，
  唔係 CI 會紅。

## 最近改動

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

**留低一個 idea 俾 Cursor 諗（唔係一定要做）**：答啱**每一題**（唔止完成一輪）嗰下，
要唔要連 ranger 個樣都閃一閃反應？Reference sheet 有 7 個獨立面部表情（開心／大笑／
眨眼／驚訝／認真／側面／後腦），可以裁一個「開心」出嚟，同而家嘅 `.space-ranger-shoot`
反彈 + `.space-ranger-laser-flash` 閃光同時觸發，答完自動變返握拳中性樣。

⚠️ 呢個要諗清楚先做，因為呢個係全站審查一直強調嘅原則：**呢個係識字 app，
唔可以分薄注意力去個角色度**。完成一輪先出現一次，同答啱一題就出現（一輪 8–10 次），
係完全唔同數量級嘅刺激頻率。建議 Cursor 落手前，先喺瀏覽器度切個假面部表情試睇下：
（a）喺 `.space-ranger` 而家嘅細尺寸（96–144px）表情變化實際上睇唔睇得出；
（b）0.3–0.4 秒嘅閃現會唔會同飛星動畫打交、搶走個「字」嘅注意力。如果兩樣都好，
先值得裁圖落手；如果表情細到睇唔出，就唔使做，慳返嗰啲工程時間。
呢個屬於「太空戰士造型、槍口射星動畫」範圍，係 Cursor 話事。

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
  唔係網頁用圖；已經裁咗兩個出嚟用：下面「已用」）
- `assets/kaka-ranger-celebrate.png` —— 由 sheet 裁嘅「握拳比讚＋眨眼」慶祝 pose，
  235×305、真透明底、29KB，用喺 `play-finish` 彈窗

同 Buzz Lightyear 撞衫呢一點已經同 Keith 傾過，佢決定接受、照用（`AGENTS.md` 已註明呢個
2026-09-02 決定，唔代表迪士尼／彼思禁令廢咗——將來新畫嘢仍然唔好特登臨摹）。

**已用**：Cursor 用 `kaka-ranger-solo.png` 接咗玩法頁飛星（`space-ranger-shooter.png`，
握拳發射，PR #83）；Claude 用裁出嚟嘅慶祝 pose 換咗完成一輪彈窗嘅「★」（見上面
「最近改動」）。**未用**：sheet 入面仲有側面／背面／揮手／指嘢／7 個表情頭像／KAKA RANGER
logo lockup 未裁，留返將來要用先裁（唔好一次過全部裁晒——冇實際用途嘅圖唔好塞入
`assets/`，靠 `check_asset_weight` 嘅 400KB／12MB 上限）。

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
| 答啱每一題要唔要換 ranger 面部表情（唔止完成一輪） | **idea，等 Cursor 諗**（見上面「最近改動」嗰段警告） | Cursor |

## 開工前／收工 checklist

```bash
git fetch origin main && git rebase origin/main   # 開工第一件事，兩邊都 push main
# ...改嘢...
python3 scripts/check-invariants.py               # 一定要 exit 0
python3 scripts/smoke-shots.py                    # 改過版面／CSS 就一定要跑
python3 scripts/qa-report.py                      # 跟 docs/qa-check.md
# merge 入 main → Pages 自動上線 → 返嚟更新呢個檔嘅「最近改動」
```

⚠️ 部署完，iPhone／iPad 要**閂咗個 tab 再開**先睇到新版（單純 refresh 唔夠，
`index.html` 本身會被瀏覽器 cache）。呢個就係上面 `version.json` 嗰項想解決嘅問題。

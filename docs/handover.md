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

## 而家嘅狀態（2026-09-01）

- `origin/main` = `2998374`（Merge：logo 裁黑邊 + 怪獸守幣 + 部署版面閘門）
- 已部署，`gh-pages` 15:52 更新，線上有 `assets/chinese-hero.png`、`assets/openmoji/1F47E.svg`
- `check-invariants.py` 綠、`smoke-shots.py`（5 iPad + 2 iPhone × 9 畫面）綠

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
| 太空戰士造型同 Buzz Lightyear 似唔似（AGENTS.md 有迪士尼／彼思禁令） | **等 Keith 決定** | Keith |
| 每日 3 個幣（真錢）會唔會太鬆手 | **等 Keith 決定** | Keith |

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

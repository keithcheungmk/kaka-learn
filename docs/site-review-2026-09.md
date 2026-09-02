# 全站審查（2026-09-01）— 畀 Cursor 執行嘅改進清單

審查對象：`origin/main` = `b35470b`，同線上 https://keithcheungmk.github.io/kaka-learn/ 一致。
審查人：Claude (Cowork)。執行：Cursor。

## 一句總結

工程紀律（invariants、版面回歸、部署閘門）已經好過大部分同類專案，**版面同穩定性冇大問題**。
真正值錢嘅改進唔喺 CSS，喺三樣關乎「學到嘢冇」嘅嘢：**字形標準、讀音準確度、學習記錄**。
下面 P0 三項就係呢三樣。

## 我點樣睇（唔係靠感覺，係量過）

- Playwright 行齊 認字／字母隊／數理 三條流程 × iPad 橫直 + iPhone，逐屏截圖用眼睇
- 量咗觸控目標尺寸、文字對比度、載入時間、請求數、資源重量
- 用 fontTools 逐隻字比較 Noto Sans HK 同 Noto Sans TC 嘅實際輪廓
- `node` 直接載入 `words.js` 統計字詞資料
- 所有數字下面都會寫明點量出嚟，唔同意就自己再量一次

---

## P0 — 影響「學唔學得啱」，建議優先做

### P0-1 字形要用香港標準，同埋自己 host 字體

**問題（兩件事，一齊解）**

1. `index.html` 用 `Noto Sans TC`（台灣標準字形）。KAKA 學緊認字，返學會見到嘅係**香港教育局字形**。
2. 字體由 `fonts.googleapis.com` 即場攞。網絡差／離線／Google 唔通，成個 app 跌返系統預設字，
   字形同排版即刻變樣。我喺沙盒度連唔到 Google Fonts，`<strong>拖或撳</strong>` 就即場疊咗字 —
   即係網絡差嗰陣 KAKA 會見到同一件事。

**證據**

用 fontTools 把 app 實際用到嘅 **1042 個漢字**喺 Noto Sans HK 同 Noto Sans TC 逐隻 render 出嚟比像素：

| 差異程度 | 字數 | 佔比 |
|---|---|---|
| 有任何差異 | 172 | 16.5% |
| 中度以上 | 152 | 14.6% |
| **明顯唔同** | **81** | **7.8%** |

差異最大嗰批：房 蝙 鯊 嘴 請 讀 啟 體 扇 片 銷 窗 廣 於 葉 邊 圾 飯 鄰 標

唔係隨機分佈 —— 集中喺**部件**上面：`言`（請、讀、話、說…）、`戶`（房、啟、扇…）、
`食`（飯、飲…）、`金`、`虫`、`魚`。即係一個部件寫法唔同，就一次過影響幾十個字。

**建議做法**

1. 字體改做 **Noto Sans HK**（`@fontsource/noto-sans-hk`，npm 有）。
2. 唔好用 CDN，subset 之後放入 `assets/fonts/`。我量過：
   **1042 個字全部包晒，一個 weight 只係 378KB**（woff2）。兩個 weight ≈ 760KB。
   `assets/` 而家 6MB，上限 12MB，容得落。
3. `--font-body` / `--font-display` 加返系統 fallback：`"Noto Sans HK", "PingFang HK", system-ui, sans-serif`。
   就算自己個檔都掛咗，iPad 都會用蘋方，唔會跌到去 Helvetica。
4. `check_no_build_step()` 嘅 `allowed` 清單（`check-invariants.py:73`）刪走
   `https://fonts.googleapis.com` 同 `https://fonts.gstatic.com`。
   （呢個 check 本身冇壞 —— 佢係**特登**放行咗字體 host。但佢個 docstring 寫住
   「保持離線友好」，而放行字體 host 就正正令佢唔離線友好。自己 host 之後，
   呢兩行就冇存在理由，刪咗個 check 先真係守到佢想守嘅嘢。）

**驗收**

- 關咗 wifi 開 app，字形同開 wifi 時一模一樣
- Network 面板見唔到任何 `fonts.g*` 請求
- `assets/` 總重量仍然 < 12MB，`check-invariants.py` 綠

**注意**：呢個 subset 要跟住字詞資料走。加新字之後 subset 冇咗嗰隻字就會變豆腐。
所以要順手加 invariant：把 `words.js` 全部字丟入字體 cmap 對一次，缺字就 fail。

---

### P0-2 加「每隻字嘅掌握度」，出題要偏向未識嘅字

**問題**

`js/storage.js` 而家淨係記 `totalStars`、`coinsToday`、`roundProgress`（**每日清零**）。
`js/app.js` 嘅 `pickTarget()` 只避開**今輪**已答啱嘅字（`playWonIds`）。
答錯嘅處理喺 `app.js:866 / 968 / 1159` —— 淨係加 `.wrong` class 震 450ms，**一個字都冇記低**。

後果，三個都係真嘢：

1. KAKA 已經識到滾瓜爛熟嘅「月亮」同佢次次答錯嘅「雲朵」，**被抽中嘅機會一模一樣**。
   練習時間平均分俾 698 個字，最需要練嗰啲反而練得最少。
2. 你冇辦法答到「KAKA 而家識幾多個字」呢條問題。App 唔知，你唔知。
3. 紅輯／橙輯係「讀完書考吓佢」，但考完嘅結果冇留低，下次考等於由零開始。

**建議做法**

`storage.js` 加一個欄位（記得升 `economyVersion` 同寫遷移，唔可以整爛已有資料）：

```js
wordStats: {},  // { [wordId]: { right: 0, wrong: 0, streak: 0, lastRightDay: '2026-09-01' } }
```

- 答啱／答錯都寫（答錯而家完全冇記，呢個係關鍵）
- `pickTarget()` 加權：`streak === 0` 權重最高，`streak >= 3` 權重最低（但唔好去到 0，要保持複習）
- 家長區加一版：**識咗 N 個字**、最需要練嘅 10 個字、每個主題嘅掌握度

**驗收**

- 連續答錯同一個字三次，之後三輪佢出現次數明顯高過其他字
- 家長區數得出「識咗幾多個」，同 localStorage 對得上
- 清空 localStorage → 舊格式資料 → 新格式，`coinsTotal` 唔會變 0（跟返 2026-08 遷移嗰次嘅做法）

**排序建議**：呢項同 P0-1 邊個先做都得，但呢項要改 `storage.js` 同 `app.js` 出題邏輯，
係三項入面最容易寫壞嘅，做之前起碼要有 P2-5 嗰個單元測試。

---

### P0-3 單字讀音冇得校正（多音字會讀錯）

**問題**

`words.js` 每條字詞得 `{id, term, isDeer, emoji, badge, plate}` —— **冇讀音欄位**。
讀音 100% 交俾 Web Speech API 自己估。

而 **698 條字詞入面有 245 條係單字（35%）**，主要嚟自紅輯／橙輯字卡。
單字係 TTS 最容易讀錯嘅情況（冇上下文），而入面已經有確認嘅多音字：

| 字 | id | 應該讀 | 有機會讀錯做 |
|---|---|---|---|
| 長 | `chang_long` | coeng4（長短） | zoeng2（長大） |
| 重 | `zhong` | zung6（重） | cung4（重複） |
| 分 | `fen_share` | fan1（分開） | fan6（一分） |
| 教 | `jiao_teach` | gaau3 | gaau1 |
| 少 | `shao` | siu2 | siu3 |
| 好 | `hao` | hou2 | hou3 |

4 歲跟住 app 讀，讀錯咗會記住，之後好難改返。

**建議做法**

1. `words.js` 加**選填** `say` 欄位：唔填就照讀 `term`，填咗就餵 `say` 落 TTS。
   `say` 可以係加咗上下文嘅詞（例：`長` → `say: '好長'`；`分` → `say: '分開'`），
   呢招唔使改 speech engine 就即刻準好多。
2. `check-invariants.py` 加一條：一張已知多音字清單，凡係單字而又喺清單入面，**必須有 `say`**。
3. 家長區加粒「呢個字讀錯咗」，撳咗記入 localStorage，你之後一次過補 `say`。

**驗收**

- 上面六個字喺 iPad 上面聽落係正確讀音（呢一步一定要喺真機聽，CI 驗唔到）
- 冇 `say` 嘅字行為完全冇變

---

## P1 — 明確嘅缺陷，唔難修

### P1-1 OpenMoji 404：`assets/openmoji/1F6F0.svg` 唔存在

`js/math-app.js:30` 有 `const COUNT_EMOJIS = ['⭐','🌙','🚀','🪨','💫','🛰️']`，
但 `1F6F0.svg` 冇補圖，數理數一數會 404（會 fallback 做系統 emoji，唔會爛，但風格唔統一）。

**點解閘門冇攔到**：`check_openmoji_coverage()` 只掃 `words.js` 同 `phonics-words.js` 嘅資料，
**冇掃 `math-app.js`、`app.js`、`index.html` 入面硬寫嘅 emoji**。

**做法**：補 `1F6F0.svg`，同時把 invariant 改成掃全部 `js/*.js` + `index.html` 嘅 emoji 字面值
（正則 `\p{Extended_Pictographic}`），唔再只信字詞資料。

**驗收**：故意喺任何一個 js 加一個未補圖嘅 emoji，`check-invariants.py` 要 fail。

### P1-2 太空戰士小圖係一格「相入相」，唔係人物去背

聽一聽／砌一砌左下角嗰張 ranger 縮圖，喺 app 嘅星空上面睇落好似貼咗張相落去。
查過原因：`assets/space-ranger-shooter.png` 係 192×192、RGBA，**但淨係 6.2% 透明 ——
透明嘅只有四隻圓角**。即係話張圖仲帶住 hero 原圖嘅星雲底同「士」「戰」字嘅碎片，
變成 app 星空之上再有一片自己嘅星空。

**做法**：要嘅係**人物本身**去背，唔係去邊。

⚠️ **唔好用 `scripts/cutout-bg.py`** —— 佢係由四邊 flood fill 食單色背景，
呢張底係花俏星雲，行唔通（最多再食走幾隻角）。要麼由原圖重新摳圖，
要麼用 subject-removal 工具（例如 `rembg`）出一張淨係人物嘅 PNG。

出完圖：`pngquant` 壓（**唔好用 Pillow `quantize()`**，1-bit alpha 會出黑邊），
再 `python3 scripts/check-invariants.py --update-image-lock`。

**驗收**：透明比例應該去到 50% 以上；app 嘅星空由人物周圍透晒出嚟，
見唔到第二片星雲、見唔到「士」「戰」碎片。

### P1-3 同一個玩法有三個名

| 位置 | 叫法 |
|---|---|
| 揀玩法卡 (`index.html:165`) | 睇圖 |
| 遊戲畫面標題 (`index.html:211`) | 配一配 |
| 幣進度條 | 配 |
| AGENTS.md | 配一配 |

4 歲建立緊「呢個遊戲叫咩」嘅概念，三個名等於三個遊戲。

**做法**：全部統一做 **配一配**（AGENTS.md 已經係咁叫），揀玩法卡副標寫「睇圖，揀漢字」。
字母隊 (`index.html:297`) 一樣要改。

### P1-4 未賺到嘅幣格同淡色格，實測睇唔到

量到嘅對比度（WCAG 標準最低 4.5:1）：

| 元素 | 顏色 | 對比度 |
|---|---|---|
| `.coin-face` 未賺狀態 | `#4c637f` on `#22344f`，11–14px | **2.03:1** |
| `.build-ghost` 淡色格 | `rgba(226,232,240,.28)` | **1.51:1** |

`.coin-face` 係成個獎勵系統嘅門面，未賺到嗰陣近乎隱形，KAKA 唔知有嘢等緊佢攞。
`.build-ghost` 更加關鍵 —— 佢係配對支架，**睇唔到就唔成立**，喺 iPad 日光下好可能完全消失。

**做法**：
- `.coin-face` 未賺狀態改做虛線金色圈 + 睇得清嘅模式字（聽／配／砌），唔好靠填色
- `.build-ghost` alpha 由 `0.28` 調到 `0.45`–`0.5`

**注意**：`.build-ghost` **唔可以刪**（AGENTS.md 硬性規則、invariant 會攔）。呢度只係調透明度。

**驗收**：`.build-ghost` 對比度 ≥ 3:1；同 KAKA 喺窗邊／出面試一次。

### P1-5 `version.json` 自動 reload（一直拖住嘅嗰項）

`index.html` 本身會俾瀏覽器 cache，所以部署完，iPhone／iPad 要**閂咗個 tab 再開**先見到新版。
KAKA 部 iPad 冇人幫佢做呢件事 —— 即係佢有機會長期用緊舊版。

**做法**：`build-site.sh` 產出 `version.json`（放 commit SHA），前端每 5 分鐘 + 每次 `visibilitychange`
fetch 一次（`cache: 'no-store'`），SHA 唔同就 `location.reload()`。
一定要喺遊戲畫面**唔好**中途 reload，只喺主頁／揀主題頁 reload，否則會打斷佢玩緊嗰輪。

**驗收**：部署後唔掂部 iPad，5 分鐘內自己變新版；玩緊砌一砌唔會突然跳走。

### P1-6 太空戰士造型（要你決定，唔好自己改）

主頁 hero 同 ranger 縮圖：綠白太空衣、胸口翼形徽章、紫色配件 —— 同 Buzz Lightyear 好似。
`AGENTS.md` 白紙黑字寫住「唔用迪士尼／彼思名稱、角色或素材」。

而家係自相矛盾：規則寫咗唔用，但畫出嚟嘅嘢好接近。要你話事係
（a）接受，順手放寬 AGENTS.md 條文；定係（b）重畫 —— 換色系（藍／橙）、
去走胸口翼徽、改頭盔造型，就可以保住太空主題而唔似。

**Cursor 唔好自己動手改造型**，等 Keith 決定咗先。

---

## P2 — 體驗上值得做

### P2-1 iPad 橫向留白太多，最重要嘅「字」反而唔夠大

先學一學（1194×834）：卡片得中間三分一，上下大片空白，而**插圖圓碟仲大過個漢字**。
呢個係認字 app —— 個字應該係全屏最大嘅嘢。

**做法**：橫向（`orientation: landscape`）改兩欄：左圖右字，漢字 `font-size` 提到
`min(30vh, 22vw)` 左右，插圖縮細。揀玩法頁同樣有大片死位，三張卡可以放大。

**注意**：改完一定要 `python3 scripts/smoke-shots.py`，5 種 iPad 一個都唔准要捲。

### P2-2 指示文字太長，而且同一屏講兩次

砌一砌上面：「睇圖，由下面字池拖或撳啱嘅字，按順序砌入淡色格」（22 字），
下面又有一句「由左到右，砌啱每個字」—— 講緊同一件事，兩段都佔位。
而 4 歲根本讀唔到，呢兩句其實係寫俾家長睇。

聽一聽仲有「（冇圖，靠認字）」呢種註解喺小朋友畫面。

**做法**：小朋友畫面留一句短嘅（例：「拖字入格」），家長註解移去家長區或者第一次玩先彈一次。
慳返嘅高度直接俾 P2-1 嘅大字用。

### P2-3 揀主題頁見唔到進度

21 個主題排晒喺度，但邊個玩過、邊個掌握咗、邊個未掂過，一眼睇唔出。
做完 P0-2 之後，每張卡加一個掌握度小圈就得（例：18/24）。順便可以按「未掂過／練緊／識晒」排。

### P2-4 中文句用咗半形標點

`index.html` 第 257、270、309、323、337 行（字母隊嗰邊）用咗半形 `,`，中文版用全形 `，`。
全 repo 一共 12 處（`index.html` + `js/*.js`）。
一次過掃乾淨，順手喺 `check-invariants.py` 加一條：中文字後面唔准跟半形 `,` `.` `!` `?` `:` `;`。

### P2-5 獎勵經濟係真錢，但零測試

`storage.js` 嘅 `earnCoinForMode()`、每日上限、換日重置、`economyVersion` 遷移 ——
呢啲直接關係到你要俾幾多真錢。而家**冇任何單元測試**，全靠人手試。
（提你：上次 `economyVersion` 遷移就係因為睇錯 merged state，一開始完全冇行過。）

**做法**：`scripts/test-storage.mjs`，用 node 內建 `assert`，唔使裝任何嘢：
新用戶、賺一個幣、同日再賺（應該唔加）、換日重置、舊格式遷移、`roundProgress` 存取。
`ci.yml` 加一步 `node scripts/test-storage.mjs`。

---

## P3 — 知道就得，唔急

- **每個 emoji 一個 SVG 請求**：揀主題頁一次 46 個 resource。實測首頁 DOMContentLoaded 264ms、
  首屏 630KB —— 完全唔慢，所以唔使做。將來字詞去到雙倍先考慮 sprite。
- **三個 app 各抄一份**：`app.js`(1760) / `phonics-app.js`(927) / `math-app.js`(1196)，
  `shuffle`、輪次、發聲各自寫一次。而家 work，唔值得為重構冒險。
  **但加第四個玩法時唔好再抄第五份** —— 抽 `js/round.js` 出嚟共用。
- **禧禧小遊戲樂園**同三個學習入口一樣大、一樣顯眼，而佢係跳出 app 嘅外部連結。
  KAKA 好容易一開機就撳咗去玩遊戲。建議縮細、放底、或者擺入家長區。
- **`index.html` 有死碼**：`#stars-today-label`、`#coins-label`、`.star-icon` 呢啲初始 markup
  一開機就被 `renderCoinBar()` 覆蓋走，永遠見唔到。清走，唔好誤導下一個改嘅人。
- **字詞 id 用普通話拼音**（`chang_long`、`xigua`、`pingguo`）—— 一個粵語 app 用拼音做 key，
  改資料嗰陣要用普通話思考。698 條全部改名唔值得，記住就算。

---

## 我睇過但**冇問題**、唔好去郁

免得 Cursor 「順手優化」整壞嘢：

- **觸控目標尺寸夠**。實測 iPad 橫向 build-tile 90×98、build-slot 84×96；
  iPhone 393 寬都有 77×84 / 71×79。全部過 44px 標準，唔使加大。
- **載入效能好**。DOMContentLoaded 264ms、19 個請求、630KB。唔使做 lazy-load／code split。
- **字詞資料乾淨**：698 條、0 個重複詞形、0 條缺 emoji、冇簡體字。
- **無捲版面達標**：實測全部遊戲畫面 `over=0`，只有揀主題頁要捲（規則容許）。
- **速度／音高已經調過**（`rate 0.9 / pitch 1.05`，單字 `0.82`），唔好隨手改。
- **`.build-ghost` 淡色格唔准刪**，只准調透明度（AGENTS.md + invariant）。
- **`js/star-fx.js` 係 Cursor 地盤，`renderStarBars` 一帶係 Claude 地盤**，
  兩邊介面係 `window.KakaStarFx` —— 唔好刪 `flyStarToBar` 個 fallback。見 `docs/handover.md`。

---

## 建議次序

1. **P1-1、P1-2、P1-3、P1-4、P2-4** —— 細、獨立、改完即刻睇到，先清呢批熱身
2. **P2-5**（storage 單元測試）—— 係 P0-2 嘅安全網，一定要喺 P0-2 之前
3. **P0-1**（字體）—— 純加嘢，唔郁邏輯，風險最低嘅 P0
4. **P0-2**（掌握度）—— 最大改動，有咗測試先做
5. **P0-3**（讀音）—— 資料工程，可以慢慢分批填 `say`
6. **P1-5**（version.json）、**P2-1／P2-2**（版面）
7. **P1-6**（造型）—— 等 Keith 話事

## 每一步做完

```bash
python3 scripts/check-invariants.py    # 一定要 exit 0
python3 scripts/smoke-shots.py         # 郁過 CSS／版面就一定要跑
```

新規則要**同時**寫入 `AGENTS.md` 同 `check-invariants.py`（加 `check_xxx()`），唔好靠記憶。
merge 完返去更新 `docs/handover.md` 嘅「最近改動」。

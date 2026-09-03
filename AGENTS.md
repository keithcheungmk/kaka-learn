# AGENTS.md — kaka-learn

給 Cursor／Claude／Codex／自動化 agent 嘅專案指引。

> **開工前必須睇 `docs/handover.md`** — Cursor、Claude (Cowork)、Codex (ChatGPT)
> 三個 agent 共用呢個 repo。嗰度寫住而家嘅分工、進行中認領、撞車高危檔案、同未完事項。
> 收工／merge 完記得返去更新。

## 專案係乜

幼兒繁體中文認字網頁（KAKA，約 4 歲）。粵語家庭、iPad 優先、亦要適合 Mac mini + TV 大掣操作。

## 硬性約束

- 所有 app 程式碼只可以寫喺本 repo（kaka-learn）。`keith-ops` 只係建議／營運筆記，唔好把遊戲實作放過去。
- 動物核心 24 個繁體表面形必須保留（唔好改「老虎／獅子／大象」做單字、唔好加「麋鹿」取代鹿種）：

  鹿、梅花鹿、馴鹿、駝鹿、馬鹿、狗、貓、魚、鳥、兔子、羊、牛、馬、豬、熊、獅子、老虎、大象、猴子、雞、鴨、青蛙、昆蟲、龍

- 動物園／小動物可再加有清楚 emoji 嘅動物（例如熊貓、駱駝、樹熊、蝙蝠、刺蝟…）；駝鹿用 🫎；馬鹿用 🦌＋badge「馬」。
- 另有可擴充主題（繁體表面形 + 系統 Emoji），例如：
  - 紅輯：對齊《我自己會讀》紅輯溫習（212 詞，自成完整主題；書面語詞形如小狗、餅乾、鼻子、鞋子；按 12 本書名分組，揀書先溫）
  - 橙輯：對齊《我自己會讀》橙輯溫習（181 詞，自成完整主題；入面再按 12 本書名分組，揀書先溫；`books[]` 框架紅輯都可用，待紅輯書名字卡）
  - 數字：一至十
  - 顏色：紅色、黃色、藍色、綠色、白色、黑色、紫色、粉紅、橙色、咖啡色
  - 相反位置：大、小、多、少、長、短、高、矮、上、下、前、後、左、右、裏面、外面（學習頁成對並排；聽／配考試係「揀相反」二揀一；左邊固定大／多／長／高／上／前／左／裏面）
  - 天氣：太陽、月亮、雲朵、下雨、雪花、大風、閃電、彩虹
  - 自然：星星、天空、花、草、樹、海、沙、火、葉
  - 交通：汽車、巴士、火車、飛機、輪船、單車、的士、電車、地鐵、摩托車、消防車、救護車、警察車
  - 身體：眼睛、耳朵、鼻子、嘴巴、手、腳、頭、心
  - 情緒：開心、不開心、生氣、害怕、驚喜、害羞
  - 身體感覺：累、餓、飽、渴、痛、熱、冷、香、臭
  - 家庭：爸爸、媽媽、爺爺、婆婆、哥哥、姐姐、弟弟、妹妹、寶寶
  - 食物：白飯、湯麵、麵包、蛋、牛奶、蛋糕、水、果汁、雪糕、餅乾、糖果、三文治、漢堡包、薄餅、薯條、雞肉、牛肉、豬肉、羊肉、肥牛、蝦、蟹、海鮮（牛肉／豬肉／羊肉／肥牛用真實相，見 `assets/food/`）
  - 學校用品：書本、鉛筆、間尺、書包、足球、積木
  - 地方：屋企、學校、課室、公園、遊樂場、商場、超市、街市、圖書館、停車場、沙田、醫院、消防局、警察局、機場、海灘、餐廳、廁所、泳池
  - 屋企：廚房、睡房、浴室、陽台、床、枕頭、被子、椅子、桌子、沙發、衣櫃、抽屜、電視、冰箱、洗衣機、電風扇、冷氣機、電話、時鐘、燈、門、門鎖、窗戶、垃圾桶、相框、地毯、洗手台、水龍頭、拖鞋（廁所喺地方；屋企用浴室；唔收客廳）
  - 日常用品：毛巾、牙刷、牙膏、鏡子、梳子、理髮、洗頭水、沐浴露、口罩、眼鏡、水壺、紙巾、杯子、碗、湯匙、筷子、叉子、盤子
  - 水果：蘋果、香蕉、橙子、葡萄、西瓜、草莓、芒果、菠蘿、桃、檸檬、櫻桃、奇異果
  - 蔬菜：番茄、紅蘿蔔、玉米、白菜、茄子、青椒、薯仔、洋蔥、蘑菇、黃瓜、豌豆、南瓜
  - 港式餐廳美食（用真實相，見 `assets/food-hk/`；兩冊：經典小菜 15 + 茶餐廳招牌 11）：肥牛烏冬、咕嚕肉、打邊爐、椰子、麥樂雞、肉醬意粉、雲吞麵、腸粉、燒賣、魚蛋、奶茶、菠蘿油、蕃茄炒蛋、蒸魚、蒸水蛋、干炒牛河、叉燒飯、蛋撻、西多士、蝦餃、牛腩麵、凍檸茶、海南雞飯、糯米雞、公仔麵、煎釀三寶
  - 職業：醫生、護士、老師、校長、消防員、警察、廚師、司機、農夫、機師、空中服務員、太空人、牙醫、獸醫、科學家、畫家、音樂家、運動員、巴士司機、的士司機、建築工人、工程師、髮型師、環境保護主任、醫療銷售代表、郵差、救護員、售貨員、收銀員、保安、清潔工人、家務助理、救生員、動物園飼養員、船長、漁夫、送貨員、攝影師、侍應、藥劑師、園丁、軍人、演員、記者、圖書館管理員（難明概念用雙 emoji，如 🚌🧑；環保主任用 ♻️🕵️；保安用 🚪🧑；漁夫用 🎣🧑；救生員用 🏊🛟；動物園飼養員用 🦁🧑）。主題用 `books[]` 分「身邊人／大世界」兩冊先溫。
  - 恐龍：暴龍、三角龍、梁龍、劍龍、翼龍、副櫛龍、甲龍、速龍、恐龍蛋（用彩色復原圖，見 `assets/dino/`）
  - 衣物：衫、褲、裙、鞋、襪、帽、頸巾、手套
  - 昆蟲小生物：蝴蝶、蜜蜂、螞蟻、甲蟲、蜘蛛、蝸牛、毛毛蟲、蜻蜓
  - 海洋動物：鯊魚、鯨魚、八爪魚、水母、海龜、海星、小丑魚、魷魚

- 無登入、廣告、追蹤、寫字練習、故事模式、真實付款／AEON API。
- UI 用繁體中文；主題係原創「**太空戰士學院**」（中文太空冒險；唔用迪士尼／彼思名稱、角色或素材）。動物主題仍保留鹿等字詞內容。
  **2026-09-02 決定**：KAKA RANGER 呢套角色美術（`assets/kaka-ranger-solo.png`、`docs/design/kaka-ranger-reference-sheet.png`）
  喺配色（綠／白／紫）、胸口翼形徽章、頭盔側燈呢幾樣設計上同 Buzz Lightyear 相當接近——呢個已經同 Keith
  傾過，佢知道呢一點，決定接受用（個人非商業學習網站）。**呢個係經過討論嘅例外，唔代表上面條規則廢咗**：
  新畫嘅素材（例如將來嘅怪獸、其他角色）仍然唔好特登照住迪士尼／彼思設計臨摹；改呢件事要再問過 Keith。
- 漢字顯示用 **self-hosted Noto Sans HK**（`assets/fonts/`）；`js/words.js` 加新字／新 `say` 後要跑 `python3 scripts/build-font-subset.py` 再 commit 產物。

## 點樣跑

```bash
python3 -m http.server 5173
# 開 http://localhost:5173

python3 scripts/check-invariants.py   # 硬性約束檢查，merge 前一定要 exit 0
python3 scripts/qa-report.py         # 預填檢查報告（配合 docs/qa-check.md Fast review ≤10min）
bash scripts/build-site.sh _site test # 模擬部署產物（可選）
```

詳見 `README.md`。Cloud Agent 預覽：repo 內 `.cursor/environment.json` 會自動開 `Preview` terminal（同上埠）。

## 架構速覽

| 檔案 | 職責 |
|------|------|
| `index.html` | 共用 landing（認字／字母隊／數理入口）+ 各 app 自己嘅 screens |
| `js/words.js` | 字詞資料 + 系統 Emoji 插圖（iPhone Apple Color Emoji） |
| `js/phonics-words.js` / `js/phonics-app.js` | 卡卡字母隊 |
| `js/storage.js` | `localStorage` 鍵 `kaka-learn-v1`：按小朋友 Profile（卡卡／禧禧）分倉；舊單一資料遷移入卡卡 |
| `js/speech.js` | `speechSynthesis`（優先 `zh-HK`）+ Web Audio 短音 |
| `js/app.js` | 認字模式循環、Profile／進度頁、星星動畫 |
| `css/styles.css` | 太空／小鹿視覺、大 tap target |
| `css/phonics.css` | 字母隊氛圍層 |
| `js/math-storage.js` / `math-skills.js` / `math-app.js` + `css/math.css` | 小鹿數理探險（Phase A hub；`kaka-math-v1`） |
| `docs/math-brief.md` / `docs/math-build-plan.md` | 數理規格同開工計劃 |
| `scripts/check-invariants.py` | **機器版硬性約束**（24 動物、build-ghost、storage 分家、故障隔離、asset 404、圖片大細）；CI 同部署都會跑 |
| `scripts/build-site.sh` | 砌 `_site`：預設複製全部檔案（排除 docs/scripts/.github），並自動用 commit SHA 蓋過 `?v=` |
| `scripts/cutout-bg.py` | 去背：flood fill 把連住邊界嘅單色背景變透明（恐龍相用咗） |
| `assets/image-formats.lock.json` | 鎖住每張圖真實格式／透明度，防止去背圖被壓成實色底 |
| `js/emoji-art.js` + `assets/openmoji/` | emoji → OpenMoji SVG（插圖層；資料唔使改） |
| `scripts/smoke-shots.py` | 5 種 iPad 尺寸行足全程：溢出／白屏／404／console error + 截圖 |
| `scripts/apply-book-cards.py` + `data/book-cards/*.json` | 字卡相片 → 書本 wordIds（見 `docs/word-card-ocr.md`） |
| `docs/qa-check.md` | 檢查 agent 規則（merge 前中文檢查報告；通過就直接 merge／部署，唔好叫用戶檢查） |

## 數學（小鹿數理探險）— 故障隔離（可共用 landing）

- 規格以 `docs/math-brief.md` 為準；未寫明前唔好實作完整小學課程或操卷平台。
- **可**喺同一個 `index.html` landing 加數理入口同 `screen-math-*`；但 `math-app.js` 必須獨立初始化（`try/catch`），掛掉時認字／字母隊仍可用。
- **禁止**數理依賴 `words.js`／`app.js`／`phonics-*` 題目或畫面 API；三套遊戲 state 互唔寫。數理用 `kaka-math-v1`。
- Phase 1 只打底：數數、比較、形狀、分類、規律、位置、序數；**面試小試**屬 Phase 2+，要家長開關。
- 教學借 CPA（具體物／圖 → 好遲先符號）；每日短 session；答錯溫柔、無羞恥。
- 視覺：同一小鹿太空宇宙，但數理更彩、更卡通——八色技能星球＋**數理專用更 Q 導遊小鹿**＋短飛行動畫。每屏以當前星球主色為主 + 金星塵；唔另起品牌、唔抄迪士尼／彼思／外部平台角色；唔硬鎖關、唔用星星買關卡。
- Agent：修某個 app 嘅 bug 唔好順便改另外兩個；回歸時確認其他入口仍可進入。

## 改動時注意

- **唔使再手動改 `?v=` 版本號**。部署時 `scripts/build-site.sh` 會用 commit SHA 蓋過全部；`index.html` 保留 `?v=` 佔位就得。
- **加新 root 檔（manifest、sw.js、favicon…）唔使改 workflow**，`build-site.sh` 預設複製全部。
- **改完一定要 `python3 scripts/check-invariants.py` 跑到綠**。加新硬性規則時，順手喺呢個檔加一個 `check_xxx()`，等下次唔使靠記憶。
- 單張圖 ≤ 400KB、`assets/` 總共 ≤ 12MB（檢查器會攔）。
- **`assets/dino/*.png` 係去背圖（帶透明背景）**，由 `scripts/cutout-bg.py` 處理，喺深色卡上直接浮住。
  唔好當普通 JPEG 重壓（透明會變實色底，diff 睇唔出）；要壓用 `pngquant`（保留柔邊 alpha），
  唔好用 Pillow `quantize()`（1-bit alpha，會出黑邊）。
  `assets/image-formats.lock.json` 鎖住每張圖嘅真實格式同 alpha；有意換圖先跑
  `python3 scripts/check-invariants.py --update-image-lock`。

- **獎勵規則（2026-08 改版）：完成一輪 = 1 個 AEON 幣；聽一聽／配一配／砌一砌各自一日一個，最多 3 個。**
  舊規則（每日 10 星上限、幣 = `floor(totalStars/10)`）已廢除——一輪係 8–10 題，
  舊規則玩到一半就滿咗、第二輪一粒都冇，對 4 歲係動力斷崖。
  星星仍然計（`totalStars`／`starsToday`）但只做紀錄，唔再係兌換單位。
  未完成嘅輪次會記入 `roundProgress`（key = 玩法|主題|書），中途走咗返嚟接得返，換日清空。
  舊資料遷移：`coinsTotal = floor(totalStars / 10)`，KAKA 已賺嘅幣唔可以蒸發。
- **字詞掌握度**：`storage.js` 嘅 `wordStats` 記每字 `{right, wrong, streak}`；答啱／答錯都寫入，`pickTarget()` 會偏向未識字。改 schema 要更新 `scripts/test-storage.mjs`。
- **多音字讀音**：`words.js` 可選填 `say`；TTS 用 `say || term`。畫面同聲音要一致，所以單字「長」只可以讀「長」，唔好用「好長」消歧義；若裝置 TTS 讀音唔準，應改用固定粵語音檔。`check-invariants.py` 有已知多音字清單，單字必須有 `say`。
- 模式 B 必須維持「先撳字 → 再撳圖」。
- **砌一砌淡色格（`.build-ghost`）係配對支架，唔係洩題。** 目標係活動學習：睇圖 → 喺字池搵同一個字 → 拖／撳入格；靠重複移動嚟認字形。唔好刪淡字、唔好改成空白考試格。字池要留干擾字，等卡卡真係要揀。
- **遊戲畫面一屏到底，唔准捲。** 只有「主頁／揀主題／揀書／字母隊揀主題」准上下捲（純瀏覽、唔涉拖曳）。
  尺寸用 `min(px, vw, vh)` 跟住視窗高度縮；橫向嘅砌一砌係兩欄（左圖右字池）。
  真改版面／CSS／遊戲流程：本地一定要跑 `python3 scripts/smoke-shots.py`（CI 都會跑 5 種 iPad + 2 種 iPhone），iPad 要捲就係 blocker。
  小改動（換圖／label／文案）唔使本地重跑 smoke，見下面「小改動快徑」。
  手機（≤700px 闊）准捲——鎖死唔捲會剪走內容；但任何尺寸都唔准元素重疊。
  ⚠️ 唔好喺遊戲畫面嘅 flex 子元素落 `min-height: 0`：空間唔夠時容器會塌陷，仔元素爆出嚟疊住下一格。
- **插圖用 OpenMoji**（`assets/openmoji/*.svg`，CC BY-SA 4.0）**＋淺色圓碟**。
  OpenMoji 係為淺色底設計，519 個圖形有 120 個係黑色線條（筷子、雪花、螞蟻、蝙蝠…），
  直接放喺深藍板上會消失。`.emoji-img` 嘅圓碟就係托住佢哋，**唔可以刪**（`check-invariants` 會攔）。`words.js` 嘅 `emoji` 欄位仍然係唯一資料來源；
  `js/emoji-art.js` 負責 emoji → SVG（檔名＝去走 U+FE0F 嘅 codepoint，大寫 hex，`-` 連），揾唔到就跌返系統 emoji。
  **加新字／新主題記得補圖**，`check-invariants.py` 嘅 `openmoji` 會攔。
- **獎勵條（`renderStarBars`）一條 bar 兩個樣**：遊戲畫面 = 今輪進度（8 或 10 格）→ 幣；
  其他畫面 = 今日三個幣位（聽／配／砌）+ 下一個嘅進度。唔好溝埋一齊（之前「今日 1/10 + 可換 3 枚」
  兩段訊息打交就係咁嚟）。
- **答啱要飛星**（`flyStarToBar`）：由圖卡飛去進度條下一格，落地先亮。
  呢個係「我做啱 → 我近咗」嘅因果連繫，唔好改返做原地閃一閃。
- **粵語聲音要係女聲**：`speech.js` 有女聲優先名單（自動揀，唔使家長區）。
  唔好改返「攞第一個 zh-HK」——iPadOS 更新會令佢變咗男聲。
- 全頁**鎖死放大縮細**（iPad 螢幕 pinch 同妙控鍵盤觸控板 pinch 都唔好放大遊戲）。砌練習以撳為主，拖係額外。
- 砌一砌每放入一格就**讀嗰個字**；砌完成個詞再讀一次成個詞。
- **雙小朋友 Profile**（卡卡／禧禧）：開 app 先揀頭像；幣／wordStats／主題已過／數理星球按人隔離。舊 `kaka-learn-v1`／`kaka-math-v1` 單一資料歸入卡卡，禧禧由空白開始。暫唔要 PIN。主流程可「換小朋友」。儲存 id 仍然係 `heihei`（唔好改，會斷進度）。
- 鹿類重點**預設開**（抽題加權）；家長區已撤所以冇掣改。
- 學習頁**「去玩玩」常駐**（唔使揭完所有卡先出）。睇完最後一張之後掣文改「學完喇・去玩玩」並加強樣式；誤撳「再睇一次」都唔可以隱藏。換主題／書先重置。`#learn-finish-row` 唔好預設 `hidden`；CSS 要守住 `[hidden]{display:none!important}`，唔好俾 `.btn-row { display:flex }` 蓋走。
- 認字玩法完一輪（答錯唔計、唔清零；同一題再試，答啱先算；unique 字先計，優先出未答啱過嘅字）：
  - **聽一聽／配一配**：答啱 **8 個字**，或而家主題／書**全部字**（少過 8 個就全清）。
  - **砌一砌**：砌啱 **10 個字**，或而家主題／書**全部字**（少過 10 個就全清）。淡色格 `.build-ghost` 係支架，唔好刪。
  - 完結要粵語「今輪玩完喇」+ 短慶祝，再揀再玩或返主題。唔好無限出題。
- 揀玩法頁用三張圖卡（聽一聽／配一配／砌一砌），標題統一叫「配一配」（副標先寫「睇圖，揀漢字」），字母隊入口一樣。令卡卡唔使靠讀長句子先知點玩。
- 保持單頁、無 build step（純靜態 + ES modules），除非產品明確要求框架。
- **小改動快徑**（換圖、改 2 個 label、文案微調；唔改 layout／CSS／遊戲流程）：本地 `check-invariants.py` 綠 + GitHub CI 綠 → 即刻 merge（唔好叫 Keith QA）。證據一張改動畫面截圖。**唔使** demo 片、computerUse、本地重跑 `smoke-shots.py`（CI 已跑）。新漢字仍要 font subset；唔好跳過 CI。真改版面／CSS／遊戲流程仍要完整 computerUse + 片 + 本地 smoke。詳見 `docs/qa-check.md` Fast review。
- **唔好叫產品擁有人親自檢查或確認先部署。** 跟 `docs/qa-check.md`：push 後跑 `qa-report.py` → 檢查 agent 補視覺（≤10 分鐘、禁預設 computerUse）→ 「可以 merge」就 merge 入 `main`（Pages 自動上線）→ 之後先知會做咗咩。

## 《我自己會讀》書卡用字規則（紅輯／橙輯…）

呢度係「讀完書溫習」嘅模式，同其他主題（教詞）唔同：

- **學習卡以該書實體認字卡上實際出現嘅詞／字／短語為準**（唔好預設一定係單字；紅⑪《小明和氣球》等卡上係詞／短語，JSON 要 `"allow_words": true`）。認字卡係最準依據，好過書名／主題推測。
- **重複唔使理**：同一個字跨書出現、或者同一張卡重複，都正常，照收（App 入面同一字一個 entry 就得）。
- **收到字卡相片就以字卡為準**，覆寫嗰本書嘅 `wordIds`；未收到嘅書暫時用推測，標明待校對。
- **字卡相片一律由 Claude（Cowork）讀，唔好叫 Codex／Cursor 讀字卡相。** 流程、自檢規程、JSON 格式見 `docs/word-card-ocr.md`；落地一定要用 `scripts/apply-book-cards.py`（會攔簡體、形近字、非單字、錯 id），唔好手改 `wordIds`。
- 已對過字卡嘅書會有 `verified: true` 同 `cardSource`；冇呢兩個 field 就即係仲係推測。
- **字卡顯示**：大漢字＋讀音；可配個簡單 emoji 做裝飾，但唔使為單字／短語強求詞形或貼圖。
- 其他主題（動物、食物…）維持教「詞＋emoji」，唔受呢條影響。

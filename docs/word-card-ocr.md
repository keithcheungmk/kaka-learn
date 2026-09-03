# 字卡相片 → words.js（OCR 流程）

《我自己會讀》每本書後面嘅實體**認字卡**係最準嘅依據。呢份文件定義：相片點樣變成 `js/words.js` 入面嘅字，而且**唔會靜靜哋出錯**。

## 點解要有呢個流程

之前用 Cursor 直接做，出過以下問題：

| 失敗模式 | 徵狀 | 呢個流程點解決 |
|---|---|---|
| 認錯形近字 | 己／已／巳、未／末、天／夭 撈亂 | 易混字清單自動標出，要求返去再睇張相 |
| 出咗簡體 | 「个」「问」「书」入咗繁體 app | `SIMPLIFIED` 表直接攔截並報出正確繁體 |
| 靠書名／主題估內容 | 卡上冇嘅字被加咗入去 | **只信卡**；script 用實際卡覆寫，多咗嘅會列出「移除」 |
| 收咗詞但 JSON 冇 allow_words | 卡上係「氣球」等詞／短語卻當單字報錯 | 詞／短語要 `"allow_words": true` |
| 寫錯 id、指去第二個字 | app 顯示嘅字同卡唔同 | id ↔ term 交叉驗證，唔啱即刻停 |
| 靜靜哋寫壞 words.js | 之後先發現，唔知邊次改壞 | dry-run 先出 diff；寫完再跑硬性約束檢查 |

核心分工：**模型只負責睇相出 JSON；所有 mapping、覆寫、校驗由死板 code 做。** 模型有錯，code 會攔；code 唔會估。

## 邊個做邊步

1. **Keith**：影字卡相（見下面拍攝要求），上載去 Claude（Cowork）對話。
2. **Claude**：睇相 → 逐張核對（下面自檢規程）→ 寫 `data/book-cards/<book_id>.json`。
3. **Script**：`python3 scripts/apply-book-cards.py <json>` 出 dry-run 報告 → Keith 睇過 → 加 `--write` 落地。
4. **檢查**：`python3 scripts/check-invariants.py` 要 exit 0 → 交 branch → Cursor merge。

> ⚠️ **唔好叫 Cursor 讀字卡相。** Cursor 側嘅 agent 唔一定有視覺能力，容易靠書名推測。相片一律入 Cowork。

## 拍攝要求（提高一次過成功率）

- 一張相影一版卡就夠，**唔好斜**、唔好反光、字要對正鏡頭。
- 每本書分開影，講低係邊本（或者影埋書面）。
- 卡有正反面／有讀音就一齊影，方便核對。
- 太多卡就分幾張相，講低順序。

## Claude 嘅自檢規程（每次都要做齊）

1. **第一輪**：逐張卡讀出**卡上實際表面形**（字／詞／短語都照寫），順住卡嘅次序寫低。
2. **數卡**：講出「我見到 N 張卡」，同 Keith 講嘅數目對數；唔夾就即刻講，唔好硬砌。
3. **第二輪反查**：由寫低嘅名單**倒返去相**逐個確認位置——呢步係捉「幻覺加字」嘅關鍵。
4. **易混字放大再睇**：己已巳、日曰目、未末、天夭、千干、士土、人入八、大太犬、木禾、白自、買賣、問間聞、清青情請晴…
5. **繁簡檢查**：見到簡體即刻標出，唔好自己「順手轉」就當睇到。
6. **只信卡**：書名、主題、原有推測**都唔可以**影響判斷。相入面冇嘅字，就係冇。
7. **睇唔清就講**：寧願標「呢張睇唔清，請重影」，都好過估。

## JSON 格式

`data/book-cards/<book_id>.json`（`_` 開頭嘅檔會被 `--all` 跳過）：

```json
{
  "book": "rb_qiqiu",
  "series": "red_series",
  "source": "2026-08-30 字卡相片 12 張",
  "note": "第 7 張反光，已重影",
  "cards": [
    { "char": "我" },
    { "char": "的" },
    { "char": "找", "id": "zhao" }
  ]
}
```

- `cards` 順序 = 字卡順序；同一個字重複出現照寫，script 自動去重。
- 一個字對到多過一個 id 先要寫 `"id"`；平時唔使。
- 卡上實際係詞／短語（唔係單字）就要加 `"allow_words": true`。紅輯／橙輯以卡上表面形為準，唔好預設一定係單字。

## 指令

```bash
python3 scripts/apply-book-cards.py data/book-cards/rb_qiqiu.json               # dry-run，睇 diff
python3 scripts/apply-book-cards.py data/book-cards/rb_qiqiu.json --write       # 落地
python3 scripts/apply-book-cards.py --all --write --sync-topic                  # 全部 + 補主題總表
python3 scripts/check-invariants.py                                             # 一定要 exit 0
```

寫入之後，該書會加上 `verified: true` 同 `cardSource`，一眼睇得出邊本已經對過字卡、邊本仲係推測。

## 遇到「words.js 未有呢個字」

Script 會直接印出可以貼嘅 entry 樣板：

```js
{ id: '<拼音>', term: '己', isDeer: false, emoji: '', badge: '', plate: '#2a2a35' },
```

單字卡規則（AGENTS.md）：**大漢字 + 讀音**為主，emoji 淨係做裝飾，唔使為單字硬砌詞形或者貼圖。id 用拼音；撞名就加後綴（例如 `ji_howmany`）。加完再跑 `check-invariants.py`——`word-data` 會確認冇撞 term、冇死 id。

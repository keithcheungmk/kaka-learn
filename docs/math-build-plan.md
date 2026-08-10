# 小鹿數理探險 — 開工實作計劃

依據 `docs/math-brief.md`。目標：共用 landing、故障隔離、先出可點入嘅 hub，再逐星加玩法。

---

## 總覽（由細到大）

| Phase | 產出 | 驗收 |
|-------|------|------|
| **A — 骨架** | landing 入口、hub、storage／skills | ✅ |
| **B — 水星可玩** | 先學 +「數一數・揀數」；答啱攞數理星；5 題點亮水星 | ✅ |
| **C — 點亮＋飛行** | `warp-hop` 建議下一星；Hub「飛去下一粒」；已點亮標記加強 | ✅ |
| **D — 擴星** | 金星／地球…逐粒加玩法 | 下一刀 |
| **E — 打磨** | 動畫、家長開關、面試小試 | 最後 |

---

## Phase A 細節（今次做）

### 檔案

```
docs/math-build-plan.md   # 本計劃
css/math.css
js/math-storage.js        # kaka-math-v1
js/math-skills.js         # 8 星球資料
js/math-app.js            # IIFE + try/catch；只做 hub ↔ home
index.html                # 入口掣 + math screens + script 標籤
```

### 行為

1. Landing 加「小鹿數理探險」掣（同認字並列；唔改壞 phonics orbit）。
2. Hub：顯示當前星球（主色）、Q 鹿佔位、星球名、「出發（即將開放）」／返主頁。
3. `math-app.js` 頂層 `try/catch`；缺 DOM／資料只 `console.error` + disable 入口。
4. 唔讀寫 `kaka-learn-v1` 遊戲進度；唔呼叫 `app.js`／phonics 題目 API。

### 刻意未做（A）

- 真正先學／考試循環  
- 飛行動畫、星球點亮邏輯（只預留資料欄）  
- 家長區數理開關  
- 精緻 SVG 小鹿（先用 CSS 圓潤佔位）

---

## Phase C 細節（已做）

1. 水星首次點亮 → 飛過場 overlay（火箭＋星塵氣氛）→ 可「飛過去」金星或「繼續玩呢粒」。  
2. Hub：已點亮顯示 ✨；若已點亮且有下一粒，顯示「飛去ＸＸ」。  
3. 旅程卡：已點亮有金邊／標籤。  
4. **唔硬鎖**：隨時可返舊星／睇旅程揀第二粒。

---

## Phase B 預告（下一刀）

1. Hub「出發」→ `screen-math-learn`（數數星 3–5 張）。  
2. → `screen-math-play` → `screen-math-count`（聽／顯示 N 個物件，揀數字泡泡）。  
3. 答啱：`cheer-burst` + 粵語鼓勵；可選寫數理自己嘅每日星（同上限 10，鍵在 `kaka-math-v1`）。  
4. 仍然唔動認字 `tryEarnStar`。

---

## 風險同做法

| 風險 | 做法 |
|------|------|
| 同 phonics 搶 `.screen` active | math 自用 `showMathScreen`；返 home 時清 math active |
| script 順序 | `math-storage` → `math-skills` → `math-app` 最後載；失敗唔影響已載嘅 app／phonics |
| CSS 污染 | 全部掛 `.math-screen` / `#screen-math-*` 前綴 |

---

## Agent 守則（開工時）

- 只動數理相關檔 + landing 入口；唔「順便」改字詞／phonics。  
- 每完成一個 Phase 就 commit；預覽 `http://localhost:5173` 撳數理入口。

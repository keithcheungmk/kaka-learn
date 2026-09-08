# Codex（ChatGPT）接手 brief — 小鹿數理

> **日期：** 2026-09-08  
> **由：** Cursor（案已收工）  
> **交俾：** Codex / ChatGPT  
> **Repo：** `keithcheungmk/kaka-learn`  
> **Live：** https://keithcheungmk.github.io/kaka-learn/  
> **`main` tip：** `6b2449d`（PR #107 merged + Pages deployed）

開工前請：`git fetch origin main && git checkout main && git pull`，再睇 `AGENTS.md` 同本檔；認領寫入 `docs/handover.md`「進行中」。

---

## 1. Cursor 已收工（唔使重做）

| PR | 內容 | 狀態 |
|----|------|------|
| #104 | Montessori M1 操作底層 + 水星火箭入油 | ✅ live |
| #105 | M2 Sprint3 太空補給五題混合 +（其後撤走）金星公平分享 + M7/M8 | ✅ live（公平分享已撤） |
| #107 | 金星改睇鐘（模擬＋電子）；火星形狀＋規律；月球空位 | ✅ live |

### 而家可玩星球

| 星球 | `planet id` | 主題 | 入口 |
|------|-------------|------|------|
| 水星 | `count` | 數數／太空補給任務 | `math-mercury-missions.js`；經典數感後備仍在 |
| **金星** | `time` | **睇鐘**（模擬鐘＋電子鐘，整點／半點） | `openVenusLearn` → 揀鐘面／揀電子鐘 |
| 地球 | `compare-size` | 加法能量方塊 | `additionGame.js` |
| **火星** | `shape` | **形狀・推理**（揀形狀＋AB/ABC 缺格） | `openMarsLearn` → 揀形狀／補規律 |
| 月球 | `moon` | **即將開放**（空位） | hub／galaxy 顯示即將開放 |

### 重要決定（Keith）

1. 金星舊「邊多邊少／公平分享」**唔啱** → 已刪；**唔好加返**。
2. 睇鐘由月球遷去金星；**要有電子鐘**（對齊香港小一面試入門）。
3. 內容對齊 **香港小一／面試** 水準（比純幼階難少少）。
4. 火星：**形狀同推理一齊做**（而家係形狀名＋缺格規律）。
5. 月球暫時空位，等之後再定主題。

### 儲存注意

- 睇鐘進度 id 仍係 **`time`**（舊月球已點亮會跟住金星）。
- 載入時會清走舊 `compare-qty`；`currentPlanetId === 'compare-qty'` → 遷去 `time`（見 `js/math-storage.js`）。

---

## 2. 建議 Codex 下一刀（任揀／Keith 再指）

未認領 backlog（寫入「進行中」先開工）：

1. **金星睇鐘加深（P1）**  
   - 一刻（`:15` / `:45`）可選；暫**唔好**做逐分。  
   - 學習卡／測驗可加強「模擬鐘 ↔ 電子鐘」對照說話。  
   - 主要檔：`js/math-app.js`（`clockItem`／`VENUS_TIME_LEARN_CARDS`／`openTimeQuiz`）、`css/math.css`、`index.html`。

2. **火星形狀／推理加深（P1）**  
   - 多啲規律型（AABB、ABA、顏色＋形狀混合，仍要幼齡可玩）。  
   - 形狀可加「睇名揀圖」第二玩法。  
   - 主要檔：`js/math-app.js`（`MARS_*`／`makePatternRound`）、`css/math.css`。

3. **月球新主題**（而家 `id: moon` 空位）  
   - Keith 未定主題；定咗先實作。唔好擅自塞返「睇鐘」。

4. **木星／土星等**（分類、規律星球佔位）  
   - 規格見 `docs/math-brief.md` Phase 1；火星已用咗一部分「規律」玩法，擴星時避免同火星重複到亂。

5. **Phase E／面試小試**  
   - `docs/math-brief.md`：家長開關、面試格式；屬較後階段。

6. **清理 orphan**（可選小改）  
   - `css/math.css`／`math-manipulatives.css` 可能仍有舊金星比較／balance 選擇器。  
   - `js/math-manipulatives.js` 仍有 `mountBalanceBoard`（無人掛載）。  
   - `js/math-mastery.js` 仍有 `compare-qty.fairShare` label。  
   - 清之前認領；唔好誤刪而家金星睇鐘用緊嘅 `.math-venus-say` 等 class。

---

## 3. 硬性規則（簡記）

- 跟 `AGENTS.md`：故障隔離（`math-app.js` try/catch）、`kaka-math-v1` 分 Profile、遊戲畫面 iPad 唔准捲。
- 數理 manipulative **原生 emoji**（`.math-native-emoji`），唔用 OpenMoji／`KakaEmojiArt`。
- Merge 前：`python3 scripts/check-invariants.py` 要綠；版面／流程改要跑 `smoke-shots.py`（家庭裝置預設）。
- **唔好搶**：Claude 嘅 OCR／CI／獎勵條／image lock；Cursor 嘅 `star-fx.js`——除非 Keith 開口。
- 開工認領、收工更新 `docs/handover.md`「最近改動」並清認領。

### 關鍵檔

```
js/math-app.js          # 金星睇鐘、火星形狀／規律、水星／地球 wiring
js/math-skills.js       # 星球 id／skill／blurb
js/math-storage.js      # litPlanetIds、compare-qty 遷移
js/math-mercury-missions.js
js/math-manipulatives.js
js/math-mastery.js      # M7/M8
index.html              # screen-math-venus-*、mars-*、time
css/math.css
docs/math-brief.md
docs/math-build-plan.md
docs/handover.md
```

### 點跑

```bash
python3 -m http.server 5173
python3 scripts/check-invariants.py
node scripts/test-math-storage.mjs
node scripts/test-math-mastery.mjs
python3 scripts/smoke-shots.py --no-shots
```

---

## 4. Cursor 收工宣言

呢單「金星內容撤換 → 睇鐘＋電子鐘；月球空位；火星形狀＋推理」案 **Cursor 已完成並上線**。  
之後數理擴星／P1 加深／月球新主題，請 **Codex（ChatGPT）認領後接手**；Cursor 唔再佔用呢批檔，除非 Keith 再叫返。

署名：**Cursor** · 2026-09-08

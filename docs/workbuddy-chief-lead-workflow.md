# WorkBuddy Chief Lead workflow（設計提案，2026-11-19）

> 狀態：**已生效**（2026-11-19 上線）。治理真源係 `AGENTS.md` + `docs/handover.md`；本檔係_workflow_ 設計真源。
>
> 陣容（Keith 2026-11-19 最終指示）：**WorkBuddy（Chief）＋ Cursor 兩方**；**Codex 已退出**，Grok 只係唯讀顧問。
>
> 參考：Lauren Tan（@poteto，SpaceXAI Grok Bot 工程主管）公開分享嘅三層 agent 編組、信任金字塔同「作者唔批准自己 work」。本項目規模唔同（一套幼兒學習網、兩方協作、token 有限），所以係**取其原則、縮細執行**，唔係照抄 11,000 PR／日嗰套。

## 1. 設計原則（點解咁做）

| Lauren Tan 原則 | 喺 kaka-learn 點落地 |
|---|---|
| Chief of staff 唔寫 code，只拆單、分派、追蹤 | WorkBuddy 做 Chief，預設只統籌；執行交 Cursor／三位專科 Lead（字卡 OCR 除外，由 Chief 主責） |
| 信任金字塔：codebase + 靜態檢查最強，人手審查最弱 | 已有 `check-invariants.py`（58 項）＋ node 測試 ＋ CI 做地基；Keith 只喺 live「玩」，唔睇 diff |
| 寫 code 嘅 agent 唔批准自己嘅 work | 執行者自測後，Chief 用**證據**（測試輸出／invariant／截圖）做獨立驗證，唔信口述 |
| 審證據唔審 diff | 驗證看測試輸出、invariant 結果、受影響頁畫面；Keith 看 live 網址 |
| 同一問題被糾正 3 次 → 變成 lint／rule，唔好再寫多句文件 | 寫入 `scripts/check-invariants.py` 新增 `check_xxx()`，交机器守住 |
| 信任曲線：新 agent 由低風險任務開始 | 新執行者先接「單檔、可還原、唔掂共享檔」嘅任務，驗證穩定先放共享檔 |
| Skill =  bottles 入面嘅管理哲學，做一次就沉淀 | 已有 6 個 `.workbuddy/skills/`；重複流程沉澱成 skill，唔每次重新教 |

## 2. 三層協作模型

- **協調層（Chief = WorkBuddy）**：解讀 Keith 需求、界定方向同邊界、拆單、認領表管理、獨立驗證、整合、部署協調、向 Keith 回報。**唔寫 code**（例外見 §6）。
- **執行層**：
  - Cursor 及其三位本機專科 Lead（Math／English／Chinese）— 科目內容同相關測試。
  - WorkBuddy 只喺無其他執行者可用且任務低風險時先降落執行（見 §6）；**字卡相片辨讀（OCR）係 Chief 主責**（內容核實，唔係寫 code，見 `docs/word-card-ocr.md`）。
  - **Codex 已退出（Keith 2026-11-19）**：唔再認領、唔署名。
- **編排層（playbooks）**：按任務類型固定流程，唔即興（見 §4）。

Grok 維持外部唯讀顧問、唔認領、唔 push；亦非現行 project 執行方。

## 3. 任務生命週期（七步）

1. **Keith 派工** — 只講方向同想要嘅結果；Chief 唔問執行細節、唔開 AskQuestion 揀批次（跟現有 `AGENTS.md`）。
2. **Chief 拆單** — 判斷任務類型（fix／content／ui／跨科共享），界定邊啲檔、有冇跨模組風險、要不要視覺檢查。跨兩科／共享 state／Profile／獎勵／CI／部署由 Chief 親自整合。
3. **認領** — 喺 `docs/handover.md`「進行中（認領）」加行，寫執行者名；同一批檔同一時間只一人寫。
4. **產出 + 自測** — 執行者對 `source-materials/` 核實內容 → 跑相關測試 + `check-invariants.py` → commit（訊息講 why）。
5. **獨立驗證關卡** — Chief 用證據驗：invariant／測試輸出、受影響頁 iPad 直／橫 + iPhone 畫面（只喺有版面改動時）；唔過就退回，執行者再修。**作者唔批准自己**。
6. **上線** — CI 綠 → fast-forward／merge 入 `main` → 等 Pages → 核對公開站 `version.json` 對上 commit SHA、相關資源 HTTP 200。
7. **回報** — 更新 handover（最近改動 + 清認領）→ 回覆 Keith **只交可撳網址**。Keith 喺 live 玩；唔滿意再講，再改再部署。

## 4. Playbooks（固定流程，唔即興）

| 類型 | 固定步驟 |
|---|---|
| `fix`（bug） | 重現 → 搵根因 → 修 → 加回歸測試 → 驗證唔再現 |
| `content`（教材／字卡／故事） | 對 `source-materials/` 原檔 → 產出衍生資料 → 核對內容無教錯 → invariant → 上線 |
| `ui`（介面改動） | 列受影響畫面 → 改 → iPad 直／橫 + iPhone 定向 smoke → 上線 |
| `refactor`（重構） | 先記低現有行為 → 改 → 證明行為不變 → 上線 |
| `shared`（跨科／共享檔） | Chief 親自認領 + 整合；唔委派并行寫 |

## 5. 驗證關卡：信證據，唔信口述

Chief 唔需要逐行睇 code。驗證看呢啲嘢：

- `python3 scripts/check-invariants.py`（exit 0）
- 今次範圍相關測試（`node scripts/test-*.mjs`／`python3 scripts/test-*.py`）
- 有版面改動：受影響頁喺 iPad 直／橫 + iPhone 無重疊／裁切；無版面改動就唔做視覺巡查（跟 2026-10-29 Keith 測試範圍更新）
- CI 綠、live `version.json` 對 SHA、HTTP 200

**重要限制**：項目現行規則係「三位 Lead 如需新增或委派任何下屬 agent，須先同 Keith 討論取得明確批准」。所以獨立驗證**唔係**自動開一個全新 verifier agent，而係由 Chief 親自睇上述證據。若 Keith 批准，日後可以先開專責 verifier agent，到時先係完整 Lauren Tan 式「另一組 agent 驗收」。

## 6. Chief 可唔可以寫 code？

Lauren Tan 嘅純潔版本係「Chief 永遠唔寫」。但本項目得兩方、token 有限，死守會浪費。折衷：

- **預設**：Chief 唔寫，只統籌同驗證。
- **例外**：無其他執行者可用、且任務屬低風險（單檔、可一分鐘還原、唔掂共享高危檔）時，Chief 可以親自做。
- **底線**：即使 Chief 自己寫，都要過同一道獨立驗證；唔可以「自己寫自己批」。呢個底線唔讓步。

## 7. 糾正轉規則（3 strikes → invariant）

任何錯誤如果被人糾正第三次：

1. 唔好再喺 `AGENTS.md` 加一句提醒；
2. 改喺 `scripts/check-invariants.py` 加一個 `check_xxx()`，令下次直接 build 紅；
3. 更新 `docs/handover.md` 記低呢條規則嘅來源。

呢個係 Lauren Tan 最有價值嘅一句：「每次糾正 agent，諗下點樣變成 deterministic check，而唔係再加多句 rules」。

## 8. 要改嘅治理檔（待 Keith 確認先做）

生效需要同步改以下檔案，避免「文件講一套、實際做另一套」：

| 檔案 | 改咩 |
|---|---|
| `AGENTS.md` | Chief Lead 由 Cursor 改 WorkBuddy；更新 §Agent 團隊與 routing、並列的角色表、共享檔 owner |
| `docs/handover.md` | 標題／「邊個係邊個」表／分工表／認領規則／最近改動加一段交接記錄 |
| `docs/workbuddy-bootstrap.md` | 「你唔係 Chief Lead」改成「你係 Chief Lead」；開工／收工加拆單同驗證步驟 |
| `CLAUDE.md`／`CODEX.md`／`GROK.md` | 涉及 Chief 稱呼嘅句子同步 |
| `.cursor/agents/*.md` | 三位 Lead 的上報對象由 Cursor Chief 改 WorkBuddy Chief（如適用） |

2026-11-19 補充：Keith 再指示 Codex 退出，項目收窄為 WorkBuddy＋Cursor 兩方；`CODEX.md` 轉退役聲明、OCR owner 轉 WorkBuddy、invariants 加「Codex 已退出」sentinel。

改完跟住做：`check-invariants.py` → commit → CI 綠 → fast-forward `main` → 對 live `version.json` → 交可撳網址。

## 9. 同 Lauren Tan 原始方法嘅差異（誠實講清楚）

- **規模**：佢係 10–20 個 agent 并行、一個月 11,000 PR；我哋係兩方協作、一套比其他細好多嘅網站。唔追求并行數量。
- **形式驗證**：佢用 TLA+／Lean／property-based UI test；本項目未用，亦未必值得。地基仍然係 invariants + 測試 + 定向 smoke。
- **verifier agent**：佢係「另一組 agent 驗收」；我哋受限於項目批准規則，暫時由 Chief 睇證據代替。
- **Chief 寫 code**：佢完全唔寫；我哋留低風險例外（§6）。
- **自動合併**：佢喺 реlease 後跑 fuzz 同自動 merge；我哋仍然人手快轉 `main` + 等 CI + 對 live，唔自動 merge。

## 10. 生效條件

1. Keith 確認角色交接方式（WorkBuddy 完全接任 Chief？定係同 Cursor 分工？見§8）。
2. 確認後 WorkBuddy 改治理檔、跑 invariants、commit、push `main`、對 live `version.json`。
3. 更新 handover，清認領，交可撳網址。
4. 之後按 §3–§7 運作；每三日全站回歸一次，其餘只做受影響範圍定向驗證。

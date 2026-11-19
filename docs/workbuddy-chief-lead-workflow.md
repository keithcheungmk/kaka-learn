# Cursor Chief ＋ WorkBuddy token 接棒（workflow，2026-11-19）

> 狀態：**已生效（2026-11-19 更正）**。治理真源係 `AGENTS.md` + `docs/handover.md`；本檔係 workflow 設計真源。
>
> 陣容：**Cursor（常任 Chief）＋ WorkBuddy（token 接棒）**；**Codex 已退出**；Grok 唯讀顧問。
>
> Keith 用法：平時喺 Cursor 做；**Cursor token 用盡就轉 WorkBuddy 接續**。所以 WorkBuddy **唔係**永久 Chief——永久 WorkBuddy＝Chief 會令「有 Cursor token 嗰陣」流程錯位。

## 1. 角色

| 角色 | 邊個 | 做乜 |
|---|---|---|
| 常任 Chief | **Cursor** | 拆單、routing、共享檔整合、部署協調、指派三位 Lead |
| Token 接棒 | **WorkBuddy** | Keith 轉用時臨時代理 Chief＋執行；更新 handover 交返點 |
| 專科執行 | Cursor 三位 Lead | Math／English／Chinese |
| 顧問 | Grok | 唯讀建議 |

## 2. 接棒生命週期

1. Keith 喺 Cursor 做到 token 盡（或主動切 WorkBuddy）。
2. Keith 開 WorkBuddy，可貼 `docs/workbuddy-bootstrap.md`，交代接續。
3. WorkBuddy：`git fetch` → 讀 handover 認領／未完 → 臨時代理 Chief 繼續做到完結＝live 或可交接點。
4. 上線證據：invariants／CI／live `version.json`（**唔靠口述**）。
5. 收工：handover 清認領或標「下一位：Cursor」；只交可撳網址。
6. Cursor 恢復：Cursor Chief 讀 handover 接返，唔重複做已 live 嘅嘢。

## 3. 驗證（信機器，唔做人閘）

- 預設獨立驗證＝**CI 綠 + live `version.json` 對 SHA**。
- 有版面改動先定向 smoke（跟 `docs/qa-check.md`：代表 viewport；唔好每次強制三裝置等人批）。
- 唔好設「等 WorkBuddy／Cursor 人手批准先准 push」——會違反完結＝live。

## 4. Playbooks（同前，縮寫）

| 類型 | 固定步驟 |
|---|---|
| fix | 重現 → 根因 → 修 → 回歸測試 → 上線 |
| content | 對 source-materials → 衍生資料 → 內容核對 → invariant → 上線 |
| ui | 列受影響頁 → 改 → 定向視覺 → 上線 |
| shared | 當值 Chief 認領整合；唔並行搶寫 |

## 5. 3 strikes → invariant

同一錯被糾正第三次：寫入 `scripts/check-invariants.py` 嘅 `check_xxx()`，唔好只加多句 AGENTS 提醒。

## 6. 同舊稿差異

- 舊稿（同日稍早）：WorkBuddy 永久 Chief → **已作廢**。
- 現稿：Cursor 常任 Chief；WorkBuddy 只係 quota／token 接棒。
- Codex 仍然退出。
- OCR：當值 agent 做，必須 `apply-book-cards.py`；唔綁死永久 WorkBuddy owner。

## 7. Lauren Tan 原則點用

取其「證據＞口述、錯誤沉澱成機器檢查、唔靠人睇 diff」；**唔**照抄「Chief 永遠唔寫 code／另一組 verifier agent」——兩方＋token 接棒場景下，當值工具要能直接做到 live。

# 模型及 token 指引（kaka-learn）

> **2026-11-23 Keith 批方向，WorkBuddy 起草。** Cursor／WorkBuddy 開工前照跟。
> 目標：用最平嘅 model 做到嘢、少 error、少來回。呢個 project 嘅難點向來唔係「想得唔夠深」，係「有冇驗證過」。

## 1. 邊類工用邊檔模型

| 任務類型 | 檔次 | 例子 |
|---|---|---|
| 文件、改名、翻譯、清單整理 | **最平 flash 級** | 寫 guide、整理 handover 條目、更新章節清單 |
| 改 code＋跑測試＋截圖驗證 | **中階**（均衡／DeepSeek flash 級） | 加章節、修 CSS、接入 CI、Playwright 實測 |
| 難 bug、跨模組整合、架構決定 | **高階推理，限時用** | 語音生命周期、hit region 對位、共用 state |

- 旗艦／極致（1.0x）呢個 repo 用唔着；80% 時間留喺中階以下。
- 免費／限時 model 只用喺**零風險讀取任務**（總結、定位），唔好第一次就交 commit＋push。
- 「夜間折扣」倍率有時間窗，日間實際扣費可能高過選單顯示；對數以結算頁為準。

## 2. 開工前預檢

```bash
bash scripts/dev-preflight.sh
```

檢查：`git fetch` 後有無落後 `origin/main`、python3／node／gh auth／playwright、port 5173、未提交改動。有 WARN 先處理再開工，唔好開工一半先發現環境爛。

## 3. 讀取紀律（最大節省位）

- **唔好整份讀 `docs/handover.md`**（1500+ 行）；用關鍵詞（章節名／PR 編號／檔名）定位，再讀嗰幾段。
- 一次對話做一件事，做完開新對話；新對話只帶 3 行結論，唔帶全文。
- 讀 skill（如 `skills/kaka-listen-find/SKILL.md`）好過自己摸成個模組。
- 交**結論**唔交 diff；Keith 驗收＝喺 live 玩，唔係 chat 入面 code review。
- 截圖夠用就好（1180×900 級），唔好 4K 全頁。

## 4. 任務卡格式

每次開工講明三行：

```
範圍：只改 X 檔
驗收：跑 Y 測試；live version.json 對新 SHA
不准動：Z
```

一次叫 agent 做五件事，佢會中途漏兩件，然後要重講——省 token 最好嘅方法係範圍明確。

## 5. 交付前四步（同 Outcome 完結定義一致）

1. `python3 scripts/check-invariants.py` exit 0。
2. 今次範圍相關測試綠（版面測試要有截圖證據，唔好只話「covered by tests」——先確認 CI 真係 call 到）。
3. commit → push → CI 綠 → 合入 `main`。
4. live `version.json` 對上該 SHA、相關資源 HTTP 200；回覆只交可撳網址。

## 6. 加新章節／新頁面嘅固定次序

先寫 scene 圖＋資料 → 本地跑相關 layout 測試**睇截圖** → 先開 PR／merge。2026-11-22 嗰次 3+1 排版直接上線，就係漏咗「本地跑一次、睇一眼截圖」呢步。

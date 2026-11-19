# CODEX.md（已退役）

> **Codex 已退出 kaka-learn（Keith 2026-11-19）：** Keith 唔再訂閱 Codex，項目净係 **WorkBuddy（Chief）＋ Cursor** 兩方做。本檔只作歷史存檔，**唔好再當 Codex 係現行協作者、owner 或署名**。新工作請看 **[AGENTS.md](./AGENTS.md)** 同 **[docs/handover.md](./docs/handover.md)**。

舊規則（已失效，保留只供追溯）：

- 規則同 Cursor／Claude 共用一份：見 **[AGENTS.md](./AGENTS.md)**。
- 開工前／收工後要睇同更新 **[docs/handover.md](./docs/handover.md)**。
- 喺交接簿「最近改動」署名 **Codex** —— **已失效**；而家署名净係 `WorkBuddy` 或 `Cursor`。
- 全局 Chief 而家係 **WorkBuddy**（Keith 2026-11-19）；跨科／共享檔由 WorkBuddy 拆件整合。
- 開工第一件事：`git fetch origin main`。
- 改共享／高危檔之前，喺 handover「進行中（認領）」表認領；做完清走。同一批檔唔可以兩個人同時改。
- 字卡 OCR —— **已轉 WorkBuddy 主責**（見 `docs/word-card-ocr.md`），唔再係 Codex／Claude。

Merge 前必須跑：

```bash
python3 scripts/check-invariants.py   # 硬性約束（要 exit 0）
```

檢查報告格式見 `docs/qa-check.md`。

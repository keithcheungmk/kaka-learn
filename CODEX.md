# CODEX.md

規則同 Cursor／Claude 共用一份：見 **[AGENTS.md](./AGENTS.md)**。
開工前／收工後要睇同更新 **[docs/handover.md](./docs/handover.md)**。

- 喺交接簿「最近改動」署名 **Codex**（唔好簽 Cursor／Claude）。
- 開工第一件事：`git fetch origin main`。
- 改共享／高危檔之前，喺 handover「進行中（認領）」表認領；做完清走。同一批檔唔可以兩個人同時改。
- 唔好讀《我自己會讀》字卡相——OCR 仍然係 Claude Cowork。
- 唔好未問 Keith 就改 Claude 嘅 OCR／CI／獎勵條／image lock，或者 Cursor 嘅 star-fx。

Merge 前必須跑：

```bash
python3 scripts/check-invariants.py   # 硬性約束（要 exit 0）
```

檢查報告格式見 `docs/qa-check.md`。

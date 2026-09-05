# CLAUDE.md

規則同 Cursor 共用一份：見 **[AGENTS.md](./AGENTS.md)**。
交接而家係三方：Cursor ⇄ Claude (Cowork) ⇄ Codex (ChatGPT)，見 `docs/handover.md`。

Merge 前必須跑：

```bash
python3 scripts/check-invariants.py   # 硬性約束（要 exit 0）
```

檢查報告格式見 `docs/qa-check.md`。

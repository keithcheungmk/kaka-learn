# CLAUDE.md

規則同 Cursor 共用一份：見 **[AGENTS.md](./AGENTS.md)**。
交接而家係三方：Cursor ⇄ Claude (Cowork) ⇄ Codex (ChatGPT)，見 `docs/handover.md`。

Merge 前必須跑：

```bash
python3 scripts/check-invariants.py   # 硬性約束（要 exit 0）
```

檢查報告格式見 `docs/qa-check.md`。

## Keith 嘅合作偏好

- 全程用繁體中文、香港用語溝通；數學教學及語音以自然粵語為準。
- 大型功能或產品方向先檢視現況、提出擺位與方案，同 Keith 討論確認後先實作；獲確認後就完成修改、測試及部署，唔使再叫 Keith 親自 QA。
- KAKA Learn 以卡卡／禧禧真正學習成效為先，目標包括熱門直資／私立小學面試需要嘅數感、推理、空間概念及口頭解釋；參考外站功能但唔照抄美術、角色或程式。
- 幼兒操作要防誤觸：先操作、再撳「回答」確認；撳一下同拖放都要支援，iPad 優先，畫面層級要一眼明白。
- 用字、量詞及題目必須準確；唔可以為方便而顯示錯誤中文或預先洩露答案。
- 原始錄音、掃描及素材要完整保留；只處理副本。未採用嘅 demo／構思保留作日後參考，唔好擅自刪除。

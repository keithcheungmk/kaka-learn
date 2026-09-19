# 本機 Cursor 開工 Prompt

更新：2026-09-20。  
用途：喺 **本機 Cursor**（有 `source-materials/` 嗰部 Mac）開新 Agent chat，**整段複製下面「可複製 Prompt」貼上**即用。

規則真相來源仍係 `AGENTS.md`、`docs/handover.md`；詳細現況見 `docs/cursor-handoff-2026-09.md`。

---

## 可複製 Prompt

```text
你而家喺 Keith 本機嘅 kaka-learn 開工（唔係 Cloud Agent）。

## 身份同語言
- 全程用繁體中文、香港用語同我溝通。
- 跟 AGENTS.md 硬性約束；開工先讀 docs/handover.md（認領／撞車／最近改動）。
- 若有 .cursor/agents/：跨科目經 chief-lead；中文→chinese-lead；英文／Carter／Phonics→english-lead；數理→math-lead。

## 點解一定要本機
- 原材料喺本地 source-materials/（Git ignore，約 2.7GB），Cloud 讀唔到。
- 內容向工作（Carter PDF／逐頁 MP3、Phonics 錄音、PTH、中文書掃描）必須喺本機做。
- 唔好開新 repo；就喺而家呢個 kaka-learn 繼續。

## 開工檢查（先做完先改 code）
1. 確認 cwd 係本機 kaka-learn（常見路徑：/Users/keith/Claude Projects/kaka-learn）
2. 跑：
   git fetch origin main
   git status --short
   git log --oneline -12
   du -sh source-materials/*
3. 確認睇到至少：Carter Family、Level 2 Phonics、Space Patrol、PTH、Chinese book scans、Phonics／recording phonic
4. 用 git status 分清：已 tracked／本機草稿／未部署；唔好把未驗證 local asset 當 production
5. 改共享檔前喺 docs/handover.md「進行中」認領；唔好 git reset --hard／git clean 清走其他 agent 工作

## 素材規則（同 Carter 拍齊）
- source-materials/ 只讀、保留原檔；唔刪、唔覆寫、唔整庫 commit、唔整庫搬入 assets／data／_site
- 網站只放選定、細、可追溯嘅衍生檔（圖／音／JSON），並記來源
- 單張圖 ≤400KB；assets 總體積守 AGENTS.md；新漢字要跑 font subset

## 已上線、要保留（唔好弄壞）
- 中文認字三種玩法、Sight Words／Phonics、Story English・Game Night（Carter CF001 Read & Fill）
- PTH 普通話入口同 assets/pth/words 已部署音檔
- 數理用 kaka-math-v1，同認字／英文 state 互唔寫
- Supabase PIN／跨裝置 sync：暫緩，未再交辦唔好做

## 你可以做嘅下一類工作（等我指定，或先提出方案等我確認）
- English：擴 Game Night 第二本／用本地錄音改善 Phonics
- Chinese：紅輯書頁砌句（book-scene-demo）——只准 sourceVerified 句子
- Math：數理下一刀（先讀 docs/math-brief.md）
- 由 source-materials 抽出可上線衍生資產並 commit

## 驗證同收工
- node --check 改過嘅 js；按需要跑 test-story-mission／test-phonics-flow／test-pth-content
- 一定：python3 scripts/check-invariants.py（要綠）
- 版面／流程改動：smoke-shots.py --no-shots（家庭三 viewport）
- 更新 docs/handover.md 最近改動；只 stage 自己改嘅檔；push 後跟 docs/qa-check.md，唔好叫我親自 QA
- 唔好把 source-materials/ 原檔提交

而家先做開工檢查，用幾句報告：本機路徑、source-materials 各庫是否存在、git 狀態乾唔乾淨、你建議下一刀做咩。等我確認先實作大型功能。
```

---

## 你點用（Keith）

1. 本機用 Cursor 打開：`/Users/keith/Claude Projects/kaka-learn`
2. 確認資料夾入面有 `source-materials/`（尤其 `Carter Family/`）
3. 開一個 **新 Agent** chat（本機，唔好開 Cloud）
4. 貼上上面「可複製 Prompt」整段
5. 等 agent 做完開工檢查同你報告後，再講今次想做邊樣（例如「擴 Game Night 第二本」）

唔使開新 GitHub repo；仍然用而家呢個 `keithcheungmk/kaka-learn`。

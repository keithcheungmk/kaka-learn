# Cursor 專案近況 Brief（2026-10-07）

> 依 GitHub `main` 最新已知提交 `fd9aeee`（2026-10-06）及 `docs/handover.md` 整理。呢份係摘要，唔取代 `AGENTS.md`、handover 或科目規格；開工前須核實最新 GitHub／工作樹／部署狀態。

## 專案概況

KAKA Learn 正式站：<https://keithcheungmk.github.io/kaka-learn/>。iPad 優先的中英數及普通話學習網站，另有禧禧遊戲樂園。現時無登入；卡卡／禧禧進度依現有本機 Profile 保存。Supabase PIN 跨裝置同步係暫停支線，未獲 Keith 重啟前不可執行。

## 近兩週主要內容（09-23 至 10-07）

- **中文**：普通中文主題認字、「連一連」曾擴展至 27 個主題；紅／橙輯分批按書詞與清晰插圖覆蓋開放，未核實／配圖不足的書不可硬開。家族故事截至 10-02 handover 記錄 12 篇／76 頁；讀本來源詞與延伸學習詞要分清。近期亦有動物插圖、職業圖卡、主題詞牆更新。
- **英文**：Hub 分故事、主題詞語、Phonics。Carter Family 已記錄 CF001–085（85 本／1,033 可玩頁）；Magic Marker 已記錄 MM001–073（73 本／655 頁）。Sight Words 主題詞卡改為同頁完整瀏覽及逐卡聽音；入口近期加入插畫與響應式排版。
- **普通話**：10-04 audit 記錄 23 段聲母影片、69 延伸詞、7 組各 10 題；例詞明確用普通話、單一播放器避免疊音、拼音改善對比；每玩家每課首次完成派星，重溫不重複入帳。Safari/WebKit 載入有補強。自動化或模擬 viewport 不等於真機 iPad 人耳聽審。
- **數學**：入口整合數字探險、加法果園、減法籃球場、時鐘遊樂屋及生活挑戰。10-06 全數學區改用淺色主題；水果店付款玩法改為直接練付款、放入／取回硬幣、即時計總額及確認。
- **UI／驗收**：近期修補答案文字對比、拼字磚可讀性、iPad/iPhone 模擬 viewport 等。凡未有實機證據，唔好宣稱已通過真機驗收。
- **素材風險**：較早 handover 曾記錄 Wacky Ricky 有大量音檔待人工聽審及少量頁面未可靠對位；先查最新 manifest／PR／部署再決定現況，勿將舊數字當最新。

## Cursor 開工注意

1. 先讀 `AGENTS.md`、`docs/handover.md`、本 brief、相關 Lead 指引，檢查 `git status`。
2. Fetch 最新 `origin/main`，核實 merged/open PR、目前認領、CI／Pages 及 live version。handover 部分認領狀態可能過時，勿假設舊任務仍 active 或未完成。
3. Cursor Chief Lead 負責拆件、共享檔整合、回歸及 release；Math／English／Chinese Lead 按科目工作，不自行 push／部署。同一功能／檔案先認領，避免撞改。
4. 保留 dirty changes；不可 reset、覆蓋或整批 merge。只 stage 本任務檔。
5. `source-materials/` 原始 PDF／MP3 等係本機素材，gitignored；不可提交／部署。只加入核實後需要的衍生素材並記來源。
6. 依 `docs/qa-check.md` 驗證相關測試、`python3 scripts/check-invariants.py`、`git diff --check`。UI 改動覆蓋 iPad Pro 11 橫／直與 iPhone 16 Pro Max viewport，另清楚分開模擬與真機結果。
7. 分開報告本機修改、commit、push、部署、live verification；不可把一個狀態混稱為另一個。

## 貼給 Cursor 的指令

「請先讀 `AGENTS.md`、`docs/handover.md`、`docs/cursor-brief-2026-10-07.md` 及相關 Lead 指引。先檢查 `git status` 並保留所有 dirty changes，再 fetch 最新 `origin/main`，核實近兩週 merged/open PR、現行 owner／認領、CI／Pages 和網站版本。先回報 handover 過時或矛盾之處，以及真正未完成事項；不要重做已完成項、不要提交 `source-materials/`，也不要把模擬 viewport 說成實機驗收。完成核對後先等我指定接手項目。」

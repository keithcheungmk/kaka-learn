# Cursor 交接：紅輯書頁砌句子內容核對

日期：2026-09-20  
交接對象：Cursor  
交接原因：目前 Codex token 已接近用盡，請由 Cursor 接續完成驗收、資產整理及後續部署。

## 目前成果

今次已完成三輪「內容整理 → Chief Lead 獨立驗收 → 修正 → 再驗收」循環。

1. 已盤點 `source-materials/Chinese book scans/` 內全部 12 本紅輯 PDF。
2. 已將故事頁、字卡頁、頁碼、完整句子、未完成句及排除頁整理成文字工作清單：
   - [PDF 文字清單](./../tmp/pdfs/red-book-text-inventory.md)
3. 已修正目前正式題的內容錯配：
   - 《分果果》三個跨頁任務，逐字對應 PDF p4、p5、p6 左頁。
   - 《誰在叫》PDF p5：左句係 `吱，吱，吱，誰在叫？鳥在叫。`；右句係 `喵，喵，喵，誰在叫？貓在叫。`。
4. 已停用首頁舊版錯配句子資料：
   - `js/app.js` 的 `SENTENCE_DEMO` 已清空。
   - `openSentenceLanding()` 直接導向 `book-scene-demo.html`。
5. 已將「內容核實中」提示移到書頁圖片外，避免 badge 遮住原書文字。
6. 已把兩本早期 demo 書重新納入 12 本資料層：
   - 《我的氣球呢？》
   - 《貪吃的安安》
7. 已修正 manifest：
   - `data/red-series/page-manifest.json` 現在有 12 本。
   - 《分果果》頁數改為 7；《誰在叫》頁數改為 8。
   - `data/red-series/rb_shuijiao.json` 已同步為 `spread-sentence-chunks`、1 個跨頁任務、10 星。

## 正式內容狀態

目前只有兩本開放正式砌句測驗：

- 《分果果》：3 個已核實跨頁，4 + 4 + 2 組詞語，共 10 星。
- 《誰在叫》：1 個已核實跨頁，10 組詞語，共 10 星；重複的 `吱`、`喵`、`誰在叫` 以獨立選項保存。

其餘 10 本保持 `mode: preview`，只顯示真實掃描頁，不會由字卡或圖片推造答案：

《我的氣球呢？》、《貪吃的安安》、《雨傘》、《信》、《快跑呀》、《黃葉》、《一束花》、《風跟我玩》、《小明和氣球》、《冬冬請客》。

這是刻意的內容安全閘門。逐頁句子、自然詞組及干擾項完成第二人核對後，才可以將該書改成 `mode: sentence` 和 `sourceVerified: true`。

## 重要檔案

- [書頁遊戲邏輯](./../js/book-scene-demo.js)
- [逐頁題目資料](./../data/red-series/sentence-game-data.mjs)
- [句子引擎](./../js/red-sentence-engine.mjs)
- [12 本書頁 manifest](./../data/red-series/story-page-hq-manifest.json)
- [12 本書 PDF 頁數 manifest](./../data/red-series/page-manifest.json)
- [內容框架及驗收規則](./red-series-sentence-game-framework.md)
- [PDF 文字清單](./../tmp/pdfs/red-book-text-inventory.md)

## 測試結果

已通過：

```bash
node scripts/test-book-scene-demo.mjs
node --check js/app.js
node --check js/book-scene-demo.js
python3 -m json.tool data/red-series/page-manifest.json
python3 -m json.tool data/red-series/story-page-hq-manifest.json
python3 -m json.tool data/red-series/rb_shuijiao.json
```

`node scripts/test-book-scene-demo.mjs` 結果：`Book scene sentence-game tests passed`。

已更新 touch smoke 內的《誰在叫》預期文字及選項：

- [touch smoke](./../scripts/smoke-book-scene-demo.py)

## 尚未完成的 blocker

`python3 scripts/check-invariants.py` 目前只有一個 blocker：`assets/` 總容量超過專案 14MB 上限（輸出約 13–15MB，視顯示單位而異）。這個問題與 PDF 文字內容無關，但未解決前不應宣稱可以 merge/deploy。

請先找出可安全壓縮或重複的衍生圖片；不要刪除 `source-materials/Chinese book scans/` 原始 PDF，也不要移除網站仍在使用的圖片。壓縮後重新跑：

```bash
python3 scripts/check-invariants.py
```

## 下一步建議

1. 先查看目前整個工作樹的 `git diff`；不要 reset 或覆蓋其他 agent 尚未提交的改動。
2. 解決 asset-weight blocker，確認 invariant 全綠。
3. 逐本、每次兩本處理剩餘 10 本：從 PDF 原頁抄錄句子，按自然詞組切分，再加入 2–4 個不會造成雙重答案的干擾詞。
4. 每完成兩本，請交 Chief Lead 做獨立內容驗收；未驗收前保持 preview。
5. 跑完整書頁測試及 touch smoke。若本機 server 受 sandbox 限制，改用可用的本機 HTTP server，不要用 `file://` 測 ES module。
6. 只有測試、內容驗收及 asset invariant 全部通過後，才 commit、merge 及 deploy。

## OCR 限制

本機沒有可用的 `tesseract`／`pdftotext`，macOS Vision OCR 亦因 Swift SDK 工具鏈不相容未能執行。今次文字清單是 PDF render 後逐頁放大目視抄錄及核對，清單內已標明未完成句和排除頁；不要把 OCR 草稿當作正式句子來源。


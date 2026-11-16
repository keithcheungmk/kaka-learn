# 家庭故事草稿工具

`scripts/draft-family-story.mjs` 將已經核對的故事資料轉成現有 manifest 的 JSON 物件，印到標準輸出，不修改網站、manifest 或圖片。工具不創作事件、對白、圖片或聲音；作者仍需逐頁校對並依 `skills/kaka-family-diary/SKILL.md` 檢查。

輸入為 UTF-8 JSON。故事須提供 `id`、`title`、`place`、`summary`、`characters` 和六至八個 `pages`；每頁提供一個有標點的 `sentence`、依句序排列而且各出現一次的兩個 `focusWords`，以及至少兩個 `distractors`。可提供 `tiles` 做真實分詞；省略時以完整句子為一塊，不會假裝自動分詞。亦可提供 `sourceBooks`、`bookWords`、`extensionWords` 及現有 schema 的其他資料，例如 `image`、`dialogue`；工具會保留它們。

```sh
node scripts/draft-family-story.mjs /path/to/story-input.json > /path/to/review-draft.json
```

也可從標準輸入讀取。輸出會為每頁用 `focusWords` 產生相同的 `learn`，並把新重點詞加入 `extensionWords`；不覆蓋已提供的詞。格式或句詞有問題時，錯誤寫到標準錯誤，沒有輸出草稿。

人工審核完成後，才將物件放入 `data/family-stories/manifest.js`，確保每頁真實圖片、素材來源、詞語、粵語朗讀和日期正確，再執行 `python3 scripts/check-family-stories.py` 和相關定向測試。工具本身不代替素材審查、故事驗收或部署授權。

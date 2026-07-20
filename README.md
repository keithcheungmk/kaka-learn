# 卡卡學習（kaka-learn）

給 KAKA（約 4 歲、升 K2）嘅繁體中文認字小遊戲：聽粵語、配圖畫、攞星星。

主題：**小鹿太空冒險**（原創美術，無迪士尼／彼思角色或素材）。

## 點樣運行

需要一個本地靜態伺服器（ES modules 唔可以直接用 `file://`）。

```bash
# 方法 A：Python
python3 -m http.server 5173

# 方法 B：Node
npx --yes serve -l 5173 .
```

然後用瀏覽器開：

- 本機：`http://localhost:5173`
- iPad／電視同網：`http://<電腦IP>:5173`

建議用 Safari（iPad）或 Chrome／Safari（Mac + TV）。首次請允許頁面播放聲音。

## 功能（MVP）

1. **聽一聽・揀卡片**：播粵語（Web Speech API / 系統聲線），再揀啱嘅字卡。
2. **字詞・配圖畫**：先撳字詞，再撳圖畫（適合電視大掣）。
3. 答錯只會溫柔講「再試吓」，無懲罰。
4. **星星**：答啱 +1；每日最多 10 粒。介面顯示「10 粒星星 = 1 枚 AEON 幣」同可兌換數量（`floor(累積星星/10)`）。家長現實兌換，無付款 API。
5. **家長鎖**：預設 PIN `1234`（可改）。家長區可開關字詞、鹿類重點、靜音、重設星星、改 PIN。
6. 介面繁體中文；字詞表固定 24 個（見下）。

## 字詞表（24）

鹿、梅花鹿、馴鹿、駝鹿、馬鹿、狗、貓、魚、鳥、兔、羊、牛、馬、豬、熊、獅子、老虎、大象、猴、雞、鴨、蛙、蟲、龍

## 本機資料

全部存喺瀏覽器 `localStorage`（鍵名 `kaka-learn-v1`）：

- 今日／累積星星、家長 PIN、靜音、鹿類重點、字詞開關

清瀏覽器資料會重設。

## 專案結構

```
index.html          # 單頁入口
css/styles.css      # 小鹿太空冒險主題
js/app.js           # 畫面同遊戲循環
js/words.js         # 24 字詞 + 原創 SVG
js/storage.js       # localStorage
js/speech.js        # 粵語 TTS + 簡短音效
AGENTS.md           # 給協作 agent 嘅說明
```

## 非目標

無登入、廣告、追蹤、寫字練習、故事模式、真正 AEON／付款串接。

業務建議可放喺 sibling repo `keith-ops`；所有 app 程式碼只喺本 repo。

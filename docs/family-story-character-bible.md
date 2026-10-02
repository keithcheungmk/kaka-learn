# 卡卡一家・角色設定（第一版）

## 共同畫風

溫暖、明亮、適合幼兒閱讀的立體繪本動畫風格；人物比例自然可愛，表情清楚，背景有生活細節但不搶文字。六人同框時腳底置於同一基線，以身高設定作相對比例；角色身高不應因鏡頭或姿勢變成另一個人物的比例。每次生成場景圖都不在圖內放字，文字和對白由網頁排版，避免錯字及維持可讀性。

## 身高尺（同框基準）

| 角色 | 年齡／身高 | 識別特徵 | 第一版服裝提案 |
|---|---:|---|---|
| 卡卡 | 4歲／106 cm | 短黑髮、笑容爽朗 | 黃色上衣、深藍邊、深藍短褲 |
| 禧禧 | 3歲／約96 cm | 圓臉、大眼、黑髮；「禧」取自千禧年 | 深藍外套、黃色衣領 |
| 姑姑／紅姑姑 | 161 cm | 比蛙蛙高、身形較修長、尖一些的臉、較長頭髮 | 珊瑚紅開襟衫、深藍長褲 |
| 蛙蛙 | 155 cm | 禧禧的媽媽；身形較矮、圓臉、大眼；「蛙」取自青蛙 | 薄荷綠開襟衫、藍綠長褲 |
| 傑叔叔 | 170 cm | 卡卡的爸爸；成熟和善 | 深藍襯衫外套、芥末黃上衣 |
| 耀叔叔 | 175 cm | 禧禧的爸爸 | 灰綠襯衫外套、淺色上衣 |
| 浠榆 | 初生寶寶 | 卡卡的妹妹 | 淡粉色花朵圖案包被；以安全包裹／成人抱着的姿勢出現 |

成人和孩子的頭身比例要分開處理：成人較高、四肢較長；卡卡只比禧禧高約10 cm。姑姑與蛙蛙相差約6 cm；耀叔叔比傑叔叔高約5 cm。浠榆是初生嬰兒，不設定未提供的身高；必須由成人妥善抱着或放在安全嬰兒床內。

## 參考圖與生成要求

- `assets/family-stories/characters/*-turnaround.webp` 是角色三視圖；場景生成時以相關角色圖作參考。`xiyu-turnaround.webp` 是浠榆的初生包被角色設定圖。
- `family-height-lineup.webp` 是六人共同比例參考。
- 不改角色的髮型、主色服裝、臉型或年齡感；角色身高用相同地面基線校準。
- 圖中不生成中文字、拼音或對話框；文字由 HTML 顯示。
- 每篇故事中的角色衣服固定，不因格數改變；避免背景角色被誤認為主角。

## 首版生成提示詞基底

> Warm, polished 3D children's picture-book illustration. Use the supplied character turnaround and family-height lineup as strict identity and proportion references. Keep each named character's face, hairstyle, age, body height, and signature clothes consistent across every panel. Place the characters on a common ground line whenever they stand together. Make the action readable to a preschool/early-primary child, gentle and safe, with a simple uncluttered background. No text, letters, pinyin, labels, logos, or speech bubbles; dialogue is typeset separately.

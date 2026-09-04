# SPACE RANGER PHONICS：純音錄音及驗收標準

## 決定

Kaka Learn 採用 Open Source Phonics 的發音教學方法作為錄音標準，但不複製第三方教材音檔。
該網站公開的是課程及導師指引，沒有可直接匯入的 a–z 錄音。教材以 CC BY-NC-SA 4.0 發佈；
本文件只概述其教學方法並標示來源。

- 課程：https://www.opensourcephonics.org/lessons/
- 使用條款：https://www.opensourcephonics.org/terms-of-use/
- Lessons 1–10：https://www.opensourcephonics.org/wp-content/uploads/2021/08/LESSON-1-10-1.pdf

## 核心規則

1. 播放的是字母在單字中的聲音，不是字母名稱。
2. 不可加入 schwa（多餘的「uh」）：`t` 是短促 `/t/`，不是 “tuh”；`b` 不是 “buh”；`p` 不是 “puh”。
3. 可延續音自然延長少許，例如 `/m/`、`/n/`、`/f/`、`/s/`；不可把爆破音拉長。
4. 每個檔案只包含一次目標音，不讀 cue word，不讀中文提示。
5. 由同一位發音者、同一房間、同一咪高峰距離完成整套錄音。
6. Open Source Phonics 是美國課程。Kaka Learn 採英式發音，短母音及 `r` 要由熟悉英式 synthetic phonics 的老師覆核。

## a–z 第一套目標

| 字母 | 目標 | cue word | 錄音提示 |
|---|---|---|---|
| a | /æ/ | apple | 短母音，不讀 “ay” |
| b | /b/ | baby | 極短，不加 “uh” |
| c | /k/ | cat | 極短，不加 “uh” |
| d | /d/ | dog | 極短，不加 “uh” |
| e | /ɛ/ | egg | 短母音，不讀 “ee” |
| f | /f/ | fox | 可延續，不加 “uh” |
| g | /g/ | gum | 極短，不加 “uh” |
| h | /h/ | hat | 輕呼氣，不讀 “aitch” |
| i | /ɪ/ | itch | 短母音，不讀 “eye” |
| j | /dʒ/ | jam | 短促，不加 “uh” |
| k | /k/ | kid | 與硬音 c 相同 |
| l | /l/ | lip | 舌尖音，不加 “uh” |
| m | /m/ | mom | 可延續 |
| n | /n/ | nap | 可延續 |
| o | /ɒ/（英） | octopus | 短母音，不讀 “oh” |
| p | /p/ | pat | 極短，不加 “uh” |
| q | /kw/ | queen | 教 `qu` 聲音；不讀字母名 |
| r | /r/ | red | 英式老師覆核，不加 “uh” |
| s | /s/ | sun | 可延續，先用清音 |
| t | /t/ | top | 極短，不加 “uh” |
| u | /ʌ/ | up | 短母音，不讀 “you” |
| v | /v/ | van | 可延續，不加 “uh” |
| w | /w/ | web | 圓唇滑音，不加 “uh” |
| x | /ks/ | box | 兩個音連接，不讀 “ex” |
| y | /j/ | yes | 滑音，不加 “uh” |
| z | /z/ | zip | 可延續，不讀 “zed/zee” |

## 錄音及安裝流程

1. 每個字母錄三次，暫用 `a-1.wav`、`a-2.wav`、`a-3.wav`。
2. 人耳選出最好的一次，改名為 `a.wav`；其餘字母同樣處理。
3. 將完整 `a.wav` 至 `z.wav` 放在同一資料夾。
4. 先只檢查：`python3 scripts/import-phonemes.py /錄音資料夾`
5. 逐一戴耳機驗收後安裝：`python3 scripts/import-phonemes.py /錄音資料夾 --install`
6. 更新 `js/phonics-app.js` 的 `PHONEME_ASSET_VERSION`，再跑完整 QA。

## 人耳驗收表

- [ ] 26 個檔案都對應正確字母，沒有讀出字母名稱
- [ ] b、c/k、d、g、j、p、t 沒有尾隨「uh」
- [ ] a、e、i、o、u 是課程所需短母音
- [ ] c 與 k 播放同一個 `/k/`；q 是 `/kw/`；x 是 `/ks/`
- [ ] s 先採用 `/s/`、g 先採用硬音 `/g/`
- [ ] 音量接近，沒有削波、爆咪、背景說話或明顯噪音
- [ ] 用 `cat`、`map`、`bat`、`pin`、`dog` 實際逐音 blending，連接時沒有多餘母音
- [ ] 至少一位熟悉 synthetic phonics 的成人聽過並批准

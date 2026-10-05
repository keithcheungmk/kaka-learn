# 中文動物插畫試畫：六款 pilot

## 範圍

第一輪接入四個新增動物詞和兩款風格對照圖：浣熊、蜜獾、黑熊、棕熊（灰熊）、熊貓、狐狸。第二批加入獅子、老虎、大象；第三批加入長頸鹿、斑馬、企鵝。十二張都是獨立透明底 WebP，供普通中文「連一連」配圖使用。其他動物仍沿用系統 emoji；英文、數學和其他中文玩法不受這批插畫映射影響。

## 共通視覺規格

- 參考 `assets/animals/deer/deer.webp` 的自然、細緻野生動物繪本質感。
- 單隻動物、全身、四足自然站姿、略朝鏡頭，完整露出頭、腳、尾巴及物種辨識特徵。
- 方形構圖、置中、四周留白；透明背景，不加底板、文字、徽章、道具或場景。
- 真實但友善、適合幼兒認字；避免擬人化和誇張表情。
- 顏色要符合物種常見外觀，光線柔和，主體邊緣清楚，縮小至連線卡片仍可辨認。

## 物種識別要求

| 詞語 | 檔案 | 畫面重點 |
|---|---|---|
| 浣熊 | `assets/animals/wild/raccoon.webp` | 灰褐色毛、眼周深色面罩、尖嘴、蓬鬆環紋尾巴；避免畫成蜜獾或小熊。 |
| 蜜獾 | `assets/animals/wild/honey-badger.webp` | 矮壯身形、黑色腹側、淺灰白背毛延伸至頭頂、短腿和小圓耳；不畫浣熊面罩或環紋尾。 |
| 黑熊 | `assets/animals/wild/black-bear.webp` | 黑色毛、較直的背線、較短耳朵、淡色口鼻；不要只靠毛色和棕熊混淆。 |
| 棕熊（灰熊） | `assets/animals/wild/brown-bear.webp` | 棕色毛、肩峰明顯、較長口鼻、肩背毛略有灰褐層次；這階段作一個詞語，不把「棕熊」和「灰熊」拆成兩個近似配對。美國國家公園管理局亦將 grizzly bear 歸在 brown bear 名稱範圍內：[Bear Identification](https://www.nps.gov/articles/bear-identification.htm)。 |
| 熊貓 | `assets/animals/wild/panda.webp` | 黑白毛色和眼周黑斑清楚。 |
| 狐狸 | `assets/animals/wild/fox.webp` | 尖耳、窄嘴、紅橙色毛和蓬鬆白尖尾巴清楚。 |
| 獅子 | `assets/animals/wild/lion.webp` | 雄獅鬃毛完整、金棕色身體、尾端有毛簇。 |
| 老虎 | `assets/animals/wild/tiger.webp` | 橙色毛和黑色直紋分布清楚，臉部有白色斑紋。 |
| 大象 | `assets/animals/wild/elephant.webp` | 長鼻、象牙和大耳容易辨認。 |
| 長頸鹿 | `assets/animals/wild/giraffe.webp` | 長頸、棕色斑塊和頭頂小角容易辨認。 |
| 斑馬 | `assets/animals/wild/zebra.webp` | 黑白條紋覆蓋身體和腿部，鬃毛直立。 |
| 企鵝 | `assets/animals/wild/penguin.webp` | 直立姿勢、黑背白肚及橙黃色頸部斑塊清楚。 |

生成時每款分開出圖，沿用共通規格並加入相應物種重點。原始 PNG 保存在生成素材目錄；網站只使用經視覺檢查及轉成 WebP 的成品。

## 詞彙與 fallback

四個新增詞只加到「動物園」普通中文 topic。已核准的十二個 ID 經 `ANIMAL_ILLUSTRATIONS` 映射至專屬圖片；未映射的動物繼續用原生 emoji。每張圖都要通過 WebP、透明度、尺寸和映射測試。

## 驗收界線

自動測試核對詞語、topic、圖片映射、WebP 簽名、透明背景、大小、連線資格和 emoji fallback。視覺檢查核對主體完整度與物種特徵。其餘中文動物仍分批處理，每批交 Chief Lead 審閱；目前未部署。

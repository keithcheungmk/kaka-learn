# Emoji Spelling 音塊覆蓋檢查

共 32 個圖詞／CVC 分類、333 個題目；138 個有音塊或詞尾示範，195 個暫時只讀完整單字。

音塊配置經字形及現有檔案檢查；這不證明錄音已經人耳核對或實機驗收。rice 的 ice 沿用既有完整詞尾 TTS，並非單獨音素。cake、home 等拆分字母組合有獨立字形和音檔配對。缺少音塊不代表詞語沒有發音；其餘題目使用裝置英文語音讀完整單字。

2026-10-28 技術檢查：50 個 MP3 都能解碼，長度為 0.297–0.833 秒，短於播放器的 1.8 秒單音逾時。浮點解碼時 b、c、ch、ck、d、g、h、i、j、p、t、u 有少量樣本的絕對值達到或超過 1；這是需要覆聽的潛在峰值問題，不代表已確定有可聽爆音。檢查檔案和波形不能取代英式發音、純音及混音的人耳驗收。

本輪依 Luna 提交的逐詞審核清單，先前新增 25 個候選配置，另新增 26 個待覆聽候選配置（包含部分多音字形與靜音 e）；另有 `two` 及 `nine` 因無法正確呈現逐個字形而拒絕。新增配置的音檔尚未人耳覆聽，必須待熟悉英式 phonics 的成人逐音核實後，才可標作已驗收。完整候選／拒絕清單見 [`emoji-spelling-phonics-audit.json`](emoji-spelling-phonics-audit.json)。

以下列出仍只用完整單字語音、尚無音塊配置的 195 個題目。不應以字母名稱代替 phonics，也不能對靜音字母或多音字機械逐字拼讀。

新增候選及先前候選映射均待成人覆聽；新增的 26 題是 bread, park, car, tram, train, truck, moon, tea, cloud, night, drum, flag, dress, rain, snow, green, run, cow, owl, corn, grape, bear, brown, arm, shy, read（現在式）。遊戲對 `read` 的完整詞語 TTS 使用「reed」提示音，避免裝置把孤立拼法讀成過去式；畫面仍顯示 READ。

先前候選映射，待成人覆聽：cake, bike, plane, home, beach, plate, snowman, feast, team, dentist, nose, head, cold, socks, coat, blue, white, gold, five, eight, cone, toy, dice, slide, game, wave, sleep。

- Animal Spelling Zoo (animal_spelling): lion, zebra, monkey
- Food (sight_food): apple, banana, chicken, juice
- Vegetables (sight_veg): carrot, tomato, potato, cabbage, onion, mushroom, cucumber
- Places (sight_places): school, hospital, library, classroom
- Vehicles (sight_vehicles): taxi, ferry
- Fruit (sight_fruit): apple, banana, orange, mango, melon, lemon, kiwi
- Household Items (sight_household): sofa, table, chair, towel
- School Items (sight_school_items): pencil, ruler, eraser, crayon, paper, glue, scissors
- Christmas (festival_christmas): Santa Claus, reindeer, sleigh, stocking, present, ornament, gingerbread
- Lunar New Year (festival_lunar_new_year): red packet, lion dance, firecracker, tangerine, blossom, couplet, lucky, family, New Year
- Mid-Autumn Festival (festival_mid_autumn): mooncake, rabbit, lantern, pomelo, sky, harvest
- Dragon Boat Festival (festival_dragon_boat): dragon boat, dumpling, paddle, race, river, water, winner
- Halloween (festival_halloween): pumpkin, costume, witch, ghost, spider, candy, mask, trick, treat
- People Around Us (sight_jobs_nearby): doctor, nurse, teacher, principal, firefighter, police officer, paramedic, pharmacist, hairdresser, shop assistant, cashier, security guard, cleaner, domestic helper, postman, delivery worker, driver, bus driver, taxi driver, waiter, gardener, zookeeper, librarian
- Jobs Around the World (sight_jobs_world): chef, farmer, pilot, flight attendant, astronaut, scientist, artist, musician, athlete, actor, reporter, builder, engineer, ship captain, fisherman, lifeguard, photographer, soldier, environmental officer, medical sales representative
- My Body (sight_body): eye, ear, mouth, face, tooth
- Feelings (sight_feelings): happy, angry, scared, excited, tired, hungry, thirsty, hurt
- Clothes (sight_clothes): shirt, pants, skirt, shoes, jacket, scarf, gloves, shorts
- Family & People (sight_family_people): father, mother, brother, sister, baby, grandfather, grandmother, aunt, uncle, friend, teacher, classmate
- Weather (sight_weather): sunny, cloudy, rainy, windy, stormy, snowy, rainbow, umbrella
- Colors (sight_colors): yellow, orange, purple, pink, grey
- Numbers (sight_numbers): one, two, three, four, seven, nine, eleven, twelve
- Shapes (sight_shapes): circle, square, triangle, rectangle, star, heart, oval, diamond, cube, cylinder, sphere
- Toys (sight_toys): ball, teddy, puzzle, balloon, target, carousel, maracas
- Action Words (sight_actions): walk, write, draw, ride

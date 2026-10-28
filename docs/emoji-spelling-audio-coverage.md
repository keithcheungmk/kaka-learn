# Emoji Spelling 音塊覆蓋檢查

共 32 個圖詞／CVC 分類、333 個題目。146 個有待成人覆聽的音塊／詞尾示範；187 個暫時只讀完整單字。完整逐題清單見 [phonics audit](emoji-spelling-phonics-audit.json)。

所有候選都只代表字形—音素對應及音檔檔名經靜態檢視；**沒有任何片段經人耳核實**，所以全部仍待熟悉英式 synthetic phonics 的成人逐項聽音、核對混音及實機播放。不可將候選當成已驗收。純讀整個單字的題目照常用英文 TTS，不會用字母名稱假裝 phonics。

2026-10-28 技術檢查：50 個 MP3 都可解碼，長度為 0.297–0.833 秒，短於播放器 1.8 秒單音逾時。b、c、ch、ck、d、g、h、i、j、p、t、u 有少量解碼樣本達到或超過浮點滿幅；這只表示有潛在峰值，並未證實聽得出爆音，需人耳檢查。

今次修正覆蓋漏項：先前 audit 少咗食物、蔬菜、水果、交通工具 40 題；現已補入 audit，令逐題表覆蓋全 333 題。將「rice」的 `ice` 假分音移除，因 repo 無 `ice` 獨立音檔，改用完整詞語 TTS。新增候選 `juice`, `glue`, `witch`, `trick`, `treat`, `sky`, `race`；並澄清 `/tr/` 是開首子音連綴、`tch` 是一個三字母音組。所有新增配置仍待覆聽。

候選音塊共 146 題，依主題如下：

- 動物拼字園 (animal_spelling): cat, dog, pig, hen, fox, bat, rat, fish, frog, duck, cow, owl, ant, bee, goat, bear, snail
- 地方 (sight_places): home, park, shop, pool, beach, zoo
- 家居用品 (sight_household): bed, lamp, clock, cup, plate, spoon
- 學校用品 (sight_school_items): book, bag, pen, glue
- 聖誕節 (festival_christmas): tree, snowman, bell
- 農曆新年 (festival_lunar_new_year): feast
- 中秋節 (festival_mid_autumn): moon, tea, cloud, sky, night
- 端午節 (festival_dragon_boat): race, team, drum, flag
- 萬聖節 (festival_halloween): witch, bat, trick, treat
- 身邊的職業 (sight_jobs_nearby): dentist, vet
- 身體部位 (sight_body): nose, head, hair, face, hand, arm, leg, foot
- 情緒與感受 (sight_feelings): sad, shy, hot, cold
- 衣物 (sight_clothes): pants, dress, socks, hat, coat
- 天氣 (sight_weather): hot, cold, rain, snow
- 顏色 (sight_colors): red, blue, green, black, white, brown, gold
- 數字 (sight_numbers): five, six, eight, ten
- 形狀 (sight_shapes): cone
- 玩具 (sight_toys): doll, toy, dice, slide, game
- 動作 (sight_actions): run, jump, clap, wave, swim, sleep, read, sing
- 拼一拼・-at (cvc_at): cat, hat, bat, rat, mat
- 拼一拼・-an (cvc_an): can, pan, man, van, fan
- 拼一拼・-ap (cvc_ap): cap, map, tap, nap
- 拼一拼・-in (cvc_in): pin, tin, bin, win
- 拼一拼・-ig (cvc_ig): pig, dig, big, wig
- 拼一拼・-ot (cvc_ot): pot, hot, cot
- 拼一拼・-og (cvc_og): dog, fog, log
- 食物 (sight_food): bread, milk, egg, cake, fish, juice
- 蔬菜 (sight_veg): corn, peas, beans
- 車輛 (sight_vehicles): car, bus, tram, train, truck, van, bike, plane
- 水果 (sight_fruit): grape, pear, peach

暫時只讀完整單字語音的 187 題如下：

- 動物拼字園 (animal_spelling): lion, zebra, monkey
- 食物 (sight_food): rice, apple, banana, chicken
- 蔬菜 (sight_veg): carrot, tomato, potato, cabbage, onion, mushroom, cucumber
- 地方 (sight_places): school, hospital, library, classroom
- 車輛 (sight_vehicles): taxi, ferry
- 水果 (sight_fruit): apple, banana, orange, mango, melon, lemon, kiwi
- 家居用品 (sight_household): sofa, table, chair, towel
- 學校用品 (sight_school_items): pencil, ruler, eraser, crayon, paper, scissors
- 聖誕節 (festival_christmas): Santa Claus, reindeer, sleigh, stocking, present, ornament, gingerbread
- 農曆新年 (festival_lunar_new_year): red packet, lion dance, firecracker, tangerine, blossom, couplet, lucky, family, New Year
- 中秋節 (festival_mid_autumn): mooncake, rabbit, lantern, pomelo, harvest
- 端午節 (festival_dragon_boat): dragon boat, dumpling, paddle, river, water, winner
- 萬聖節 (festival_halloween): pumpkin, costume, ghost, spider, candy, mask
- 身邊的職業 (sight_jobs_nearby): doctor, nurse, teacher, principal, firefighter, police officer, paramedic, pharmacist, hairdresser, shop assistant, cashier, security guard, cleaner, domestic helper, postman, delivery worker, driver, bus driver, taxi driver, waiter, gardener, zookeeper, librarian
- 世界各地的職業 (sight_jobs_world): chef, farmer, pilot, flight attendant, astronaut, scientist, artist, musician, athlete, actor, reporter, builder, engineer, ship captain, fisherman, lifeguard, photographer, soldier, environmental officer, medical sales representative
- 身體部位 (sight_body): eye, ear, mouth, tooth
- 情緒與感受 (sight_feelings): happy, angry, scared, excited, tired, hungry, thirsty, hurt
- 衣物 (sight_clothes): shirt, skirt, shoes, jacket, scarf, gloves, shorts
- 家庭與身邊的人 (sight_family_people): father, mother, brother, sister, baby, grandfather, grandmother, aunt, uncle, friend, teacher, classmate
- 天氣 (sight_weather): sunny, cloudy, rainy, windy, stormy, snowy, rainbow, umbrella
- 顏色 (sight_colors): yellow, orange, purple, pink, grey
- 數字 (sight_numbers): one, two, three, four, seven, nine, eleven, twelve
- 形狀 (sight_shapes): circle, square, triangle, rectangle, star, heart, oval, diamond, cube, cylinder, sphere
- 玩具 (sight_toys): ball, teddy, puzzle, balloon, target, carousel, maracas
- 動作 (sight_actions): walk, write, draw, ride

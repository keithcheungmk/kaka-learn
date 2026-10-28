# Emoji Spelling 音塊覆蓋檢查

共 32 個圖詞／CVC 分類、333 個題目。165 題有待成人覆聽的音塊候選；168 題暫時只讀完整單字。逐題對照見 [phonics audit](emoji-spelling-phonics-audit.json)。

「候選」只代表詞形切分和音檔檔名經靜態比對；**目前 0 個片段經人耳核實**。全部候選仍要由熟悉英式 synthetic phonics 的成人逐項聽音、核對混音及裝置播放，才可以標為驗收。純讀整個單字的題目會用英文 TTS，不會用字母名稱假裝 phonics。

技術檢查顯示 50 個 MP3 可解碼，長度約 0.297–0.833 秒，短於播放器單音逾時。部分檔案的解碼樣本接近或達浮點滿幅；峰值數值不能證明聽感有爆音，仍需人耳檢查。

2026-10-28 覆核補充：音塊 audit 覆蓋全部 333 題；刪除沒有獨立音檔的 `rice`／`ice` 假分音。新增眼睛、耳朵、數字、鞋、衣物、天氣、玩具、感受、動作等 19 個候選，其中 `two`、`twelve`、`walk` 有逐字記錄靜音字母。`ball` 仍用完整詞語語音，避免把英式短 a 音檔錯配到 a。`cloud`／`brown` 的 `ow` = /aʊ/；`snow`／`snowman` 的 `ow` = /əʊ/，兩種不能混用。新增候選和修訂仍未經人耳驗收。

## 有待覆聽的候選

- 動物拼字園 (`animal_spelling`): ant, bat, bear, bee, cat, cow, dog, duck, fish, fox, frog, goat, hen, owl, pig, rat, snail
- 地方 (`sight_places`): home, park, shop, pool, beach, zoo
- 家居用品 (`sight_household`): bed, lamp, clock, cup, plate, spoon
- 學校用品 (`sight_school_items`): book, bag, pen, glue
- 聖誕節 (`festival_christmas`): tree, snowman, bell
- 農曆新年 (`festival_lunar_new_year`): feast
- 中秋節 (`festival_mid_autumn`): moon, tea, cloud, sky, night
- 端午節 (`festival_dragon_boat`): race, team, drum, flag
- 萬聖節 (`festival_halloween`): witch, bat, trick, treat
- 身邊的職業 (`sight_jobs_nearby`): dentist, vet
- 身體部位 (`sight_body`): eye, ear, nose, head, hair, face, hand, arm, leg, foot
- 情緒與感受 (`sight_feelings`): happy, sad, scared, shy, hot, cold
- 衣物 (`sight_clothes`): pants, dress, shoes, shirt, socks, hat, coat
- 家庭與身邊的人 (`sight_family_people`): baby
- 天氣 (`sight_weather`): sunny, cloudy, rainy, windy, hot, cold, snowy, rain, snow
- 顏色 (`sight_colors`): red, blue, yellow, green, black, white, brown, grey, gold
- 數字 (`sight_numbers`): two, five, six, eight, ten, twelve
- 形狀 (`sight_shapes`): cone
- 玩具 (`sight_toys`): doll, teddy, toy, dice, slide, game
- 動作 (`sight_actions`): run, jump, walk, clap, wave, swim, sleep, read, draw, sing
- 拼一拼・-at (`cvc_at`): bat, cat, hat, mat, rat
- 拼一拼・-an (`cvc_an`): can, fan, man, pan, van
- 拼一拼・-ap (`cvc_ap`): cap, map, nap, tap
- 拼一拼・-in (`cvc_in`): bin, pin, tin, win
- 拼一拼・-ig (`cvc_ig`): big, dig, pig, wig
- 拼一拼・-ot (`cvc_ot`): cot, hot, pot
- 拼一拼・-og (`cvc_og`): dog, fog, log
- 食物 (`sight_food`): bread, milk, egg, cake, fish, juice
- 蔬菜 (`sight_veg`): corn, peas, beans
- 車輛 (`sight_vehicles`): car, bus, tram, train, truck, van, bike, plane
- 水果 (`sight_fruit`): grape, pear, peach

## 暫用完整單字語音

- 動物拼字園 (`animal_spelling`): lion, monkey, zebra
- 地方 (`sight_places`): school, hospital, library, classroom
- 家居用品 (`sight_household`): sofa, table, chair, towel
- 學校用品 (`sight_school_items`): pencil, ruler, eraser, crayon, paper, scissors
- 聖誕節 (`festival_christmas`): Santa Claus, reindeer, sleigh, stocking, present, ornament, gingerbread
- 農曆新年 (`festival_lunar_new_year`): red packet, lion dance, firecracker, tangerine, blossom, couplet, lucky, family, New Year
- 中秋節 (`festival_mid_autumn`): mooncake, rabbit, lantern, pomelo, harvest
- 端午節 (`festival_dragon_boat`): dragon boat, dumpling, paddle, river, water, winner
- 萬聖節 (`festival_halloween`): pumpkin, costume, ghost, spider, candy, mask
- 身邊的職業 (`sight_jobs_nearby`): doctor, nurse, teacher, principal, firefighter, police officer, paramedic, pharmacist, hairdresser, shop assistant, cashier, security guard, cleaner, domestic helper, postman, delivery worker, driver, bus driver, taxi driver, waiter, gardener, zookeeper, librarian
- 世界各地的職業 (`sight_jobs_world`): chef, farmer, pilot, flight attendant, astronaut, scientist, artist, musician, athlete, actor, reporter, builder, engineer, ship captain, fisherman, lifeguard, photographer, soldier, environmental officer, medical sales representative
- 身體部位 (`sight_body`): mouth, tooth
- 情緒與感受 (`sight_feelings`): angry, excited, tired, hungry, thirsty, hurt
- 衣物 (`sight_clothes`): skirt, jacket, scarf, gloves, shorts
- 家庭與身邊的人 (`sight_family_people`): father, mother, brother, sister, grandfather, grandmother, aunt, uncle, friend, teacher, classmate
- 天氣 (`sight_weather`): stormy, rainbow, umbrella
- 顏色 (`sight_colors`): orange, purple, pink
- 數字 (`sight_numbers`): one, three, four, seven, nine, eleven
- 形狀 (`sight_shapes`): circle, square, triangle, rectangle, star, heart, oval, diamond, cube, cylinder, sphere
- 玩具 (`sight_toys`): ball, puzzle, balloon, target, carousel, maracas
- 動作 (`sight_actions`): write, ride
- 食物 (`sight_food`): rice, apple, banana, chicken
- 蔬菜 (`sight_veg`): carrot, tomato, potato, cabbage, onion, mushroom, cucumber
- 車輛 (`sight_vehicles`): taxi, ferry
- 水果 (`sight_fruit`): apple, banana, orange, mango, melon, lemon, kiwi

此處「暫用完整單字語音」表示目前沒有已批准音塊配置，不代表詞語永遠不適合拼讀。候選總數與各分類狀態以 JSON audit 為準。

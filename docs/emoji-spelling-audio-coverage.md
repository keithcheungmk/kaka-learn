# Emoji Spelling 音塊覆蓋檢查

共 32 個圖詞分類、333 個題目。181 題有待成人覆聽的音塊候選；152 題暫時只讀完整單字。逐題對照見 [phonics audit](emoji-spelling-phonics-audit.json)。

「候選」只代表詞形切分合理，而且需要的音檔都存在；**目前 0 個片段經人耳核實**。全部候選仍要由熟悉英式 synthetic phonics 的成人逐項聽音、核對音檔與混音，才可以標為驗收。未核實的候選不會冒充已驗收。純讀整個單字的題目會用英文 TTS，不會用字母名稱假裝拼讀。

技術檢查顯示 50 個 MP3 可解碼，長度約 0.297–0.833 秒，短於播放器單音逾時。部分檔案的解碼樣本接近或達浮點滿幅；峰值數值不能證明聽感有爆音，仍需人耳檢查。

2026-10-28 補充：新增 16 個保守候選，分佈於動物、家居、節日、職業、衣物、顏色、形狀、玩具、食物、水果、車輛及天氣。涵蓋靜音字母、字尾 y、ng 音及英式非捲舌等特例，全部仍待成人聽音。rice 改用 r/igh/s，不再使用不存在的 ice 音檔；taxi 暫時保留完整詞語語音，避免把非重讀字尾 i 硬配 ee 音檔。職業詞中有多個依賴非重讀 /ə/ 或未核實 r 音，暫保留完整詞語朗讀。審核表亦與遊戲現行配置重新對齊；slide、game 保持完整詞語語音。

## 有待覆聽的候選

- 動物拼字園 (animal_spelling): cat, dog, pig, hen, fox, bat, rat, fish, frog, duck, cow, owl, ant, bee, goat, bear, snail, monkey
- 食物 (sight_food): rice, bread, milk, egg, cake, fish, juice
- 蔬菜 (sight_veg): corn, peas, beans
- 地方 (sight_places): home, park, shop, pool, beach, zoo
- 車輛 (sight_vehicles): car, bus, taxi, tram, train, truck, van, bike, ferry, plane
- 水果 (sight_fruit): grape, mango, pear, peach, kiwi
- 家居用品 (sight_household): bed, chair, lamp, clock, cup, plate, spoon
- 學校用品 (sight_school_items): book, bag, pen, glue
- 聖誕節 (festival_christmas): sleigh, stocking, tree, snowman, bell
- 農曆新年 (festival_lunar_new_year): lucky, feast
- 中秋節 (festival_mid_autumn): moon, rabbit, tea, cloud, sky, night
- 端午節 (festival_dragon_boat): race, team, drum, flag
- 萬聖節 (festival_halloween): pumpkin, witch, bat, trick, treat
- 身邊的職業 (sight_jobs_nearby): dentist, vet
- 世界各地的職業 (sight_jobs_world): artist
- 身體部位 (sight_body): eye, ear, nose, head, hair, face, hand, arm, leg, foot
- 情緒與感受 (sight_feelings): happy, sad, scared, shy, hot, cold
- 衣物 (sight_clothes): shirt, pants, dress, skirt, shoes, socks, hat, coat, scarf, shorts
- 家庭與身邊的人 (sight_family_people): baby
- 天氣 (sight_weather): sunny, cloudy, rainy, windy, hot, cold, snowy, rain, snow, rainbow
- 顏色 (sight_colors): red, blue, yellow, green, pink, black, white, brown, grey, gold
- 數字 (sight_numbers): two, five, six, eight, ten, twelve
- 形狀 (sight_shapes): star, cone
- 玩具 (sight_toys): doll, teddy, toy, dice
- 動作 (sight_actions): run, jump, walk, clap, wave, swim, sleep, read, draw, sing
- 拼一拼・-at (cvc_at): cat, hat, bat, rat, mat
- 拼一拼・-an (cvc_an): can, pan, man, van, fan
- 拼一拼・-ap (cvc_ap): cap, map, tap, nap
- 拼一拼・-in (cvc_in): pin, tin, bin, win
- 拼一拼・-ig (cvc_ig): pig, dig, big, wig
- 拼一拼・-ot (cvc_ot): pot, hot, cot
- 拼一拼・-og (cvc_og): dog, fog, log

## 暫用完整單字語音

- 動物拼字園 (animal_spelling): lion, zebra
- 食物 (sight_food): apple, banana, chicken
- 蔬菜 (sight_veg): carrot, tomato, potato, cabbage, onion, mushroom, cucumber
- 地方 (sight_places): school, hospital, library, classroom
- 水果 (sight_fruit): apple, banana, orange, melon, lemon
- 家居用品 (sight_household): sofa, table, towel
- 學校用品 (sight_school_items): pencil, ruler, eraser, crayon, paper, scissors
- 聖誕節 (festival_christmas): Santa Claus, reindeer, present, ornament, gingerbread
- 農曆新年 (festival_lunar_new_year): red packet, lion dance, firecracker, tangerine, blossom, couplet, family, New Year
- 中秋節 (festival_mid_autumn): mooncake, lantern, pomelo, harvest
- 端午節 (festival_dragon_boat): dragon boat, dumpling, paddle, river, water, winner
- 萬聖節 (festival_halloween): costume, ghost, spider, candy, mask
- 身邊的職業 (sight_jobs_nearby): doctor, nurse, teacher, principal, firefighter, police officer, paramedic, pharmacist, hairdresser, shop assistant, cashier, security guard, cleaner, domestic helper, postman, delivery worker, driver, bus driver, taxi driver, waiter, gardener, zookeeper, librarian
- 世界各地的職業 (sight_jobs_world): chef, farmer, pilot, flight attendant, astronaut, scientist, musician, athlete, actor, reporter, builder, engineer, ship captain, fisherman, lifeguard, photographer, soldier, environmental officer, medical sales representative
- 身體部位 (sight_body): mouth, tooth
- 情緒與感受 (sight_feelings): angry, excited, tired, hungry, thirsty, hurt
- 衣物 (sight_clothes): jacket, gloves
- 家庭與身邊的人 (sight_family_people): father, mother, brother, sister, grandfather, grandmother, aunt, uncle, friend, teacher, classmate
- 天氣 (sight_weather): stormy, umbrella
- 顏色 (sight_colors): orange, purple
- 數字 (sight_numbers): one, three, four, seven, nine, eleven
- 形狀 (sight_shapes): circle, square, triangle, rectangle, heart, oval, diamond, cube, cylinder, sphere
- 玩具 (sight_toys): ball, puzzle, balloon, target, slide, carousel, maracas, game
- 動作 (sight_actions): write, ride

「暫用完整單字語音」表示目前沒有已批准音塊配置，不代表詞語永遠不適合拼讀。圖像審核找到的歧義亦已修正：圓形、正方形、長方形、橢圓改用清晰幾何插圖；nurse emoji 改成與現有插圖一致的男性護士圖示。插圖可讀性仍待實際 iPad 畫面驗收。

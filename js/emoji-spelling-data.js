/* Emoji Spelling draws from the existing English Phonics picture-word gallery. */
(function () {
  const CVC_TITLES = {
    cvc_at: 'Short A Words · -at',
    cvc_an: 'Short A Words · -an',
    cvc_ap: 'Short A Words · -ap',
    cvc_in: 'Short I Words · -in',
    cvc_ig: 'Short I Words · -ig',
    cvc_ot: 'Short O Words · -ot',
    cvc_og: 'Short O Words · -og',
  };

  // Conservative sound groups using existing phoneme recordings; other words use whole-word audio.
  // Recording quality and British accent still require listening review.
  const WORD_PHONICS = {
    "animal_cat": ["c", "a", "t"],
    "animal_dog": ["d", "o", "g"],
    "animal_pig": ["p", "i", "g"],
    "animal_hen": ["h", "e", "n"],
    "animal_fox": ["f", "o", "x"],
    "animal_bat": ["b", "a", "t"],
    "animal_fish": ["f", "i", "sh"],
    "animal_duck": ["d", "u", "ck"],
    "animal_ant": ["a", "n", "t"],
    "animal_bee": ["b", "ee"],
    "animal_goat": ["g", "oa", "t"],
    "animal_cow": ["c", "ow"],
    "animal_owl": ["ow", "l"],
    "animal_snail": ["s", "n", "ai", "l"],
    "sight_food_2": ["m", "i", "l", "k"],
    "sight_food_9": ["j", "oo-long", "s"],
    "sight_veg_1": ["c", "or", "n"],
    "sight_food_7": ["f", "i", "sh"],
    "sight_places_3": ["sh", "o", "p"],
    "sight_places_2": ["p", "ar", "k"],
    "sight_places_6": ["p", "oo-long", "l"],
    "sight_places_8": ["z", "oo-long"],
    "sight_vehicles_1": ["b", "u", "s"],
    "sight_vehicles_0": ["c", "ar"],
    "sight_vehicles_3": ["t", "r", "a", "m"],
    "sight_vehicles_4": ["t", "r", "ai", "n"],
    "sight_vehicles_5": ["t", "r", "u", "ck"],
    "sight_vehicles_6": ["v", "a", "n"],
    "sight_household_0": ["b", "e", "d"],
    "sight_household_4": ["l", "a", "m", "p"],
    "sight_household_5": ["c", "l", "o", "ck"],
    "sight_household_6": ["c", "u", "p"],
    "sight_household_8": ["s", "p", "oo-long", "n"],
    "sight_school_items_0": ["b", "oo-short", "k"],
    "sight_school_items_1": ["b", "a", "g"],
    "sight_school_items_2": ["p", "e", "n"],
    "festival_christmas_5": ["t", "r", "ee"],
    "festival_christmas_9": ["b", "e", "ll"],
    "festival_halloween_5": ["b", "a", "t"],
    "festival_mid_autumn_1": ["m", "oo-long", "n"],
    "festival_mid_autumn_8": ["n", "igh", "t"],
    "festival_dragon_boat_6": ["d", "r", "u", "m"],
    "festival_dragon_boat_7": ["f", "l", "a", "g"],
    "sight_jobs_nearby_23": ["v", "e", "t"],
    "sight_body_5": ["h", "air"],
    "sight_clothes_1": ["p", "a", "n", "t", "s"],
    "sight_body_7": ["h", "a", "n", "d"],
    "sight_body_8": ["ar", "m"],
    "sight_body_9": ["l", "e", "g"],
    "sight_body_10": ["f", "oo-short", "t"],
    "sight_feelings_1": ["s", "a", "d"],
    "sight_feelings_9": ["h", "o", "t"],
    "sight_clothes_6": ["h", "a", "t"],
    "sight_clothes_2": ["d", "r", "e", "ss"],
    "sight_weather_5": ["h", "o", "t"],
    "sight_weather_8": ["r", "ai", "n"],
    "sight_colors_0": ["r", "e", "d"],
    "sight_colors_3": ["g", "r", "ee", "n"],
    "sight_colors_9": ["b", "r", "ow", "n"],
    "sight_colors_7": ["b", "l", "a", "ck"],
    "sight_numbers_5": ["s", "i", "x"],
    "sight_numbers_9": ["t", "e", "n"],
    "sight_toys_1": ["d", "o", "ll"],
    "sight_actions_1": ["j", "u", "m", "p"],
    "sight_actions_0": ["r", "u", "n"],
    "sight_actions_3": ["c", "l", "a", "p"],
    "sight_actions_5": ["s", "w", "i", "m"],
    "sight_actions_10": ["s", "i", "ng"],
    "cat": ["c", "a", "t"],
    "hat": ["h", "a", "t"],
    "bat": ["b", "a", "t"],
    "van": ["v", "a", "n"],
    "pig": ["p", "i", "g"],
    "hot": ["h", "o", "t"],
    "dog": ["d", "o", "g"],
    "rat": ["r", "a", "t"],
    "mat": ["m", "a", "t"],
    "can": ["c", "a", "n"],
    "pan": ["p", "a", "n"],
    "man": ["m", "a", "n"],
    "fan": ["f", "a", "n"],
    "cap": ["c", "a", "p"],
    "map": ["m", "a", "p"],
    "tap": ["t", "a", "p"],
    "nap": ["n", "a", "p"],
    "pin": ["p", "i", "n"],
    "tin": ["t", "i", "n"],
    "bin": ["b", "i", "n"],
    "win": ["w", "i", "n"],
    "dig": ["d", "i", "g"],
    "big": ["b", "i", "g"],
    "wig": ["w", "i", "g"],
    "pot": ["p", "o", "t"],
    "cot": ["c", "o", "t"],
    "fog": ["f", "o", "g"],
    "log": ["l", "o", "g"],
    "animal_rat": ["r", "a", "t"],
    "animal_frog": ["f", "r", "o", "g"],
  };

  // Alternate spellings are explicitly curated; labels show written graphemes,
  // while clips identify their sound. Split-e words show spoken letters in order and
  // explain the silent final e separately so the visible tiles stay in reading order.
  const ALTERNATE_PHONICS = {
    animal_bear: { word: 'bear', labels: ['b', 'ear'], sounds: ['b', 'air'] },
    sight_food_1: { word: 'bread', labels: ['b', 'r', 'ea', 'd'], sounds: ['b', 'r', 'e', 'd'] },
    sight_food_3: { word: 'egg', labels: ['e', 'gg'], sounds: ['e', 'g'] },
    sight_food_6: { word: 'cake', labels: ['c', 'a', 'k'], sounds: ['c', 'ai', 'k'], notes: ['e 不發音'] },
    sight_veg_4: { word: 'peas', labels: ['p', 'ea', 's'], sounds: ['p', 'ee', 'z'] },
    sight_veg_5: { word: 'beans', labels: ['b', 'ea', 'n', 's'], sounds: ['b', 'ee', 'n', 'z'] },
    sight_fruit_6: { word: 'pear', labels: ['p', 'ear'], sounds: ['p', 'air'] },
    sight_fruit_7: { word: 'peach', labels: ['p', 'ea', 'ch'], sounds: ['p', 'ee', 'ch'] },
    sight_fruit_3: { word: 'grape', labels: ['g', 'r', 'a', 'p'], sounds: ['g', 'r', 'ai', 'p'], notes: ['e 不發音'] },
    sight_vehicles_7: { word: 'bike', labels: ['b', 'i', 'k'], sounds: ['b', 'igh', 'k'], notes: ['e 不發音'] },
    sight_vehicles_9: { word: 'plane', labels: ['p', 'l', 'a', 'n'], sounds: ['p', 'l', 'ai', 'n'], notes: ['e 不發音'] },
    sight_places_0: { word: 'home', labels: ['h', 'o', 'm'], sounds: ['h', 'oa', 'm'], notes: ['e 不發音'] },
    sight_places_7: { word: 'beach', labels: ['b', 'ea', 'ch'], sounds: ['b', 'ee', 'ch'] },
    sight_household_7: { word: 'plate', labels: ['p', 'l', 'a', 't'], sounds: ['p', 'l', 'ai', 't'], notes: ['e 不發音'] },
    festival_christmas_8: { word: 'snowman', labels: ['s', 'n', 'ow', 'm', 'a', 'n'], sounds: ['s', 'n', 'oa', 'm', 'a', 'n'] },
    festival_mid_autumn_5: { word: 'tea', labels: ['t', 'ea'], sounds: ['t', 'ee'] },
    festival_mid_autumn_6: { word: 'cloud', labels: ['c', 'l', 'ou', 'd'], sounds: ['c', 'l', 'ow', 'd'] },
    festival_lunar_new_year_8: { word: 'feast', labels: ['f', 'ea', 's', 't'], sounds: ['f', 'ee', 's', 't'] },
    festival_dragon_boat_5: { word: 'team', labels: ['t', 'ea', 'm'], sounds: ['t', 'ee', 'm'] },
    sight_jobs_nearby_7: { word: 'dentist', labels: ['d', 'e', 'n', 't', 'i', 's', 't'], sounds: ['d', 'e', 'n', 't', 'i', 's', 't'] },
    sight_body_2: { word: 'nose', labels: ['n', 'o', 's'], sounds: ['n', 'oa', 'z'], notes: ['e 不發音'] },
    sight_body_0: { word: 'eye', labels: ['eye'], sounds: ['igh'], notes: ['eye 是表示 /aɪ/ 的特殊拼法'] },
    sight_body_1: { word: 'ear', labels: ['ear'], sounds: ['ear'], notes: ['英式發音需覆核 /ɪə/ 音檔'] },
    sight_body_4: { word: 'head', labels: ['h', 'ea', 'd'], sounds: ['h', 'e', 'd'] },
    sight_body_6: { word: 'face', labels: ['f', 'a', 'c'], sounds: ['f', 'ai', 's'], notes: ['e 不發音', 'c 發 /s/'] },
    sight_numbers_11: { word: 'twelve', labels: ['t', 'w', 'e', 'l', 'v'], sounds: ['t', 'w', 'e', 'l', 'v'], notes: ['字尾 e 不發音'] },
    sight_numbers_1: { word: 'two', labels: ['t', 'o'], sounds: ['t', 'oo-long'], notes: ['w 不發音'] },
    sight_clothes_4: { word: 'shoes', labels: ['sh', 'oe', 's'], sounds: ['sh', 'oo-long', 'z'], notes: ['oe 表示 /uː/', '字尾 s 發 /z/'] },
    sight_clothes_0: { word: 'shirt', labels: ['sh', 'ir', 't'], sounds: ['sh', 'er', 't'], notes: ['英式 ir 表示 /ɜː/；需成人覆核音檔'] },
    sight_food_9: { word: 'juice', labels: ['j', 'ui', 'c'], sounds: ['j', 'oo-long', 's'], notes: ['e 不發音', 'c 發 /s/'] },
    sight_school_items_8: { word: 'glue', labels: ['g', 'l', 'ue'], sounds: ['g', 'l', 'oo-long'], notes: ['ue 是一組字母，表示 /uː/'] },
    festival_halloween_2: { word: 'witch', labels: ['w', 'i', 'tch'], sounds: ['w', 'i', 'ch'], notes: ['tch 表示一個 /tʃ/ 音'] },
    festival_halloween_8: { word: 'trick', labels: ['t', 'r', 'i', 'ck'], sounds: ['t', 'r', 'i', 'ck'], notes: ['/tr/ 是開首子音連綴'] },
    festival_halloween_9: { word: 'treat', labels: ['t', 'r', 'ea', 't'], sounds: ['t', 'r', 'ee', 't'], notes: ['/tr/ 是開首子音連綴'] },
    festival_mid_autumn_7: { word: 'sky', labels: ['s', 'k', 'y'], sounds: ['s', 'k', 'igh'], notes: ['y 在字尾表示 /aɪ/'] },
    festival_dragon_boat_3: { word: 'race', labels: ['r', 'a', 'c'], sounds: ['r', 'ai', 's'], notes: ['e 不發音', 'c 發 /s/'] },
    sight_colors_7: { word: 'black', labels: ['b', 'l', 'a', 'ck'], sounds: ['b', 'l', 'a', 'ck'] },
    sight_numbers_5: { word: 'six', labels: ['s', 'i', 'x'], sounds: ['s', 'i', 'x'] },
    sight_numbers_9: { word: 'ten', labels: ['t', 'e', 'n'], sounds: ['t', 'e', 'n'] },
    sight_toys_1: { word: 'doll', labels: ['d', 'o', 'll'], sounds: ['d', 'o', 'll'] },
    sight_toys_2: { word: 'teddy', labels: ['t', 'e', 'dd', 'y'], sounds: ['t', 'e', 'd', 'ee'], notes: ['dd 表示一個 /d/ 音', '字尾 y 表示 /i/'] },
    sight_feelings_0: { word: 'happy', labels: ['h', 'a', 'pp', 'y'], sounds: ['h', 'a', 'p', 'ee'], notes: ['pp 表示一個 /p/ 音', '字尾 y 表示 /i/'] },
    sight_family_people_4: { word: 'baby', labels: ['b', 'a', 'b', 'y'], sounds: ['b', 'ai', 'b', 'ee'], notes: ['字尾 y 表示 /i/'] },
    sight_colors_2: { word: 'yellow', labels: ['y', 'e', 'll', 'ow'], sounds: ['y', 'e', 'l', 'oa'], notes: ['字尾 ow 在 yellow 中表示 /əʊ/', 'll 表示一個 /l/ 音'] },
    sight_weather_1: { word: 'cloudy', labels: ['c', 'l', 'ou', 'd', 'y'], sounds: ['c', 'l', 'ow', 'd', 'ee'], notes: ['ou 表示 /aʊ/', '字尾 y 表示 /i/'] },
    sight_weather_7: { word: 'snowy', labels: ['s', 'n', 'ow', 'y'], sounds: ['s', 'n', 'oa', 'ee'], notes: ['ow 在 snowy 中表示 /əʊ/', '字尾 y 表示 /i/'] },
    sight_weather_2: { word: 'rainy', labels: ['r', 'ai', 'n', 'y'], sounds: ['r', 'ai', 'n', 'ee'], notes: ['字尾 y 表示 /i/', '英式 /r/ 音檔需覆核'] },
    sight_weather_0: { word: 'sunny', labels: ['s', 'u', 'nn', 'y'], sounds: ['s', 'u', 'n', 'ee'], notes: ['nn 表示一個 /n/ 音', '字尾 y 表示 /i/'] },
    sight_weather_3: { word: 'windy', labels: ['w', 'i', 'n', 'd', 'y'], sounds: ['w', 'i', 'n', 'd', 'ee'], notes: ['字尾 y 表示 /i/'] },
    sight_actions_2: { word: 'walk', labels: ['w', 'a', 'k'], sounds: ['w', 'or', 'k'], notes: ['l 不發音', 'a 在 walk 中表示 /ɔː/'] },
    sight_actions_9: { word: 'draw', labels: ['d', 'r', 'aw'], sounds: ['d', 'r', 'or'], notes: ['aw 表示 /ɔː/', '/dr/ 是開首子音連綴；英式 /r/ 音檔需覆核'] },
    sight_colors_10: { word: 'grey', labels: ['g', 'r', 'ey'], sounds: ['g', 'r', 'ai'], notes: ['ey 表示 /eɪ/', '/gr/ 是開首子音連綴；英式 /r/ 音檔需覆核'] },
    sight_feelings_3: { word: 'scared', labels: ['s', 'c', 'are', 'd'], sounds: ['s', 'k', 'air', 'd'], notes: ['are 在 scared 中表示 /eə/', 'sc 是 /s/ + /k/ 的開首子音連綴'] },
    sight_feelings_10: { word: 'cold', labels: ['c', 'o', 'l', 'd'], sounds: ['c', 'oa', 'l', 'd'] },
    sight_feelings_5: { word: 'shy', labels: ['sh', 'y'], sounds: ['sh', 'igh'] },
    sight_clothes_5: { word: 'socks', labels: ['s', 'o', 'ck', 's'], sounds: ['s', 'o', 'ck', 's'] },
    sight_clothes_7: { word: 'coat', labels: ['c', 'oa', 't'], sounds: ['c', 'oa', 't'] },
    sight_weather_6: { word: 'cold', labels: ['c', 'o', 'l', 'd'], sounds: ['c', 'oa', 'l', 'd'] },
    sight_weather_9: { word: 'snow', labels: ['s', 'n', 'ow'], sounds: ['s', 'n', 'oa'] },
    sight_colors_1: { word: 'blue', labels: ['b', 'l', 'ue'], sounds: ['b', 'l', 'oo-long'] },
    sight_colors_8: { word: 'white', labels: ['wh', 'i', 't'], sounds: ['w', 'igh', 't'], notes: ['e 不發音'] },
    sight_colors_11: { word: 'gold', labels: ['g', 'o', 'l', 'd'], sounds: ['g', 'oa', 'l', 'd'] },
    sight_numbers_4: { word: 'five', labels: ['f', 'i', 'v'], sounds: ['f', 'igh', 'v'], notes: ['e 不發音'] },
    sight_numbers_7: { word: 'eight', labels: ['eigh', 't'], sounds: ['ai', 't'] },
    sight_shapes_9: { word: 'cone', labels: ['c', 'o', 'n'], sounds: ['c', 'oa', 'n'], notes: ['e 不發音'] },
    sight_toys_4: { word: 'toy', labels: ['t', 'oy'], sounds: ['t', 'oi'] },
    sight_toys_6: { word: 'dice', labels: ['d', 'i', 'c'], sounds: ['d', 'igh', 's'], notes: ['e 不發音', 'c 發 /s/'] },
    sight_toys_8: { word: 'slide', labels: ['s', 'l', 'i', 'd'], sounds: ['s', 'l', 'igh', 'd'], notes: ['e 不發音'] },
    sight_toys_11: { word: 'game', labels: ['g', 'a', 'm'], sounds: ['g', 'ai', 'm'], notes: ['e 不發音'] },
    sight_actions_4: { word: 'wave', labels: ['w', 'a', 'v'], sounds: ['w', 'ai', 'v'], notes: ['e 不發音'] },
    // This action word means the present-tense /riːd/; use a disambiguated TTS cue.
    sight_actions_7: { word: 'read', labels: ['r', 'ea', 'd'], sounds: ['r', 'ee', 'd'], spokenText: 'reed' },
    sight_actions_6: { word: 'sleep', labels: ['s', 'l', 'ee', 'p'], sounds: ['s', 'l', 'ee', 'p'] },
  };

  // Corrections local to this game: use native emoji when a clear one exists.
  const PICTURE_CORRECTIONS = {
    sight_veg_5: { emoji: '🫘' },
    sight_places_9: { objectArt: './assets/emoji-spelling/classroom.svg' },
    sight_places_2: { objectArt: './assets/emoji-spelling/park.svg' },
    sight_places_8: { objectArt: './assets/emoji-spelling/zoo.svg' },
    sight_school_items_5: { objectArt: './assets/emoji-spelling/eraser.svg' },
    sight_school_items_8: { objectArt: './assets/emoji-spelling/glue.svg' },
    festival_christmas_6: { objectArt: './assets/emoji-spelling/ornament.svg' },
    festival_mid_autumn_4: { objectArt: './assets/common-sense/scenes/fest-pomelo.webp' },
    festival_dragon_boat_0: { emoji: '🐉🚣' },
    festival_dragon_boat_2: { objectArt: './assets/emoji-spelling/paddle.svg' },
    sight_weather_8: { emoji: '🌧️' },
    sight_weather_9: { emoji: '❄️' },
    sight_feelings_5: { emoji: '😳' },
    sight_family_people_11: { objectArt: './assets/emoji-spelling/classmates.svg' },
    festival_halloween_1: { objectArt: './assets/emoji-spelling/costume.svg' },
    sight_shapes_9: { objectArt: './assets/emoji-spelling/cone.svg' },
    sight_shapes_10: { objectArt: './assets/emoji-spelling/cylinder.svg' },
    sight_shapes_11: { objectArt: './assets/emoji-spelling/sphere.svg' },
    sight_toys_11: { objectArt: './assets/emoji-spelling/board-game.svg' },
  };

  function cleanLetters(word) {
    return Array.from(String(word || '').toLowerCase()).filter((letter) => /[a-z]/.test(letter));
  }

  function getTopics(phonics = window.KakaPhonicsWords) {
    if (!phonics || !Array.isArray(phonics.PHONICS_TOPICS)) return [];
    return phonics.PHONICS_TOPICS
      .flatMap((topic) => topic.collections?.length ? topic.collections : [topic])
      .filter((topic) => topic.id !== 'letters_rev' && Array.isArray(topic.words) && topic.words.length)
      .map((topic) => ({
        id: topic.id,
        title: topic.title || topic.titleEn || topic.id,
        titleEn: topic.titleEn || CVC_TITLES[topic.id] || topic.title || 'Word Family',
        cover: topic.cover || topic.words.find((word) => word.emoji)?.emoji || '🔤',
        coverPhoto: topic.coverPhoto || '',
        words: topic.words
          .filter((word) => word?.word && word.emoji && cleanLetters(word.word).length)
          .map((word) => {
            const parts = String(word.word).trim().split(/\s+/);
            let offset = 0;
            const wordBreaks = [];
            parts.slice(0, -1).forEach((part) => {
              offset += cleanLetters(part).length;
              wordBreaks.push(offset);
            });
            const alternate = ALTERNATE_PHONICS[word.id];
            const approved = alternate?.word === String(word.word).trim().toLowerCase() ? alternate : null;
            return {
              id: `${topic.id}:${word.id}`,
              sourceId: word.id,
              word: String(word.word).trim(),
              letters: cleanLetters(word.word),
              wordBreaks,
              emoji: PICTURE_CORRECTIONS[word.id]?.emoji || word.emoji,
              plate: word.plate || '#24446a',
              photo: word.photo || '',
              objectArt: PICTURE_CORRECTIONS[word.id]?.objectArt || word.objectArt || '',
              phonicsChunks: approved?.sounds || WORD_PHONICS[word.id] || [],
              phonicsLabels: approved?.labels || null,
              phonicsNotes: approved?.notes || [],
              spokenText: approved?.spokenText || '',
            };
          }),
      }))
      .filter((topic) => topic.words.length);
  }

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function makeLetterPool(word, random = Math.random, distractorCount = 4) {
    const letters = cleanLetters(word);
    const answerLetters = new Set(letters);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((letter) => !answerLetters.has(letter));
    const distractors = shuffle(alphabet, random).slice(0, Math.max(0, distractorCount));
    return shuffle([
      ...letters.map((letter, index) => ({ key: `answer-${index}`, letter, answer: true })),
      ...distractors.map((letter, index) => ({ key: `distractor-${index}`, letter, answer: false })),
    ], random);
  }

  function createAnswerSlots(length) {
    return Array.from({ length }, () => null);
  }

  function planRound(words, offset, length) {
    if (!words.length) return [];
    return Array.from({ length }, (_, index) => words[(offset + index) % words.length]);
  }

  function nextEmptySlot(slots) {
    return slots.findIndex((item) => !item);
  }

  function isCorrectAnswer(slots, word) {
    return slots.filter(Boolean).map((item) => item.letter).join('') === cleanLetters(word).join('');
  }

  window.KakaEmojiSpellingData = {
    getTopics,
    cleanLetters,
    shuffle,
    makeLetterPool,
    createAnswerSlots,
    planRound,
    nextEmptySlot,
    isCorrectAnswer,
  };
})();

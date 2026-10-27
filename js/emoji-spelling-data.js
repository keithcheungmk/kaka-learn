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
    "animal_snail": ["s", "n", "ai", "l"],
    "sight_food_0": ["r", "ice"],
    "sight_food_2": ["m", "i", "l", "k"],
    "sight_food_7": ["f", "i", "sh"],
    "sight_places_3": ["sh", "o", "p"],
    "sight_places_6": ["p", "oo-long", "l"],
    "sight_places_8": ["z", "oo-long"],
    "sight_vehicles_1": ["b", "u", "s"],
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
    "sight_jobs_nearby_23": ["v", "e", "t"],
    "sight_body_5": ["h", "air"],
    "sight_body_7": ["h", "a", "n", "d"],
    "sight_body_9": ["l", "e", "g"],
    "sight_body_10": ["f", "oo-short", "t"],
    "sight_feelings_1": ["s", "a", "d"],
    "sight_feelings_9": ["h", "o", "t"],
    "sight_clothes_6": ["h", "a", "t"],
    "sight_weather_5": ["h", "o", "t"],
    "sight_colors_0": ["r", "e", "d"],
    "sight_colors_7": ["b", "l", "a", "ck"],
    "sight_numbers_5": ["s", "i", "x"],
    "sight_numbers_9": ["t", "e", "n"],
    "sight_toys_1": ["d", "o", "ll"],
    "sight_actions_1": ["j", "u", "m", "p"],
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

  // Corrections local to this game: use native emoji when a clear one exists.
  const PICTURE_CORRECTIONS = {
    sight_veg_5: { emoji: '🫘' },
    sight_places_9: { objectArt: './assets/emoji-spelling/classroom.svg' },
    sight_school_items_5: { objectArt: './assets/emoji-spelling/eraser.svg' },
    sight_school_items_8: { objectArt: './assets/emoji-spelling/glue.svg' },
    festival_christmas_6: { objectArt: './assets/emoji-spelling/ornament.svg' },
    festival_mid_autumn_4: { objectArt: './assets/common-sense/scenes/fest-pomelo.webp' },
    festival_dragon_boat_0: { emoji: '🐉🚣' },
    festival_dragon_boat_2: { objectArt: './assets/emoji-spelling/paddle.svg' },
    sight_weather_8: { emoji: '🌧️' },
    sight_weather_9: { emoji: '❄️' },
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
              phonicsChunks: WORD_PHONICS[word.id] || [],
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

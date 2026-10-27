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

  // Current English source contains these pictograms without local SVGs.
  // The renderer uses the device emoji for them instead of requesting a 404.
  const NATIVE_EMOJI_IDS = new Set([
    '2603', '1F6F7', '1F9E7', '1F9E8', '1F340', '1F96E', '1F315',
    '1F407', '1F3EE', '1F375', '1F30C', '1F33E', '1F409', '1F6F6',
    '1F941', '1F978', '1F9D9', '1F47B', '1FA84', '1F36D',
  ]);

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
              emoji: word.emoji,
              plate: word.plate || '#24446a',
              photo: word.photo || '',
              objectArt: word.objectArt || '',
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

  function makeLetterPool(word, random = Math.random) {
    const letters = cleanLetters(word);
    const answerLetters = new Set(letters);
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').filter((letter) => !answerLetters.has(letter));
    const distractors = shuffle(alphabet, random).slice(0, 4);
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
    needsNativeEmoji: (id) => NATIVE_EMOJI_IDS.has(id),
    nextEmptySlot,
    isCorrectAnswer,
  };
})();

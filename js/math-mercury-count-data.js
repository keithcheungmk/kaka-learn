/** 水星・數一數題目資料。只做一個動作：逐粒數物件，再揀數字。 */
(function () {
  const PLANET_ID = 'number-relations'; // 保留舊水星進度鍵，避免重置家庭資料
  const OBJECTS = [
    { emoji: '🍎', name: '蘋果', counter: '個' },
    { emoji: '🐥', name: '小雞', counter: '隻' },
    { emoji: '⭐', name: '星星', counter: '粒' },
  ];
  const ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function stageForCompletedRounds(completedRounds = 0) {
    if (completedRounds >= 3) return { max: 10, skillId: 'count.oneToOne.1to10' };
    if (completedRounds >= 1) return { max: 5, skillId: 'count.oneToOne.1to5' };
    return { max: 3, skillId: 'count.oneToOne.1to5' };
  }

  function completedRoundsFromState(state = {}) {
    const countProgress = state.mercuryCountProgress;
    return Number.isInteger(countProgress?.completedRounds)
      ? Math.max(0, countProgress.completedRounds)
      : 0;
  }

  function makeChoices(answer, max, random = Math.random) {
    const pool = Array.from({ length: max }, (_, index) => index + 1);
    const distractors = shuffle(pool.filter((n) => n !== answer), random).slice(0, 2);
    return shuffle([answer, ...distractors], random);
  }

  function makeQuestion({ count, object = OBJECTS[0], max = 3, random = Math.random } = {}) {
    if (!Number.isInteger(count) || count < 1 || count > max) {
      throw new RangeError(`Mercury count must be between 1 and ${max}`);
    }
    return {
      type: 'count-objects',
      count,
      object,
      max,
      answer: count,
      skillId: max > 5 ? 'count.oneToOne.1to10' : 'count.oneToOne.1to5',
      prompt: `數一數，有幾${object.counter}${object.name}？`,
      speak: `請數一數，有幾${object.counter}${object.name}？`,
      spokenCorrect: `有${ZH[count]}${object.counter}${object.name}。我哋由一開始逐${object.counter}數：${Array.from({ length: count }, (_, i) => ZH[i + 1]).join('、')}。一共有${ZH[count]}${object.counter}${object.name}。`,
      choices: makeChoices(count, max, random),
    };
  }

  function generateMission({ completedRounds = 0, random = Math.random, length = 5 } = {}) {
    const stage = stageForCompletedRounds(completedRounds);
    return Array.from({ length }, (_, index) => {
      const count = Math.floor(random() * stage.max) + 1;
      const object = OBJECTS[index % OBJECTS.length];
      return makeQuestion({ count, object, max: stage.max, random });
    });
  }

  function LEARN_STEPS() {
    return [1, 2, 3].map((count) => ({
      count,
      object: OBJECTS[0],
      title: count === 1 ? '數一粒' : `數${count}個`,
      prompt: `望住蘋果，逐個數一數。`,
      speak: `${ZH[count]}個蘋果。我哋由一開始逐個數：${Array.from({ length: count }, (_, i) => ZH[i + 1]).join('、')}。`,
    }));
  }

  window.KakaMathMercuryCountData = {
    PLANET_ID,
    OBJECTS,
    stageForCompletedRounds,
    completedRoundsFromState,
    makeQuestion,
    generateMission,
    LEARN_STEPS: LEARN_STEPS(),
    shuffle,
  };
})();

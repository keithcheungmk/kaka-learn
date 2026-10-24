/** 數字探險：生活物件數量 5–20，並以五個一組呈現。 */
(function () {
  const PLANET_ID = 'number-relations'; // 保留舊水星進度鍵，避免重置家庭資料
  const OBJECTS = [
    { emoji: '🍓', name: '士多啤梨', counter: '粒' },
    { emoji: '🫐', name: '藍莓', counter: '粒' },
    { emoji: '🪙', name: '硬幣', counter: '個' },
    { emoji: '🍊', name: '橙', counter: '個' },
  ];
  const ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十'];

  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function stageForCompletedRounds(completedRounds = 0) {
    if (completedRounds >= 3) return { min: 5, max: 20, skillId: 'count.oneToOne.1to20' };
    if (completedRounds >= 1) return { min: 5, max: 15, skillId: 'count.oneToOne.1to20' };
    return { min: 5, max: 10, skillId: 'count.oneToOne.1to20' };
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
      skillId: 'count.oneToOne.1to20',
      prompt: `數字探險：睇睇有幾多${object.counter}${object.name}？`,
      speak: `我哋一齊數數，有幾多${object.counter}${object.name}？可以五個五個咁數。`,
      spokenCorrect: `一共有${ZH[count]}${object.counter}${object.name}。我哋五個一組數：${Array.from({ length: Math.floor(count / 5) }, (_, i) => ZH[(i + 1) * 5]).join('、')}${count % 5 ? `，再加${ZH[count % 5]}` : ''}。答案係${ZH[count]}。`,
      choices: makeChoices(count, max, random),
    };
  }

  function generateMission({ completedRounds = 0, random = Math.random, length = 10 } = {}) {
    const stage = stageForCompletedRounds(completedRounds);
    return Array.from({ length }, (_, index) => {
      const count = Math.floor(random() * (stage.max - stage.min + 1)) + stage.min;
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

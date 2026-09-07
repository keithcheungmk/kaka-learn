/** 水星數感題目引擎：純資料生成，不依賴 DOM。 */
(function () {
  const TYPE_ORDER = ['oneToOne', 'oneToOne', 'subitize', 'conservation', 'numberMatch', 'oneMoreLess'];
  const SKILL_IDS = {
    oneToOne: 'count.oneToOne.1to10',
    subitize: 'count.subitize.1to5',
    conservation: 'count.quantityConservation.1to8',
    numberMatch: 'count.numberMatch.0to10',
    oneMoreLess: 'count.oneMoreLess.0to10',
  };

  function integer(random, min, max) {
    return min + Math.floor(random() * (max - min + 1));
  }

  function shuffle(values, random) {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function numberOptions(answer, random, min = 0, max = 10) {
    const candidates = [answer, answer - 1, answer + 1, answer - 2, answer + 2]
      .filter((n) => n >= min && n <= max);
    const unique = [...new Set(candidates)];
    while (unique.length < 3) {
      const n = integer(random, min, max);
      if (!unique.includes(n)) unique.push(n);
    }
    return shuffle(unique.slice(0, 3), random);
  }

  function makeQuestion(type, random = Math.random) {
    if (!SKILL_IDS[type]) throw new Error(`KakaMathQuestionEngine: unknown type ${type}`);
    const base = {
      id: `${type}-${Date.now()}-${Math.floor(random() * 1e6)}`,
      type,
      skillId: SKILL_IDS[type],
    };

    if (type === 'oneToOne') {
      const answer = integer(random, 1, 10);
      return {
        ...base,
        answer,
        quantity: answer,
        arrangement: random() < 0.5 ? 'scattered' : 'arc',
        options: numberOptions(answer, random, 0, 10),
        prompt: '逐粒撳住數，數完再揀答案。',
        speech: '逐粒撳住數，每粒只數一次。',
        representation: 'touchObjects',
      };
    }

    if (type === 'subitize') {
      const answer = integer(random, 1, 5);
      return {
        ...base,
        answer,
        quantity: answer,
        arrangement: answer <= 4 ? 'dice' : 'fiveFrame',
        options: numberOptions(answer, random, 0, 5),
        prompt: '唔使逐粒數，你一眼見到幾多粒？',
        speech: '望一望，你一眼見到幾多粒？',
        representation: answer <= 4 ? 'dicePattern' : 'fiveFrame',
      };
    }

    if (type === 'conservation') {
      const answer = integer(random, 2, 8);
      return {
        ...base,
        answer,
        quantity: answer,
        arrangements: ['line', 'scattered'],
        options: numberOptions(answer, random, 0, 10),
        prompt: '星星排開咗，數量有冇變？而家係幾多粒？',
        speech: '星星只係排開咗，數量有冇變？而家係幾多粒？',
        representation: 'rearrangedObjects',
      };
    }

    if (type === 'numberMatch') {
      const answer = integer(random, 0, 10);
      return {
        ...base,
        answer,
        targetNumber: answer,
        options: numberOptions(answer, random, 0, 10),
        prompt: `邊一組有 ${answer} 粒？`,
        speech: `邊一組有${answer}粒？`,
        representation: 'numberToQuantity',
      };
    }

    const relation = random() < 0.5 ? 'more' : 'less';
    const min = relation === 'less' ? 1 : 0;
    const max = relation === 'more' ? 9 : 10;
    const shown = integer(random, min, max);
    const answer = shown + (relation === 'more' ? 1 : -1);
    return {
      ...base,
      answer,
      shown,
      relation,
      quantity: shown,
      options: numberOptions(answer, random, 0, 10),
      prompt: `${shown} ${relation === 'more' ? '多一個' : '少一個'}係幾多？`,
      speech: `${shown}${relation === 'more' ? '多一個' : '少一個'}係幾多？`,
      representation: 'oneMoreLessObjects',
    };
  }

  function generateMission(options = {}) {
    const random = typeof options.random === 'function' ? options.random : Math.random;
    return TYPE_ORDER.map((type) => makeQuestion(type, random));
  }

  function classifyError(question, answer) {
    if (!question) return 'unknown';
    if (Math.abs(Number(answer) - Number(question.answer)) === 1) return 'offByOne';
    if (question.type === 'oneMoreLess') return 'operationConfusion';
    if (question.type === 'conservation') return 'quantityConservation';
    return 'randomGuess';
  }

  function hintFor(question, attemptNumber) {
    const second = attemptNumber >= 2;
    const hints = {
      oneToOne: second ? '我幫你照亮未數嘅星星，再逐粒撳一次。' : '亮起咗嘅已經數過，每粒只撳一次。',
      subitize: second ? '望吓佢哋似骰仔點樣排，試吓成組睇。' : '試吓唔好逐粒數，成組望一次。',
      conservation: second ? '冇星星飛走，亦冇新星星加入。' : '只係排法唔同，總數可能冇變。',
      numberMatch: second ? `逐粒點數，搵有 ${question.targetNumber} 粒嗰組。` : '將數字同每組星星嘅數量配對。',
      oneMoreLess: second ? `由 ${question.shown} 開始，${question.relation === 'more' ? '加一粒' : '拿走一粒'}再數。` : `留意今次係${question.relation === 'more' ? '多' : '少'}一個。`,
    };
    return hints[question.type] || '慢慢睇，再試一次。';
  }

  window.KakaMathQuestionEngine = {
    TYPE_ORDER,
    SKILL_IDS,
    makeQuestion,
    generateMission,
    classifyError,
    hintFor,
  };
})();

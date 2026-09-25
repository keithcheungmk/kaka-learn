/** 水星・數字關係：0–10 數軸題目引擎（純資料，不依賴 DOM）。 */
(function () {
  const PLANET_ID = 'number-relations';
  const ZH = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const SKILL = {
    position: 'relation.positionOrder.0to10',
    distance: 'relation.distance.0to10',
    compose: 'relation.compose.twoJumps.0to10',
    makeTen: 'relation.makeTen.5to10',
    inverse: 'relation.inverse.0to10',
  };

  function zh(n) {
    return ZH[n] ?? String(n);
  }

  function pick(arr, random = Math.random) {
    return arr[Math.floor(random() * arr.length)];
  }

  function shuffle(arr, random = Math.random) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function needsEasy(skillProgress) {
    if (!skillProgress || typeof skillProgress !== 'object') return true;
    const ids = Object.values(SKILL);
    let assisted = 0;
    let attempts = 0;
    ids.forEach((id) => {
      const s = skillProgress[id];
      if (!s) return;
      attempts += s.attempts || 0;
      assisted += s.assistedCorrect || 0;
    });
    if (attempts < 6) return true;
    return assisted / Math.max(1, attempts) >= 0.35;
  }

  function makePosition(target, promptKind = 'place') {
    const prompts = {
      place: `將標記放去數字${zh(target)}。`,
      before: `${zh(target + 1)}前面一個數係邊個？`,
      after: `${zh(target - 1)}後面一個數係邊個？`,
      middle: `邊個數喺${zh(target - 1)}同${zh(target + 1)}中間？`,
      missing: `呢度缺咗一個數；請放去正確位置。`,
    };
    return {
      type: 'position',
      skillId: SKILL.position,
      prompt: prompts[promptKind] || prompts.place,
      promptKind,
      start: null,
      target,
      hideLabels: promptKind === 'missing' ? [target] : [],
      spokenCorrect: `你搵到${zh(target)}。${zh(target)}喺${target > 0 ? zh(target - 1) + '後面' : '最左邊'}${target < 10 ? '、' + zh(target + 1) + '前面' : ''}。`,
    };
  }

  function makeOrder(kind, center) {
    if (kind === 'before') {
      return {
        type: 'order',
        skillId: SKILL.position,
        prompt: `${zh(center)}前面一個數係邊個？`,
        start: null,
        target: center - 1,
        spokenCorrect: `${zh(center)}前面一個數係${zh(center - 1)}。由${zh(center)}向左行一格，就去到${zh(center - 1)}。`,
      };
    }
    if (kind === 'after') {
      return {
        type: 'order',
        skillId: SKILL.position,
        prompt: `${zh(center)}後面一個數係邊個？`,
        start: null,
        target: center + 1,
        spokenCorrect: `${zh(center)}後面一個數係${zh(center + 1)}。由${zh(center)}向右行一格，就去到${zh(center + 1)}。`,
      };
    }
    return {
      type: 'order',
      skillId: SKILL.position,
      prompt: `邊個數喺${zh(center - 1)}同${zh(center + 1)}中間？`,
      start: null,
      target: center,
      spokenCorrect: `${zh(center)}喺${zh(center - 1)}同${zh(center + 1)}中間。${zh(center - 1)}、${zh(center)}、${zh(center + 1)}係順住排嘅三個數。`,
    };
  }

  function makeMeasure(a, b) {
    const dist = Math.abs(b - a);
    return {
      type: 'measure',
      skillId: SKILL.distance,
      prompt: `由${zh(a)}去到${zh(b)}，相隔幾格？先拉出距離，再揀答案。`,
      start: a,
      end: b,
      target: b,
      distance: dist,
      needsDistanceChoice: true,
      spokenCorrect: `由${zh(a)}去到${zh(b)}，中間相隔${zh(dist)}格。終點係${zh(b)}，距離係${zh(dist)}格。`,
    };
  }

  function makeMove(start, distance, direction) {
    const target = direction === 'right' ? start + distance : start - distance;
    const dirSay = direction === 'right' ? '向右' : '向左';
    const opSay = direction === 'right'
      ? `${zh(start)}加${zh(distance)}係${zh(target)}`
      : `${zh(start)}減${zh(distance)}係${zh(target)}`;
    return {
      type: 'move',
      skillId: SKILL.distance,
      prompt: `由${zh(start)}開始，${dirSay}行${zh(distance)}格。`,
      start,
      distance,
      direction,
      target,
      spokenCorrect: `由${zh(start)}開始，${dirSay}行${zh(distance)}格，去到${zh(target)}。${opSay}。`,
    };
  }

  function makeCompose(goal, stop, usedStop = null) {
    return {
      type: 'compose',
      skillId: SKILL.compose,
      prompt: usedStop == null
        ? `用兩段路，由零去到${zh(goal)}。第一段由你揀。`
        : `仲係去到${zh(goal)}，今次搵另一條路。`,
      start: 0,
      goal,
      target: goal,
      forbiddenStop: usedStop,
      first: stop,
      second: goal - stop,
      spokenCorrect: stop != null
        ? `先行${zh(stop)}格去到${zh(stop)}，再行${zh(goal - stop)}格去到${zh(goal)}，一共行${zh(goal)}格。${zh(stop)}加${zh(goal - stop)}係${zh(goal)}。`
        : `兩段路合共去到${zh(goal)}。`,
    };
  }

  function makeMakeTen(start) {
    const dist = 10 - start;
    return {
      type: 'makeTen',
      skillId: SKILL.makeTen,
      prompt: `由${zh(start)}去到十。先拉出條路，再揀行咗幾格。`,
      start,
      target: 10,
      distance: dist,
      needsDistanceChoice: true,
      spokenCorrect: `由${zh(start)}去到十，要向右行${zh(dist)}格。${zh(start)}加${zh(dist)}係十。`,
    };
  }

  function makeInverse(fromMakeTen) {
    const start = 10;
    const target = fromMakeTen.start;
    const distance = fromMakeTen.distance;
    return {
      type: 'inverse',
      skillId: SKILL.inverse,
      prompt: `頭先由${zh(target)}去到十。依家沿住同一條路返去${zh(target)}。`,
      start,
      target,
      distance,
      direction: 'left',
      prior: { start: target, end: 10, distance },
      spokenCorrect: `頭先${zh(target)}向右行${zh(distance)}格去到十；依家十向左行${zh(distance)}格返到${zh(target)}。${zh(target)}加${zh(distance)}係十，十減${zh(distance)}係${zh(target)}。加法同減法係相反方向。`,
    };
  }

  function generateMission({ random = Math.random, mode = 'first', skillProgress = null } = {}) {
    const easy = needsEasy(skillProgress) || mode === 'first';
    const questions = [];

    // Q1
    if (mode === 'first') {
      questions.push(makePosition(pick([0, 1, 2, 3, 4, 5], random), 'place'));
    } else {
      const center = pick([2, 3, 4, 5, 6, 7, 8], random);
      const kind = pick(['before', 'after', 'middle', 'missing'], random);
      if (kind === 'missing') questions.push(makePosition(center, 'missing'));
      else if (kind === 'before') questions.push(makePosition(center - 1, 'before'));
      else if (kind === 'after') questions.push(makePosition(center + 1, 'after'));
      else questions.push(makePosition(center, 'middle'));
    }

    // Q2
    const orderCenter = pick([2, 3, 4, 5, 6, 7, 8], random);
    questions.push(makeOrder(pick(['before', 'after', 'middle'], random), orderCenter));

    // Q3
    let a = easy ? pick([1, 2, 3], random) : pick([1, 2, 3, 4], random);
    let b = easy ? a + pick([2, 3, 4], random) : a + pick([3, 4, 5], random);
    if (b > 10) b = 10;
    if (mode === 'replay' && random() < 0.4) [a, b] = [b, a];
    questions.push(makeMeasure(a, b));

    // Q4 right
    const rightDist = easy ? pick([1, 2, 3], random) : pick([2, 3, 4], random);
    const rightStartMax = 10 - rightDist;
    const rightStart = pick(
      Array.from({ length: rightStartMax }, (_, i) => i + 1).filter((n) => n >= 1),
      random,
    ) || 1;
    questions.push(makeMove(rightStart, rightDist, 'right'));

    // Q5 left
    const leftDist = easy ? pick([1, 2, 3], random) : pick([2, 3, 4], random);
    const leftStartMin = leftDist;
    const leftStart = pick(
      Array.from({ length: 10 - leftStartMin + 1 }, (_, i) => i + leftStartMin).filter((n) => n <= 10),
      random,
    ) || 10;
    questions.push(makeMove(leftStart, leftDist, 'left'));

    // Q6 compose
    const goal = easy ? pick([5, 6, 7], random) : pick([6, 7, 8, 9], random);
    const stops = Array.from({ length: goal - 1 }, (_, i) => i + 1);
    const stop1 = pick(stops, random);
    questions.push(makeCompose(goal, null, null));
    questions[5].expectedStops = stops;
    questions[5].sampleStop = stop1;

    // Q7 another path same goal
    const otherStops = stops.filter((s) => s !== stop1);
    questions.push(makeCompose(goal, null, stop1));
    questions[6].expectedStops = otherStops;
    questions[6].sampleStop = pick(otherStops, random) || otherStops[0];
    questions[6].linkedFrom = 5;

    // Q8 make ten 5–7
    const start8 = pick(easy ? [7, 6] : [5, 6, 7], random);
    questions.push(makeMakeTen(start8));

    // Q9 make ten 8–9
    const start9 = pick([8, 9], random);
    const q9 = makeMakeTen(start9);
    questions.push(q9);

    // Q10 inverse of Q9
    questions.push(makeInverse(q9));

    return questions.map((q, index) => ({ ...q, index, id: `nr-${index + 1}` }));
  }

  function validateAnswer(question, state = {}) {
    const marker = state.marker;
    const distanceChoice = state.distanceChoice;
    const firstStop = state.firstStop;
    const secondEnd = state.secondEnd;
    const hints = {
      position: {
        l1: '由左邊嘅零開始，順住數字搵。',
        l2: '望吓目標附近幾個數字。',
      },
      order: {
        l1: '由已知嗰個數向左或向右行一格。',
        l2: '逐格望清楚前後邊個。',
      },
      measure: {
        l1: '起點唔使再數；第一格係下一個位置。',
        l2: '由起點逐格數到終點。',
      },
      move: {
        l1: question.direction === 'left' ? '向左行，數字會變細。' : '向右行，數字會變大。起點唔使再數。',
        l2: '由起點開始，逐格行指定次數。',
      },
      compose: {
        l1: '先喺零同目標中間停一次。',
        l2: '揀一個中間數字停一停，再行去目標。',
      },
      makeTen: {
        l1: '望吓起點同十之間仲有幾格。',
        l2: '由起點逐格數到十。',
      },
      inverse: {
        l1: '頭先向右去到十；返轉頭要向左。',
        l2: '沿住頭先嗰條路，向左返去。',
      },
    };
    const h = hints[question.type] || hints.position;

    if (question.type === 'position' || question.type === 'order') {
      if (!Number.isInteger(marker)) {
        return { ok: false, reason: 'incomplete', message: '請先將標記放到一個數字。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      if (marker !== question.target) {
        return { ok: false, reason: 'wrong-position', message: '位置未啱，再試吓。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      return { ok: true, skillId: question.skillId, spokenCorrect: question.spokenCorrect };
    }

    if (question.type === 'move' || question.type === 'inverse') {
      if (!Number.isInteger(marker)) {
        return { ok: false, reason: 'incomplete', message: '請先移動標記。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      if (marker !== question.target) {
        const moved = Math.abs((marker ?? question.start) - question.start);
        const msg = moved < question.distance ? `你行咗${zh(moved)}格，題目要${zh(question.distance)}格。` : `你行多咗，要啱啱${zh(question.distance)}格。`;
        return { ok: false, reason: 'wrong-distance', message: msg, hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      return { ok: true, skillId: question.skillId, spokenCorrect: question.spokenCorrect };
    }

    if (question.type === 'measure' || question.type === 'makeTen') {
      if (!Number.isInteger(marker) || marker !== question.target) {
        return {
          ok: false,
          reason: 'wrong-end',
          message: question.type === 'makeTen' ? '請先拖去十。' : '請先拉出兩點之間嘅距離。',
          hintLevel1: h.l1,
          hintLevel2: h.l2,
        };
      }
      if (!Number.isInteger(distanceChoice)) {
        return { ok: false, reason: 'incomplete', message: '請再揀行咗幾格。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      if (distanceChoice !== question.distance) {
        return {
          ok: false,
          reason: 'wrong-choice',
          message: distanceChoice < question.distance ? '仲差少少格。' : '格數多咗。',
          hintLevel1: h.l1,
          hintLevel2: h.l2,
        };
      }
      return { ok: true, skillId: question.skillId, spokenCorrect: question.spokenCorrect };
    }

    if (question.type === 'compose') {
      if (!Number.isInteger(firstStop)) {
        return { ok: false, reason: 'incomplete', message: '請先揀第一段停點，再撳「停喺呢度」。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      if (firstStop <= 0 || firstStop >= question.goal) {
        return { ok: false, reason: 'bad-stop', message: '第一段要停喺零同目標中間。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      if (question.forbiddenStop != null && firstStop === question.forbiddenStop) {
        return { ok: false, reason: 'reuse-stop', message: '今次第一段唔好再停喺上次嗰個數。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      const end = Number.isInteger(secondEnd) ? secondEnd : marker;
      if (!Number.isInteger(end)) {
        return { ok: false, reason: 'incomplete', message: '請再拉第二段去目標。', hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      if (end < question.goal) {
        return { ok: false, reason: 'short', message: `仲未到${zh(question.goal)}，睇吓仲差幾格。`, hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      if (end > question.goal) {
        return { ok: false, reason: 'over', message: `過咗${zh(question.goal)}，第二段短少少。`, hintLevel1: h.l1, hintLevel2: h.l2 };
      }
      const spoken = `先行${zh(firstStop)}格去到${zh(firstStop)}，再行${zh(question.goal - firstStop)}格去到${zh(question.goal)}，一共行${zh(question.goal)}格。${zh(firstStop)}加${zh(question.goal - firstStop)}係${zh(question.goal)}。`;
      return { ok: true, skillId: question.skillId, spokenCorrect: spoken, firstStop };
    }

    return { ok: false, reason: 'unknown', message: '再試吓。', hintLevel1: h.l1, hintLevel2: h.l2 };
  }

  const LEARN_STEPS = [
    {
      id: 'place',
      title: '數字有位置',
      prompt: '每個數字都有自己嘅位置。試吓將標記放去零、五、十。',
      targets: [0, 5, 10],
      speak: '每個數字都有自己嘅位置。先將標記放去零，再放去五，再放去十。',
    },
    {
      id: 'adjacent',
      title: '右大左細',
      prompt: '由四向右行一格去五；再由四向左行一格去三。',
      start: 4,
      targets: [5, 3],
      speak: '由四向右行一格，去到五。由四向左行一格，去到三。',
    },
    {
      id: 'distance',
      title: '終點同距離',
      prompt: '由三去到六。完成後撳回答。',
      start: 3,
      target: 6,
      needsAnswer: true,
      speak: '由三去到六。終點係六，但你由三開始，只係行咗三格。',
    },
    {
      id: 'compose',
      title: '兩段路',
      prompt: '用兩段路去到七。試吓唔同停點。',
      start: 0,
      goal: 7,
      speak: '可以先行兩格再行五格，或者先行四格再行三格；兩條路都去到七。',
    },
    {
      id: 'makeTenInverse',
      title: '補到十再倒轉',
      prompt: '由七去到十，再沿住同一條路返去七。',
      start: 7,
      target: 10,
      speak: '由七去到十，要向右行三格。十向左行三格，就返到七。',
    },
  ];

  window.KakaMathNumberLineData = {
    PLANET_ID,
    SKILL,
    ZH,
    zh,
    LEARN_STEPS,
    generateMission,
    validateAnswer,
    needsEasy,
    shuffle,
    pick,
  };
})();

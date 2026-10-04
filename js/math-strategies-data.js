/** 小一 20 以內加減法：四種算法各自只產生適合該策略的題目。 */
(function () {
  const METHODS = [
    {
      id: 'make-ten', title: '湊十法', operation: '進位加法', icon: '🔟',
      cardText: '先湊成十，再加剩下的數',
      intro: '把其中一個數拆開，先和另一個數湊成 10，再加剩下的數。',
      example: { a: 8, b: 5, answer: 13, steps: ['把 5 拆成 2 和 3', '8＋2＝10', '10＋3＝13'] },
      build(a, b) {
        const need = 10 - a, rest = b - need;
        return { equation: `${a}＋${b}＝？`, answer: a + b,
          prompt: `用湊十法計一計：${a}＋${b} 等於幾多？`,
          steps: [`把 ${b} 拆成 ${need} 和 ${rest}`, `${a}＋${need}＝10`, `10＋${rest}＝${a + b}`],
          explanation: `${a} 加 ${b}，先湊成 10，再加 ${rest}，答案係 ${a + b}。` };
      },
      pool() {
        const out = [];
        for (let a = 6; a <= 9; a += 1) for (let b = 11 - a; b <= 9; b += 1) out.push([a, b]);
        return out;
      },
    },
    {
      id: 'break-ten', title: '破十法', operation: '退位減法', icon: '🧱',
      cardText: '拆開十幾，先用十去減',
      intro: '把十幾拆成「10 和個位數」，先用 10 減，再把個位數加回來。',
      example: { a: 13, b: 5, answer: 8, steps: ['把 13 拆成 10 和 3', '10－5＝5', '5＋3＝8'] },
      build(a, b) {
        const units = a % 10, first = 10 - b;
        return { equation: `${a}－${b}＝？`, answer: a - b,
          prompt: `用破十法計一計：${a}－${b} 等於幾多？`,
          steps: [`把 ${a} 拆成 10 和 ${units}`, `10－${b}＝${first}`, `${first}＋${units}＝${a - b}`],
          explanation: `${a} 拆成 10 和 ${units}；先用 10 減 ${b}，再加回 ${units}，答案係 ${a - b}。` };
      },
      pool() { return subtractionPool(); },
    },
    {
      id: 'flat-ten', title: '平十法', operation: '退位減法', icon: '🪜',
      cardText: '分開要減的數，先減到十',
      intro: '把要減的數拆開，先減到整十，再減剩下的數。',
      example: { a: 13, b: 5, answer: 8, steps: ['把 5 拆成 3 和 2', '13－3＝10', '10－2＝8'] },
      build(a, b) {
        const units = a % 10, rest = b - units;
        return { equation: `${a}－${b}＝？`, answer: a - b,
          prompt: `用平十法計一計：${a}－${b} 等於幾多？`,
          steps: [`把 ${b} 拆成 ${units} 和 ${rest}`, `${a}－${units}＝10`, `10－${rest}＝${a - b}`],
          explanation: `先減 ${units} 到 10，再減剩下的 ${rest}，答案係 ${a - b}。` };
      },
      pool() { return subtractionPool(); },
    },
    {
      id: 'think-add-subtract', title: '想加算減法', operation: '用加法想減法', icon: '🔄',
      cardText: '想一想：幾多加回去會變成原數？',
      intro: '減法可以用加法倒轉來想：由減數開始，加幾多才會到原來的數？',
      example: { a: 13, b: 5, answer: 8, steps: ['想：5 加幾多會到 13？', '5＋5＝10，還差 3', '5＋3＝8，所以答案係 8'] },
      build(a, b) {
        const toTen = 10 - b, afterTen = a - 10, answer = a - b;
        return { equation: `${a}－${b}＝？`, answer,
          prompt: `用「想加算減法」想一想：${a}－${b} 等於幾多？`,
          steps: [`想：${b} 加幾多會到 ${a}？`, `${b} 加 ${toTen} 到 10，再加 ${afterTen} 到 ${a}`, `${toTen}＋${afterTen}＝${answer}`],
          explanation: `由 ${b} 加到 ${a}，一共加了 ${answer}；所以 ${a} 減 ${b} 等於 ${answer}。` };
      },
      pool() { return subtractionPool(); },
    },
  ];

  function subtractionPool() {
    const out = [];
    for (let a = 11; a <= 19; a += 1) {
      for (let b = (a % 10) + 1; b <= 9; b += 1) out.push([a, b]);
    }
    return out;
  }
  function shuffle(items, random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function makeRound(methodId, { random = Math.random, length = 10 } = {}) {
    const method = METHODS.find((item) => item.id === methodId);
    if (!method) throw new RangeError(`Unknown arithmetic method: ${methodId}`);
    const pool = method.pool();
    const questions = shuffle(pool, random).slice(0, Math.min(length, pool.length));
    const objects = [
      { emoji: '🍓', itemName: '士多啤梨', measure: '粒' },
      { emoji: '🫐', itemName: '藍莓', measure: '粒' },
      { emoji: '🍊', itemName: '橙', measure: '個' },
      { emoji: '🍪', itemName: '曲奇', measure: '塊' },
    ];
    return questions.map(([a, b], round) => {
      const built = method.build(a, b);
      const object = objects[Math.floor(random() * objects.length)];
      const result = a + (methodId === 'make-ten' ? b : -b);
      const concretePrompt = methodId === 'make-ten'
        ? `水果盤有 ${a}${object.measure}${object.itemName}，再放入 ${b}${object.measure}，一共有幾多？一齊湊十！`
        : methodId === 'think-add-subtract'
          ? `要由 ${b}${object.measure} 加到 ${a}${object.measure}，要加幾多？用加法幫手諗！`
          : `有 ${a}${object.measure}${object.itemName}，要拿走 ${b}${object.measure}，仲剩幾多？一齊動手！`;
      return { ...built, methodId, round, a, b, answer: result, ...object, concretePrompt };
    });
  }
  window.KakaMathStrategiesData = { METHODS, makeRound };
})();

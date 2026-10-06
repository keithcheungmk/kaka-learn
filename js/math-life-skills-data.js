/** 五項生活數學任務：先用看得見、摸得到的情境，再慢慢抽象成數字。 */
(function () {
  const ACTIVITIES = [
    { id: 'quantity-compare', planetId: 'number-relations', planet: '水星', title: '配一配・邊邊多？', skillId: 'compare.quantity.1to10', subtitle: '比較兩盤日常物品的多少' },
    { id: 'number-bonds', planetId: 'compare-size', planet: '地球', title: '數字好朋友・合起來', skillId: 'numberBonds.to10', subtitle: '找出兩部分合成目標數字的方法' },
    { id: 'shape-patterns', planetId: 'number-relations', planet: '水星', title: '形狀觀察隊', skillId: 'shape.pattern.AB', subtitle: '先認形狀，再找重複規律' },
    { id: 'little-shop', planetId: 'compare-size', planet: '地球', title: '卡卡水果店・幫手付款', skillId: 'money.matchPrice.1to10', subtitle: '用熟悉嘅硬幣，幫卡卡買水果' },
    { id: 'measure-compare', planetId: 'moon', planet: '月球', title: '生活度量・比一比', skillId: 'measure.compare.visual', subtitle: '比較長短、輕重和多少' },
  ];
  const OBJECTS = [
    { emoji: '🫐', name: '藍莓', counter: '粒' }, { emoji: '🍓', name: '士多啤梨', counter: '粒' },
    { emoji: '🍪', name: '餅乾', counter: '塊' }, { emoji: '🧸', name: '小熊', counter: '隻' },
  ];
  const SHAPES = [
    { id: 'circle', name: '圓形', points: '50,5 62,8 75,15 86,27 93,40 95,50 93,62 85,75 74,86 62,93 50,95 38,93 25,85 14,74 7,62 5,50 7,38 15,25 26,14 38,7' },
    { id: 'oval', name: '橢圓形', points: '50,12 65,15 80,23 90,36 94,50 90,64 80,77 65,85 50,88 35,85 20,77 10,64 6,50 10,36 20,23 35,15' },
    { id: 'triangle', name: '三角形', points: '50,5 95,92 5,92' }, { id: 'square', name: '正方形', points: '15,15 85,15 85,85 15,85' },
    { id: 'rectangle', name: '長方形', points: '8,25 92,25 92,75 8,75' }, { id: 'diamond', name: '菱形', points: '50,4 92,50 50,96 8,50' },
    { id: 'pentagon', name: '五邊形', points: '50,5 95,38 78,92 22,92 5,38' }, { id: 'hexagon', name: '六邊形', points: '25,7 75,7 95,50 75,93 25,93 5,50' },
    { id: 'parallelogram', name: '平行四邊形', points: '30,15 95,15 70,85 5,85' }, { id: 'trapezoid', name: '梯形', points: '28,15 72,15 95,85 5,85' },
  ];
  const SHOP_ITEMS = [
    { emoji: '🍓', name: '士多啤梨', price: 8 }, { emoji: '🫐', name: '藍莓', price: 7 },
    { emoji: '🍊', name: '橙', price: 5 }, { emoji: '🍉', name: '西瓜', price: 10 },
    { emoji: '🍎', name: '蘋果', price: 12 },
  ];
  const HK_COINS = [10, 5, 2, 1].map((value) => ({ value, label: `$${value}` }));
  const COLORS = ['#f66d72', '#438de8', '#ffb547', '#37b98f', '#9a77e8', '#e87aa6'];
  const SIDE_CHOICES = [
    { id: 'left', label: '左邊較多' }, { id: 'same', label: '一樣多' }, { id: 'right', label: '右邊較多' },
  ];
  function pick(list, random) { return list[Math.floor(random() * list.length)]; }
  function shuffle(items, random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }
  function amount(min, max, random) { return Math.floor(random() * (max - min + 1)) + min; }

  function compareQuestion(round, random) {
    const upper = round < 2 ? 5 : 10;
    const left = amount(2, upper, random);
    const delta = random() < .18 ? 0 : amount(1, round < 2 ? 2 : 3, random);
    let right = delta === 0 ? left : left + (random() < .5 ? delta : -delta);
    if (right < 1 || right > upper) right = left + (right < 1 ? delta : -delta);
    const object = pick(OBJECTS, random);
    const answer = left === right ? 'same' : left > right ? 'left' : 'right';
    const more = answer === 'same' ? '兩邊一樣多' : `${answer === 'left' ? '左邊' : '右邊'}較多`;
    return { kind: 'compare', left, right, object, answer, choices: SIDE_CHOICES, prompt: '先幫兩邊的物品配成一對，再看看哪邊有剩。', explain: `左邊${left}${object.counter}，右邊${right}${object.counter}；${more}。` };
  }
  function bondQuestion(round, random) {
    const total = round === 0 ? 10 : round === 1 ? 5 : amount(5, 10, random);
    const part = round === 0 ? 5 : amount(1, total - 1, random);
    const missing = total - part;
    const distractors = shuffle(Array.from({ length: 10 }, (_, i) => i + 1).filter((value) => value !== missing), random).slice(0, 2);
    const choices = shuffle([missing, ...distractors], random).map((value) => ({ id: String(value), label: String(value) }));
    return { kind: 'bonds', total, part, answer: String(missing), choices,
      prompt: `左邊已有${part}粒星，目標要有${total}粒，右邊仲要幾多粒？`,
      explain: `${part}粒加${missing}粒等於${total}粒。${total}可以分成${part}粒和${missing}粒。` };
  }
  function shapeQuestion(round, random) {
    if (round < 3) {
      const beginnerShapes = SHAPES.slice(0, round === 0 ? 3 : round === 1 ? 4 : 6);
      const shape = pick(beginnerShapes, random);
      const distractors = shuffle(beginnerShapes.filter((item) => item.id !== shape.id), random).slice(0, 2);
      const choices = shuffle([shape, ...distractors], random).map((item) => ({ id: item.id, label: item.name }));
      return { kind: 'shape', stage: 'recognize', shape, answer: shape.id, choices, prompt: '仔細看看外形，這是甚麼形狀？', explain: `這是${shape.name}。` };
    }
    const shapes = SHAPES.slice(0, round === 3 ? 4 : 6);
    const first = pick(shapes, random);
    const second = pick(shapes.filter((item) => item.id !== first.id), random);
    const sequence = [first, second, first, second];
    const choices = shuffle([first, second, ...shuffle(shapes.filter((item) => item.id !== first.id && item.id !== second.id), random).slice(0, 1)], random)
      .map((item) => ({ id: item.id, label: item.name }));
    return { kind: 'pattern', stage: 'pattern', sequence, answer: first.id, choices, prompt: '形狀一組一組重複排隊，問號後面是哪個？', explain: `每組都是${first.name}、${second.name}；下一個回到${first.name}。` };
  }
  function exactCoinCombinations(price) {
    const combinations = [];
    function visit(remaining, firstIndex, chosen) {
      if (remaining === 0) { combinations.push(chosen); return; }
      if (chosen.length >= price) return;
      for (let i = firstIndex; i < HK_COINS.length; i += 1) {
        const value = HK_COINS[i].value;
        if (value <= remaining) visit(remaining - value, i, [...chosen, value]);
      }
    }
    visit(price, 0, []);
    return combinations;
  }
  function shopQuestion(random) {
    const item = pick(SHOP_ITEMS, random);
    const price = item.price;
    // The purse always contains one exact solution plus a few spare coins. Children
    // can choose any available set whose face values add up to the fruit's price.
    const solutions = exactCoinCombinations(price);
    const shortSolutions = solutions.filter((combination) => combination.length <= 4);
    const solution = pick(shortSolutions.length ? shortSolutions : solutions, random);
    const coins = solution.map((value, index) => ({ id: `pay-${index}`, value }));
    const spareCount = amount(1, 3, random);
    for (let i = 0; i < spareCount; i += 1) {
      const value = pick(HK_COINS, random).value;
      coins.push({ id: `spare-${i}`, value });
    }
    const choices = [{ id: 'pay', label: '付錢啦' }, { id: 'keep-looking', label: '再看看' }];
    return { kind: 'shop-payment', item, price, coins: shuffle(coins, random), wallet: coins.length,
      answer: 'pay', choices, prompt: `${item.name}要${price}蚊，幫卡卡揀啱硬幣放入付款盤。`,
      explain: `啱啱好畀到${price}蚊。` };
  }
  function measureQuestion(round, random) {
    const attribute = ['長短', '輕重', '水量'][round % 3];
    const upper = round < 3 ? 4 : 7;
    const left = amount(1, upper, random);
    const right = random() < .16 ? left : Math.max(1, Math.min(upper, left + (random() < .5 ? -amount(1, 2, random) : amount(1, 2, random))));
    const answer = left === right ? 'same' : left > right ? 'left' : 'right';
    const noun = attribute === '長短' ? '長' : attribute === '輕重' ? '重' : '多';
    const compareText = answer === 'same' ? '一樣' : `${answer === 'left' ? '左邊' : '右邊'}較${noun}`;
    const explain = attribute === '長短' ? `${compareText}。把兩條積木尺的起點對齊，就容易看出長短。`
      : attribute === '輕重' ? `${compareText}。兩邊用同樣的砝碼比較，砝碼多的一邊比較重。`
        : `${compareText}。看透明量杯的刻度，水位高的杯子水較多。`;
    const choices = attribute === '長短' ? [{ id: 'left', label: '左邊較長' }, { id: 'same', label: '一樣長' }, { id: 'right', label: '右邊較長' }]
      : attribute === '輕重' ? [{ id: 'left', label: '左邊較重' }, { id: 'same', label: '一樣重' }, { id: 'right', label: '右邊較重' }]
        : [{ id: 'left', label: '左杯水較多' }, { id: 'same', label: '一樣多' }, { id: 'right', label: '右杯水較多' }];
    return { kind: 'measure', attribute, left, right, answer, choices, prompt: attribute === '長短' ? '兩條積木尺排齊起點，哪條比較長？' : attribute === '輕重' ? '看看天秤上的砝碼，哪邊比較重？' : '看量杯的水位，哪杯水比較多？', explain };
  }
  function makeMission(activityId, { random = Math.random, length = 10 } = {}) {
    const activity = ACTIVITIES.find((item) => item.id === activityId);
    if (!activity) throw new RangeError(`Unknown life skill activity: ${activityId}`);
    return Array.from({ length }, (_, round) => {
      let question;
      if (activityId === 'quantity-compare') question = compareQuestion(round, random);
      else if (activityId === 'number-bonds') question = bondQuestion(round, random);
      else if (activityId === 'shape-patterns') question = shapeQuestion(round, random);
      else if (activityId === 'little-shop') question = shopQuestion(random);
      else question = measureQuestion(round, random);
      return { ...question, round, activityId, skillId: activity.skillId, missionId: `${activityId}-${round + 1}` };
    });
  }
  window.KakaMathLifeSkillsData = { ACTIVITIES, OBJECTS, SHAPES, COLORS, makeMission };
})();

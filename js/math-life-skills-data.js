/** 五項生活數學任務：先用看得見、摸得到的情境，再慢慢抽象成數字。 */
(function () {
  const ACTIVITIES = [
    { id: 'quantity-compare', planetId: 'number-relations', planet: '水星', title: '配一配・邊邊多？', skillId: 'compare.quantity.1to10', subtitle: '比較兩盤日常物品的多少' },
    { id: 'number-bonds', planetId: 'compare-size', planet: '地球', title: '數字好朋友・合起來', skillId: 'numberBonds.to10', subtitle: '找出兩部分合成目標數字的方法' },
    { id: 'shape-patterns', planetId: 'number-relations', planet: '水星', title: '形狀觀察隊', skillId: 'shape.pattern.AB', subtitle: '先認形狀，再找重複規律' },
    { id: 'little-shop', planetId: 'compare-size', planet: '地球', title: '小小商店・數錢買物', skillId: 'money.matchPrice.1to10', subtitle: '數硬幣，看看夠不夠買' },
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
    { emoji: '🍓', name: '士多啤梨', count: '粒' }, { emoji: '🫐', name: '藍莓', count: '粒' },
    { emoji: '🍪', name: '餅乾', count: '塊' }, { emoji: '🧃', name: '果汁', count: '盒' },
  ];
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
  function shopQuestion(round, random) {
    const price = amount(2, round < 2 ? 5 : 10, random);
    const item = pick(SHOP_ITEMS, random);
    const wallet = amount(1, round < 2 ? 6 : 10, random);
    const enough = wallet >= price;
    const choices = shuffle([
      { id: 'enough', label: '夠買' }, { id: 'more', label: '還差一些' },
    ], random);
    const answer = enough ? 'enough' : 'more';
    const explanation = enough ? `${wallet}個幣${wallet === price ? '剛好' : '多過價錢'}買${item.name}。` : `${wallet}個幣比${price}個少，還差一些。`;
    return { kind: 'shop', item, price, wallet, answer, choices, prompt: `${item.emoji}要${price}個幣。錢包有${wallet}個，夠不夠買？`, explain: explanation };
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
  function makeMission(activityId, { random = Math.random, length = 5 } = {}) {
    const activity = ACTIVITIES.find((item) => item.id === activityId);
    if (!activity) throw new RangeError(`Unknown life skill activity: ${activityId}`);
    return Array.from({ length }, (_, round) => {
      let question;
      if (activityId === 'quantity-compare') question = compareQuestion(round, random);
      else if (activityId === 'number-bonds') question = bondQuestion(round, random);
      else if (activityId === 'shape-patterns') question = shapeQuestion(round, random);
      else if (activityId === 'little-shop') question = shopQuestion(round, random);
      else question = measureQuestion(round, random);
      return { ...question, round, activityId, skillId: activity.skillId, missionId: `${activityId}-${round + 1}` };
    });
  }
  window.KakaMathLifeSkillsData = { ACTIVITIES, OBJECTS, SHAPES, COLORS, makeMission };
})();

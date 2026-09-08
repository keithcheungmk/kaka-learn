/** 地球加法星球 — 兩個能力階段；每階段十題，視覺物件由題目輪換。 */
(function () {
  const VISUALS = [
    { id: 'fruit', emoji: '🍓', measure: '粒', label: '士多啤梨' },
    { id: 'chick', emoji: '🐥', measure: '隻', label: '雞仔' },
    { id: 'coin', emoji: '🪙', measure: '枚', label: '金幣' },
    { id: 'rabbit', emoji: '🐰', measure: '隻', label: '小白兔' },
    { id: 'star', emoji: '⭐', measure: '顆', label: '星星' },
    { id: 'moon-star', emoji: '🌟', measure: '顆', label: '閃閃星' },
  ];

  const levelOnePairs = [[1, 1], [1, 2], [2, 1], [2, 2], [1, 4], [3, 2], [2, 4], [3, 4], [4, 4], [5, 5]];
  const levelTwoPairs = [[10, 1], [10, 2], [9, 3], [8, 4], [7, 5], [6, 6], [9, 6], [8, 7], [10, 9], [10, 10]];
  const QUESTIONS_PER_LEVEL = 10;

  function makeLevel(level, pairs, title, blurb, color) {
    return {
      id: `level-${level}`, level, title, blurb, color,
      targetRange: level === 1 ? '2–10' : '11–20', questionCount: QUESTIONS_PER_LEVEL,
      missions: pairs.map(([a, b], index) => {
        const visual = VISUALS[index % VISUALS.length];
        return {
          id: `addition-l${level}-${index + 1}`, level, a, b, targetNumber: a + b, visual,
          scenario: `${visual.label}能量任務`,
          desc: `先有 ${a}${visual.measure}${visual.label}，再拖入 ${b}${visual.measure}，合共有幾多${visual.measure}？`,
        };
      }),
    };
  }

  const additionLevels = [
    makeLevel(1, levelOnePairs, 'Level 1・加法 2–10', '拖物件合併兩組數量，學識由 2 數到 10。', '#53d8a0'),
    makeLevel(2, levelTwoPairs, 'Level 2・加法 11–20', '用十格板湊十，再數出 11 至 20。', '#f8c654'),
  ];

  function getLevelById(id) { return additionLevels.find((level) => level.id === id) || additionLevels[0]; }
  function getLevelByBase(base) { return additionLevels.find((level) => level.level === base || level.targetNumber === base) || additionLevels[0]; }
  function getMissionById(id) {
    for (const level of additionLevels) {
      const mission = level.missions.find((item) => item.id === id);
      if (mission) return { level, mission };
    }
    return null;
  }

  window.KakaAdditionData = { VISUALS, additionLevels, ADDITION_LEVELS: additionLevels, getLevelById, getLevelByBase, getMissionById };
})();

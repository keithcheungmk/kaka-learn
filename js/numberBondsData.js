/* 數字拆解：正整數拆成兩組（唔重複顯示反向組合）。 */
(function () {
  function pairsForTarget(target) {
    const pairs = [];
    for (let first = 1; first <= Math.floor(target / 2); first += 1) {
      pairs.push([first, target - first]);
    }
    return pairs;
  }

  function makeLevel(level, title, range, targets, blurb) {
    return {
      level,
      id: `bonds-level-${level}`,
      title,
      range,
      blurb,
      missions: targets.map((target) => ({
        id: `bonds-${level}-${target}`,
        target,
        pairs: pairsForTarget(target),
      })),
    };
  }

  const levels = [
    makeLevel(1, 'Level 1・拆解至 10', '2–10', [2, 3, 4, 5, 6, 7, 8, 9, 10], '由細數開始，搵齊所有兩數組合。'),
    makeLevel(2, 'Level 2・拆解 11–20', '11–20', [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], '先諗 10，再搵埋其他兩數組合。'),
  ];

  window.KakaNumberBondsData = {
    levels,
    pairsForTarget,
    getLevel(level) { return levels.find((item) => item.level === level) || null; },
    getMissionById(id) {
      for (const level of levels) {
        const mission = level.missions.find((item) => item.id === id);
        if (mission) return { level, mission };
      }
      return null;
    },
  };
})();

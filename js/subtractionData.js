/** 月球減法拿走 — 兩個能力階段；每階段十題。 */
(function () {
  const VISUALS = [
    { id: 'fruit', emoji: '🍓', measure: '粒', label: '士多啤梨' },
    { id: 'chick', emoji: '🐥', measure: '隻', label: '雞仔' },
    { id: 'coin', emoji: '🪙', measure: '枚', label: '金幣' },
    { id: 'rabbit', emoji: '🐰', measure: '隻', label: '小白兔' },
    { id: 'star', emoji: '⭐', measure: '顆', label: '星星' },
    { id: 'moon-star', emoji: '🌟', measure: '顆', label: '閃閃星' },
  ];
  const levelOnePairs = [[3, 1], [4, 1], [5, 2], [6, 2], [7, 3], [8, 3], [9, 4], [10, 5], [10, 1], [8, 6]];
  const levelTwoPairs = [[11, 1], [12, 2], [13, 3], [14, 4], [15, 5], [16, 6], [17, 7], [18, 8], [19, 9], [20, 10]];
  function makeLevel(level, pairs, title, blurb, color) {
    return { id: `level-${level}`, level, title, blurb, color, targetRange: level === 1 ? '2–10' : '11–20', questionCount: 10,
      missions: pairs.map(([start, remove], index) => {
        const visual = VISUALS[index % VISUALS.length];
        return { id: `subtraction-l${level}-${index + 1}`, level, start, remove, remaining: start - remove, visual,
          scenario: `${visual.label}月球任務`, desc: `白板有 ${start}${visual.measure}${visual.label}，攞走幾多${visual.measure}${visual.label}，剩低 ${start - remove}${visual.measure}${visual.label}？` };
      }) };
  }
  const subtractionLevels = [
    makeLevel(1, levelOnePairs, 'Level 1・拿走 2–10', '由具體物件開始，學識拿走後數剩低幾多。', '#67e8f9'),
    makeLevel(2, levelTwoPairs, 'Level 2・拿走 11–20', '用十格概念理解 11 至 20 嘅減法。', '#c4b5fd'),
  ];
  function getMissionById(id) {
    for (const level of subtractionLevels) { const mission = level.missions.find((item) => item.id === id); if (mission) return { level, mission }; }
    return null;
  }
  window.KakaSubtractionData = { VISUALS, subtractionLevels, getMissionById };
})();

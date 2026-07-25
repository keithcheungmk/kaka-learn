/** 小鹿數理探險 — 星球／技能資料（Phase 1） */
(function () {
  /** @type {Array<{id:string,name:string,skill:string,emoji:string,color:string,order:number,blurb:string}>} */
  const MATH_PLANETS = [
    {
      id: 'count',
      name: '數數星',
      skill: '數數',
      emoji: '🔢',
      color: '#fbbf24',
      order: 0,
      blurb: '數吓有幾多粒',
    },
    {
      id: 'compare-qty',
      name: '多少星',
      skill: '邊多邊少',
      emoji: '⚖️',
      color: '#fb7185',
      order: 1,
      blurb: '邊堆多？邊堆少？',
    },
    {
      id: 'compare-size',
      name: '比較星',
      skill: '大細長短',
      emoji: '📏',
      color: '#38bdf8',
      order: 2,
      blurb: '邊個大？邊個長？',
    },
    {
      id: 'shape',
      name: '形狀星',
      skill: '形狀',
      emoji: '🔺',
      color: '#5eead4',
      order: 3,
      blurb: '圓、三角、方',
    },
    {
      id: 'sort',
      name: '分類星',
      skill: '分類',
      emoji: '📦',
      color: '#fb923c',
      order: 4,
      blurb: '一樣嘅放埋一齊',
    },
    {
      id: 'pattern',
      name: '規律星',
      skill: '規律',
      emoji: '✨',
      color: '#a3e635',
      order: 5,
      blurb: '邊個跟住嚟？',
    },
    {
      id: 'position',
      name: '位置星',
      skill: '位置',
      emoji: '🧭',
      color: '#2dd4bf',
      order: 6,
      blurb: '上上下下左左右右',
    },
    {
      id: 'ordinal',
      name: '序數星',
      skill: '序數',
      emoji: '1️⃣',
      color: '#f9a8d4',
      order: 7,
      blurb: '邊個係第一？',
    },
  ];

  function getPlanetById(id) {
    return MATH_PLANETS.find((p) => p.id === id) || MATH_PLANETS[0];
  }

  function getNextPlanetId(currentId) {
    const sorted = [...MATH_PLANETS].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((p) => p.id === currentId);
    if (idx < 0 || idx >= sorted.length - 1) return sorted[0].id;
    return sorted[idx + 1].id;
  }

  window.KakaMathSkills = {
    MATH_PLANETS,
    getPlanetById,
    getNextPlanetId,
  };
})();

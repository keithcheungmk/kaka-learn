/** 小鹿數理探險 — 真實太陽系星球 × 技能（Phase 1） */
(function () {
  /**
   * body: CSS 用嘅星球鍵（mercury…neptune）
   * name: 顯示用星球名（繁中）
   * skill: 教學主題
   */
  const MATH_PLANETS = [
    {
      id: 'count',
      body: 'mercury',
      name: '水星',
      skill: '數數',
      color: '#b6bcc4',
      order: 0,
      blurb: '喺水星學數數：數吓有幾多粒',
    },
    {
      id: 'compare-qty',
      body: 'venus',
      name: '金星',
      skill: '邊多邊少',
      color: '#e8c27a',
      order: 1,
      blurb: '喺金星學比較：邊堆多？邊堆少？',
    },
    {
      id: 'compare-size',
      body: 'earth',
      name: '地球',
      skill: '大細長短',
      color: '#3b82f6',
      order: 2,
      blurb: '喺地球學比較：邊個大？邊個長？',
    },
    {
      id: 'shape',
      body: 'mars',
      name: '火星',
      skill: '形狀',
      color: '#e35d3b',
      order: 3,
      blurb: '喺火星學形狀：圓、三角、方',
    },
    {
      id: 'sort',
      body: 'jupiter',
      name: '木星',
      skill: '分類',
      color: '#d4a574',
      order: 4,
      blurb: '喺木星學分類：一樣嘅放埋一齊',
    },
    {
      id: 'pattern',
      body: 'saturn',
      name: '土星',
      skill: '規律',
      color: '#f0d59a',
      order: 5,
      blurb: '喺土星學規律：邊個跟住嚟？',
    },
    {
      id: 'position',
      body: 'uranus',
      name: '天王星',
      skill: '位置',
      color: '#67e8f9',
      order: 6,
      blurb: '喺天王星學位置：上上下下左左右右',
    },
    {
      id: 'ordinal',
      body: 'neptune',
      name: '海王星',
      skill: '序數',
      color: '#3b6fd4',
      order: 7,
      blurb: '喺海王星學序數：邊個係第一？',
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

  function planetGlobeHtml(planet, extraClass = '') {
    const body = planet.body || 'earth';
    const lit = extraClass.includes('is-lit') ? ' is-lit' : '';
    return `<span class="math-globe-wrap math-globe-wrap--${body}${lit} ${extraClass}" aria-hidden="true"><span class="math-globe math-globe--${body}"></span></span>`;
  }

  window.KakaMathSkills = {
    MATH_PLANETS,
    getPlanetById,
    getNextPlanetId,
    planetGlobeHtml,
  };
})();

/** 小鹿數理探險 — 保留四個核心玩法：水星數一數、金星時鐘、地球加法、月球減法。 */
(function () {
  const PLANET_IMG = (body) => `./assets/math/planets/${body}.png?v=20260908c`;

  /**
   * body: 星球鍵（mercury…neptune）→ 對應圖片
   * name: 顯示用星球名（繁中）
   * skill: 教學主題
   */
  const MATH_PLANETS = [
    {
      id: 'number-relations',
      body: 'mercury',
      name: '水星',
      skill: '數一數',
      icon: '🔢',
      color: '#b6bcc4',
      order: 0,
      blurb: '逐粒數清楚，再揀返相同嘅數字',
      img: PLANET_IMG('mercury'),
    },
    {
      id: 'time',
      body: 'venus',
      name: '金星',
      skill: '睇鐘',
      icon: '🕒',
      color: '#e8c27a',
      order: 1,
      blurb: '喺金星學睇鐘：模擬鐘同電子鐘（整點／半點）',
      img: PLANET_IMG('venus'),
    },
    {
      id: 'compare-size',
      body: 'earth',
      name: '地球',
      skill: '加法',
      icon: '➕',
      color: '#3b82f6',
      order: 2,
      blurb: '喺地球用能量方塊學加法：拖入空格砌出目標數字',
      img: PLANET_IMG('earth'),
    },
    {
      id: 'moon',
      body: 'moon',
      name: '月球',
      skill: '減法・拿走',
      icon: '➖',
      color: '#cbd5e1',
      order: 3,
      blurb: '喺月球學減法：拿走幾粒，再數剩低幾多',
      img: PLANET_IMG('moon'),
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

  /** 入口／hub 用真實星球圖；失敗時 CSS globe 做後備 */
  function planetGlobeHtml(planet, extraClass = '') {
    const body = planet.body || 'earth';
    const lit = extraClass.includes('is-lit') ? ' is-lit' : '';
    const src = planet.img || PLANET_IMG(body);
    return `<span class="math-globe-wrap math-globe-wrap--photo math-globe-wrap--${body}${lit} ${extraClass}" aria-hidden="true"><img class="math-globe-img" src="${src}" alt="" width="256" height="256" loading="lazy" decoding="async" /><span class="math-globe math-globe--${body} math-globe-fallback" hidden></span></span>`;
  }

  window.KakaMathSkills = {
    MATH_PLANETS,
    GALAXY_BG: './assets/math/galaxy-bg.jpg',
    getPlanetById,
    getNextPlanetId,
    planetGlobeHtml,
  };
})();

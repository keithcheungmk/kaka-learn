/** 地球加法星球 — 關卡與生活情境題目（資料驅動） */
(function () {
  const additionLevels = [
    {
      targetNumber: 5,
      base: 5,
      title: '5號能量基地',
      color: '#4CAF50',
      missions: [
        { id: '5-1', a: 4, b: 1, scenario: '太空野餐', desc: '便當盒有5格，已經有4粒士多啤梨，仲要幾多粒？' },
        { id: '5-2', a: 3, b: 2, scenario: '雙層巴士', desc: '巴士限坐5人，上層坐咗3人，下層坐幾多人？' },
        { id: '5-3', a: 2, b: 3, scenario: '軌道修復', desc: '太空軌道長度係5，已經鋪咗2塊，仲差幾塊？' },
        { id: '5-4', a: 1, b: 4, scenario: '火箭發射', desc: '火箭需要5級能量，而家得1級，要加幾多級？' },
      ],
    },
    {
      targetNumber: 6,
      base: 6,
      title: '6號能量基地',
      color: '#2196F3',
      missions: [
        { id: '6-1', a: 5, b: 1, scenario: '太空收納', desc: '玩具箱要放6件玩具，已有5件，仲差幾件？' },
        { id: '6-2', a: 4, b: 2, scenario: '停車場', desc: '停車場有6個車位，停咗4架車，仲有幾多個位？' },
        { id: '6-3', a: 3, b: 3, scenario: '雙胞胎引擎', desc: '左邊引擎有3粒能量，右邊要放幾粒先平衡到6？' },
      ],
    },
    {
      targetNumber: 7,
      base: 7,
      title: '7號能量基地',
      color: '#9C27B0',
      missions: [
        { id: '7-1', a: 6, b: 1, scenario: '太空階梯', desc: '階梯總共有7級，行咗6級，仲差幾級到頂？' },
        { id: '7-2', a: 5, b: 2, scenario: '彩虹能量', desc: '7色光譜已有5隻色，仲要收集幾多隻？' },
        { id: '7-3', a: 4, b: 3, scenario: '物資裝箱', desc: '貨箱容量係7，已裝4箱，仲可以裝幾多箱？' },
      ],
    },
    {
      targetNumber: 8,
      base: 8,
      title: '8號能量基地',
      color: '#FF9800',
      missions: [
        { id: '8-1', a: 7, b: 1, scenario: '蜘蛛探測器', desc: '探測器要有8隻腳，裝咗7隻，仲差幾多隻？' },
        { id: '8-2', a: 6, b: 2, scenario: '太陽能板', desc: '需要8塊太陽能板，已有6塊，仲要安裝幾多塊？' },
        { id: '8-3', a: 5, b: 3, scenario: '星際密碼', desc: '密碼總共8位數，已輸入5個，仲要輸入幾多個？' },
        { id: '8-4', a: 4, b: 4, scenario: '正方形基地', desc: '兩邊各有4粒能量，合埋一共係幾多？' },
      ],
    },
    {
      targetNumber: 9,
      base: 9,
      title: '9號能量基地',
      color: '#E91E63',
      missions: [
        { id: '9-1', a: 8, b: 1, scenario: '太空九宮格', desc: '九宮格需要9粒寶石，已有8粒，仲差幾粒？' },
        { id: '9-2', a: 7, b: 2, scenario: '星球拼圖', desc: '拼圖總共9塊，拼咗7塊，仲剩低幾多塊？' },
        { id: '9-3', a: 6, b: 3, scenario: '太空站通訊', desc: '通訊信號需要9格，而家有6格，仲要充幾多格？' },
        { id: '9-4', a: 5, b: 4, scenario: '野餐籃裝填', desc: '野餐籃要放9件食物，放咗5件，仲可以放幾多件？' },
      ],
    },
    {
      targetNumber: 10,
      base: 10,
      title: '10號終極反應爐',
      color: '#00BCD4',
      missions: [
        { id: '10-1', a: 9, b: 1, scenario: '十格防護罩', desc: '防護罩需要10粒能量，已有9粒，快啲拉入最後1粒！' },
        { id: '10-2', a: 8, b: 2, scenario: '氧氣罐充填', desc: '氧氣罐滿格係10，已有8格，仲要補幾多格？' },
        { id: '10-3', a: 7, b: 3, scenario: '太空跳飛機', desc: '跳到第7格，仲要跳幾多步先到終點10？' },
        { id: '10-4', a: 6, b: 4, scenario: '主炮充能', desc: '主炮需要10點威力，現有6點，仲差幾多點？' },
        { id: '10-5', a: 5, b: 5, scenario: '雙手擊掌', desc: '一隻手有5隻手指，兩隻手加埋有幾多隻？' },
      ],
    },
  ];

  const ADDITION_LEVELS = additionLevels;

  function getLevelByBase(base) {
    return additionLevels.find((lv) => lv.base === base || lv.targetNumber === base) || additionLevels[0];
  }

  function getMissionById(id) {
    for (const level of additionLevels) {
      const mission = level.missions.find((m) => m.id === id);
      if (mission) return { level, mission };
    }
    return null;
  }

  window.KakaAdditionData = {
    additionLevels,
    ADDITION_LEVELS,
    getLevelByBase,
    getMissionById,
  };
})();

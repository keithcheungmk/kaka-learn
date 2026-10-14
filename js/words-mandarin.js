/* 中文認字・普通話讀法（Keith 2026-10-08）。
 * 只列普通話講法同粵語唔同嘅詞（cmn），卡上會細字顯示；其餘沿用 words.js 的 term。
 * 學校《快樂拼音》課本照用「巴士」「白飯」，所以唔改。錄音由 scripts/build-chinese-mandarin-audio.py 生成。 */
(function () {
  const MANDARIN_TERMS = {
    danche: { cmn: '自行車' }, // 單車
    dishi: { cmn: '出租車' }, // 的士
    jingche: { cmn: '警車' }, // 警察車
    qi_danche: { cmn: '騎自行車' }, // 騎單車
    popo: { cmn: '外婆' }, // 婆婆
    xuegao: { cmn: '冰淇淋' }, // 雪糕
    sanwenzi: { cmn: '三明治' }, // 三文治
    hanbao: { cmn: '漢堡' }, // 漢堡包
    pisa: { cmn: '披薩' }, // 薄餅
    xie_crab: { cmn: '螃蟹' }, // 蟹
    chi: { cmn: '尺子' }, // 間尺
    wuzi: { cmn: '家' }, // 屋企
    keshi: { cmn: '教室' }, // 課室
    jieshi: { cmn: '菜市場' }, // 街市
    yongchi: { cmn: '游泳池' }, // 泳池
    shuifang: { cmn: '臥室' }, // 睡房
    lengqi: { cmn: '空調' }, // 冷氣機
    xitoushui: { cmn: '洗髮水' }, // 洗頭水
    shuxiong: { cmn: '考拉' }, // 樹熊
    honghe: { cmn: '火烈鳥' }, // 紅鶴
    qiyiguo: { cmn: '獼猴桃' }, // 奇異果
    hongluobo: { cmn: '胡蘿蔔' }, // 紅蘿蔔
    shuzai: { cmn: '土豆' }, // 薯仔
    dabianlu: { cmn: '火鍋' }, // 打邊爐
    yudan: { cmn: '魚丸' }, // 魚蛋
    gongzai_mian: { cmn: '方便麵' }, // 公仔麵
    dong_ningcha: { cmn: '冰檸檬茶' }, // 凍檸茶
    shiying: { cmn: '服務員' }, // 侍應
    jishi: { cmn: '飛行員' }, // 機師
    diksi_siji: { cmn: '出租車司機' }, // 的士司機
    shan: { cmn: '衣服' }, // 衫
    fu: { cmn: '褲子' }, // 褲
    kwan: { cmn: '裙子' }, // 裙
    haai: { cmn: '鞋子' }, // 鞋
    mat: { cmn: '襪子' }, // 襪
    mou: { cmn: '帽子' }, // 帽
    waihgan: { cmn: '圍巾' }, // 頸巾
    bazhaoyu: { cmn: '章魚' }, // 八爪魚
  };

  /** 只改讀法、唔改顯示：括號別名唔讀出；單字多音字用同音字鎖定讀音（合成聲單字會揀錯）。 */
  const SPEECH_ONLY = {
    xiongzong: '棕熊', // 棕熊（灰熊）
    chang_long: '常', // 長 cháng，唔係 zhǎng
    lei: '類', // 累 lèi
  };

  function mandarinTerm(word) {
    if (!word) return '';
    return (MANDARIN_TERMS[word.id] && MANDARIN_TERMS[word.id].cmn) || word.term;
  }

  window.KakaMandarin = {
    MANDARIN_TERMS,
    SPEECH_ONLY,
    mandarinTerm,
    differs: (word) => Boolean(word && MANDARIN_TERMS[word.id]),
    speechText: (word) => (word && SPEECH_ONLY[word.id]) || mandarinTerm(word),
    audioSrc: (word) => `assets/chinese-mandarin/${word.id}.m4a`,
  };
})();

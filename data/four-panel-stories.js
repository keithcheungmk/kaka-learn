/** 四格講故事關卡。MVP 只開一本：回家路上（rainbow-umbrella）。
 * 六頁原圖入面揀四格，講到「開始 → 然後 → 後來 → 最後」：
 *   p01 落雨出發、p02 開橙色雨傘、p04 小心行過水窪、p06 收傘返屋企。
 *   唔用 p03（只係繼續行，同 p02 太似）同 p05（收傘前奏，結局用 p06 更清楚）。
 * 獨立模式：唔寫入 family-storybook 填空頁。
 */
window.FOUR_PANEL_STORIES = [
  {
    id: 'rainbow-umbrella',
    title: '雨停了，收起雨傘',
    place: '回家路上',
    startLabel: '點此開始',
    prompt: '第一、然後、後來、最後，同我講個故事啦',
    modelStory: '第一，秋天返屋企路上開始落雨，禧禧同蛙蛙一齊行。然後，蛙蛙開咗把橙色雨傘，兩個人一齊避雨。後來，地上有個小水窪，禧禧小心行過。最後，雨停咗，太陽出嚟，兩個人收起小雨傘返屋企。',
    panels: [
      {
        beat: '第一',
        image: 'assets/family-stories/scenes/rainbow-umbrella-p01.webp',
        alt: '秋天路上開始落雨，禧禧同蛙蛙一齊行',
      },
      {
        beat: '然後',
        image: 'assets/family-stories/scenes/rainbow-umbrella-p02.webp',
        alt: '蛙蛙打開橙色雨傘',
      },
      {
        beat: '後來',
        image: 'assets/family-stories/scenes/rainbow-umbrella-p04.webp',
        alt: '地上有個小水窪，兩人行過',
      },
      {
        beat: '最後',
        image: 'assets/family-stories/scenes/rainbow-umbrella-p06.webp',
        alt: '雨停了，兩人收起雨傘返屋企',
      },
    ],
  },
];

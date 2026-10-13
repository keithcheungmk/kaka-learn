/** 卡卡常識樂園 · 線 B 面試四格（B1–B3 通宵；B4–B6 即將推出） */
window.INTERVIEW_COMICS = [
  {
    id: 'rain-no-umbrella',
    title: '落大雨冇遮',
    place: '返學路上',
    startLabel: '點此開始',
    coinMode: 'common-sense-comic-rain',
    prompt: '第一、然後、後來、最後，同我講個故事啦',
    modelStory: '第一，卡卡同爸爸出街，天陰陰都未帶遮。然後，忽然落大雨，兩個人都嚇一跳。後來，爸爸帶卡卡入走廊避雨，一齊等雨細啲。最後，雨停咗，兩個人安全返到屋企。',
    extendPrompt: '如果係你會點做？點解唔自己跑過馬路？',
    extendHints: [
      '同大人入走廊或者借把遮',
      '唔好自己衝出馬路',
      '等雨細啲先再行',
    ],
    panels: [
      {
        beat: '第一',
        image: 'assets/common-sense/comics/rain-p01.webp',
        alt: '卡卡同爸爸出街，天陰未帶遮',
        caption: '出街冇遮',
      },
      {
        beat: '然後',
        image: 'assets/common-sense/comics/rain-p02.webp',
        alt: '忽然落大雨，兩人嚇一跳',
        caption: '忽然大雨',
      },
      {
        beat: '後來',
        image: 'assets/common-sense/comics/rain-p03.webp',
        alt: '爸爸帶卡卡入走廊避雨',
        caption: '入走廊避雨',
      },
      {
        beat: '最後',
        image: 'assets/common-sense/comics/rain-p04.webp',
        alt: '雨停了，安全返到屋企',
        caption: '安全返屋企',
      },
    ],
  },
  {
    id: 'mtr-need-seat',
    title: '車廂有人需要位',
    place: '港鐵車廂',
    startLabel: '點此開始',
    coinMode: 'common-sense-comic-mtr',
    prompt: '第一、然後、後來、最後，同我講個故事啦',
    modelStory: '第一，卡卡同爸爸坐港鐵，卡卡坐低。然後，見到一位婆婆企住，好似好攰。後來，卡卡企起身讓座，爸爸喺旁邊幫手。最後，婆婆坐低講多謝，大家都開心。',
    extendPrompt: '邊啲人可能需要位？你會點做？',
    extendHints: [
      '婆婆公公、抱寶寶或者行動唔便嘅人',
      '可以讓座，或者叫大人幫手',
      '車廂唔好跑',
    ],
    panels: [
      {
        beat: '第一',
        image: 'assets/common-sense/comics/mtr-p01.webp',
        alt: '卡卡坐喺車廂，爸爸企喺旁邊',
        caption: '坐車',
      },
      {
        beat: '然後',
        image: 'assets/common-sense/comics/mtr-p02.webp',
        alt: '見到婆婆企住，卡卡諗緊',
        caption: '有人需要位',
      },
      {
        beat: '後來',
        image: 'assets/common-sense/comics/mtr-p03.webp',
        alt: '卡卡讓座，婆婆坐低',
        caption: '讓座幫手',
      },
      {
        beat: '最後',
        image: 'assets/common-sense/comics/mtr-p04.webp',
        alt: '婆婆道謝，大家開心',
        caption: '大家道謝',
      },
    ],
  },
  {
    id: 'park-ball-lost',
    title: '公園波唔見有人幫手',
    place: '公園',
    startLabel: '點此開始',
    coinMode: 'common-sense-comic-park',
    prompt: '第一、然後、後來、最後，同我講個故事啦',
    modelStory: '第一，卡卡同禧禧喺公園踢波。然後，波滾走咗，兩個人都好擔心。後來，佢哋請爸爸幫手一齊搵。最後，搵番個波，學到唔見嘢要搵大人。',
    extendPrompt: '唔見咗嘢先做乜？',
    extendHints: [
      '停低，同身邊大人講',
      '請朋友一齊幫手搵',
      '唔好自己跑出馬路去追',
    ],
    panels: [
      {
        beat: '第一',
        image: 'assets/common-sense/comics/park-p01.webp',
        alt: '卡卡同禧禧喺公園玩波',
        caption: '玩波',
      },
      {
        beat: '然後',
        image: 'assets/common-sense/comics/park-p02.webp',
        alt: '波滾走咗，兩個小朋友擔心',
        caption: '波滾走',
      },
      {
        beat: '後來',
        image: 'assets/common-sense/comics/park-p03.webp',
        alt: '請爸爸幫手搵波',
        caption: '請大人幫手',
      },
      {
        beat: '最後',
        image: 'assets/common-sense/comics/park-p04.webp',
        alt: '搵番個波，大家開心',
        caption: '搵番波',
      },
    ],
  },
];

window.INTERVIEW_COMICS_SOON = [
  { id: 'almost-lost', title: '街上差啲走失', place: '商場', blurb: '即將推出' },
  { id: 'spill-water', title: '倒瀉水點處理', place: '課室', blurb: '即將推出' },
  { id: 'share-toys', title: '分享玩具爭執', place: '公園', blurb: '即將推出' },
];

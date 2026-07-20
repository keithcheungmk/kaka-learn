/** 卡卡學習 — 固定 24 字詞表（繁體表面形） */

const DEER_IDS = ['lu', 'meihualu', 'xunlu', 'tuolu', 'malu'];

const WORDS = [
  {
    id: 'lu',
    term: '鹿',
    isDeer: true,
    emoji: '🦌',
    hue: '#7CFFB2',
    svg: deerBase('#7CFFB2', '鹿'),
  },
  {
    id: 'meihualu',
    term: '梅花鹿',
    isDeer: true,
    emoji: '🦌',
    hue: '#FFD166',
    svg: spottedDeer('#FFD166'),
  },
  {
    id: 'xunlu',
    term: '馴鹿',
    isDeer: true,
    emoji: '🦌',
    hue: '#C4B5FD',
    svg: reindeer('#A78BFA'),
  },
  {
    id: 'tuolu',
    term: '駝鹿',
    isDeer: true,
    emoji: '🫎',
    hue: '#FDBA74',
    svg: moose('#FB923C'),
  },
  {
    id: 'malu',
    term: '馬鹿',
    isDeer: true,
    emoji: '🦌',
    hue: '#86EFAC',
    svg: redDeer('#4ADE80'),
  },
  {
    id: 'gou',
    term: '狗',
    isDeer: false,
    emoji: '🐶',
    hue: '#FCD34D',
    svg: dog('#FBBF24'),
  },
  {
    id: 'mao',
    term: '貓',
    isDeer: false,
    emoji: '🐱',
    hue: '#FDA4AF',
    svg: cat('#FB7185'),
  },
  {
    id: 'yu',
    term: '魚',
    isDeer: false,
    emoji: '🐟',
    hue: '#67E8F9',
    svg: fish('#22D3EE'),
  },
  {
    id: 'niao',
    term: '鳥',
    isDeer: false,
    emoji: '🐦',
    hue: '#93C5FD',
    svg: bird('#60A5FA'),
  },
  {
    id: 'tu',
    term: '兔',
    isDeer: false,
    emoji: '🐰',
    hue: '#FBCFE8',
    svg: rabbit('#F9A8D4'),
  },
  {
    id: 'yang',
    term: '羊',
    isDeer: false,
    emoji: '🐑',
    hue: '#E5E7EB',
    svg: sheep('#D1D5DB'),
  },
  {
    id: 'niu',
    term: '牛',
    isDeer: false,
    emoji: '🐮',
    hue: '#FDE68A',
    svg: cow('#F59E0B'),
  },
  {
    id: 'ma',
    term: '馬',
    isDeer: false,
    emoji: '🐴',
    hue: '#D6D3D1',
    svg: horse('#A8A29E'),
  },
  {
    id: 'zhu',
    term: '豬',
    isDeer: false,
    emoji: '🐷',
    hue: '#FECDD3',
    svg: pig('#FB7185'),
  },
  {
    id: 'xiong',
    term: '熊',
    isDeer: false,
    emoji: '🐻',
    hue: '#D6B48A',
    svg: bear('#B45309'),
  },
  {
    id: 'shizi',
    term: '獅子',
    isDeer: false,
    emoji: '🦁',
    hue: '#FBBF24',
    svg: lion('#F59E0B'),
  },
  {
    id: 'laohu',
    term: '老虎',
    isDeer: false,
    emoji: '🐯',
    hue: '#FDBA74',
    svg: tiger('#EA580C'),
  },
  {
    id: 'daxiang',
    term: '大象',
    isDeer: false,
    emoji: '🐘',
    hue: '#CBD5E1',
    svg: elephant('#94A3B8'),
  },
  {
    id: 'hou',
    term: '猴',
    isDeer: false,
    emoji: '🐵',
    hue: '#D6B48A',
    svg: monkey('#C2410C'),
  },
  {
    id: 'ji',
    term: '雞',
    isDeer: false,
    emoji: '🐔',
    hue: '#FECACA',
    svg: chicken('#EF4444'),
  },
  {
    id: 'ya',
    term: '鴨',
    isDeer: false,
    emoji: '🦆',
    hue: '#BBF7D0',
    svg: duck('#16A34A'),
  },
  {
    id: 'wa',
    term: '蛙',
    isDeer: false,
    emoji: '🐸',
    hue: '#86EFAC',
    svg: frog('#22C55E'),
  },
  {
    id: 'chong',
    term: '蟲',
    isDeer: false,
    emoji: '🐛',
    hue: '#BEF264',
    svg: bug('#84CC16'),
  },
  {
    id: 'long',
    term: '龍',
    isDeer: false,
    emoji: '🐲',
    hue: '#5EEAD4',
    svg: dragon('#14B8A6'),
  },
];

let svgSeq = 0;

function wrap(body, bg = '#0F2748') {
  svgSeq += 1;
  const gid = `kg${svgSeq}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-hidden="true">
    <defs>
      <radialGradient id="${gid}" cx="40%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#1E3A5F"/>
        <stop offset="100%" stop-color="${bg}"/>
      </radialGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#${gid})"/>
    <circle cx="22" cy="24" r="1.5" fill="#FDE68A" opacity=".9"/>
    <circle cx="96" cy="30" r="1.2" fill="#A5F3FC" opacity=".8"/>
    <circle cx="105" cy="70" r="1" fill="#FDE68A" opacity=".7"/>
    ${body}
  </svg>`;
}

function deerBase(color) {
  return wrap(`
    <ellipse cx="60" cy="78" rx="28" ry="16" fill="${color}" opacity=".35"/>
    <path d="M42 70c2-18 12-30 18-34 6 4 16 16 18 34" fill="${color}"/>
    <circle cx="60" cy="42" r="14" fill="${color}"/>
    <path d="M50 34l-6-16 8 8M70 34l6-16-8 8" stroke="#FDE68A" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="55" cy="41" r="2" fill="#0B1D3A"/><circle cx="65" cy="41" r="2" fill="#0B1D3A"/>
    <ellipse cx="60" cy="48" rx="3" ry="2" fill="#0B1D3A" opacity=".35"/>
    <circle cx="78" cy="28" r="4" fill="#5EEAD4"/>
  `, '#0B1D3A');
}

function spottedDeer(color) {
  return wrap(`
    <ellipse cx="60" cy="78" rx="28" ry="16" fill="${color}" opacity=".3"/>
    <path d="M40 72c3-20 14-32 20-36 6 4 17 16 20 36" fill="${color}"/>
    <circle cx="60" cy="40" r="15" fill="${color}"/>
    <circle cx="52" cy="55" r="3" fill="#fff" opacity=".85"/>
    <circle cx="68" cy="60" r="2.5" fill="#fff" opacity=".85"/>
    <circle cx="58" cy="66" r="2" fill="#fff" opacity=".85"/>
    <path d="M49 32l-5-14 8 7M71 32l5-14-8 7" stroke="#F8FAFC" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="55" cy="39" r="2" fill="#0B1D3A"/><circle cx="66" cy="39" r="2" fill="#0B1D3A"/>
    <path d="M86 26l6 4-6 4-6-4z" fill="#5EEAD4"/>
  `, '#122848');
}

function reindeer(color) {
  return wrap(`
    <ellipse cx="60" cy="80" rx="26" ry="14" fill="${color}" opacity=".3"/>
    <path d="M42 72c2-16 12-28 18-32 6 4 16 16 18 32" fill="${color}"/>
    <circle cx="60" cy="44" r="13" fill="${color}"/>
    <path d="M44 28c-8-10-2-18 4-14M76 28c8-10 2-18-4-14M48 22c-4-8 4-10 6-4M72 22c4-8-4-10-6-4" stroke="#FDE68A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="55" cy="43" r="2" fill="#0B1D3A"/><circle cx="65" cy="43" r="2" fill="#0B1D3A"/>
    <circle cx="60" cy="48" r="2.5" fill="#FB7185"/>
  `, '#1A1040');
}

function moose(color) {
  return wrap(`
    <ellipse cx="60" cy="82" rx="30" ry="14" fill="${color}" opacity=".28"/>
    <path d="M38 74c4-18 16-28 22-30 6 2 18 12 22 30" fill="${color}"/>
    <ellipse cx="60" cy="48" rx="18" ry="16" fill="${color}"/>
    <path d="M36 40c-12-2-16-14-8-18 8 6 10 12 8 18M84 40c12-2 16-14 8-18-8 6-10 12-8 18" fill="#FDE68A"/>
    <circle cx="53" cy="48" r="2.2" fill="#0B1D3A"/><circle cx="67" cy="48" r="2.2" fill="#0B1D3A"/>
    <ellipse cx="60" cy="56" rx="5" ry="3" fill="#0B1D3A" opacity=".25"/>
  `, '#2A1A0A');
}

function redDeer(color) {
  return wrap(`
    <ellipse cx="60" cy="80" rx="28" ry="14" fill="${color}" opacity=".28"/>
    <path d="M42 72c2-18 12-30 18-34 6 4 16 16 18 34" fill="${color}"/>
    <circle cx="60" cy="42" r="14" fill="${color}"/>
    <path d="M50 32c-2-12 2-16 6-10M70 32c2-12-2-16-6-10" stroke="#F8FAFC" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="55" cy="41" r="2" fill="#0B1D3A"/><circle cx="65" cy="41" r="2" fill="#0B1D3A"/>
    <path d="M88 34c4 0 8 6 0 10" stroke="#5EEAD4" stroke-width="3" fill="none" stroke-linecap="round"/>
  `, '#0B2A1A');
}

function dog(color) {
  return wrap(`
    <ellipse cx="60" cy="84" rx="26" ry="12" fill="${color}" opacity=".25"/>
    <ellipse cx="60" cy="66" rx="24" ry="20" fill="${color}"/>
    <circle cx="60" cy="42" r="18" fill="${color}"/>
    <ellipse cx="38" cy="36" rx="8" ry="12" fill="${color}" transform="rotate(-20 38 36)"/>
    <ellipse cx="82" cy="36" rx="8" ry="12" fill="${color}" transform="rotate(20 82 36)"/>
    <circle cx="53" cy="42" r="2.5" fill="#0B1D3A"/><circle cx="67" cy="42" r="2.5" fill="#0B1D3A"/>
    <ellipse cx="60" cy="50" rx="4" ry="3" fill="#0B1D3A"/>
    <circle cx="92" cy="58" r="5" fill="#5EEAD4"/>
  `);
}

function cat(color) {
  return wrap(`
    <ellipse cx="60" cy="84" rx="24" ry="12" fill="${color}" opacity=".25"/>
    <ellipse cx="60" cy="68" rx="22" ry="18" fill="${color}"/>
    <circle cx="60" cy="44" r="18" fill="${color}"/>
    <path d="M42 30l8 14h-12zM78 30l-8 14h12z" fill="${color}"/>
    <circle cx="53" cy="44" r="2.5" fill="#0B1D3A"/><circle cx="67" cy="44" r="2.5" fill="#0B1D3A"/>
    <path d="M56 52h8" stroke="#0B1D3A" stroke-width="2" stroke-linecap="round"/>
    <path d="M40 48h8M72 48h8" stroke="#FDE68A" stroke-width="2" stroke-linecap="round"/>
  `);
}

function fish(color) {
  return wrap(`
    <ellipse cx="58" cy="60" rx="28" ry="16" fill="${color}"/>
    <path d="M86 60l18-14v28z" fill="${color}"/>
    <circle cx="46" cy="56" r="3" fill="#0B1D3A"/>
    <path d="M58 48c6 4 6 20 0 24" stroke="#A5F3FC" stroke-width="3" fill="none"/>
    <circle cx="28" cy="40" r="3" fill="#FDE68A"/>
  `);
}

function bird(color) {
  return wrap(`
    <ellipse cx="60" cy="66" rx="22" ry="16" fill="${color}"/>
    <circle cx="72" cy="48" r="14" fill="${color}"/>
    <path d="M40 62c-12-8-8-22 4-14" fill="#38BDF8"/>
    <circle cx="76" cy="46" r="2.5" fill="#0B1D3A"/>
    <path d="M84 50l12 2-10 6z" fill="#FBBF24"/>
    <path d="M54 78l4 14M64 78l2 14" stroke="#FDE68A" stroke-width="3" stroke-linecap="round"/>
  `);
}

function rabbit(color) {
  return wrap(`
    <ellipse cx="60" cy="86" rx="22" ry="10" fill="#F9A8D4" opacity=".25"/>
    <ellipse cx="60" cy="70" rx="20" ry="18" fill="#FBCFE8"/>
    <circle cx="60" cy="48" r="16" fill="#FBCFE8"/>
    <ellipse cx="48" cy="24" rx="6" ry="18" fill="#FBCFE8"/>
    <ellipse cx="72" cy="24" rx="6" ry="18" fill="#FBCFE8"/>
    <circle cx="54" cy="48" r="2" fill="#0B1D3A"/><circle cx="66" cy="48" r="2" fill="#0B1D3A"/>
    <circle cx="60" cy="54" r="2.5" fill="#FB7185"/>
  `);
}

function sheep(color) {
  return wrap(`
    <ellipse cx="60" cy="70" rx="28" ry="22" fill="#F3F4F6"/>
    <circle cx="36" cy="58" r="10" fill="#E5E7EB"/>
    <circle cx="84" cy="58" r="10" fill="#E5E7EB"/>
    <circle cx="48" cy="48" r="10" fill="#E5E7EB"/>
    <circle cx="72" cy="48" r="10" fill="#E5E7EB"/>
    <circle cx="60" cy="78" r="12" fill="#D6D3D1"/>
    <circle cx="55" cy="76" r="2" fill="#0B1D3A"/><circle cx="65" cy="76" r="2" fill="#0B1D3A"/>
    <ellipse cx="60" cy="84" rx="3" ry="2" fill="#0B1D3A" opacity=".4"/>
  `);
}

function cow(color) {
  return wrap(`
    <ellipse cx="60" cy="72" rx="28" ry="20" fill="#FDE68A"/>
    <circle cx="60" cy="46" r="18" fill="#FDE68A"/>
    <ellipse cx="42" cy="40" rx="7" ry="10" fill="#F59E0B"/>
    <ellipse cx="78" cy="40" rx="7" ry="10" fill="#F59E0B"/>
    <ellipse cx="48" cy="58" rx="6" ry="5" fill="#0B1D3A" opacity=".35"/>
    <ellipse cx="72" cy="62" rx="5" ry="4" fill="#0B1D3A" opacity=".35"/>
    <circle cx="53" cy="46" r="2.2" fill="#0B1D3A"/><circle cx="67" cy="46" r="2.2" fill="#0B1D3A"/>
    <ellipse cx="60" cy="54" rx="5" ry="3" fill="#FB7185" opacity=".7"/>
  `);
}

function horse(color) {
  return wrap(`
    <ellipse cx="58" cy="78" rx="24" ry="14" fill="#A8A29E"/>
    <path d="M40 70c4-22 14-34 22-28 10-8 22 8 26 24" fill="#A8A29E"/>
    <ellipse cx="78" cy="42" rx="12" ry="10" fill="#A8A29E"/>
    <path d="M48 40c-4-16 2-22 10-12" fill="#78716C"/>
    <circle cx="82" cy="40" r="2" fill="#0B1D3A"/>
    <path d="M90 44l10 2-8 5z" fill="#0B1D3A" opacity=".45"/>
  `);
}

function pig(color) {
  return wrap(`
    <ellipse cx="60" cy="70" rx="28" ry="20" fill="#FDA4AF"/>
    <circle cx="60" cy="48" r="18" fill="#FDA4AF"/>
    <ellipse cx="42" cy="40" rx="6" ry="8" fill="#FB7185"/>
    <ellipse cx="78" cy="40" rx="6" ry="8" fill="#FB7185"/>
    <ellipse cx="60" cy="54" rx="10" ry="7" fill="#FECDD3"/>
    <circle cx="56" cy="54" r="2" fill="#0B1D3A"/><circle cx="64" cy="54" r="2" fill="#0B1D3A"/>
    <circle cx="53" cy="44" r="2" fill="#0B1D3A"/><circle cx="67" cy="44" r="2" fill="#0B1D3A"/>
  `);
}

function bear(color) {
  return wrap(`
    <ellipse cx="60" cy="74" rx="28" ry="20" fill="#B45309"/>
    <circle cx="60" cy="48" r="20" fill="#B45309"/>
    <circle cx="40" cy="32" r="9" fill="#B45309"/>
    <circle cx="80" cy="32" r="9" fill="#B45309"/>
    <circle cx="52" cy="48" r="2.5" fill="#0B1D3A"/><circle cx="68" cy="48" r="2.5" fill="#0B1D3A"/>
    <ellipse cx="60" cy="58" rx="6" ry="4" fill="#0B1D3A" opacity=".35"/>
    <circle cx="60" cy="56" r="2" fill="#0B1D3A"/>
  `);
}

function lion(color) {
  return wrap(`
    <circle cx="60" cy="58" r="34" fill="#F59E0B" opacity=".45"/>
    <circle cx="60" cy="58" r="22" fill="#FBBF24"/>
    <circle cx="52" cy="54" r="2.5" fill="#0B1D3A"/><circle cx="68" cy="54" r="2.5" fill="#0B1D3A"/>
    <path d="M56 64h8" stroke="#0B1D3A" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="60" cy="62" r="3" fill="#B45309"/>
    <path d="M30 40l8 8M90 40l-8 8M34 78l8-6M86 78l-8-6" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>
  `);
}

function tiger(color) {
  return wrap(`
    <ellipse cx="60" cy="70" rx="28" ry="20" fill="#FB923C"/>
    <circle cx="60" cy="46" r="20" fill="#FB923C"/>
    <path d="M42 30l8 14h-10zM78 30l-8 14h10z" fill="#FB923C"/>
    <path d="M48 40v12M60 36v10M72 40v12M50 62v10M70 62v10" stroke="#0B1D3A" stroke-width="3" stroke-linecap="round"/>
    <circle cx="52" cy="46" r="2.5" fill="#0B1D3A"/><circle cx="68" cy="46" r="2.5" fill="#0B1D3A"/>
    <ellipse cx="60" cy="54" rx="4" ry="3" fill="#0B1D3A" opacity=".35"/>
  `);
}

function elephant(color) {
  return wrap(`
    <ellipse cx="58" cy="68" rx="30" ry="22" fill="#94A3B8"/>
    <circle cx="64" cy="48" r="20" fill="#94A3B8"/>
    <path d="M54 58c-2 16 2 28 8 34 2-8 2-20 0-34" fill="#64748B"/>
    <ellipse cx="40" cy="36" rx="7" ry="10" fill="#64748B"/>
    <ellipse cx="84" cy="40" rx="7" ry="10" fill="#64748B"/>
    <circle cx="70" cy="46" r="2.5" fill="#0B1D3A"/>
  `);
}

function monkey(color) {
  return wrap(`
    <ellipse cx="60" cy="74" rx="24" ry="18" fill="#C2410C"/>
    <circle cx="60" cy="50" r="20" fill="#C2410C"/>
    <circle cx="36" cy="48" r="10" fill="#EA580C"/>
    <circle cx="84" cy="48" r="10" fill="#EA580C"/>
    <ellipse cx="60" cy="56" rx="12" ry="10" fill="#FED7AA"/>
    <circle cx="53" cy="48" r="2.2" fill="#0B1D3A"/><circle cx="67" cy="48" r="2.2" fill="#0B1D3A"/>
    <ellipse cx="60" cy="58" rx="3" ry="2" fill="#0B1D3A" opacity=".4"/>
  `);
}

function chicken(color) {
  return wrap(`
    <ellipse cx="60" cy="72" rx="22" ry="18" fill="#F8FAFC"/>
    <circle cx="60" cy="48" r="18" fill="#F8FAFC"/>
    <path d="M52 28c2-10 8-12 8-12s6 2 8 12" fill="#EF4444"/>
    <circle cx="66" cy="48" r="2.5" fill="#0B1D3A"/>
    <path d="M78 50l14 2-12 6z" fill="#FBBF24"/>
    <path d="M48 88l6-10h12l6 10" fill="#FBBF24"/>
    <circle cx="90" cy="36" r="4" fill="#5EEAD4"/>
  `);
}

function duck(color) {
  return wrap(`
    <ellipse cx="58" cy="72" rx="26" ry="18" fill="#4ADE80"/>
    <circle cx="70" cy="48" r="16" fill="#4ADE80"/>
    <path d="M84 50l16 2-12 8z" fill="#FBBF24"/>
    <circle cx="74" cy="46" r="2.5" fill="#0B1D3A"/>
    <ellipse cx="40" cy="70" rx="10" ry="6" fill="#22C55E"/>
    <circle cx="28" cy="40" r="3" fill="#FDE68A"/>
  `);
}

function frog(color) {
  return wrap(`
    <ellipse cx="60" cy="70" rx="28" ry="20" fill="#22C55E"/>
    <circle cx="42" cy="44" r="12" fill="#4ADE80"/>
    <circle cx="78" cy="44" r="12" fill="#4ADE80"/>
    <circle cx="42" cy="44" r="5" fill="#F8FAFC"/><circle cx="78" cy="44" r="5" fill="#F8FAFC"/>
    <circle cx="42" cy="44" r="2.5" fill="#0B1D3A"/><circle cx="78" cy="44" r="2.5" fill="#0B1D3A"/>
    <path d="M50 72c4 4 16 4 20 0" stroke="#0B1D3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  `);
}

function bug(color) {
  return wrap(`
    <ellipse cx="60" cy="64" rx="18" ry="24" fill="#84CC16"/>
    <circle cx="60" cy="38" r="12" fill="#A3E635"/>
    <path d="M48 30c-8-10-14-8-14-8M72 30c8-10 14-8 14-8" stroke="#FDE68A" stroke-width="3" stroke-linecap="round"/>
    <circle cx="55" cy="38" r="2" fill="#0B1D3A"/><circle cx="65" cy="38" r="2" fill="#0B1D3A"/>
    <path d="M48 56h24M48 68h24M50 80h20" stroke="#0B1D3A" stroke-width="2" opacity=".35"/>
  `);
}

function dragon(color) {
  return wrap(`
    <path d="M28 70c8-24 24-34 40-30 14 4 24 18 28 34" fill="#14B8A6"/>
    <circle cx="78" cy="46" r="16" fill="#2DD4BF"/>
    <path d="M68 28l6 12h-10zM86 26l-4 14h10z" fill="#FBBF24"/>
    <circle cx="74" cy="44" r="2.5" fill="#0B1D3A"/><circle cx="84" cy="44" r="2.5" fill="#0B1D3A"/>
    <path d="M88 52c8 2 14 8 10 12" fill="#0F766E"/>
    <circle cx="36" cy="56" r="4" fill="#5EEAD4"/>
    <path d="M40 84l8-8 8 6 8-8 8 8" stroke="#FDE68A" stroke-width="3" fill="none" stroke-linecap="round"/>
  `, '#042F2E');
}

function getWordById(id) {
  return WORDS.find((w) => w.id === id);
}


window.KakaWords = { WORDS, DEER_IDS, getWordById };

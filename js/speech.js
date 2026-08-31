/** 粵語 TTS（Web Speech API / 系統聲線） */

let cachedVoice = null;
let speakTimer = null;
let speakEndTimer = null;
let speakKeepAlive = null;
let speakGen = 0;
/** Safari／iPad：utterance 如果冇人引用會被 GC，出聲會冇聲 */
const heldUtters = [];

function holdUtter(utter) {
  heldUtters.push(utter);
  const drop = () => {
    const i = heldUtters.indexOf(utter);
    if (i >= 0) heldUtters.splice(i, 1);
  };
  utter.addEventListener('end', drop);
  utter.addEventListener('error', drop);
}

/** 已知女聲（Apple／Google／Microsoft 中文聲音）。
 *  KAKA 由頭到尾聽開女聲，iPadOS 更新之後聲音清單次序會變，
 *  淨係攞「第一個 zh-HK」會突然變咗男聲，所以要按名揀。 */
const FEMALE_VOICE_NAMES = [
  'sinji', '思睿', 'sin-ji',
  'meijia', '美佳', 'tingting', '婷婷', 'tian-tian', '天天',
  'yu-shan', '語珊', 'li-mu', 'yating', '雅婷',
  'xiaoxiao', 'xiaoyi', 'hiugaai', '曉佳', 'hiumaan', '曉曼',
  'google 粵語', 'google 國語', 'google 中文',
];

/** 已知男聲，明確排後。 */
const MALE_VOICE_NAMES = ['aasing', '아', 'danny', 'yunjhe', 'yunyang', 'wanlung', '雲龍', 'kangkang', 'liang', 'gordon'];

let preferredVoiceURI = null;

function isFemaleName(v) {
  const n = String(v.name || '').toLowerCase();
  return FEMALE_VOICE_NAMES.some((k) => n.includes(k));
}

function isMaleName(v) {
  const n = String(v.name || '').toLowerCase();
  return MALE_VOICE_NAMES.some((k) => n.includes(k));
}

/** 部機有嘅中文（粵／普）聲音，家長區個清單用。 */
function listChineseVoices() {
  if (!('speechSynthesis' in window)) return [];
  return speechSynthesis.getVoices().filter((v) => /^(zh|yue)/i.test(v.lang || ''));
}

/** 家長揀咗邊把聲；null = 自動。 */
function setPreferredVoiceURI(uri) {
  preferredVoiceURI = uri || null;
  cachedVoice = pickCantoneseVoice();
}

function pickCantoneseVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  // 1) 家長喺設定度揀咗嘅，最大
  if (preferredVoiceURI) {
    const chosen = voices.find((v) => v.voiceURI === preferredVoiceURI);
    if (chosen) return chosen;
  }

  const isHK = (v) => /zh[-_]HK/i.test(v.lang) || /yue/i.test(v.lang) || /cantonese/i.test(v.name);
  const isTW = (v) => /zh[-_]TW/i.test(v.lang);
  const isZh = (v) => /^zh/i.test(v.lang);

  // 2) 粵語女聲 → 粵語（非男聲）→ 粵語任何 → 國語女聲 → …
  const prefer = [
    (v) => isHK(v) && isFemaleName(v),
    (v) => isHK(v) && !isMaleName(v),
    (v) => isHK(v),
    (v) => isTW(v) && isFemaleName(v),
    (v) => isTW(v) && !isMaleName(v),
    (v) => isZh(v) && isFemaleName(v),
    (v) => isZh(v) && !isMaleName(v),
    (v) => isZh(v),
  ];

  for (const test of prefer) {
    const found = voices.find(test);
    if (found) return found;
  }
  return voices[0] || null;
}

/** iPad Safari／Chrome 要有 user gesture 先准出聲，而且第一次 speak 必須喺
 *  gesture 入面「即刻」行（隔咗 setTimeout 就唔算）。所以喺全站第一次撳嘅
 *  嗰一刻，同步播一個零音量嘅空 utterance 解鎖，之後自動讀出先可靠。
 *  症狀：撳「聽一聽」有聲，但換卡自動讀冇聲——就係差呢一步。 */
let speechUnlocked = false;
/** 呢個 session 有冇成功出過聲。只有「由頭到尾未出過聲」先重試，
 *  避免 iOS 唔觸發 onstart 時每個詞都讀兩次。 */
let speechEverStarted = false;

function unlockSpeech() {
  if (speechUnlocked || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.rate = 10;
    speechSynthesis.speak(u);
    speechUnlocked = true;
  } catch (err) {
    /* 解唔到鎖唔好拖冧成頁 */
  }
}

function bindSpeechUnlock() {
  if (typeof document === 'undefined') return;
  const once = () => {
    unlockSpeech();
    document.removeEventListener('pointerdown', once, true);
    document.removeEventListener('touchstart', once, true);
    document.removeEventListener('click', once, true);
  };
  document.addEventListener('pointerdown', once, true);
  document.addEventListener('touchstart', once, true);
  document.addEventListener('click', once, true);
}

function warmVoices() {
  if (!('speechSynthesis' in window)) return;
  bindSpeechUnlock();
  cachedVoice = pickCantoneseVoice();
  if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
    speechSynthesis.onvoiceschanged = () => {
      cachedVoice = pickCantoneseVoice();
    };
  }
}

/** 估算朗讀時長（ms）。iOS／Safari 成日唔觸發 utterance.onend，要靠呢個做後備。 */
function estimateSpeakMs(text, { rate = 0.9, delayMs = 80 } = {}) {
  const chars = Array.from(String(text || '')).length;
  // 粵語大約每字 0.4s；短詞至少預留約 1.4 秒，避免切走字尾
  const speech = Math.max(1400, Math.ceil((chars * 450) / Math.max(0.5, rate)));
  return delayMs + speech + 320;
}

function clearSpeakWatchers() {
  if (speakTimer) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }
  if (speakEndTimer) {
    clearTimeout(speakEndTimer);
    speakEndTimer = null;
  }
  if (speakKeepAlive) {
    clearInterval(speakKeepAlive);
    speakKeepAlive = null;
  }
}

/**
 * 朗讀文字（粵語優先）
 * iOS Safari：cancel 之後要稍延遲再 speak，否則會靜音失敗；
 * 而且 onend 經常唔 fire——會用時長後備確保 onEnd 一定會跑。
 * @param {string} text
 * @param {{ muted?: boolean, rate?: number, pitch?: number, delayMs?: number, onEnd?: function }} options
 */
function speakTerm(text, {
  muted = false,
  rate = 0.9,
  pitch = 1.05,
  delayMs = 80,
  onEnd = null,
} = {}) {
  const runEnd = (() => {
    let done = false;
    return () => {
      if (done) return;
      done = true;
      if (speakEndTimer) {
        clearTimeout(speakEndTimer);
        speakEndTimer = null;
      }
      if (speakKeepAlive) {
        clearInterval(speakKeepAlive);
        speakKeepAlive = null;
      }
      if (typeof onEnd === 'function') onEnd();
    };
  })();

  if (muted || !text) {
    runEnd();
    return;
  }
  if (!('speechSynthesis' in window)) {
    runEnd();
    return;
  }

  clearSpeakWatchers();
  const gen = ++speakGen;

  try {
    speechSynthesis.cancel();
  } catch {
    // ignore
  }

  // 後備：就算 onend／onerror 都唔嚟，都要繼續下一句（鼓勵聲）
  speakEndTimer = setTimeout(runEnd, estimateSpeakMs(text, { rate, delayMs }));

  speakTimer = setTimeout(() => {
    speakTimer = null;
    if (gen !== speakGen) return;
    try {
      // Some iOS versions pause the synthesis engine after cancel
      if (speechSynthesis.paused) speechSynthesis.resume();
    } catch {
      // ignore
    }

    const utter = new SpeechSynthesisUtterance(text);
    const voice = cachedVoice || pickCantoneseVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang || 'zh-HK';
    } else {
      utter.lang = 'zh-HK';
    }
    utter.rate = rate;
    utter.pitch = pitch;
    utter.onend = () => {
      ended = true;
      runEnd();
    };
    utter.onerror = () => {
      ended = true;
      runEnd();
    };
    let started = false;
    let ended = false;
    utter.onstart = () => {
      started = true;
      speechEverStarted = true;
    };
    holdUtter(utter);

    try {
      speechSynthesis.speak(utter);
    } catch {
      runEnd();
      return;
    }

    // 有時第一次 speak 會俾瀏覽器靜靜哋吞咗（語音未解鎖／voices 未載入）。
    // 冇收到 onstart 就重試一次——自動讀出唔會再「第一張卡冇聲」。
    setTimeout(() => {
      if (gen !== speakGen || started || ended || speechEverStarted) return;
      try {
        if (speechSynthesis.speaking || speechSynthesis.pending) return;
        const retry = new SpeechSynthesisUtterance(text);
        const v2 = cachedVoice || pickCantoneseVoice();
        if (v2) {
          retry.voice = v2;
          retry.lang = v2.lang || 'zh-HK';
        } else {
          retry.lang = 'zh-HK';
        }
        retry.rate = rate;
        retry.pitch = pitch;
        retry.onstart = () => {
          speechEverStarted = true;
        };
        retry.onend = runEnd;
        retry.onerror = runEnd;
        holdUtter(retry);
        speechSynthesis.speak(retry);
      } catch {
        // ignore
      }
    }, 700);

    // Chrome 長句有時會卡住 speaking；短句都 harmless
    speakKeepAlive = setInterval(() => {
      if (gen !== speakGen) {
        clearInterval(speakKeepAlive);
        speakKeepAlive = null;
        return;
      }
      try {
        if (!speechSynthesis.speaking) {
          clearInterval(speakKeepAlive);
          speakKeepAlive = null;
          runEnd();
          return;
        }
        speechSynthesis.pause();
        speechSynthesis.resume();
      } catch {
        // ignore
      }
    }, 5000);
  }, delayMs);
}

/**
 * 砌一砌放入一格：喺手指／拖放手勢同一拍讀嗰個字。
 * iPad 單字好易被食：加句號、唔 delay、keep utterance、唔好 cancel 完等 setTimeout。
 */
function speakChar(ch, { muted = false } = {}) {
  const raw = String(ch || '').trim();
  if (muted || !raw) return;
  if (!('speechSynthesis' in window)) return;
  warmAudio();
  const text = /[。．.!?！？]$/.test(raw) ? raw : `${raw}。`;
  const utter = new SpeechSynthesisUtterance(text);
  const voice = cachedVoice || pickCantoneseVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang || 'zh-HK';
  } else {
    utter.lang = 'zh-HK';
  }
  utter.rate = 0.82;
  utter.pitch = 1.06;
  holdUtter(utter);
  try {
    if (speechSynthesis.paused) speechSynthesis.resume();
  } catch {
    // ignore
  }
  try {
    speechSynthesis.speak(utter);
    if (speechSynthesis.paused) speechSynthesis.resume();
  } catch {
    // ignore
  }
}

/**
 * 讀完 text 再執行 next（onEnd + 時長後備，避免 iPad 鼓勵聲永遠唔播）
 */
function speakThen(text, options, next) {
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    if (typeof next === 'function') next();
  };
  const opts = options || {};
  const wait = estimateSpeakMs(text, opts);
  speakTerm(text, {
    ...opts,
    onEnd: go,
  });
  // 雙重保險：即使 speakTerm 內部後備失效，呢度都跟住下一句
  setTimeout(go, wait + 120);
}

/** 測驗答啱／答錯語音回饋（隨機抽一句，長短夾雜） */
const FEEDBACK_CORRECT_LINES = [
  '你好叻呀，答啱咗！',
  '答啱喇！',
  '哇，好叻！',
  '叻仔，完全啱晒！',
];

const FEEDBACK_RETRY_LINES = [
  '唔緊要，試多次！',
  '再試吓啦！',
  '差少少，唔緊要！',
  '冇事嘅，我哋一齊再諗吓！',
];

function pickFeedbackLine(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * @returns {string} 今次用嘅鼓勵句（方便畫面同語音一致）
 */
function speakCorrectFeedback({ muted = false, onEnd = null } = {}) {
  const line = pickFeedbackLine(FEEDBACK_CORRECT_LINES);
  speakTerm(line, { muted, rate: 0.92, pitch: 1.08, delayMs: 220, onEnd });
  return line;
}

/**
 * 答啱流程：先讀學習字詞，再叮聲 + 鼓勵。
 * iPad／Safari 成日唔容許「第二次」async speak，所以字詞同鼓勵合併成一次 utterance。
 * @returns {string} 鼓勵句（畫面顯示用）
 */
function speakWordThenEncourage(term, { muted = false, onEnd = null } = {}) {
  const praise = pickFeedbackLine(FEEDBACK_CORRECT_LINES);
  if (muted || !term) {
    if (typeof onEnd === 'function') onEnd();
    return praise;
  }
  warmAudio();
  // 字詞大概讀完就叮一聲（唔等 onend）
  const dingAt = Math.max(500, estimateSpeakMs(term, { rate: 0.9, delayMs: 80 }) - 360);
  setTimeout(() => playCorrectCue({ muted }), dingAt);
  // 一次過：「哥哥。你好叻呀，答啱咗！」——避免第二次 speak 被靜音
  speakTerm(`${term}。${praise}`, {
    muted,
    rate: 0.92,
    pitch: 1.06,
    delayMs: 80,
    onEnd,
  });
  return praise;
}

/**
 * @returns {string} 今次用嘅再試句
 */
function speakRetryFeedback({ muted = false, onEnd = null } = {}) {
  const line = pickFeedbackLine(FEEDBACK_RETRY_LINES);
  speakTerm(line, { muted, rate: 0.92, pitch: 1.0, delayMs: 220, onEnd });
  return line;
}

/** 重用同一個 AudioContext，避免 iPad 每次 new 後被自動 suspend／播唔出 */
let sharedAudioCtx = null;

function getAudioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/** 喺手指手勢入面喚醒音效（之後 async 叮聲先播得唔出） */
function warmAudio() {
  try {
    getAudioCtx();
  } catch {
    // ignore
  }
}

/** 簡短正確音效（Web Audio，不依賴外部檔） */
function playCorrectCue({ muted = false } = {}) {
  if (muted) return;
  beep([523.25, 659.25, 783.99], 0.08, 0.12);
}

function playTryAgainCue({ muted = false } = {}) {
  if (muted) return;
  beep([392, 349.23], 0.1, 0.1);
}

function playStarCue({ muted = false } = {}) {
  if (muted) return;
  beep([659.25, 783.99, 1046.5], 0.07, 0.14);
}

function playCoinHintCue({ muted = false } = {}) {
  if (muted) return;
  beep([523.25, 659.25, 783.99, 1046.5], 0.09, 0.16);
}

function beep(freqs, noteDur, gap) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    let t = ctx.currentTime + 0.02;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteDur + 0.02);
      t += noteDur + (i < freqs.length - 1 ? gap * 0.35 : 0);
    });
  } catch {
    // ignore
  }
}

/** ---------- 英文發音（卡卡字母隊 phonics 用；同粵語 TTS 分開一套） ---------- */

let cachedEnglishVoice = null;
let speakEnglishTimer = null;

/** 英文女聲（字母隊都應該係同一把「媽媽聲」感覺，唔好一中一英兩種性別）。 */
const FEMALE_EN_VOICE_NAMES = [
  'samantha', 'karen', 'moira', 'serena', 'kate', 'martha', 'fiona', 'ava',
  'allison', 'susan', 'zoe', 'tessa', 'female', 'aria', 'jenny', 'sonia', 'libby',
];
const MALE_EN_VOICE_NAMES = ['daniel', 'alex', 'fred', 'tom', 'aaron', 'arthur', 'oliver', 'male', 'ryan', 'guy'];

function pickEnglishVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const nm = (v) => String(v.name || '').toLowerCase();
  const fem = (v) => FEMALE_EN_VOICE_NAMES.some((k) => nm(v).includes(k));
  const male = (v) => MALE_EN_VOICE_NAMES.some((k) => nm(v).includes(k));
  const gb = (v) => /en[-_]GB/i.test(v.lang);
  const us = (v) => /en[-_]US/i.test(v.lang);
  const en = (v) => /^en/i.test(v.lang);

  const prefer = [
    (v) => gb(v) && fem(v),
    (v) => gb(v) && !male(v),
    (v) => us(v) && fem(v),
    (v) => us(v) && !male(v),
    (v) => en(v) && fem(v),
    (v) => en(v) && !male(v),
    en,
  ];

  for (const test of prefer) {
    const found = voices.find(test);
    if (found) return found;
  }
  return voices[0] || null;
}

/** 用 addEventListener（唔用 onvoiceschanged=）避免同粵語 warmVoices() 果個 property handler 互相覆蓋 */
function warmEnglishVoice() {
  if (!('speechSynthesis' in window)) return;
  cachedEnglishVoice = pickEnglishVoice();
  if (typeof speechSynthesis.addEventListener === 'function') {
    speechSynthesis.addEventListener('voiceschanged', () => {
      cachedEnglishVoice = pickEnglishVoice();
    });
  }
}

/**
 * 朗讀英文詞（字母／CVC 詞／sight word）
 * @param {string} text
 * @param {{ muted?: boolean, rate?: number, pitch?: number, delayMs?: number, onEnd?: function }} options
 */
function speakEnglishTerm(text, {
  muted = false,
  rate = 0.85,
  pitch = 1.05,
  delayMs = 80,
  onEnd = null,
} = {}) {
  if (muted || !text) {
    if (onEnd) onEnd();
    return;
  }
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  if (speakEnglishTimer) {
    clearTimeout(speakEnglishTimer);
    speakEnglishTimer = null;
  }

  try {
    speechSynthesis.cancel();
  } catch {
    // ignore
  }

  speakEnglishTimer = setTimeout(() => {
    speakEnglishTimer = null;
    try {
      if (speechSynthesis.paused) speechSynthesis.resume();
    } catch {
      // ignore
    }

    const utter = new SpeechSynthesisUtterance(text);
    const voice = cachedEnglishVoice || pickEnglishVoice();
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang || 'en-US';
    } else {
      utter.lang = 'en-US';
    }
    utter.rate = rate;
    utter.pitch = pitch;
    if (onEnd) {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        onEnd();
      };
      utter.onend = finish;
      utter.onerror = finish;
    }
    speechSynthesis.speak(utter);
  }, delayMs);
}

window.KakaSpeech = {
  warmVoices,
  unlockSpeech,
  listChineseVoices,
  setPreferredVoiceURI,
  currentVoice: () => cachedVoice,
  warmAudio,
  speakTerm,
  speakChar,
  speakThen,
  speakCorrectFeedback,
  speakWordThenEncourage,
  speakRetryFeedback,
  playCorrectCue,
  playTryAgainCue,
  playStarCue,
  playCoinHintCue,
  estimateSpeakMs,
  FEEDBACK_CORRECT_LINES,
  FEEDBACK_RETRY_LINES,
  warmEnglishVoice,
  speakEnglishTerm,
};

/** 粵語 TTS（Web Speech API / 系統聲線） */

let cachedVoice = null;
let speakTimer = null;
let speakEndTimer = null;
let speakKeepAlive = null;
let speakGen = 0;

function pickCantoneseVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const prefer = [
    (v) => /zh[-_]HK/i.test(v.lang),
    (v) => /yue/i.test(v.lang) || /cantonese/i.test(v.name),
    (v) => /zh[-_]TW/i.test(v.lang),
    (v) => /^zh/i.test(v.lang),
  ];

  for (const test of prefer) {
    const found = voices.find(test);
    if (found) return found;
  }
  return voices[0] || null;
}

function warmVoices() {
  if (!('speechSynthesis' in window)) return;
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
    utter.onend = runEnd;
    utter.onerror = runEnd;

    try {
      speechSynthesis.speak(utter);
    } catch {
      runEnd();
      return;
    }

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

function pickEnglishVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;

  const prefer = [
    (v) => /en[-_]GB/i.test(v.lang),
    (v) => /en[-_]US/i.test(v.lang),
    (v) => /^en/i.test(v.lang),
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
  warmAudio,
  speakTerm,
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

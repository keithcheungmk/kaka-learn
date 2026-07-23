/** 粵語 TTS（Web Speech API / 系統聲線） */

let cachedVoice = null;
let speakTimer = null;

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

/**
 * 朗讀文字（粵語優先）
 * iOS Safari：cancel 之後要稍延遲再 speak，否則會靜音失敗
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
  if (muted || !text) {
    if (onEnd) onEnd();
    return;
  }
  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  if (speakTimer) {
    clearTimeout(speakTimer);
    speakTimer = null;
  }

  try {
    speechSynthesis.cancel();
  } catch {
    // ignore
  }

  speakTimer = setTimeout(() => {
    speakTimer = null;
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
  speakTerm(line, { muted, rate: 0.92, pitch: 1.08, delayMs: 180, onEnd });
  return line;
}

/**
 * @returns {string} 今次用嘅再試句
 */
function speakRetryFeedback({ muted = false, onEnd = null } = {}) {
  const line = pickFeedbackLine(FEEDBACK_RETRY_LINES);
  speakTerm(line, { muted, rate: 0.92, pitch: 1.0, delayMs: 180, onEnd });
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
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
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

window.KakaSpeech = {
  warmVoices,
  speakTerm,
  speakCorrectFeedback,
  speakRetryFeedback,
  playCorrectCue,
  playTryAgainCue,
  playStarCue,
  playCoinHintCue,
  FEEDBACK_CORRECT_LINES,
  FEEDBACK_RETRY_LINES,
};

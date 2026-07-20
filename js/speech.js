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

/** 測驗答啱／答錯語音回饋 */
const FEEDBACK_CORRECT = '你好叻呀，答啱咗！';
const FEEDBACK_RETRY = '唔緊要，試多次！';

function speakCorrectFeedback({ muted = false, onEnd = null } = {}) {
  // 等短音效先行，再講鼓勵句，避免互相搶
  speakTerm(FEEDBACK_CORRECT, { muted, rate: 0.92, pitch: 1.08, delayMs: 180, onEnd });
}

function speakRetryFeedback({ muted = false, onEnd = null } = {}) {
  speakTerm(FEEDBACK_RETRY, { muted, rate: 0.92, pitch: 1.0, delayMs: 180, onEnd });
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
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
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
    setTimeout(() => ctx.close().catch(() => {}), 1500);
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
  FEEDBACK_CORRECT,
  FEEDBACK_RETRY,
};

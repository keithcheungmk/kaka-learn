/** 粵語 TTS（Web Speech API / 系統聲線） */

let cachedVoice = null;

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

export function warmVoices() {
  if (!('speechSynthesis' in window)) return;
  cachedVoice = pickCantoneseVoice();
  if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
    speechSynthesis.onvoiceschanged = () => {
      cachedVoice = pickCantoneseVoice();
    };
  }
}

/**
 * 朗讀完整詞語（粵語優先）
 * @param {string} text
 * @param {{ muted?: boolean }} options
 */
export function speakTerm(text, { muted = false } = {}) {
  if (muted || !text) return;
  if (!('speechSynthesis' in window)) return;

  try {
    speechSynthesis.cancel();
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
  utter.rate = 0.9;
  utter.pitch = 1.05;
  speechSynthesis.speak(utter);
}

/** 簡短正確音效（Web Audio，不依賴外部檔） */
export function playCorrectCue({ muted = false } = {}) {
  if (muted) return;
  beep([523.25, 659.25, 783.99], 0.08, 0.12);
}

export function playTryAgainCue({ muted = false } = {}) {
  if (muted) return;
  beep([392, 349.23], 0.1, 0.1);
}

export function playStarCue({ muted = false } = {}) {
  if (muted) return;
  beep([659.25, 783.99, 1046.5], 0.07, 0.14);
}

export function playCoinHintCue({ muted = false } = {}) {
  if (muted) return;
  beep([523.25, 659.25, 783.99, 1046.5], 0.09, 0.16);
}

function beep(freqs, noteDur, gap) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
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

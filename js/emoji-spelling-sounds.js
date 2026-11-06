/* Local, light feedback sounds and reviewed phonics clips for Emoji Spelling. */
(function () {
  let context = null;
  let activeAudio = null;
  let finishClip = null;
  let generation = 0;

  function cue(notes, muted) {
    if (muted) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      context ||= new AudioContextClass();
      if (context.state === 'suspended') context.resume().catch(() => {});
      const start = context.currentTime;
      notes.forEach(([frequency, offset, duration]) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.13, start + offset + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(start + offset); oscillator.stop(start + offset + duration + 0.01);
      });
    } catch { /* A missing audio device must not block play. */ }
  }

  function stopPhonics() {
    generation += 1;
    if (activeAudio) { try { activeAudio.pause(); } catch {} }
    finishClip?.();
    activeAudio = null;
  }

  async function playPhonics(chunks, { muted = false } = {}) {
    stopPhonics();
    const token = generation;
    if (muted) return;
    for (const chunk of chunks) {
      if (token !== generation) return;
      if (chunk === 'ice') {
        // The established rice lesson uses the spoken rime "ice", not a phoneme recording.
        await new Promise((resolve) => {
          let settled = false;
          let timer;
          const finish = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (finishClip === finish) finishClip = null;
            resolve();
          };
          finishClip = finish;
          timer = setTimeout(finish, 2500);
          window.KakaSpeech.speakEnglishTerm('ice', { muted: false, rate: 0.84, delayMs: 0, onEnd: finish });
        });
        continue;
      }
      await new Promise((resolve) => {
        const audio = new Audio(`./assets/phonemes/${encodeURIComponent(chunk)}.mp3?v=20260916-clean-rime-flow`);
        activeAudio = audio;
        let settled = false;
        let timer;
        const finish = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          audio.removeEventListener('ended', finish);
          audio.removeEventListener('error', finish);
          if (activeAudio === audio) activeAudio = null;
          if (finishClip === finish) finishClip = null;
          resolve();
        };
        finishClip = finish;
        audio.addEventListener('ended', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });
        timer = setTimeout(finish, 1800);
        try { audio.play()?.catch(finish); } catch { finish(); }
      });
    }
  }

  window.KakaEmojiSpellingSounds = {
    correct: ({ muted = false } = {}) => cue([[1047, 0, .18], [1397, .13, .25]], muted),
    retry: ({ muted = false } = {}) => cue([[440, 0, .11], [523, .10, .13]], muted),
    playPhonics,
    stopPhonics,
  };
})();

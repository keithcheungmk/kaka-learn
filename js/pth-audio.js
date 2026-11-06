/** Single playback owner for word clips and native video controls. No device TTS. */
export function createAudioController(audio, status, videos, onBusy = () => {}) {
  let token = 0;
  let timeout;
  let busy = false;
  const setBusy = value => { busy = value; onBusy(value); };
  const message = text => { status.textContent = text; status.hidden = !text; };
  function stop(except = null) {
    token++; clearTimeout(timeout);
    audio.onended = audio.onerror = null;
    for (const media of [audio, ...videos()]) if (media !== except) media.pause();
    setBusy(false);
  }
  function play(src, ended = () => {}) {
    stop(); const request = token;
    setBusy(true);
    message('正在載入普通話錄音…');
    const fail = () => { if (request !== token) return; stop(); message('聲音未能播放。請檢查網絡，再按「聽一聽」重試。'); };
    audio.src = src; audio.currentTime = 0; audio.onerror = fail;
    audio.onended = () => { if (request !== token) return; clearTimeout(timeout); setBusy(false); message(''); ended(); };
    // Remote Safari byte-range requests can take longer than a local clip load.
    // Keep a finite retry path without rejecting a healthy slow connection.
    timeout = setTimeout(fail, 25000);
    // iPad: call play() within the original gesture, never wait for metadata.
    audio.play()?.then(() => { if (request === token) message(''); }).catch(fail);
  }
  function bindVideo(video) {
    video.addEventListener('play', () => { stop(video); message(''); });
    video.addEventListener('error', () => message('教材影片未能載入，請檢查網絡後再試。'));
  }
  return { stop, play, bindVideo, message, get busy() { return busy; } };
}

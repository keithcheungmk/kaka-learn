/* PTH 普通話拼音資料層；獨立於粵語 speech.js 及英文 Phonics。 */
(function (root) {
  const TONE_MARKS = ['ā', 'á', 'ǎ', 'à'];
  const SINGLE_FINALS = ['a', 'o', 'e', 'i', 'u', 'ü'];
  const INITIALS_BPMF = ['b', 'p', 'm', 'f'];

  function validateQuestion(question, audioManifest) {
    if (!question || !question.id || !question.lesson || !question.type) return false;
    if (!Array.isArray(question.options) || question.options.length < 2) return false;
    if (!question.options.includes(question.answer)) return false;
    if (question.audioId) {
      const audio = audioManifest?.items?.[question.audioId];
      if (!audio || audio.source === '粵語TTS' || audio.src) return !!audio.src;
      return audio.status === 'pending' && audio.src === null;
    }
    return true;
  }

  function getPendingAudio(question, audioManifest) {
    const audio = question?.audioId ? audioManifest?.items?.[question.audioId] : null;
    return audio && audio.status === 'pending' ? audio : null;
  }

  root.KakaPthData = { TONE_MARKS, SINGLE_FINALS, INITIALS_BPMF, validateQuestion, getPendingAudio };
}(window));

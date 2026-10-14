export function normalizeSentence(text) {
  return String(text || '').replace(/[\s，。！？、；：,.!?;:'"「」『』（）()【】\-—]/gu, '');
}

export function sentenceChunksMatch(question) {
  return normalizeSentence(question.sentence) === normalizeSentence((question.chunks || []).join(''));
}

export function answerChoiceIds(question) {
  return question.chunks.map((_, index) => `answer-${index}`);
}

export function makeOptions(question, random = Math.random) {
  const choices = [
    ...question.chunks.map((text, index) => ({ id: `answer-${index}`, text, isAnswer: true })),
    ...(question.distractors || []).map((text, index) => ({ id: `distractor-${index}`, text, isAnswer: false })),
  ];
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [choices[index], choices[other]] = [choices[other], choices[index]];
  }
  return choices;
}

export function placeNextChunk(placements, choiceId, answerIds) {
  if (!answerIds.includes(choiceId) || placements.includes(choiceId)) return [...placements];
  const next = [...placements];
  const slot = next.findIndex((value) => value == null);
  if (slot >= 0) next[slot] = choiceId;
  return next;
}

export function placeChunkAt(placements, choiceId, slotIndex, answerIds) {
  if (!answerIds.includes(choiceId) || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= placements.length) return [...placements];
  const next = [...placements];
  const previousIndex = next.indexOf(choiceId);
  const displaced = next[slotIndex];
  if (previousIndex >= 0 && previousIndex !== slotIndex) next[previousIndex] = displaced ?? null;
  next[slotIndex] = choiceId;
  return next;
}

export function removeChunkAt(placements, slotIndex) {
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= placements.length) return [...placements];
  const next = [...placements];
  next[slotIndex] = null;
  return next;
}

export function isSentenceCorrect(placements, answerIds, options, expectedChunks) {
  if (placements.length !== answerIds.length || new Set(placements).size !== answerIds.length) return false;
  if (!answerIds.every((id) => placements.includes(id))) return false;
  if (!Array.isArray(options) || !Array.isArray(expectedChunks)) {
    return answerIds.every((id, index) => placements[index] === id);
  }
  if (expectedChunks.length !== answerIds.length) return false;
  const textById = new Map(options.map((option) => [option.id, option.text]));
  return placements.every((id, index) => textById.get(id) === expectedChunks[index]);
}

export function addQuestionStars(stars, amount, cap = 10) {
  return Math.min(cap, Math.max(0, stars) + Math.max(0, amount));
}

/**
 * PTH pinyin display + quiz helpers.
 * Curated textbook pinyin stays in pth-content.js; this module only formats
 * initials and builds distractors so learn/quiz UIs stay consistent.
 */

/** Escape text for safe HTML insertion. */
export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/**
 * Highlight the first written initial inside a pinyin string.
 * Digraphs (zh/ch/sh) are taken from `initial` when provided.
 */
export function markInitialHtml(pinyin, initial = '') {
  const raw = String(pinyin ?? '').trim();
  if (!raw) return '';
  const firstSyllable = raw.split(/\s+/)[0] || raw;
  const restSyllables = raw.slice(firstSyllable.length);
  const tip = String(initial || '').toLowerCase();
  let head = tip;
  if (!head || !firstSyllable.toLowerCase().startsWith(head)) {
    const plain = firstSyllable.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    head = plain.match(/^(zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])/)?.[0] || firstSyllable.slice(0, 1);
  }
  // Map bare initial onto the toned first syllable (e.g. sh → shé).
  let cut = 0;
  const base = firstSyllable.normalize('NFD');
  let plainIndex = 0;
  for (let i = 0; i < base.length && plainIndex < head.length; i++) {
    const ch = base[i];
    if (/[\u0300-\u036f]/.test(ch)) continue;
    if (ch.toLowerCase() !== head[plainIndex]) break;
    plainIndex += 1;
    cut = i + 1;
  }
  while (cut < base.length && /[\u0300-\u036f]/.test(base[cut])) cut += 1;
  const marked = base.slice(0, cut) || firstSyllable.slice(0, Math.max(1, head.length));
  const tail = firstSyllable.slice(marked.length) + restSyllables;
  return `<span class="pinyin-initial">${escapeHtml(marked)}</span>${escapeHtml(tail)}`;
}

/** Strip tone marks for rough similarity checks. */
export function stripTones(pinyin) {
  return String(pinyin ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Build up to `count` wrong pinyin options from the same PTH group pool.
 * Prefers same-length / similar-looking syllables; never repeats the answer.
 */
export function buildPinyinDistractors(answerPinyin, pool, random, count = 3) {
  const answer = String(answerPinyin ?? '').trim();
  const answerKey = stripTones(answer);
  const unique = [];
  const seen = new Set([answerKey]);
  for (const item of pool) {
    const py = String(item?.pinyin ?? '').trim();
    const key = stripTones(py);
    if (!py || seen.has(key)) continue;
    seen.add(key);
    unique.push(py);
  }
  unique.sort((a, b) => {
    const da = Math.abs(stripTones(a).length - answerKey.length);
    const db = Math.abs(stripTones(b).length - answerKey.length);
    if (da !== db) return da - db;
    return stripTones(a) < stripTones(b) ? -1 : 1;
  });
  const picked = [];
  const bag = [...unique];
  while (picked.length < count && bag.length) {
    const index = Math.floor(random() * bag.length);
    picked.push(bag.splice(index, 1)[0]);
  }
  return picked;
}

/** Shuffle a copy with the provided RNG. */
export function shuffleCopy(list, random) {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

#!/usr/bin/env node
// Generate a reviewable story object on stdout; this never edits the manifest.
import fs from 'node:fs';

function requireStrings(value, label, min = 0) {
  if (!Array.isArray(value) || value.length < min || value.some(v => typeof v !== 'string' || !v.trim())) {
    throw new Error(`${label} must contain at least ${min} non-empty strings`);
  }
  return value;
}
const normalize = text => text.replace(/[，。！？、\s]/g, '');
function draftStory(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('story must be an object');
  for (const key of ['id', 'title', 'place', 'summary']) {
    if (typeof input[key] !== 'string' || !input[key].trim()) throw new Error(`${key} is required`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.id)) throw new Error('id must use lowercase letters, numbers and hyphens');
  requireStrings(input.characters, 'characters', 1);
  if (!Array.isArray(input.pages) || input.pages.length < 6 || input.pages.length > 8) throw new Error('pages must contain 6–8 pages');
  const bookWords = requireStrings(input.bookWords ?? [], 'bookWords');
  const pages = input.pages.map((page, i) => {
    const label = `page ${i + 1}`;
    if (!page || typeof page.sentence !== 'string' || !page.sentence.trim()) throw new Error(`${label}: sentence is required`);
    if (!/[。！？]$/.test(page.sentence) || /[。！？].+[。！？]/.test(page.sentence)) throw new Error(`${label}: provide one punctuated sentence`);
    const focusWords = requireStrings(page.focusWords, `${label}: focusWords`, 1);
    if (focusWords.length !== 2) throw new Error(`${label}: supply exactly two focusWords`);
    const distractors = requireStrings(page.distractors, `${label}: distractors`, 2);
    if (new Set(focusWords).size !== focusWords.length || focusWords.some(word => distractors.includes(word))) throw new Error(`${label}: words must be distinct from distractors`);
    let previousEnd = 0;
    for (const word of focusWords) {
      const at = page.sentence.indexOf(word);
      if (at < previousEnd || page.sentence.indexOf(word, at + 1) !== -1) throw new Error(`${label}: focusWords must each occur once in sentence order without overlap`);
      previousEnd = at + word.length;
    }
    const tiles = page.tiles === undefined ? [page.sentence] : requireStrings(page.tiles, `${label}: tiles`, 1);
    if (normalize(tiles.join('')) !== normalize(page.sentence)) throw new Error(`${label}: tiles must reconstruct the sentence`);
    return { ...page, sentence: page.sentence, tiles, learn: [...focusWords], focusWords: [...focusWords], distractors: [...distractors] };
  });
  const extensionWords = [...new Set([...requireStrings(input.extensionWords ?? [], 'extensionWords'), ...pages.flatMap(page => page.focusWords.filter(word => !bookWords.includes(word)))])];
  return { ...input, sourceBooks: requireStrings(input.sourceBooks ?? [], 'sourceBooks'), bookWords, extensionWords, pages };
}
try {
  const raw = fs.readFileSync(process.argv[2] || 0, 'utf8');
  process.stdout.write(JSON.stringify(draftStory(JSON.parse(raw)), null, 2) + '\n');
} catch (error) {
  console.error(`Cannot create story draft: ${error.message}`);
  process.exitCode = 1;
}

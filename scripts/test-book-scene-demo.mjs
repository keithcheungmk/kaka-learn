#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RED_SERIES_BOOKS, RED_SENTENCE_RULES } from '../data/red-series/sentence-game-data.mjs';
import { addQuestionStars, answerChoiceIds, isSentenceCorrect, makeOptions, normalizeSentence, placeChunkAt, placeNextChunk, removeChunkAt, sentenceChunksMatch } from '../js/red-sentence-engine.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'js/book-scene-demo.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'book-scene-demo.html'), 'utf8');
const pageManifest = JSON.parse(fs.readFileSync(path.join(root, 'data/red-series/story-page-hq-manifest.json'), 'utf8'));

assert.equal(RED_SERIES_BOOKS.length, 12, '12 本紅輯全部列入資料層');
assert.equal(pageManifest.books.length, 12, '每本書均有頁面來源 manifest');
assert.equal(RED_SERIES_BOOKS.filter((book) => book.mode === 'sentence').length, 4, '目前四本書已啟用已核實題目');
const activeBook = RED_SERIES_BOOKS.find((book) => book.id === 'rb_fenguo');
assert.equal(activeBook.mode, 'sentence');
assert.equal(activeBook.questions.length, 3, '《分果果》只按三個已核實書頁／跨頁出題');
assert.equal(new Set(activeBook.questions.map((question) => question.id)).size, activeBook.questions.length, '題目不得重複');
assert.deepEqual(activeBook.questions.map((question) => question.stars), [4, 4, 2], '按本版實際正確詞組數派星，合共10粒');
assert.equal(activeBook.questions.reduce((sum, question) => sum + question.stars, 0), RED_SENTENCE_RULES.starCap);
assert.deepEqual(activeBook.questions[0].chunks, ['爸爸', '一個橙', '媽媽', '一個蘋果'], '整個跨頁句子一起作答');
assert.equal(activeBook.questions[2].sentence, '姐姐一個芒果。');
assert.match(activeBook.questions[2].excludedSide, /最後一個水果/);
const callingBook = RED_SERIES_BOOKS.find((book) => book.id === 'rb_shuijiao');
assert.equal(callingBook.mode, 'sentence', '《誰在叫》故事頁正式進入砌句試點');
assert.equal(callingBook.questions.length, 1, '本輪只啟用已核實的 PDF p5 故事跨頁');
const callingSpread = callingBook.questions[0];
assert.equal(callingSpread.pdfPage, 5, '排除 PDF p4 字卡／封面頁');
assert.deepEqual(callingSpread.bookPages, [2, 3]);
assert.equal(callingSpread.chunks.length, 10, 'p5 完整兩句原文共有十個詞組');
assert.ok(new Set(callingSpread.chunks).size < callingSpread.chunks.length, '本頁包含重複「喵」及「誰在叫」詞組');
assert.ok(sentenceChunksMatch(callingSpread), '兩句連同標點切詞後須還原 p5 原文');
assert.equal(callingBook.questions.reduce((sum, question) => sum + question.stars, 0), RED_SENTENCE_RULES.starCap, '《誰在叫》十個原文詞組收集十粒星');
const letterBook = RED_SERIES_BOOKS.find((book) => book.id === 'rb_xin');
assert.equal(letterBook.mode, 'sentence');
assert.equal(letterBook.flow, RED_SENTENCE_RULES.gentleFlow, '《信》用 gentle 簡化流程');
assert.equal(letterBook.questions.length, 4);
assert.equal(letterBook.questions.reduce((sum, question) => sum + question.stars, 0), 8);
assert.ok(letterBook.questions.every((question) => question.distractors.length === 0), '《信》gentle：無干擾字');
assert.equal(makeOptions(letterBook.questions[0], () => 0).length, 2, '《信》字池只有本頁正確詞組');
const runBook = RED_SERIES_BOOKS.find((book) => book.id === 'rb_kuaipao');
assert.equal(runBook.mode, 'sentence');
assert.equal(runBook.questions.length, 4);
assert.equal(runBook.questions.reduce((sum, question) => sum + question.stars, 0), 8);

for (const book of RED_SERIES_BOOKS) {
  if (book.mode === 'preview') {
    assert.equal(book.questions.length, 0, `${book.title} 未核實時不可有正式題`);
    assert.ok(book.previewPages.length > 0, `${book.title} 仍可預覽來源頁`);
    for (const page of book.previewPages) assert.ok(fs.existsSync(path.join(root, page.image)), `${book.title} PDF 第 ${page.pdfPage} 頁圖存在`);
  } else {
    const gentle = book.flow === RED_SENTENCE_RULES.gentleFlow;
    for (const question of book.questions) {
      assert.ok(question.sourceVerified, `${book.title}/${question.id} 來源須人工核實`);
      assert.ok(question.pdfPage >= 1 && question.bookPages?.length, `${book.title}/${question.id} 頁碼有效`);
      assert.ok(question.image && fs.existsSync(path.join(root, question.image)), `${book.title}/${question.id} 書頁資產存在`);
      assert.ok(question.sentence && question.chunks.length >= 2, `${book.title}/${question.id} 原句與詞組完整`);
      assert.ok(sentenceChunksMatch(question), `${book.title}/${question.id} 詞組須還原原句`);
      if (gentle) {
        assert.equal(question.distractors.length, 0, `${book.title}/${question.id} gentle 不可有干擾`);
      } else {
        assert.ok(question.distractors.length >= 2 && question.distractors.length <= 4, `${book.title}/${question.id} 干擾項數量`);
        assert.ok(question.distractorSource, `${book.title}/${question.id} 干擾項來源須可追查`);
        assert.ok(question.distractors.every((item) => !question.chunks.includes(item)), `${book.title}/${question.id} 干擾項不可是答案`);
        assert.equal(new Set(question.distractors).size, question.distractors.length, `${book.title}/${question.id} 干擾項文字不可互重複`);
      }
      assert.equal(new Set(answerChoiceIds(question)).size, question.chunks.length, `${book.title}/${question.id} 即使答案文字重複，各選項亦要有獨立 ID`);
    }
  }
  for (const question of book.pendingQuestions || []) {
    assert.equal(question.sourceVerified, false, `${book.title}/${question.id} pending 未第二人驗收前不可標 sourceVerified`);
    assert.ok(question.pdfPage >= 1 && question.bookPages?.length, `${book.title}/pending ${question.id} 頁碼有效`);
    assert.ok(question.image && fs.existsSync(path.join(root, question.image)), `${book.title}/pending ${question.id} 書頁資產存在（可暫借，但路徑要存在）`);
    assert.ok(question.sentence && question.chunks.length >= 2, `${book.title}/pending ${question.id} 原句與詞組完整`);
    assert.ok(sentenceChunksMatch(question), `${book.title}/pending ${question.id} 詞組須還原原句`);
    assert.ok(question.distractors.length >= 2 && question.distractors.length <= 4, `${book.title}/pending ${question.id} 干擾項數量`);
    assert.ok(question.distractorSource && question.reviewNote, `${book.title}/pending ${question.id} 須可追查`);
    assert.ok(question.distractors.every((item) => !question.chunks.includes(item)), `${book.title}/pending ${question.id} 干擾項不可是答案`);
  }
}
assert.ok(RED_SERIES_BOOKS.filter((book) => book.mode === 'preview').every((book) => (book.pendingQuestions || []).length > 0), '其餘預覽書須備妥 pendingQuestions');

assert.equal(normalizeSentence('爸爸一個橙。'), '爸爸一個橙');
const options = makeOptions(activeBook.questions[0], () => 0);
assert.equal(options.length, 8, '完整跨頁四組答案加四個干擾項');
assert.equal(new Set(options.map((choice) => choice.id)).size, options.length, '每個可拖選項有唯一身分');
const targetIds = answerChoiceIds(activeBook.questions[0]);
let placements = [null, null, null, null];
placements = placeNextChunk(placements, targetIds[1], targetIds);
placements = placeNextChunk(placements, targetIds[0], targetIds);
placements = placeNextChunk(placements, targetIds[2], targetIds);
placements = placeNextChunk(placements, targetIds[3], targetIds);
assert.deepEqual(placements, [targetIds[1], targetIds[0], targetIds[2], targetIds[3]], 'tap 只放入下一空格，保留作答次序');
assert.equal(isSentenceCorrect(placements, targetIds), false, '錯序不能判對');
placements = placeChunkAt(placements, targetIds[0], 0, targetIds);
assert.equal(isSentenceCorrect(placements, targetIds), true, '把錯序詞組移回正確槽後可完成');
placements = placeChunkAt(placements, targetIds[2], 0, targetIds);
assert.equal(isSentenceCorrect(placements, targetIds), false, '移動已放入詞組會保留被換出的詞，需再修正');
placements = placeChunkAt(placements, targetIds[0], 0, targetIds);
assert.equal(isSentenceCorrect(placements, targetIds), true, '再次調整可還原正確次序');
assert.deepEqual(removeChunkAt(placements, 0), [null, targetIds[1], targetIds[2], targetIds[3]], '點已填槽可清除重排');
placements = placeNextChunk(placements, targetIds[0], targetIds);
assert.equal(isSentenceCorrect(placements, targetIds), true, '修正後可答對');

const repeatedQuestion = { sentence: '吱，吱，吱，誰在叫？', chunks: ['吱', '吱', '吱', '誰在叫'], distractors: ['喵', '喵聲'] };
const repeatedIds = answerChoiceIds(repeatedQuestion);
assert.ok(sentenceChunksMatch(repeatedQuestion), '重複詞組同樣忠實還原原句');
assert.equal(new Set(makeOptions(repeatedQuestion).map((choice) => choice.id)).size, 6, '重複詞組文字仍可作不同選項');
assert.equal(isSentenceCorrect(repeatedIds, repeatedIds), true, '重複詞組可分別放入答案格');
const repeatedChunks = ['喵，', '喵，', '喵，', '誰在叫？', '鳥在叫。'];
const repeatedChoices = makeOptions({ chunks: repeatedChunks, distractors: [] }, () => 0.5);
const equivalentRepeatedOrder = ['answer-2', 'answer-0', 'answer-1', 'answer-3', 'answer-4'];
assert.equal(isSentenceCorrect(equivalentRepeatedOrder, answerChoiceIds({ chunks: repeatedChunks }), repeatedChoices, repeatedChunks), true, '畫面相同的重複詞組不應因內部卡片 ID 而誤判');
assert.equal(isSentenceCorrect(['answer-2', 'answer-0', 'answer-1', 'answer-4', 'answer-3'], answerChoiceIds({ chunks: repeatedChunks }), repeatedChoices, repeatedChunks), false, '重複詞組等價不可掩蓋其他詞組錯序');
assert.equal(makeOptions(callingSpread).length, 14, '《誰在叫》有十個原文詞組及四個干擾詞');
assert.equal(new Set(makeOptions(callingSpread).map((choice) => choice.id)).size, 14, '《誰在叫》重複詞仍各自可選');
assert.equal(addQuestionStars(0, 4, 10), 4);
assert.equal([4, 4, 2].reduce((stars, amount) => addQuestionStars(stars, amount, RED_SENTENCE_RULES.starCap), 0), 10);
assert.equal(addQuestionStars(10, 2, 10), 10, '星星不可超過 10');

assert.doesNotMatch(source, /words\[\(index\s*\*\s*2/);
assert.match(source, /item\.questions/);
assert.match(source, /placeNextChunk/);
assert.match(source, /placeChunkAt/);
assert.match(source, /scene\.sentence/);
assert.match(source, /kaka-red-book-game-v5/);
assert.match(source, /KakaStorage/);
assert.match(source, /roundGeneration/);
assert.match(source, /KakaStarFx/);
assert.match(source, /shootStars\(sceneStars, landStar\)/, '每一粒獎勵星星均要由 Ranger 發射');
assert.match(source, /usesGentleFlow/);
assert.match(source, /maybeAutoCompleteGentle/);
assert.match(source, /flow === RED_SENTENCE_RULES\.gentleFlow/);
assert.match(html, /聽本版句子/);
assert.match(html, /scene-study-sentence/);
assert.match(html, /scene-preview-note/);
assert.match(html, /《信》用開心簡化玩法/);
assert.equal(fs.readdirSync(path.join(root, 'assets/book-scenes/red-series-pages-hq')).filter((name) => !name.startsWith('.')).length, 33, 'HQ 原頁含新建信-p7、快跑呀-p3，以及分果果左頁裁切');
assert.ok(fs.existsSync(path.join(root, activeBook.questions[2].image)), '不完整右頁不得混入本題，使用已裁切左頁');
assert.ok(fs.existsSync(path.join(root, callingSpread.image)), '《誰在叫》實際故事跨頁圖片存在');

console.log('Book scene sentence-game tests passed');

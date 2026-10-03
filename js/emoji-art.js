/** 插圖層：把 emoji 轉成 OpenMoji SVG（風格統一，唔再跟住 iOS 版本變）。
 *
 *  設計原則：
 *  - `words.js` 嘅 `emoji` 欄位係唯一資料來源，687 條字詞一個字都唔使改。
 *  - 呢度只做「emoji 字元 → SVG 檔名」嘅對應，揾唔到就原樣輸出系統 emoji。
 *  - 純函數、無 state、無外部依賴；掛咗最壞情況都只係跌返用系統 emoji。
 *
 *  檔名規則：去走 VS16（U+FE0F）之後，逐個 codepoint 大寫 hex，用 `-` 連。
 *  例：🦌 → 1F98C.svg；🧑‍🚒 → 1F9D1-200D-1F692.svg；1️⃣ → 0031-20E3.svg
 */
(function () {
  'use strict';

  var BASE = './assets/openmoji/';
  var VS16 = /️/g;

  var segmenter = null;
  try {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    }
  } catch (err) {
    segmenter = null;
  }

  /** 把一串 emoji 拆做逐個圖形（ZWJ 序列、旗、keycap 都當一個）。 */
  function graphemes(str) {
    if (!str) return [];
    if (segmenter) {
      var out = [];
      var iter = segmenter.segment(str)[Symbol.iterator]();
      var step = iter.next();
      while (!step.done) {
        if (step.value.segment.trim()) out.push(step.value.segment);
        step = iter.next();
      }
      return out;
    }
    // 舊瀏覽器 fallback：整串當一個圖形（唔會拆錯 ZWJ 序列）
    return str.trim() ? [str] : [];
  }

  function codeName(grapheme) {
    var stripped = grapheme.replace(VS16, '');
    var codes = [];
    for (var i = 0; i < stripped.length; ) {
      var cp = stripped.codePointAt(i);
      codes.push(cp.toString(16).toUpperCase().padStart(4, '0'));
      i += cp > 0xffff ? 2 : 1;
    }
    return codes.join('-');
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /**
   * 回傳一段 HTML：每個圖形一張 <img>，載入失敗就自動換返系統 emoji。
   * @param {string} emoji  例如 '🦌' 或 '🦁🧑'
   * @param {string} [cls]  額外 class
   */
  function html(emoji, cls) {
    var parts = graphemes(emoji);
    if (!parts.length) return '';
    var extra = cls ? ' ' + cls : '';
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      var g = parts[i];
      var src = BASE + codeName(g) + '.svg';
      // onerror：圖唔見（例如將來加咗新 emoji 未補圖）就原地變返系統 emoji，唔會出現爛圖
      out +=
        '<img class="emoji-img' + extra + '" src="' + escapeAttr(src) + '" alt="" ' +
        'draggable="false" loading="lazy" decoding="async" ' +
        'onerror="window.KakaEmojiArt&amp;&amp;window.KakaEmojiArt.fallback(this)" ' +
        'data-emoji="' + escapeAttr(g) + '">';
    }
    return out;
  }

  /** <img> 載入失敗時，原地換返系統 emoji 文字。 */
  function fallback(img) {
    try {
      var span = document.createElement('span');
      span.className = 'emoji-text-fallback';
      span.textContent = img.getAttribute('data-emoji') || '';
      img.replaceWith(span);
    } catch (err) {
      /* 靜靜哋算數，總好過拋 error 拖冧成頁 */
    }
  }

  window.KakaEmojiArt = { html: html, fallback: fallback, graphemes: graphemes, codeName: codeName };
})();

/**
 * 獨立頁頂欄返回：有同站 history 就返一層，否則去指定上一層畫面。
 * 唔好用裸 index.html——會重載跌去揀小朋友／主頁。
 */
(function (global) {
  'use strict';

  function sameOriginReferrer() {
    try {
      const ref = document.referrer;
      if (!ref) return null;
      const url = new URL(ref, location.href);
      if (url.origin !== location.origin) return null;
      return url;
    } catch {
      return null;
    }
  }

  function canHistoryBack() {
    return !!sameOriginReferrer();
  }

  function goBackOr(fallbackHref) {
    if (canHistoryBack()) {
      history.back();
      return;
    }
    location.assign(fallbackHref);
  }

  function bindBackLink(el, fallbackHref) {
    if (!el) return;
    el.addEventListener('click', (event) => {
      event.preventDefault();
      goBackOr(fallbackHref);
    });
  }

  global.KakaNav = {
    sameOriginReferrer,
    canHistoryBack,
    goBackOr,
    bindBackLink,
  };
})(window);

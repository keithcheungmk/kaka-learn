/* 卡卡學習：鎖死頁面放大。iPad 妙控鍵盤 pinch 會變成 ctrl+wheel。 */
(function lockKakaPageZoom() {
  const block = (ev) => {
    ev.preventDefault();
  };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
    document.addEventListener(type, block, { passive: false });
  });
  document.addEventListener(
    'wheel',
    (ev) => {
      if (ev.ctrlKey) ev.preventDefault();
    },
    { passive: false },
  );
})();

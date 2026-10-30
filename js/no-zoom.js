/* 卡卡學習：鎖死頁面放大。
 * 螢幕兩指：gesture / multi-touch。
 * 妙控鍵盤觸控板 pinch：Safari 多數當 ctrl+wheel；有時喺 window 捕獲先擋到。
 * 若仍然放大：visualViewport.scale ≠ 1 就重置 viewport meta。
 */
(function lockKakaPageZoom() {
  const opts = { capture: true, passive: false };
  const prevent = (ev) => {
    ev.preventDefault();
  };

  ['gesturestart', 'gesturechange', 'gestureend'].forEach((type) => {
    window.addEventListener(type, prevent, opts);
    document.addEventListener(type, prevent, opts);
  });

  const onWheel = (ev) => {
    if (ev.ctrlKey || ev.metaKey) ev.preventDefault();
  };
  window.addEventListener('wheel', onWheel, opts);
  document.addEventListener('wheel', onWheel, opts);

  window.addEventListener(
    'keydown',
    (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === '+' || ev.key === '-' || ev.key === '=' || ev.key === '0')) {
        ev.preventDefault();
      }
    },
    opts,
  );

  window.addEventListener(
    'touchmove',
    (ev) => {
      if ((ev.touches && ev.touches.length > 1) || (typeof ev.scale === 'number' && ev.scale !== 1)) {
        ev.preventDefault();
      }
    },
    opts,
  );

  const VP =
    'width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover, shrink-to-fit=no';

  function viewportMeta() {
    return document.querySelector('meta[name="viewport"]');
  }

  function resetViewportScale() {
    const meta = viewportMeta();
    if (!meta) return;
    meta.setAttribute('content', `${VP}, maximum-scale=1.01`);
    window.setTimeout(() => {
      meta.setAttribute('content', VP);
    }, 40);
  }

  function onVisualViewportChange() {
    const vv = window.visualViewport;
    if (!vv) return;
    if (Math.abs((vv.scale || 1) - 1) > 0.02) resetViewportScale();
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onVisualViewportChange);
    window.visualViewport.addEventListener('scroll', onVisualViewportChange);
  }
})();

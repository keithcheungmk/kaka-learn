/**
 * GitHub Pages 新版本檢查。
 * 發現新版本只會喺安全畫面 reload，唔會中途打斷學習卡或遊戲。
 */
(function () {
  const CHECK_EVERY_MS = 5 * 60 * 1000;
  const FIRST_CHECK_DELAY_MS = 15 * 1000;
  const SAFE_SCREEN_IDS = new Set([
    'screen-profiles',
    'screen-home',
    'screen-progress',
    'screen-topics',
    'screen-books',
  ]);

  const script = document.currentScript;
  const currentVersion = (() => {
    try {
      return new URL(script?.src || '', window.location.href).searchParams.get('v') || '';
    } catch {
      return '';
    }
  })();

  let updatePending = false;
  let checking = false;

  function activeScreenIsSafe() {
    const active = document.querySelector('.screen.active');
    return !!active && SAFE_SCREEN_IDS.has(active.id);
  }

  function reloadIfSafe() {
    if (!updatePending || document.visibilityState !== 'visible' || !activeScreenIsSafe()) return false;
    window.location.reload();
    return true;
  }

  async function checkForUpdate() {
    if (checking || document.visibilityState !== 'visible') return;
    checking = true;
    try {
      const response = await fetch('./version.json', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = await response.json();
      const latest = typeof payload?.version === 'string' ? payload.version.trim() : '';
      if (currentVersion && latest && latest !== currentVersion) {
        updatePending = true;
        reloadIfSafe();
      }
    } catch {
      // 離線／GitHub Pages 暫時未更新完成：下一輪再試。
    } finally {
      checking = false;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!reloadIfSafe()) checkForUpdate();
  });
  window.addEventListener('online', checkForUpdate);

  const app = document.querySelector('#app');
  if (app) {
    new MutationObserver(() => reloadIfSafe()).observe(app, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  window.setTimeout(checkForUpdate, FIRST_CHECK_DELAY_MS);
  window.setInterval(checkForUpdate, CHECK_EVERY_MS);
})();

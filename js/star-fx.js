/**
 * 太空戰士星星飛行 — 答啱時由 ranger 射去星星條
 */
(function () {
  const PLAY_IDS = new Set([
    'screen-listen',
    'screen-match',
    'screen-build',
    'screen-phonics-listen',
    'screen-phonics-match',
    'screen-phonics-build',
    'screen-math-count',
    'screen-math-compare',
    'screen-math-size',
    'screen-math-time',
  ]);

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function ensureSpaceRanger(screen) {
    if (!screen || !PLAY_IDS.has(screen.id)) return null;
    let el = screen.querySelector('.space-ranger');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'space-ranger';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<img src="./assets/space-ranger-badge.png" alt="" width="72" height="72" decoding="async" />';
    screen.appendChild(el);
    return el;
  }

  /** 數理玩法頁：header 加一粒星做飛行目標 */
  function ensureMathStarTarget(screen, countText) {
    const header = screen?.querySelector('.game-header');
    if (!header) return null;
    let slot = header.querySelector('.math-star-target');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'math-star-target star-panel';
      slot.setAttribute('aria-hidden', 'true');
      slot.innerHTML = '<span class="star-icon">★</span><strong class="math-star-target-count">0/10</strong>';
      header.appendChild(slot);
    }
    if (countText != null) {
      const n = slot.querySelector('.math-star-target-count');
      if (n) n.textContent = countText;
    }
    return slot.querySelector('.star-icon') || slot;
  }

  function resolveTarget(screen) {
    if (!screen) return null;
    const cell = screen.querySelector('.star-bar .star-cell:not(.is-on)');
    if (cell) return cell;
    const mathIcon = screen.querySelector('.math-star-target .star-icon');
    if (mathIcon) return mathIcon;
    const panelStar = screen.querySelector('.star-panel .star-icon');
    if (panelStar) return panelStar;
    return screen.querySelector('.game-header .progress-pill');
  }

  function flyStar(fromEl, toEl, onLanded) {
    if (prefersReducedMotion() || !fromEl || !toEl) {
      onLanded?.();
      return Promise.resolve();
    }
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const star = document.createElement('div');
    star.className = 'fly-star';
    star.textContent = '★';
    star.setAttribute('aria-hidden', 'true');
    star.style.left = `${a.left + a.width / 2}px`;
    star.style.top = `${a.top + a.height / 2}px`;
    document.body.appendChild(star);

    fromEl.classList.remove('space-ranger-shoot');
    void fromEl.offsetWidth;
    fromEl.classList.add('space-ranger-shoot');

    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const anim = star.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.35)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.35)', opacity: 1, offset: 0.14 },
        {
          transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55 - 40}px)) scale(1.05)`,
          opacity: 1,
          offset: 0.58,
        },
        {
          transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.42)`,
          opacity: 0.95,
        },
      ],
      { duration: 680, easing: 'cubic-bezier(.25,.8,.35,1)' },
    );

    return new Promise((resolve) => {
      let landed = false;
      const land = () => {
        if (landed) return;
        landed = true;
        star.remove();
        fromEl.classList.remove('space-ranger-shoot');
        toEl.classList.remove('star-target-hit');
        void toEl.offsetWidth;
        toEl.classList.add('star-target-hit');
        onLanded?.();
        resolve();
      };
      anim.onfinish = land;
      setTimeout(land, 960);
    });
  }

  function flyStarFromRanger(screen, onLanded) {
    const el = screen?.id ? screen : screen?.closest?.('.screen');
    if (!el) {
      onLanded?.();
      return Promise.resolve();
    }
    const ranger = ensureSpaceRanger(el);
    const target = resolveTarget(el);
    if (!ranger || !target) {
      onLanded?.();
      return Promise.resolve();
    }
    return flyStar(ranger, target, onLanded);
  }

  function mountPlayScreen(screen) {
    if (!screen) return;
    ensureSpaceRanger(screen);
  }

  window.KakaStarFx = {
    PLAY_IDS,
    ensureSpaceRanger,
    ensureMathStarTarget,
    flyStarFromRanger,
    flyStar,
    mountPlayScreen,
  };
})();

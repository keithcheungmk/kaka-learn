/**
 * 太空戰士星星飛行 — 答啱時由 ranger 拳頭射去星星條（KAKA RANGER solo）
 */
(function () {
  const FLY_DURATION_MS = 1050;
  const FLY_FALLBACK_MS = 1200;
  const MUZZLE_BURST_MS = 120;
  const POSE_SWAP_MS = 550; // 同 rangerShoot keyframe 對齊，答啱一刻換 pose 嘅顯示時間

  /**
   * 2026-09-02：由「精準對住握拳」簡化做「身中心固定點」——因為答啱一刻會隨機換
   * 4 張唔同動作嘅 pose（握拳唔一定喺度），逐張校準發射點成本太高，
   * 改用一個對大部分 pose 都夠合理嘅中心點。詳情見 docs/handover.md。
   *
   * 2026-09-03：人物朝右係 CSS `transform: scaleX(-1)` 加喺 **img**，container
   * 唔翻。MUZZLE_ANCHOR 用 container 中心，getBoundingClientRect 唔受 img mirror 影響。
   */
  const MUZZLE_ANCHOR = { x: 0.5, y: 0.52 };

  const DEFAULT_POSE = './assets/space-ranger-shooter.png';
  const SHOOT_POSES = [
    './assets/space-ranger-pose-fistpump.png',
    './assets/space-ranger-pose-point.png',
    './assets/space-ranger-pose-thumbsup.png',
    './assets/space-ranger-pose-wave.png',
  ];

  const PLAY_IDS = new Set([
    'screen-listen',
    'screen-match',
    'screen-build',
    'screen-phonics-listen',
    'screen-phonics-match',
    'screen-phonics-build',
    'screen-math-count',
    'screen-math-compare',
    'screen-math-earth-game',
    'screen-math-time',
  ]);

  let globalRanger = null;

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function cleanupLegacyRangers() {
    document.querySelectorAll('.screen .space-ranger').forEach((el) => el.remove());
  }

  function getGlobalRanger() {
    if (globalRanger) return globalRanger;
    cleanupLegacyRangers();
    globalRanger = document.createElement('div');
    globalRanger.className = 'space-ranger';
    globalRanger.setAttribute('aria-hidden', 'true');
    globalRanger.innerHTML =
      `<img class="space-ranger-img" src="${DEFAULT_POSE}" alt="" width="144" height="144" decoding="async" />` +
      '<span class="space-ranger-sparkle s1"></span>' +
      '<span class="space-ranger-sparkle s2"></span>' +
      '<span class="space-ranger-sparkle s3"></span>';
    document.body.appendChild(globalRanger);
    return globalRanger;
  }

  let poseResetTimer = null;

  function flashRandomPose(rangerEl) {
    const img = rangerEl?.querySelector('.space-ranger-img');
    if (!img) return;
    if (poseResetTimer) clearTimeout(poseResetTimer);
    const pick = SHOOT_POSES[Math.floor(Math.random() * SHOOT_POSES.length)];
    img.src = pick;
    poseResetTimer = setTimeout(() => {
      img.src = DEFAULT_POSE;
      poseResetTimer = null;
    }, POSE_SWAP_MS);
  }

  function getRangerMuzzle(el) {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + r.width * MUZZLE_ANCHOR.x,
      y: r.top + r.height * MUZZLE_ANCHOR.y,
    };
  }

  function showRangerFor(screen) {
    if (!screen || !PLAY_IDS.has(screen.id)) return null;
    const ranger = getGlobalRanger();
    ranger.dataset.rangerScreen = screen.id;
    ranger.classList.add('space-ranger--visible');
    return ranger;
  }

  function hideRanger() {
    globalRanger?.classList.remove(
      'space-ranger--visible',
      'space-ranger-shoot',
      'space-ranger-laser-flash',
    );
    if (globalRanger) delete globalRanger.dataset.rangerScreen;
    if (poseResetTimer) {
      clearTimeout(poseResetTimer);
      poseResetTimer = null;
    }
    const img = globalRanger?.querySelector('.space-ranger-img');
    if (img) img.src = DEFAULT_POSE;
  }

  function ensureSpaceRanger(screen) {
    if (!screen || !PLAY_IDS.has(screen.id)) return null;
    return showRangerFor(screen);
  }

  function ensureMathStarTarget(screen, countText) {
    const header = screen?.querySelector('.game-header');
    if (!header) return null;
    let slot = header.querySelector('.math-star-target');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'math-star-target star-panel';
      slot.setAttribute('aria-hidden', 'true');
      slot.innerHTML =
        '<span class="star-icon">★</span><strong class="math-star-target-count">0/10</strong>';
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

  function buildFlyKeyframes(dx, dy) {
    return [
      { transform: 'translate(-50%, -50%) scale(0.25)', opacity: 0, offset: 0 },
      { transform: 'translate(-50%, -50%) scale(0.25)', opacity: 0, offset: MUZZLE_BURST_MS / FLY_DURATION_MS },
      { transform: 'translate(-50%, -50%) scale(1.55)', opacity: 1, offset: 0.14 },
      {
        transform: `translate(calc(-50% + ${dx * 0.35}px), calc(-50% + ${dy * 0.35 - 28}px)) scale(1.35)`,
        opacity: 1,
        offset: 0.34,
      },
      {
        transform: `translate(calc(-50% + ${dx * 0.55}px), calc(-50% + ${dy * 0.55 - 48}px)) scale(1.2)`,
        opacity: 1,
        offset: 0.54,
      },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.55)`,
        opacity: 1,
      },
    ];
  }

  function flyStar(fromPoint, toEl, rangerEl, onLanded) {
    if (prefersReducedMotion() || !fromPoint || !toEl) {
      onLanded?.();
      return Promise.resolve();
    }
    const originX = fromPoint.x;
    const originY = fromPoint.y;
    const b = toEl.getBoundingClientRect();
    const dx = b.left + b.width / 2 - originX;
    const dy = b.top + b.height / 2 - originY;
    const keyframes = buildFlyKeyframes(dx, dy);
    const easing = 'cubic-bezier(.22,.75,.28,1)';

    const starImg = '<img src="./assets/kaka-ranger-star.png" alt="" decoding="async" />';

    const star = document.createElement('div');
    star.className = 'fly-star';
    star.innerHTML = starImg;
    star.setAttribute('aria-hidden', 'true');
    star.style.left = `${originX}px`;
    star.style.top = `${originY}px`;
    document.body.appendChild(star);

    const trail = document.createElement('div');
    trail.className = 'fly-star fly-star-trail';
    trail.innerHTML = starImg;
    trail.setAttribute('aria-hidden', 'true');
    trail.style.left = `${originX}px`;
    trail.style.top = `${originY}px`;
    document.body.appendChild(trail);

    if (rangerEl) {
      rangerEl.classList.remove('space-ranger-shoot', 'space-ranger-laser-flash');
      void rangerEl.offsetWidth;
      rangerEl.classList.add('space-ranger-shoot', 'space-ranger-laser-flash');
      flashRandomPose(rangerEl);
    }

    const anim = star.animate(keyframes, { duration: FLY_DURATION_MS, easing });
    const trailAnim = trail.animate(keyframes, {
      duration: FLY_DURATION_MS,
      easing,
      delay: MUZZLE_BURST_MS + 80,
    });

    return new Promise((resolve) => {
      let landed = false;
      const land = () => {
        if (landed) return;
        landed = true;
        star.remove();
        trail.remove();
        rangerEl?.classList.remove('space-ranger-shoot', 'space-ranger-laser-flash');
        toEl.classList.remove('star-target-hit');
        void toEl.offsetWidth;
        toEl.classList.add('star-target-hit');
        onLanded?.();
        resolve();
      };
      anim.onfinish = land;
      trailAnim.onfinish = () => trail.remove();
      setTimeout(land, FLY_FALLBACK_MS);
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
    const muzzle = getRangerMuzzle(ranger);
    return flyStar(muzzle, target, ranger, onLanded);
  }

  function mountPlayScreen(screen) {
    if (!screen) {
      hideRanger();
      return;
    }
    if (PLAY_IDS.has(screen.id)) showRangerFor(screen);
    else hideRanger();
  }

  window.KakaStarFx = {
    PLAY_IDS,
    FLY_DURATION_MS,
    MUZZLE_ANCHOR,
    ensureSpaceRanger,
    ensureMathStarTarget,
    flyStarFromRanger,
    flyStar,
    mountPlayScreen,
    hideRanger,
    showRangerFor,
    getRangerMuzzle,
  };
})();

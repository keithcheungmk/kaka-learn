/**
 * 完成遊戲獎勵：重用太空戰士慶祝 pose 同星星圖，先播動畫＋粵語，之後先出再玩掣。
 */
(function () {
  const LINE = '你好叻啊，完成咗啦，獎勵你一個金幣！';
  const ANIM_MS = 900;
  const ACTIONS_SEL = '.btn-row, .play-finish-actions, .finish-actions, [data-celebrate-actions]';
  let token = 0;
  let active = null;

  function speechApi() {
    return window.KakaSpeech || {};
  }

  function isMuted(explicit) {
    if (explicit != null) return Boolean(explicit);
    return Boolean(window.KakaStorage?.loadState?.()?.muted);
  }

  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  function asset(name) {
    const tagged = document.querySelector(`img[src*="${name}"]`);
    if (tagged) return tagged.getAttribute('src') || tagged.src;
    const script = [...document.scripts].find((el) => /celebrate-finish\.js/.test(el.src || ''));
    if (script?.src) return script.src.replace(/js\/celebrate-finish\.js[^/]*$/, `assets/${name}`);
    return `assets/${name}`;
  }

  function ensureOverlay() {
    let el = document.getElementById('kaka-celebrate');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'kaka-celebrate';
    el.className = 'play-finish kaka-celebrate-overlay';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'kaka-celebrate-line');
    el.innerHTML =
      '<div class="play-finish-inner">' +
        '<div class="play-finish-star kaka-celebrate-stage" aria-hidden="true">' +
          '<span class="kaka-celebrate-sparkles"></span>' +
          `<img class="kaka-celebrate-ranger" src="${asset('kaka-ranger-celebrate.png')}" alt="" width="235" height="305" decoding="async" />` +
        '</div>' +
        `<p id="kaka-celebrate-line">${LINE}</p>` +
        '<button type="button" class="kaka-celebrate-skip">跳過</button>' +
      '</div>';
    document.body.appendChild(el);
    return el;
  }

  function sparkleHtml() {
    const src = asset('kaka-ranger-star.png');
    return [1, 2, 3, 4, 5].map((n) =>
      `<span class="kaka-celebrate-sparkle s${n}" style="background-image:url('${src}')"></span>`
    ).join('');
  }

  function prepareSparkles(root) {
    const host =
      root.querySelector('.play-finish-star') ||
      root.querySelector('.celebrate') ||
      root.querySelector('.kaka-celebrate-stage') ||
      root;
    if (!host.querySelector('.kaka-celebrate-sparkles')) {
      const wrap = document.createElement('span');
      wrap.className = 'kaka-celebrate-sparkles';
      wrap.setAttribute('aria-hidden', 'true');
      host.insertBefore(wrap, host.firstChild);
    }
    const box = host.querySelector('.kaka-celebrate-sparkles');
    if (box) box.innerHTML = sparkleHtml();
    host.classList.add('kaka-celebrate-stage');
  }

  function ensureSkip(root) {
    let skip = root.querySelector('.kaka-celebrate-skip');
    if (skip) return skip;
    skip = document.createElement('button');
    skip.type = 'button';
    skip.className = 'kaka-celebrate-skip';
    skip.textContent = '跳過';
    const inner = root.querySelector('.play-finish-inner') || root.querySelector('.celebrate') || root;
    const actions = inner.querySelector(ACTIONS_SEL);
    if (actions) inner.insertBefore(skip, actions);
    else inner.appendChild(skip);
    return skip;
  }

  function resolveActions(root, extra) {
    const found = [...root.querySelectorAll(ACTIONS_SEL)];
    if (extra) {
      const list = extra.nodeType ? [extra] : Array.from(extra);
      list.forEach((node) => {
        if (node && !found.includes(node)) found.push(node);
      });
    }
    return found;
  }

  function setActionHidden(el, hide, insideRoot) {
    if (!el) return;
    if (hide) el.setAttribute('aria-hidden', 'true');
    else el.removeAttribute('aria-hidden');
    if (insideRoot) return;
    el.hidden = hide;
    el.classList.toggle('hidden', hide);
  }

  function finishActive(session) {
    if (!session || session.done) return;
    session.done = true;
    if (session.timer) clearTimeout(session.timer);
    session.root.classList.remove('kaka-celebrate-waiting', 'kaka-celebrate-play');
    if (session.skip) session.skip.hidden = true;
    session.actions.forEach((el) => setActionHidden(el, false, session.root.contains(el)));
    if (session.global) session.root.hidden = true;
    if (active === session) active = null;
    session.resolve();
  }

  /**
   * @param {{ root?: HTMLElement, actions?: HTMLElement|HTMLElement[], muted?: boolean, global?: boolean }} [opts]
   * @returns {Promise<void>}
   */
  function play(opts = {}) {
    token += 1;
    const gen = token;
    if (active) finishActive(active);

    const global = !opts.root || Boolean(opts.global);
    const root = opts.root || ensureOverlay();
    const actions = resolveActions(root, opts.actions);
    const skip = ensureSkip(root);
    prepareSparkles(root);

    if (global && root.id === 'kaka-celebrate') root.hidden = false;

    root.classList.remove('kaka-celebrate-play');
    void root.offsetWidth;
    root.classList.add('kaka-celebrate-waiting', 'kaka-celebrate-play');
    skip.hidden = false;
    actions.forEach((el) => setActionHidden(el, true, root.contains(el)));

    return new Promise((resolve) => {
      const session = {
        gen,
        root,
        actions,
        skip,
        global: global && root.id === 'kaka-celebrate',
        done: false,
        timer: null,
        resolve,
      };
      active = session;

      const reveal = () => {
        if (gen !== token) return;
        finishActive(session);
      };

      skip.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        speechApi().cancelAllSpeech?.();
        reveal();
      };

      const muted = isMuted(opts.muted);
      speechApi().playStarCue?.({ muted });
      speechApi().playCoinHintCue?.({ muted });

      const reduced = prefersReducedMotion();
      const animWait = reduced ? 350 : ANIM_MS;
      const speakWait = muted ? 0 : (speechApi().estimateSpeakMs?.(LINE, { rate: 0.92, delayMs: 160 }) || 4200);
      session.timer = setTimeout(reveal, Math.max(animWait, speakWait) + 80);

      speechApi().speakTerm?.(LINE, {
        muted,
        rate: 0.92,
        pitch: 1.08,
        delayMs: 160,
        onEnd: () => {
          if (gen !== token || muted) return;
          const remain = reduced ? 0 : Math.max(0, ANIM_MS - 200);
          setTimeout(reveal, remain);
        },
      });
    });
  }

  function hide() {
    token += 1;
    if (active) finishActive(active);
    const overlay = document.getElementById('kaka-celebrate');
    if (overlay) overlay.hidden = true;
  }

  window.KakaCelebrate = {
    LINE,
    play,
    hide,
  };
})();

/** 數理 Montessori 操作層 — 原生 emoji 拖放／撳放（唔用 OpenMoji）。 */
(function () {
  const MATH_EMOJI_SETS = {
    energy: ['⭐', '💎', '🔥'],
    food: ['🍎', '🍓', '🍪', '🍌'],
    animals: ['🐶', '🐱', '🐰', '🐸'],
    cargo: ['📦', '⚙️', '🔧'],
    garden: ['🌱', '🌸', '🍄'],
    treasure: ['🪙', '💎', '🎁'],
  };

  let nextId = 1;

  function pickEmoji(setName, random = Math.random) {
    const list = MATH_EMOJI_SETS[setName] || MATH_EMOJI_SETS.energy;
    return list[Math.floor(random() * list.length)];
  }

  /** 純資料：生成槽位板 spec（available >= target + 2） */
  function createBoard({ target, available, emoji, emojiSet = 'energy', random = Math.random } = {}) {
    const t = Math.max(0, Math.min(10, Math.floor(Number(target) || 0)));
    const minAvailable = t + 2;
    const a = Math.max(minAvailable, Math.floor(Number(available) || minAvailable));
    const chosen = emoji || pickEmoji(emojiSet, random);
    const pieces = [];
    for (let i = 0; i < a; i += 1) {
      pieces.push({ id: `m-${nextId++}`, emoji: chosen });
    }
    return {
      target: t,
      available: a,
      emoji: chosen,
      pieces,
      slots: Array.from({ length: t }, (_, i) => ({ index: i, filled: null })),
    };
  }

  /** 純狀態機（供測試同 DOM 共用） */
  function createBoardState(spec) {
    const target = spec.target;
    const slots = Array.from({ length: target }, () => null);
    const pool = spec.pieces.map((p) => p.id);
    const pieceById = new Map(spec.pieces.map((p) => [p.id, p]));

    function filledCount() {
      return slots.filter(Boolean).length;
    }

    function firstEmptyIndex() {
      return slots.findIndex((s) => s === null);
    }

    function placeFromPool(manipId) {
      if (!pool.includes(manipId)) return { ok: false, reason: 'not-in-pool' };
      const idx = firstEmptyIndex();
      if (idx < 0) return { ok: false, reason: 'full' };
      pool.splice(pool.indexOf(manipId), 1);
      slots[idx] = manipId;
      const count = filledCount();
      return {
        ok: true,
        slotIndex: idx,
        count,
        complete: count === target,
      };
    }

    function returnToPool(manipId) {
      const idx = slots.indexOf(manipId);
      if (idx < 0) return { ok: false, reason: 'not-in-slot' };
      slots[idx] = null;
      if (!pool.includes(manipId)) pool.push(manipId);
      return { ok: true, slotIndex: idx, count: filledCount() };
    }

    function locate(manipId) {
      if (pool.includes(manipId)) return { home: 'pool' };
      const idx = slots.indexOf(manipId);
      if (idx >= 0) return { home: 'slot', slotIndex: idx };
      return { home: 'none' };
    }

    return {
      spec,
      target,
      slots,
      pool,
      pieceById,
      filledCount,
      firstEmptyIndex,
      placeFromPool,
      returnToPool,
      locate,
    };
  }

  function prefersReducedMotion() {
    try {
      return !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    } catch {
      return false;
    }
  }

  function createManipulative(piece, { reducedMotion } = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'math-manipulative';
    btn.dataset.manipId = piece.id;
    btn.setAttribute('aria-label', '能源');
    const span = document.createElement('span');
    span.className = 'math-native-emoji';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = piece.emoji;
    btn.appendChild(span);
    if (reducedMotion) btn.classList.add('is-reduced-motion');
    return btn;
  }

  function animateReturn(el, reducedMotion, onDone) {
    if (!el || reducedMotion) {
      onDone?.();
      return;
    }
    el.classList.add('is-returning');
    const done = () => {
      el.classList.remove('is-returning');
      onDone?.();
    };
    el.addEventListener('animationend', done, { once: true });
    setTimeout(done, 400);
  }

  function animateSnap(el, reducedMotion) {
    if (!el) return;
    el.classList.remove('is-snapping');
    void el.offsetWidth;
    el.classList.add('is-snapping');
    if (reducedMotion) return;
    el.addEventListener(
      'animationend',
      () => el.classList.remove('is-snapping'),
      { once: true },
    );
  }

  /**
   * 掛載槽位板：slotsEl 放 target 個槽；poolEl 放 available 粒物件。
   * callbacks: onPlace({ count }), onReturn(), onComplete({ moves, incorrectDrops }), speakCount(n)
   */
  function mountSlotBoard(container, options) {
    const {
      target,
      available,
      emoji,
      emojiSet = 'energy',
      onPlace,
      onReturn,
      onComplete,
      onInvalidDrop,
      speakCount,
      reducedMotion = prefersReducedMotion(),
    } = options || {};

    if (!container) throw new Error('KakaMathManipulatives: container required');

    const spec = createBoard({ target, available, emoji, emojiSet });
    const state = createBoardState(spec);
    let busy = false;
    let dragState = null;
    let moves = 0;
    let incorrectDrops = 0;
    const elById = new Map();

    container.innerHTML = '';
    const slotsWrap = document.createElement('div');
    slotsWrap.className = 'math-slot-board';
    const poolWrap = document.createElement('div');
    poolWrap.className = 'math-manip-pool';
    poolWrap.dataset.role = 'pool';

    const slotEls = [];
    for (let i = 0; i < state.target; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'math-slot is-empty';
      cell.dataset.slotIndex = String(i);
      slotsWrap.appendChild(cell);
      slotEls.push(cell);
    }

    spec.pieces.forEach((piece) => {
      const btn = createManipulative(piece, { reducedMotion });
      elById.set(piece.id, btn);
      poolWrap.appendChild(btn);
    });

    container.append(slotsWrap, poolWrap);

    function syncNextHint() {
      slotEls.forEach((c) => c.classList.remove('is-next'));
      const idx = state.firstEmptyIndex();
      if (idx >= 0 && state.filledCount() < state.target) {
        slotEls[idx]?.classList.add('is-next');
      }
    }

    function refreshSlotClasses() {
      slotEls.forEach((cell, i) => {
        const filled = !!state.slots[i];
        cell.classList.toggle('is-empty', !filled);
        cell.classList.toggle('is-filled', filled);
      });
      syncNextHint();
    }

    function appendToPool(btn) {
      poolWrap.appendChild(btn);
    }

    function appendToSlot(btn, slotIndex) {
      const cell = slotEls[slotIndex];
      if (!cell) return;
      cell.appendChild(btn);
      animateSnap(btn, reducedMotion);
    }

    function tryComplete() {
      if (state.filledCount() !== state.target) return;
      busy = true;
      onComplete?.({ moves, incorrectDrops, count: state.filledCount() });
    }

    function handlePlace(manipId, fromDemo = false) {
      if (busy) return { ok: false };
      const result = state.placeFromPool(manipId);
      if (!result.ok) {
        if (result.reason === 'full') incorrectDrops += 1;
        return result;
      }
      if (!fromDemo) moves += 1;
      const btn = elById.get(manipId);
      if (btn) appendToSlot(btn, result.slotIndex);
      refreshSlotClasses();
      speakCount?.(result.count);
      onPlace?.({ count: result.count, slotIndex: result.slotIndex });
      if (result.complete) tryComplete();
      return result;
    }

    function handleReturn(manipId) {
      if (busy) return { ok: false };
      const result = state.returnToPool(manipId);
      if (!result.ok) return result;
      moves += 1;
      const btn = elById.get(manipId);
      if (btn) appendToPool(btn);
      refreshSlotClasses();
      onReturn?.({ count: result.count });
      return result;
    }

    function onManipClick(btn, manipId) {
      if (busy || dragState) return;
      const loc = state.locate(manipId);
      if (loc.home === 'pool') {
        const r = handlePlace(manipId);
        if (!r.ok && r.reason === 'full') {
          incorrectDrops += 1;
          onInvalidDrop?.({ incorrectDrops, reason: 'full' });
          animateReturn(btn, reducedMotion);
        }
      } else if (loc.home === 'slot') {
        handleReturn(manipId);
      }
    }

    function bindManip(btn, manipId) {
      btn.addEventListener('click', (e) => {
        if (dragState?.moved) return;
        e.preventDefault();
        onManipClick(btn, manipId);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onManipClick(btn, manipId);
      });
      btn.addEventListener('pointerdown', (e) => {
        if (busy || btn.dataset.draggable === '0') return;
        e.preventDefault();
        dragState = {
          el: btn,
          manipId,
          pointerId: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          moved: false,
          ghost: null,
          fromPool: state.pool.includes(manipId),
          fromSlot: state.locate(manipId).slotIndex,
        };
        btn.setPointerCapture(e.pointerId);
        btn.classList.add('is-dragging');

        const onMove = (ev) => {
          if (Math.hypot(ev.clientX - dragState.x, ev.clientY - dragState.y) < 8) return;
          dragState.moved = true;
          if (!dragState.ghost) {
            const r = btn.getBoundingClientRect();
            const g = btn.cloneNode(true);
            g.className = 'math-manipulative is-flying';
            g.style.cssText = `position:fixed;z-index:60;width:${r.width}px;height:${r.height}px;left:${r.left}px;top:${r.top}px;pointer-events:none;`;
            document.body.appendChild(g);
            dragState.ghost = g;
          }
          dragState.ghost.style.left = `${ev.clientX - dragState.ghost.offsetWidth / 2}px`;
          dragState.ghost.style.top = `${ev.clientY - dragState.ghost.offsetHeight / 2}px`;
        };

        const onUp = (ev) => {
          btn.releasePointerCapture(ev.pointerId);
          btn.classList.remove('is-dragging');
          btn.removeEventListener('pointermove', onMove);
          btn.removeEventListener('pointerup', onUp);
          dragState.ghost?.remove();
          const ds = dragState;
          dragState = null;
          if (!ds.moved) return;

          const targetEl = document.elementFromPoint(ev.clientX, ev.clientY);
          const slotCell = targetEl?.closest?.('.math-slot');
          const hitPool = targetEl?.closest?.('[data-role="pool"]');

          if (slotCell && slotCell.classList.contains('is-empty') && ds.fromPool) {
            handlePlace(ds.manipId);
          } else if (hitPool && ds.fromSlot != null && ds.fromSlot >= 0) {
            handleReturn(ds.manipId);
          } else if (ds.fromPool) {
            incorrectDrops += 1;
            onInvalidDrop?.({ incorrectDrops, reason: 'invalid-target' });
            animateReturn(btn, reducedMotion);
          }
        };

        btn.addEventListener('pointermove', onMove);
        btn.addEventListener('pointerup', onUp);
      });
    }

    spec.pieces.forEach((piece) => {
      const btn = elById.get(piece.id);
      bindManip(btn, piece.id);
    });

    refreshSlotClasses();

    return {
      spec,
      state,
      destroy() {
        container.innerHTML = '';
        dragState = null;
        busy = false;
      },
      setBusy(value) {
        busy = !!value;
      },
      highlightEmptySlots() {
        slotEls.forEach((c) => {
          if (c.classList.contains('is-empty')) c.classList.add('is-hint-glow');
        });
      },
      clearHints() {
        slotEls.forEach((c) => c.classList.remove('is-hint-glow'));
      },
      /** 第三級提示：示範移一件（唔自動填滿） */
      demoOneMove() {
        if (busy || state.filledCount() >= state.target) return false;
        const id = state.pool[0];
        if (!id) return false;
        handlePlace(id, true);
        return true;
      },
      getStats() {
        return { moves, incorrectDrops, filled: state.filledCount() };
      },
    };
  }

  window.KakaMathManipulatives = {
    MATH_EMOJI_SETS,
    pickEmoji,
    createBoard,
    createBoardState,
    createManipulative,
    mountSlotBoard,
    prefersReducedMotion,
  };
})();

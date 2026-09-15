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

  function createManipulative(piece, { reducedMotion, label = '物件' } = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'math-manipulative';
    btn.dataset.manipId = piece.id;
    btn.setAttribute('aria-label', label);
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
      slotCount: slotCountOpt,
      lockedIndices = [],
      startFilled = 0,
      mode = 'fill',
      emoji,
      emojiSet = 'energy',
      pieceLabel = '物件',
      onPlace,
      onReturn,
      onComplete,
      onInvalidDrop,
      speakCount,
      reducedMotion = prefersReducedMotion(),
    } = options || {};

    if (!container) throw new Error('KakaMathManipulatives: container required');

    const slotsTotal = slotCountOpt ?? target;
    const completionTarget = target;
    const spec = createBoard({ target: slotsTotal, available, emoji, emojiSet });
    const state = createBoardState(spec);
    const locked = new Set(lockedIndices);
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
    for (let i = 0; i < slotsTotal; i += 1) {
      const cell = document.createElement('div');
      cell.className = 'math-slot is-empty';
      cell.dataset.slotIndex = String(i);
      slotsWrap.appendChild(cell);
      slotEls.push(cell);
    }

    spec.pieces.forEach((piece) => {
      const btn = createManipulative(piece, { reducedMotion, label: pieceLabel });
      elById.set(piece.id, btn);
      poolWrap.appendChild(btn);
    });

    container.append(slotsWrap, poolWrap);

    function isLockedSlot(index) {
      return locked.has(index);
    }

    function isLockedPiece(manipId) {
      const idx = state.slots.indexOf(manipId);
      return idx >= 0 && isLockedSlot(idx);
    }

    function syncNextHint() {
      slotEls.forEach((c) => c.classList.remove('is-next'));
      if (mode === 'remove') {
        if (state.filledCount() > completionTarget) {
          slotEls.forEach((c, i) => {
            if (!state.slots[i]) return;
            if (!isLockedSlot(i)) c.classList.add('is-next');
          });
        }
        return;
      }
      const idx = state.firstEmptyIndex();
      if (idx >= 0 && state.filledCount() < completionTarget) {
        slotEls[idx]?.classList.add('is-next');
      }
    }

    function refreshSlotClasses() {
      slotEls.forEach((cell, i) => {
        const filled = !!state.slots[i];
        cell.classList.toggle('is-empty', !filled);
        cell.classList.toggle('is-filled', filled);
        cell.classList.toggle('is-locked', isLockedSlot(i) && filled);
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
      const filled = state.filledCount();
      const ok = mode === 'remove' ? filled === completionTarget : filled === completionTarget;
      if (!ok) return;
      busy = true;
      onComplete?.({ moves, incorrectDrops, count: filled });
    }

    function handlePlace(manipId, fromDemo = false, slotIndexOverride = null) {
      if (busy) return { ok: false };
      let result;
      if (slotIndexOverride != null && state.slots[slotIndexOverride] == null && state.pool.includes(manipId)) {
        state.pool.splice(state.pool.indexOf(manipId), 1);
        state.slots[slotIndexOverride] = manipId;
        result = {
          ok: true,
          slotIndex: slotIndexOverride,
          count: state.filledCount(),
          complete: state.filledCount() === completionTarget,
        };
      } else {
        result = state.placeFromPool(manipId);
      }
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
      tryComplete();
      return result;
    }

    function handleReturn(manipId) {
      if (busy || isLockedPiece(manipId)) return { ok: false };
      const result = state.returnToPool(manipId);
      if (!result.ok) return result;
      moves += 1;
      const btn = elById.get(manipId);
      if (btn) appendToPool(btn);
      refreshSlotClasses();
      speakCount?.(result.count);
      onReturn?.({ count: result.count });
      tryComplete();
      return result;
    }

    function onManipClick(btn, manipId) {
      if (busy || dragState) return;
      const loc = state.locate(manipId);
      if (loc.home === 'pool') {
        const r = handlePlace(manipId);
        if (!r.ok && r.reason === 'full') {
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
          const slotIdx = slotCell ? Number(slotCell.dataset.slotIndex) : -1;

          if (slotCell && slotCell.classList.contains('is-empty') && ds.fromPool && !isLockedSlot(slotIdx)) {
            handlePlace(ds.manipId, false, slotIdx);
          } else if (hitPool && ds.fromSlot != null && ds.fromSlot >= 0 && !isLockedSlot(ds.fromSlot)) {
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

    // 初始化：鎖定格、起始已放、或 remove 模式全滿
    lockedIndices.slice().sort((a, b) => a - b).forEach((idx) => {
      if (idx < 0 || idx >= slotsTotal || !state.pool.length) return;
      const id = state.pool.shift();
      state.slots[idx] = id;
      const btn = elById.get(id);
      if (btn) {
        appendToSlot(btn, idx);
        btn.dataset.draggable = '0';
      }
    });

    if (startFilled > 0 && mode === 'fill') {
      for (let i = 0; i < slotsTotal && state.pool.length && state.filledCount() < startFilled; i += 1) {
        if (state.slots[i]) continue;
        handlePlace(state.pool[0], true, i);
      }
    }

    if (mode === 'remove') {
      while (state.pool.length) {
        const idx = state.firstEmptyIndex();
        if (idx < 0) break;
        handlePlace(state.pool[0], true, idx);
      }
    }

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
      demoOneMove() {
        if (busy) return false;
        if (mode === 'remove') {
          const id = state.slots.find((mid, i) => mid && !isLockedSlot(i));
          if (!id) return false;
          handleReturn(id);
          return true;
        }
        const id = state.pool[0];
        if (!id) return false;
        const idx = state.firstEmptyIndex();
        if (idx < 0) return false;
        handlePlace(id, true, idx);
        return true;
      },
      getStats() {
        return { moves, incorrectDrops, filled: state.filledCount() };
      },
    };
  }

  /** 金星公平分享：左右餐盤移動物件，兩邊一樣多就完成 */
  function mountBalanceBoard(container, options) {
    const {
      leftCount,
      rightCount,
      emoji,
      emojiSet = 'food',
      pieceLabel = '食物',
      onMove,
      onComplete,
      speakCount,
      reducedMotion = prefersReducedMotion(),
    } = options || {};

    if (!container) throw new Error('KakaMathManipulatives: container required');
    const total = leftCount + rightCount;
    const spec = createBoard({ target: total, available: total, emoji, emojiSet });
    let busy = false;
    let moves = 0;
    const sides = { left: [], right: [] };
    const elById = new Map();

    container.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'math-balance-row';

    function makePlate(side, label) {
      const wrap = document.createElement('div');
      wrap.className = `math-balance-plate math-balance-plate--${side}`;
      wrap.dataset.side = side;
      wrap.dataset.role = 'pool';
      const cap = document.createElement('div');
      cap.className = 'math-balance-plate-label';
      cap.textContent = label;
      const tray = document.createElement('div');
      tray.className = 'math-balance-tray';
      tray.dataset.side = side;
      wrap.append(cap, tray);
      return { wrap, tray };
    }

    const left = makePlate('left', '左邊');
    const mid = document.createElement('div');
    mid.className = 'math-balance-mid';
    mid.textContent = '⇄';
    const right = makePlate('right', '右邊');
    row.append(left.wrap, mid, right.wrap);
    container.appendChild(row);

    spec.pieces.forEach((piece, i) => {
      const btn = createManipulative(piece, { reducedMotion, label: pieceLabel });
      elById.set(piece.id, btn);
      const side = i < leftCount ? 'left' : 'right';
      sides[side].push(piece.id);
      (side === 'left' ? left.tray : right.tray).appendChild(btn);
    });

    function counts() {
      return { left: sides.left.length, right: sides.right.length };
    }

    function tryComplete() {
      const c = counts();
      if (c.left !== c.right) return;
      busy = true;
      onComplete?.({ moves, count: c.left });
    }

    function movePiece(manipId, toSide) {
      if (busy) return false;
      const fromSide = sides.left.includes(manipId) ? 'left' : sides.right.includes(manipId) ? 'right' : null;
      if (!fromSide || fromSide === toSide) return false;
      sides[fromSide] = sides[fromSide].filter((id) => id !== manipId);
      sides[toSide].push(manipId);
      const btn = elById.get(manipId);
      const tray = toSide === 'left' ? left.tray : right.tray;
      if (btn) tray.appendChild(btn);
      moves += 1;
      const c = counts();
      speakCount?.(c.left);
      onMove?.(c);
      tryComplete();
      return true;
    }

    spec.pieces.forEach((piece) => {
      const btn = elById.get(piece.id);
      btn.addEventListener('click', () => {
        const from = sides.left.includes(piece.id) ? 'left' : 'right';
        const to = from === 'left' ? 'right' : 'left';
        movePiece(piece.id, to);
      });
    });

    return {
      destroy() {
        container.innerHTML = '';
        busy = false;
      },
      setBusy(v) {
        busy = !!v;
      },
      getStats() {
        return { moves, ...counts() };
      },
      demoOneMove() {
        if (counts().left > counts().right && sides.left.length) {
          return movePiece(sides.left[0], 'right');
        }
        if (counts().right > counts().left && sides.right.length) {
          return movePiece(sides.right[0], 'left');
        }
        return false;
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
    mountBalanceBoard,
    prefersReducedMotion,
  };
})();

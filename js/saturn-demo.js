(() => {
  const planeBoard = document.querySelector('#plane-board');
  const stackBoard = document.querySelector('#stack-board');
  const pool = document.querySelector('#block-pool');
  const count = document.querySelector('#block-count');
  const message = document.querySelector('#board-message');
  const feedback = document.querySelector('#feedback');
  const title = document.querySelector('#workspace-title');
  const hint = document.querySelector('#hint-pill');
  let mode = 'plane';
  // Keep the board as a fixed 16-cell array.  A compact list makes a moved
  // block jump into a different cell after a delete, which is especially
  // confusing in the 3-D stack mode.
  let placed = Array(16).fill(null);
  let dragging = false;

  function filledCount() {
    return placed.filter((item) => item !== null && item !== undefined).length;
  }

  function makeBlock(index, extra = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `block ${extra}`;
    button.dataset.index = index;
    button.textContent = '✦';
    button.setAttribute('aria-label', `第 ${index + 1} 粒積木`);
    button.draggable = true;
    button.addEventListener('dragstart', (event) => { dragging = true; event.dataTransfer.setData('text/plain', index); });
    button.addEventListener('dragend', () => { dragging = false; });
    button.addEventListener('click', () => { if (!dragging) placeNext(index); });
    return button;
  }

  function renderPool() {
    pool.replaceChildren();
    for (let i = 0; i < 16; i += 1) {
      const block = makeBlock(i, placed.includes(i) ? 'is-used' : 'pool-block');
      pool.append(block);
    }
  }

  function renderPlane() {
    planeBoard.replaceChildren();
    for (let cell = 0; cell < 16; cell += 1) {
      const slot = document.createElement('div');
      slot.className = 'board-cell';
      slot.dataset.cell = cell;
      slot.textContent = placed[cell] == null ? '＋' : '';
      if (placed[cell] != null) slot.append(makeBlock(placed[cell], 'placed-block'));
      slot.addEventListener('dragover', (event) => { event.preventDefault(); slot.classList.add('is-over'); });
      slot.addEventListener('dragleave', () => slot.classList.remove('is-over'));
      slot.addEventListener('drop', (event) => { event.preventDefault(); slot.classList.remove('is-over'); const index = Number(event.dataTransfer.getData('text/plain')); placeAt(index, cell); });
      slot.addEventListener('click', () => { if (placed[cell] != null) { placed[cell] = null; render(); } });
      planeBoard.append(slot);
    }
  }

  function renderStack() {
    stackBoard.replaceChildren();
    for (let layer = 0; layer < 4; layer += 1) {
      const layerEl = document.createElement('div');
      layerEl.className = 'stack-layer';
      layerEl.style.left = `${layer * 25 + 112}px`;
      layerEl.style.top = `${layer * -22 + 142}px`;
      layerEl.style.gridTemplateColumns = 'repeat(2, 62px)';
      for (let cell = 0; cell < 4; cell += 1) {
        const slot = document.createElement('div');
        slot.className = 'stack-cell';
        const item = placed[layer * 4 + cell];
        if (item != null) { slot.replaceChildren(makeBlock(item, 'stack-block')); }
        slot.addEventListener('dragover', (event) => { event.preventDefault(); slot.classList.add('is-over'); });
        slot.addEventListener('dragleave', () => slot.classList.remove('is-over'));
        slot.addEventListener('drop', (event) => { event.preventDefault(); slot.classList.remove('is-over'); const index = Number(event.dataTransfer.getData('text/plain')); placeAt(index, layer * 4 + cell); });
        slot.addEventListener('click', () => { const index = layer * 4 + cell; if (placed[index] != null) { placed[index] = null; render(); } });
        layerEl.append(slot);
      }
      stackBoard.append(layerEl);
    }
  }

  function placeAt(index, cell) {
    if (!Number.isInteger(index) || index < 0 || index >= 16 || !Number.isInteger(cell) || cell < 0 || cell >= 16) return;
    const oldCell = placed.indexOf(index);
    if (oldCell >= 0 && oldCell !== cell) placed[oldCell] = null;
    placed[cell] = index;
    render();
  }

  function placeNext(index) {
    if (placed.includes(index)) return;
    const nextCell = placed.findIndex((item) => item == null);
    if (nextCell < 0) return;
    placed[nextCell] = index;
    render();
  }

  function render() {
    count.textContent = filledCount();
    renderPool();
    if (mode === 'plane') renderPlane(); else renderStack();
    feedback.textContent = '';
  }

  function loadTemplate() {
    placed = Array.from({ length: 16 }, (_, i) => i);
    render();
    feedback.textContent = mode === 'plane' ? '示範完成：呢個係一個 4×4 平面。' : '示範完成：呢個係四層 2×2 立體模型。';
  }

  document.querySelectorAll('.mode-tab').forEach((tab) => tab.addEventListener('click', () => {
    mode = tab.dataset.mode;
    document.querySelectorAll('.mode-tab').forEach((item) => { const active = item === tab; item.classList.toggle('is-active', active); item.setAttribute('aria-selected', active); });
    stackBoard.hidden = mode !== 'stack'; planeBoard.hidden = mode === 'stack';
    title.textContent = mode === 'plane' ? '砌一個 4×4 平面' : '砌一個 2×2×4 立體模型';
    hint.textContent = mode === 'plane' ? '每格放一粒' : '最多四層';
    placed = Array(16).fill(null); render();
  }));
  document.querySelector('#btn-template').addEventListener('click', loadTemplate);
  document.querySelector('#btn-clear').addEventListener('click', () => { placed = Array(16).fill(null); render(); message.textContent = '工作區已清空，可以重新開始。'; });
  document.querySelector('#btn-stairs').addEventListener('click', () => { mode = 'plane'; document.querySelector('[data-mode="plane"]').click(); placed = Array(16).fill(null); [0, 1, 2, 3, 4, 5, 6, 8, 9, 12].forEach((cell) => { placed[cell] = cell; }); render(); feedback.textContent = '試下觀察：呢個階梯形有幾多粒？'; });
  document.querySelector('#btn-answer').addEventListener('click', () => { feedback.textContent = filledCount() ? `完成！你而家放咗 ${filledCount()} 粒積木。` : '先放一粒積木，再按完成模型。'; });
  render();
})();

/**
 * Nonogram board renderer.
 *
 * Exports:
 *   renderNonogramBoard(container, rowClues, colClues, grid, options)
 *   updateCell(cellEl, state)
 */

import { CELL_STATES } from './puzzle-logic.js';

/**
 * Render the full nonogram board into `container`.
 *
 * @param {HTMLElement} container
 * @param {number[][]} rowClues
 * @param {number[][]} colClues
 * @param {number[][]} grid  - 2D array of CELL_STATES (may be mutated externally)
 * @param {Object}     options
 * @param {function(r:number, c:number, newState:number): void} [options.onCellChange]
 *   Called when the player changes a cell.
 * @returns {{ cellEls: HTMLElement[][], clueRowEls: HTMLElement[], clueColEls: HTMLElement[] }}
 *   Live DOM element references for later updates.
 */
export function renderNonogramBoard(container, rowClues, colClues, grid, options = {}) {
  const { onCellChange } = options;
  const rows = rowClues.length;
  const cols = colClues.length;

  // Max clue depth
  const maxRowClueLen = Math.max(...rowClues.map((c) => c.length), 1);
  const maxColClueLen = Math.max(...colClues.map((c) => c.length), 1);

  container.innerHTML = '';
  container.classList.add('nonogram-board');

  // Build CSS grid: header columns + data columns
  // grid-template-columns: [maxRowClueLen label cols] [cols data cols]
  container.style.display = 'grid';
  container.style.gridTemplateColumns =
    `repeat(${maxRowClueLen}, var(--clue-size, 28px)) repeat(${cols}, var(--cell-size, 32px))`;
  container.style.gridTemplateRows =
    `repeat(${maxColClueLen}, var(--clue-size, 28px)) repeat(${rows}, var(--cell-size, 32px))`;

  // Column clue headers (top rows)
  const clueColEls = colClues.map((clues, c) => {
    const headerGroup = document.createElement('div');
    headerGroup.className = 'nonogram-col-clue-group';
    headerGroup.style.gridColumn = `${maxRowClueLen + 1 + c}`;
    headerGroup.style.gridRow = `1 / ${maxColClueLen + 1}`;
    headerGroup.style.display = 'flex';
    headerGroup.style.flexDirection = 'column';
    headerGroup.style.alignItems = 'center';
    headerGroup.style.justifyContent = 'flex-end';
    headerGroup.setAttribute('data-col', c);

    const effective = clues.length === 0 || (clues.length === 1 && clues[0] === 0) ? [0] : clues;
    for (const n of effective) {
      const span = document.createElement('span');
      span.className = 'nonogram-clue-num';
      span.textContent = n;
      headerGroup.appendChild(span);
    }
    container.appendChild(headerGroup);
    return headerGroup;
  });

  // Row clue headers (left columns)
  const clueRowEls = rowClues.map((clues, r) => {
    const headerGroup = document.createElement('div');
    headerGroup.className = 'nonogram-row-clue-group';
    headerGroup.style.gridColumn = `1 / ${maxRowClueLen + 1}`;
    headerGroup.style.gridRow = `${maxColClueLen + 1 + r}`;
    headerGroup.style.display = 'flex';
    headerGroup.style.flexDirection = 'row';
    headerGroup.style.alignItems = 'center';
    headerGroup.style.justifyContent = 'flex-end';
    headerGroup.setAttribute('data-row', r);

    const effective = clues.length === 0 || (clues.length === 1 && clues[0] === 0) ? [0] : clues;
    for (const n of effective) {
      const span = document.createElement('span');
      span.className = 'nonogram-clue-num';
      span.textContent = n;
      headerGroup.appendChild(span);
    }
    container.appendChild(headerGroup);
    return headerGroup;
  });

  // Data cells
  const cellEls = Array.from({ length: rows }, () => new Array(cols).fill(null));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'nonogram-cell';
      cell.style.gridColumn = `${maxRowClueLen + 1 + c}`;
      cell.style.gridRow = `${maxColClueLen + 1 + r}`;
      cell.setAttribute('data-r', r);
      cell.setAttribute('data-c', c);
      applyBorders(cell, r, c, rows, cols);
      setVisualState(cell, grid[r][c]);

      // Left-click: cycle UNKNOWN → FILLED → EMPTY → UNKNOWN
      cell.addEventListener('click', (e) => {
        e.preventDefault();
        const cur = grid[r][c];
        let next;
        if (cur === CELL_STATES.UNKNOWN) next = CELL_STATES.FILLED;
        else if (cur === CELL_STATES.FILLED) next = CELL_STATES.EMPTY;
        else next = CELL_STATES.UNKNOWN;
        grid[r][c] = next;
        setVisualState(cell, next);
        if (onCellChange) onCellChange(r, c, next);
      });

      // Right-click: toggle UNKNOWN ↔ EMPTY
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const cur = grid[r][c];
        const next = cur === CELL_STATES.EMPTY ? CELL_STATES.UNKNOWN : CELL_STATES.EMPTY;
        grid[r][c] = next;
        setVisualState(cell, next);
        if (onCellChange) onCellChange(r, c, next);
      });

      cellEls[r][c] = cell;
      container.appendChild(cell);
    }
  }

  return { cellEls, clueRowEls, clueColEls };
}

/**
 * Update a single cell element to reflect a new CELL_STATE.
 * @param {HTMLElement} cellEl
 * @param {number} state - CELL_STATES value
 */
export function updateCell(cellEl, state) {
  setVisualState(cellEl, state);
}

/**
 * Refresh all clue header highlights based on whether rows/cols are satisfied.
 * @param {HTMLElement[][]} cellEls
 * @param {HTMLElement[]}   clueRowEls
 * @param {HTMLElement[]}   clueColEls
 * @param {number[][]}      grid
 * @param {number[][]}      rowClues
 * @param {number[][]}      colClues
 */
export function refreshClueHighlights(cellEls, clueRowEls, clueColEls, grid, rowClues, colClues) {
  const rows = rowClues.length;
  const cols = colClues.length;

  for (let r = 0; r < rows; r++) {
    const satisfied = _lineMatchesClues(grid[r], rowClues[r]);
    clueRowEls[r].classList.toggle('satisfied', satisfied);
  }
  for (let c = 0; c < cols; c++) {
    const line = grid.map((row) => row[c]);
    const satisfied = _lineMatchesClues(line, colClues[c]);
    clueColEls[c].classList.toggle('satisfied', satisfied);
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function setVisualState(cell, state) {
  cell.classList.remove('filled', 'empty');
  cell.innerHTML = '';
  if (state === CELL_STATES.FILLED) {
    cell.classList.add('filled');
  } else if (state === CELL_STATES.EMPTY) {
    cell.classList.add('empty');
    // Draw an X mark
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 10 10');
    svg.style.width = '60%';
    svg.style.height = '60%';
    const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line1.setAttribute('x1', '1'); line1.setAttribute('y1', '1');
    line1.setAttribute('x2', '9'); line1.setAttribute('y2', '9');
    line1.setAttribute('stroke', 'var(--ink-soft, #888)');
    line1.setAttribute('stroke-width', '1.5');
    const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line2.setAttribute('x1', '9'); line2.setAttribute('y1', '1');
    line2.setAttribute('x2', '1'); line2.setAttribute('y2', '9');
    line2.setAttribute('stroke', 'var(--ink-soft, #888)');
    line2.setAttribute('stroke-width', '1.5');
    svg.appendChild(line1);
    svg.appendChild(line2);
    cell.appendChild(svg);
  }
}

function applyBorders(cell, r, c, rows, cols) {
  // Thick border every 5 cells, thin otherwise
  const THICK = '2px solid var(--ink, #2B2420)';
  const THIN  = '1px solid rgba(43,36,32,0.25)';

  cell.style.borderTop    = r % 5 === 0 ? THICK : THIN;
  cell.style.borderLeft   = c % 5 === 0 ? THICK : THIN;
  cell.style.borderBottom = r === rows - 1 ? THICK : THIN;
  cell.style.borderRight  = c === cols - 1 ? THICK : THIN;
}

function _lineMatchesClues(line, clues) {
  const runs = [];
  let run = 0;
  for (const cell of line) {
    if (cell === CELL_STATES.FILLED) { run++; }
    else { if (run > 0) { runs.push(run); run = 0; } }
  }
  if (run > 0) runs.push(run);
  const actual = runs.length === 0 ? [0] : runs;
  if (actual.length !== clues.length) return false;
  for (let i = 0; i < clues.length; i++) { if (actual[i] !== clues[i]) return false; }
  return true;
}

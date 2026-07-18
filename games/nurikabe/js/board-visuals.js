import { CELL_STATES } from './puzzle-logic.js';

function stateClass(state) {
  if (state === CELL_STATES.ISLAND) return 'island';
  if (state === CELL_STATES.SEA) return 'sea';
  return 'unknown';
}

export function renderNurikabeBoard(boardEl, puzzle, grid, onPrimaryClick, onSecondaryClick) {
  boardEl.innerHTML = '';
  boardEl.style.display = 'grid';
  boardEl.style.gridTemplateColumns = `repeat(${puzzle.size}, minmax(0, 1fr))`;

  const refs = [];
  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'nurikabe-cell';
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      cell.setAttribute('aria-label', `cell ${r + 1}, ${c + 1}`);

      cell.addEventListener('click', () => onPrimaryClick(r, c));
      cell.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        if (onSecondaryClick) onSecondaryClick(r, c);
      });

      boardEl.appendChild(cell);
      refs.push(cell);
    }
  }

  updateNurikabeBoard(refs, puzzle, grid);
  return refs;
}

export function updateNurikabeBoard(cellRefs, puzzle, grid, options = {}) {
  const invalidKeys = new Set((options.invalidCells || []).map((cell) => `${cell.r},${cell.c}`));

  for (const cell of cellRefs) {
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const clue = puzzle.clueByKey[`${r},${c}`];
    const state = grid[r][c];

    cell.className = `nurikabe-cell ${stateClass(state)}`;
    if (clue) cell.classList.add('clue');
    if (invalidKeys.has(`${r},${c}`)) cell.classList.add('invalid');

    cell.textContent = clue ? String(clue.size) : '';
    cell.disabled = false;
  }
}

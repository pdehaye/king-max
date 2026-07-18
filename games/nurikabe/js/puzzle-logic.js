export const CELL_STATES = Object.freeze({
  UNKNOWN: 0,
  ISLAND: 1,
  SEA: 2
});

function orthogonalNeighbors(r, c, size) {
  const out = [];
  if (r > 0) out.push({ r: r - 1, c });
  if (r + 1 < size) out.push({ r: r + 1, c });
  if (c > 0) out.push({ r, c: c - 1 });
  if (c + 1 < size) out.push({ r, c: c + 1 });
  return out;
}

function keyOf(cell) {
  return `${cell.r},${cell.c}`;
}

export function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

export function createInitialPlayerGrid(puzzle) {
  const grid = Array.from({ length: puzzle.size }, () =>
    Array.from({ length: puzzle.size }, () => CELL_STATES.UNKNOWN)
  );

  for (const clue of puzzle.clues) {
    grid[clue.r][clue.c] = CELL_STATES.ISLAND;
  }

  return grid;
}

export function toggleCellState(grid, puzzle, r, c) {
  const clue = puzzle.clueByKey[`${r},${c}`];
  if (clue) return grid;

  const next = cloneGrid(grid);
  const current = next[r][c];
  if (current === CELL_STATES.UNKNOWN) next[r][c] = CELL_STATES.ISLAND;
  else if (current === CELL_STATES.ISLAND) next[r][c] = CELL_STATES.SEA;
  else next[r][c] = CELL_STATES.UNKNOWN;
  return next;
}

export function setCellState(grid, puzzle, r, c, state) {
  const clue = puzzle.clueByKey[`${r},${c}`];
  if (clue) return grid;
  const next = cloneGrid(grid);
  next[r][c] = state;
  return next;
}

function collectComponents(grid, value) {
  const size = grid.length;
  const seen = new Set();
  const components = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== value) continue;
      const startKey = `${r},${c}`;
      if (seen.has(startKey)) continue;

      const stack = [{ r, c }];
      const cells = [];
      seen.add(startKey);

      while (stack.length > 0) {
        const cell = stack.pop();
        cells.push(cell);
        for (const nb of orthogonalNeighbors(cell.r, cell.c, size)) {
          const nbKey = keyOf(nb);
          if (seen.has(nbKey)) continue;
          if (grid[nb.r][nb.c] !== value) continue;
          seen.add(nbKey);
          stack.push(nb);
        }
      }

      components.push(cells);
    }
  }

  return components;
}

function noSeaSquareViolations(grid) {
  const size = grid.length;
  const violations = [];
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (
        grid[r][c] === CELL_STATES.SEA
        && grid[r + 1][c] === CELL_STATES.SEA
        && grid[r][c + 1] === CELL_STATES.SEA
        && grid[r + 1][c + 1] === CELL_STATES.SEA
      ) {
        violations.push({
          code: 'sea-2x2',
          message: 'Sea cannot contain a 2x2 block.',
          cells: [
            { r, c },
            { r: r + 1, c },
            { r, c: c + 1 },
            { r: r + 1, c: c + 1 }
          ]
        });
      }
    }
  }
  return violations;
}

function islandViolations(grid, puzzle, requireComplete) {
  const violations = [];
  const islands = collectComponents(grid, CELL_STATES.ISLAND);

  for (const component of islands) {
    const clueCells = component.filter((cell) => puzzle.clueByKey[keyOf(cell)]);

    if (clueCells.length > 1) {
      violations.push({
        code: 'island-multiple-clues',
        message: 'An island cannot contain more than one clue.',
        cells: component
      });
      continue;
    }

    if (clueCells.length === 1) {
      const clue = puzzle.clueByKey[keyOf(clueCells[0])];
      if (component.length > clue.size) {
        violations.push({
          code: 'island-too-large',
          message: `Island at (${clue.r + 1}, ${clue.c + 1}) is larger than ${clue.size}.`,
          cells: component
        });
        continue;
      }

      if (requireComplete && component.length !== clue.size) {
        violations.push({
          code: 'island-size-mismatch',
          message: `Island at (${clue.r + 1}, ${clue.c + 1}) must contain exactly ${clue.size} cells.`,
          cells: component
        });
      }
      continue;
    }

    if (requireComplete) {
      violations.push({
        code: 'island-without-clue',
        message: 'Every island must contain exactly one clue.',
        cells: component
      });
    }
  }

  if (requireComplete) {
    for (const clue of puzzle.clues) {
      if (grid[clue.r][clue.c] !== CELL_STATES.ISLAND) {
        violations.push({
          code: 'clue-not-island',
          message: 'A clue cell must be part of an island.',
          cells: [{ r: clue.r, c: clue.c }]
        });
      }
    }
  }

  return violations;
}

function seaConnectivityViolations(grid, requireComplete) {
  const seaComponents = collectComponents(grid, CELL_STATES.SEA);
  if (seaComponents.length <= 1) return [];
  if (!requireComplete) return [];
  return [{
    code: 'sea-disconnected',
    message: 'Sea must form one connected region.',
    cells: seaComponents.flat()
  }];
}

function isComplete(grid) {
  for (const row of grid) {
    for (const cell of row) {
      if (cell === CELL_STATES.UNKNOWN) return false;
    }
  }
  return true;
}

export function evaluateBoard(grid, puzzle, options = {}) {
  const requireComplete = options.requireComplete === true;
  const complete = isComplete(grid);

  const violations = [
    ...noSeaSquareViolations(grid),
    ...islandViolations(grid, puzzle, requireComplete),
    ...seaConnectivityViolations(grid, requireComplete)
  ];

  return {
    valid: violations.length === 0,
    complete,
    violations
  };
}

export function isSolved(grid, puzzle) {
  const evaluation = evaluateBoard(grid, puzzle, { requireComplete: true });
  if (!evaluation.valid || !evaluation.complete) return false;

  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (grid[r][c] !== puzzle.solution[r][c]) return false;
    }
  }
  return true;
}

export function encodeGridState(grid) {
  return grid.map((row) => row.join('')).join('');
}

export function decodeGridState(raw, size) {
  if (typeof raw !== 'string' || raw.length !== size * size) return null;

  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      const n = Number(raw[r * size + c]);
      if (!Number.isInteger(n) || n < CELL_STATES.UNKNOWN || n > CELL_STATES.SEA) return null;
      row.push(n);
    }
    grid.push(row);
  }
  return grid;
}

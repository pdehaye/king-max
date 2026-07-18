import { CELL_STATES, cloneGrid, evaluateBoard } from './puzzle-logic.js';

export const NURIKABE_TACTIC_DESCRIPTORS = [
  {
    id: 'no-2x2-ocean',
    label: 'No 2x2 ocean'
  },
  {
    id: 'full-grown-island',
    label: 'Full grown island'
  },
  {
    id: 'only-one-expansion-path',
    label: 'Only one expansion path'
  },
  {
    id: 'sea-connectivity-preservation',
    label: 'Sea connectivity preservation'
  },
  {
    id: 'diagonal-clue-separation',
    label: 'Diagonal clue separation'
  },
  {
    id: 'inaccessible',
    label: 'Inaccessible'
  }
];

function orthogonalNeighbors(r, c, size) {
  const out = [];
  if (r > 0) out.push({ r: r - 1, c });
  if (r + 1 < size) out.push({ r: r + 1, c });
  if (c > 0) out.push({ r, c: c - 1 });
  if (c + 1 < size) out.push({ r, c: c + 1 });
  return out;
}

function collectIslandComponents(grid) {
  const size = grid.length;
  const seen = new Set();
  const components = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== CELL_STATES.ISLAND) continue;
      const key = `${r},${c}`;
      if (seen.has(key)) continue;

      const stack = [{ r, c }];
      const cells = [];
      seen.add(key);

      while (stack.length > 0) {
        const cell = stack.pop();
        cells.push(cell);
        for (const nb of orthogonalNeighbors(cell.r, cell.c, size)) {
          const nbKey = `${nb.r},${nb.c}`;
          if (seen.has(nbKey)) continue;
          if (grid[nb.r][nb.c] !== CELL_STATES.ISLAND) continue;
          seen.add(nbKey);
          stack.push(nb);
        }
      }

      components.push(cells);
    }
  }

  return components;
}

function collectComponentNeighborKeys(component, size) {
  const keys = new Set();
  for (const cell of component) {
    for (const nb of orthogonalNeighbors(cell.r, cell.c, size)) {
      keys.add(`${nb.r},${nb.c}`);
    }
  }
  return keys;
}

function parseCellKey(key) {
  const [r, c] = key.split(',').map(Number);
  return { r, c };
}

function seaCellsRemainConnectable(grid, blockedCell = null) {
  const size = grid.length;
  const seaCells = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] !== CELL_STATES.SEA) continue;
      seaCells.push({ r, c });
    }
  }

  if (seaCells.length <= 1) return true;

  const blockedKey = blockedCell ? `${blockedCell.r},${blockedCell.c}` : null;
  const seen = new Set();
  const stack = [seaCells[0]];
  seen.add(`${seaCells[0].r},${seaCells[0].c}`);

  while (stack.length > 0) {
    const cell = stack.pop();
    for (const nb of orthogonalNeighbors(cell.r, cell.c, size)) {
      const key = `${nb.r},${nb.c}`;
      if (seen.has(key)) continue;
      if (key === blockedKey) continue;
      if (grid[nb.r][nb.c] === CELL_STATES.ISLAND) continue;
      seen.add(key);
      stack.push(nb);
    }
  }

  return seaCells.every((cell) => seen.has(`${cell.r},${cell.c}`));
}

function collectReachableUnknownKeys(grid, puzzle) {
  const reachable = new Set();
  const components = collectIslandComponents(grid);

  for (const component of components) {
    const clueCells = component.filter((cell) => puzzle.clueByKey[`${cell.r},${cell.c}`]);
    if (clueCells.length !== 1) continue;

    const clue = puzzle.clueByKey[`${clueCells[0].r},${clueCells[0].c}`];
    const remaining = clue.size - component.length;
    if (remaining <= 0) continue;

    const componentKeys = new Set(component.map((cell) => `${cell.r},${cell.c}`));
    const seenUnknown = new Set();
    const queue = component.map((cell) => ({ r: cell.r, c: cell.c, dist: 0 }));

    while (queue.length > 0) {
      const cell = queue.shift();
      for (const nb of orthogonalNeighbors(cell.r, cell.c, puzzle.size)) {
        const key = `${nb.r},${nb.c}`;
        const state = grid[nb.r][nb.c];

        if (state === CELL_STATES.SEA) continue;
        if (state === CELL_STATES.ISLAND && !componentKeys.has(key)) continue;
        if (state === CELL_STATES.ISLAND) continue;

        const nextDist = cell.dist + 1;
        if (nextDist > remaining) continue;
        if (seenUnknown.has(key)) continue;

        seenUnknown.add(key);
        reachable.add(key);
        queue.push({ r: nb.r, c: nb.c, dist: nextDist });
      }
    }
  }

  return reachable;
}

export function applyNo2x2Ocean(grid) {
  const size = grid.length;
  const next = cloneGrid(grid);
  const changes = [];

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const block = [
        { r, c },
        { r: r + 1, c },
        { r, c: c + 1 },
        { r: r + 1, c: c + 1 }
      ];

      const seaCells = block.filter((cell) => next[cell.r][cell.c] === CELL_STATES.SEA);
      const unknownCells = block.filter((cell) => next[cell.r][cell.c] === CELL_STATES.UNKNOWN);

      if (seaCells.length === 3 && unknownCells.length === 1) {
        const target = unknownCells[0];
        next[target.r][target.c] = CELL_STATES.ISLAND;
        changes.push({ ...target, state: CELL_STATES.ISLAND });
      }
    }
  }

  return {
    changed: changes.length > 0,
    grid: next,
    changes,
    message: changes.length > 0
      ? `No 2x2 ocean marked ${changes.length} cell${changes.length === 1 ? '' : 's'} as island.`
      : 'No 2x2 ocean found no forced move.'
  };
}

export function applyFullGrownIsland(grid, puzzle) {
  const next = cloneGrid(grid);
  const changes = [];
  const components = collectIslandComponents(next);

  for (const component of components) {
    const clueCells = component.filter((cell) => puzzle.clueByKey[`${cell.r},${cell.c}`]);
    if (clueCells.length !== 1) continue;

    const clue = puzzle.clueByKey[`${clueCells[0].r},${clueCells[0].c}`];
    if (component.length !== clue.size) continue;

    for (const cell of component) {
      for (const nb of orthogonalNeighbors(cell.r, cell.c, puzzle.size)) {
        if (next[nb.r][nb.c] !== CELL_STATES.UNKNOWN) continue;
        next[nb.r][nb.c] = CELL_STATES.SEA;
        changes.push({ ...nb, state: CELL_STATES.SEA });
      }
    }
  }

  return {
    changed: changes.length > 0,
    grid: next,
    changes,
    message: changes.length > 0
      ? `Full grown island marked ${changes.length} cell${changes.length === 1 ? '' : 's'} as sea.`
      : 'Full grown island found no forced move.'
  };
}

export function applyOnlyOneExpansionPath(grid, puzzle) {
  const next = cloneGrid(grid);
  const changes = [];
  const components = collectIslandComponents(next);

  for (const component of components) {
    const clueCells = component.filter((cell) => puzzle.clueByKey[`${cell.r},${cell.c}`]);
    if (clueCells.length !== 1) continue;

    const clue = puzzle.clueByKey[`${clueCells[0].r},${clueCells[0].c}`];
    if (component.length >= clue.size) continue;

    const candidateCells = [];
    const neighborKeys = collectComponentNeighborKeys(component, puzzle.size);

    for (const key of neighborKeys) {
      const cell = parseCellKey(key);
      if (next[cell.r][cell.c] !== CELL_STATES.UNKNOWN) continue;

      const trial = cloneGrid(next);
      trial[cell.r][cell.c] = CELL_STATES.ISLAND;
      const evaluation = evaluateBoard(trial, puzzle, { requireComplete: false });
      if (evaluation.valid) candidateCells.push(cell);
    }

    if (candidateCells.length !== 1) continue;

    const forced = candidateCells[0];
    next[forced.r][forced.c] = CELL_STATES.ISLAND;
    changes.push({ ...forced, state: CELL_STATES.ISLAND });
  }

  return {
    changed: changes.length > 0,
    grid: next,
    changes,
    message: changes.length > 0
      ? `Only one expansion path marked ${changes.length} cell${changes.length === 1 ? '' : 's'} as island.`
      : 'Only one expansion path found no forced move.'
  };
}

export function applySeaConnectivityPreservation(grid, puzzle) {
  const next = cloneGrid(grid);
  const changes = [];
  const size = next.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (next[r][c] !== CELL_STATES.UNKNOWN) continue;

      // If turning this unknown into island disconnects current sea reachability,
      // preserving a single sea component forces this cell to sea.
      if (seaCellsRemainConnectable(next, { r, c })) continue;

      const seaTrial = cloneGrid(next);
      seaTrial[r][c] = CELL_STATES.SEA;
      const evaluation = evaluateBoard(seaTrial, puzzle, { requireComplete: false });
      if (!evaluation.valid) continue;

      next[r][c] = CELL_STATES.SEA;
      changes.push({ r, c, state: CELL_STATES.SEA });
    }
  }

  return {
    changed: changes.length > 0,
    grid: next,
    changes,
    message: changes.length > 0
      ? `Sea connectivity preservation marked ${changes.length} cell${changes.length === 1 ? '' : 's'} as sea.`
      : 'Sea connectivity preservation found no forced move.'
  };
}

export function applyDiagonalClueSeparation(grid, puzzle) {
  const next = cloneGrid(grid);
  const changes = [];
  const changedKeys = new Set();
  const clues = Array.isArray(puzzle?.clues) ? puzzle.clues : [];

  for (let i = 0; i < clues.length; i++) {
    for (let j = i + 1; j < clues.length; j++) {
      const a = clues[i];
      const b = clues[j];
      const dr = Math.abs(a.r - b.r);
      const dc = Math.abs(a.c - b.c);
      if (dr !== 1 || dc !== 1) continue;

      const bridgeCells = [
        { r: a.r, c: b.c },
        { r: b.r, c: a.c }
      ];

      for (const cell of bridgeCells) {
        const key = `${cell.r},${cell.c}`;
        if (changedKeys.has(key)) continue;
        if (next[cell.r][cell.c] !== CELL_STATES.UNKNOWN) continue;
        next[cell.r][cell.c] = CELL_STATES.SEA;
        changedKeys.add(key);
        changes.push({ ...cell, state: CELL_STATES.SEA });
      }
    }
  }

  return {
    changed: changes.length > 0,
    grid: next,
    changes,
    message: changes.length > 0
      ? `Diagonal clue separation marked ${changes.length} cell${changes.length === 1 ? '' : 's'} as sea.`
      : 'Diagonal clue separation found no forced move.'
  };
}

export function applyInaccessible(grid, puzzle) {
  const next = cloneGrid(grid);
  const changes = [];

  if (!Array.isArray(puzzle?.clues) || puzzle.clues.length === 0) {
    return {
      changed: false,
      grid: next,
      changes,
      message: 'Inaccessible found no forced move.'
    };
  }

  const reachable = collectReachableUnknownKeys(next, puzzle);

  for (let r = 0; r < puzzle.size; r++) {
    for (let c = 0; c < puzzle.size; c++) {
      if (next[r][c] !== CELL_STATES.UNKNOWN) continue;
      const key = `${r},${c}`;
      if (reachable.has(key)) continue;
      next[r][c] = CELL_STATES.SEA;
      changes.push({ r, c, state: CELL_STATES.SEA });
    }
  }

  return {
    changed: changes.length > 0,
    grid: next,
    changes,
    message: changes.length > 0
      ? `Inaccessible marked ${changes.length} cell${changes.length === 1 ? '' : 's'} as sea.`
      : 'Inaccessible found no forced move.'
  };
}

/**
 * Nonogram puzzle logic — data model and constraint validation.
 */

export const CELL_STATES = Object.freeze({
  UNKNOWN: 0,
  FILLED: 1,
  EMPTY: -1
});

/**
 * Validate clue arrays and throw on impossible total.
 * @param {number[][]} rowClues - Array of clue arrays per row
 * @param {number[][]} colClues - Array of clue arrays per column
 */
export function parseClues(rowClues, colClues) {
  if (!Array.isArray(rowClues) || !Array.isArray(colClues)) {
    throw new Error('parseClues: rowClues and colClues must be arrays');
  }
  const rows = rowClues.length;
  const cols = colClues.length;
  if (rows === 0 || cols === 0) {
    throw new Error('parseClues: clue arrays must not be empty');
  }

  for (let r = 0; r < rows; r++) {
    if (!Array.isArray(rowClues[r])) throw new Error(`parseClues: rowClues[${r}] must be an array`);
    for (const n of rowClues[r]) {
      if (!Number.isInteger(n) || n < 0) throw new Error(`parseClues: invalid clue value ${n} in row ${r}`);
    }
  }
  for (let c = 0; c < cols; c++) {
    if (!Array.isArray(colClues[c])) throw new Error(`parseClues: colClues[${c}] must be an array`);
    for (const n of colClues[c]) {
      if (!Number.isInteger(n) || n < 0) throw new Error(`parseClues: invalid clue value ${n} in col ${c}`);
    }
  }

  // Minimum space needed for a clue set in a line of given length
  function minLength(clues) {
    if (clues.length === 0) return 0;
    return clues.reduce((s, v) => s + v, 0) + clues.length - 1;
  }

  for (let r = 0; r < rows; r++) {
    const needed = minLength(rowClues[r]);
    if (needed > cols) {
      throw new Error(`parseClues: row ${r} clues require at least ${needed} cells but grid has only ${cols} columns`);
    }
  }
  for (let c = 0; c < cols; c++) {
    const needed = minLength(colClues[c]);
    if (needed > rows) {
      throw new Error(`parseClues: col ${c} clues require at least ${needed} cells but grid has only ${rows} rows`);
    }
  }

  const rowTotal = rowClues.reduce((s, clues) => s + clues.reduce((a, v) => a + v, 0), 0);
  const colTotal = colClues.reduce((s, clues) => s + clues.reduce((a, v) => a + v, 0), 0);
  if (rowTotal !== colTotal) {
    throw new Error(`parseClues: row clue total (${rowTotal}) does not match column clue total (${colTotal})`);
  }

  return { rows, cols };
}

/**
 * Compute the clue (run-length encoding) for a single line of cells.
 * @param {number[]} line - Array of CELL_STATES values
 * @returns {number[]} clues
 */
export function computeCluesForLine(line) {
  const clues = [];
  let run = 0;
  for (const cell of line) {
    if (cell === CELL_STATES.FILLED) {
      run++;
    } else {
      if (run > 0) { clues.push(run); run = 0; }
    }
  }
  if (run > 0) clues.push(run);
  return clues.length === 0 ? [0] : clues;
}

/**
 * Check whether a single line satisfies its clues.
 * @param {number[]} line - Array of CELL_STATES values
 * @param {number[]} clues
 * @returns {boolean}
 */
export function lineMatchesClues(line, clues) {
  const actual = computeCluesForLine(line);
  if (actual.length !== clues.length) return false;
  for (let i = 0; i < clues.length; i++) {
    if (actual[i] !== clues[i]) return false;
  }
  return true;
}

/**
 * Check whether the full grid satisfies all clues.
 * @param {number[][]} grid - 2D array of CELL_STATES, rows × cols
 * @param {number[][]} rowClues
 * @param {number[][]} colClues
 * @returns {boolean}
 */
export function isSolved(grid, rowClues, colClues) {
  const rows = rowClues.length;
  const cols = colClues.length;
  for (let r = 0; r < rows; r++) {
    if (!lineMatchesClues(grid[r], rowClues[r])) return false;
  }
  for (let c = 0; c < cols; c++) {
    const col = grid.map((row) => row[c]);
    if (!lineMatchesClues(col, colClues[c])) return false;
  }
  return true;
}

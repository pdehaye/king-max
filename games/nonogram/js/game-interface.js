/**
 * Nonogram GameInterface — wraps a live nonogram solving state and exposes the
 * shared GameInterface protocol so that tactics, the solver loop, and the
 * difficulty scorer can work against it without coupling to internals.
 */

import { CELL_STATES, isSolved } from './puzzle-logic.js';
import { makeAnnotation } from '../../../generic/annotations/reasoning-annotation.js';

/**
 * Create a GameInterface-conforming object for a nonogram puzzle.
 *
 * Constraints are rows (type 'row') and columns (type 'col').
 * `candidatesAt(constraint)` returns cells still in UNKNOWN state for that line.
 * `place(cell, tier)` marks a cell FILLED.
 * `eliminate(cell, tier)` marks a cell EMPTY.
 *
 * @param {number[][]} rowClues
 * @param {number[][]} colClues
 * @returns {Object} GameInterface-conforming object
 */
export function makeNonogramInterface(rowClues, colClues) {
  const rows = rowClues.length;
  const cols = colClues.length;

  // Working grid: UNKNOWN (0), FILLED (1), EMPTY (-1)
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(CELL_STATES.UNKNOWN));
  const annotations = [];

  function candidatesAt(constraint) {
    const { type, index } = constraint;
    const result = [];
    if (type === 'row') {
      for (let c = 0; c < cols; c++) {
        if (grid[index][c] === CELL_STATES.UNKNOWN) {
          result.push({ r: index, c });
        }
      }
    } else if (type === 'col') {
      for (let r = 0; r < rows; r++) {
        if (grid[r][index] === CELL_STATES.UNKNOWN) {
          result.push({ r, c: index });
        }
      }
    }
    return result;
  }

  function isRowSatisfied(r) {
    const line = grid[r];
    if (line.includes(CELL_STATES.UNKNOWN)) return false;
    return _lineMatchesClues(line, rowClues[r]);
  }

  function isColSatisfied(c) {
    const line = grid.map((row) => row[c]);
    if (line.includes(CELL_STATES.UNKNOWN)) return false;
    return _lineMatchesClues(line, colClues[c]);
  }

  function constraints() {
    const result = [];
    for (let r = 0; r < rows; r++) {
      if (!isRowSatisfied(r)) result.push({ type: 'row', index: r });
    }
    for (let c = 0; c < cols; c++) {
      if (!isColSatisfied(c)) result.push({ type: 'col', index: c });
    }
    return result;
  }

  function place(cell, tier) {
    grid[cell.r][cell.c] = CELL_STATES.FILLED;
  }

  function eliminate(cell) {
    if (grid[cell.r][cell.c] === CELL_STATES.UNKNOWN) {
      grid[cell.r][cell.c] = CELL_STATES.EMPTY;
      return true;
    }
    return false;
  }

  function isDone() {
    return isSolved(grid, rowClues, colClues);
  }

  function stateSnapshot() {
    return {
      grid: grid.map((row) => row.slice()),
    };
  }

  function annotate(annotation) {
    annotations.push(annotation);
  }

  function getAnnotations() {
    return annotations.slice();
  }

  /**
   * Returns the current grid (live reference — do not mutate).
   */
  function getGrid() {
    return grid;
  }

  return {
    n: Math.max(rows, cols),
    rows,
    cols,
    rowClues,
    colClues,
    candidatesAt,
    constraints,
    place,
    eliminate,
    isDone,
    stateSnapshot,
    annotate,
    getAnnotations,
    getGrid
  };
}

// --- Internal helpers ---

function _lineMatchesClues(line, clues) {
  const runs = [];
  let run = 0;
  for (const cell of line) {
    if (cell === CELL_STATES.FILLED) {
      run++;
    } else {
      if (run > 0) { runs.push(run); run = 0; }
    }
  }
  if (run > 0) runs.push(run);
  const actual = runs.length === 0 ? [0] : runs;
  if (actual.length !== clues.length) return false;
  for (let i = 0; i < clues.length; i++) {
    if (actual[i] !== clues[i]) return false;
  }
  return true;
}

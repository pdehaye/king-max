/**
 * Nonogram deterministic tactics.
 *
 * Each tactic is exported as `tryXxx(state)` where `state` is a
 * makeNonogramInterface() result.  Returns true if progress was made.
 *
 * Tactics call `state.annotate(annotation)` when they fire.
 * Uses `state.place(cell, tier)` for FILLED decisions and
 *      `state.eliminate(cell)` for EMPTY decisions.
 */

import { makeAnnotation } from '../reasoning-annotation.js';
import { CELL_STATES } from './puzzle-logic.js';

// ─── Internal helpers ────────────────────────────────────────────────────────

/**
 * Return all placements of `clues` in a line of `len` cells starting at `offset`.
 * Each placement is an array of block start positions.
 * Used by overlap and edge-fill tactics.
 */
function allPlacements(clues, len) {
  const results = [];
  function rec(clueIdx, pos, current) {
    if (clueIdx === clues.length) {
      results.push(current.slice());
      return;
    }
    const clue = clues[clueIdx];
    const remaining = clues.slice(clueIdx + 1).reduce((s, v) => s + v + 1, 0);
    const lastStart = len - remaining - clue;
    for (let start = pos; start <= lastStart; start++) {
      current.push(start);
      rec(clueIdx + 1, start + clue + 1, current);
      current.pop();
    }
  }
  rec(0, 0, []);
  return results;
}

/**
 * Return all placements consistent with the current (partially known) line.
 * `line` is an array of CELL_STATES values.
 */
function consistentPlacements(clues, line) {
  const len = line.length;
  const all = allPlacements(clues, len);
  return all.filter((placement) => {
    // Build what that placement would produce
    const filled = new Set();
    for (let i = 0; i < clues.length; i++) {
      for (let j = 0; j < clues[i]; j++) {
        filled.add(placement[i] + j);
      }
    }
    // Check consistency with known cells
    for (let p = 0; p < len; p++) {
      if (line[p] === CELL_STATES.FILLED && !filled.has(p)) return false;
      if (line[p] === CELL_STATES.EMPTY && filled.has(p)) return false;
    }
    return true;
  });
}

function extractLine(grid, type, index, rows, cols) {
  if (type === 'row') return grid[index].slice();
  return Array.from({ length: rows }, (_, r) => grid[r][index]);
}

function cellsForLine(type, index, rows, cols) {
  if (type === 'row') {
    return Array.from({ length: cols }, (_, c) => ({ r: index, c }));
  }
  return Array.from({ length: rows }, (_, r) => ({ r, c: index }));
}

// ─── Tactic: full-line ───────────────────────────────────────────────────────

/**
 * Full-line: when the sum of clues + gaps exactly fills the line, every cell's
 * state is determined.
 */
export function tryFullLine(state) {
  const { rows, cols, rowClues, colClues, getGrid, place, eliminate, annotate } = state;
  const grid = getGrid();
  let progressed = false;

  for (const { type, index, clues, len } of iterateLines(rows, cols, rowClues, colClues)) {
    const minLen = clues.reduce((s, v) => s + v, 0) + Math.max(0, clues.length - 1);
    if (minLen !== len) continue;

    const line = extractLine(grid, type, index, rows, cols);
    const cells = cellsForLine(type, index, rows, cols);

    // Reconstruct the forced pattern: blocks separated by single gaps
    const pattern = [];
    for (let i = 0; i < clues.length; i++) {
      if (i > 0) pattern.push(CELL_STATES.EMPTY);
      for (let j = 0; j < clues[i]; j++) pattern.push(CELL_STATES.FILLED);
    }

    const observed = [];
    const concludedPlace = [];
    const concludedElim = [];

    for (let p = 0; p < len; p++) {
      if (line[p] === CELL_STATES.UNKNOWN) {
        observed.push(cells[p]);
        if (pattern[p] === CELL_STATES.FILLED) {
          place(cells[p], 1);
          concludedPlace.push(cells[p]);
          progressed = true;
        } else {
          eliminate(cells[p]);
          concludedElim.push(cells[p]);
          progressed = true;
        }
      }
    }

    if (concludedPlace.length + concludedElim.length > 0) {
      const concluded = [...concludedPlace, ...concludedElim];
      annotate(makeAnnotation({
        tacticId: 'full-line',
        tacticLabel: 'Full Line',
        observed,
        concluded,
        conclusionType: concludedPlace.length > 0 ? 'place' : 'eliminate',
        explanationText: `${type === 'row' ? 'Row' : 'Column'} ${index} clues exactly fill the line — all cells determined.`
      }));
    }
  }
  return progressed;
}

// ─── Tactic: empty-line ──────────────────────────────────────────────────────

/**
 * Empty-line: when all clues are 0 (or the clue list is empty), mark the
 * entire line EMPTY.
 */
export function tryEmptyLine(state) {
  const { rows, cols, rowClues, colClues, getGrid, eliminate, annotate } = state;
  const grid = getGrid();
  let progressed = false;

  for (const { type, index, clues, len } of iterateLines(rows, cols, rowClues, colClues)) {
    const totalFilled = clues.reduce((s, v) => s + v, 0);
    if (totalFilled !== 0) continue;

    const line = extractLine(grid, type, index, rows, cols);
    const cells = cellsForLine(type, index, rows, cols);
    const concluded = [];

    for (let p = 0; p < len; p++) {
      if (line[p] === CELL_STATES.UNKNOWN) {
        eliminate(cells[p]);
        concluded.push(cells[p]);
        progressed = true;
      }
    }

    if (concluded.length > 0) {
      annotate(makeAnnotation({
        tacticId: 'empty-line',
        tacticLabel: 'Empty Line',
        observed: cells.filter((_, p) => line[p] !== CELL_STATES.UNKNOWN),
        concluded,
        conclusionType: 'eliminate',
        explanationText: `${type === 'row' ? 'Row' : 'Column'} ${index} has no filled clues — all cells are empty.`
      }));
    }
  }
  return progressed;
}

// ─── Tactic: overlap ─────────────────────────────────────────────────────────

/**
 * Overlap: cells that are FILLED in every consistent placement of a clue block.
 * Also marks cells that are EMPTY in every consistent placement.
 */
export function tryOverlap(state) {
  const { rows, cols, rowClues, colClues, getGrid, place, eliminate, annotate } = state;
  const grid = getGrid();
  let progressed = false;

  for (const { type, index, clues, len } of iterateLines(rows, cols, rowClues, colClues)) {
    if (clues.reduce((s, v) => s + v, 0) === 0) continue;

    const line = extractLine(grid, type, index, rows, cols);
    const placements = consistentPlacements(clues, line);
    if (placements.length === 0) continue;

    const cells = cellsForLine(type, index, rows, cols);

    // Count how many placements fill each position
    const fillCount = new Array(len).fill(0);
    for (const pl of placements) {
      for (let i = 0; i < clues.length; i++) {
        for (let j = 0; j < clues[i]; j++) {
          fillCount[pl[i] + j]++;
        }
      }
    }

    const concludedPlace = [];
    const concludedElim = [];
    const observed = [];

    for (let p = 0; p < len; p++) {
      if (line[p] !== CELL_STATES.UNKNOWN) continue;
      observed.push(cells[p]);
      if (fillCount[p] === placements.length) {
        // Filled in every placement
        place(cells[p], 1);
        concludedPlace.push(cells[p]);
        progressed = true;
      } else if (fillCount[p] === 0) {
        // Empty in every placement
        eliminate(cells[p]);
        concludedElim.push(cells[p]);
        progressed = true;
      }
    }

    if (concludedPlace.length + concludedElim.length > 0) {
      const concluded = [...concludedPlace, ...concludedElim];
      annotate(makeAnnotation({
        tacticId: 'overlap',
        tacticLabel: 'Overlap',
        observed,
        concluded,
        conclusionType: concludedPlace.length > 0 ? 'place' : 'eliminate',
        explanationText: `${type === 'row' ? 'Row' : 'Column'} ${index}: cells common to all valid placements are determined.`
      }));
    }
  }
  return progressed;
}

// ─── Tactic: edge-fill ───────────────────────────────────────────────────────

/**
 * Edge-fill: a clue block touching the edge of the line forces cells
 * from that edge inward to be FILLED.
 */
export function tryEdgeFill(state) {
  const { rows, cols, rowClues, colClues, getGrid, place, eliminate, annotate } = state;
  const grid = getGrid();
  let progressed = false;

  for (const { type, index, clues, len } of iterateLines(rows, cols, rowClues, colClues)) {
    if (clues.length === 0 || clues[0] === 0) continue;

    const line = extractLine(grid, type, index, rows, cols);
    const cells = cellsForLine(type, index, rows, cols);

    // Check left edge: if line[0] is FILLED and belongs to first clue
    if (line[0] === CELL_STATES.FILLED) {
      const clue = clues[0];
      const concludedPlace = [];
      const concludedElim = [];
      const observed = [cells[0]];

      for (let j = 1; j < clue; j++) {
        if (line[j] === CELL_STATES.UNKNOWN) {
          place(cells[j], 1);
          concludedPlace.push(cells[j]);
          progressed = true;
        }
        observed.push(cells[j]);
      }
      // The cell after the block must be empty
      if (clue < len && line[clue] === CELL_STATES.UNKNOWN) {
        eliminate(cells[clue]);
        concludedElim.push(cells[clue]);
        progressed = true;
      }

      if (concludedPlace.length + concludedElim.length > 0) {
        annotate(makeAnnotation({
          tacticId: 'edge-fill',
          tacticLabel: 'Edge Fill',
          observed,
          concluded: [...concludedPlace, ...concludedElim],
          conclusionType: concludedPlace.length > 0 ? 'place' : 'eliminate',
          explanationText: `${type === 'row' ? 'Row' : 'Column'} ${index}: first clue block anchored at left/top edge.`
        }));
      }
    }

    // Check right edge: if line[len-1] is FILLED and belongs to last clue
    if (line[len - 1] === CELL_STATES.FILLED) {
      const clue = clues[clues.length - 1];
      const concludedPlace = [];
      const concludedElim = [];
      const observed = [cells[len - 1]];

      for (let j = len - clue; j < len - 1; j++) {
        if (line[j] === CELL_STATES.UNKNOWN) {
          place(cells[j], 1);
          concludedPlace.push(cells[j]);
          progressed = true;
        }
        observed.push(cells[j]);
      }
      // The cell before the block must be empty
      if (len - clue - 1 >= 0 && line[len - clue - 1] === CELL_STATES.UNKNOWN) {
        eliminate(cells[len - clue - 1]);
        concludedElim.push(cells[len - clue - 1]);
        progressed = true;
      }

      if (concludedPlace.length + concludedElim.length > 0) {
        annotate(makeAnnotation({
          tacticId: 'edge-fill',
          tacticLabel: 'Edge Fill',
          observed,
          concluded: [...concludedPlace, ...concludedElim],
          conclusionType: concludedPlace.length > 0 ? 'place' : 'eliminate',
          explanationText: `${type === 'row' ? 'Row' : 'Column'} ${index}: last clue block anchored at right/bottom edge.`
        }));
      }
    }
  }
  return progressed;
}

// ─── Tactic: box-reduction ───────────────────────────────────────────────────

/**
 * Box-reduction: a contiguous run of FILLED cells that can only belong to one
 * specific clue block lets us eliminate UNKNOWN cells outside the valid range
 * for that block.
 */
export function tryBoxReduction(state) {
  const { rows, cols, rowClues, colClues, getGrid, eliminate, annotate } = state;
  const grid = getGrid();
  let progressed = false;

  for (const { type, index, clues, len } of iterateLines(rows, cols, rowClues, colClues)) {
    if (clues.reduce((s, v) => s + v, 0) === 0) continue;

    const line = extractLine(grid, type, index, rows, cols);
    const cells = cellsForLine(type, index, rows, cols);

    // Find all consistent placements
    const placements = consistentPlacements(clues, line);
    if (placements.length === 0) continue;

    // Find runs of FILLED cells
    const runs = [];
    let inRun = false;
    let runStart = -1;
    for (let p = 0; p < len; p++) {
      if (line[p] === CELL_STATES.FILLED) {
        if (!inRun) { inRun = true; runStart = p; }
      } else {
        if (inRun) { runs.push({ start: runStart, end: p - 1 }); inRun = false; }
      }
    }
    if (inRun) runs.push({ start: runStart, end: len - 1 });

    for (const run of runs) {
      // Find which clue blocks cover this run in every consistent placement
      // A placement covers the run if it has a block that contains [run.start, run.end]
      const compatibleBlockIndices = new Set(clues.map((_, i) => i));
      for (const pl of placements) {
        const coveringBlocks = new Set();
        for (let i = 0; i < clues.length; i++) {
          const blockStart = pl[i];
          const blockEnd = pl[i] + clues[i] - 1;
          if (blockStart <= run.start && blockEnd >= run.end) {
            coveringBlocks.add(i);
          }
        }
        for (const bi of compatibleBlockIndices) {
          if (!coveringBlocks.has(bi)) compatibleBlockIndices.delete(bi);
        }
      }

      if (compatibleBlockIndices.size !== 1) continue;
      const [blockIdx] = compatibleBlockIndices;

      // Determine the allowed range for this block across all placements
      let minStart = Infinity;
      let maxStart = -Infinity;
      for (const pl of placements) {
        if (minStart > pl[blockIdx]) minStart = pl[blockIdx];
        if (maxStart < pl[blockIdx]) maxStart = pl[blockIdx];
      }
      const blockLen = clues[blockIdx];
      const minEnd = minStart + blockLen - 1;
      const maxEnd = maxStart + blockLen - 1;

      // Cells outside [minStart, maxEnd] cannot be FILLED for this block
      const concluded = [];
      const observed = cells.slice(run.start, run.end + 1);

      for (let p = Math.max(0, maxStart - 1); p >= 0; p--) {
        if (line[p] === CELL_STATES.UNKNOWN) {
          if (p < minStart) {
            eliminate(cells[p]);
            concluded.push(cells[p]);
            progressed = true;
          }
        }
        if (p < minStart) break;
      }
      for (let p = minEnd + 1; p < len; p++) {
        if (line[p] === CELL_STATES.UNKNOWN) {
          if (p > maxEnd) {
            eliminate(cells[p]);
            concluded.push(cells[p]);
            progressed = true;
          }
        }
        if (p > maxEnd) break;
      }

      if (concluded.length > 0) {
        annotate(makeAnnotation({
          tacticId: 'box-reduction',
          tacticLabel: 'Box Reduction',
          observed,
          concluded,
          conclusionType: 'eliminate',
          explanationText: `${type === 'row' ? 'Row' : 'Column'} ${index}: filled run belongs to clue block ${blockIdx + 1}; cells outside its range eliminated.`
        }));
      }
    }
  }
  return progressed;
}

// ─── Tactic: contradiction-empty ─────────────────────────────────────────────

/**
 * Contradiction-empty: if marking a cell FILLED leaves no consistent placement
 * for the line, mark it EMPTY.
 */
export function tryContradictionEmpty(state) {
  const { rows, cols, rowClues, colClues, getGrid, eliminate, annotate } = state;
  const grid = getGrid();
  let progressed = false;

  for (const { type, index, clues, len } of iterateLines(rows, cols, rowClues, colClues)) {
    const line = extractLine(grid, type, index, rows, cols);
    const cells = cellsForLine(type, index, rows, cols);

    for (let p = 0; p < len; p++) {
      if (line[p] !== CELL_STATES.UNKNOWN) continue;

      // Hypothetically mark FILLED and check if still consistent
      const testLine = line.slice();
      testLine[p] = CELL_STATES.FILLED;
      const compatible = consistentPlacements(clues, testLine);
      if (compatible.length === 0) {
        eliminate(cells[p]);
        progressed = true;
        annotate(makeAnnotation({
          tacticId: 'contradiction-empty',
          tacticLabel: 'Contradiction Empty',
          observed: [cells[p]],
          concluded: [cells[p]],
          conclusionType: 'eliminate',
          explanationText: `${type === 'row' ? 'Row' : 'Column'} ${index} cell (${cells[p].r},${cells[p].c}): marking FILLED leads to no valid placement — must be empty.`
        }));
      }
    }
  }
  return progressed;
}

// ─── Descriptor table ────────────────────────────────────────────────────────

export const NONOGRAM_TACTIC_DESCRIPTORS = [
  {
    id: 'empty-line',
    label: 'Empty Line',
    tier: 1,
    fn: tryEmptyLine
  },
  {
    id: 'full-line',
    label: 'Full Line',
    tier: 1,
    fn: tryFullLine
  },
  {
    id: 'overlap',
    label: 'Overlap',
    tier: 2,
    fn: tryOverlap
  },
  {
    id: 'edge-fill',
    label: 'Edge Fill',
    tier: 2,
    fn: tryEdgeFill
  },
  {
    id: 'box-reduction',
    label: 'Box Reduction',
    tier: 3,
    fn: tryBoxReduction
  },
  {
    id: 'contradiction-empty',
    label: 'Contradiction Empty',
    tier: 3,
    fn: tryContradictionEmpty
  }
];

// ─── Internal line iterator ───────────────────────────────────────────────────

function* iterateLines(rows, cols, rowClues, colClues) {
  for (let r = 0; r < rows; r++) {
    yield { type: 'row', index: r, clues: rowClues[r], len: cols };
  }
  for (let c = 0; c < cols; c++) {
    yield { type: 'col', index: c, clues: colClues[c], len: rows };
  }
}

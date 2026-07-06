/**
 * Nonogram puzzle generator.
 *
 * Generates a random binary grid, derives clues from it, and verifies the
 * puzzle has a unique solution reachable by the deterministic tactics.
 *
 * Exports:
 *   generateNonogram(size, options) → { rowClues, colClues, solution }
 */

import { CELL_STATES, computeCluesForLine, isSolved } from './puzzle-logic.js';
import { makeNonogramInterface } from './game-interface.js';
import { NONOGRAM_TACTIC_DESCRIPTORS } from './tactics.js';

/**
 * Generate a nonogram puzzle.
 *
 * @param {number} size - Grid size (rows = cols = size).
 * @param {Object} options
 * @param {string} [options.difficulty='medium'] - 'easy' | 'medium' | 'hard'
 * @param {number} [options.maxAttempts=200] - Max generation attempts.
 * @returns {{ rowClues: number[][], colClues: number[][], solution: number[][], tier: number } | null}
 *   Returns null when no suitable puzzle found within maxAttempts.
 */
export function generateNonogram(size = 5, options = {}) {
  const { difficulty = 'medium', maxAttempts = 200 } = options;

  // Determine which tactic tiers are allowed based on difficulty
  const maxTier = { easy: 1, medium: 2, hard: 3 }[difficulty] ?? 2;
  const allowedTactics = NONOGRAM_TACTIC_DESCRIPTORS.filter((d) => d.tier <= maxTier);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const solution = generateRandomGrid(size);
    const rowClues = solution.map((row) => computeCluesForLine(row));
    const colClues = Array.from({ length: size }, (_, c) =>
      computeCluesForLine(solution.map((row) => row[c]))
    );

    const result = trySolveWithTactics(rowClues, colClues, allowedTactics);
    if (result.solved) {
      return {
        rowClues,
        colClues,
        solution,
        tier: maxTier
      };
    }
  }

  return null;
}

/**
 * Attempt to solve a nonogram using only the specified tactics.
 * Returns { solved: boolean }.
 */
export function trySolveWithTactics(rowClues, colClues, tactics) {
  const state = makeNonogramInterface(rowClues, colClues);

  let changed = true;
  let iterations = 0;
  const maxIterations = 1000;

  while (changed && !state.isDone() && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (const tactic of tactics) {
      if (tactic.fn(state)) {
        changed = true;
        break; // restart from first tactic
      }
    }
  }

  return { solved: state.isDone() };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function generateRandomGrid(size) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      Math.random() < 0.5 ? CELL_STATES.FILLED : CELL_STATES.EMPTY
    )
  );
}

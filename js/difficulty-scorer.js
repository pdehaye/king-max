import {
  deterministicStepWeight,
  normalizeDifficultyWeights
} from './difficulty-weights.js';

/**
 * A single step recorded during a solve pass.
 *
 * @typedef {Object} TraceStep
 * @property {string} tacticId          - Tactic identifier (e.g. 'hidden-singles') or 'guess'.
 * @property {number} tier              - Solver tier (1 = trivial … 4 = guess-and-check).
 * @property {number} observedConstraints - Number of constraints observed by this step.
 */

/**
 * Scores a solve trace against a set of difficulty weights.
 *
 * This function is game-agnostic: any game that records its solve steps as
 * `{ tacticId, tier, observedConstraints }` objects can use it to compute a
 * reproducible difficulty score under arbitrary weight sets.
 *
 * @param {TraceStep[]} trace   - Ordered list of steps produced during a solve.
 * @param {Object}      weights - Difficulty weights (same shape as DEFAULT_DIFFICULTY_WEIGHTS).
 * @returns {{ score: number, maxTier: number, steps: TraceStep[] }}
 */
export function scoreSolveTrace(trace, weights) {
  const w = normalizeDifficultyWeights(weights);
  let score = 0;
  let maxTier = 0;

  for (const step of trace) {
    if (step.tier === 4) {
      score += w.guess;
    } else {
      score += deterministicStepWeight(w, step.tacticId, step.observedConstraints);
    }
    if (step.tier > maxTier) maxTier = step.tier;
  }

  return { score, maxTier, steps: trace };
}

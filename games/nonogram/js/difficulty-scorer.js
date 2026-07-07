/**
 * Nonogram difficulty scoring based on deterministic tactic trace.
 *
 * Trace steps are expected in the shape:
 * { tacticId: string, tier: number, observedConstraints: number }
 */

import {
  DEFAULT_NONOGRAM_DIFFICULTY_WEIGHTS,
  nonogramStepWeight,
  normalizeNonogramDifficultyWeights
} from './difficulty-weights.js';

export const NONOGRAM_TIER_LABELS = Object.freeze({
  1: 'pure line logic',
  2: 'needs overlap/edge logic',
  3: 'needs advanced deductions'
});

/**
 * Score a deterministic nonogram solve trace.
 *
 * Tier weights are intentionally spaced so higher-tier deductions dominate.
 * Observed constraints add a small bonus when steps require broader context.
 */
export function scoreNonogramTrace(trace, weights = DEFAULT_NONOGRAM_DIFFICULTY_WEIGHTS) {
  const safeWeights = normalizeNonogramDifficultyWeights(weights);

  let score = 0;
  let maxTier = 0;

  for (const step of trace) {
    const tier = Number.isInteger(step?.tier) ? step.tier : 1;
    const observed = Number.isInteger(step?.observedConstraints) ? step.observedConstraints : 1;
    score += nonogramStepWeight(safeWeights, step?.tacticId) + Math.max(0, observed - 1);
    if (tier > maxTier) maxTier = tier;
  }

  return {
    score,
    maxTier: Math.max(1, maxTier)
  };
}

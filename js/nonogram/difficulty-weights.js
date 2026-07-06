export const DEFAULT_NONOGRAM_DIFFICULTY_WEIGHTS = {
  deterministic: {
    'empty-line': 1,
    'full-line': 1,
    overlap: 4,
    'edge-fill': 5,
    'box-reduction': 9,
    'contradiction-empty': 10
  },
  fallback: 6
};

function cloneDefaultNonogramDifficultyWeights() {
  return {
    deterministic: { ...DEFAULT_NONOGRAM_DIFFICULTY_WEIGHTS.deterministic },
    fallback: DEFAULT_NONOGRAM_DIFFICULTY_WEIGHTS.fallback
  };
}

function toSafeNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return num;
}

export function normalizeNonogramDifficultyWeights(input) {
  const normalized = cloneDefaultNonogramDifficultyWeights();
  if (!input || typeof input !== 'object') return normalized;

  if (input.deterministic && typeof input.deterministic === 'object') {
    for (const tacticId of Object.keys(normalized.deterministic)) {
      normalized.deterministic[tacticId] = toSafeNumber(
        input.deterministic[tacticId],
        normalized.deterministic[tacticId]
      );
    }
  }

  normalized.fallback = toSafeNumber(input.fallback, normalized.fallback);

  return normalized;
}

export function nonogramStepWeight(weights, tacticId) {
  const safe = normalizeNonogramDifficultyWeights(weights);
  if (Object.prototype.hasOwnProperty.call(safe.deterministic, tacticId)) {
    return safe.deterministic[tacticId];
  }
  return safe.fallback;
}

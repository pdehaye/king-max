export const DEFAULT_DIFFICULTY_WEIGHTS = {
  deterministic: {
    'hidden-singles': { 1: 1 },
    'locked-candidates': { 1: 2 },
    subsets: { 2: 25, 3: 40, 4: 85 },
    'excluded-neighbour-twins': { 1: 3 },
    'excluded-neighbour-two': { 1: 4 },
    'excluded-neighbour-three': { 1: 5 },
    'excluded-neighbour-four': { 1: 6 },
    'coupled-region-pairs-two': { 2: 25 }
  },
  byRegions: {
    1: 9,
    2: 25,
    3: 40,
    4: 85,
    other: 100
  },
  guess: 200
};

function cloneDefaultWeights() {
  return {
    deterministic: Object.fromEntries(
      Object.entries(DEFAULT_DIFFICULTY_WEIGHTS.deterministic).map(([id, map]) => [id, { ...map }])
    ),
    byRegions: { ...DEFAULT_DIFFICULTY_WEIGHTS.byRegions },
    guess: DEFAULT_DIFFICULTY_WEIGHTS.guess
  };
}

function toSafeNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return fallback;
  return num;
}

export function normalizeDifficultyWeights(input) {
  const normalized = cloneDefaultWeights();
  if (!input || typeof input !== 'object') return normalized;

  if (input.deterministic && typeof input.deterministic === 'object') {
    for (const [tacticId, defaultMap] of Object.entries(normalized.deterministic)) {
      const nextMap = input.deterministic[tacticId];
      if (!nextMap || typeof nextMap !== 'object') continue;
      for (const key of Object.keys(defaultMap)) {
        const fallback = defaultMap[key];
        defaultMap[key] = toSafeNumber(nextMap[key], fallback);
      }
    }
  }

  if (input.byRegions && typeof input.byRegions === 'object') {
    for (const key of Object.keys(normalized.byRegions)) {
      normalized.byRegions[key] = toSafeNumber(input.byRegions[key], normalized.byRegions[key]);
    }
  }

  normalized.guess = toSafeNumber(input.guess, normalized.guess);

  return normalized;
}

export function deterministicStepWeight(weights, tacticId, observedRegions) {
  const safe = normalizeDifficultyWeights(weights);
  const regionKey = String(observedRegions);
  const tacticMap = safe.deterministic[tacticId] || null;

  if (tacticMap && Object.prototype.hasOwnProperty.call(tacticMap, regionKey)) {
    return tacticMap[regionKey];
  }

  if (Object.prototype.hasOwnProperty.call(safe.byRegions, regionKey)) {
    return safe.byRegions[regionKey];
  }

  return safe.byRegions.other;
}

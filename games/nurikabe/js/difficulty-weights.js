export const DEFAULT_NURIKABE_DIFFICULTY_WEIGHTS = Object.freeze({
  islandCells: 2,
  seaCells: 1,
  clueCount: 6,
  maxIslandSize: 4,
  tinyIslandPenalty: 5
});

export function normalizeNurikabeDifficultyWeights(weights = {}) {
  const merged = {
    ...DEFAULT_NURIKABE_DIFFICULTY_WEIGHTS,
    ...(weights || {})
  };

  return {
    islandCells: Math.max(0, Number(merged.islandCells) || 0),
    seaCells: Math.max(0, Number(merged.seaCells) || 0),
    clueCount: Math.max(0, Number(merged.clueCount) || 0),
    maxIslandSize: Math.max(0, Number(merged.maxIslandSize) || 0),
    tinyIslandPenalty: Math.max(0, Number(merged.tinyIslandPenalty) || 0)
  };
}

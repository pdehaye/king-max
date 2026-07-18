import { normalizeNurikabeDifficultyWeights, DEFAULT_NURIKABE_DIFFICULTY_WEIGHTS } from './difficulty-weights.js';

export const NURIKABE_TIER_LABELS = Object.freeze({
  1: 'gentle',
  2: 'steady',
  3: 'tricky',
  4: 'expert'
});

export function scoreNurikabePuzzle(puzzle, options = {}) {
  const weights = normalizeNurikabeDifficultyWeights(
    options.difficultyWeights || DEFAULT_NURIKABE_DIFFICULTY_WEIGHTS
  );

  const islandCells = puzzle.solution.flat().filter((v) => v === 1).length;
  const seaCells = puzzle.solution.flat().filter((v) => v === 2).length;
  const clueCount = puzzle.clues.length;
  const islandSizes = puzzle.clues.map((clue) => clue.size);
  const maxIslandSize = islandSizes.length ? Math.max(...islandSizes) : 0;
  const tinyIslandCount = islandSizes.filter((n) => n <= 1).length;

  const score = (
    islandCells * weights.islandCells
    + seaCells * weights.seaCells
    + clueCount * weights.clueCount
    + maxIslandSize * weights.maxIslandSize
    - tinyIslandCount * weights.tinyIslandPenalty
  );

  let tier = 1;
  if (score >= 85) tier = 4;
  else if (score >= 65) tier = 3;
  else if (score >= 45) tier = 2;

  return {
    score,
    tier,
    tierLabel: NURIKABE_TIER_LABELS[tier]
  };
}

import {
  generateUniquePuzzle as generateUniquePuzzleFromGenerator,
  tryGenerateCandidate as tryGenerateCandidateFromGenerator
} from './game-generation.js';

export const BOARD_SIZE = 8;

// Tier 1: hidden single
// Tier 2: locked candidates/intersections
// Tier 3: subset reasoning
// Tier 4: guessing/backtracking
export const TIER_LABELS = {
  1: 'pure logic',
  2: 'needs intersections',
  3: 'needs subset reasoning',
  4: 'needs guessing'
};

export function tryGenerateCandidate(){
  return tryGenerateCandidateFromGenerator(BOARD_SIZE);
}

export function generateUniquePuzzle(){
  return generateUniquePuzzleFromGenerator({
    boardSize: BOARD_SIZE,
    candidatesToSample: 4,
    maxTotalAttempts: 1000000
  });
}

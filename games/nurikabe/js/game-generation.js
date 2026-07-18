import { CELL_STATES, evaluateBoard } from './puzzle-logic.js';
import { scoreNurikabePuzzle } from './difficulty-scorer.js';

const I = CELL_STATES.ISLAND;
const S = CELL_STATES.SEA;

const SOLVED_TEMPLATES = [
  {
    id: 'classic-a',
    size: 6,
    rows: [
      '100000',
      '010110',
      '000001',
      '011010',
      '000000',
      '010111'
    ]
  },
  {
    id: 'classic-b',
    size: 6,
    rows: [
      '100000',
      '011101',
      '000000',
      '101101',
      '000000',
      '110110'
    ]
  },
  {
    id: 'classic-c',
    size: 6,
    rows: [
      '111011',
      '000000',
      '011010',
      '010011',
      '001101',
      '110000'
    ]
  }
];

function toGrid(rows) {
  return rows.map((row) =>
    row.split('').map((char) => (char === '1' ? I : S))
  );
}

function orthogonalNeighbors(r, c, size) {
  const out = [];
  if (r > 0) out.push({ r: r - 1, c });
  if (r + 1 < size) out.push({ r: r + 1, c });
  if (c > 0) out.push({ r, c: c - 1 });
  if (c + 1 < size) out.push({ r, c: c + 1 });
  return out;
}

function collectIslandComponents(solution) {
  const size = solution.length;
  const seen = new Set();
  const components = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (solution[r][c] !== I) continue;
      const startKey = `${r},${c}`;
      if (seen.has(startKey)) continue;

      const stack = [{ r, c }];
      const cells = [];
      seen.add(startKey);

      while (stack.length > 0) {
        const cell = stack.pop();
        cells.push(cell);
        for (const nb of orthogonalNeighbors(cell.r, cell.c, size)) {
          const nbKey = `${nb.r},${nb.c}`;
          if (seen.has(nbKey)) continue;
          if (solution[nb.r][nb.c] !== I) continue;
          seen.add(nbKey);
          stack.push(nb);
        }
      }

      components.push(cells);
    }
  }

  return components;
}

function clueFromComponents(components) {
  return components.map((component) => {
    const chosen = component.slice().sort((a, b) => (a.r - b.r) || (a.c - b.c))[0];
    return {
      r: chosen.r,
      c: chosen.c,
      size: component.length
    };
  });
}

function rotateCell(cell, size) {
  return { r: cell.c, c: size - 1 - cell.r };
}

function mirrorCell(cell, size) {
  return { r: cell.r, c: size - 1 - cell.c };
}

function transformPuzzle(base, rotationCount, mirrored) {
  const size = base.size;

  let transformed = {
    size,
    solution: base.solution.map((row) => row.slice()),
    clues: base.clues.map((clue) => ({ ...clue }))
  };

  for (let i = 0; i < rotationCount; i++) {
    const nextSolution = Array.from({ length: size }, () => Array.from({ length: size }, () => S));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = rotateCell({ r, c }, size);
        nextSolution[cell.r][cell.c] = transformed.solution[r][c];
      }
    }
    transformed.solution = nextSolution;
    transformed.clues = transformed.clues.map((clue) => ({ ...rotateCell(clue, size), size: clue.size }));
  }

  if (mirrored) {
    const nextSolution = Array.from({ length: size }, () => Array.from({ length: size }, () => S));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = mirrorCell({ r, c }, size);
        nextSolution[cell.r][cell.c] = transformed.solution[r][c];
      }
    }
    transformed.solution = nextSolution;
    transformed.clues = transformed.clues.map((clue) => ({ ...mirrorCell(clue, size), size: clue.size }));
  }

  return transformed;
}

function makeClueMap(clues) {
  const clueByKey = {};
  for (const clue of clues) {
    clueByKey[`${clue.r},${clue.c}`] = clue;
  }
  return clueByKey;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function buildCandidateFromTemplate(template, rotationCount, mirrored, options) {
  const baseSolution = toGrid(template.rows);
  const baseComponents = collectIslandComponents(baseSolution);
  const basePuzzle = {
    id: template.id,
    size: template.size,
    solution: baseSolution,
    clues: clueFromComponents(baseComponents)
  };

  const transformed = transformPuzzle(basePuzzle, rotationCount, mirrored);

  const puzzle = {
    id: `${template.id}:r${rotationCount}:m${mirrored ? 1 : 0}`,
    size: transformed.size,
    clues: transformed.clues
      .slice()
      .sort((a, b) => (a.r - b.r) || (a.c - b.c))
      .map((clue) => ({ ...clue })),
    solution: transformed.solution
  };

  puzzle.clueByKey = makeClueMap(puzzle.clues);

  const validation = evaluateBoard(puzzle.solution, puzzle, { requireComplete: true });
  if (!validation.valid || !validation.complete) return null;

  const difficulty = scoreNurikabePuzzle(puzzle, options);
  puzzle.difficultyScore = difficulty.score;
  puzzle.difficultyTier = difficulty.tier;
  puzzle.difficultyTierLabel = difficulty.tierLabel;

  return puzzle;
}

export function generateNurikabe(size = 6, options = {}) {
  const matching = SOLVED_TEMPLATES.filter((template) => template.size === size);
  const templates = matching.length ? matching : SOLVED_TEMPLATES;

  for (let attempt = 0; attempt < 32; attempt++) {
    const template = randomChoice(templates);
    const rotationCount = Math.floor(Math.random() * 4);
    const mirrored = Math.random() < 0.5;
    const candidate = buildCandidateFromTemplate(template, rotationCount, mirrored, options);
    if (candidate) return candidate;
  }

  // Deterministic fallback if random transforms somehow all fail.
  const fallback = buildCandidateFromTemplate(templates[0], 0, false, options);
  if (fallback) return fallback;

  throw new Error('Failed to generate a valid Nurikabe puzzle');
}

import { CELL_STATES } from '../js/puzzle-logic.js';
import { renderNurikabeBoard } from '../js/board-visuals.js';
import {
  applyNo2x2Ocean,
  applyFullGrownIsland,
  applyOnlyOneExpansionPath,
  applySeaConnectivityPreservation,
  applyDiagonalClueSeparation,
  applyInaccessible
} from '../js/tactics.js';

const meta = {
  title: 'Nurikabe/Tactics',
  tags: ['autodocs']
};

export default meta;

const U = CELL_STATES.UNKNOWN;
const I = CELL_STATES.ISLAND;
const S = CELL_STATES.SEA;

function makePuzzle(size, clues) {
  const clueByKey = {};
  for (const clue of clues) {
    clueByKey[`${clue.r},${clue.c}`] = clue;
  }

  return {
    size,
    clues,
    clueByKey,
    difficultyScore: 0,
    difficultyTier: 1,
    difficultyTierLabel: 'basic',
    solution: Array.from({ length: size }, () => Array.from({ length: size }, () => U))
  };
}

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function renderBoardSection(label, puzzle, grid) {
  const section = document.createElement('section');

  const heading = document.createElement('h3');
  heading.textContent = label;
  heading.style.margin = '0 0 8px';
  heading.style.fontSize = '12px';
  heading.style.letterSpacing = '0.08em';
  heading.style.textTransform = 'uppercase';
  heading.style.color = '#5B5148';
  section.appendChild(heading);

  const boardWrap = document.createElement('div');
  boardWrap.style.maxWidth = '320px';
  boardWrap.style.border = '1px solid #d9cfb4';
  boardWrap.style.borderRadius = '10px';
  boardWrap.style.overflow = 'hidden';
  section.appendChild(boardWrap);

  renderNurikabeBoard(boardWrap, puzzle, grid, () => {}, () => {});
  return section;
}

function makeTacticStory({ title, description, puzzle, initialGrid, tacticFn }) {
  return {
    name: title,
    render: () => {
      const beforeGrid = cloneGrid(initialGrid);
      const result = tacticFn(cloneGrid(initialGrid), puzzle);
      const afterGrid = result.grid;

      const wrap = document.createElement('div');
      wrap.style.maxWidth = '860px';
      wrap.style.padding = '18px 16px';
      wrap.style.fontFamily = "'Inter', sans-serif";
      wrap.style.color = '#2B2420';

      const heading = document.createElement('h2');
      heading.textContent = title;
      heading.style.margin = '0 0 8px';
      heading.style.fontSize = '28px';
      heading.style.fontFamily = "'Fraunces', serif";
      wrap.appendChild(heading);

      const desc = document.createElement('p');
      desc.textContent = description;
      desc.style.margin = '0 0 12px';
      desc.style.fontSize = '13px';
      desc.style.color = '#5B5148';
      wrap.appendChild(desc);

      const status = document.createElement('p');
      status.textContent = result.message;
      status.style.margin = '0 0 14px';
      status.style.fontSize = '12px';
      status.style.fontStyle = 'italic';
      status.style.color = '#5B5148';
      wrap.appendChild(status);

      const columns = document.createElement('div');
      columns.style.display = 'grid';
      columns.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
      columns.style.gap = '16px';
      wrap.appendChild(columns);

      columns.appendChild(renderBoardSection('Before', puzzle, beforeGrid));
      columns.appendChild(renderBoardSection('After', puzzle, afterGrid));

      return wrap;
    }
  };
}

const NO_2X2_PUZZLE = makePuzzle(3, []);
const NO_2X2_INITIAL_GRID = [
  [S, S, U],
  [S, U, U],
  [U, U, U]
];

const FULL_GROWN_PUZZLE = makePuzzle(4, [{ r: 1, c: 1, size: 2 }]);
const FULL_GROWN_INITIAL_GRID = [
  [U, U, U, U],
  [U, I, I, U],
  [U, U, U, U],
  [U, U, U, U]
];

const ONE_PATH_PUZZLE = makePuzzle(4, [
  { r: 1, c: 1, size: 2 },
  { r: 1, c: 3, size: 1 }
]);
const ONE_PATH_INITIAL_GRID = [
  [U, S, U, U],
  [S, I, U, I],
  [U, U, U, U],
  [U, U, U, U]
];

const SEA_CONNECTIVITY_PUZZLE = makePuzzle(3, []);
const SEA_CONNECTIVITY_INITIAL_GRID = [
  [S, U, S],
  [I, U, I],
  [U, U, U]
];

const DIAGONAL_CLUE_SEPARATION_PUZZLE = makePuzzle(3, [
  { r: 0, c: 0, size: 1 },
  { r: 1, c: 1, size: 1 }
]);
const DIAGONAL_CLUE_SEPARATION_INITIAL_GRID = [
  [I, U, U],
  [U, I, U],
  [U, U, U]
];

const INACCESSIBLE_PUZZLE = makePuzzle(4, [
  { r: 1, c: 1, size: 2 },
  { r: 3, c: 3, size: 1 }
]);
const INACCESSIBLE_INITIAL_GRID = [
  [U, U, U, U],
  [U, I, U, U],
  [U, U, U, U],
  [U, U, U, I]
];

export const No2x2Ocean = makeTacticStory({
  title: 'No 2x2 ocean',
  description: 'If three cells in a 2x2 block are sea, the fourth must be island.',
  puzzle: NO_2X2_PUZZLE,
  initialGrid: NO_2X2_INITIAL_GRID,
  tacticFn: (grid) => applyNo2x2Ocean(grid)
});

export const FullGrownIsland = makeTacticStory({
  title: 'Full grown island',
  description: 'When a clue island reaches its exact size, all orthogonal unknown neighbors become sea.',
  puzzle: FULL_GROWN_PUZZLE,
  initialGrid: FULL_GROWN_INITIAL_GRID,
  tacticFn: (grid, puzzle) => applyFullGrownIsland(grid, puzzle)
});

export const OnlyOneExpansionPath = makeTacticStory({
  title: 'Only one expansion path',
  description: 'If an unfinished clue island has exactly one legal growth cell, that cell is forced island.',
  puzzle: ONE_PATH_PUZZLE,
  initialGrid: ONE_PATH_INITIAL_GRID,
  tacticFn: (grid, puzzle) => applyOnlyOneExpansionPath(grid, puzzle)
});

export const SeaConnectivityPreservation = makeTacticStory({
  title: 'Sea connectivity preservation',
  description: 'If turning an unknown into island would disconnect current sea reachability, that cell is forced sea.',
  puzzle: SEA_CONNECTIVITY_PUZZLE,
  initialGrid: SEA_CONNECTIVITY_INITIAL_GRID,
  tacticFn: (grid, puzzle) => applySeaConnectivityPreservation(grid, puzzle)
});

export const DiagonalClueSeparation = makeTacticStory({
  title: 'Diagonal clue separation',
  description: 'If two clue cells are diagonal neighbors, their shared orthogonal bridge cells are forced sea.',
  puzzle: DIAGONAL_CLUE_SEPARATION_PUZZLE,
  initialGrid: DIAGONAL_CLUE_SEPARATION_INITIAL_GRID,
  tacticFn: (grid, puzzle) => applyDiagonalClueSeparation(grid, puzzle)
});

export const Inaccessible = makeTacticStory({
  title: 'Inaccessible',
  description: 'Unknown cells that cannot be reached by growth from any unfinished island are forced sea.',
  puzzle: INACCESSIBLE_PUZZLE,
  initialGrid: INACCESSIBLE_INITIAL_GRID,
  tacticFn: (grid, puzzle) => applyInaccessible(grid, puzzle)
});

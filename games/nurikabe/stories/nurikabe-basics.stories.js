import { generateNurikabe } from '../js/game-generation.js';
import { createInitialPlayerGrid } from '../js/puzzle-logic.js';
import { renderNurikabeBoard } from '../js/board-visuals.js';

const meta = {
  title: 'Nurikabe/Basics',
  tags: ['autodocs']
};

export default meta;

export const GeneratedPuzzle = {
  name: 'Generated Puzzle',
  render: () => {
    const puzzle = generateNurikabe(6);
    const grid = createInitialPlayerGrid(puzzle);

    const wrap = document.createElement('div');
    wrap.style.maxWidth = '560px';
    wrap.style.margin = '20px auto';
    wrap.style.padding = '16px';
    wrap.style.fontFamily = "'Inter', sans-serif";

    const title = document.createElement('h2');
    title.textContent = 'Nurikabe generated puzzle';
    title.style.margin = '0 0 8px';
    wrap.appendChild(title);

    const info = document.createElement('p');
    info.textContent = `Difficulty ${Math.round(puzzle.difficultyScore)} (${puzzle.difficultyTierLabel})`;
    info.style.margin = '0 0 12px';
    wrap.appendChild(info);

    const board = document.createElement('div');
    board.style.maxWidth = '420px';
    board.style.aspectRatio = '1 / 1';
    board.style.border = '1px solid #d9cfb4';
    board.style.borderRadius = '10px';
    board.style.overflow = 'hidden';
    wrap.appendChild(board);

    renderNurikabeBoard(board, puzzle, grid, () => {}, () => {});
    return wrap;
  }
};

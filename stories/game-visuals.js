import { BOARD_SIZE } from '../js/king-max/puzzle-logic.js';
import { applyRegionBorders, crownSVGMarkup, regionColor } from '../js/king-max/board-visuals.js';

function defaultRegions() {
  const regions = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(0));
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      regions[r][c] = Math.floor(r / 2) * 4 + Math.floor(c / 2);
    }
  }
  return regions;
}

function regionIdAt(regions, r, c) {
  if (!regions || !regions[r] || !Number.isInteger(regions[r][c])) {
    return Math.floor(r / 2) * 4 + Math.floor(c / 2);
  }
  return regions[r][c];
}

export function around(r, c) {
  const set = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        set.add(`${nr},${nc}`);
      }
    }
  }
  set.delete(`${r},${c}`);
  return set;
}

export function renderGameVisualStory({ caption, note, cells, regions }) {
  const regionMap = regions || defaultRegions();

  const wrap = document.createElement('div');
  wrap.style.maxWidth = '520px';

  const title = document.createElement('h3');
  title.textContent = caption;
  title.style.margin = '0 0 8px';
  title.style.fontFamily = "'Fraunces', serif";
  title.style.fontSize = '22px';
  wrap.appendChild(title);

  if (note) {
    const description = document.createElement('p');
    description.textContent = note;
    description.style.margin = '0 0 12px';
    description.style.fontFamily = "'Inter', sans-serif";
    description.style.fontSize = '13px';
    description.style.color = '#5B5148';
    wrap.appendChild(description);
  }

  const frame = document.createElement('div');
  frame.className = 'board-frame';
  frame.style.padding = '10px';
  frame.style.maxWidth = '350px';

  const board = document.createElement('div');
  board.className = 'story-board-grid';
  board.style.display = 'grid';
  board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${BOARD_SIZE}, 1fr)`;
  board.style.width = '320px';
  board.style.aspectRatio = '1/1';
  board.style.borderRadius = '4px';
  board.style.overflow = 'hidden';

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const key = `${r},${c}`;
      const mode = cells[key] || 'empty';
      const cell = document.createElement('div');
      const region = regionIdAt(regionMap, r, c);
      cell.className = 'cell';
      cell.style.background = regionColor(region);
      cell.style.opacity = '0.85';
      applyRegionBorders(cell, r, c, BOARD_SIZE, (row, col) => regionIdAt(regionMap, row, col));

      if (mode === 'crown') {
        cell.innerHTML = crownSVGMarkup();
      } else if (mode === 'dot' || mode === 'blocked') {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (mode === 'blocked') dot.style.opacity = '0.6';
        cell.appendChild(dot);
      } else if (mode === 'candidate') {
        cell.style.boxShadow = 'inset 0 0 0 2px var(--teal)';
      }

      board.appendChild(cell);
    }
  }

  frame.appendChild(board);
  wrap.appendChild(frame);
  return wrap;
}

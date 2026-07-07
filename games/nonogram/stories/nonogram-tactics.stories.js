/**
 * Storybook stories for Nonogram deterministic tactics.
 * One story per tactic, showing the board before and after the tactic fires,
 * with annotation overlay.
 */

import { CELL_STATES } from '../js/puzzle-logic.js';
import { makeNonogramInterface } from '../js/game-interface.js';
import {
  tryFullLine,
  tryEmptyLine,
  tryOverlap,
  tryEdgeFill,
  tryBoxReduction,
  tryContradictionEmpty
} from '../js/tactics.js';
import { renderNonogramBoard, updateCell, refreshClueHighlights } from '../js/board-visuals.js';
import { nonogramExamples } from './generated/nonogram-examples.generated.js';

const meta = {
  title: 'Nonogram/Tactics',
  tags: ['autodocs']
};
export default meta;

// ── Shared story factory ──────────────────────────────────────────────────────

function makeTacticStory({ tacticLabel, description, rowClues, colClues, initialGrid, tacticFn }) {
  return {
    name: tacticLabel,
    render: () => {
      const wrap = document.createElement('div');
      wrap.style.maxWidth = '600px';
      wrap.style.padding = '24px 16px';
      wrap.style.fontFamily = "'Inter', sans-serif";
      wrap.style.color = 'var(--ink, #2B2420)';

      const heading = document.createElement('h2');
      heading.textContent = tacticLabel;
      heading.style.margin = '0 0 4px';
      heading.style.fontFamily = "'Fraunces', serif";
      heading.style.fontSize = '28px';
      wrap.appendChild(heading);

      const desc = document.createElement('p');
      desc.textContent = description;
      desc.style.margin = '0 0 18px';
      desc.style.fontSize = '13px';
      desc.style.color = 'var(--ink-soft, #5B5148)';
      wrap.appendChild(desc);

      const cols2 = document.createElement('div');
      cols2.style.display = 'flex';
      cols2.style.gap = '32px';
      cols2.style.flexWrap = 'wrap';
      wrap.appendChild(cols2);

      // Before board
      const beforeSection = makeSection('Before');
      const beforeGrid = initialGrid.map((row) => row.slice());
      const beforeBoard = document.createElement('div');
      beforeBoard.style.position = 'relative';
      renderNonogramBoard(beforeBoard, rowClues, colClues, beforeGrid);
      beforeSection.appendChild(beforeBoard);
      cols2.appendChild(beforeSection);

      // After board — apply tactic
      const afterSection = makeSection('After');
      const afterGrid = initialGrid.map((row) => row.slice());
      const afterBoard = document.createElement('div');
      afterBoard.style.position = 'relative';
      const state = makeNonogramInterface(rowClues, colClues);
      // Pre-fill known cells from initialGrid
      for (let r = 0; r < afterGrid.length; r++) {
        for (let c = 0; c < afterGrid[r].length; c++) {
          if (afterGrid[r][c] === CELL_STATES.FILLED) state.place({ r, c }, 1);
          else if (afterGrid[r][c] === CELL_STATES.EMPTY) state.eliminate({ r, c });
        }
      }
      tacticFn(state);
      const resultGrid = state.getGrid();
      const refs = renderNonogramBoard(afterBoard, rowClues, colClues, resultGrid);
      refreshClueHighlights(refs.cellEls, refs.clueRowEls, refs.clueColEls, resultGrid, rowClues, colClues);

      // Show annotation
      const annotations = state.getAnnotations();
      if (annotations.length > 0) {
        renderAnnotationOverlay(afterBoard, annotations[0]);
      }

      afterSection.appendChild(afterBoard);

      const annBox = document.createElement('div');
      annBox.style.marginTop = '10px';
      annBox.style.fontSize = '12px';
      annBox.style.color = 'var(--ink-soft, #5B5148)';
      annBox.style.maxWidth = '240px';
      if (annotations.length > 0) {
        annBox.textContent = annotations[0].explanationText;
      } else {
        annBox.textContent = '(Tactic did not fire on this example.)';
        annBox.style.fontStyle = 'italic';
      }
      afterSection.appendChild(annBox);

      cols2.appendChild(afterSection);

      return wrap;
    }
  };
}

function makeSection(title) {
  const sec = document.createElement('div');
  const h = document.createElement('h3');
  h.textContent = title;
  h.style.margin = '0 0 8px';
  h.style.fontSize = '13px';
  h.style.fontWeight = '600';
  h.style.color = 'var(--ink-soft, #5B5148)';
  h.style.textTransform = 'uppercase';
  h.style.letterSpacing = '0.08em';
  sec.appendChild(h);
  return sec;
}

// Inline annotation overlay renderer (no import from annotation-renderer to keep story self-contained)
function renderAnnotationOverlay(boardEl, annotation) {
  const container = document.createElement('div');
  container.className = 'annotation-overlay-container';
  container.style.position = 'absolute';
  container.style.inset = '0';
  container.style.pointerEvents = 'none';

  const cells = boardEl.querySelectorAll('.nonogram-cell');
  for (const cell of cells) {
    const r = parseInt(cell.getAttribute('data-r'), 10);
    const c = parseInt(cell.getAttribute('data-c'), 10);

    const isObserved = annotation.observed.some((o) => o.r === r && o.c === c);
    const isConcluded = annotation.concluded.some((o) => o.r === r && o.c === c);

    if (isObserved || isConcluded) {
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.inset = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '5';
      overlay.style.borderRadius = '2px';

      if (isConcluded) {
        const color = annotation.conclusionType === 'place' ? 'rgba(0,200,80,0.45)' : 'rgba(220,60,60,0.45)';
        overlay.style.background = color;
        overlay.style.boxShadow = `inset 0 0 0 2px ${annotation.conclusionType === 'place' ? '#00c850' : '#dc3c3c'}`;
      } else {
        overlay.style.background = 'rgba(255,200,0,0.3)';
      }

      cell.style.position = 'relative';
      cell.appendChild(overlay);
    }
  }

  boardEl.appendChild(container);
  return () => container.remove();
}

// ─── Story: Empty Line ────────────────────────────────────────────────────────

const U = CELL_STATES.UNKNOWN;
const F = CELL_STATES.FILLED;
const E = CELL_STATES.EMPTY;

function generatedScenario(tacticId, fallback) {
  const examples = nonogramExamples[tacticId];
  if (!Array.isArray(examples) || examples.length === 0) return fallback;
  const pick = examples[0];
  return {
    rowClues: pick.rowClues,
    colClues: pick.colClues,
    initialGrid: pick.beforeGrid
  };
}

const EMPTY_LINE_SCENARIO = generatedScenario('empty-line', {
  rowClues: [[0], [2], [1], [0], [3]],
  colClues: [[1], [2], [1], [1], [1]],
  initialGrid: [
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U]
  ]
});

export const EmptyLine = makeTacticStory({
  tacticLabel: 'Empty Line',
  description: 'When all clues for a row or column are zero, every cell in that line must be empty.',
  rowClues: EMPTY_LINE_SCENARIO.rowClues,
  colClues: EMPTY_LINE_SCENARIO.colClues,
  initialGrid: EMPTY_LINE_SCENARIO.initialGrid,
  tacticFn: tryEmptyLine
});

// ─── Story: Full Line ─────────────────────────────────────────────────────────

const FULL_LINE_SCENARIO = generatedScenario('full-line', {
  rowClues: [[1, 1, 1], [5], [2, 2], [1, 3], [5]],
  colClues: [[2], [1, 1], [1, 2], [2, 1], [1, 1]],
  initialGrid: [
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U]
  ]
});

export const FullLine = makeTacticStory({
  tacticLabel: 'Full Line',
  description: 'When the sum of clues + gaps exactly equals the line length, every cell\'s state is fully determined.',
  rowClues: FULL_LINE_SCENARIO.rowClues,
  colClues: FULL_LINE_SCENARIO.colClues,
  initialGrid: FULL_LINE_SCENARIO.initialGrid,
  tacticFn: tryFullLine
});

// ─── Story: Overlap ───────────────────────────────────────────────────────────

const OVERLAP_SCENARIO = generatedScenario('overlap', {
  rowClues: [[3], [1, 1], [4], [2], [1, 2]],
  colClues: [[2], [3], [1, 1], [2], [2]],
  initialGrid: [
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U]
  ]
});

export const Overlap = makeTacticStory({
  tacticLabel: 'Overlap',
  description: 'Cells that are filled in every possible valid placement of the clue blocks can be marked filled immediately.',
  rowClues: OVERLAP_SCENARIO.rowClues,
  colClues: OVERLAP_SCENARIO.colClues,
  initialGrid: OVERLAP_SCENARIO.initialGrid,
  tacticFn: tryOverlap
});

// ─── Story: Edge Fill ─────────────────────────────────────────────────────────

const EDGE_FILL_SCENARIO = generatedScenario('edge-fill', {
  rowClues: [[3], [2], [4], [1], [2]],
  colClues: [[2], [3], [1], [3], [1]],
  initialGrid: [
    [F, U, U, U, U],
    [U, U, F, U, U],
    [U, U, U, U, F],
    [U, U, U, U, U],
    [F, U, U, U, U]
  ]
});

export const EdgeFill = makeTacticStory({
  tacticLabel: 'Edge Fill',
  description: 'When a clue block touches the edge of the line, additional cells from that edge inward must be filled.',
  rowClues: EDGE_FILL_SCENARIO.rowClues,
  colClues: EDGE_FILL_SCENARIO.colClues,
  initialGrid: EDGE_FILL_SCENARIO.initialGrid,
  tacticFn: tryEdgeFill
});

// ─── Story: Box Reduction ─────────────────────────────────────────────────────

const BOX_REDUCTION_SCENARIO = generatedScenario('box-reduction', {
  rowClues: [[4], [1, 1], [3], [2], [1, 2]],
  colClues: [[2], [3], [1, 1], [2], [2]],
  initialGrid: [
    [U, F, F, U, U],
    [U, U, U, U, U],
    [U, U, F, F, U],
    [U, U, U, U, U],
    [U, U, U, U, U]
  ]
});

export const BoxReduction = makeTacticStory({
  tacticLabel: 'Box Reduction',
  description: 'A contiguous run of filled cells that can only belong to one clue block lets us eliminate cells outside that block\'s valid range.',
  rowClues: BOX_REDUCTION_SCENARIO.rowClues,
  colClues: BOX_REDUCTION_SCENARIO.colClues,
  initialGrid: BOX_REDUCTION_SCENARIO.initialGrid,
  tacticFn: tryBoxReduction
});

// ─── Story: Contradiction Empty ───────────────────────────────────────────────

const CONTRADICTION_EMPTY_SCENARIO = generatedScenario('contradiction-empty', {
  rowClues: [[1, 1], [2], [1], [2], [1, 1]],
  colClues: [[2], [1], [2], [1], [2]],
  initialGrid: [
    [U, U, U, U, U],
    [U, F, F, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U],
    [U, U, U, U, U]
  ]
});

export const ContradictionEmpty = makeTacticStory({
  tacticLabel: 'Contradiction Empty',
  description: 'If marking a cell filled would leave no valid placement for the line, that cell must be empty.',
  rowClues: CONTRADICTION_EMPTY_SCENARIO.rowClues,
  colClues: CONTRADICTION_EMPTY_SCENARIO.colClues,
  initialGrid: CONTRADICTION_EMPTY_SCENARIO.initialGrid,
  tacticFn: tryContradictionEmpty
});

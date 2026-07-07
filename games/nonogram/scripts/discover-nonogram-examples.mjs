import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { generateNonogram } from '../js/game-generation.js';
import { makeNonogramInterface } from '../js/game-interface.js';
import { NONOGRAM_TACTIC_DESCRIPTORS } from '../js/tactics.js';
import { CELL_STATES } from '../js/puzzle-logic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outFile = path.join(rootDir, 'stories/generated/nonogram-examples.generated.js');

const TARGET_PER_TACTIC = 8;
const MAX_PUZZLE_ATTEMPTS = 1800;
const MAX_STEPS_PER_PUZZLE = 1000;
const PUZZLE_SIZES = [5, 6, 7, 8];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

const SEED_SCENARIOS = {
  'edge-fill': [
    {
      rowClues: [[3], [0], [0], [0], [0]],
      colClues: [[1], [1], [1], [0], [0]],
      beforeGrid: [
        [CELL_STATES.FILLED, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN]
      ]
    },
    {
      rowClues: [[0], [3], [0], [0], [0]],
      colClues: [[0], [0], [1], [1], [1]],
      beforeGrid: [
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.FILLED],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN]
      ]
    },
    {
      rowClues: [[1], [1], [1], [1], [1]],
      colClues: [[0], [0], [5], [0], [0]],
      beforeGrid: [
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.FILLED, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN]
      ]
    },
    {
      rowClues: [[1], [1], [1], [1], [1]],
      colClues: [[0], [0], [0], [0], [4]],
      beforeGrid: [
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.FILLED]
      ]
    }
  ],
  'contradiction-empty': [
    {
      rowClues: [[1], [0], [0], [0], [0]],
      colClues: [[1], [0], [0], [0], [0]],
      beforeGrid: [
        [CELL_STATES.FILLED, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN]
      ]
    },
    {
      rowClues: [[0], [0], [2], [0], [0]],
      colClues: [[1], [1], [0], [0], [0]],
      beforeGrid: [
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.FILLED, CELL_STATES.FILLED, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN]
      ]
    },
    {
      rowClues: [[0], [0], [0], [0], [1]],
      colClues: [[0], [0], [0], [0], [1]],
      beforeGrid: [
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.FILLED]
      ]
    },
    {
      rowClues: [[0], [1], [0], [0], [0]],
      colClues: [[0], [1], [0], [0], [0]],
      beforeGrid: [
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.FILLED, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN],
        [CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN, CELL_STATES.UNKNOWN]
      ]
    }
  ]
};

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function countState(grid, target) {
  let total = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === target) total++;
    }
  }
  return total;
}

function getMetrics(beforeGrid, afterGrid) {
  let changedCells = 0;
  for (let r = 0; r < beforeGrid.length; r++) {
    for (let c = 0; c < beforeGrid[r].length; c++) {
      if (beforeGrid[r][c] !== afterGrid[r][c]) changedCells++;
    }
  }

  return {
    changedCells,
    filledDelta: Math.max(0, countState(afterGrid, CELL_STATES.FILLED) - countState(beforeGrid, CELL_STATES.FILLED)),
    emptyDelta: Math.max(0, countState(afterGrid, CELL_STATES.EMPTY) - countState(beforeGrid, CELL_STATES.EMPTY))
  };
}

function meetsQualityThreshold(tacticId, metrics, annotation) {
  if (!annotation) return false;
  if (metrics.changedCells <= 0) return false;

  if (tacticId === 'empty-line') return metrics.emptyDelta >= 1;
  if (tacticId === 'full-line') return metrics.changedCells >= 2;
  if (tacticId === 'overlap') return metrics.changedCells >= 1;
  if (tacticId === 'edge-fill') return metrics.changedCells >= 1;
  if (tacticId === 'box-reduction') return metrics.emptyDelta >= 1;
  if (tacticId === 'contradiction-empty') return metrics.emptyDelta >= 1;
  return true;
}

async function loadExistingExamples() {
  try {
    const mod = await import(`${pathToFileURL(outFile).href}?cacheBust=${Date.now()}`);
    const fromFile = mod.nonogramExamples || {};
    const normalized = {};
    for (const tactic of NONOGRAM_TACTIC_DESCRIPTORS) {
      normalized[tactic.id] = Array.isArray(fromFile[tactic.id]) ? fromFile[tactic.id] : [];
    }
    return normalized;
  } catch {
    const empty = {};
    for (const tactic of NONOGRAM_TACTIC_DESCRIPTORS) empty[tactic.id] = [];
    return empty;
  }
}

function allTargetsSatisfied(examplesByTactic) {
  return NONOGRAM_TACTIC_DESCRIPTORS.every((tactic) => examplesByTactic[tactic.id].length >= TARGET_PER_TACTIC);
}

function serializeExamples(examplesByTactic) {
  return `// Generated by games/nonogram/scripts/discover-nonogram-examples.mjs\nexport const nonogramExamples = ${JSON.stringify(examplesByTactic, null, 2)};\n`;
}

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function seedScenarioForTactic(examplesByTactic, tactic, scenario) {
  const state = makeNonogramInterface(scenario.rowClues, scenario.colClues);
  for (let r = 0; r < scenario.beforeGrid.length; r++) {
    for (let c = 0; c < scenario.beforeGrid[r].length; c++) {
      const value = scenario.beforeGrid[r][c];
      if (value === CELL_STATES.FILLED) state.place({ r, c }, 1);
      if (value === CELL_STATES.EMPTY) state.eliminate({ r, c });
    }
  }

  const beforeGrid = cloneGrid(state.getGrid());
  const previousAnnotationCount = state.getAnnotations().length;
  const changed = tactic.fn(state);
  if (!changed) return false;

  const afterGrid = cloneGrid(state.getGrid());
  const newAnnotations = state.getAnnotations().slice(previousAnnotationCount);
  const annotation = newAnnotations.find((candidate) => candidate?.tacticId === tactic.id) || newAnnotations[0] || null;
  const metrics = getMetrics(beforeGrid, afterGrid);
  if (!meetsQualityThreshold(tactic.id, metrics, annotation)) return false;

  examplesByTactic[tactic.id].push({
    rowClues: scenario.rowClues,
    colClues: scenario.colClues,
    beforeGrid,
    metrics,
    annotation: annotation
      ? {
          tacticId: annotation.tacticId,
          tacticLabel: annotation.tacticLabel,
          explanationText: annotation.explanationText,
          conclusionType: annotation.conclusionType
        }
      : null
  });

  return true;
}

async function main() {
  const examplesByTactic = await loadExistingExamples();

  for (const tactic of NONOGRAM_TACTIC_DESCRIPTORS) {
    const seeds = SEED_SCENARIOS[tactic.id] || [];
    while (examplesByTactic[tactic.id].length < TARGET_PER_TACTIC && seeds.length > 0) {
      let addedAny = false;
      for (const scenario of seeds) {
        if (examplesByTactic[tactic.id].length >= TARGET_PER_TACTIC) break;
        addedAny = seedScenarioForTactic(examplesByTactic, tactic, scenario) || addedAny;
      }
      if (!addedAny) break;
    }
  }

  let attempts = 0;
  while (!allTargetsSatisfied(examplesByTactic) && attempts < MAX_PUZZLE_ATTEMPTS) {
    attempts++;

    const size = randomOf(PUZZLE_SIZES);
    const difficulty = randomOf(DIFFICULTIES);
    const puzzle = generateNonogram(size, { difficulty, maxAttempts: 80 });
    if (!puzzle) continue;

    const state = makeNonogramInterface(puzzle.rowClues, puzzle.colClues);

    let steps = 0;
    while (steps < MAX_STEPS_PER_PUZZLE && !state.isDone()) {
      steps++;
      let progressed = false;

      for (const tactic of NONOGRAM_TACTIC_DESCRIPTORS) {
        const beforeGrid = cloneGrid(state.getGrid());
        const previousAnnotationCount = state.getAnnotations().length;

        const changed = tactic.fn(state);
        if (!changed) continue;

        progressed = true;
        const afterGrid = cloneGrid(state.getGrid());
        const newAnnotations = state.getAnnotations().slice(previousAnnotationCount);
        const annotation = newAnnotations.find((candidate) => candidate?.tacticId === tactic.id) || newAnnotations[0] || null;

        if (examplesByTactic[tactic.id].length < TARGET_PER_TACTIC) {
          const metrics = getMetrics(beforeGrid, afterGrid);
          if (meetsQualityThreshold(tactic.id, metrics, annotation)) {
            examplesByTactic[tactic.id].push({
              rowClues: puzzle.rowClues,
              colClues: puzzle.colClues,
              beforeGrid,
              metrics,
              annotation: annotation
                ? {
                    tacticId: annotation.tacticId,
                    tacticLabel: annotation.tacticLabel,
                    explanationText: annotation.explanationText,
                    conclusionType: annotation.conclusionType
                  }
                : null
            });
          }
        }

        // Mimic in-game deterministic solve order.
        break;
      }

      if (!progressed) break;
    }
  }

  for (const tactic of NONOGRAM_TACTIC_DESCRIPTORS) {
    examplesByTactic[tactic.id] = examplesByTactic[tactic.id].slice(0, TARGET_PER_TACTIC);
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, serializeExamples(examplesByTactic), 'utf8');

  const report = NONOGRAM_TACTIC_DESCRIPTORS
    .map((tactic) => `${tactic.label}: ${examplesByTactic[tactic.id].length}/${TARGET_PER_TACTIC}`)
    .join(' | ');

  console.log(`Nonogram example discovery complete after ${attempts} puzzle attempts.`);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

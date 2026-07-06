import { DETERMINISTIC_TACTIC_DESCRIPTORS } from './deterministic-tactics.js';
import {
  DEFAULT_DIFFICULTY_WEIGHTS,
  deterministicStepWeight,
  normalizeDifficultyWeights
} from './difficulty-weights.js';

const ONE_REGION_DIFFICULTY_ORDER = [
  'hidden-singles',
  'locked-candidates',
  'excluded-neighbour-twins',
  'excluded-neighbour-two',
  'excluded-neighbour-three',
  'excluded-neighbour-four'
];

function scoreForDeterministicStep(weights, tacticId, observedRegions) {
  if (observedRegions <= 1) {
    const idx = ONE_REGION_DIFFICULTY_ORDER.indexOf(tacticId);
    if (idx >= 0 && tacticId !== 'hidden-singles') {
      return deterministicStepWeight(weights, tacticId, 1);
    }
  }
  return deterministicStepWeight(weights, tacticId, observedRegions);
}

function tierForDeterministicStep(tacticId, observedRegions) {
  if (tacticId === 'hidden-singles') return 1;
  if (observedRegions <= 1) return 2;
  return 3;
}

export function humanSolve(n, region, options = {}) {
  const difficultyWeights = normalizeDifficultyWeights(options.difficultyWeights || DEFAULT_DIFFICULTY_WEIGHTS);
  let possible = Array.from({ length: n }, () => new Array(n).fill(true));
  let placedCount = 0;
  let rowDone = new Array(n).fill(false);
  let colDone = new Array(n).fill(false);
  let regionDone = new Array(n).fill(false);
  let score = 0;
  let maxTier = 0;
  let lastObservedRegions = null;
  const trace = [];

  function candidatesInRow(r) { const a = []; for (let c = 0; c < n; c++) if (possible[r][c]) a.push(c); return a; }
  function candidatesInCol(c) { const a = []; for (let r = 0; r < n; r++) if (possible[r][c]) a.push(r); return a; }
  function candidatesInRegion(reg) { const a = []; for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (region[r][c] === reg && possible[r][c]) a.push({ r, c }); return a; }

  function eliminateForQueen(r, c) {
    const reg = region[r][c];
    for (let i = 0; i < n; i++) {
      possible[r][i] = false;
      possible[i][c] = false;
    }
    for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) if (region[rr][cc] === reg) possible[rr][cc] = false;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n) possible[nr][nc] = false;
    }
    rowDone[r] = true;
    colDone[c] = true;
    regionDone[reg] = true;
  }

  function placeQueen(r, c, tier) {
    placedCount++;
    eliminateForQueen(r, c);
  }

  // --- GameInterface implementation ---

  function candidatesAt(constraint) {
    const { type, index } = constraint;
    if (type === 'row') {
      return candidatesInRow(index).map((c) => ({ r: index, c }));
    }
    if (type === 'col') {
      return candidatesInCol(index).map((r) => ({ r, c: index }));
    }
    return candidatesInRegion(index);
  }

  function constraints() {
    const result = [];
    for (let r = 0; r < n; r++) if (!rowDone[r]) result.push({ type: 'row', index: r });
    for (let c = 0; c < n; c++) if (!colDone[c]) result.push({ type: 'col', index: c });
    for (let reg = 0; reg < n; reg++) if (!regionDone[reg]) result.push({ type: 'region', index: reg });
    return result;
  }

  function eliminate(cell) {
    if (possible[cell.r][cell.c]) {
      possible[cell.r][cell.c] = false;
      return true;
    }
    return false;
  }

  function regionOf(cell) {
    return region[cell.r][cell.c];
  }

  // ---

  const ctx = {
    n,
    candidatesAt,
    constraints,
    place: (cell, tier) => placeQueen(cell.r, cell.c, tier),
    isDone: () => placedCount === n,
    stateSnapshot: () => snapshot(),
    eliminate,
    regionOf,
    // Kept for backward compatibility and internal use
    placeQueen,
    getScore: () => score,
    setScore: (next) => { score = next; },
    getMaxTier: () => maxTier,
    setMaxTier: (next) => { maxTier = next; },
    setLastObservedRegions: (next) => { lastObservedRegions = next; },
    getLastObservedRegions: () => lastObservedRegions
  };

  function propagate() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const tactic of DETERMINISTIC_TACTIC_DESCRIPTORS) {
        lastObservedRegions = null;
        if (tactic.apply(ctx)) {
          const observedRegions = lastObservedRegions ?? tactic.regionsObserved?.min ?? 1;
          score += scoreForDeterministicStep(difficultyWeights, tactic.id, observedRegions);
          const stepTier = tierForDeterministicStep(tactic.id, observedRegions);
          if (stepTier > maxTier) maxTier = stepTier;
          trace.push({ tacticId: tactic.id, tier: stepTier, observedConstraints: observedRegions });
          changed = true;
          break;
        }
      }
    }
  }
  propagate();

  function isSolved() { return placedCount === n; }
  function isContradiction() {
    for (let r = 0; r < n; r++) if (!rowDone[r] && candidatesInRow(r).length === 0) return true;
    for (let c = 0; c < n; c++) if (!colDone[c] && candidatesInCol(c).length === 0) return true;
    for (let reg = 0; reg < n; reg++) if (!regionDone[reg] && candidatesInRegion(reg).length === 0) return true;
    return false;
  }
  function snapshot() { return { possible: possible.map((r) => r.slice()), placedCount, rowDone: rowDone.slice(), colDone: colDone.slice(), regionDone: regionDone.slice() }; }
  function restore(s) { possible = s.possible.map((r) => r.slice()); placedCount = s.placedCount; rowDone = s.rowDone.slice(); colDone = s.colDone.slice(); regionDone = s.regionDone.slice(); }

  function guessAndCheck() {
    if (isSolved()) return true;
    let bestRow = -1;
    let bestCands = null;
    for (let r = 0; r < n; r++) {
      if (rowDone[r]) continue;
      const cands = candidatesInRow(r);
      if (bestCands === null || cands.length < bestCands.length) {
        bestCands = cands;
        bestRow = r;
      }
    }
    if (bestRow === -1 || bestCands.length === 0) return false;
    if (maxTier < 4) maxTier = 4;
    score += difficultyWeights.guess;
    trace.push({ tacticId: 'guess', tier: 4, observedConstraints: 0 });
    for (const c of bestCands) {
      const snap = snapshot();
      placeQueen(bestRow, c, 4);
      propagate();
      if (!isContradiction() && guessAndCheck()) return true;
      restore(snap);
      possible[bestRow][c] = false;
    }
    return false;
  }

  if (!isSolved()) guessAndCheck();

  return { solved: isSolved(), score, tier: maxTier, trace };
}

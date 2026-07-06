import { DETERMINISTIC_TACTIC_DESCRIPTORS } from './deterministic-tactics.js';

const ONE_REGION_DIFFICULTY_ORDER = [
  'hidden-singles',
  'locked-candidates',
  'excluded-neighbour-twins',
  'excluded-neighbour-two',
  'excluded-neighbour-three',
  'excluded-neighbour-four'
];

function scoreForDeterministicStep(tacticId, observedRegions) {
  if (observedRegions <= 1) {
    const idx = ONE_REGION_DIFFICULTY_ORDER.indexOf(tacticId);
    return idx >= 0 ? idx + 1 : 9;
  }
  if (observedRegions === 2) return 25;
  if (observedRegions === 3) return 40;
  if (observedRegions === 4) return 85;
  return 100;
}

function tierForDeterministicStep(tacticId, observedRegions) {
  if (tacticId === 'hidden-singles') return 1;
  if (observedRegions <= 1) return 2;
  return 3;
}

export function humanSolve(n, region) {
  let possible = Array.from({ length: n }, () => new Array(n).fill(true));
  let placedCount = 0;
  let rowDone = new Array(n).fill(false);
  let colDone = new Array(n).fill(false);
  let regionDone = new Array(n).fill(false);
  let score = 0;
  let maxTier = 0;
  let lastObservedRegions = null;

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

  const ctx = {
    n,
    region,
    possible,
    rowDone,
    colDone,
    regionDone,
    candidatesInRow,
    candidatesInCol,
    candidatesInRegion,
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
          score += scoreForDeterministicStep(tactic.id, observedRegions);
          const stepTier = tierForDeterministicStep(tactic.id, observedRegions);
          if (stepTier > maxTier) maxTier = stepTier;
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
    score += 200;
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

  return { solved: isSolved(), score, tier: maxTier };
}

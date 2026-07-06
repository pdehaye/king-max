import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { tryGenerateCandidate } from '../js/game-generation.js';
import { DETERMINISTIC_TACTIC_DESCRIPTORS } from '../js/deterministic-tactics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outFile = path.join(rootDir, 'stories/generated/deterministic-examples.generated.js');

const TARGET_PER_TACTIC = 10;
const MAX_PUZZLE_ATTEMPTS = 120000;

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function countTrueCells(matrix) {
  let total = 0;
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c]) total++;
    }
  }
  return total;
}

function countCrowns(crowns) {
  let total = 0;
  for (let r = 0; r < crowns.length; r++) {
    for (let c = 0; c < crowns[r].length; c++) {
      if (crowns[r][c]) total++;
    }
  }
  return total;
}

function toCellMap({ possible, crowns }) {
  const n = possible.length;
  const map = {};
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const key = `${r},${c}`;
      if (crowns[r][c]) {
        map[key] = 'crown';
      } else if (possible[r][c]) {
        map[key] = 'candidate';
      } else {
        map[key] = 'blocked';
      }
    }
  }
  return map;
}

function snapshotState(ctx) {
  return {
    possible: cloneMatrix(ctx.possible),
    crowns: cloneMatrix(ctx.crowns),
    score: ctx.getScore(),
    maxTier: ctx.getMaxTier()
  };
}

function restoreState(ctx, snap) {
  ctx.possible = cloneMatrix(snap.possible);
  ctx.crowns = cloneMatrix(snap.crowns);
  ctx.score = snap.score;
  ctx.maxTier = snap.maxTier;
}

function createDeterministicContext(n, region) {
  const possible = Array.from({ length: n }, () => new Array(n).fill(true));
  const crowns = Array.from({ length: n }, () => new Array(n).fill(false));
  const rowDone = new Array(n).fill(false);
  const colDone = new Array(n).fill(false);
  const regionDone = new Array(n).fill(false);

  let score = 0;
  let maxTier = 0;

  function candidatesInRow(r) {
    const a = [];
    for (let c = 0; c < n; c++) if (possible[r][c]) a.push(c);
    return a;
  }

  function candidatesInCol(c) {
    const a = [];
    for (let r = 0; r < n; r++) if (possible[r][c]) a.push(r);
    return a;
  }

  function candidatesInRegion(reg) {
    const a = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (region[r][c] === reg && possible[r][c]) a.push({ r, c });
      }
    }
    return a;
  }

  function placeQueen(r, c, tier) {
    crowns[r][c] = true;
    const reg = region[r][c];
    for (let i = 0; i < n; i++) {
      possible[r][i] = false;
      possible[i][c] = false;
    }
    for (let rr = 0; rr < n; rr++) {
      for (let cc = 0; cc < n; cc++) {
        if (region[rr][cc] === reg) possible[rr][cc] = false;
      }
    }
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
          possible[nr][nc] = false;
        }
      }
    }
    rowDone[r] = true;
    colDone[c] = true;
    regionDone[reg] = true;
    score += tier === 1 ? 1 : 0;
    if (tier > maxTier) maxTier = tier;
  }

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

  const ctx = {
    n,
    region,
    possible,
    crowns,
    rowDone,
    colDone,
    regionDone,
    candidatesAt,
    constraints,
    place: (cell, tier) => placeQueen(cell.r, cell.c, tier),
    eliminate,
    regionOf,
    // Kept for internal use and backward compatibility
    candidatesInRow,
    candidatesInCol,
    candidatesInRegion,
    placeQueen,
    getScore() { return score; },
    setScore(next) { score = next; },
    getMaxTier() { return maxTier; },
    setMaxTier(next) { maxTier = next; }
  };

  return ctx;
}

function meetsQualityThreshold(id, metrics) {
  if (id === 'hidden-singles') return metrics.crownDelta >= 1;
  if (id === 'locked-candidates') return metrics.eliminatedCandidates >= 2;
  if (id === 'subsets') return metrics.eliminatedCandidates >= 3;
  if (id === 'excluded-neighbour-twins') return metrics.eliminatedCandidates >= 1;
  if (id === 'excluded-neighbour-two') return metrics.eliminatedCandidates >= 1;
  if (id === 'excluded-neighbour-three') return metrics.eliminatedCandidates >= 1;
  if (id === 'excluded-neighbour-four') return metrics.eliminatedCandidates >= 1;
  if (id === 'coupled-region-pairs-two') return metrics.eliminatedCandidates >= 1;
  return metrics.eliminatedCandidates + metrics.crownDelta > 0;
}

async function loadExistingExamples() {
  try {
    const mod = await import(`${pathToFileURL(outFile).href}?cacheBust=${Date.now()}`);
    const fromFile = mod.deterministicExamples || {};
    const normalized = {};
    for (const tactic of DETERMINISTIC_TACTIC_DESCRIPTORS) {
      normalized[tactic.id] = Array.isArray(fromFile[tactic.id]) ? fromFile[tactic.id] : [];
    }
    return normalized;
  } catch {
    const empty = {};
    for (const tactic of DETERMINISTIC_TACTIC_DESCRIPTORS) empty[tactic.id] = [];
    return empty;
  }
}

function allTargetsSatisfied(examplesByTactic) {
  return DETERMINISTIC_TACTIC_DESCRIPTORS.every((t) => examplesByTactic[t.id].length >= TARGET_PER_TACTIC);
}

function serializeExamples(examplesByTactic) {
  return `// Generated by scripts/discover-deterministic-examples.mjs\nexport const deterministicExamples = ${JSON.stringify(examplesByTactic, null, 2)};\n`;
}

async function main() {
  const examplesByTactic = await loadExistingExamples();

  let attempts = 0;
  while (!allTargetsSatisfied(examplesByTactic) && attempts < MAX_PUZZLE_ATTEMPTS) {
    attempts++;
    const candidate = tryGenerateCandidate(8);
    if (!candidate) continue;

    const ctx = createDeterministicContext(8, candidate.region);
    let guard = 0;

    while (guard < 400) {
      guard++;
      let progressed = false;

      for (const tactic of DETERMINISTIC_TACTIC_DESCRIPTORS) {
        if (examplesByTactic[tactic.id].length >= TARGET_PER_TACTIC) continue;

        const beforeSnap = snapshotState(ctx);
        const beforePossibleCount = countTrueCells(beforeSnap.possible);
        const beforeCrownsCount = countCrowns(beforeSnap.crowns);

        const changed = tactic.apply(ctx);
        if (!changed) continue;

        progressed = true;
        const afterSnap = snapshotState(ctx);
        const metrics = {
          eliminatedCandidates: Math.max(0, beforePossibleCount - countTrueCells(afterSnap.possible)),
          crownDelta: Math.max(0, countCrowns(afterSnap.crowns) - beforeCrownsCount)
        };

        if (meetsQualityThreshold(tactic.id, metrics)) {
          examplesByTactic[tactic.id].push({
            region: candidate.region,
            before: toCellMap(beforeSnap),
            after: toCellMap(afterSnap),
            metrics
          });
        }
        break;
      }

      if (!progressed) break;
    }
  }

  for (const tactic of DETERMINISTIC_TACTIC_DESCRIPTORS) {
    examplesByTactic[tactic.id] = examplesByTactic[tactic.id].slice(0, TARGET_PER_TACTIC);
  }

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, serializeExamples(examplesByTactic), 'utf8');

  const report = DETERMINISTIC_TACTIC_DESCRIPTORS
    .map((t) => `${t.label}: ${examplesByTactic[t.id].length}/${TARGET_PER_TACTIC}`)
    .join(' | ');

  console.log(`Deterministic example discovery complete after ${attempts} puzzle attempts.`);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

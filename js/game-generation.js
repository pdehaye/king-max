import { humanSolve } from './human-solver.js';

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateSolution(n) {
  for (let attempt = 0; attempt < 500; attempt++) {
    const board = new Array(n).fill(-1);
    if (place(0)) return board.slice();

    function place(row) {
      if (row === n) return true;
      const cols = shuffle([...Array(n).keys()]);
      for (const col of cols) {
        let ok = true;
        for (let r = 0; r < row; r++) {
          if (board[r] === col) {
            ok = false;
            break;
          }
        }
        if (ok && row > 0) {
          const prev = board[row - 1];
          if (Math.abs(prev - col) <= 1) ok = false;
        }
        if (ok) {
          board[row] = col;
          if (place(row + 1)) return true;
          board[row] = -1;
        }
      }
      return false;
    }
  }
  return null;
}

export function growRegions(n, sol) {
  const region = Array.from({ length: n }, () => new Array(n).fill(-1));
  let frontier = [];
  sol.forEach((c, r) => {
    region[r][c] = r;
    frontier.push({ r, c, region: r });
  });
  let remaining = n * n - n;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (remaining > 0 && frontier.length > 0) {
    const idx = Math.floor(Math.random() * frontier.length);
    const item = frontier[idx];
    const ds = shuffle(dirs.slice());
    let placed = false;
    for (const [dr, dc] of ds) {
      const nr = item.r + dr;
      const nc = item.c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && region[nr][nc] === -1) {
        region[nr][nc] = item.region;
        frontier.push({ r: nr, c: nc, region: item.region });
        remaining--;
        placed = true;
        break;
      }
    }
    if (!placed) frontier.splice(idx, 1);
  }

  if (remaining > 0) {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (region[r][c] === -1) {
          const q = [[r, c]];
          const seen = new Set([`${r},${c}`]);
          while (q.length) {
            const [cr, cc] = q.shift();
            for (const [dr, dc] of dirs) {
              const nr = cr + dr;
              const nc = cc + dc;
              if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
                if (region[nr][nc] !== -1) {
                  region[r][c] = region[nr][nc];
                  q.length = 0;
                  break;
                }
                const key = `${nr},${nc}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  q.push([nr, nc]);
                }
              }
            }
          }
        }
      }
    }
  }

  return region;
}

export function countSolutions(n, region, cap) {
  let count = 0;

  function backtrack(row, usedCols, usedRegions, prevCol) {
    if (count >= cap) return;
    if (row === n) {
      count++;
      return;
    }
    for (let col = 0; col < n; col++) {
      if (usedCols.has(col)) continue;
      const reg = region[row][col];
      if (usedRegions.has(reg)) continue;
      if (prevCol !== null && Math.abs(prevCol - col) <= 1) continue;
      usedCols.add(col);
      usedRegions.add(reg);
      backtrack(row + 1, usedCols, usedRegions, col);
      usedCols.delete(col);
      usedRegions.delete(reg);
      if (count >= cap) return;
    }
  }

  backtrack(0, new Set(), new Set(), null);
  return count;
}

export function tryGenerateCandidate(n = 8) {
  const sol = generateSolution(n);
  if (!sol) return null;
  const region = growRegions(n, sol);
  if (countSolutions(n, region, 2) !== 1) return null;
  const result = humanSolve(n, region);
  return { sol, region, score: result.score, tier: result.tier };
}

export function generateUniquePuzzle({
  boardSize = 8,
  candidatesToSample = 4,
  maxTotalAttempts = 1000000
} = {}) {
  let best = null;
  let found = 0;
  let totalAttempts = 0;

  while (found < candidatesToSample && totalAttempts < maxTotalAttempts) {
    totalAttempts++;
    const cand = tryGenerateCandidate(boardSize);
    if (!cand) continue;
    found++;
    if (!best || cand.score > best.score) best = cand;
  }

  if (best) return best;

  const sol = generateSolution(boardSize);
  const region = growRegions(boardSize, sol);
  const result = humanSolve(boardSize, region);
  return { sol, region, score: result.score, tier: result.tier };
}

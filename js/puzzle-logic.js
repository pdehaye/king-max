export const BOARD_SIZE = 8;

// Tier 1: hidden single
// Tier 2: locked candidates/intersections
// Tier 3: subset reasoning
// Tier 4: guessing/backtracking
export const TIER_LABELS = {
  1: 'pure logic',
  2: 'needs intersections',
  3: 'needs subset reasoning',
  4: 'needs guessing'
};

function shuffle(arr){
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateSolution(n){
  for(let attempt = 0; attempt < 500; attempt++){
    const board = new Array(n).fill(-1);
    if(place(0)) return board.slice();

    function place(row){
      if(row === n) return true;
      const cols = shuffle([...Array(n).keys()]);
      for(const col of cols){
        let ok = true;
        for(let r = 0; r < row; r++){
          if(board[r] === col){
            ok = false;
            break;
          }
        }
        if(ok && row > 0){
          const prev = board[row - 1];
          if(Math.abs(prev - col) <= 1) ok = false;
        }
        if(ok){
          board[row] = col;
          if(place(row + 1)) return true;
          board[row] = -1;
        }
      }
      return false;
    }
  }
  return null;
}

function growRegions(n, sol){
  const region = Array.from({length: n}, () => new Array(n).fill(-1));
  let frontier = [];
  sol.forEach((c, r) => {
    region[r][c] = r;
    frontier.push({r, c, region: r});
  });
  let remaining = n * n - n;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while(remaining > 0 && frontier.length > 0){
    const idx = Math.floor(Math.random() * frontier.length);
    const item = frontier[idx];
    const ds = shuffle(dirs.slice());
    let placed = false;
    for(const [dr, dc] of ds){
      const nr = item.r + dr;
      const nc = item.c + dc;
      if(nr >= 0 && nr < n && nc >= 0 && nc < n && region[nr][nc] === -1){
        region[nr][nc] = item.region;
        frontier.push({r: nr, c: nc, region: item.region});
        remaining--;
        placed = true;
        break;
      }
    }
    if(!placed) frontier.splice(idx, 1);
  }

  if(remaining > 0){
    for(let r = 0; r < n; r++){
      for(let c = 0; c < n; c++){
        if(region[r][c] === -1){
          const q = [[r, c]];
          const seen = new Set([r + ',' + c]);
          while(q.length){
            const [cr, cc] = q.shift();
            for(const [dr, dc] of dirs){
              const nr = cr + dr;
              const nc = cc + dc;
              if(nr >= 0 && nr < n && nc >= 0 && nc < n){
                if(region[nr][nc] !== -1){
                  region[r][c] = region[nr][nc];
                  q.length = 0;
                  break;
                }
                const key = nr + ',' + nc;
                if(!seen.has(key)){
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

function countSolutions(n, region, cap){
  let count = 0;
  function backtrack(row, usedCols, usedRegions, prevCol){
    if(count >= cap) return;
    if(row === n){
      count++;
      return;
    }
    for(let col = 0; col < n; col++){
      if(usedCols.has(col)) continue;
      const reg = region[row][col];
      if(usedRegions.has(reg)) continue;
      if(prevCol !== null && Math.abs(prevCol - col) <= 1) continue;
      usedCols.add(col);
      usedRegions.add(reg);
      backtrack(row + 1, usedCols, usedRegions, col);
      usedCols.delete(col);
      usedRegions.delete(reg);
      if(count >= cap) return;
    }
  }
  backtrack(0, new Set(), new Set(), null);
  return count;
}

function humanSolve(n, region){
  let possible = Array.from({length: n}, () => new Array(n).fill(true));
  let placedCount = 0;
  let rowDone = new Array(n).fill(false);
  let colDone = new Array(n).fill(false);
  let regionDone = new Array(n).fill(false);
  let score = 0;
  let maxTier = 0;

  function candidatesInRow(r){ const a = []; for(let c = 0; c < n; c++) if(possible[r][c]) a.push(c); return a; }
  function candidatesInCol(c){ const a = []; for(let r = 0; r < n; r++) if(possible[r][c]) a.push(r); return a; }
  function candidatesInRegion(reg){ const a = []; for(let r = 0; r < n; r++) for(let c = 0; c < n; c++) if(region[r][c] === reg && possible[r][c]) a.push({r, c}); return a; }

  function eliminateForQueen(r, c){
    const reg = region[r][c];
    for(let i = 0; i < n; i++){
      possible[r][i] = false;
      possible[i][c] = false;
    }
    for(let rr = 0; rr < n; rr++) for(let cc = 0; cc < n; cc++) if(region[rr][cc] === reg) possible[rr][cc] = false;
    for(let dr = -1; dr <= 1; dr++) for(let dc = -1; dc <= 1; dc++){
      const nr = r + dr;
      const nc = c + dc;
      if(nr >= 0 && nr < n && nc >= 0 && nc < n) possible[nr][nc] = false;
    }
    rowDone[r] = true;
    colDone[c] = true;
    regionDone[reg] = true;
  }

  function placeQueen(r, c, tier){
    placedCount++;
    eliminateForQueen(r, c);
    score += (tier === 1 ? 1 : 0);
    if(tier > maxTier) maxTier = tier;
  }

  function tryHiddenSingles(){
    for(let r = 0; r < n; r++){
      if(rowDone[r]) continue;
      const cands = candidatesInRow(r);
      if(cands.length === 1){
        placeQueen(r, cands[0], 1);
        return true;
      }
    }
    for(let c = 0; c < n; c++){
      if(colDone[c]) continue;
      const cands = candidatesInCol(c);
      if(cands.length === 1){
        placeQueen(cands[0], c, 1);
        return true;
      }
    }
    for(let reg = 0; reg < n; reg++){
      if(regionDone[reg]) continue;
      const cands = candidatesInRegion(reg);
      if(cands.length === 1){
        placeQueen(cands[0].r, cands[0].c, 1);
        return true;
      }
    }
    return false;
  }

  function tryLockedCandidates(){
    let progressed = false;
    for(let reg = 0; reg < n; reg++){
      if(regionDone[reg]) continue;
      const cands = candidatesInRegion(reg);
      if(cands.length === 0) continue;
      const rows = new Set(cands.map(p => p.r));
      const cols = new Set(cands.map(p => p.c));
      if(rows.size === 1){
        const r = [...rows][0];
        for(let c = 0; c < n; c++) if(region[r][c] !== reg && possible[r][c]){ possible[r][c] = false; progressed = true; }
      }
      if(cols.size === 1){
        const c = [...cols][0];
        for(let r = 0; r < n; r++) if(region[r][c] !== reg && possible[r][c]){ possible[r][c] = false; progressed = true; }
      }
    }

    for(let r = 0; r < n; r++){
      if(rowDone[r]) continue;
      const cands = candidatesInRow(r);
      if(cands.length === 0) continue;
      const regs = new Set(cands.map(c => region[r][c]));
      if(regs.size === 1){
        const reg = [...regs][0];
        for(let rr = 0; rr < n; rr++) for(let cc = 0; cc < n; cc++) if(rr !== r && region[rr][cc] === reg && possible[rr][cc]){ possible[rr][cc] = false; progressed = true; }
      }
    }

    for(let c = 0; c < n; c++){
      if(colDone[c]) continue;
      const cands = candidatesInCol(c);
      if(cands.length === 0) continue;
      const regs = new Set(cands.map(r => region[r][c]));
      if(regs.size === 1){
        const reg = [...regs][0];
        for(let rr = 0; rr < n; rr++) for(let cc = 0; cc < n; cc++) if(cc !== c && region[rr][cc] === reg && possible[rr][cc]){ possible[rr][cc] = false; progressed = true; }
      }
    }

    if(progressed){
      score += 4;
      if(maxTier < 2) maxTier = 2;
    }
    return progressed;
  }

  function combinations(arr, k){
    const res = [];
    function rec(start, combo){
      if(combo.length === k){
        res.push(combo.slice());
        return;
      }
      for(let i = start; i < arr.length; i++){
        combo.push(arr[i]);
        rec(i + 1, combo);
        combo.pop();
      }
    }
    rec(0, []);
    return res;
  }

  function trySubsets(){
    const maxK = Math.min(4, n);
    const unsolvedRegions = [];
    for(let reg = 0; reg < n; reg++) if(!regionDone[reg]) unsolvedRegions.push(reg);
    for(let k = 2; k <= maxK; k++){
      for(const combo of combinations(unsolvedRegions, k)){
        let rowSet = new Set();
        let colSet = new Set();
        let anyEmpty = false;
        for(const reg of combo){
          const cands = candidatesInRegion(reg);
          if(cands.length === 0){
            anyEmpty = true;
            break;
          }
          cands.forEach(p => {
            rowSet.add(p.r);
            colSet.add(p.c);
          });
        }
        if(anyEmpty) continue;
        if(rowSet.size === k){
          let progressed = false;
          for(const r of rowSet) for(let c = 0; c < n; c++) if(!combo.includes(region[r][c]) && possible[r][c]){ possible[r][c] = false; progressed = true; }
          if(progressed){
            score += 10 * k;
            if(maxTier < 3) maxTier = 3;
            return true;
          }
        }
        if(colSet.size === k){
          let progressed = false;
          for(const c of colSet) for(let r = 0; r < n; r++) if(!combo.includes(region[r][c]) && possible[r][c]){ possible[r][c] = false; progressed = true; }
          if(progressed){
            score += 10 * k;
            if(maxTier < 3) maxTier = 3;
            return true;
          }
        }
      }
    }
    return false;
  }

  function propagate(){
    let changed = true;
    while(changed){
      changed = false;
      if(tryHiddenSingles()){ changed = true; continue; }
      if(tryLockedCandidates()){ changed = true; continue; }
      if(trySubsets()){ changed = true; continue; }
    }
  }
  propagate();

  function isSolved(){ return placedCount === n; }
  function isContradiction(){
    for(let r = 0; r < n; r++) if(!rowDone[r] && candidatesInRow(r).length === 0) return true;
    for(let c = 0; c < n; c++) if(!colDone[c] && candidatesInCol(c).length === 0) return true;
    for(let reg = 0; reg < n; reg++) if(!regionDone[reg] && candidatesInRegion(reg).length === 0) return true;
    return false;
  }
  function snapshot(){ return { possible: possible.map(r => r.slice()), placedCount, rowDone: rowDone.slice(), colDone: colDone.slice(), regionDone: regionDone.slice() }; }
  function restore(s){ possible = s.possible.map(r => r.slice()); placedCount = s.placedCount; rowDone = s.rowDone.slice(); colDone = s.colDone.slice(); regionDone = s.regionDone.slice(); }

  function guessAndCheck(){
    if(isSolved()) return true;
    let bestRow = -1;
    let bestCands = null;
    for(let r = 0; r < n; r++){
      if(rowDone[r]) continue;
      const cands = candidatesInRow(r);
      if(bestCands === null || cands.length < bestCands.length){
        bestCands = cands;
        bestRow = r;
      }
    }
    if(bestRow === -1 || bestCands.length === 0) return false;
    if(maxTier < 4) maxTier = 4;
    score += 60;
    for(const c of bestCands){
      const snap = snapshot();
      placeQueen(bestRow, c, 4);
      propagate();
      if(!isContradiction() && guessAndCheck()) return true;
      restore(snap);
      possible[bestRow][c] = false;
      score += 20;
    }
    return false;
  }

  if(!isSolved()) guessAndCheck();

  return { solved: isSolved(), score, tier: maxTier };
}

export function tryGenerateCandidate(){
  const sol = generateSolution(BOARD_SIZE);
  const region = growRegions(BOARD_SIZE, sol);
  if(countSolutions(BOARD_SIZE, region, 2) !== 1) return null;
  const result = humanSolve(BOARD_SIZE, region);
  return {sol, region, score: result.score, tier: result.tier};
}

export function generateUniquePuzzle(){
  const CANDIDATES_TO_SAMPLE = 4;
  const MAX_TOTAL_ATTEMPTS = 20000;
  let best = null;
  let found = 0;
  let totalAttempts = 0;

  while(found < CANDIDATES_TO_SAMPLE && totalAttempts < MAX_TOTAL_ATTEMPTS){
    totalAttempts++;
    const cand = tryGenerateCandidate();
    if(!cand) continue;
    found++;
    if(!best || cand.score > best.score) best = cand;
  }

  if(best) return best;

  const sol = generateSolution(BOARD_SIZE);
  const region = growRegions(BOARD_SIZE, sol);
  const result = humanSolve(BOARD_SIZE, region);
  return {sol, region, score: result.score, tier: result.tier};
}

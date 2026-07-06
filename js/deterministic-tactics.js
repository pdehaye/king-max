function combinations(arr, k) {
  const res = [];

  function rec(start, combo) {
    if (combo.length === k) {
      res.push(combo.slice());
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      rec(i + 1, combo);
      combo.pop();
    }
  }

  rec(0, []);
  return res;
}

export function tryHiddenSingles(state) {
  const {
    n: size,
    rowDone: solvedRows,
    colDone: solvedCols,
    regionDone: solvedRegions,
    candidatesInRow: rowCandidates,
    candidatesInCol: colCandidates,
    candidatesInRegion: regionCandidates,
    placeQueen: place
  } = state;

  for (let r = 0; r < size; r++) {
    if (solvedRows[r]) continue;
    const cands = rowCandidates(r);
    if (cands.length === 1) {
      place(r, cands[0], 1);
      return true;
    }
  }
  for (let c = 0; c < size; c++) {
    if (solvedCols[c]) continue;
    const cands = colCandidates(c);
    if (cands.length === 1) {
      place(cands[0], c, 1);
      return true;
    }
  }
  for (let reg = 0; reg < size; reg++) {
    if (solvedRegions[reg]) continue;
    const cands = regionCandidates(reg);
    if (cands.length === 1) {
      place(cands[0].r, cands[0].c, 1);
      return true;
    }
  }

  return false;
}

export function tryLockedCandidates(state) {
  const {
    n: size,
    region: regionMap,
    possible: possibleMap,
    rowDone: solvedRows,
    colDone: solvedCols,
    regionDone: solvedRegions,
    candidatesInRow: rowCandidates,
    candidatesInCol: colCandidates,
    candidatesInRegion: regionCandidates,
    getScore,
    setScore,
    getMaxTier,
    setMaxTier
  } = state;

  let progressed = false;
  for (let reg = 0; reg < size; reg++) {
    if (solvedRegions[reg]) continue;
    const cands = regionCandidates(reg);
    if (cands.length === 0) continue;
    const rows = new Set(cands.map((p) => p.r));
    const cols = new Set(cands.map((p) => p.c));
    if (rows.size === 1) {
      const r = [...rows][0];
      for (let c = 0; c < size; c++) {
        if (regionMap[r][c] !== reg && possibleMap[r][c]) {
          possibleMap[r][c] = false;
          progressed = true;
        }
      }
    }
    if (cols.size === 1) {
      const c = [...cols][0];
      for (let r = 0; r < size; r++) {
        if (regionMap[r][c] !== reg && possibleMap[r][c]) {
          possibleMap[r][c] = false;
          progressed = true;
        }
      }
    }
  }

  for (let r = 0; r < size; r++) {
    if (solvedRows[r]) continue;
    const cands = rowCandidates(r);
    if (cands.length === 0) continue;
    const regs = new Set(cands.map((c) => regionMap[r][c]));
    if (regs.size === 1) {
      const reg = [...regs][0];
      for (let rr = 0; rr < size; rr++) {
        for (let cc = 0; cc < size; cc++) {
          if (rr !== r && regionMap[rr][cc] === reg && possibleMap[rr][cc]) {
            possibleMap[rr][cc] = false;
            progressed = true;
          }
        }
      }
    }
  }

  for (let c = 0; c < size; c++) {
    if (solvedCols[c]) continue;
    const cands = colCandidates(c);
    if (cands.length === 0) continue;
    const regs = new Set(cands.map((r) => regionMap[r][c]));
    if (regs.size === 1) {
      const reg = [...regs][0];
      for (let rr = 0; rr < size; rr++) {
        for (let cc = 0; cc < size; cc++) {
          if (cc !== c && regionMap[rr][cc] === reg && possibleMap[rr][cc]) {
            possibleMap[rr][cc] = false;
            progressed = true;
          }
        }
      }
    }
  }

  if (progressed) {
    setScore(getScore() + 4);
    if (getMaxTier() < 2) setMaxTier(2);
  }

  return progressed;
}

export function trySubsets(state) {
  const {
    n: size,
    region: regionMap,
    possible: possibleMap,
    regionDone: solvedRegions,
    candidatesInRegion: regionCandidates,
    getScore,
    setScore,
    getMaxTier,
    setMaxTier
  } = state;

  const maxK = Math.min(4, size);
  const unsolvedRegions = [];
  for (let reg = 0; reg < size; reg++) {
    if (!solvedRegions[reg]) unsolvedRegions.push(reg);
  }

  for (let k = 2; k <= maxK; k++) {
    for (const combo of combinations(unsolvedRegions, k)) {
      let rowSet = new Set();
      let colSet = new Set();
      let anyEmpty = false;

      for (const reg of combo) {
        const cands = regionCandidates(reg);
        if (cands.length === 0) {
          anyEmpty = true;
          break;
        }
        cands.forEach((p) => {
          rowSet.add(p.r);
          colSet.add(p.c);
        });
      }

      if (anyEmpty) continue;

      if (rowSet.size === k) {
        let progressed = false;
        for (const r of rowSet) {
          for (let c = 0; c < size; c++) {
            if (!combo.includes(regionMap[r][c]) && possibleMap[r][c]) {
              possibleMap[r][c] = false;
              progressed = true;
            }
          }
        }
        if (progressed) {
          setScore(getScore() + (10 * k));
          if (getMaxTier() < 3) setMaxTier(3);
          return true;
        }
      }

      if (colSet.size === k) {
        let progressed = false;
        for (const c of colSet) {
          for (let r = 0; r < size; r++) {
            if (!combo.includes(regionMap[r][c]) && possibleMap[r][c]) {
              possibleMap[r][c] = false;
              progressed = true;
            }
          }
        }
        if (progressed) {
          setScore(getScore() + (10 * k));
          if (getMaxTier() < 3) setMaxTier(3);
          return true;
        }
      }
    }
  }

  return false;
}

export const DETERMINISTIC_TACTIC_DESCRIPTORS = [
  { id: 'hidden-singles', label: 'Hidden Singles', apply: tryHiddenSingles },
  { id: 'locked-candidates', label: 'Locked Candidates', apply: tryLockedCandidates },
  { id: 'subsets', label: 'Subsets', apply: trySubsets }
];

export const DETERMINISTIC_TACTICS = DETERMINISTIC_TACTIC_DESCRIPTORS.map((t) => t.apply);

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
    candidatesInRegion: regionCandidates
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

  return progressed;
}

export function trySubsets(state) {
  const {
    n: size,
    region: regionMap,
    possible: possibleMap,
    rowDone: solvedRows,
    colDone: solvedCols,
    regionDone: solvedRegions,
    candidatesInRegion: regionCandidates
  } = state;

  const maxK = Math.min(4, size);
  const unsolvedRegions = [];
  const unsolvedRows = [];
  const unsolvedCols = [];
  for (let reg = 0; reg < size; reg++) {
    if (!solvedRegions[reg]) unsolvedRegions.push(reg);
  }
  for (let r = 0; r < size; r++) {
    if (!solvedRows[r]) unsolvedRows.push(r);
  }
  for (let c = 0; c < size; c++) {
    if (!solvedCols[c]) unsolvedCols.push(c);
  }

  function collectRegionsInRows(rows) {
    const regions = new Set();
    for (const r of rows) {
      for (let c = 0; c < size; c++) {
        if (!possibleMap[r][c]) continue;
        const reg = regionMap[r][c];
        if (!solvedRegions[reg]) regions.add(reg);
      }
    }
    return regions;
  }

  function collectRegionsInCols(cols) {
    const regions = new Set();
    for (const c of cols) {
      for (let r = 0; r < size; r++) {
        if (!possibleMap[r][c]) continue;
        const reg = regionMap[r][c];
        if (!solvedRegions[reg]) regions.add(reg);
      }
    }
    return regions;
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
          state.setLastObservedRegions?.(k);
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
          state.setLastObservedRegions?.(k);
          return true;
        }
      }
    }

    for (const rowCombo of combinations(unsolvedRows, k)) {
      const regions = collectRegionsInRows(rowCombo);
      if (regions.size !== k) continue;

      let progressed = false;
      for (let r = 0; r < size; r++) {
        if (rowCombo.includes(r)) continue;
        for (let c = 0; c < size; c++) {
          if (!possibleMap[r][c]) continue;
          const reg = regionMap[r][c];
          if (regions.has(reg)) {
            possibleMap[r][c] = false;
            progressed = true;
          }
        }
      }

      if (progressed) {
        state.setLastObservedRegions?.(k);
        return true;
      }
    }

    for (const colCombo of combinations(unsolvedCols, k)) {
      const regions = collectRegionsInCols(colCombo);
      if (regions.size !== k) continue;

      let progressed = false;
      for (let c = 0; c < size; c++) {
        if (colCombo.includes(c)) continue;
        for (let r = 0; r < size; r++) {
          if (!possibleMap[r][c]) continue;
          const reg = regionMap[r][c];
          if (regions.has(reg)) {
            possibleMap[r][c] = false;
            progressed = true;
          }
        }
      }

      if (progressed) {
        state.setLastObservedRegions?.(k);
        return true;
      }
    }
  }

  return false;
}

function isOrthogonallyContiguous(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

function getNeighbourKeys(cell, size) {
  const keys = new Set();
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = cell.r + dr;
      const nc = cell.c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      keys.add(`${nr},${nc}`);
    }
  }
  return keys;
}

function forcedExclusionsForCell(cell, size, regionMap) {
  const keys = new Set();
  const regionId = regionMap[cell.r][cell.c];

  for (let i = 0; i < size; i++) {
    keys.add(`${cell.r},${i}`);
    keys.add(`${i},${cell.c}`);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regionMap[r][c] === regionId) keys.add(`${r},${c}`);
    }
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = cell.r + dr;
      const nc = cell.c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      keys.add(`${nr},${nc}`);
    }
  }

  return keys;
}

function placementsCompatible(a, b) {
  if (a.r === b.r) return false;
  if (a.c === b.c) return false;
  if (Math.abs(a.r - b.r) <= 1 && Math.abs(a.c - b.c) <= 1) return false;
  return true;
}

function applyTwinExclusion(state, pair) {
  const { n: size, possible: possibleMap } = state;
  const [a, b] = pair;

  if (!isOrthogonallyContiguous(a, b)) return false;

  const aNeighbours = getNeighbourKeys(a, size);
  const bNeighbours = getNeighbourKeys(b, size);
  let progressed = false;

  for (const key of aNeighbours) {
    if (!bNeighbours.has(key)) continue;
    const [rStr, cStr] = key.split(',');
    const r = Number(rStr);
    const c = Number(cStr);

    if ((r === a.r && c === a.c) || (r === b.r && c === b.c)) continue;
    if (possibleMap[r][c]) {
      possibleMap[r][c] = false;
      progressed = true;
    }
  }

  return progressed;
}

function applyTwoExclusion(state, pair) {
  return applyExcludedNeighbourForCandidates(state, pair);
}

function applyExcludedNeighbourForCandidates(state, candidates) {
  const { n: size, region: regionMap, possible: possibleMap } = state;
  if (!Array.isArray(candidates) || candidates.length < 2) return false;

  const blockedKeys = new Set(candidates.map((p) => `${p.r},${p.c}`));
  let sharedNeighbours = null;

  for (const cell of candidates) {
    const neighbours = forcedExclusionsForCell(cell, size, regionMap);
    if (sharedNeighbours === null) {
      sharedNeighbours = neighbours;
      continue;
    }

    const intersection = new Set();
    for (const key of sharedNeighbours) {
      if (neighbours.has(key)) intersection.add(key);
    }
    sharedNeighbours = intersection;
    if (sharedNeighbours.size === 0) break;
  }

  if (!sharedNeighbours || sharedNeighbours.size === 0) return false;

  let progressed = false;
  for (const key of sharedNeighbours) {
    if (blockedKeys.has(key)) continue;
    const [rStr, cStr] = key.split(',');
    const r = Number(rStr);
    const c = Number(cStr);
    if (possibleMap[r][c]) {
      possibleMap[r][c] = false;
      progressed = true;
    }
  }

  return progressed;
}

function tryExcludedNeighbourForRegionCandidateCount(state, targetCount) {
  const {
    n: size,
    regionDone: solvedRegions,
    candidatesInRegion: regionCandidates
  } = state;

  for (let reg = 0; reg < size; reg++) {
    if (solvedRegions[reg]) continue;
    const cands = regionCandidates(reg);
    if (cands.length !== targetCount) continue;
    if (applyExcludedNeighbourForCandidates(state, cands)) return true;
  }

  return false;
}

export function tryCoupledRegionPairsTwo(state) {
  const {
    n: size,
    region: regionMap,
    possible: possibleMap,
    regionDone: solvedRegions,
    candidatesInRegion: regionCandidates
  } = state;

  const twoCandidateRegions = [];
  for (let reg = 0; reg < size; reg++) {
    if (solvedRegions[reg]) continue;
    const cands = regionCandidates(reg);
    if (cands.length === 2) {
      twoCandidateRegions.push({ reg, cands });
    }
  }

  for (let i = 0; i < twoCandidateRegions.length; i++) {
    for (let j = i + 1; j < twoCandidateRegions.length; j++) {
      const a = twoCandidateRegions[i];
      const b = twoCandidateRegions[j];

      const blockedKeys = new Set([
        `${a.cands[0].r},${a.cands[0].c}`,
        `${a.cands[1].r},${a.cands[1].c}`,
        `${b.cands[0].r},${b.cands[0].c}`,
        `${b.cands[1].r},${b.cands[1].c}`
      ]);

      const assignmentExclusions = [];
      for (const ac of a.cands) {
        for (const bc of b.cands) {
          if (!placementsCompatible(ac, bc)) continue;
          const exA = forcedExclusionsForCell(ac, size, regionMap);
          const exB = forcedExclusionsForCell(bc, size, regionMap);
          const combined = new Set(exA);
          for (const key of exB) combined.add(key);
          assignmentExclusions.push(combined);
        }
      }

      if (assignmentExclusions.length === 0) continue;

      let guaranteed = new Set(assignmentExclusions[0]);
      for (let k = 1; k < assignmentExclusions.length; k++) {
        const next = new Set();
        for (const key of guaranteed) {
          if (assignmentExclusions[k].has(key)) next.add(key);
        }
        guaranteed = next;
        if (guaranteed.size === 0) break;
      }

      let progressed = false;
      for (const key of guaranteed) {
        if (blockedKeys.has(key)) continue;
        const [rStr, cStr] = key.split(',');
        const r = Number(rStr);
        const c = Number(cStr);
        if (possibleMap[r][c]) {
          possibleMap[r][c] = false;
          progressed = true;
        }
      }

      if (progressed) {
        state.setLastObservedRegions?.(2);
        return true;
      }
    }
  }

  return false;
}

export function tryExcludedNeighbourTwins(state) {
  const {
    n: size,
    rowDone: solvedRows,
    colDone: solvedCols,
    regionDone: solvedRegions,
    candidatesInRow: rowCandidates,
    candidatesInCol: colCandidates,
    candidatesInRegion: regionCandidates
  } = state;

  for (let r = 0; r < size; r++) {
    if (solvedRows[r]) continue;
    const cols = rowCandidates(r);
    if (cols.length !== 2) continue;
    const pair = [{ r, c: cols[0] }, { r, c: cols[1] }];
    if (applyTwinExclusion(state, pair)) return true;
  }

  for (let c = 0; c < size; c++) {
    if (solvedCols[c]) continue;
    const rows = colCandidates(c);
    if (rows.length !== 2) continue;
    const pair = [{ r: rows[0], c }, { r: rows[1], c }];
    if (applyTwinExclusion(state, pair)) return true;
  }

  for (let reg = 0; reg < size; reg++) {
    if (solvedRegions[reg]) continue;
    const cands = regionCandidates(reg);
    if (cands.length !== 2) continue;
    if (applyTwinExclusion(state, cands)) return true;
  }

  return false;
}

export function tryExcludedNeighbourTwo(state) {
  return tryExcludedNeighbourForRegionCandidateCount(state, 2);
}

export function tryExcludedNeighbourThree(state) {
  return tryExcludedNeighbourForRegionCandidateCount(state, 3);
}

export function tryExcludedNeighbourFour(state) {
  return tryExcludedNeighbourForRegionCandidateCount(state, 4);
}

export const DETERMINISTIC_TACTIC_DESCRIPTORS = [
  {
    id: 'hidden-singles',
    label: 'Hidden Singles',
    regionsObserved: { min: 1, max: 1 },
    apply: tryHiddenSingles
  },
  {
    id: 'locked-candidates',
    label: 'Locked Candidates',
    regionsObserved: { min: 1, max: 1 },
    apply: tryLockedCandidates
  },
  {
    id: 'subsets',
    label: 'Subsets',
    regionsObserved: { min: 2, max: 4 },
    apply: trySubsets
  },
  {
    id: 'excluded-neighbour-twins',
    label: 'Excluded Neighbour (Twins)',
    regionsObserved: { min: 1, max: 1 },
    apply: tryExcludedNeighbourTwins
  },
  {
    id: 'excluded-neighbour-two',
    label: 'Excluded Neighbour (Two)',
    regionsObserved: { min: 1, max: 1 },
    apply: tryExcludedNeighbourTwo
  },
  {
    id: 'excluded-neighbour-three',
    label: 'Excluded Neighbour (Three)',
    regionsObserved: { min: 1, max: 1 },
    apply: tryExcludedNeighbourThree
  },
  {
    id: 'excluded-neighbour-four',
    label: 'Excluded Neighbour (Four)',
    regionsObserved: { min: 1, max: 1 },
    apply: tryExcludedNeighbourFour
  },
  {
    id: 'coupled-region-pairs-two',
    label: 'Coupled Regions (2x2)',
    regionsObserved: { min: 2, max: 2 },
    apply: tryCoupledRegionPairsTwo
  }
];

export const DETERMINISTIC_TACTICS = DETERMINISTIC_TACTIC_DESCRIPTORS.map((t) => t.apply);

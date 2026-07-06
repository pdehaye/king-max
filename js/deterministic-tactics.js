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
  for (const constraint of state.constraints()) {
    const cands = state.candidatesAt(constraint);
    if (cands.length === 1) {
      state.place(cands[0], 1);
      return true;
    }
  }
  return false;
}

export function tryLockedCandidates(state) {
  let progressed = false;

  for (const c of state.constraints()) {
    if (c.type !== 'region') continue;
    const cands = state.candidatesAt(c);
    if (cands.length === 0) continue;

    const rows = new Set(cands.map((p) => p.r));
    const cols = new Set(cands.map((p) => p.c));

    if (rows.size === 1) {
      const r = [...rows][0];
      for (const cell of state.candidatesAt({ type: 'row', index: r })) {
        if (state.regionOf(cell) !== c.index) {
          if (state.eliminate(cell)) progressed = true;
        }
      }
    }

    if (cols.size === 1) {
      const col = [...cols][0];
      for (const cell of state.candidatesAt({ type: 'col', index: col })) {
        if (state.regionOf(cell) !== c.index) {
          if (state.eliminate(cell)) progressed = true;
        }
      }
    }
  }

  for (const c of state.constraints()) {
    if (c.type !== 'row') continue;
    const cands = state.candidatesAt(c);
    if (cands.length === 0) continue;
    const regs = new Set(cands.map((cell) => state.regionOf(cell)));
    if (regs.size === 1) {
      const reg = [...regs][0];
      for (const cell of state.candidatesAt({ type: 'region', index: reg })) {
        if (cell.r !== c.index) {
          if (state.eliminate(cell)) progressed = true;
        }
      }
    }
  }

  for (const c of state.constraints()) {
    if (c.type !== 'col') continue;
    const cands = state.candidatesAt(c);
    if (cands.length === 0) continue;
    const regs = new Set(cands.map((cell) => state.regionOf(cell)));
    if (regs.size === 1) {
      const reg = [...regs][0];
      for (const cell of state.candidatesAt({ type: 'region', index: reg })) {
        if (cell.c !== c.index) {
          if (state.eliminate(cell)) progressed = true;
        }
      }
    }
  }

  return progressed;
}

export function trySubsets(state) {
  const size = state.n;
  const maxK = Math.min(4, size);

  const allConstraints = state.constraints();
  const unsolvedRegions = allConstraints.filter((c) => c.type === 'region').map((c) => c.index);
  const unsolvedRows = allConstraints.filter((c) => c.type === 'row').map((c) => c.index);
  const unsolvedCols = allConstraints.filter((c) => c.type === 'col').map((c) => c.index);
  const unsolvedRegionSet = new Set(unsolvedRegions);

  function collectRegionsInRows(rows) {
    const regions = new Set();
    for (const r of rows) {
      for (const cell of state.candidatesAt({ type: 'row', index: r })) {
        const reg = state.regionOf(cell);
        if (unsolvedRegionSet.has(reg)) regions.add(reg);
      }
    }
    return regions;
  }

  function collectRegionsInCols(cols) {
    const regions = new Set();
    for (const col of cols) {
      for (const cell of state.candidatesAt({ type: 'col', index: col })) {
        const reg = state.regionOf(cell);
        if (unsolvedRegionSet.has(reg)) regions.add(reg);
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
        const cands = state.candidatesAt({ type: 'region', index: reg });
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
          for (const cell of state.candidatesAt({ type: 'row', index: r })) {
            if (!combo.includes(state.regionOf(cell))) {
              if (state.eliminate(cell)) progressed = true;
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
        for (const col of colSet) {
          for (const cell of state.candidatesAt({ type: 'col', index: col })) {
            if (!combo.includes(state.regionOf(cell))) {
              if (state.eliminate(cell)) progressed = true;
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
      for (const r of unsolvedRows) {
        if (rowCombo.includes(r)) continue;
        for (const cell of state.candidatesAt({ type: 'row', index: r })) {
          if (regions.has(state.regionOf(cell))) {
            if (state.eliminate(cell)) progressed = true;
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
      for (const col of unsolvedCols) {
        if (colCombo.includes(col)) continue;
        for (const cell of state.candidatesAt({ type: 'col', index: col })) {
          if (regions.has(state.regionOf(cell))) {
            if (state.eliminate(cell)) progressed = true;
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

function forcedExclusionsForCell(cell, state) {
  const size = state.n;
  const keys = new Set();
  const regionId = state.regionOf(cell);

  for (let i = 0; i < size; i++) {
    keys.add(`${cell.r},${i}`);
    keys.add(`${i},${cell.c}`);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (state.regionOf({ r, c }) === regionId) keys.add(`${r},${c}`);
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
  const size = state.n;
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
    if (state.eliminate({ r, c })) progressed = true;
  }

  return progressed;
}

function applyExcludedNeighbourForCandidates(state, candidates) {
  if (!Array.isArray(candidates) || candidates.length < 2) return false;

  const blockedKeys = new Set(candidates.map((p) => `${p.r},${p.c}`));
  let sharedNeighbours = null;

  for (const cell of candidates) {
    const neighbours = forcedExclusionsForCell(cell, state);
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
    if (state.eliminate({ r, c })) progressed = true;
  }

  return progressed;
}

function tryExcludedNeighbourForRegionCandidateCount(state, targetCount) {
  for (const c of state.constraints()) {
    if (c.type !== 'region') continue;
    const cands = state.candidatesAt(c);
    if (cands.length !== targetCount) continue;
    if (applyExcludedNeighbourForCandidates(state, cands)) return true;
  }
  return false;
}

export function tryCoupledRegionPairsTwo(state) {
  const twoCandidateRegions = [];
  for (const c of state.constraints()) {
    if (c.type !== 'region') continue;
    const cands = state.candidatesAt(c);
    if (cands.length === 2) {
      twoCandidateRegions.push({ reg: c.index, cands });
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
          const exA = forcedExclusionsForCell(ac, state);
          const exB = forcedExclusionsForCell(bc, state);
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
        if (state.eliminate({ r, c })) progressed = true;
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
  for (const c of state.constraints()) {
    if (c.type === 'row') {
      const cands = state.candidatesAt(c);
      if (cands.length !== 2) continue;
      if (applyTwinExclusion(state, cands)) return true;
    }
    if (c.type === 'col') {
      const cands = state.candidatesAt(c);
      if (cands.length !== 2) continue;
      if (applyTwinExclusion(state, cands)) return true;
    }
    if (c.type === 'region') {
      const cands = state.candidatesAt(c);
      if (cands.length !== 2) continue;
      if (applyTwinExclusion(state, cands)) return true;
    }
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
    constraintTypes: ['row', 'col', 'region'],
    apply: tryHiddenSingles
  },
  {
    id: 'locked-candidates',
    label: 'Locked Candidates',
    regionsObserved: { min: 1, max: 1 },
    constraintTypes: ['region', 'row', 'col'],
    apply: tryLockedCandidates
  },
  {
    id: 'subsets',
    label: 'Subsets',
    regionsObserved: { min: 2, max: 4 },
    constraintTypes: ['region', 'row', 'col'],
    apply: trySubsets
  },
  {
    id: 'excluded-neighbour-twins',
    label: 'Excluded Neighbour (Twins)',
    regionsObserved: { min: 1, max: 1 },
    constraintTypes: ['row', 'col', 'region'],
    apply: tryExcludedNeighbourTwins
  },
  {
    id: 'excluded-neighbour-two',
    label: 'Excluded Neighbour (Two)',
    regionsObserved: { min: 1, max: 1 },
    constraintTypes: ['region'],
    apply: tryExcludedNeighbourTwo
  },
  {
    id: 'excluded-neighbour-three',
    label: 'Excluded Neighbour (Three)',
    regionsObserved: { min: 1, max: 1 },
    constraintTypes: ['region'],
    apply: tryExcludedNeighbourThree
  },
  {
    id: 'excluded-neighbour-four',
    label: 'Excluded Neighbour (Four)',
    regionsObserved: { min: 1, max: 1 },
    constraintTypes: ['region'],
    apply: tryExcludedNeighbourFour
  },
  {
    id: 'coupled-region-pairs-two',
    label: 'Coupled Regions (2x2)',
    regionsObserved: { min: 2, max: 2 },
    constraintTypes: ['region'],
    apply: tryCoupledRegionPairsTwo
  }
];

export const DETERMINISTIC_TACTICS = DETERMINISTIC_TACTIC_DESCRIPTORS.map((t) => t.apply);

const { test, expect } = require('@playwright/test');

function solveRegionMap(regionMap) {
  const n = regionMap.length;
  const usedCols = new Set();
  const usedRegions = new Set();
  const placement = new Array(n).fill(-1);

  function candidatesForRow(r) {
    const cands = [];
    for (let c = 0; c < n; c++) {
      const reg = regionMap[r][c];
      if (usedCols.has(c) || usedRegions.has(reg)) continue;
      if (r > 0 && Math.abs(placement[r - 1] - c) <= 1) continue;
      cands.push(c);
    }
    return cands;
  }

  function backtrack(r) {
    if (r === n) return true;
    const cands = candidatesForRow(r);
    for (const c of cands) {
      const reg = regionMap[r][c];
      usedCols.add(c);
      usedRegions.add(reg);
      placement[r] = c;
      if (backtrack(r + 1)) return true;
      usedCols.delete(c);
      usedRegions.delete(reg);
      placement[r] = -1;
    }
    return false;
  }

  if (!backtrack(0)) throw new Error('No solution found for current board state');
  return placement;
}

test('puzzle logic module invariants stay valid', async ({ page }) => {
  await page.goto('/king-max/');

  const result = await page.evaluate(async () => {
    const mod = await import('../js/puzzle-logic.js');
    const n = mod.BOARD_SIZE;

    function isValidSolution(sol) {
      if (!Array.isArray(sol) || sol.length !== n) return false;
      const seenCols = new Set();
      for (let r = 0; r < n; r++) {
        const c = sol[r];
        if (!Number.isInteger(c) || c < 0 || c >= n) return false;
        if (seenCols.has(c)) return false;
        seenCols.add(c);
      }
      for (let r = 0; r < n - 1; r++) {
        if (Math.abs(sol[r] - sol[r + 1]) <= 1) return false;
      }
      return true;
    }

    const candidate = mod.generateUniquePuzzle();

    if (!candidate) {
      return {
        ok: false,
        reason: 'generateUniquePuzzle returned no puzzle',
        n
      };
    }

    const regionShapeOk = Array.isArray(candidate.region)
      && candidate.region.length === n
      && candidate.region.every((row) => Array.isArray(row) && row.length === n);

    const tierOk = Number.isInteger(candidate.tier) && candidate.tier >= 1 && candidate.tier <= 4;
    const scoreOk = typeof candidate.score === 'number' && Number.isFinite(candidate.score);

    return {
      ok: n === 8 && isValidSolution(candidate.sol) && regionShapeOk && tierOk && scoreOk,
      n,
      tier: candidate.tier,
      score: candidate.score,
      reason: 'Invariant check failed'
    };
  });

  expect(result.ok, JSON.stringify(result)).toBeTruthy();
});

test('ui core loop smoke test', async ({ page }) => {
  await page.goto('/king-max/');

  const cells = page.locator('#board .cell');
  await expect(cells).toHaveCount(64);
  await expect(page.getByLabel('Target realm difficulty')).toBeVisible();

  const firstCell = cells.nth(0);

  await firstCell.click();
  await expect(firstCell.locator('.dot')).toHaveCount(1);

  await firstCell.click();
  await expect(firstCell.locator('svg.crown')).toHaveCount(1);

  await firstCell.click();
  await expect(firstCell.locator('.dot')).toHaveCount(0);
  await expect(firstCell.locator('svg.crown')).toHaveCount(0);

  await page.getByRole('button', { name: 'New realm' }).click();
  await expect(cells).toHaveCount(64);

  await cells.nth(1).click();
  await cells.nth(1).click();
  await expect(page.locator('#board .cell svg.crown')).toHaveCount(1);

  await page.getByRole('button', { name: 'Clear realm' }).click();
  await expect(page.locator('#board .cell svg.crown')).toHaveCount(0);
});

test('board state is encoded in and restored from the URL', async ({ page, context }) => {
  await page.goto('/king-max/');

  const cells = page.locator('#board .cell');
  const crownCell = cells.nth(0);
  const dotCell = cells.nth(9);

  await crownCell.click();
  await crownCell.click();
  await dotCell.click();

  const encodedUrl = page.url();
  expect(encodedUrl).toContain('board=v1.');

  const restored = await context.newPage();
  await restored.goto(encodedUrl);

  const restoredCells = restored.locator('#board .cell');
  await expect(restoredCells).toHaveCount(64);
  await expect(restoredCells.nth(0).locator('svg.crown')).toHaveCount(1);
  await expect(restoredCells.nth(9).locator('.dot')).toHaveCount(1);
  await expect(restored.locator('#difficultyScore')).not.toHaveText('–');

  await restored.close();
});

test('share button copies the current encoded board URL', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/king-max/');

  const cells = page.locator('#board .cell');
  await cells.nth(0).click();
  await cells.nth(0).click();
  await cells.nth(9).click();

  await page.locator('#shareBtn').click();

  await expect(page.locator('#shareStatus')).toContainText('Realm link copied.');
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toBe(page.url());
  await expect(page.url()).toContain('board=v1.');
});

test('win banner appears after solving a board state', async ({ page }) => {
  await page.goto('/king-max/');

  const cells = page.locator('#board .cell');
  const colors = await cells.evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  const regionMap = [];
  for (let r = 0; r < 8; r++) {
    regionMap.push(colors.slice(r * 8, r * 8 + 8));
  }

  const placement = solveRegionMap(regionMap);
  for (let r = 0; r < 8; r++) {
    const cell = cells.nth(r * 8 + placement[r]);
    await cell.click();
    await cell.click();
  }

  await expect(page.locator('#winBanner')).toHaveClass(/show/);
  await expect(page.locator('#winStats')).toContainText('realm solved in');
});

test('subset tactic catches line-to-region subset eliminations', async ({ page }) => {
  await page.goto('/king-max/');

  const result = await page.evaluate(async () => {
    const mod = await import('../js/deterministic-tactics.js');

    const n = 4;
    const region = [
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3]
    ];

    const possible = [
      [true, true, false, false],
      [true, true, false, false],
      [true, true, true, true],
      [true, true, true, true]
    ];

    const rowDone = [false, false, false, false];
    const colDone = [false, false, false, false];
    const regionDone = [false, false, false, false];

    const state = {
      n,
      constraints() {
        const result = [];
        for (let r = 0; r < n; r++) if (!rowDone[r]) result.push({ type: 'row', index: r });
        for (let c = 0; c < n; c++) if (!colDone[c]) result.push({ type: 'col', index: c });
        for (let reg = 0; reg < n; reg++) if (!regionDone[reg]) result.push({ type: 'region', index: reg });
        return result;
      },
      candidatesAt(constraint) {
        const { type, index } = constraint;
        const a = [];
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (!possible[r][c]) continue;
            if (type === 'row' && r === index) a.push({ r, c });
            else if (type === 'col' && c === index) a.push({ r, c });
            else if (type === 'region' && region[r][c] === index) a.push({ r, c });
          }
        }
        return a;
      },
      regionOf(cell) { return region[cell.r][cell.c]; },
      eliminate(cell) {
        if (possible[cell.r][cell.c]) { possible[cell.r][cell.c] = false; return true; }
        return false;
      },
      setLastObservedRegions: () => {}
    };

    const changed = mod.trySubsets(state);

    return {
      changed,
      removedOutsideRowsForRegion0: !possible[2][0] && !possible[3][0],
      removedOutsideRowsForRegion1: !possible[2][1] && !possible[3][1]
    };
  });

  expect(result.changed, JSON.stringify(result)).toBeTruthy();
  expect(result.removedOutsideRowsForRegion0, JSON.stringify(result)).toBeTruthy();
  expect(result.removedOutsideRowsForRegion1, JSON.stringify(result)).toBeTruthy();
});

test('custom tactic weights influence difficulty scoring', async ({ page }) => {
  await page.goto('/king-max/');

  const result = await page.evaluate(async () => {
    const solver = await import('../js/human-solver.js');
    const weightMod = await import('../js/difficulty-weights.js');

    const n = 8;
    const region = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, () => r)
    );

    const boosted = weightMod.normalizeDifficultyWeights(weightMod.DEFAULT_DIFFICULTY_WEIGHTS);
    for (const [tacticId, map] of Object.entries(boosted.deterministic)) {
      for (const key of Object.keys(map)) {
        map[key] = map[key] + 50;
      }
      boosted.deterministic[tacticId] = map;
    }
    boosted.guess += 50;

    const baseline = solver.humanSolve(n, region, { difficultyWeights: weightMod.DEFAULT_DIFFICULTY_WEIGHTS });
    const tuned = solver.humanSolve(n, region, { difficultyWeights: boosted });

    return {
      ok: tuned.score !== baseline.score,
      baselineScore: baseline.score,
      tunedScore: tuned.score,
      baselineTier: baseline.tier,
      tunedTier: tuned.tier
    };
  });

  expect(result.ok, JSON.stringify(result)).toBeTruthy();
});

test('humanSolve emits a trace and Queens still solves correctly via GameInterface', async ({ page }) => {
  await page.goto('/king-max/');

  const result = await page.evaluate(async () => {
    const solver = await import('../js/human-solver.js');

    const n = 8;
    // One queen per row (each row is its own region) — trivially solved by hidden singles
    const region = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, () => r)
    );

    const out = solver.humanSolve(n, region);

    const traceOk = Array.isArray(out.trace) && out.trace.length > 0;
    const traceShapeOk = out.trace.every(
      (s) =>
        typeof s.tacticId === 'string' &&
        typeof s.tier === 'number' &&
        typeof s.observedConstraints === 'number'
    );
    const scoreConsistent = out.score >= 0 && Number.isFinite(out.score);

    return {
      ok: out.solved && traceOk && traceShapeOk && scoreConsistent,
      solved: out.solved,
      traceLength: out.trace.length,
      traceOk,
      traceShapeOk,
      scoreConsistent,
      score: out.score,
      tier: out.tier
    };
  });

  expect(result.ok, JSON.stringify(result)).toBeTruthy();
});

test('scoreSolveTrace returns correct score for a known trace', async ({ page }) => {
  await page.goto('/king-max/');

  const result = await page.evaluate(async () => {
    const { scoreSolveTrace } = await import('../js/difficulty-scorer.js');
    const { DEFAULT_DIFFICULTY_WEIGHTS } = await import('../js/difficulty-weights.js');

    // Known trace: two hidden-singles steps (tier 1, observedConstraints 1, weight 1 each)
    // plus one guess step (tier 4, weight 200)
    const trace = [
      { tacticId: 'hidden-singles', tier: 1, observedConstraints: 1 },
      { tacticId: 'hidden-singles', tier: 1, observedConstraints: 1 },
      { tacticId: 'guess', tier: 4, observedConstraints: 0 }
    ];

    const { score, maxTier, steps } = scoreSolveTrace(trace, DEFAULT_DIFFICULTY_WEIGHTS);

    // hidden-singles weight at 1 region = 1 each; guess = 200; total = 202
    return {
      ok: score === 202 && maxTier === 4 && Array.isArray(steps) && steps.length === trace.length,
      score,
      maxTier,
      stepsLength: steps.length
    };
  });

  expect(result.ok, JSON.stringify(result)).toBeTruthy();
});

test('makeAnnotation validates required fields and returns frozen object', async ({ page }) => {
  await page.goto('/king-max/');

  const result = await page.evaluate(async () => {
    const { makeAnnotation } = await import('../js/reasoning-annotation.js');

    // Test 1: Valid annotation
    const valid = makeAnnotation({
      tacticId: 'hidden-singles',
      tacticLabel: 'Hidden Singles',
      observed: [{ r: 0, c: 1 }, { r: 0, c: 2 }],
      concluded: [{ r: 0, c: 3 }],
      conclusionType: 'place',
      explanationText: 'Row 0 has only one candidate.'
    });

    const validOk = valid.tacticId === 'hidden-singles' && valid.kind === 'deterministic' && Object.isFrozen(valid);

    // Test 2: Missing required field throws
    let missingError = false;
    try {
      makeAnnotation({
        tacticId: 'hidden-singles',
        tacticLabel: 'Hidden Singles',
        concluded: [{ r: 0, c: 3 }],
        conclusionType: 'place',
        explanationText: 'Row 0 has only one candidate.'
        // missing 'observed'
      });
    } catch (e) {
      missingError = e.message.includes('observed');
    }

    // Test 3: Invalid conclusionType throws
    let invalidTypeError = false;
    try {
      makeAnnotation({
        tacticId: 'hidden-singles',
        tacticLabel: 'Hidden Singles',
        observed: [],
        concluded: [{ r: 0, c: 3 }],
        conclusionType: 'invalid',
        explanationText: 'Row 0 has only one candidate.'
      });
    } catch (e) {
      invalidTypeError = e.message.includes('conclusionType');
    }

    // Test 4: Intuitive annotation with confidence
    const intuitive = makeAnnotation({
      tacticId: 'constraint-pressure',
      tacticLabel: 'Constraint Pressure',
      observed: [{ r: 0, c: 1 }],
      concluded: [{ r: 0, c: 2 }],
      conclusionType: 'place',
      explanationText: 'High constraint pressure here.',
      kind: 'intuitive',
      confidence: 0.85,
      basisText: 'In 85% of similar boards, the crown goes here.'
    });

    const intuitiveOk = intuitive.kind === 'intuitive' && intuitive.confidence === 0.85 && Object.isFrozen(intuitive);

    return {
      validOk,
      missingError,
      invalidTypeError,
      intuitiveOk
    };
  });

  expect(result.validOk, 'Valid annotation should be frozen').toBeTruthy();
  expect(result.missingError, 'Missing required field should throw').toBeTruthy();
  expect(result.invalidTypeError, 'Invalid conclusionType should throw').toBeTruthy();
  expect(result.intuitiveOk, 'Intuitive annotation should include confidence').toBeTruthy();
});

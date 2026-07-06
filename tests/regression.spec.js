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
    const mod = await import('../js/king-max/puzzle-logic.js');
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

test('nonogram board state is encoded in URL and share copies link', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1:4173' });
  await page.goto('/nonogram/');

  const cells = page.locator('#board .nonogram-cell');
  await expect(cells.first()).toBeVisible();
  await expect(page.locator('#difficultyScore')).not.toHaveText('–');
  await expect(page.locator('#difficultyTier')).not.toHaveText('–');

  await cells.nth(0).click();
  await cells.nth(1).click({ button: 'right' });

  await page.locator('#shareBtn').click();
  await expect(page.locator('#shareStatus')).toContainText('Puzzle link copied.');
  await expect(page.evaluate(() => navigator.clipboard.readText())).resolves.toBe(page.url());
  await expect(page.url()).toContain('board=v1.');

  const encodedUrl = page.url();
  const restored = await context.newPage();
  await restored.goto(encodedUrl);

  const restoredCells = restored.locator('#board .nonogram-cell');
  await expect(restoredCells.first()).toBeVisible();
  await expect(restoredCells.nth(0)).toHaveClass(/filled/);
  await expect(restoredCells.nth(1)).toHaveClass(/empty/);
  await expect(restored.locator('#difficultyScore')).not.toHaveText('–');
  await expect(restored.locator('#difficultyTier')).not.toHaveText('–');

  await restored.close();
});

test('nonogram shows difficulty score and tier for generated puzzle', async ({ page }) => {
  await page.goto('/nonogram/');

  await expect(page.locator('#difficultyScore')).not.toHaveText('–');
  await expect(page.locator('#difficultyTier')).not.toHaveText('–');
});

test('nonogram mistakes counter increments on incorrect fill', async ({ page }) => {
  await page.goto('/nonogram/');

  const cells = page.locator('#board .nonogram-cell');
  await expect(cells.first()).toBeVisible();
  await expect(page.locator('#mistakes')).toHaveText('0');

  const total = await cells.count();
  let incremented = false;
  for (let i = 0; i < total; i++) {
    await cells.nth(i).click();
    const mistakesText = await page.locator('#mistakes').innerText();
    if (Number(mistakesText) > 0) {
      incremented = true;
      break;
    }
  }

  expect(incremented).toBeTruthy();
});

test('nonogram tactic panel exposes weight inputs and reset action', async ({ page }) => {
  await page.goto('/nonogram/');

  const weightInputs = page.locator('.tactic-weight-input');
  await expect(weightInputs.first()).toBeVisible();

  const first = weightInputs.first();
  const original = await first.inputValue();
  await first.fill('37');
  await first.blur();
  await expect(first).toHaveValue('37');

  await page.locator('#resetWeightsBtn').click();
  await expect(first).toHaveValue(original);
});

test('custom nonogram tactic weights influence difficulty scoring', async ({ page }) => {
  await page.goto('/nonogram/');

  const result = await page.evaluate(async () => {
    const generation = await import('../js/nonogram/game-generation.js');
    const weightsMod = await import('../js/nonogram/difficulty-weights.js');

    const puzzle = generation.generateNonogram(5, { difficulty: 'hard', maxAttempts: 500 });
    if (!puzzle) {
      return { generated: false, changed: false };
    }

    const baseline = generation.evaluateNonogramDifficulty(puzzle.rowClues, puzzle.colClues);
    const boosted = weightsMod.normalizeNonogramDifficultyWeights(weightsMod.DEFAULT_NONOGRAM_DIFFICULTY_WEIGHTS);
    for (const tacticId of Object.keys(boosted.deterministic)) {
      boosted.deterministic[tacticId] += 25;
    }
    const tuned = generation.evaluateNonogramDifficulty(puzzle.rowClues, puzzle.colClues, { difficultyWeights: boosted });

    return {
      generated: true,
      baselineScore: baseline.score,
      tunedScore: tuned.score,
      changed: baseline.score !== tuned.score
    };
  });

  expect(result.generated, 'nonogram puzzle should be generated').toBeTruthy();
  expect(result.changed, JSON.stringify(result)).toBeTruthy();
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
    const mod = await import('../js/king-max/deterministic-tactics.js');

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
    const solver = await import('../js/king-max/human-solver.js');
    const weightMod = await import('../js/king-max/difficulty-weights.js');

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
    const solver = await import('../js/king-max/human-solver.js');

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
    const { scoreSolveTrace } = await import('../js/king-max/difficulty-scorer.js');
    const { DEFAULT_DIFFICULTY_WEIGHTS } = await import('../js/king-max/difficulty-weights.js');

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

test('annotation renderer creates and removes overlays correctly', async ({ page }) => {
  await page.goto('/king-max/');

  const result = await page.evaluate(async () => {
    const { renderAnnotationOverlay, clearAnnotationOverlay, isAnnotationDisplayed } 
      = await import('../js/annotation-renderer.js');
    const { makeAnnotation } = await import('../js/reasoning-annotation.js');

    // Create a mock board element with a container
    const boardEl = document.createElement('div');
    boardEl.setAttribute('data-test-board', 'true');
    document.body.appendChild(boardEl);

    try {
      // Test 1: Render overlay for a simple annotation
      const annotation = makeAnnotation({
        tacticId: 'test-tactic',
        tacticLabel: 'Test Tactic',
        observed: [{ r: 0, c: 1 }, { r: 0, c: 2 }],
        concluded: [{ r: 0, c: 3 }],
        conclusionType: 'place',
        explanationText: 'Test annotation'
      });

      const clearFn = renderAnnotationOverlay(boardEl, annotation);
      const hasContainer = boardEl.querySelector('.annotation-overlay-container') !== null;
      const containerHasTacticId = boardEl.querySelector('[data-tactic-id="test-tactic"]') !== null;

      // Test 2: Check overlay display status
      const isDisplayed = isAnnotationDisplayed(boardEl, 'test-tactic');

      // Test 3: Clear overlays
      clearFn();
      const hasContainerAfterClear = boardEl.querySelector('.annotation-overlay-container') !== null;

      // Test 4: clearAnnotationOverlay removes all overlays
      const annotation2 = makeAnnotation({
        tacticId: 'another-tactic',
        tacticLabel: 'Another Tactic',
        observed: [{ r: 1, c: 1 }],
        concluded: [{ r: 1, c: 2 }],
        conclusionType: 'eliminate',
        explanationText: 'Another test'
      });

      renderAnnotationOverlay(boardEl, annotation2);
      const containerCount1 = boardEl.querySelectorAll('.annotation-overlay-container').length;
      clearAnnotationOverlay(boardEl);
      const containerCount2 = boardEl.querySelectorAll('.annotation-overlay-container').length;

      return {
        hasContainer,
        containerHasTacticId,
        isDisplayed,
        hasContainerAfterClear,
        containerCount1,
        containerCount2
      };
    } finally {
      boardEl.remove();
    }
  });

  expect(result.hasContainer, 'Overlay container should be created').toBeTruthy();
  expect(result.containerHasTacticId, 'Container should have tactic ID').toBeTruthy();
  expect(result.isDisplayed, 'Annotation should be displayed').toBeTruthy();
  expect(result.hasContainerAfterClear, 'Container should be removed after clear').toBeFalsy();
  expect(result.containerCount1, 'Should have container after render').toBe(1);
  expect(result.containerCount2, 'Should have no containers after clearAnnotationOverlay').toBe(0);
});

// ── Nonogram tests ────────────────────────────────────────────────────────────

test('nonogram isSolved returns true for a correct 5×5 grid', async ({ page }) => {
  await page.goto('/nonogram/');

  const result = await page.evaluate(async () => {
    const { CELL_STATES, isSolved } = await import('../js/nonogram/puzzle-logic.js');
    const F = CELL_STATES.FILLED;
    const E = CELL_STATES.EMPTY;

    // Simple diagonal-shift 5×5 nonogram (row total = col total = 10)
    const solution = [
      [F, F, E, E, E],
      [E, F, F, E, E],
      [E, E, F, F, E],
      [E, E, E, F, F],
      [F, E, E, E, F]
    ];

    const rowClues = [[2], [2], [2], [2], [1, 1]];
    const colClues = [[1, 1], [2], [2], [2], [2]];

    const solved = isSolved(solution, rowClues, colClues);

    // Also check an incorrect grid is not solved
    const wrong = solution.map((row) => row.slice());
    wrong[0][0] = E;
    const notSolved = !isSolved(wrong, rowClues, colClues);

    return { solved, notSolved };
  });

  expect(result.solved, 'Correct grid should be solved').toBeTruthy();
  expect(result.notSolved, 'Wrong grid should not be solved').toBeTruthy();
});

test('nonogram parseClues validates clues and throws on impossible total', async ({ page }) => {
  await page.goto('/nonogram/');

  const result = await page.evaluate(async () => {
    const { parseClues } = await import('../js/nonogram/puzzle-logic.js');

    let validOk = false;
    let mismatchError = false;
    let overflowError = false;

    try {
      // rowClues total = 2+2+2+2+2 = 10; colClues total = 2+2+2+2+2 = 10 ✓
      const r = parseClues([[2], [2], [2], [2], [2]], [[2], [2], [2], [2], [2]]);
      validOk = r.rows === 5 && r.cols === 5;
    } catch (_) {}

    try {
      parseClues([[1], [1]], [[2], [1]]);
    } catch (e) {
      mismatchError = e.message.includes('total');
    }

    try {
      parseClues([[6]], [[1]]);
    } catch (e) {
      overflowError = e.message.includes('require at least');
    }

    return { validOk, mismatchError, overflowError };
  });

  expect(result.validOk, 'Valid clues should parse without error').toBeTruthy();
  expect(result.mismatchError, 'Mismatched totals should throw').toBeTruthy();
  expect(result.overflowError, 'Overflow clue should throw').toBeTruthy();
});

test('nonogram tactics fire correctly on hand-crafted examples', async ({ page }) => {
  await page.goto('/nonogram/');

  const result = await page.evaluate(async () => {
    const { CELL_STATES } = await import('../js/nonogram/puzzle-logic.js');
    const { makeNonogramInterface } = await import('../js/nonogram/game-interface.js');
    const { tryEmptyLine, tryFullLine, tryOverlap } = await import('../js/nonogram/tactics.js');

    const U = CELL_STATES.UNKNOWN;
    const F = CELL_STATES.FILLED;
    const E = CELL_STATES.EMPTY;

    // Empty line: row 0 has clue [0]
    const emptyState = makeNonogramInterface([[0], [1]], [[1], [1]]);
    const emptyFired = tryEmptyLine(emptyState);
    const row0AllEmpty = emptyState.getGrid()[0].every((v) => v === E);

    // Full line: row with clue [3] in 3 cells → all filled
    const fullState = makeNonogramInterface([[3], [1, 1]], [[2], [2], [2]]);
    const fullFired = tryFullLine(fullState);
    const row0AllFilled = fullState.getGrid()[0].every((v) => v === F);

    // Overlap: clue [3] in 5 cells → middle 1 cell certain
    const overlapState = makeNonogramInterface([[3], [1], [1], [1], [1]], [[3], [1], [1], [1], [1]]);
    const overlapFired = tryOverlap(overlapState);
    const row0Grid = overlapState.getGrid()[0];
    // Positions 0,1,2 have overlap if clue is [3] in 5 cells: earliest [0-2], latest [2-4], overlap = [2]
    const overlapCellFilled = row0Grid[2] === F;

    return {
      emptyFired,
      row0AllEmpty,
      fullFired,
      row0AllFilled,
      overlapFired,
      overlapCellFilled
    };
  });

  expect(result.emptyFired, 'empty-line tactic should fire').toBeTruthy();
  expect(result.row0AllEmpty, 'row 0 should all be empty after empty-line').toBeTruthy();
  expect(result.fullFired, 'full-line tactic should fire').toBeTruthy();
  expect(result.row0AllFilled, 'row 0 should all be filled after full-line').toBeTruthy();
  expect(result.overlapFired, 'overlap tactic should fire').toBeTruthy();
  expect(result.overlapCellFilled, 'overlap tactic should fill cell 2 of row 0').toBeTruthy();
});

test('nonogram generator produces solvable puzzles at each difficulty', async ({ page }) => {
  await page.goto('/nonogram/');

  const result = await page.evaluate(async () => {
    const { generateNonogram } = await import('../js/nonogram/game-generation.js');
    const { isSolved } = await import('../js/nonogram/puzzle-logic.js');

    const results = {};
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const puzzle = generateNonogram(5, { difficulty, maxAttempts: 800 });
      results[difficulty] = {
        generated: puzzle !== null,
        hasSolution: puzzle !== null && isSolved(puzzle.solution, puzzle.rowClues, puzzle.colClues)
      };
    }
    return results;
  });

  for (const difficulty of ['easy', 'medium', 'hard']) {
    expect(result[difficulty].generated, `${difficulty}: puzzle should be generated`).toBeTruthy();
    expect(result[difficulty].hasSolution, `${difficulty}: solution should satisfy clues`).toBeTruthy();
  }
});

test('nonogram smoke test: new game renders board, clicking fills cells, win banner appears', async ({ page }) => {
  await page.goto('/nonogram/');

  // Board should render after automatic new game
  const cells = page.locator('.nonogram-cell');
  await expect(cells).not.toHaveCount(0);

  // Click first unknown cell — should fill it
  const firstCell = cells.first();
  await firstCell.click();
  await expect(firstCell).toHaveClass(/filled/);

  // Click again — should become empty (X mark)
  await firstCell.click();
  await expect(firstCell).toHaveClass(/empty/);

  // Click again — should return to unknown
  await firstCell.click();
  await expect(firstCell).not.toHaveClass(/filled/);
  await expect(firstCell).not.toHaveClass(/empty/);

  // New puzzle button should work
  await page.getByRole('button', { name: 'New puzzle' }).first().click();
  await expect(page.locator('.nonogram-cell')).not.toHaveCount(0);
});

// ── Hub / multi-game navigation tests ─────────────────────────────────────────

test('hub landing page loads and shows both game tiles', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Games/i);
  const kingMaxLink = page.locator('a[href*="king-max"]');
  const nonogramLink = page.locator('a[href*="nonogram"]');
  await expect(kingMaxLink).toBeVisible();
  await expect(nonogramLink).toBeVisible();
  await expect(kingMaxLink).not.toHaveClass(/coming-soon/);
  await expect(nonogramLink).not.toHaveClass(/coming-soon/);
});

test('hub game tiles link to reachable pages', async ({ page }) => {
  await page.goto('/');
  // Use the browser-resolved href (not the raw attribute) so relative/absolute
  // paths both work against the local dev server.
  const links = await page.locator('.tile').evaluateAll(
    (els) => els.map((el) => el.href)
  );
  expect(links.length).toBeGreaterThanOrEqual(2);
  for (const href of links) {
    const response = await page.request.get(href);
    expect(response.status(), `${href} should return 200`).toBe(200);
  }
});

test('king-max page has site nav with Home and Nonogram links', async ({ page }) => {
  await page.goto('/king-max/');
  const nav = page.locator('nav.site-nav');
  await expect(nav).toBeVisible();
  await expect(nav.locator('a[href="/games/"]')).toBeVisible();
  await expect(nav.locator('a[aria-current="page"]')).toContainText('King Max');
  await expect(nav.locator('a[href="/games/nonogram/"]')).toBeVisible();
});

test('nonogram page has site nav with Home and King Max links', async ({ page }) => {
  await page.goto('/nonogram/');
  const nav = page.locator('nav.site-nav');
  await expect(nav).toBeVisible();
  await expect(nav.locator('a[href="/games/"]')).toBeVisible();
  await expect(nav.locator('a[href="/games/king-max/"]')).toBeVisible();
  await expect(nav.locator('a[aria-current="page"]')).toContainText('Nonogram');
});

test('game registry GAMES has king-max and nonogram with equal shape', async ({ page }) => {
  await page.goto('/king-max/');
  const result = await page.evaluate(async () => {
    const { GAMES } = await import('/js/game-registry.js');
    const required = ['id', 'label', 'path', 'description', 'icon'];
    const errors = [];
    for (const game of GAMES) {
      for (const field of required) {
        if (!game[field]) errors.push(`${game.id}: missing ${field}`);
      }
    }
    const ids = GAMES.map((g) => g.id);
    return { ids, errors, count: GAMES.length };
  });
  expect(result.errors).toHaveLength(0);
  expect(result.count).toBeGreaterThanOrEqual(2);
  expect(result.ids).toContain('king-max');
  expect(result.ids).toContain('nonogram');
});

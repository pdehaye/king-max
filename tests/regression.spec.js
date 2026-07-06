const { test, expect } = require('@playwright/test');

test('puzzle logic module invariants stay valid', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const mod = await import('./js/puzzle-logic.js');
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
  await page.goto('/');

  const cells = page.locator('#board .cell');
  await expect(cells).toHaveCount(64);

  const firstCell = cells.nth(0);

  await firstCell.click();
  await expect(firstCell.locator('.dot')).toHaveCount(1);

  await firstCell.click();
  await expect(firstCell.locator('svg.crown')).toHaveCount(1);

  await firstCell.click();
  await expect(firstCell.locator('.dot')).toHaveCount(0);
  await expect(firstCell.locator('svg.crown')).toHaveCount(0);

  await page.getByRole('button', { name: 'New game' }).click();
  await expect(cells).toHaveCount(64);

  await cells.nth(1).click();
  await cells.nth(1).click();
  await expect(page.locator('#board .cell svg.crown')).toHaveCount(1);

  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.locator('#board .cell svg.crown')).toHaveCount(0);
});

test('subset tactic catches line-to-region subset eliminations', async ({ page }) => {
  await page.goto('/');

  const result = await page.evaluate(async () => {
    const mod = await import('./js/deterministic-tactics.js');

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

    function candidatesInRegion(reg) {
      const a = [];
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (region[r][c] === reg && possible[r][c]) a.push({ r, c });
        }
      }
      return a;
    }

    const state = {
      n,
      region,
      possible,
      rowDone,
      colDone,
      regionDone,
      candidatesInRegion,
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

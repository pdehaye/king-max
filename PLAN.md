# Plan: Nurikabe Game

## Goal

Implement the Nurikabe logic puzzle as the second game in this repository, removing the "coming soon" placeholder from the landing page.

## Nurikabe Rules

- The grid is divided into white **island** cells and black **river** cells.
- Each clue cell (numbered white cell) is the seed of an island whose total size equals that number.
- Every island contains exactly one clue cell and is orthogonally connected.
- All black river cells form a single orthogonally connected group.
- No 2×2 block of black cells is allowed.

## Scope for This PR

### 1. Game page — `nurikabe/index.html`
- A playable Nurikabe puzzle using a curated set of hardcoded 5×5 and 7×7 puzzles.
- Click a cell to toggle it black (river). Clue cells are fixed.
- Conflict highlighting: red border on 2×2 black blocks, disconnected river segments, oversized or undersized islands.
- Win detection: all constraints satisfied → show a win banner.
- "New puzzle" button cycles through the puzzle set.
- Responsive, accessible UI matching the King Max visual style (`../styles.css`).

### 2. Build integration — `package.json`
- Extend `build:site:base` to copy `nurikabe/index.html` into `_site/nurikabe/`.

### 3. Landing page — `index.html`
- Make the Nurikabe tile a real link (remove `coming-soon` class and `aria-disabled`).

### 4. Regression test — `tests/regression.spec.js`
- Smoke test: page loads, grid is visible, clicking a non-clue cell marks it black.
- Win test: applying a known solution triggers the win banner.

## Acceptance Criteria

- [ ] `npm test` passes (all existing + new tests green).
- [ ] `npm run build:site:base` completes without error.
- [ ] Landing page links to `/nurikabe/` without the "coming soon" style.
- [ ] Placing an invalid move (e.g. 2×2 black block) shows a conflict indicator.
- [ ] Correctly solving any built-in puzzle shows the win banner.

# Epic 3 — Second Game: Nonogram (Picross)

> **Goal:** Add a fully playable Nonogram puzzle as a second game, validating that the shared `GameInterface`, annotation system, and Storybook infrastructure work for a game with completely different rules.

---

## Why Nonogram?

- Binary state per cell (filled / empty) — simpler than Queens.
- Rich deterministic tactic vocabulary: full-line, empty-line, overlap, box-reduction, contradiction.
- No adjacency constraints — tests that the interface is not Queens-biased.
- Player interaction model (left-click fill, right-click cross) differs from Queens — tests UI abstraction.

---

## Issue 3.1 — Nonogram data model and constraint types

**Labels:** `architecture`, `no-ui`, `nonogram`

### Acceptance Criteria

- [ ] Create `js/nonogram/puzzle-logic.js` that exports:
  - `parseClues(rowClues, colClues)` — validates clue arrays, throws on impossible total.
  - `isSolved(grid, rowClues, colClues)` — returns true when all clues are satisfied.
  - `CELL_STATES = { UNKNOWN: 0, FILLED: 1, EMPTY: -1 }`.
- [ ] Create `js/nonogram/game-interface.js` that exports `makeNonogramInterface(rowClues, colClues)` returning a `GameInterface`-conforming object.
  - Constraints are rows and columns.
  - `candidatesAt(constraint)` returns cells in that row/col still in UNKNOWN state.
  - `place(cell, tier)` marks FILLED; add `eliminate(cell, tier)` for EMPTY marks.
- [ ] Unit tests (Playwright) covering `isSolved` on a 5×5 example with known clues.

---

## Issue 3.2 — Nonogram deterministic tactics

**Labels:** `no-ui`, `nonogram`
**Depends on:** 3.1

### Tactics to implement (in `js/nonogram/tactics.js`)

| Tactic | Description |
|---|---|
| `full-line` | Sum of clues + gaps = line length → every cell's assignment is determined |
| `empty-line` | All clues are 0 → mark whole line EMPTY |
| `overlap` | The earliest and latest valid position for each clue block overlap → fill intersection |
| `edge-fill` | A clue block must start at edge → fill from edge inward |
| `box-reduction` | Already-filled runs that can only belong to one clue block |
| `contradiction-empty` | If marking a cell FILLED leads to an over-run, mark it EMPTY |

### Acceptance Criteria

- [ ] Each tactic exported as `tryXxx(state)` returning `boolean`, calling `state.annotate(...)` when firing.
- [ ] `NONOGRAM_TACTIC_DESCRIPTORS` array (parallel to Queens' `DETERMINISTIC_TACTIC_DESCRIPTORS`).
- [ ] Storybook stories: one story per tactic in `stories/nonogram-tactics.stories.js`, showing the board before and after the tactic fires with annotation overlay.
- [ ] All tactics pass unit tests with hand-crafted 5×5 and 10×10 examples.

---

## Issue 3.3 — Nonogram board renderer

**Labels:** `ui`, `visual`, `nonogram`
**Depends on:** 3.1

### Acceptance Criteria

- [ ] Create `js/nonogram/board-visuals.js` exporting:
  - `renderNonogramBoard(container, rowClues, colClues, grid, options)` — builds the DOM grid with clue headers.
  - `updateCell(cell, state)` — updates a single cell's visual state (UNKNOWN / FILLED / EMPTY).
- [ ] Left-click cycles UNKNOWN → FILLED → EMPTY → UNKNOWN.
- [ ] Right-click toggles UNKNOWN ↔ EMPTY (cross mark).
- [ ] Clue headers show numbers; satisfied clues go grey.
- [ ] Annotation overlay from `js/annotation-renderer.js` applies correctly to Nonogram cells.
- [ ] Storybook story `NonogramBoard` renders a static 5×5 puzzle with a known solution.

---

## Issue 3.4 — Nonogram puzzle generator

**Labels:** `no-ui`, `nonogram`
**Depends on:** 3.2

### Acceptance Criteria

- [ ] Create `js/nonogram/game-generation.js` exporting `generateNonogram(size, options)`.
  - Generates a random binary grid, derives clues from it, and verifies the puzzle has a unique solution reachable by the tactics in Issue 3.2.
  - Returns `{ rowClues, colClues, solution }`.
- [ ] `options.difficulty` drives which tactics are allowed during verification (mirrors Queens' tier system).
- [ ] Playwright test: generator produces a uniquely solvable puzzle at each difficulty level.

---

## Issue 3.5 — Nonogram game page

**Labels:** `ui`, `nonogram`
**Depends on:** 3.3, 3.4

### Acceptance Criteria

- [ ] Create `nonogram/index.html` — a self-contained Nonogram game page.
  - Reuses shared JS modules via relative `../js/` imports.
  - Same visual style as Queens (`styles.css`).
- [ ] Controls: New Game, Clear, Hint (reveals one tactic step), Step (annotation step-through from Epic 2).
- [ ] Win detection: shows win banner when puzzle is solved.
- [ ] Difficulty selector (Easy / Medium / Hard).
- [ ] Playwright smoke test: new game renders a board; clicking fills cells; win banner appears after solving.

# Epic 4 — Intuitive Deductions

> **Goal:** Add a second tier of "intuitive" hint moves that go beyond strict logical deduction — using pattern frequency, constraint pressure, and heuristic scoring — and visualise them distinctly from deterministic ones.

---

## Background: Deterministic vs Intuitive

**Deterministic tactics** (current): if the tactic fires, the conclusion is *always* correct. The solver can rely on it unconditionally.

**Intuitive tactics** (new): the conclusion is *highly likely but not guaranteed* from the tactic's perspective. Think of how a human expert "sees" a good move: "this region feels very constrained, the crown probably goes here." These are:
- Heuristic — based on counting or pattern matching, not proof.
- Probabilistic — backed by empirical frequency from generated puzzles.
- Useful for *guiding* players who are stuck even after exhausting deterministic steps.

Intuitive tactics should never be presented as certain. The UI should distinguish them clearly (e.g. dashed overlay instead of solid).

---

## Issue 4.1 — Define the `IntuitiveAnnotation` extension

**Labels:** `architecture`, `no-ui`
**Depends on:** Issue 2.1

### Acceptance Criteria

- [ ] Extend `js/reasoning-annotation.js` with:
  ```js
  /**
   * @typedef {ReasoningAnnotation & Object} IntuitiveAnnotation
   * @property {'intuitive'} kind       - discriminator
   * @property {number} confidence      - 0.0–1.0, empirical or heuristic
   * @property {string} basisText       - e.g. "In 87% of similar boards, the crown goes here."
   */
  ```
- [ ] `makeAnnotation` accepts optional `kind`, `confidence`, and `basisText`; defaults `kind` to `'deterministic'`.
- [ ] Annotation renderer in Issue 2.3 uses a **dashed** border and lighter fill for `kind === 'intuitive'`.

---

## Issue 4.2 — Constraint-pressure heuristic (Queens)

**Labels:** `no-ui`, `heuristic`, `queens`
**Depends on:** 4.1, Epic 1

### Background

When no deterministic tactic fires, rank remaining candidate cells by "constraint pressure": how many solved rows, columns, and regions are adjacent or overlapping. High pressure → more likely to be the correct placement.

### Acceptance Criteria

- [ ] Create `js/queens/intuitive-tactics.js` exporting `tryConstraintPressure(state)`.
  - Scores each candidate cell by: (number of solved row/col/region neighbours) + (region size inversely — smaller remaining region = higher pressure).
  - Calls `state.annotate(makeAnnotation({ kind: 'intuitive', confidence, ... }))` with the top-scoring cell as `concluded`.
  - Returns `true` if it found any candidate; `false` if board is empty of candidates.
- [ ] Confidence is `min(pressure / maxPossiblePressure, 0.95)` — never claims 100%.
- [ ] Storybook story `ConstraintPressure` shows the overlay on a mid-game Queens board.

---

## Issue 4.3 — Empirical frequency lookup (Queens)

**Labels:** `no-ui`, `heuristic`, `queens`
**Depends on:** 4.1, Issue 3.4 (generator infrastructure)

### Background

Run 10,000 generated Queens puzzles, collect for each "candidate set shape" (which rows/cols/regions remain unsolved) → which cell was placed. Store a frequency table keyed by a compact hash of the candidate set.

### Acceptance Criteria

- [ ] Create `scripts/build-frequency-table.mjs` that generates puzzles, solves them, and writes `js/queens/frequency-table.generated.js` (a frozen JS object exported as default).
- [ ] Create `js/queens/frequency-tactic.js` exporting `tryFrequencyBias(state)`:
  - Hashes current candidate state → looks up frequency table.
  - If hit, annotates the highest-frequency cell with `kind: 'intuitive'`, `confidence` = hit frequency.
  - Returns `false` on miss (graceful fallback to constraint-pressure).
- [ ] Table generation is a build script, not run at game time.
- [ ] Storybook story `FrequencyBias` shows an annotated cell with a confidence badge.

---

## Issue 4.4 — Nonogram intuitive tactic: block-density

**Labels:** `no-ui`, `heuristic`, `nonogram`
**Depends on:** 4.1, Epic 3

### Background

For Nonogram, a useful intuitive tactic is **block density**: if a line has many filled clue blocks relative to its length, the centre cells are probably FILLED regardless of exact block positions (an approximation of the overlap tactic when clue sums are not quite tight enough for the deterministic overlap to fire).

### Acceptance Criteria

- [ ] Create `js/nonogram/intuitive-tactics.js` exporting `tryBlockDensity(state)`.
  - For each unsolved line, compute fill-density = (sum of clue blocks) / line-length.
  - If density > 0.7, annotate the centre cells as likely FILLED with `confidence = density * 0.9`.
- [ ] Storybook story showing a Nonogram line with density annotation.

---

## Issue 4.5 — Intuitive hint mode UI

**Labels:** `ui`, `gameplay`
**Depends on:** 4.2, 4.3 (or 4.4 for Nonogram)

### Acceptance Criteria

- [ ] The existing "Hint" button first tries deterministic tactics (as before).
- [ ] If no deterministic step fires, it tries intuitive tactics and shows the annotation overlay with:
  - Dashed border highlight on the suggested cell.
  - Banner: "Intuitive suggestion ({confidence}% confident): {basisText}" in a distinct colour (amber, not green).
- [ ] Add a setting toggle "Show intuitive hints" (default ON). When OFF, the hint button stops at deterministic.
- [ ] The step-through "Step" button (Issue 2.4) skips intuitive steps unless "Show intuitive hints" is ON.
- [ ] Playwright test: with no deterministic steps available, "Hint" shows an amber intuitive banner.

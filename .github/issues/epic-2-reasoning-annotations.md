# Epic 2 — Reasoning Annotation System

> **Goal:** Make every tactic emit a structured **annotation** describing what it saw and what it concluded. Render these annotations as overlays on the board, and expose them in a step-through UI.

---

## Issue 2.1 — Define the `ReasoningAnnotation` data structure

**Labels:** `architecture`, `no-ui`
**Depends on:** Epic 1 (Issue 1.2)

### Background

Currently, tactics return a boolean (did I fire?). The hint system in `index.html` displays a text message. We want every tactic to also emit a structured annotation: *which cells were inspected*, *which constraint triggered*, *which cells were concluded*.

### Acceptance Criteria

- [ ] Create `js/reasoning-annotation.js` that exports the `ReasoningAnnotation` typedef:
  ```js
  /**
   * @typedef {Object} ReasoningAnnotation
   * @property {string} tacticId        - e.g. 'hidden-singles'
   * @property {string} tacticLabel     - human-readable label
   * @property {Array<{r,c}>} observed  - cells that were inspected to reach the conclusion
   * @property {Array<{r,c}>} concluded - cells that were placed or eliminated
   * @property {'place'|'eliminate'} conclusionType
   * @property {string} explanationText - one-sentence plain-English reason
   */
  ```
- [ ] Export a helper `makeAnnotation(fields)` that validates required fields and returns a frozen annotation object.
- [ ] Unit test: `makeAnnotation` throws if required fields are missing.

---

## Issue 2.2 — Emit annotations from Queens tactics

**Labels:** `no-ui`
**Depends on:** 2.1

### Background

Each tactic in `js/deterministic-tactics.js` should, when it fires, call `state.annotate(annotation)` in addition to calling `state.place(...)`.

### Acceptance Criteria

- [ ] Add `annotate(annotation)` to `GameInterface` (Issue 1.1 update).
- [ ] Each tactic in `js/deterministic-tactics.js` calls `state.annotate(makeAnnotation({...}))` with filled `observed`, `concluded`, and `explanationText` before returning `true`.
- [ ] `humanSolve` collects annotations into an `annotations` array returned alongside `{ score, maxTier, steps }`.
- [ ] Storybook story `HiddenSingles` logs the annotation to the story panel (use Storybook `action`).
- [ ] All existing regression tests still pass.

### Annotation text examples (for Queens)

| Tactic | explanationText template |
|---|---|
| hidden-singles | "Row {r} has only one candidate cell: ({r},{c})." |
| locked-candidates | "All candidates for region {reg} fall in row {r}, eliminating other candidates in that row." |
| excluded-neighbour-* | "Regions {A} and {B} share a border; placing in either forces the other's crown position." |

---

## Issue 2.3 — Board annotation overlay renderer

**Labels:** `ui`, `visual`
**Depends on:** 2.1

### Background

`js/board-visuals.js` renders the grid and crowns. We need a layer on top that highlights cells from an annotation without modifying existing rendering logic.

### Acceptance Criteria

- [ ] Create `js/annotation-renderer.js` that exports:
  - `renderAnnotationOverlay(boardEl, annotation, options)` — adds coloured overlays to cells.
  - `clearAnnotationOverlay(boardEl)` — removes all overlays.
- [ ] `observed` cells get a soft highlight (e.g. yellow tint with 40% opacity).
- [ ] `concluded` cells get a stronger highlight (green for `place`, red for `eliminate`).
- [ ] Overlays use `position: absolute` inside each cell so they don't affect layout.
- [ ] The overlay respects existing crown/mark SVG elements (renders behind them).
- [ ] Storybook story `AnnotationOverlay` (in `stories/annotation-overlay.stories.js`) shows the renderer on a static Queens board with a hand-crafted annotation.

---

## Issue 2.4 — Step-through deduction UI

**Labels:** `ui`, `gameplay`
**Depends on:** 2.2, 2.3

### Background

Players should be able to step through the solver's reasoning one tactic at a time, seeing each annotation rendered on the board, with an explanation text shown below.

### Acceptance Criteria

- [ ] Add a "Step" button to `index.html` (next to "Hint").
- [ ] Each press of "Step" applies the *next* deterministic tactic step, renders its annotation overlay for 1.5 seconds, then clears it.
- [ ] The explanation text from the annotation is shown in a banner below the board for the same 1.5 seconds.
- [ ] If no further deterministic steps remain, "Step" is disabled and shows "No more logical deductions."
- [ ] "Step" does not advance the game beyond what the player has already done — it only shows the *next possible* step, not applies it permanently (use a shadow solve state).
- [ ] The existing "Hint" button behaviour is unchanged.
- [ ] Playwright test: clicking "Step" on a fresh board shows an overlay and explanation text.

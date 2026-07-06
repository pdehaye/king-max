# Epic 1 — Game Interface Abstraction

> **Goal:** Extract a formal, shared protocol that Queens and future games implement, so all game-specific logic (tactics, solver, difficulty) plugs into the same visual and reasoning infrastructure.

---

## Issue 1.1 — Define the `GameInterface` protocol

**Labels:** `architecture`, `no-ui`

### Background

Queens tactics operate on a `state` object passed to each tactic function (see `js/deterministic-tactics.js`). This state carries `n`, `candidatesInRow`, `candidatesInCol`, `candidatesInRegion`, `placeQueen`, etc.

Future games need the same pattern but with different constraint types. We need a shared protocol so the solver loop, difficulty scorer, and reasoning annotation layer work for any game.

### Acceptance Criteria

- [ ] Create `js/game-interface.js` that documents and exports the `GameInterface` type as a JSDoc `@typedef`.
- [ ] `GameInterface` must include:
  - `n` — board size
  - `candidatesAt(constraint)` — returns candidate cells for a given constraint object
  - `constraints()` — returns all active (unsatisfied) constraints
  - `place(cell, tier)` — marks a cell as solved and eliminates consequences
  - `isDone()` — returns true when the puzzle is fully solved
  - `stateSnapshot()` — returns a serialisable copy of current candidate state
- [ ] Refactor Queens `humanSolve` state object in `js/human-solver.js` to satisfy `GameInterface` without changing existing external behaviour.
- [ ] Add a Playwright test that Queens still solves correctly after the refactor (import the existing regression suite from `tests/regression.spec.js`).

### Notes

- No new game logic yet — Queens must still pass all existing tests.
- Keep `placeQueen` as an alias inside Queens for backward compatibility.

---

## Issue 1.2 — Refactor Queens tactics to use `GameInterface`

**Labels:** `refactor`, `no-ui`
**Depends on:** 1.1

### Background

`js/deterministic-tactics.js` exports tactics that accept the Queens-specific state object. They should accept any `GameInterface`-conforming object.

### Acceptance Criteria

- [ ] Each tactic function in `js/deterministic-tactics.js` is updated to call only `GameInterface` methods (no Queens-specific field access).
- [ ] `DETERMINISTIC_TACTIC_DESCRIPTORS` in `deterministic-tactics.js` gains a `constraintTypes` array listing which constraint dimensions each tactic observes (e.g. `['row', 'col', 'region']`).
- [ ] All existing Playwright regression tests still pass.
- [ ] All existing Storybook stories still render.

---

## Issue 1.3 — Abstract the difficulty scorer

**Labels:** `refactor`, `no-ui`
**Depends on:** 1.2

### Background

`js/human-solver.js` and `js/difficulty-weights.js` are Queens-specific. The scoring logic (tier assignment, weight accumulation) should work for any game.

### Acceptance Criteria

- [ ] Create `js/difficulty-scorer.js` that exports `scoreSolveTrace(trace, weights)`.
  - `trace` is an array of `{ tacticId, tier, observedConstraints }` step records (produced during solve).
  - Returns `{ score, maxTier, steps }`.
- [ ] Queens `humanSolve` emits a `trace` array alongside its existing return values.
- [ ] Difficulty display in `index.html` still works — no visible change to the player.
- [ ] Unit test: given a known trace, `scoreSolveTrace` returns the expected score.

# Multi-Game Logic Platform — Plan

> A roadmap for evolving this repo from a single Queens puzzle into a multi-game logic platform with reasoning visualisation and intuitive deductions.

---

## Vision

Each game in this repo teaches players *how to think* about logic puzzles:

- **Board state visuals** — a clean rendering of what is known.
- **Reasoning annotation overlays** — visual marking of *which cells* a deduction touches and *why*.
- **Deterministic deductions** — provably correct steps, shown in green.
- **Intuitive deductions** — high-confidence but non-certain moves, shown in amber.
- **Step-through mode** — players can walk through the solver's reasoning one move at a time.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   index.html (Hub)                  │
└──────────┬───────────────────────┬──────────────────┘
           │                       │
    queens/index.html      nonogram/index.html  (+ future games)
           │                       │
    ┌──────┴───────┐        ┌──────┴───────┐
    │  GameInterface│        │  GameInterface│
    │  (queens)     │        │  (nonogram)   │
    └──────┬───────┘        └──────┬───────┘
           │                       │
    ┌──────┴───────────────────────┴──────┐
    │         Shared Infrastructure        │
    │  js/game-interface.js               │
    │  js/reasoning-annotation.js         │
    │  js/annotation-renderer.js          │
    │  js/difficulty-scorer.js            │
    │  js/game-registry.js                │
    └─────────────────────────────────────┘
```

---

## Epics and Dependencies

```
Epic 1: Game Interface Abstraction
  └─ Issue 1.1 GameInterface protocol
  └─ Issue 1.2 Queens tactics → GameInterface
  └─ Issue 1.3 Abstract difficulty scorer

Epic 2: Reasoning Annotation System          [depends on Epic 1]
  └─ Issue 2.1 ReasoningAnnotation type
  └─ Issue 2.2 Emit annotations from tactics
  └─ Issue 2.3 Annotation overlay renderer
  └─ Issue 2.4 Step-through deduction UI

Epic 3: Second Game — Nonogram               [depends on Epic 2]
  └─ Issue 3.1 Nonogram data model
  └─ Issue 3.2 Nonogram deterministic tactics
  └─ Issue 3.3 Nonogram board renderer
  └─ Issue 3.4 Nonogram puzzle generator
  └─ Issue 3.5 Nonogram game page

Epic 4: Intuitive Deductions                 [depends on Epic 2; 4.3 on 3.4]
  └─ Issue 4.1 IntuitiveAnnotation extension
  └─ Issue 4.2 Constraint-pressure heuristic (Queens)
  └─ Issue 4.3 Empirical frequency lookup (Queens)
  └─ Issue 4.4 Block-density heuristic (Nonogram)
  └─ Issue 4.5 Intuitive hint mode UI

Epic 5: Multi-Game Hub                       [depends on Epics 3 + 4]
  └─ Issue 5.1 Landing page
  └─ Issue 5.2 Shared navigation header
  └─ Issue 5.3 Per-game Storybook section
  └─ Issue 5.4 GitHub Pages workflow update
  └─ Issue 5.5 Game registry module
```

---

## Sequencing for Cloud Agents

Issues within each epic can largely be parallelised across agents. The critical path is:

```
1.1 → 1.2 → 1.3
            ↓
         2.1 → 2.2 → 2.4
               ↓
            2.3 ──────────→ 3.3 → 3.5 → 5.1 → 5.2
                                              ↓
         3.1 → 3.2 → 3.4 ──────→ 4.4        5.4
                                  ↓
                        4.1 → 4.2 → 4.5
                              4.3
```

**Suggested agent assignments:**

| Agent | Issues |
|---|---|
| Queens Logic Auditor | 1.1, 1.2, 1.3 |
| TDD Cycle Driver | 2.1, 2.2, 4.1, 4.2 |
| Queens Frontend Builder | 2.3, 2.4, 4.5 |
| Queens Logic Auditor (second pass) | 3.1, 3.2, 3.4 |
| Queens Frontend Builder (Nonogram) | 3.3, 3.5 |
| Queens Deterministic Story Auditor | 3.2 Storybook, 5.3 |
| Pages Release Manager | 5.4 |
| Queens Frontend Builder (Hub) | 5.1, 5.2, 5.5 |

---

## Issue Files

Each epic is documented in `.github/issues/`:

- [epic-1-game-interface.md](.github/issues/epic-1-game-interface.md)
- [epic-2-reasoning-annotations.md](.github/issues/epic-2-reasoning-annotations.md)
- [epic-3-nonogram.md](.github/issues/epic-3-nonogram.md)
- [epic-4-intuitive-deductions.md](.github/issues/epic-4-intuitive-deductions.md)
- [epic-5-multi-game-hub.md](.github/issues/epic-5-multi-game-hub.md)

---

## Invariants to Preserve

- Site remains fully static / client-side — no build step, no backend.
- Queens game continues to work at its existing URL.
- Existing Playwright regression tests must pass at every milestone.
- Storybook coverage: one story per tactic per game.
- All behaviour changes go through red-green-refactor (TDD Cycle Driver).

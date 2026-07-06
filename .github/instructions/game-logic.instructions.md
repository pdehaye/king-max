---
description: "Use when editing puzzle generation, solver logic, hint logic, conflict checks, scoring, and win conditions in index.html."
applyTo: "index.html"
---
# Game Logic Instructions

## Correctness Requirements
- Preserve core constraints: one crown per row, one per column, one per region, and no touching crowns.
- Keep uniqueness checks for generated boards.
- Keep difficulty scoring tied to solver effort tiers.

## Safety Checks
- Any logic change should preserve valid completion detection and mistake counting behavior.
- Keep generation loops bounded to avoid freezing the browser.
- Keep async difficulty search yielding to the event loop.

## Verification Checklist
- Start a new game and place crowns that violate constraints: conflicts should be visible.
- Solve a board correctly: win banner and solved stats should appear.
- Try target difficulty search with both common and extreme values.

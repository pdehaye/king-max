---
description: "Use when editing puzzle generation, solver logic, hint logic, conflict checks, scoring, and win conditions in index.html."
applyTo: "index.html"
---
# Game Logic Instructions

## Correctness Requirements
- Preserve the game's documented rules and constraints.
- Keep generation and validation checks deterministic where expected.
- Keep difficulty/scoring logic aligned with solver effort tiers when present.

## Safety Checks
- Any logic change should preserve completion detection and error/mistake tracking behavior.
- Keep generation and solving loops bounded to avoid freezing the browser.
- Keep asynchronous search or simulation work yielding to the event loop.

## Verification Checklist
- Start a new session and intentionally perform an invalid action: feedback should be visible.
- Complete a valid run: completion banner/stats should appear.
- Try search or target-matching flows with both common and extreme values.

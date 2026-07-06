---
description: "Use when editing deterministic tactics or Storybook strategy stories for tactic teaching coverage."
applyTo: "js/deterministic-tactics.js|stories/**/*.stories.js"
---
# Deterministic Tactics Story Instructions

## Coverage Rule
- Keep one Storybook story per deterministic tactic in `js/deterministic-tactics.js`.
- Story names should map clearly to tactic names.

## Maintenance Rule
- When adding, removing, or renaming deterministic tactics, update `stories/deterministic-tactics.stories.js` in the same change.
- Keep story snapshots aligned with in-game visuals by using `stories/game-visuals.js`.

## Verification
- Run `npm run build-storybook` after story updates.
- Run `npm test` after tactic behavior updates.

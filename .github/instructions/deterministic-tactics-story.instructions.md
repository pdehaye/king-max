---
description: "Use when editing deterministic tactics or Storybook strategy stories for tactic teaching coverage."
applyTo: "games/king-max/js/deterministic-tactics.js|games/**/stories/**/*.stories.js"
---
# Deterministic Tactics Story Instructions

## Coverage Rule
- Keep one Storybook story per deterministic tactic in `games/king-max/js/deterministic-tactics.js`.
- Story names should map clearly to tactic names.

## Maintenance Rule
- When adding, removing, or renaming deterministic tactics, update `games/king-max/stories/deterministic-tactics.stories.js` in the same change.
- Keep story snapshots aligned with in-game visuals by using `games/king-max/stories/game-visuals.js`.

## Verification
- Run `npm run build-storybook` after story updates.
- Run `npm test` after tactic behavior updates.

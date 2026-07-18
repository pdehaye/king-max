---
description: "Use when editing game tactics or Storybook tactic stories to keep tactic teaching coverage aligned."
applyTo: "games/**/js/tactics.js|games/king-max/js/deterministic-tactics.js|games/**/stories/**/*.stories.js"
---
# Deterministic Tactics Story Instructions

## Coverage Rule
- Keep one Storybook example per tactic for each game tactic module.
- Story names should map clearly to tactic names.

## Maintenance Rule
- When adding, removing, or renaming tactics, update the corresponding `games/**/stories/*.stories.js` file in the same change.
- Keep tactic stories aligned with in-game visuals and terminology.

## Verification
- Run `npm run build-storybook` after story updates.
- Run `npm test` after tactic behavior updates.

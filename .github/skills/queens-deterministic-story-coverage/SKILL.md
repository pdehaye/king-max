---
name: queens-deterministic-story-coverage
description: "Maintain one Storybook story per deterministic solver tactic. Use when tactic logic changes or story coverage drifts."
argument-hint: "Describe deterministic tactic changes and required story updates."
user-invocable: true
---
# Queens Deterministic Story Coverage

Use this skill to keep deterministic solver tactics and Storybook strategy stories aligned.

## Procedure
1. Read `js/deterministic-tactics.js` and list exported deterministic tactics.
2. Verify there is one matching story in `stories/deterministic-tactics.stories.js`.
3. Add or update missing tactic stories with game-like visuals via `stories/game-visuals.js`.
4. Build Storybook and run tests.
5. Report tactic-to-story coverage explicitly.

## Done Criteria
- Every deterministic tactic has exactly one story entry.
- `npm run build-storybook` succeeds.
- `npm test` succeeds.

# King Max Copilot Instructions

This repository is a static GitHub Pages site for a multi games hub, and the underlying framework.

## Project Goals
- Keep the game fully client-side with no backend dependencies.
- Preserve GitHub Pages compatibility with a root-level site build.
- Prioritize deterministic gameplay rules and clear player feedback.

## Working Rules
- Keep changes small and focused, unless explicity requested.
- Preserve puzzle correctness.
- Keep UI responsive while generating boards and searching by difficulty.
- Avoid adding bundlers/frameworks unless explicitly requested.
- For behavior changes, follow red-green-refactor and include explicit verification evidence.

## Quality Expectations
- Validate that game actions still work: New game, Clear, Hint, difficulty search, and win detection.
- Keep accessibility in mind: semantic controls, readable contrast, and keyboard-friendly interactions where practical.
- Prefer plain JavaScript and CSS patterns that are easy to maintain in one-file deployment.
- Add or update a regression scenario whenever fixing a bug.
- Keep deterministic tactic documentation aligned: one Storybook story per tactic in `js/deterministic-tactics.js`.

## GitHub Pages Constraints
- Use relative links and static assets.
- Do not introduce server-side build steps.
- Keep workflow changes aligned with `.github/workflows/pages.yml`.

# Games Copilot Instructions

This repository is a static GitHub Pages site for a multi games hub, and the underlying framework.

## Project Goals
- Keep games fully client-side with no backend dependencies.
- Preserve GitHub Pages compatibility with a root-level site build.
- Prioritize deterministic rules and clear player feedback where applicable.

## Working Rules
- Keep changes small and focused, unless explicity requested.
- Preserve gameplay correctness.
- Keep UI responsive during any generation, simulation, or search workflows.
- Avoid adding bundlers/frameworks unless explicitly requested.
- For behavior changes, follow red-green-refactor and include explicit verification evidence.

## Quality Expectations
- Validate that core game actions still work: start/reset/help actions, progression flow, and completion detection.
- Keep accessibility in mind: semantic controls, readable contrast, and keyboard-friendly interactions where practical.
- Prefer plain JavaScript and CSS patterns that are easy to maintain in one-file deployment.
- Add or update a regression scenario whenever fixing a bug.
- Keep tactic documentation aligned across all games: every new, removed, or renamed tactic must update the matching Storybook example in the same change.
- Enforce one Storybook example per tactic for tactic modules under `games/**/js/`.

## GitHub Pages Constraints
- Use relative links and static assets.
- Do not introduce server-side build steps.
- Keep workflow changes aligned with `.github/workflows/pages.yml`.

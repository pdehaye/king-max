# Regression Tests

This folder contains automated no-build regression checks.

## Scope
- Puzzle logic module invariants from `games/king-max/js/puzzle-logic.js`
- Core UI smoke flow on `index.html`

## Run locally
1. Install dependencies: `npm install`
2. Install browser: `npx playwright install --with-deps chromium`
3. Run tests: `npm test`

## Storybook strategy demos
- Start Storybook: `npm run storybook`
- Build static Storybook: `npm run build-storybook`

Stories and explanations live under `games/*/stories/`.

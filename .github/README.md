# games

This repo is hosted on GitHub Pages at [https://pdehaye.github.io/games/](https://pdehaye.github.io/games/).

## Agentic Setup

This repository includes GitHub Copilot customization primitives for faster and safer delivery:

- Agent handbook: `AGENTS.md`
- Project-wide instructions: `.github/copilot-instructions.md`
- File/task instructions: `.github/instructions/*.instructions.md`
- Custom agents: `.github/agents/*.agent.md`
- Reusable skills: `.github/skills/*/SKILL.md`
- Slash prompts: `.github/prompts/*.prompt.md`

## Regression Testing

- Automated checks live in `tests/` and run with Playwright.
- CI runs tests on pull requests and pushes via `.github/workflows/tests.yml`.
- GitHub Pages deployment is gated by test success in `.github/workflows/pages.yml`.

## Storybook Teaching Snippets

- Storybook is configured for small interaction demos and strategy explanations.
- Stories are in `stories/`.
- Run locally with `npm run storybook`.
- Hosted Storybook homepage is available at `/stories/` on the GitHub Pages site.

### Agents
- Queens Frontend Builder
- Queens Logic Auditor
- Queens Deterministic Story Auditor
- Pages Release Manager
- TDD Cycle Driver
- Queens Test Strategist

### Skills
- queens-feature-delivery
- github-pages-release
- queens-playtest
- queens-tdd-cycle
- queens-regression-guard
- queens-deterministic-story-coverage

### Prompts
- Start TDD Cycle
- Design Regression Matrix

Use these from Copilot Chat to run consistent workflows for feature work, TDD-driven changes, gameplay validation, deterministic tactic story coverage, and release preparation.
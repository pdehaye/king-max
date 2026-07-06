# AGENTS

This repository ships custom GitHub Copilot agents and skills to support development of the King Max Queens clone.

## Available Custom Agents

- Queens Frontend Builder: UI and interaction implementation in index.html
- Queens Logic Auditor: puzzle correctness, generator/solver behavior, and win-condition integrity
- Queens Deterministic Story Auditor: keep deterministic tactics and Storybook tactic coverage aligned
- Pages Release Manager: GitHub Pages deployment workflow updates and release readiness checks
- TDD Cycle Driver: enforce red-green-refactor sequencing for behavior changes
- Queens Test Strategist: produce risk-based regression matrices and test plans

## Available Skills

- queens-feature-delivery: implement a feature with validation and delivery notes
- queens-playtest: run a structured manual gameplay regression pass
- github-pages-release: verify and prepare deployment workflow changes
- queens-tdd-cycle: run a full red-green-refactor loop with explicit evidence
- queens-regression-guard: capture and validate regression scenarios for bug fixes
- queens-deterministic-story-coverage: ensure one Storybook story per deterministic tactic

## Available Prompts

- Start TDD Cycle: launch a TDD session with red-green-refactor reporting
- Design Regression Matrix: generate a focused risk-based test matrix

## Working Convention

- Use the agent that best matches the task domain.
- For behavior changes, run queens-tdd-cycle before or during implementation.
- For broad requests, pair an implementation agent with queens-playtest before merging.
- For bug fixes, add queens-regression-guard evidence before merge.
- When deterministic tactics change, update tactic stories in the same PR using queens-deterministic-story-coverage.
- Keep deployment changes small and aligned with static hosting on GitHub Pages.

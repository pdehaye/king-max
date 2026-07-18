# AGENTS

This repository ships custom GitHub Copilot agents and skills to support development of puzzle and strategy games in this repo.

## Available Custom Agents

- Frontend Builder: UI and interaction implementation in index.html
- Logic Auditor: puzzle correctness, generator/solver behavior, and win-condition integrity
- Deterministic Story Auditor: keep deterministic tactics and Storybook tactic coverage aligned
- Pages Release Manager: GitHub Pages deployment workflow updates and release readiness checks
- TDD Cycle Driver: enforce red-green-refactor sequencing for behavior changes
- Test Strategist: produce risk-based regression matrices and test plans

## Available Skills

- gameplay-feature-delivery: implement a feature with validation and delivery notes
- gameplay-playtest: run a structured manual gameplay regression pass
- github-pages-release: verify and prepare deployment workflow changes
- gameplay-tdd-cycle: run a full red-green-refactor loop with explicit evidence
- gameplay-regression-guard: capture and validate regression scenarios for bug fixes
- deterministic-story-coverage: ensure one Storybook story per deterministic tactic

## Available Prompts

- Start TDD Cycle: launch a TDD session with red-green-refactor reporting
- Design Regression Matrix: generate a focused risk-based test matrix

## Working Convention

- Use the agent that best matches the task domain.
- For behavior changes, run gameplay-tdd-cycle before or during implementation.
- For broad requests, pair an implementation agent with gameplay-playtest before merging.
- For bug fixes, add gameplay-regression-guard evidence before merge.
- When any game tactic changes (add/remove/rename), update the matching Storybook example in the same PR.
- Keep one Storybook example per tactic and use deterministic-story-coverage to audit tactic-story drift.
- Keep deployment changes small and aligned with static hosting on GitHub Pages.

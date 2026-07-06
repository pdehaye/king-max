---
name: Start TDD Cycle
description: "Kick off a red-green-refactor session for a gameplay change in this repo."
argument-hint: "Describe the behavior change or bug fix."
agent: "TDD Cycle Driver"
---
Run a strict red-green-refactor workflow for this request.

Requirements:
- Define acceptance behavior first.
- Produce a failing scenario before implementation.
- Implement the smallest passing fix.
- Refactor only after green.
- End with risk and regression notes.

---
name: gameplay-tdd-cycle
description: "Run a full red-green-refactor loop for gameplay changes. Use for test-first feature delivery and bug fixes in this repo."
argument-hint: "Describe the change request or bug to fix with TDD."
user-invocable: true
---
# Gameplay TDD Cycle

Use this skill to execute a behavior change with clear TDD evidence.

## Procedure
1. Define expected behavior and failure signal before implementation.
2. Capture a failing scenario using a checklist or reproducible steps.
3. Apply the smallest possible code change to make the scenario pass.
4. Refactor only after passing checks.
5. Record final regression coverage and remaining risks.

## Resources
- [Red Green Refactor Checklist](./references/red-green-refactor-checklist.md)
- [TDD Session Template](./assets/tdd-session-template.md)

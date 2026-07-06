---
name: queens-regression-guard
description: "Build and maintain regression checks for gameplay changes. Use when fixing bugs or shipping risky behavior updates in this repo."
argument-hint: "Describe the bug or risky behavior and impacted flows."
user-invocable: true
---
# Queens Regression Guard

Use this skill to make sure bug fixes and behavior changes stay fixed.

## Procedure
1. Describe the regression scenario and impacted user flow.
2. Add a deterministic reproduction checklist.
3. Verify the fix against core gameplay paths.
4. Update release confidence notes.

## Resource
- [Regression Scenario Template](./references/regression-scenario-template.md)

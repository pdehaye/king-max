---
description: "Use when implementing or changing gameplay behavior. Enforces a test-first red-green-refactor workflow for this project."
applyTo: "index.html"
---
# Test-Driven Development Instructions

## Core Rule
- Follow red -> green -> refactor for behavior changes.
- Define expected behavior and edge cases before implementation.

## Test Strategy For This Repo
- Prefer small pure helper functions that can be reasoned about and manually validated.
- For UI behavior in `index.html`, write reproducible manual test steps before editing.
- Extend the playtest checklist when adding or changing mechanics.

## Minimum Evidence In Every TDD Change
- Red: state what should fail before the fix.
- Green: document the smallest change that makes it pass.
- Refactor: record any cleanup done without changing behavior.

## Regression Policy
- Bug fixes must include a regression scenario in checklist form.
- Do not merge behavior changes without explicit verification notes.

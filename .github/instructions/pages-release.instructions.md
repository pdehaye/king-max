---
description: "Use when modifying GitHub Pages deployment, workflow YAML, repository publishing settings, or static-site release steps."
applyTo: ".github/workflows/**"
---
# GitHub Pages Release Instructions

## Workflow Rules
- Keep deployment on pushes to `main` unless explicitly changed by request.
- Keep least-privilege permissions for Pages deployment.
- Ensure artifact upload path matches the static site root.

## Validation
- YAML must remain valid and use pinned major actions.
- Do not add unnecessary CI complexity for this single-page static app.
- If changing deployment behavior, document the reason in PR notes.

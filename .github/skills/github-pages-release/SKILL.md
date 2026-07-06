---
name: github-pages-release
description: "Prepare and verify GitHub Pages release updates for this static site. Use for workflow updates, release checks, and publication readiness."
argument-hint: "Describe the release change or deployment concern."
user-invocable: true
---
# GitHub Pages Release

Use this skill when shipping updates to GitHub Pages.

## Procedure
1. Inspect workflow and confirm trigger on `main`.
2. Verify permissions and action versions are appropriate.
3. Ensure static artifact path is correct for root deployment.
4. Draft a concise PR description for deployment-related changes.
5. List post-merge checks.

## Asset
- [Pages PR Template](./assets/pages-pr-template.md)

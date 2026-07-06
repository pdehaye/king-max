---
description: "Use when editing the puzzle UI, CSS styling, layout, responsiveness, or client-side interactions in index.html."
applyTo: "index.html"
---
# Frontend Instructions

## UI Intent
- Maintain the intentional editorial visual style already present in the page.
- Keep controls discoverable: New game, Clear, Hint, and Target difficulty actions should remain prominent.
- Preserve mobile usability for screens down to 360px wide.

## CSS Rules
- Reuse existing CSS variables in `:root` before introducing new colors.
- Keep animations purposeful and short.
- Avoid heavy visual effects that hurt readability or performance.

## Interaction Rules
- Preserve the 3-state cell cycle: empty -> dot -> crown -> empty.
- Do not remove conflict highlighting, hint pulses, or automatic invalid markers.
- Ensure interactive elements remain button-based or otherwise keyboard-focusable.

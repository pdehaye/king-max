# Epic 5 — Multi-Game Hub

> **Goal:** Build a landing page and shared navigation so players can browse and launch any available game, and so future games can be added with minimal friction.

---

## Issue 5.1 — Landing page

**Labels:** `ui`
**Depends on:** Epic 3 (Nonogram page), Epic 2 (King Max step-through)

### Acceptance Criteria

- [ ] Update root `index.html` to be a **hub/landing page** rather than the King Max game directly.
  - King Max game moves to `king-max/index.html` (keeping `index.html` → `king-max/` redirect for backward compat with GitHub Pages URL).
  - Nonogram is at `nonogram/index.html`.
- [ ] Landing page shows a card grid of available games, each with:
  - Game name and one-line description.
  - A static thumbnail (can be a CSS-drawn SVG placeholder initially).
  - A link to the game page.
- [ ] Page uses the same `styles.css` and font stack as the game pages.
- [ ] Responsive: cards stack on mobile.
- [ ] Playwright test: landing page loads and all game cards link to valid pages.

---

## Issue 5.2 — Shared navigation header

**Labels:** `ui`
**Depends on:** 5.1

### Acceptance Criteria

- [ ] Create a shared HTML fragment pattern (`_includes/nav.html`) or inline a `<nav>` in each game page that links back to the hub and to sibling games.
- [ ] Nav shows: Home | King Max | Nonogram.
- [ ] Active game is highlighted.
- [ ] Nav is keyboard-accessible (tab order, aria-current).
- [ ] No JavaScript required for the nav — pure HTML/CSS.

---

## Issue 5.3 — Per-game Storybook section

**Labels:** `storybook`, `dx`
**Depends on:** 3.2, 4.2

### Acceptance Criteria

- [ ] `stories/nonogram-tactics.stories.js` exists and is discovered by Storybook config.
- [ ] `stories/king-max-intuitive.stories.js` exists covering the intuitive tactics from Epic 4.
- [ ] Storybook sidebar groups: `Strategy / King Max / Deterministic`, `Strategy / King Max / Intuitive`, `Strategy / Nonogram`.
- [ ] `npm run storybook` builds without error.
- [ ] `storybook-static/` is regenerated and committed.

---

## Issue 5.4 — GitHub Pages workflow update

**Labels:** `ci`, `deploy`
**Depends on:** 5.1, 5.3

### Acceptance Criteria

- [ ] `.github/workflows/pages.yml` deploys the full site from root (hub + king-max + nonogram + storybook-static).
- [ ] All relative asset paths resolve correctly at `https://pdehaye.github.io/games/`.
- [ ] King Max  redirect from root still works.
- [ ] Nonogram at `/games/nonogram/` is reachable.
- [ ] Storybook at `/games/stories/` is reachable (existing behaviour preserved).
- [ ] Playwright smoke tests run in CI against the deployed URL.

---

## Issue 5.5 — Game registry module

**Labels:** `architecture`, `no-ui`
**Depends on:** 5.1

### Background

As more games are added, a central registry avoids updating multiple files. The landing page and nav should both derive from the same source of truth.

### Acceptance Criteria

- [ ] Create `js/game-registry.js` exporting:
  ```js
  export const GAMES = [
    { id: 'queens', label: 'Queens', path: '/games/queens/', description: '...' },
    { id: 'nonogram', label: 'Nonogram', path: '/games/nonogram/', description: '...' },
  ];
  ```
- [ ] Landing page (`index.html`) reads `GAMES` to build its card grid dynamically.
- [ ] Adding a third game requires only one edit: add an entry to `GAMES`.
- [ ] Unit test: `GAMES` entries each have `id`, `label`, `path`, `description`.

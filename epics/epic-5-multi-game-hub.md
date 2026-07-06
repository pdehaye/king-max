# Epic 5 — Multi-Game Hub

> **Goal:** Build a landing page and shared navigation so players can browse and launch any available game, and so future games can be added with minimal friction.

> **Current state:** King Max currently lives at the repo root (`index.html`), while Nonogram lives at `nonogram/index.html`. This epic migrates both to peer subdirectories (`king-max/` and `nonogram/`) and replaces the root with a hub landing page. No redirect for King Max is carried forward — both games are treated identically going forward.

---

## Issue 5.0 — Migrate King Max to its subdirectory

**Labels:** `housekeeping`
**Depends on:** —

### Background

King Max currently occupies the repo root (`index.html`, `styles.css`, `js/`). Nonogram already lives under `nonogram/`. Before building the hub, King Max must be moved to `king-max/` so both games sit at the same level.

### Acceptance Criteria

- [x] King Max game source is fully contained in `king-max/index.html` (and `king-max/`-relative asset paths).
- [x] `nonogram/index.html` is unchanged and still works.
- [x] Root `index.html` is freed up (can be a temporary placeholder during this issue, replaced by the hub in 5.1).
- [x] All existing King Max Playwright tests pass against `king-max/index.html`.
- [x] No redirect from root is added — the old root URL is simply superseded by the hub.

---

## Issue 5.1 — Landing page

**Labels:** `ui`
**Depends on:** 5.0

### Acceptance Criteria

- [x] Root `index.html` is the **hub/landing page**.
- [x] King Max is at `king-max/index.html`; Nonogram is at `nonogram/index.html`. Both are peers — neither is treated as the "default" game.
- [x] Landing page shows a card grid of available games, each with:
  - Game name and one-line description.
  - A static thumbnail (can be a CSS-drawn SVG placeholder initially).
  - A link to the game page.
- [x] Page uses the same `styles.css` and font stack as the game pages.
- [x] Responsive: cards stack on mobile.
- [x] Playwright test: landing page loads and both game cards link to valid pages.

---

## Issue 5.2 — Shared navigation header

**Labels:** `ui`
**Depends on:** 5.1

### Acceptance Criteria

- [x] Create a shared HTML fragment pattern (`_includes/nav.html`) or inline a `<nav>` in each game page that links back to the hub and to sibling games.
- [x] Nav shows: Home | King Max | Nonogram. Both game links are peers — neither is privileged.
- [x] Active game is highlighted.
- [x] Nav is keyboard-accessible (tab order, aria-current).
- [x] No JavaScript required for the nav — pure HTML/CSS.

---

## Issue 5.3 — Per-game Storybook section

**Labels:** `storybook`, `dx`
**Depends on:** 3.2, 4.2

### Acceptance Criteria

- [x] `stories/nonogram-tactics.stories.js` exists and is discovered by Storybook config.
- [x] `stories/king-max-intuitive.stories.js` exists covering the intuitive tactics from Epic 4.
- [x] Storybook sidebar groups: `Strategy / King Max / Deterministic`, `Strategy / King Max / Intuitive`, `Strategy / Nonogram`. Both games have equivalent sidebar depth.
- [ ] `npm run storybook` builds without error.
- [ ] `storybook-static/` is regenerated and committed.

---

## Issue 5.4 — GitHub Pages workflow update

**Labels:** `ci`, `deploy`
**Depends on:** 5.1, 5.3

### Acceptance Criteria

- [x] `.github/workflows/pages.yml` deploys the full site from root (hub + king-max + nonogram + storybook-static).
- [x] All relative asset paths resolve correctly at `https://pdehaye.github.io/games/`.
- [x] King Max at `/games/king-max/` is reachable.
- [x] Nonogram at `/games/nonogram/` is reachable.
- [x] Both game URLs are treated symmetrically in the workflow — no special-casing for either.
- [x] Storybook at `/games/stories/` is reachable (existing behaviour preserved).
- [x] Playwright smoke tests run in CI against the deployed URL and cover both game pages.

---

## Issue 5.5 — Game registry module

**Labels:** `architecture`, `no-ui`
**Depends on:** 5.1

### Background

As more games are added, a central registry avoids updating multiple files. The landing page and nav should both derive from the same source of truth. King Max and Nonogram are the two founding entries and must be treated identically in the registry.

### Acceptance Criteria

- [x] Create `js/game-registry.js` exporting:
  ```js
  export const GAMES = [
    { id: 'king-max', label: 'King Max', path: './king-max/', description: '...', icon: '♚' },
    { id: 'nonogram', label: 'Nonogram', path: './nonogram/', description: '...', icon: '▦' },
  ];
  ```
- [x] Landing page (`index.html`) reads `GAMES` to build its card grid dynamically.
- [x] Adding a third game requires only one edit: add an entry to `GAMES`.
- [x] Unit test: `GAMES` entries each have `id`, `label`, `path`, `description`.
- [x] Unit test: both `king-max` and `nonogram` entries are present with no structural difference between them.

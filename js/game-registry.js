/**
 * Central game registry.
 * Add a new game here and it appears in the hub landing page and nav automatically.
 * Every entry must have the same shape — no game is privileged.
 *
 * `path` is relative to the hub root (i.e. the repo root).
 * On GitHub Pages the hub lives at /games/, so ./king-max/ → /games/king-max/.
 * Locally (python http.server at /) it resolves to /king-max/.
 */
export const GAMES = [
  {
    id: 'king-max',
    label: 'King Max',
    path: './king-max/',
    description: 'Place one king per row, column, and realm. No two kings may touch.',
    icon: '\u265A'
  },
  {
    id: 'nonogram',
    label: 'Nonogram',
    path: './nonogram/',
    description: 'Fill the grid using row and column clues — one run per number.',
    icon: '\u25A6'
  },
];

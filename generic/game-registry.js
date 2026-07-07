import { KING_MAX_ADAPTER } from '../games/king-max/specific/adapter.js';
import { NONOGRAM_ADAPTER } from '../games/nonogram/specific/adapter.js';

/**
 * Generic catalog consumed by the hub and (later) by the generic shell.
 */
export const GAME_ADAPTERS = [
  KING_MAX_ADAPTER,
  NONOGRAM_ADAPTER
];

/**
 * Backward-compatible shape expected by the current hub and tests.
 */
export const GAMES = GAME_ADAPTERS.map(({ id, label, path, description, icon }) => ({
  id,
  label,
  path,
  description,
  icon
}));
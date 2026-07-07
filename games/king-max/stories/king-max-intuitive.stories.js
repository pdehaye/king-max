/**
 * Storybook stories for King Max intuitive tactics.
 *
 * Intuitive tactics capture visual pattern-matching heuristics that a
 * practised player applies without full logical proof — e.g. corner
 * pressure, narrow-region shape forcing, and candidate-density signals.
 * The solver infrastructure for these tactics lives in
 * generic/annotations/reasoning-annotation.js (kind: 'intuitive').
 *
 * Each story shows a board snapshot where the intuitive pattern is
 * visible and names the heuristic being demonstrated.
 */

import { around, renderGameVisualStory } from './game-visuals.js';

const meta = {
  title: 'Strategy/King Max/Intuitive',
  tags: ['autodocs']
};
export default meta;

// ── Corner pressure ────────────────────────────────────────────────────────────
// A small corner region has only one cell not already neighbour-blocked.
// Pattern: count visible candidates in the region — if only one remains, it
// must hold the crown regardless of deeper row/col logic.

export const CornerPressure = {
  name: 'Corner pressure',
  render: () => {
    const cells = {};
    // Block the top-left 2×2 corner except [0,0]
    around(1, 1).forEach((k) => { cells[k] = 'blocked'; });
    cells['1,1'] = 'crown';
    cells['0,0'] = 'dot'; // only candidate in the region — visually obvious
    return renderGameVisualStory({
      caption: 'Corner pressure',
      note:
        'When a region is squeezed into a corner and all neighbours of ' +
        'its cells are blocked except one, the crown placement is visually ' +
        'obvious before any row/column logic fires.',
      cells
    });
  }
};

// ── Narrow-region shape forcing ────────────────────────────────────────────────
// A single-column region leaves the king with no horizontal freedom.
// Players recognise this shape and skip straight to column elimination.

export const NarrowRegionShape = {
  name: 'Narrow region shape forcing',
  render: () => {
    const cells = {};
    // Simulate a tall, single-column region in column 5
    for (let r = 2; r <= 5; r++) cells[`${r},5`] = 'dot';
    // Crown already placed elsewhere in col 5's row neighbourhood
    cells['0,5'] = 'blocked';
    cells['1,5'] = 'blocked';
    cells['6,5'] = 'blocked';
    cells['7,5'] = 'blocked';
    return renderGameVisualStory({
      caption: 'Narrow region shape forcing',
      note:
        'A region confined to a single column signals that the crown must ' +
        'sit in that column. Experienced players spot the shape before ' +
        'enumerating candidates.',
      cells
    });
  }
};

// ── Candidate-density signal ───────────────────────────────────────────────────
// When one region has many more blocked cells than others, it will resolve
// soon. Players naturally focus attention there first.

export const CandidateDensitySignal = {
  name: 'Candidate-density signal',
  render: () => {
    const cells = {};
    // Sparse region top-right: most cells open
    for (let r = 0; r < 4; r++) for (let c = 4; c < 8; c++) cells[`${r},${c}`] = 'empty';
    // Dense region bottom-left: most cells eliminated
    for (let r = 4; r < 8; r++) for (let c = 0; c < 4; c++) cells[`${r},${c}`] = 'blocked';
    cells['5,1'] = 'dot'; // last surviving candidate
    return renderGameVisualStory({
      caption: 'Candidate-density signal',
      note:
        'Regions with most cells already blocked have few candidates left. ' +
        'Scanning for dense (mostly-blocked) regions is an intuitive ' +
        'attention-allocation heuristic — go where the board is most constrained.',
      cells
    });
  }
};

// ── Symmetry break ─────────────────────────────────────────────────────────────
// When two candidate cells are symmetric, any additional asymmetric clue
// instantly resolves which one the crown occupies.

export const SymmetryBreak = {
  name: 'Symmetry break',
  render: () => {
    const cells = {
      '3,2': 'dot',
      '3,5': 'dot', // symmetric pair
      '2,4': 'crown' // asymmetric crown nearby that blocks 3,5 diagonally
    };
    around(2, 4).forEach((k) => { cells[k] = cells[k] || 'blocked'; });
    return renderGameVisualStory({
      caption: 'Symmetry break',
      note:
        'Two candidate cells that look equivalent (symmetric) resolve the ' +
        'moment any nearby crown eliminates one via adjacency. Intuitive ' +
        'players scan for these near-symmetric pairs and watch for the ' +
        'disambiguating crown.',
      cells
    });
  }
};

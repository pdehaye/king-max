/** @type {import('../../generic/game-adapter.js').GameAdapter} */
export const KING_MAX_ADAPTER = {
  id: 'king-max',
  label: 'King Max',
  path: './king-max/',
  description: 'Place one king per row, column, and region. Kings cannot touch.',
  icon: '\u265A',
  setupModel: {
    mode: 'size-preset',
    defaultOptionId: 'classic-8',
    options: [
      {
        id: 'classic-8',
        label: '8 x 8 (Classic)',
        params: { size: 8 }
      }
    ]
  }
};
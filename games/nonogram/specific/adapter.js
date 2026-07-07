/** @type {import('../../generic/game-adapter.js').GameAdapter} */
export const NONOGRAM_ADAPTER = {
  id: 'nonogram',
  label: 'Nonogram',
  path: './nonogram/',
  description: 'Fill the grid from row and column clues.',
  icon: '\u25A6',
  setupModel: {
    mode: 'size-preset',
    defaultOptionId: 'medium-10',
    options: [
      {
        id: 'small-5',
        label: '5 x 5',
        params: { size: 5, difficulty: 'easy' }
      },
      {
        id: 'medium-10',
        label: '10 x 10',
        params: { size: 10, difficulty: 'medium' }
      },
      {
        id: 'large-15',
        label: '15 x 15',
        params: { size: 15, difficulty: 'hard' }
      }
    ]
  }
};
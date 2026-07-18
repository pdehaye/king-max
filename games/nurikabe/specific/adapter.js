/** @type {import('../../generic/game-adapter.js').GameAdapter} */
export const NURIKABE_ADAPTER = {
  id: 'nurikabe',
  label: 'Nurikabe',
  path: './nurikabe/',
  description: 'Build islands by clue size and keep one connected sea.',
  icon: '\u25A9',
  setupModel: {
    mode: 'size-preset',
    defaultOptionId: 'classic-6',
    options: [
      {
        id: 'classic-6',
        label: '6 x 6 (Classic)',
        params: { size: 6, difficulty: 'medium' }
      }
    ]
  }
};

module.exports = {
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  stories: [
    '../games/king-max/stories/deterministic-tactics.stories.js',
    '../games/nonogram/stories/nonogram-tactics.stories.js',
    '../games/nurikabe/stories/nurikabe-basics.stories.js',
    '../games/nurikabe/stories/nurikabe-tactics.stories.js'
  ],
  addons: ['@storybook/addon-essentials']
};

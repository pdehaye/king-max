module.exports = {
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  stories: [
    '../games/king-max/stories/deterministic-tactics.stories.js',
    '../games/nonogram/stories/nonogram-tactics.stories.js'
  ],
  addons: ['@storybook/addon-essentials']
};

module.exports = {
  framework: {
    name: '@storybook/html-vite',
    options: {}
  },
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|mdx)'],
  addons: ['@storybook/addon-essentials']
};

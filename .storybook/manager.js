import { addons } from '@storybook/manager-api';

addons.setConfig({
  showNav: false,
  showPanel: false,
  enableShortcuts: false,
  isFullscreen: true,
  panelPosition: 'bottom',
  sidebar: {
    showRoots: false
  },
  toolbar: {
    zoom: { hidden: true },
    eject: { hidden: true },
    copy: { hidden: true },
    fullscreen: { hidden: true }
  }
});

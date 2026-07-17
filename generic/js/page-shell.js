import { GAMES } from '../game-registry.js';

function absoluteGameRoute(path) {
  if (typeof path !== 'string' || path.length === 0) return '/games/';
  if (path.startsWith('/')) return path;
  if (path.startsWith('./')) return `/games/${path.slice(2)}`;
  return `/games/${path}`;
}

export function renderSiteNav(navEl, currentGameId) {
  if (!navEl) return;

  navEl.innerHTML = '';

  const homeLink = document.createElement('a');
  homeLink.href = '/games/';
  homeLink.className = 'nav-home';
  homeLink.textContent = 'Games';
  navEl.appendChild(homeLink);

  const gamePicker = document.createElement('select');
  gamePicker.className = 'nav-game-picker';
  gamePicker.setAttribute('aria-label', 'Switch game');

  GAMES.forEach((game) => {
    const option = document.createElement('option');
    option.value = absoluteGameRoute(game.path);
    option.textContent = game.label;
    option.selected = game.id === currentGameId;
    gamePicker.appendChild(option);
  });

  gamePicker.addEventListener('change', () => {
    if (gamePicker.value) {
      window.location.href = gamePicker.value;
    }
  });

  navEl.appendChild(gamePicker);
}

export function getStorybookBaseUrl(location = window.location) {
  if (location.protocol === 'file:') return 'http://localhost:8080/stories/';
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isGithubPagesHost = location.hostname.endsWith('.github.io');
  const isCanonicalGameHtmlPath = location.pathname.includes('/games/') && location.pathname.includes('/html/');
  if (location.port === '6006') return './';
  if (location.pathname.includes('/stories/')) return './';
  if (isCanonicalGameHtmlPath) {
    if (isGithubPagesHost) return '../../../storybook-static/';
    if (isLocalhost) return '../../../stories/';
    return '../../../stories/';
  }
  if (isGithubPagesHost) return '../stories/';
  if (isLocalhost) return '../stories/';
  return '../stories/';
}

export function storybookUrlForPath(path, location = window.location) {
  return `${getStorybookBaseUrl(location)}?path=${path}`;
}

export function wireStorybookLink(linkId, storyPath) {
  const link = document.getElementById(linkId);
  if (!link) return;
  link.href = storybookUrlForPath(storyPath);
}
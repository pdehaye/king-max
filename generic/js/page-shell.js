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

  GAMES.forEach((game) => {
    const link = document.createElement('a');
    link.href = absoluteGameRoute(game.path);
    link.textContent = game.label;
    if (game.id === currentGameId) {
      link.setAttribute('aria-current', 'page');
    }
    navEl.appendChild(link);
  });
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
  if (isGithubPagesHost) return '../storybook-static/';
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
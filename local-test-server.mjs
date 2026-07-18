#!/usr/bin/env node

/**
 * Local test server that serves _site from a /games/ subpath,
 * exactly mimicking GitHub Pages deployment for the pdehaye/games repository.
 * 
 * Usage: node local-test-server.mjs
 * Then visit: http://localhost:3000/games/
 */

import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

async function serveFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  // Remove /games prefix and handle root redirects
  if (pathname === '/games' || pathname === '/games/') {
    pathname = '/index.html';
  } else if (pathname.startsWith('/games/')) {
    pathname = pathname.slice('/games'.length); // Remove /games prefix
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found. Try http://localhost:3000/games/');
    return;
  }

  // Default to index.html for directory requests
  if (pathname.endsWith('/')) {
    pathname += 'index.html';
  }

  const filePath = path.join(__dirname, '_site', pathname);
  const content = await serveFile(filePath);

  if (content === null) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`404: ${pathname} not found`);
    return;
  }

  // Set appropriate content type
  let contentType = 'text/plain';
  if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8';
  else if (filePath.endsWith('.js')) contentType = 'application/javascript; charset=utf-8';
  else if (filePath.endsWith('.css')) contentType = 'text/css';
  else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
  else if (filePath.endsWith('.png')) contentType = 'image/png';
  else if (filePath.endsWith('.json')) contentType = 'application/json';
  else if (filePath.endsWith('.woff2')) contentType = 'font/woff2';

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n✓ Local GitHub Pages test server running`);
  console.log(`  Base URL: http://localhost:${PORT}/games/`);
  console.log(`  King Max: http://localhost:${PORT}/games/king-max/`);
  console.log(`  Nonogram: http://localhost:${PORT}/games/nonogram/`);
  console.log(`  Nurikabe: http://localhost:${PORT}/games/nurikabe/`);
  console.log(`  Stories:  http://localhost:${PORT}/games/stories/\n`);
});

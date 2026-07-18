import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const GAME_IDS = ['king-max', 'nonogram', 'nurikabe'];

function renderRouteHtml(source, gameId) {
  return source
    .replace(/href="\.\.\/\.\.\/\.\.\/styles\.css"/g, 'href="../styles.css"')
    .replace(/href="\.\.\/\.\.\/\.\.\/stories\//g, 'href="../stories/')
    .replace(/from '\.\.\/\.\.\/\.\.\/generic\//g, "from '../generic/")
    .replace(/from '\.\.\/js\//g, `from '../games/${gameId}/js/`);
}

for (const gameId of GAME_IDS) {
  const sourcePath = path.join(rootDir, 'games', gameId, 'html', 'index.html');
  const outputPath = path.join(rootDir, '_site', gameId, 'index.html');
  const source = await fs.readFile(sourcePath, 'utf8');
  const rendered = renderRouteHtml(source, gameId);
  await fs.writeFile(outputPath, rendered, 'utf8');
}
export const REGION_COLORS = [
  '#C97C6D',
  '#7C9885',
  '#6E85B7',
  '#D4A94C',
  '#9B6B9E',
  '#4F8C82',
  '#B85C7D',
  '#A8763E'
];

const THICK_BORDER = '3px solid #2B2420';
const THIN_BORDER = '1px solid rgba(43,36,32,0.25)';

export function regionColor(regionId) {
  return REGION_COLORS[regionId % REGION_COLORS.length];
}

export function crownSVGMarkup() {
  return `<svg class="crown" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 18L2 8L7 11.5L12 5L17 11.5L22 8L21 18H3Z" fill="var(--ink)"/>
    <rect x="3" y="18" width="18" height="2.6" rx="0.6" fill="var(--ink)"/>
  </svg>`;
}

export function applyRegionBorders(cell, row, col, boardSize, readRegionId) {
  const region = readRegionId(row, col);

  const sameRight = col < boardSize - 1 && readRegionId(row, col + 1) === region;
  const sameBottom = row < boardSize - 1 && readRegionId(row + 1, col) === region;
  const sameLeft = col > 0 && readRegionId(row, col - 1) === region;
  const sameTop = row > 0 && readRegionId(row - 1, col) === region;

  cell.style.borderRight = sameRight ? THIN_BORDER : THICK_BORDER;
  cell.style.borderBottom = sameBottom ? THIN_BORDER : THICK_BORDER;
  cell.style.borderLeft = sameLeft ? THIN_BORDER : THICK_BORDER;
  cell.style.borderTop = sameTop ? THIN_BORDER : THICK_BORDER;
}

/**
 * Annotation Renderer
 * Displays reasoning annotations as visual overlays on the puzzle board.
 * - Observed cells: soft yellow highlight (40% opacity)
 * - Concluded cells: strong green (place) or red (eliminate) highlight
 * Overlays are positioned absolutely within cells, behind SVG elements.
 */

const ANNOTATION_OVERLAY_CLASS = 'annotation-overlay';
const OBSERVED_COLOR = '#FFD700'; // Gold yellow
const OBSERVED_OPACITY = 0.4;
const CONCLUDED_PLACE_COLOR = '#00CC00'; // Bright green
const CONCLUDED_ELIMINATE_COLOR = '#FF5555'; // Bright red
const CONCLUDED_OPACITY = 0.5;
const Z_INDEX_BEHIND_SVG = '5';

/**
 * Render an annotation as visual overlays on the board.
 * @param {HTMLElement} boardEl - The board container element
 * @param {Object} annotation - ReasoningAnnotation from makeAnnotation()
 * @param {Object} options - Optional rendering options
 * @param {number} options.durationMs - How long to display (for auto-clear)
 * @returns {Function} A function to clear the overlay
 */
export function renderAnnotationOverlay(boardEl, annotation, options = {}) {
  if (!annotation) return () => {};

  const { durationMs = 0 } = options;

  // Create container for this annotation's overlays
  const containerDiv = document.createElement('div');
  containerDiv.className = 'annotation-overlay-container';
  containerDiv.setAttribute('data-tactic-id', annotation.tacticId);

  // Render observed cells with soft highlight
  if (annotation.observed && Array.isArray(annotation.observed)) {
    for (const cell of annotation.observed) {
      renderCellOverlay(boardEl, containerDiv, cell, {
        color: OBSERVED_COLOR,
        opacity: OBSERVED_OPACITY,
        type: 'observed'
      });
    }
  }

  // Render concluded cells with strong highlight (color depends on action type)
  if (annotation.concluded && Array.isArray(annotation.concluded)) {
    const color = annotation.conclusionType === 'place'
      ? CONCLUDED_PLACE_COLOR
      : CONCLUDED_ELIMINATE_COLOR;

    for (const cell of annotation.concluded) {
      renderCellOverlay(boardEl, containerDiv, cell, {
        color,
        opacity: CONCLUDED_OPACITY,
        type: annotation.conclusionType
      });
    }
  }

  // Attach container to board
  boardEl.appendChild(containerDiv);

  // Auto-clear if duration specified
  let timeoutId = null;
  const clearFn = () => {
    if (timeoutId) clearTimeout(timeoutId);
    containerDiv.remove();
  };

  if (durationMs > 0) {
    timeoutId = setTimeout(clearFn, durationMs);
  }

  return clearFn;
}

/**
 * Clear all annotation overlays from a board.
 * @param {HTMLElement} boardEl - The board container element
 */
export function clearAnnotationOverlay(boardEl) {
  const containers = boardEl.querySelectorAll('.annotation-overlay-container');
  containers.forEach((c) => c.remove());
}

/**
 * Render a single cell overlay.
 * Internal helper function.
 * @param {HTMLElement} boardEl - Board container
 * @param {HTMLElement} containerDiv - Overlay container to append to
 * @param {Object} cell - Cell with { r: row, c: col }
 * @param {Object} style - Style object with { color, opacity, type }
 */
function renderCellOverlay(boardEl, containerDiv, cell, style) {
  if (!cell || typeof cell.r !== 'number' || typeof cell.c !== 'number') {
    return; // Invalid cell
  }

  // Calculate board grid position
  // Assumes board is laid out as 8x8 grid with 1fr columns
  const cellIndex = cell.r * 8 + cell.c;

  // Find the corresponding grid cell in the board
  // The board SVG is typically the only child; look for grid cells after it
  const gridCells = boardEl.querySelectorAll('[data-cell-r][data-cell-c]');
  let targetCell = null;

  for (const gridCell of gridCells) {
    const r = parseInt(gridCell.getAttribute('data-cell-r'), 10);
    const c = parseInt(gridCell.getAttribute('data-cell-c'), 10);
    if (r === cell.r && c === cell.c) {
      targetCell = gridCell;
      break;
    }
  }

  if (!targetCell) {
    // Fallback: if no grid cell found, create overlay positioned absolutely
    // relative to board based on cell index
    const overlay = document.createElement('div');
    overlay.className = ANNOTATION_OVERLAY_CLASS;
    overlay.setAttribute('data-type', style.type);
    overlay.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: ${style.color};
      opacity: ${style.opacity};
      z-index: ${Z_INDEX_BEHIND_SVG};
      pointer-events: none;
      border: 1px solid rgba(0,0,0,0.1);
    `;
    containerDiv.appendChild(overlay);
    return;
  }

  // Render overlay inside the target cell
  const overlay = document.createElement('div');
  overlay.className = ANNOTATION_OVERLAY_CLASS;
  overlay.setAttribute('data-type', style.type);

  // Position absolutely inside the cell
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${style.color};
    opacity: ${style.opacity};
    z-index: ${Z_INDEX_BEHIND_SVG};
    pointer-events: none;
    border: 1px solid rgba(0,0,0,0.1);
  `;

  // Ensure target cell is position: relative so overlay positions correctly
  if (getComputedStyle(targetCell).position === 'static') {
    targetCell.style.position = 'relative';
  }

  targetCell.appendChild(overlay);
}

/**
 * Utility: Check if annotation overlay is currently displayed for a tactic.
 * @param {HTMLElement} boardEl
 * @param {string} tacticId
 * @returns {boolean}
 */
export function isAnnotationDisplayed(boardEl, tacticId) {
  return !!boardEl.querySelector(
    `.annotation-overlay-container[data-tactic-id="${tacticId}"]`
  );
}

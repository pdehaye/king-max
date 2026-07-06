/**
 * @typedef {Object} ReasoningAnnotation
 * @property {string} tacticId - e.g. 'hidden-singles'
 * @property {string} tacticLabel - human-readable label
 * @property {Array<{r:number, c:number}>} observed - cells inspected to reach conclusion
 * @property {Array<{r:number, c:number}>} concluded - cells that were placed or eliminated
 * @property {'place'|'eliminate'} conclusionType - what kind of conclusion
 * @property {string} explanationText - one-sentence plain-English reason
 * @property {'deterministic'|'intuitive'} [kind] - discriminator, defaults to 'deterministic'
 * @property {number} [confidence] - 0.0–1.0 for intuitive tactics
 * @property {string} [basisText] - e.g. "In 87% of similar boards, the crown goes here."
 */

/**
 * Create and validate a ReasoningAnnotation object.
 * @param {Partial<ReasoningAnnotation>} fields
 * @returns {ReasoningAnnotation}
 * @throws {Error} if required fields are missing or invalid
 */
export function makeAnnotation(fields) {
  const required = ['tacticId', 'tacticLabel', 'observed', 'concluded', 'conclusionType', 'explanationText'];
  for (const field of required) {
    if (!(field in fields)) {
      throw new Error(`makeAnnotation: missing required field '${field}'`);
    }
  }

  const { tacticId, tacticLabel, observed, concluded, conclusionType, explanationText, kind = 'deterministic', confidence, basisText } = fields;

  if (typeof tacticId !== 'string') throw new Error('tacticId must be a string');
  if (typeof tacticLabel !== 'string') throw new Error('tacticLabel must be a string');
  if (!Array.isArray(observed)) throw new Error('observed must be an array');
  if (!Array.isArray(concluded)) throw new Error('concluded must be an array');
  if (!['place', 'eliminate'].includes(conclusionType)) throw new Error("conclusionType must be 'place' or 'eliminate'");
  if (typeof explanationText !== 'string') throw new Error('explanationText must be a string');
  if (!['deterministic', 'intuitive'].includes(kind)) throw new Error("kind must be 'deterministic' or 'intuitive'");
  if (confidence !== undefined && (typeof confidence !== 'number' || confidence < 0 || confidence > 1)) throw new Error('confidence must be a number between 0 and 1');

  const annotation = {
    tacticId,
    tacticLabel,
    observed: Object.freeze(observed.map(cell => Object.freeze({ r: cell.r, c: cell.c }))),
    concluded: Object.freeze(concluded.map(cell => Object.freeze({ r: cell.r, c: cell.c }))),
    conclusionType,
    explanationText,
    kind
  };

  if (confidence !== undefined) annotation.confidence = confidence;
  if (basisText !== undefined) annotation.basisText = basisText;

  return Object.freeze(annotation);
}

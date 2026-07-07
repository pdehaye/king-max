/**
 * Shared adapter contract for games hosted by the generic shell.
 *
 * This file is intentionally JSDoc-only today; it establishes the runtime
 * contract before we migrate each game off page-level scripts.
 */

/**
 * @typedef {Object} GameSetupOption
 * @property {string} id
 * @property {string} label
 * @property {Object} [params]
 */

/**
 * @typedef {Object} GameSetupModel
 * @property {'size-preset'|'difficulty'} mode
 * @property {GameSetupOption[]} options
 * @property {string} defaultOptionId
 */

/**
 * @typedef {Object} GameAdapter
 * @property {string} id
 * @property {string} label
 * @property {string} path
 * @property {string} description
 * @property {string} icon
 * @property {GameSetupModel} setupModel
 */

export {};
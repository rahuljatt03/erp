/**
 * Inventory domain model — on-hand stock the planning engine nets demand against.
 *
 * A finished-good stock record (what we can ship without building).
 * @typedef {object} FinishedGood
 * @property {string} id
 * @property {string} sku
 * @property {string} name
 * @property {string} unit
 * @property {number} onHand
 *
 * A raw-material stock record (what we can consume without purchasing).
 * @typedef {object} RawMaterialStock
 * @property {string} id
 * @property {string} code
 * @property {string} name
 * @property {string} unit
 * @property {number} onHand
 */

export {};

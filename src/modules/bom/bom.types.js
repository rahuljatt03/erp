/**
 * Bill of Materials domain model — the per-unit recipe for a finished product.
 *
 * @typedef {'active'|'draft'|'archived'} BomStatus
 *
 * One raw-material component needed per unit of the product.
 * @typedef {object} BomComponent
 * @property {string} id
 * @property {string} materialName
 * @property {string} [materialCode]
 * @property {string|null} [rawMaterialId]  link to an inventory raw-material record
 * @property {number} quantityPerUnit       quantity needed to build ONE unit of the product
 * @property {string} unit
 *
 * A bill of materials: the recipe to build one unit of a product.
 * @typedef {object} Bom
 * @property {string} id
 * @property {string} productName
 * @property {string} [productCode]          the key used to match inquiry lines / finished goods
 * @property {string|null} [finishedGoodId]
 * @property {string} outputUnit             unit of the product the recipe yields (per 1)
 * @property {BomStatus} status
 * @property {string} [notes]
 * @property {BomComponent[]} components
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};

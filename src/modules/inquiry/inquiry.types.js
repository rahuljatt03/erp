/**
 * Inquiry domain model — documented with JSDoc typedefs so editors give you
 * autocomplete and inline docs without TypeScript. This is the shape every
 * inquiry record follows in storage and across the UI.
 *
 * @typedef {'draft'|'submitted'|'under_review'|'quoted'|'converted'|'closed'} InquiryStatus
 *
 * A raw material required to make a product line.
 * @typedef {object} RawMaterialRequirement
 * @property {string} id
 * @property {string} materialName
 * @property {number} quantity
 * @property {string} unit
 * @property {string} [notes]
 *
 * One product the customer is inquiring about, with its required raw materials.
 * @typedef {object} InquiryItem
 * @property {string} id
 * @property {string} productName
 * @property {string} [productCode]
 * @property {number} quantity
 * @property {string} unit
 * @property {string} targetDeliveryDate  yyyy-mm-dd
 * @property {RawMaterialRequirement[]} rawMaterials
 * @property {string} [remarks]
 *
 * A customer inquiry header containing one or more product lines.
 * @typedef {object} Inquiry
 * @property {string} id
 * @property {string} inquiryNo            e.g. INQ-2026-0001
 * @property {string} customerName
 * @property {string} [customerContact]
 * @property {string} inquiryDate          yyyy-mm-dd
 * @property {InquiryStatus} status
 * @property {InquiryItem[]} items
 * @property {string} [notes]
 * @property {string} createdBy
 * @property {string} createdAt            ISO datetime
 * @property {string} updatedAt            ISO datetime
 */

export {};

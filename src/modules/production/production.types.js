/**
 * Production domain model.
 *
 * @typedef {'planned'|'in_progress'|'completed'|'cancelled'} WOStatus
 *
 * A raw material consumed by a work order to build its product.
 * @typedef {object} WorkOrderMaterial
 * @property {string} id
 * @property {string} materialName
 * @property {string} [materialCode]
 * @property {string|null} [rawMaterialId]  link to an inventory raw-material record
 * @property {number} quantity              required to build the full work-order quantity
 * @property {string} unit
 * @property {number} consumedQty           cumulative quantity consumed so far
 *
 * A production / work order: build N of a finished product.
 * @typedef {object} ProductionOrder
 * @property {string} id
 * @property {string} woNo                  e.g. WO-2026-0001
 * @property {string} productName
 * @property {string} [productCode]
 * @property {string|null} [finishedGoodId] link to an inventory finished-good record
 * @property {number} quantity              quantity to build
 * @property {string} unit
 * @property {number} producedQty           cumulative quantity produced so far
 * @property {WOStatus} status
 * @property {string} [dueDate]             yyyy-mm-dd
 * @property {string|null} [sourceInquiryId]
 * @property {string} [sourceInquiryNo]
 * @property {string} [notes]
 * @property {WorkOrderMaterial[]} materials
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};

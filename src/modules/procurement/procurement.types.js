/**
 * Procurement domain model.
 *
 * @typedef {'draft'|'ordered'|'partially_received'|'received'|'cancelled'} POStatus
 *
 * A purchase-order line for one raw material.
 * @typedef {object} PurchaseOrderItem
 * @property {string} id
 * @property {string} materialName
 * @property {string} [materialCode]
 * @property {string|null} [rawMaterialId]  link to an inventory raw-material record, when known
 * @property {number} quantity              ordered quantity
 * @property {string} unit
 * @property {number} unitPrice
 * @property {number} receivedQty           cumulative quantity received so far
 *
 * A purchase order sent to a supplier.
 * @typedef {object} PurchaseOrder
 * @property {string} id
 * @property {string} poNo                  e.g. PO-2026-0001
 * @property {string} supplierName
 * @property {string} [supplierContact]
 * @property {POStatus} status
 * @property {string} orderDate             yyyy-mm-dd
 * @property {string} [expectedDate]        yyyy-mm-dd
 * @property {string|null} [sourceInquiryId]
 * @property {string} [sourceInquiryNo]
 * @property {string} [notes]
 * @property {PurchaseOrderItem[]} items
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};

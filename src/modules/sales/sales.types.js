/**
 * Sales order domain model — a confirmed customer order, usually converted from
 * an accepted inquiry.
 *
 * @typedef {'draft'|'confirmed'|'in_production'|'fulfilled'|'cancelled'} SOStatus
 *
 * One ordered product line, with agreed pricing.
 * @typedef {object} SalesOrderItem
 * @property {string} id
 * @property {string} productName
 * @property {string} [productCode]
 * @property {number} quantity
 * @property {string} unit
 * @property {string} [deliveryDate]   yyyy-mm-dd
 * @property {number} unitPrice
 *
 * A confirmed customer order.
 * @typedef {object} SalesOrder
 * @property {string} id
 * @property {string} soNo                  e.g. SO-2026-0001
 * @property {string} customerName
 * @property {string} [customerContact]
 * @property {string|null} [sourceInquiryId]
 * @property {string} [sourceInquiryNo]
 * @property {string} orderDate             yyyy-mm-dd
 * @property {string} [expectedDeliveryDate]
 * @property {SOStatus} status
 * @property {string} [notes]
 * @property {SalesOrderItem[]} items
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};

/**
 * Quotation domain model — a priced offer sent to a customer in response to an
 * inquiry. It sits between an Inquiry (the request) and a Sales Order (the
 * confirmed deal): an accepted quotation is converted into a sales order.
 *
 * @typedef {'draft'|'sent'|'accepted'|'rejected'|'expired'|'converted'} QuoteStatus
 *
 * One quoted product line, with offered pricing. Shape mirrors a sales-order
 * line so converting a quotation into an order is a 1:1 mapping.
 * @typedef {object} QuotationItem
 * @property {string} id
 * @property {string} productName
 * @property {string} [productCode]
 * @property {number} quantity
 * @property {string} unit
 * @property {string} [deliveryDate]   yyyy-mm-dd
 * @property {number} unitPrice
 *
 * A price offer to a customer.
 * @typedef {object} Quotation
 * @property {string} id
 * @property {string} quoteNo               e.g. QT-2026-0001
 * @property {string} customerName
 * @property {string} [customerContact]
 * @property {string|null} [sourceInquiryId]
 * @property {string} [sourceInquiryNo]
 * @property {string} quoteDate             yyyy-mm-dd
 * @property {string} [validUntil]          yyyy-mm-dd
 * @property {QuoteStatus} status
 * @property {string} [notes]
 * @property {QuotationItem[]} items
 * @property {string} createdBy
 * @property {string} createdAt
 * @property {string} updatedAt
 */

export {};

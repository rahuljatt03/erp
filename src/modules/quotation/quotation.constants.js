import { createId } from '../../shared/utils/id';
import { todayIso } from '../../shared/utils/format';
import { UNITS } from '../inquiry/inquiry.constants';

export { UNITS };

/** Quotation lifecycle. `tone` drives the Badge color. */
export const QUOTE_STATUSES = [
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'sent', label: 'Sent', tone: 'info' },
  { value: 'accepted', label: 'Accepted', tone: 'success' },
  { value: 'rejected', label: 'Rejected', tone: 'danger' },
  { value: 'expired', label: 'Expired', tone: 'warning' },
  { value: 'converted', label: 'Converted', tone: 'success' },
];

const STATUS_MAP = Object.fromEntries(QUOTE_STATUSES.map((status) => [status.value, status]));

export function getQuoteStatusMeta(value) {
  return STATUS_MAP[value] ?? { value, label: value, tone: 'neutral' };
}

/** A fresh, empty quotation line. */
export function blankQuoteItem() {
  return {
    id: createId('qti'),
    productName: '',
    productCode: '',
    quantity: 1,
    unit: 'pcs',
    deliveryDate: '',
    unitPrice: 0,
  };
}

/** A fresh quotation draft for the "New quotation" form. */
export function blankQuoteDraft() {
  return {
    customerName: '',
    customerContact: '',
    sourceInquiryId: null,
    sourceInquiryNo: '',
    quoteDate: todayIso(),
    validUntil: '',
    status: 'draft',
    notes: '',
    items: [blankQuoteItem()],
  };
}

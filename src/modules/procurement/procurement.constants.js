import { createId } from '../../shared/utils/id';
import { todayIso } from '../../shared/utils/format';
import { UNITS } from '../inquiry/inquiry.constants';

// Re-export so procurement screens don't need to know units live in the inquiry module.
export { UNITS };

/** Purchase-order lifecycle. `tone` drives the Badge color. */
export const PO_STATUSES = [
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'ordered', label: 'Ordered', tone: 'info' },
  { value: 'partially_received', label: 'Partially received', tone: 'warning' },
  { value: 'received', label: 'Received', tone: 'success' },
  { value: 'cancelled', label: 'Cancelled', tone: 'danger' },
];

const STATUS_MAP = Object.fromEntries(PO_STATUSES.map((status) => [status.value, status]));

export function getPoStatusMeta(value) {
  return STATUS_MAP[value] ?? { value, label: value, tone: 'neutral' };
}

/** A fresh, empty purchase-order line. */
export function blankPOItem() {
  return {
    id: createId('poi'),
    materialName: '',
    materialCode: '',
    rawMaterialId: null,
    quantity: 1,
    unit: 'kg',
    unitPrice: 0,
    receivedQty: 0,
  };
}

/** A fresh purchase-order draft for the "New PO" form. */
export function blankPODraft() {
  return {
    supplierName: '',
    supplierContact: '',
    status: 'draft',
    orderDate: todayIso(),
    expectedDate: '',
    sourceInquiryId: null,
    sourceInquiryNo: '',
    notes: '',
    items: [blankPOItem()],
  };
}

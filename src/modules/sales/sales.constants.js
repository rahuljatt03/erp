import { createId } from '../../shared/utils/id';
import { todayIso } from '../../shared/utils/format';
import { UNITS } from '../inquiry/inquiry.constants';

export { UNITS };

/** Sales-order lifecycle. `tone` drives the Badge color. */
export const SO_STATUSES = [
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'confirmed', label: 'Confirmed', tone: 'info' },
  { value: 'in_production', label: 'In production', tone: 'warning' },
  { value: 'fulfilled', label: 'Fulfilled', tone: 'success' },
  { value: 'cancelled', label: 'Cancelled', tone: 'danger' },
];

const STATUS_MAP = Object.fromEntries(SO_STATUSES.map((status) => [status.value, status]));

export function getSoStatusMeta(value) {
  return STATUS_MAP[value] ?? { value, label: value, tone: 'neutral' };
}

/** A fresh, empty order line. */
export function blankSOItem() {
  return {
    id: createId('soi'),
    productName: '',
    productCode: '',
    quantity: 1,
    unit: 'pcs',
    deliveryDate: '',
    unitPrice: 0,
  };
}

/** A fresh sales-order draft for the "New sales order" form. */
export function blankSODraft() {
  return {
    customerName: '',
    customerContact: '',
    sourceInquiryId: null,
    sourceInquiryNo: '',
    orderDate: todayIso(),
    expectedDeliveryDate: '',
    status: 'confirmed',
    notes: '',
    items: [blankSOItem()],
  };
}

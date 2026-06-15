import { createId } from '../../shared/utils/id';
import { todayIso } from '../../shared/utils/format';
import { UNITS } from '../inquiry/inquiry.constants';

export { UNITS };

/** Work-order lifecycle. `tone` drives the Badge color. */
export const WO_STATUSES = [
  { value: 'planned', label: 'Planned', tone: 'neutral' },
  { value: 'in_progress', label: 'In progress', tone: 'warning' },
  { value: 'completed', label: 'Completed', tone: 'success' },
  { value: 'cancelled', label: 'Cancelled', tone: 'danger' },
];

const STATUS_MAP = Object.fromEntries(WO_STATUSES.map((status) => [status.value, status]));

export function getWoStatusMeta(value) {
  return STATUS_MAP[value] ?? { value, label: value, tone: 'neutral' };
}

/** A fresh, empty consumption line. */
export function blankWOMaterial() {
  return {
    id: createId('wom'),
    materialName: '',
    materialCode: '',
    rawMaterialId: null,
    quantity: 1,
    unit: 'kg',
    consumedQty: 0,
  };
}

/** A fresh work-order draft for the "New work order" form. */
export function blankWODraft() {
  return {
    productName: '',
    productCode: '',
    finishedGoodId: null,
    quantity: 1,
    unit: 'pcs',
    status: 'planned',
    dueDate: todayIso(),
    sourceInquiryId: null,
    sourceInquiryNo: '',
    notes: '',
    materials: [blankWOMaterial()],
  };
}

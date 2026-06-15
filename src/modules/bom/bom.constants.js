import { createId } from '../../shared/utils/id';
import { UNITS } from '../inquiry/inquiry.constants';

export { UNITS };

/** BOM lifecycle. `tone` drives the Badge color. */
export const BOM_STATUSES = [
  { value: 'active', label: 'Active', tone: 'success' },
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'archived', label: 'Archived', tone: 'neutral' },
];

const STATUS_MAP = Object.fromEntries(BOM_STATUSES.map((status) => [status.value, status]));

export function getBomStatusMeta(value) {
  return STATUS_MAP[value] ?? { value, label: value, tone: 'neutral' };
}

/** A fresh, empty component row. */
export function blankComponent() {
  return {
    id: createId('bc'),
    materialName: '',
    materialCode: '',
    rawMaterialId: null,
    quantityPerUnit: 1,
    unit: 'kg',
  };
}

/** A fresh BOM draft for the "New BOM" form. */
export function blankBomDraft() {
  return {
    productName: '',
    productCode: '',
    finishedGoodId: null,
    outputUnit: 'pcs',
    status: 'active',
    notes: '',
    components: [blankComponent()],
  };
}

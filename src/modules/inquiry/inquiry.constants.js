import { createId } from '../../shared/utils/id';
import { todayIso } from '../../shared/utils/format';

/**
 * Inquiry lifecycle statuses. `tone` drives the Badge color, so status styling
 * is defined once here and reused everywhere.
 */
export const INQUIRY_STATUSES = [
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'submitted', label: 'Submitted', tone: 'info' },
  { value: 'under_review', label: 'Under Review', tone: 'warning' },
  { value: 'quoted', label: 'Quoted', tone: 'info' },
  { value: 'converted', label: 'Converted', tone: 'success' },
  { value: 'closed', label: 'Closed', tone: 'neutral' },
];

const STATUS_MAP = Object.fromEntries(INQUIRY_STATUSES.map((status) => [status.value, status]));

/** Returns label + tone for a status value (safe fallback for unknown values). */
export function getStatusMeta(value) {
  return STATUS_MAP[value] ?? { value, label: value, tone: 'neutral' };
}

/** Units of measure offered in product / material dropdowns. */
export const UNITS = ['pcs', 'set', 'box', 'kg', 'g', 'ton', 'm', 'cm', 'mm', 'l', 'ml', 'sheet', 'roll'];

// ---- Factories for blank form rows -------------------------------------------

/** A fresh, empty raw-material row. */
export function blankRawMaterial() {
  return { id: createId('rm'), materialName: '', quantity: 1, unit: 'kg', notes: '' };
}

/** A fresh product line with one empty material row. */
export function blankLineItem() {
  return {
    id: createId('item'),
    productName: '',
    productCode: '',
    quantity: 1,
    unit: 'pcs',
    targetDeliveryDate: '',
    remarks: '',
    rawMaterials: [blankRawMaterial()],
  };
}

/** A fresh inquiry draft used to seed the "New inquiry" form. */
export function blankInquiryDraft() {
  return {
    customerName: '',
    customerContact: '',
    inquiryDate: todayIso(),
    status: 'draft',
    notes: '',
    items: [blankLineItem()],
  };
}

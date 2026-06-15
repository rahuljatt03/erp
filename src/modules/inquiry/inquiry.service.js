import { createCollection } from '../../shared/storage/mockDb';
import { createId } from '../../shared/utils/id';
import { currentUser } from '../../shared/session';
import { seedInquiries } from './inquiry.mock';

/**
 * Inquiry service — the boundary every component talks to.
 *
 * Today it reads/writes the localStorage-backed mock collection. To go live
 * against a real backend, replace the body of each method with a `fetch()` call
 * (e.g. `return fetch('/api/inquiries').then(r => r.json())`). The async,
 * Promise-returning signatures stay identical, so hooks/components don't change.
 */

const collection = createCollection('inquiries', seedInquiries);

/** Simulate network latency so loading states behave like a real API. */
function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function byNewestFirst(a, b) {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}

/** Generates the next sequential inquiry number, e.g. INQ-2026-0004. */
function nextInquiryNo(existing) {
  const year = new Date().getFullYear();
  const prefix = `INQ-${year}-`;
  const maxSeq = existing
    .map((inquiry) => inquiry.inquiryNo)
    .filter((no) => typeof no === 'string' && no.startsWith(prefix))
    .reduce((max, no) => {
      const seq = parseInt(no.slice(prefix.length), 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

/** Cleans raw form rows into stored records: numbers coerced, strings trimmed,
 *  empty material rows dropped, ids guaranteed. */
function normaliseItems(items = []) {
  return items.map((item) => ({
    id: item.id ?? createId('item'),
    productName: (item.productName ?? '').trim(),
    productCode: (item.productCode ?? '').trim(),
    quantity: Number(item.quantity) || 0,
    unit: item.unit ?? 'pcs',
    targetDeliveryDate: item.targetDeliveryDate ?? '',
    remarks: (item.remarks ?? '').trim(),
    rawMaterials: (item.rawMaterials ?? [])
      .filter((material) => (material.materialName ?? '').trim() !== '')
      .map((material) => ({
        id: material.id ?? createId('rm'),
        materialName: material.materialName.trim(),
        quantity: Number(material.quantity) || 0,
        unit: material.unit ?? 'kg',
        notes: (material.notes ?? '').trim(),
      })),
  }));
}

export const inquiryService = {
  /** @returns {Promise<import('./inquiry.types').Inquiry[]>} */
  async list() {
    await delay();
    return collection.getAll().sort(byNewestFirst);
  },

  /** @returns {Promise<import('./inquiry.types').Inquiry | null>} */
  async get(id) {
    await delay();
    return collection.getById(id) ?? null;
  },

  /** @returns {Promise<import('./inquiry.types').Inquiry>} */
  async create(draft) {
    await delay(350);
    const all = collection.getAll();
    const timestamp = nowIso();
    const record = {
      id: createId('inq'),
      inquiryNo: nextInquiryNo(all),
      customerName: (draft.customerName ?? '').trim(),
      customerContact: (draft.customerContact ?? '').trim(),
      inquiryDate: draft.inquiryDate,
      status: draft.status ?? 'draft',
      notes: (draft.notes ?? '').trim(),
      items: normaliseItems(draft.items),
      createdBy: currentUser.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return collection.insert(record);
  },

  /** @returns {Promise<import('./inquiry.types').Inquiry>} */
  async update(id, draft) {
    await delay(350);
    return collection.update(id, {
      customerName: (draft.customerName ?? '').trim(),
      customerContact: (draft.customerContact ?? '').trim(),
      inquiryDate: draft.inquiryDate,
      status: draft.status,
      notes: (draft.notes ?? '').trim(),
      items: normaliseItems(draft.items),
      updatedAt: nowIso(),
    });
  },

  /** @returns {Promise<void>} */
  async remove(id) {
    await delay();
    collection.remove(id);
  },

  /** Lightweight status update — used e.g. when an inquiry is converted to a sales order. */
  async setStatus(id, status) {
    await delay(120);
    return collection.update(id, { status, updatedAt: nowIso() });
  },
};

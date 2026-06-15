import { createCollection } from '../../shared/storage/mockDb';
import { createId } from '../../shared/utils/id';
import { currentUser } from '../../shared/session';
import { inquiryService } from '../inquiry/inquiry.service';
import { seedSalesOrders } from './sales.mock';

/**
 * Sales-order service. On create from an inquiry, it marks the source inquiry
 * as "converted" — the one cross-module side effect, mirroring how procurement
 * and production write to inventory.
 */

const collection = createCollection('sales_orders', seedSalesOrders);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function byNewestFirst(a, b) {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}

function nextSoNo(existing) {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;
  const maxSeq = existing
    .map((so) => so.soNo)
    .filter((no) => typeof no === 'string' && no.startsWith(prefix))
    .reduce((max, no) => {
      const seq = parseInt(no.slice(prefix.length), 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

function normaliseItems(items = []) {
  return items
    .filter((item) => (item.productName ?? '').trim() !== '')
    .map((item) => ({
      id: item.id ?? createId('soi'),
      productName: (item.productName ?? '').trim(),
      productCode: (item.productCode ?? '').trim(),
      quantity: Number(item.quantity) || 0,
      unit: item.unit ?? 'pcs',
      deliveryDate: item.deliveryDate ?? '',
      unitPrice: Number(item.unitPrice) || 0,
    }));
}

export const salesService = {
  async list() {
    await delay();
    return collection.getAll().sort(byNewestFirst);
  },

  async get(id) {
    await delay();
    return collection.getById(id) ?? null;
  },

  async create(draft) {
    await delay(350);
    const timestamp = nowIso();
    const record = {
      id: createId('so'),
      soNo: nextSoNo(collection.getAll()),
      customerName: (draft.customerName ?? '').trim(),
      customerContact: (draft.customerContact ?? '').trim(),
      sourceInquiryId: draft.sourceInquiryId ?? null,
      sourceInquiryNo: draft.sourceInquiryNo ?? '',
      orderDate: draft.orderDate,
      expectedDeliveryDate: draft.expectedDeliveryDate ?? '',
      status: draft.status ?? 'confirmed',
      notes: (draft.notes ?? '').trim(),
      items: normaliseItems(draft.items),
      createdBy: currentUser.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const inserted = collection.insert(record);

    // Converting an inquiry marks it as "converted".
    if (inserted.sourceInquiryId) {
      try {
        await inquiryService.setStatus(inserted.sourceInquiryId, 'converted');
      } catch {
        // Non-fatal: the sales order is still created even if the inquiry update fails.
      }
    }
    return inserted;
  },

  async update(id, draft) {
    await delay(350);
    return collection.update(id, {
      customerName: (draft.customerName ?? '').trim(),
      customerContact: (draft.customerContact ?? '').trim(),
      orderDate: draft.orderDate,
      expectedDeliveryDate: draft.expectedDeliveryDate ?? '',
      status: draft.status,
      notes: (draft.notes ?? '').trim(),
      items: normaliseItems(draft.items),
      updatedAt: nowIso(),
    });
  },

  async remove(id) {
    await delay();
    collection.remove(id);
  },
};

import { createCollection } from '../../shared/storage/mockDb';
import { createId } from '../../shared/utils/id';
import { currentUser } from '../../shared/session';
import { rawMaterialsService } from '../inventory/inventory.service';
import { seedPurchaseOrders } from './procurement.mock';

/**
 * Procurement service. Reads/writes the mock collection like the other modules,
 * and — crucially — its `receive()` pushes received quantities into raw-material
 * inventory, closing the loop with the requirement analysis.
 */

const collection = createCollection('purchase_orders', seedPurchaseOrders);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function byNewestFirst(a, b) {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}

function nextPoNo(existing) {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const maxSeq = existing
    .map((po) => po.poNo)
    .filter((no) => typeof no === 'string' && no.startsWith(prefix))
    .reduce((max, no) => {
      const seq = parseInt(no.slice(prefix.length), 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

function normaliseItems(items = []) {
  return items
    .filter((item) => (item.materialName ?? '').trim() !== '')
    .map((item) => ({
      id: item.id ?? createId('poi'),
      materialName: (item.materialName ?? '').trim(),
      materialCode: (item.materialCode ?? '').trim(),
      rawMaterialId: item.rawMaterialId ?? null,
      quantity: Number(item.quantity) || 0,
      unit: item.unit ?? 'kg',
      unitPrice: Number(item.unitPrice) || 0,
      receivedQty: Number(item.receivedQty) || 0,
    }));
}

/** Derive status from received quantities (unless cancelled). */
function deriveStatus(items, fallback) {
  if (fallback === 'cancelled' || fallback === 'draft') return fallback;
  const allReceived =
    items.length > 0 && items.every((it) => (Number(it.receivedQty) || 0) >= (Number(it.quantity) || 0));
  const anyReceived = items.some((it) => (Number(it.receivedQty) || 0) > 0);
  if (allReceived) return 'received';
  if (anyReceived) return 'partially_received';
  return fallback;
}

export const procurementService = {
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
      id: createId('po'),
      poNo: nextPoNo(collection.getAll()),
      supplierName: (draft.supplierName ?? '').trim(),
      supplierContact: (draft.supplierContact ?? '').trim(),
      status: draft.status ?? 'draft',
      orderDate: draft.orderDate,
      expectedDate: draft.expectedDate ?? '',
      sourceInquiryId: draft.sourceInquiryId ?? null,
      sourceInquiryNo: draft.sourceInquiryNo ?? '',
      notes: (draft.notes ?? '').trim(),
      items: normaliseItems(draft.items),
      createdBy: currentUser.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return collection.insert(record);
  },

  async update(id, draft) {
    await delay(350);
    const items = normaliseItems(draft.items);
    return collection.update(id, {
      supplierName: (draft.supplierName ?? '').trim(),
      supplierContact: (draft.supplierContact ?? '').trim(),
      status: deriveStatus(items, draft.status),
      orderDate: draft.orderDate,
      expectedDate: draft.expectedDate ?? '',
      notes: (draft.notes ?? '').trim(),
      items,
      updatedAt: nowIso(),
    });
  },

  async remove(id) {
    await delay();
    collection.remove(id);
  },

  /**
   * Record a goods receipt. `receipts` is `[{ itemId, qty }]`. Increments each
   * line's receivedQty, pushes the quantity into raw-material inventory, and
   * recomputes the PO status.
   */
  async receive(id, receipts) {
    await delay(350);
    const po = collection.getById(id);
    if (!po) throw new Error('Purchase order not found');

    const validReceipts = receipts.filter((r) => Number(r.qty) > 0);

    for (const receipt of validReceipts) {
      const item = po.items.find((it) => it.id === receipt.itemId);
      if (!item) continue;
      await rawMaterialsService.receive({
        rawMaterialId: item.rawMaterialId,
        name: item.materialName,
        code: item.materialCode,
        unit: item.unit,
        qty: receipt.qty,
      });
    }

    const items = po.items.map((item) => {
      const receipt = validReceipts.find((r) => r.itemId === item.id);
      if (!receipt) return item;
      return { ...item, receivedQty: (Number(item.receivedQty) || 0) + Number(receipt.qty) };
    });

    return collection.update(id, {
      items,
      status: deriveStatus(items, po.status === 'draft' ? 'ordered' : po.status),
      updatedAt: nowIso(),
    });
  },
};

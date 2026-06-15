import { createCollection } from '../../shared/storage/mockDb';
import { createId } from '../../shared/utils/id';
import { currentUser } from '../../shared/session';
import { finishedGoodsService, rawMaterialsService } from '../inventory/inventory.service';
import { seedProductionOrders } from './production.mock';

/**
 * Production service. `produce()` is the loop-closer: it consumes raw materials
 * and adds finished goods to inventory, mirroring how procurement's `receive()`
 * adds raw materials.
 */

const collection = createCollection('production_orders', seedProductionOrders);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function round(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}

function byNewestFirst(a, b) {
  return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
}

function nextWoNo(existing) {
  const year = new Date().getFullYear();
  const prefix = `WO-${year}-`;
  const maxSeq = existing
    .map((wo) => wo.woNo)
    .filter((no) => typeof no === 'string' && no.startsWith(prefix))
    .reduce((max, no) => {
      const seq = parseInt(no.slice(prefix.length), 10);
      return Number.isNaN(seq) ? max : Math.max(max, seq);
    }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

function normaliseMaterials(materials = []) {
  return materials
    .filter((material) => (material.materialName ?? '').trim() !== '')
    .map((material) => ({
      id: material.id ?? createId('wom'),
      materialName: (material.materialName ?? '').trim(),
      materialCode: (material.materialCode ?? '').trim(),
      rawMaterialId: material.rawMaterialId ?? null,
      quantity: Number(material.quantity) || 0,
      unit: material.unit ?? 'kg',
      consumedQty: Number(material.consumedQty) || 0,
    }));
}

export const productionService = {
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
      id: createId('wo'),
      woNo: nextWoNo(collection.getAll()),
      productName: (draft.productName ?? '').trim(),
      productCode: (draft.productCode ?? '').trim(),
      finishedGoodId: draft.finishedGoodId ?? null,
      quantity: Number(draft.quantity) || 0,
      unit: draft.unit ?? 'pcs',
      producedQty: 0,
      status: draft.status ?? 'planned',
      dueDate: draft.dueDate ?? '',
      sourceInquiryId: draft.sourceInquiryId ?? null,
      sourceInquiryNo: draft.sourceInquiryNo ?? '',
      notes: (draft.notes ?? '').trim(),
      materials: normaliseMaterials(draft.materials),
      createdBy: currentUser.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return collection.insert(record);
  },

  async update(id, draft) {
    await delay(350);
    return collection.update(id, {
      productName: (draft.productName ?? '').trim(),
      productCode: (draft.productCode ?? '').trim(),
      quantity: Number(draft.quantity) || 0,
      unit: draft.unit ?? 'pcs',
      status: draft.status,
      dueDate: draft.dueDate ?? '',
      notes: (draft.notes ?? '').trim(),
      materials: normaliseMaterials(draft.materials),
      updatedAt: nowIso(),
    });
  },

  async remove(id) {
    await delay();
    collection.remove(id);
  },

  /**
   * Report production of `qty` units (capped at the outstanding amount):
   *   • consumes each material proportionally (raw stock down)
   *   • adds the produced units to finished-goods stock
   *   • advances producedQty and the work-order status
   */
  async produce(id, qty) {
    await delay(400);
    const wo = collection.getById(id);
    if (!wo) throw new Error('Work order not found');

    const quantity = Number(wo.quantity) || 0;
    const outstanding = Math.max(0, quantity - (Number(wo.producedQty) || 0));
    const make = Math.min(Number(qty) || 0, outstanding);
    if (make <= 0) return wo;

    const fraction = quantity > 0 ? make / quantity : 0;

    // Consume raw materials proportionally.
    for (const material of wo.materials) {
      const consume = (Number(material.quantity) || 0) * fraction;
      if (consume > 0) {
        await rawMaterialsService.consume({
          rawMaterialId: material.rawMaterialId,
          name: material.materialName,
          qty: consume,
        });
      }
    }

    // Produce finished goods.
    await finishedGoodsService.produce({
      finishedGoodId: wo.finishedGoodId,
      sku: wo.productCode,
      name: wo.productName,
      unit: wo.unit,
      qty: make,
    });

    const materials = wo.materials.map((material) => ({
      ...material,
      consumedQty: round((Number(material.consumedQty) || 0) + (Number(material.quantity) || 0) * fraction),
    }));
    const producedQty = round((Number(wo.producedQty) || 0) + make);
    const status = producedQty >= quantity ? 'completed' : 'in_progress';

    return collection.update(id, { materials, producedQty, status, updatedAt: nowIso() });
  },
};

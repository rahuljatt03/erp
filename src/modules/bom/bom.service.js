import { createCollection } from '../../shared/storage/mockDb';
import { createId } from '../../shared/utils/id';
import { currentUser } from '../../shared/session';
import { seedBoms } from './bom.mock';

/** Bill-of-materials service. Same async contract as the other modules. */

const collection = createCollection('boms', seedBoms);

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function normaliseComponents(components = []) {
  return components
    .filter((component) => (component.materialName ?? '').trim() !== '')
    .map((component) => ({
      id: component.id ?? createId('bc'),
      materialName: (component.materialName ?? '').trim(),
      materialCode: (component.materialCode ?? '').trim(),
      rawMaterialId: component.rawMaterialId ?? null,
      quantityPerUnit: Number(component.quantityPerUnit) || 0,
      unit: component.unit ?? 'kg',
    }));
}

export const bomService = {
  async list() {
    await delay();
    return collection.getAll().sort((a, b) => (a.productName ?? '').localeCompare(b.productName ?? ''));
  },

  async get(id) {
    await delay();
    return collection.getById(id) ?? null;
  },

  async create(draft) {
    await delay(350);
    const timestamp = nowIso();
    const record = {
      id: createId('bom'),
      productName: (draft.productName ?? '').trim(),
      productCode: (draft.productCode ?? '').trim(),
      finishedGoodId: draft.finishedGoodId ?? null,
      outputUnit: draft.outputUnit ?? 'pcs',
      status: draft.status ?? 'active',
      notes: (draft.notes ?? '').trim(),
      components: normaliseComponents(draft.components),
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
      outputUnit: draft.outputUnit ?? 'pcs',
      status: draft.status,
      notes: (draft.notes ?? '').trim(),
      components: normaliseComponents(draft.components),
      updatedAt: nowIso(),
    });
  },

  async remove(id) {
    await delay();
    collection.remove(id);
  },
};

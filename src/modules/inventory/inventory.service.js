import { createCollection } from '../../shared/storage/mockDb';
import { createId } from '../../shared/utils/id';
import { seedFinishedGoods, seedRawMaterials } from './inventory.mock';

/**
 * Inventory services — same async/Promise contract as the inquiry service, so
 * they swap to a real backend the same way (replace bodies with `fetch`).
 */

const finishedCollection = createCollection('finished_goods', seedFinishedGoods);
const rawCollection = createCollection('raw_materials', seedRawMaterials);

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const finishedGoodsService = {
  /** @returns {Promise<import('./inventory.types').FinishedGood[]>} */
  async list() {
    await delay();
    return finishedCollection.getAll();
  },
  /** Set the on-hand quantity for one finished good. */
  async setOnHand(id, onHand) {
    await delay(120);
    return finishedCollection.update(id, { onHand: Number(onHand) || 0 });
  },

  /** Add a brand-new finished-good record to inventory. */
  async create({ sku, name, unit, onHand }) {
    await delay(120);
    return finishedCollection.insert({
      id: createId('fg'),
      sku: (sku ?? '').trim(),
      name: (name ?? '').trim(),
      unit: unit || 'pcs',
      onHand: Number(onHand) || 0,
    });
  },

  /**
   * Add produced units to finished-goods stock. Matches by id, then SKU/name,
   * else creates the record. Called when a production order is completed.
   */
  async produce({ finishedGoodId, sku, name, unit, qty }) {
    await delay(120);
    const amount = Number(qty) || 0;

    const byId = finishedGoodId ? finishedCollection.getById(finishedGoodId) : undefined;
    if (byId) {
      return finishedCollection.update(byId.id, { onHand: (Number(byId.onHand) || 0) + amount });
    }

    const targetSku = (sku ?? '').trim().toLowerCase();
    const targetName = (name ?? '').trim().toLowerCase();
    const match = finishedCollection
      .getAll()
      .find(
        (good) =>
          (targetSku && good.sku.trim().toLowerCase() === targetSku) ||
          good.name.trim().toLowerCase() === targetName,
      );
    if (match) {
      return finishedCollection.update(match.id, { onHand: (Number(match.onHand) || 0) + amount });
    }

    return finishedCollection.insert({
      id: createId('fg'),
      sku: sku || '',
      name: name || 'Unknown product',
      unit: unit || 'pcs',
      onHand: amount,
    });
  },
};

export const rawMaterialsService = {
  /** @returns {Promise<import('./inventory.types').RawMaterialStock[]>} */
  async list() {
    await delay();
    return rawCollection.getAll();
  },
  /** Set the on-hand quantity for one raw material. */
  async setOnHand(id, onHand) {
    await delay(120);
    return rawCollection.update(id, { onHand: Number(onHand) || 0 });
  },

  /** Add a brand-new raw-material record to inventory. */
  async create({ code, name, unit, onHand }) {
    await delay(120);
    return rawCollection.insert({
      id: createId('rw'),
      code: (code ?? '').trim(),
      name: (name ?? '').trim(),
      unit: unit || 'kg',
      onHand: Number(onHand) || 0,
    });
  },

  /**
   * Add received stock. Increments the matched record (by id, then by name), or
   * creates a new raw-material record if it isn't tracked yet. This is what the
   * Procurement module calls when a purchase order is received.
   */
  async receive({ rawMaterialId, name, code, unit, qty }) {
    await delay(120);
    const amount = Number(qty) || 0;

    const byId = rawMaterialId ? rawCollection.getById(rawMaterialId) : undefined;
    if (byId) {
      return rawCollection.update(byId.id, { onHand: (Number(byId.onHand) || 0) + amount });
    }

    const target = (name ?? '').trim().toLowerCase();
    const byName = rawCollection.getAll().find((stock) => stock.name.trim().toLowerCase() === target);
    if (byName) {
      return rawCollection.update(byName.id, { onHand: (Number(byName.onHand) || 0) + amount });
    }

    return rawCollection.insert({
      id: createId('rw'),
      code: code || '',
      name: name || 'Unknown material',
      unit: unit || 'kg',
      onHand: amount,
    });
  },

  /**
   * Remove consumed stock (floored at zero). Matches by id, then name. No-op if
   * the material isn't tracked. Called when a production order is completed.
   */
  async consume({ rawMaterialId, name, qty }) {
    await delay(120);
    const amount = Number(qty) || 0;

    const byId = rawMaterialId ? rawCollection.getById(rawMaterialId) : undefined;
    if (byId) {
      return rawCollection.update(byId.id, { onHand: Math.max(0, (Number(byId.onHand) || 0) - amount) });
    }

    const target = (name ?? '').trim().toLowerCase();
    const byName = rawCollection.getAll().find((stock) => stock.name.trim().toLowerCase() === target);
    if (byName) {
      return rawCollection.update(byName.id, { onHand: Math.max(0, (Number(byName.onHand) || 0) - amount) });
    }

    return undefined;
  },
};

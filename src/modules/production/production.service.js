import { finishedGoodsService, rawMaterialsService } from '../inventory/inventory.service';

/**
 * Production service — now talks to the .NET ERP API instead of localStorage.
 *
 * `produce()` is the loop-closer: the backend advances the work order's
 * producedQty / consumedQty / status, and this service orchestrates the matching
 * inventory movements (consume raw materials, add finished goods) — mirroring how
 * the other modules keep cross-module side effects in the frontend service.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/production-orders`;

/** Parse JSON if present; throw a helpful error on non-2xx responses. */
async function handle(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.title || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export const productionService = {
  async list() {
    return handle(await fetch(ENDPOINT));
  },

  async get(id) {
    const response = await fetch(`${ENDPOINT}/${id}`);
    if (response.status === 404) return null;
    return handle(response);
  },

  async create(draft) {
    return handle(
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }),
    );
  },

  async update(id, draft) {
    return handle(
      await fetch(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }),
    );
  },

  async remove(id) {
    await handle(await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' }));
  },

  /**
   * Report production of `qty` units (capped at the outstanding amount):
   *   • backend advances producedQty, each material's consumedQty, and status
   *   • this service consumes each raw material proportionally (raw stock down)
   *   • this service adds the produced units to finished-goods stock
   */
  async produce(id, qty) {
    const wo = await this.get(id);
    if (!wo) throw new Error('Work order not found');

    const quantity = Number(wo.quantity) || 0;
    const outstanding = Math.max(0, quantity - (Number(wo.producedQty) || 0));
    const make = Math.min(Number(qty) || 0, outstanding);
    if (make <= 0) return wo;

    const fraction = quantity > 0 ? make / quantity : 0;

    // Advance the work order on the backend first.
    const updated = await handle(
      await fetch(`${ENDPOINT}/${id}/produce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: make }),
      }),
    );

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

    return updated;
  },
};

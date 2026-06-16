import { rawMaterialsService } from '../inventory/inventory.service';

/**
 * Procurement service — now talks to the .NET ERP API instead of localStorage.
 *
 * `receive()` is the loop-closer: the backend increments each line's receivedQty
 * and recomputes the PO status, and this service pushes the received quantities
 * into raw-material inventory — mirroring how the other modules keep cross-module
 * side effects in the frontend service.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/purchase-orders`;

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

export const procurementService = {
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
   * Record a goods receipt. `receipts` is `[{ itemId, qty }]`. The backend
   * increments each line's receivedQty and recomputes status; this service pushes
   * the received quantity into raw-material inventory.
   */
  async receive(id, receipts) {
    const po = await this.get(id);
    if (!po) throw new Error('Purchase order not found');

    const validReceipts = (receipts ?? []).filter((r) => Number(r.qty) > 0);

    // Push received quantities into raw-material inventory.
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

    // Advance the purchase order on the backend (increments receivedQty + status).
    return handle(
      await fetch(`${ENDPOINT}/${id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validReceipts),
      }),
    );
  },
};

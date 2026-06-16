/**
 * Inventory services — now talk to the .NET ERP API instead of localStorage.
 *
 * Same async/Promise contract as before (list/setOnHand/create/produce/receive/
 * consume), so the hooks and components did not change.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const FG_ENDPOINT = `${API_BASE}/api/inventory/finished-goods`;
const RM_ENDPOINT = `${API_BASE}/api/inventory/raw-materials`;

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

function post(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export const finishedGoodsService = {
  /** @returns {Promise<import('./inventory.types').FinishedGood[]>} */
  async list() {
    return handle(await fetch(FG_ENDPOINT));
  },

  /** Set the on-hand quantity for one finished good. */
  async setOnHand(id, onHand) {
    return handle(
      await fetch(`${FG_ENDPOINT}/${id}/on-hand`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onHand: Number(onHand) || 0 }),
      }),
    );
  },

  /** Add a brand-new finished-good record to inventory. */
  async create({ sku, name, unit, onHand }) {
    return handle(post(FG_ENDPOINT, { sku, name, unit, onHand: Number(onHand) || 0 }));
  },

  /**
   * Add produced units to finished-goods stock. Matches by id, then SKU/name,
   * else creates the record. Called when a production order is completed.
   */
  async produce({ finishedGoodId, sku, name, unit, qty }) {
    return handle(post(`${FG_ENDPOINT}/produce`, { finishedGoodId, sku, name, unit, qty: Number(qty) || 0 }));
  },
};

export const rawMaterialsService = {
  /** @returns {Promise<import('./inventory.types').RawMaterialStock[]>} */
  async list() {
    return handle(await fetch(RM_ENDPOINT));
  },

  /** Set the on-hand quantity for one raw material. */
  async setOnHand(id, onHand) {
    return handle(
      await fetch(`${RM_ENDPOINT}/${id}/on-hand`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onHand: Number(onHand) || 0 }),
      }),
    );
  },

  /** Add a brand-new raw-material record to inventory. */
  async create({ code, name, unit, onHand }) {
    return handle(post(RM_ENDPOINT, { code, name, unit, onHand: Number(onHand) || 0 }));
  },

  /**
   * Add received stock. Increments the matched record (by id, then by name), or
   * creates a new raw-material record if it isn't tracked yet. Called by the
   * Procurement module when a purchase order is received.
   */
  async receive({ rawMaterialId, name, code, unit, qty }) {
    return handle(post(`${RM_ENDPOINT}/receive`, { rawMaterialId, name, code, unit, qty: Number(qty) || 0 }));
  },

  /**
   * Remove consumed stock (floored at zero). Matches by id, then name. No-op if
   * the material isn't tracked. Called when a production order is completed.
   */
  async consume({ rawMaterialId, name, qty }) {
    return handle(post(`${RM_ENDPOINT}/consume`, { rawMaterialId, name, qty: Number(qty) || 0 }));
  },
};

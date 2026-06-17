import { inquiryService } from '../inquiry/inquiry.service';

/**
 * Sales-order service — now talks to the .NET ERP API instead of localStorage.
 *
 * On create from an inquiry it marks the source inquiry as "converted" — the one
 * cross-module side effect. The async, Promise-returning method names/signatures
 * are unchanged, so hooks and components did not change.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/sales-orders`;

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

export const salesService = {
  async list() {
    return handle(await fetch(ENDPOINT));
  },

  async get(id) {
    const response = await fetch(`${ENDPOINT}/${id}`);
    if (response.status === 404) return null;
    return handle(response);
  },

  async create(draft) {
    const inserted = await handle(
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }),
    );

    // Converting an inquiry marks it as "converted".
    if (inserted?.sourceInquiryId) {
      try {
        await inquiryService.setStatus(inserted.sourceInquiryId, 'converted');
      } catch {
        // Non-fatal: the sales order is still created even if the inquiry update fails.
      }
    }
    return inserted;
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

  /** Lightweight status override — used by the inline status changer on the list. */
  async setStatus(id, status) {
    await delay(120);
    return collection.update(id, { status, updatedAt: nowIso() });
  },
};

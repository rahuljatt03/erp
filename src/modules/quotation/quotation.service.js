import { inquiryService } from '../inquiry/inquiry.service';

/**
 * Quotation service — now talks to the .NET ERP API instead of localStorage.
 *
 * On create from an inquiry it marks the source inquiry as "quoted" — the one
 * cross-module side effect, mirroring how the sales service marks an inquiry
 * "converted". The async, Promise-returning method names/signatures are
 * unchanged, so hooks and components did not change.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/quotations`;

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

export const quotationService = {
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

    // Quoting an inquiry marks it as "quoted".
    if (inserted?.sourceInquiryId) {
      try {
        await inquiryService.setStatus(inserted.sourceInquiryId, 'quoted');
      } catch {
        // Non-fatal: the quotation is still created even if the inquiry update fails.
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

  /** Lightweight status update — used e.g. when a quotation is converted to a sales order. */
  async setStatus(id, status) {
    return handle(
      await fetch(`${ENDPOINT}/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }),
    );
  },
};

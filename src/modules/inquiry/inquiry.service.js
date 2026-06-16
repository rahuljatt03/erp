/**
 * Inquiry service — now talks to the .NET ERP API instead of localStorage.
 *
 * The async, Promise-returning method names/signatures are unchanged
 * (list/get/create/update/remove/setStatus), so hooks and components that depend
 * on this service did not change.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';
const ENDPOINT = `${API_BASE}/api/inquiries`;

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

export const inquiryService = {
  /** @returns {Promise<import('./inquiry.types').Inquiry[]>} */
  async list() {
    return handle(await fetch(ENDPOINT));
  },

  /** @returns {Promise<import('./inquiry.types').Inquiry | null>} */
  async get(id) {
    const response = await fetch(`${ENDPOINT}/${id}`);
    if (response.status === 404) return null;
    return handle(response);
  },

  /** @returns {Promise<import('./inquiry.types').Inquiry>} */
  async create(draft) {
    return handle(
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }),
    );
  },

  /** @returns {Promise<import('./inquiry.types').Inquiry>} */
  async update(id, draft) {
    return handle(
      await fetch(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }),
    );
  },

  /** @returns {Promise<void>} */
  async remove(id) {
    await handle(await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' }));
  },

  /** Lightweight status update — e.g. when an inquiry is converted to a sales order. */
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

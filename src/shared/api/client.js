/**
 * Shared axios client for the .NET ERP API.
 *
 * Modules build a path-scoped instance with `createApiClient('/api/<resource>')`
 * and run calls through `runRequest()` so every module gets the same JSON headers,
 * empty-body (204) handling, and human-friendly error messages.
 *
 * Set VITE_API_BASE_URL in a .env file to override the API origin.
 */

import axios from 'axios';

/** ERP API origin. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';

/**
 * Create an axios instance scoped to a path under the ERP API.
 * @param {string} path e.g. '/api/inquiries'
 */
export function createApiClient(path = '') {
  return axios.create({
    baseURL: `${API_BASE}${path}`,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Map an axios error to a human-friendly Error (preserves ProblemDetails title/message). */
export function toApiError(error) {
  const response = error.response;
  if (response) {
    const data = response.data;
    const message = data?.title || data?.message || `Request failed (${response.status})`;
    return new Error(message);
  }
  // Network / CORS / abort — no HTTP response; surface as-is.
  return error;
}

/** Run an axios request, returning its parsed body (204/empty → null) or a normalised Error. */
export async function runRequest(request) {
  try {
    const { data } = await request;
    return data === '' || data === undefined ? null : data;
  } catch (error) {
    throw toApiError(error);
  }
}

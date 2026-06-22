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
import { getToken, clearStoredAuth } from '../auth/token';

/** ERP API origin. */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5080';

/**
 * Create an axios instance scoped to a path under the ERP API.
 *
 * Every instance carries two interceptors so auth is uniform across modules:
 *  - request: attach `Authorization: Bearer <token>` when a session token exists.
 *  - response: on a 401 for a request that *had* a token, the session is
 *    expired/invalid — clear it and emit `erp:auth-expired` so the app drops to
 *    the login screen. (A 401 from /auth/login carries no token, so it's left
 *    for the login flow to report as bad credentials.)
 *
 * @param {string} path e.g. '/api/inquiries'
 */
export function createApiClient(path = '') {
  const instance = axios.create({
    baseURL: `${API_BASE}${path}`,
    headers: { 'Content-Type': 'application/json' },
  });

  instance.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && getToken()) {
        clearStoredAuth();
        window.dispatchEvent(new Event('erp:auth-expired'));
      }
      return Promise.reject(error);
    },
  );

  return instance;
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

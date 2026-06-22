/**
 * Persisted auth session. Single source of truth shared by the axios client
 * (request/response interceptors in shared/api/client.js) and the Redux auth
 * slice, so they never disagree about the current token. Stored as one JSON blob
 * under a versioned localStorage key.
 */

const STORAGE_KEY = 'erp:auth:v1';

/** Read the persisted `{ token, user }`, or null if absent/corrupt. */
export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

/** Persist `{ token, user }`. */
export function setStoredAuth(auth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

/** Clear the persisted session. */
export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

/** The raw bearer token, or null. Used by the axios request interceptor. */
export function getToken() {
  return getStoredAuth()?.token ?? null;
}

/** Decode a JWT payload (no signature check) — only to read `exp` client-side. */
export function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** True when the token is missing or already past its `exp`. */
export function isTokenExpired(token) {
  if (!token) return true;
  const payload = decodeJwt(token);
  if (!payload?.exp) return false; // no exp claim → let the server decide
  return payload.exp * 1000 <= Date.now();
}

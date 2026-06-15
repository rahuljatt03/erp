/** Formatting helpers shared across modules. Keep display logic out of components. */

/**
 * `2026-06-12` -> `12 Jun 2026`. Falls back to the raw string if unparseable.
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * ISO datetime -> `12 Jun 2026, 14:30`.
 * @param {string | null | undefined} iso
 * @returns {string}
 */
export function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Today's date as a form-friendly `yyyy-mm-dd` string.
 * @returns {string}
 */
export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * `1234.5` -> `1,234.5`.
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(value);
}

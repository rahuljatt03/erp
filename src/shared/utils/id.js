/**
 * Generates a reasonably-unique client-side id.
 *
 * When a real backend is added, ids will come from the database instead — this
 * exists only so mock records have stable keys. Kept here (not inlined) so the
 * whole app has a single place that mints ids.
 *
 * @param {string} [prefix] short label so ids are self-describing in storage
 * @returns {string}
 */
export function createId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${random}`;
}

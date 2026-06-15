/** Derived values for quotations. */

/** Total quoted value (Σ quantity × unitPrice). */
export function quoteValue(quote) {
  return (quote.items ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
}

/** Total quoted units across all lines. */
export function quoteTotalUnits(quote) {
  return (quote.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

/**
 * Whether a quotation is past its validity date (and not already closed out).
 * Pure/UI-only — does not mutate stored status.
 */
export function isQuoteExpired(quote, todayIso) {
  if (!quote?.validUntil) return false;
  if (quote.status === 'accepted' || quote.status === 'converted' || quote.status === 'rejected') {
    return false;
  }
  return quote.validUntil < todayIso;
}

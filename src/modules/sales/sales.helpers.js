/** Derived values for sales orders. */

/** Total order value (Σ quantity × unitPrice). */
export function soValue(so) {
  return (so.items ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
}

/** Total ordered units across all lines. */
export function soTotalUnits(so) {
  return (so.items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

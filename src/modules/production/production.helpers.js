/** Derived values for work orders. */

/** Build progress for a work order. */
export function woProgress(wo) {
  const quantity = Number(wo.quantity) || 0;
  const produced = Number(wo.producedQty) || 0;
  return {
    quantity,
    produced,
    outstanding: Math.max(0, quantity - produced),
    pct: quantity > 0 ? Math.round((produced / quantity) * 100) : 0,
  };
}

/** Derived values for purchase orders, shared across procurement screens. */

/** Total monetary value of the PO (Σ quantity × unitPrice). */
export function poValue(po) {
  return (po.items ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
}

/** Outstanding (not-yet-received) quantity for a line. */
export function poItemOutstanding(item) {
  return Math.max(0, (Number(item.quantity) || 0) - (Number(item.receivedQty) || 0));
}

/** Overall receipt progress for the PO. */
export function poReceiptProgress(po) {
  const items = po.items ?? [];
  const ordered = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const received = items.reduce((sum, item) => sum + (Number(item.receivedQty) || 0), 0);
  return { ordered, received, pct: ordered > 0 ? Math.round((received / ordered) * 100) : 0 };
}

/**
 * Pure read helpers for deriving display values from an inquiry. Shared by the
 * list, detail and dashboard so the same logic isn't reimplemented per page.
 */

/** First product name, with "+N more" when there are multiple lines. */
export function summariseProducts(inquiry) {
  const items = inquiry.items ?? [];
  if (items.length === 0) return '—';
  const first = items[0].productName || 'Unnamed product';
  return items.length === 1 ? first : `${first} +${items.length - 1} more`;
}

/** Number of product lines on the inquiry. */
export function countItems(inquiry) {
  return (inquiry.items ?? []).length;
}

/** Earliest target delivery date across all lines (yyyy-mm-dd) or null. */
export function earliestDelivery(inquiry) {
  const dates = (inquiry.items ?? [])
    .map((item) => item.targetDeliveryDate)
    .filter(Boolean)
    .sort();
  return dates[0] ?? null;
}

/** Total count of raw-material rows across the whole inquiry. */
export function countMaterials(inquiry) {
  return (inquiry.items ?? []).reduce((sum, item) => sum + (item.rawMaterials?.length ?? 0), 0);
}

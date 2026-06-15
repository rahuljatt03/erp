/**
 * Pure aggregation helpers for the dashboard. Each takes the raw records a
 * module's list service returns and derives counts/values — no React, no
 * formatting — so the dashboard component stays declarative and the maths is
 * testable in isolation. We reuse every module's own value helpers (soValue,
 * quoteValue, …) so the dashboard's totals match each module's pages exactly.
 */
import { INQUIRY_STATUSES } from '../inquiry/inquiry.constants';
import { QUOTE_STATUSES } from '../quotation/quotation.constants';
import { SO_STATUSES } from '../sales/sales.constants';
import { WO_STATUSES } from '../production/production.constants';
import { PO_STATUSES } from '../procurement/procurement.constants';
import { quoteValue, isQuoteExpired } from '../quotation/quotation.helpers';
import { soValue } from '../sales/sales.helpers';
import { poValue } from '../procurement/procurement.helpers';
import { woProgress } from '../production/production.helpers';

const sumBy = (arr, fn) => arr.reduce((total, item) => total + (fn(item) || 0), 0);
const onHand = (stock) => Number(stock.onHand) || 0;
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Counts records per status, in the canonical order of `statuses`. */
export function statusBreakdown(records, statuses) {
  return statuses.map((status) => ({
    value: status.value,
    label: status.label,
    tone: status.tone,
    count: records.filter((record) => record.status === status.value).length,
  }));
}

/** Inquiry funnel entry — "open" excludes converted/closed. */
export function inquiryMetrics(inquiries) {
  const OPEN = new Set(['draft', 'submitted', 'under_review', 'quoted']);
  return {
    total: inquiries.length,
    open: inquiries.filter((inquiry) => OPEN.has(inquiry.status)).length,
    byStatus: statusBreakdown(inquiries, INQUIRY_STATUSES),
  };
}

/** Quotations — "active" = still in play (draft/sent/accepted), expiry is UI-only. */
export function quotationMetrics(quotes, today) {
  const ACTIVE = new Set(['draft', 'sent', 'accepted']);
  const active = quotes.filter((quote) => ACTIVE.has(quote.status));
  return {
    total: quotes.length,
    active: active.length,
    activeValue: sumBy(active, quoteValue),
    expiring: quotes.filter((quote) => isQuoteExpired(quote, today)).length,
    byStatus: statusBreakdown(quotes, QUOTE_STATUSES),
  };
}

/** Sales orders — "open" = confirmed/in-production backlog (excludes fulfilled/cancelled). */
export function salesMetrics(orders) {
  const OPEN = new Set(['confirmed', 'in_production']);
  const open = orders.filter((order) => OPEN.has(order.status));
  return {
    total: orders.length,
    open: open.length,
    openValue: sumBy(open, soValue),
    fulfilled: orders.filter((order) => order.status === 'fulfilled').length,
    byStatus: statusBreakdown(orders, SO_STATUSES),
  };
}

/** Work orders — "active" = planned/in-progress; throughput = produced ÷ ordered units. */
export function productionMetrics(workOrders) {
  const ACTIVE = new Set(['planned', 'in_progress']);
  const active = workOrders.filter((wo) => ACTIVE.has(wo.status));
  const ordered = sumBy(workOrders, (wo) => woProgress(wo).quantity);
  const produced = sumBy(workOrders, (wo) => woProgress(wo).produced);
  return {
    total: workOrders.length,
    active: active.length,
    outstandingUnits: sumBy(active, (wo) => woProgress(wo).outstanding),
    ordered,
    produced,
    producedPct: pct(produced, ordered),
    byStatus: statusBreakdown(workOrders, WO_STATUSES),
  };
}

/** Purchase orders — "awaiting" = ordered/partially received; progress = lines fully received. */
export function procurementMetrics(purchaseOrders) {
  const AWAITING = new Set(['ordered', 'partially_received']);
  const OPEN = new Set(['draft', 'ordered', 'partially_received']);
  const awaiting = purchaseOrders.filter((po) => AWAITING.has(po.status));
  const lines = purchaseOrders.flatMap((po) => po.items ?? []);
  const linesReceived = lines.filter(
    (line) => (Number(line.quantity) || 0) > 0 && (Number(line.receivedQty) || 0) >= (Number(line.quantity) || 0),
  ).length;
  return {
    total: purchaseOrders.length,
    awaiting: awaiting.length,
    openValue: sumBy(purchaseOrders.filter((po) => OPEN.has(po.status)), poValue),
    lines: lines.length,
    linesReceived,
    receivedPct: pct(linesReceived, lines.length),
    byStatus: statusBreakdown(purchaseOrders, PO_STATUSES),
  };
}

/** Inventory snapshot — SKU counts, on-hand totals, and the out-of-stock count. */
export function inventoryMetrics(finishedGoods, rawMaterials) {
  const outOfStockCount =
    finishedGoods.filter((good) => onHand(good) <= 0).length +
    rawMaterials.filter((material) => onHand(material) <= 0).length;
  return {
    fgSkus: finishedGoods.length,
    fgUnits: sumBy(finishedGoods, onHand),
    rawSkus: rawMaterials.length,
    rawUnits: sumBy(rawMaterials, onHand),
    outOfStockCount,
  };
}

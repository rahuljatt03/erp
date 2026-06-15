/**
 * Pure aggregation helpers for the Reports module. Each builder takes the raw
 * records a module's list service returns plus a `{ from, to }` date range and
 * derives the counts / values / breakdowns a report card renders — no React, no
 * formatting — so the report components stay declarative and the maths is
 * testable in isolation.
 *
 * We reuse every module's own value helpers (soValue, quoteValue, poValue,
 * woProgress) so a report's totals match that module's own pages exactly.
 */
import { SO_STATUSES } from '../sales/sales.constants';
import { QUOTE_STATUSES } from '../quotation/quotation.constants';
import { PO_STATUSES } from '../procurement/procurement.constants';
import { WO_STATUSES } from '../production/production.constants';
import { soValue, soTotalUnits } from '../sales/sales.helpers';
import { quoteValue } from '../quotation/quotation.helpers';
import { poValue, poReceiptProgress } from '../procurement/procurement.helpers';
import { woProgress } from '../production/production.helpers';

const sumBy = (arr, fn) => arr.reduce((total, item) => total + (fn(item) || 0), 0);
const onHand = (stock) => Number(stock.onHand) || 0;
const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Normalise any date-ish value (yyyy-mm-dd or ISO datetime) to its `yyyy-mm-dd`. */
const dayOf = (value) => (value ? String(value).slice(0, 10) : '');

/**
 * Inclusive date-range test on a `yyyy-mm-dd` (or ISO) value. An empty bound is
 * treated as open-ended, so `{ from: '', to: '' }` matches everything.
 */
export function inRange(value, from, to) {
  const day = dayOf(value);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

/** Keeps records whose `field` date falls inside the range (no bounds = all). */
export function filterByDate(records, field, { from, to }) {
  if (!from && !to) return records.slice();
  return records.filter((record) => inRange(record[field], from, to));
}

/** Newest-first comparator on a date `field` (ISO/`yyyy-mm-dd`). */
const byDateDesc = (field) => (a, b) => dayOf(b[field]).localeCompare(dayOf(a[field]));

/**
 * Groups records by a key, summing count + value (+ optional units), sorted by
 * value (then count) descending. Used for "top customers / suppliers / products".
 */
function groupBy(records, keyFn, valueFn, unitsFn) {
  const map = new Map();
  for (const record of records) {
    const key = keyFn(record) || '—';
    const group = map.get(key) || { key, label: key, count: 0, value: 0, units: 0 };
    group.count += 1;
    if (valueFn) group.value += valueFn(record) || 0;
    if (unitsFn) group.units += unitsFn(record) || 0;
    map.set(key, group);
  }
  return [...map.values()].sort((a, b) => b.value - a.value || b.count - a.count);
}

/**
 * Breakdown by a status list, preserving the canonical status order and adding
 * a count (+ optional summed value). Empty statuses are dropped.
 */
function breakdownByStatus(records, statuses, valueFn) {
  return statuses
    .map((status) => {
      const matched = records.filter((record) => record.status === status.value);
      return {
        key: status.value,
        label: status.label,
        tone: status.tone,
        count: matched.length,
        value: valueFn ? sumBy(matched, valueFn) : 0,
      };
    })
    .filter((row) => row.count > 0);
}

// ---- Sales -----------------------------------------------------------------

/**
 * Sales performance over the range: the inquiry → quote → order funnel plus
 * order value, units, win rate, status mix and top customers.
 */
export function salesReport({ inquiries, quotes, orders }, range) {
  const inq = filterByDate(inquiries, 'inquiryDate', range);
  const qt = filterByDate(quotes, 'quoteDate', range);
  const so = filterByDate(orders, 'orderDate', range);

  const orderValue = sumBy(so, soValue);
  const decided = qt.filter((quote) => ['accepted', 'rejected', 'converted'].includes(quote.status));
  const won = qt.filter((quote) => ['accepted', 'converted'].includes(quote.status));

  return {
    summary: {
      inquiryCount: inq.length,
      quoteCount: qt.length,
      quoteValue: sumBy(qt, quoteValue),
      orderCount: so.length,
      orderValue,
      unitsSold: sumBy(so, soTotalUnits),
      avgOrderValue: so.length ? orderValue / so.length : 0,
      winRate: decided.length ? pct(won.length, decided.length) : null,
    },
    ordersByStatus: breakdownByStatus(so, SO_STATUSES, soValue),
    topCustomers: groupBy(so, (order) => order.customerName, soValue, soTotalUnits).slice(0, 8),
    rows: so
      .slice()
      .sort(byDateDesc('orderDate'))
      .map((order) => ({
        id: order.id,
        soNo: order.soNo,
        date: order.orderDate,
        customer: order.customerName,
        status: order.status,
        units: soTotalUnits(order),
        value: soValue(order),
      })),
  };
}

// ---- Production ------------------------------------------------------------

/** Groups work orders by a key with ordered/produced units + completion %. */
function groupWorkOrders(workOrders, keyFn) {
  const map = new Map();
  for (const wo of workOrders) {
    const key = keyFn(wo) || '—';
    const progress = woProgress(wo);
    const group = map.get(key) || { key, label: key, count: 0, ordered: 0, produced: 0 };
    group.count += 1;
    group.ordered += progress.quantity;
    group.produced += progress.produced;
    map.set(key, group);
  }
  return [...map.values()]
    .map((group) => ({ ...group, completion: pct(group.produced, group.ordered) }))
    .sort((a, b) => b.ordered - a.ordered);
}

/**
 * Production output over the range: ordered vs produced units, completion,
 * status mix (with units) and a per-product breakdown. Work orders have no
 * "order date", so we report on when each was raised (`createdAt`).
 */
export function productionReport({ workOrders }, range) {
  const wo = filterByDate(workOrders, 'createdAt', range);
  const ordered = sumBy(wo, (item) => woProgress(item).quantity);
  const produced = sumBy(wo, (item) => woProgress(item).produced);

  const byStatus = WO_STATUSES.map((status) => {
    const matched = wo.filter((item) => item.status === status.value);
    return {
      key: status.value,
      label: status.label,
      tone: status.tone,
      count: matched.length,
      ordered: sumBy(matched, (item) => woProgress(item).quantity),
      produced: sumBy(matched, (item) => woProgress(item).produced),
    };
  }).filter((row) => row.count > 0);

  return {
    summary: {
      orderCount: wo.length,
      ordered,
      produced,
      completion: pct(produced, ordered),
      active: wo.filter((item) => ['planned', 'in_progress'].includes(item.status)).length,
      completed: wo.filter((item) => item.status === 'completed').length,
    },
    byStatus,
    byProduct: groupWorkOrders(wo, (item) => item.productName).slice(0, 8),
    rows: wo
      .slice()
      .sort(byDateDesc('createdAt'))
      .map((item) => {
        const progress = woProgress(item);
        return {
          id: item.id,
          woNo: item.woNo,
          date: dayOf(item.createdAt),
          product: item.productName,
          status: item.status,
          ordered: progress.quantity,
          produced: progress.produced,
          completion: progress.pct,
        };
      }),
  };
}

// ---- Procurement -----------------------------------------------------------

/**
 * Purchase spend over the range: total value, line-level receipt progress,
 * still-outstanding value, status mix and top suppliers.
 */
export function procurementReport({ purchaseOrders }, range) {
  const po = filterByDate(purchaseOrders, 'orderDate', range);
  const lines = po.flatMap((order) => order.items ?? []);
  const linesReceived = lines.filter(
    (line) =>
      (Number(line.quantity) || 0) > 0 &&
      (Number(line.receivedQty) || 0) >= (Number(line.quantity) || 0),
  ).length;

  const OPEN = new Set(['draft', 'ordered', 'partially_received']);
  const outstandingValue = sumBy(
    po.filter((order) => OPEN.has(order.status)),
    (order) =>
      (order.items ?? []).reduce(
        (sum, line) =>
          sum +
          Math.max(0, (Number(line.quantity) || 0) - (Number(line.receivedQty) || 0)) *
            (Number(line.unitPrice) || 0),
        0,
      ),
  );

  return {
    summary: {
      orderCount: po.length,
      totalValue: sumBy(po, poValue),
      lines: lines.length,
      linesReceived,
      receiptPct: pct(linesReceived, lines.length),
      outstandingValue,
    },
    byStatus: breakdownByStatus(po, PO_STATUSES, poValue),
    topSuppliers: groupBy(po, (order) => order.supplierName, poValue).slice(0, 8),
    rows: po
      .slice()
      .sort(byDateDesc('orderDate'))
      .map((order) => ({
        id: order.id,
        poNo: order.poNo,
        date: order.orderDate,
        supplier: order.supplierName,
        status: order.status,
        value: poValue(order),
        receiptPct: poReceiptProgress(order).pct,
      })),
  };
}

// ---- Inventory -------------------------------------------------------------

/**
 * Inventory snapshot — a live stock position, so (unlike the others) it ignores
 * the date range. Finished goods and raw materials are reported separately, each
 * sorted lowest-stock-first so shortages surface at the top.
 */
export function inventoryReport({ finishedGoods, rawMaterials }) {
  const toRow = (item, category, code) => ({
    id: item.id,
    category,
    code,
    name: item.name,
    unit: item.unit,
    onHand: onHand(item),
    status: onHand(item) <= 0 ? 'out' : 'in',
  });

  const fgRows = finishedGoods
    .map((good) => toRow(good, 'Finished good', good.sku))
    .sort((a, b) => a.onHand - b.onHand);
  const rawRows = rawMaterials
    .map((material) => toRow(material, 'Raw material', material.code))
    .sort((a, b) => a.onHand - b.onHand);

  return {
    summary: {
      fgSkus: finishedGoods.length,
      fgUnits: sumBy(finishedGoods, onHand),
      rawSkus: rawMaterials.length,
      rawUnits: sumBy(rawMaterials, onHand),
      outOfStock:
        fgRows.filter((row) => row.status === 'out').length +
        rawRows.filter((row) => row.status === 'out').length,
    },
    finishedGoods: fgRows,
    rawMaterials: rawRows,
  };
}

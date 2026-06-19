/**
 * Pure aggregation for the LIVE dashboard. Each builder takes the raw records a
 * module's slice holds plus the toolbar's `{ from, to }` date range and derives
 * the figures a dashboard section renders — no React, no formatting. We reuse
 * the Reports date utilities (`filterByDate`) and each module's own value
 * helpers (`woProgress`) so the dashboard's numbers line up with the rest of
 * the app, and so the maths stays testable in isolation.
 *
 * The trend builders bucket records over time, with the x-axis granularity
 * driven by the selected interval (mirrors Omrive's date-filter behaviour):
 * a single day for a ≤1-day range, DAY-wise to 2 weeks, WEEK-wise (Mon–Sun)
 * to ~3 months, and MONTH-wise beyond. An open-ended range
 * (`{ from: '', to: '' }` = "all time") is always month-wise over a rolling
 * window of at least `MIN_TREND_MONTHS` months (extended to cover all data).
 * Every slot in the span is emitted (zero-filled), so the axis stays
 * continuous even where there's no activity.
 */
import { filterByDate } from '../reports/reports.metrics';
import { woProgress } from '../production/production.helpers';
import { forecastSeries } from '../../shared/utils/forecast';

const num = (v) => Number(v) || 0;
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOf = (value) => (value ? String(value).slice(0, 10) : '');
const parseIso = (value) => {
  const [y, m, d] = dayOf(value).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Whole-day difference end − start (DST-safe via rounding). */
const daysBetween = (startIso, endIso) =>
  Math.round((parseIso(endIso) - parseIso(startIso)) / 86_400_000);

/** Minimum number of months an open ("all time") range shows, so a single
 * active month doesn't collapse the axis to one point. */
const MIN_TREND_MONTHS = 6;

/**
 * The `[start, end]` ISO span to bucket over. A bounded range is used as-is.
 * An open ("all time") range becomes a rolling MONTHLY window: it ends at the
 * later of today / the latest record, and starts at the earlier of the first
 * record / `MIN_TREND_MONTHS - 1` months before the end — so the axis always
 * shows a few months of context (and all history when older data exists),
 * rather than collapsing to the one month that happens to hold data.
 */
function spanFor(range, dateValues) {
  if (range.from && range.to) return { start: range.from, end: range.to };

  const days = dateValues.map(dayOf).filter(Boolean).sort();
  const today = new Date();
  const latest = days.length ? parseIso(days[days.length - 1]) : today;
  const end = latest > today ? latest : today;
  const floor = new Date(end.getFullYear(), end.getMonth() - (MIN_TREND_MONTHS - 1), 1);
  const earliest = days.length ? parseIso(days[0]) : floor;
  const start = earliest < floor ? earliest : floor;
  return { start: isoOf(start), end: isoOf(end) };
}

const dayLabel = (d) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; // "5 Jun"
const dayFull = (d) => `${dayLabel(d)} ${d.getFullYear()}`; // "5 Jun 2026"

/** Monday (ISO week start) of the week containing `date`. */
function mondayOf(date) {
  const c = new Date(date);
  const day = c.getDay(); // 0 = Sun … 6 = Sat
  c.setDate(c.getDate() + (day === 0 ? -6 : 1 - day));
  c.setHours(0, 0, 0, 0);
  return c;
}

/**
 * X-axis granularity for the selected interval. An open ("all time") range is
 * always month-wise; otherwise it steps single → day → week → month as the
 * span widens (≤1d / ≤14d / ≤90d / beyond).
 */
function granularityFor(range, start, end) {
  if (!range.from && !range.to) return 'month';
  const span = daysBetween(start, end);
  if (span <= 1) return 'single';
  if (span <= 14) return 'day';
  if (span <= 90) return 'week';
  return 'month';
}

/**
 * Ordered, zero-filled buckets covering `[start, end]` at the interval-driven
 * granularity. Each carries the inclusive `from`/`to` ISO days it owns, an axis
 * `label`, and a fuller `tooltip` (a date for days, a Mon–Sun range for weeks,
 * a month for months). Month labels gain a 2-digit year only when the span
 * crosses years (keeps axis labels unique + readable).
 */
function buildBuckets(range, start, end) {
  const granularity = granularityFor(range, start, end);
  const buckets = [];

  if (granularity === 'single') {
    const d = parseIso(start);
    const ds = isoOf(d);
    return [{ from: ds, to: ds, label: dayFull(d), tooltip: dayFull(d) }];
  }

  if (granularity === 'day') {
    for (let cur = parseIso(start); isoOf(cur) <= end; cur.setDate(cur.getDate() + 1)) {
      const ds = isoOf(cur);
      buckets.push({ from: ds, to: ds, label: dayLabel(cur), tooltip: dayFull(cur) });
    }
    return buckets;
  }

  if (granularity === 'week') {
    for (let mon = mondayOf(parseIso(start)); isoOf(mon) <= end; mon.setDate(mon.getDate() + 7)) {
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      // Clamp each week to the selected range so a partial first/last week
      // neither bleeds past the interval (e.g. "29 Jun - 5 Jul" for a June
      // range) nor counts out-of-range days.
      const fromIso = isoOf(mon) < start ? start : isoOf(mon);
      const toIso = isoOf(sun) > end ? end : isoOf(sun);
      const fromD = parseIso(fromIso);
      const toD = parseIso(toIso);
      buckets.push({
        from: fromIso,
        to: toIso,
        label:
          fromIso === toIso
            ? dayLabel(fromD)
            : fromD.getMonth() === toD.getMonth()
              ? `${fromD.getDate()} - ${toD.getDate()} ${MONTHS_SHORT[fromD.getMonth()]}`
              : `${dayLabel(fromD)} - ${dayLabel(toD)}`,
        tooltip:
          fromIso === toIso ? dayFull(fromD) : `${dayFull(fromD)} - ${dayFull(toD)}`,
      });
    }
    return buckets;
  }

  // month-wise
  const s = parseIso(start);
  const e = parseIso(end);
  const crossesYears = s.getFullYear() !== e.getFullYear();
  for (let y = s.getFullYear(), m = s.getMonth(); y < e.getFullYear() || (y === e.getFullYear() && m <= e.getMonth());) {
    const mFrom = isoOf(new Date(y, m, 1));
    const mTo = isoOf(new Date(y, m + 1, 0)); // day 0 of next month = last day of this one
    buckets.push({
      from: mFrom < start ? start : mFrom, // clamp partial edge months to the range
      to: mTo > end ? end : mTo,
      label: crossesYears ? `${MONTHS_SHORT[m]} ${String(y).slice(2)}` : MONTHS_SHORT[m],
      tooltip: `${MONTHS_SHORT[m]} ${y}`,
    });
    m += 1;
    if (m > 11) { m = 0; y += 1; }
  }
  return buckets;
}

/**
 * Build AreaChart-ready trend data. `sources` is one entry per series:
 * `{ records, dateField, key, value? }` — each record is dropped into the
 * bucket its `dateField` falls in and its `value(record)` (default: a count of
 * 1) is added to that bucket's `key`. Records outside the span are ignored, so
 * a bounded range filters naturally. Returns `{ data, hasData }`.
 */
function buildTrend(range, sources) {
  const allDates = sources.flatMap((s) => s.records.map((r) => r[s.dateField]));
  const span = spanFor(range, allDates);
  if (!span) return { data: [], hasData: false };

  const granularity = granularityFor(range, span.start, span.end);
  const buckets = buildBuckets(range, span.start, span.end);
  const data = buckets.map((b) => {
    const point = { label: b.label, tooltip: b.tooltip };
    for (const s of sources) point[s.key] = 0;
    return point;
  });
  const indexOfDay = (ds) => buckets.findIndex((b) => ds >= b.from && ds <= b.to);

  let total = 0;
  for (const source of sources) {
    for (const record of source.records) {
      const idx = indexOfDay(dayOf(record[source.dateField]));
      if (idx < 0) continue;
      const v = source.value ? num(source.value(record)) : 1;
      data[idx][source.key] += v;
      total += v;
    }
  }
  // `buckets`/`granularity` are returned so the forecast overlay can continue
  // the same cadence forward (see withForecast).
  return { data, hasData: total > 0, buckets, granularity };
}

/* ---- Forecast overlay ---------------------------------------------------- */

/** Per-series keys that hold the projected average / high / low on a data row. */
function forecastKeys(key) {
  return { avg: `${key}__favg`, hi: `${key}__fhi`, lo: `${key}__flo` };
}

/**
 * Continue the bucket cadence forward `count` steps, emitting the `label` /
 * `tooltip` for each future slot (mirrors buildBuckets' formatting per
 * granularity). A single-point ("one day") range can't be projected, so it
 * yields nothing.
 */
function futureBuckets(buckets, granularity, count) {
  if (!buckets.length || granularity === 'single') return [];
  const last = buckets[buckets.length - 1];
  const out = [];

  if (granularity === 'month') {
    const firstYear = parseIso(buckets[0].from).getFullYear();
    const ref = parseIso(last.to);
    const lastHistYear = ref.getFullYear();
    let y = lastHistYear;
    let m = ref.getMonth();
    for (let i = 0; i < count; i += 1) {
      m += 1;
      if (m > 11) { m = 0; y += 1; }
      // Add a 2-digit year exactly when buildBuckets would (span crosses years).
      const crosses = firstYear !== y || firstYear !== lastHistYear;
      out.push({
        label: crosses ? `${MONTHS_SHORT[m]} ${String(y).slice(2)}` : MONTHS_SHORT[m],
        tooltip: `${MONTHS_SHORT[m]} ${y}`,
      });
    }
    return out;
  }

  if (granularity === 'week') {
    let mon = mondayOf(parseIso(last.to));
    for (let i = 0; i < count; i += 1) {
      mon = new Date(mon);
      mon.setDate(mon.getDate() + 7);
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      out.push({
        label:
          mon.getMonth() === sun.getMonth()
            ? `${mon.getDate()} - ${sun.getDate()} ${MONTHS_SHORT[mon.getMonth()]}`
            : `${dayLabel(mon)} - ${dayLabel(sun)}`,
        tooltip: `${dayFull(mon)} - ${dayFull(sun)}`,
      });
    }
    return out;
  }

  // day-wise
  let cur = parseIso(last.to);
  for (let i = 0; i < count; i += 1) {
    cur = new Date(cur);
    cur.setDate(cur.getDate() + 1);
    out.push({ label: dayLabel(cur), tooltip: dayFull(cur) });
  }
  return out;
}

/**
 * Extend a trend (from `buildTrend`) with a forward projection so the chart can
 * draw a dashed forecast line + high/low band past the last real point. Each
 * `series` entry's key is least-squares-projected (see forecastSeries) over
 * `horizon` future buckets; the bridge (last measured point) is seeded so the
 * forecast connects to the history. Returns AreaChart props
 * `{ data, series, forecastFrom }`, falling back to the trend unchanged when
 * there isn't enough history (or the range is a single day) to project.
 */
export function withForecast(trend, series, { horizon = 3, minHistory = 4 } = {}) {
  const base = { data: trend.data, series, forecastFrom: null, hasData: trend.hasData };
  if (!trend.hasData || !trend.buckets || trend.granularity === 'single') return base;
  if (trend.data.length < minHistory) return base;

  const future = futureBuckets(trend.buckets, trend.granularity, horizon);
  if (!future.length) return base;

  const forecastFrom = trend.data.length - 1;
  const bridge = { ...trend.data[forecastFrom] };
  const futureRows = future.map((b) => ({ label: b.label, tooltip: b.tooltip }));
  const extraSeries = [];

  for (const s of series) {
    const f = forecastSeries(trend.data.map((d) => num(d[s.key])), { horizon });
    const k = forecastKeys(s.key);
    const seed = num(bridge[s.key]); // band starts zero-width at the last point
    bridge[k.avg] = seed;
    bridge[k.hi] = seed;
    bridge[k.lo] = seed;
    futureRows.forEach((row, i) => {
      row[k.avg] = f.average[i];
      row[k.hi] = f.highest[i];
      row[k.lo] = f.minimum[i];
    });
    extraSeries.push({
      key: k.avg,
      label: `${s.label} (forecast)`,
      color: s.color,
      forecast: true,
      band: { hi: k.hi, lo: k.lo },
    });
  }

  const data = [...trend.data.slice(0, forecastFrom), bridge, ...futureRows];
  return { data, series: [...series, ...extraSeries], forecastFrom, hasData: true };
}

/** Sales trend: count of sales orders vs quotations raised per bucket. */
export function salesTrendData(range, salesOrders, quotations) {
  return buildTrend(range, [
    { records: salesOrders, dateField: 'orderDate', key: 'orders' },
    { records: quotations, dateField: 'quoteDate', key: 'quotations' },
  ]);
}

/** Production trend: units produced vs planned (ordered) per bucket, by created date. */
export function productionTrendData(range, workOrders) {
  return buildTrend(range, [
    { records: workOrders, dateField: 'createdAt', key: 'produced', value: (wo) => woProgress(wo).produced },
    { records: workOrders, dateField: 'createdAt', key: 'planned', value: (wo) => woProgress(wo).quantity },
  ]);
}

/** Active (planned / in-progress) work orders in range, newest first, capped at `limit`. */
export function activeWorkOrders(range, workOrders, limit = 8) {
  const ACTIVE = new Set(['planned', 'in_progress']);
  return filterByDate(workOrders, 'createdAt', range)
    .filter((wo) => ACTIVE.has(wo.status))
    .sort((a, b) => dayOf(b.createdAt).localeCompare(dayOf(a.createdAt)))
    .slice(0, limit)
    .map((wo) => ({ woNo: wo.woNo, product: wo.productName, qty: num(wo.quantity), status: wo.status }));
}

/**
 * Top-selling finished goods within range, by sales-order line. Units + revenue
 * are summed per product; `share` is each product's revenue as a % of the range
 * total (across ALL products, not just the returned top `limit`).
 */
export function topProducts(range, salesOrders, limit = 5) {
  const map = new Map();
  for (const so of filterByDate(salesOrders, 'orderDate', range)) {
    for (const line of so.items ?? []) {
      const name = line.productName || '—';
      const key = line.productCode || name;
      const group = map.get(key) || { name, sku: line.productCode || '—', units: 0, revenue: 0 };
      group.units += num(line.quantity);
      group.revenue += num(line.quantity) * num(line.unitPrice);
      map.set(key, group);
    }
  }
  const rows = [...map.values()].sort((a, b) => b.revenue - a.revenue || b.units - a.units);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  return rows
    .slice(0, limit)
    .map((row) => ({ ...row, share: totalRevenue > 0 ? Math.round((row.revenue / totalRevenue) * 100) : 0 }));
}

/**
 * Headline KPI values driven by the range: order count + distinct customers
 * among sales orders in range. `products` is a live finished-goods count
 * (stock isn't dated, so it's a snapshot regardless of range).
 */
export function headlineKpis(range, salesOrders, finishedGoods) {
  const orders = filterByDate(salesOrders, 'orderDate', range);
  const customers = new Set(
    orders.map((order) => (order.customerName || '').trim()).filter(Boolean),
  );
  return { orders: orders.length, customers: customers.size, products: finishedGoods.length };
}

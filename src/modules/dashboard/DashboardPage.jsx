import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../shared/components/Button";
import Card from "../../shared/components/Card";
import PageHeader from "../../shared/components/PageHeader";
import Badge from "../../shared/components/Badge";
import AreaChart from "../../shared/components/AreaChart";
import Tabs from "../../shared/components/Tabs";
import { LoadingState, ErrorState } from "../../shared/components/states";
import ManageWidgets from "./ManageWidgets";
import {
  OrderIcon,
  ProductionIcon,
  CustomersIcon,
  FinishedGoodsIcon,
  GrowthIcon,
  DownloadIcon,
  DragHandleIcon,
} from "../../shared/components/icons";
import { formatNumber } from "../../shared/utils/format";
import { toCsv, downloadCsv } from "../reports/reports.csv";
import DateRangePicker, { defaultRange } from "./DateRangePicker";
import { getWoStatusMeta } from "../production/production.constants";
import {
  fetchSalesOrders,
  selectSalesOrders,
  selectSalesOrdersError,
  selectSalesOrdersLoading,
} from "../sales/salesSlice";
import {
  fetchQuotations,
  selectQuotations,
  selectQuotationsError,
  selectQuotationsLoading,
} from "../quotation/quotationSlice";
import {
  fetchProductionOrders,
  selectProductionOrders,
  selectProductionOrdersError,
  selectProductionOrdersLoading,
} from "../production/productionSlice";
import {
  fetchFinishedGoods,
  selectFinishedGoods,
  selectFinishedGoodsError,
  selectFinishedGoodsLoading,
} from "../inventory/inventorySlice";
import {
  salesTrendData,
  productionTrendData,
  activeWorkOrders,
  topProducts,
  headlineKpis,
  withForecast,
} from "./dashboard.aggregate";

const SALES_SERIES = [
  { key: "orders", label: "Sales orders", color: "var(--success)" },
  { key: "quotations", label: "Quotations", color: "var(--info)" },
];

const PRODUCTION_SERIES = [
  { key: "produced", label: "Units produced", color: "var(--brand-600)" },
  { key: "planned", label: "Units planned", color: "var(--warning)" },
];

/* Trend points carry a fuller `tooltip` (e.g. "Jun 2026" / "Jun 5, 2026") while
   the x-axis keeps the short label. */
const trendTooltipTitle = (point) => point.tooltip || point.label;

/* Split a trend into one single-series chart per series — each series becomes
   its own separate graph with an independent y-scale and its own forecast cone,
   shown in its own tab. `idBase` namespaces each chart's SVG gradient ids. */
function trendCharts(trend, allSeries, idBase) {
  return allSeries.map((s) => ({
    key: s.key,
    label: s.label,
    chartId: `${idBase}-${s.key}`,
    ...withForecast(trend, [s], { horizon: 3 }),
  }));
}

/* Render a trend's per-series charts as a tabbed body — one tab (one separate
   graph) per series. The tab bar doubles as the card header, so the drag-grip
   rides along in its `leading` slot. */
function trendTabs(charts, leading) {
  return (
    <Tabs
      leading={leading}
      tabs={charts.map((c) => ({
        key: c.key,
        label: c.label,
        content: (
          <AreaChart
            id={c.chartId}
            data={c.data}
            series={c.series}
            forecastFrom={c.forecastFrom}
            tooltipTitle={trendTooltipTitle}
          />
        ),
      }))}
    />
  );
}

/** CSV column spec for the top-selling-products export. */
const TOP_PRODUCTS_COLUMNS = [
  { label: "Product", value: (p) => p.name },
  { label: "SKU", value: (p) => p.sku },
  { label: "Units sold", value: (p) => p.units },
  { label: "Revenue", value: (p) => p.revenue },
  { label: "Share", value: (p) => `${p.share}%` },
];

/* Static machine states for the shop-floor section. There is no machine module
   behind this — it's a placeholder monitor (asset, live state, current job,
   shift utilisation) and so it ignores the date range. */
const MACHINES = [
  { name: "CNC Lathe #1", status: "Running", tone: "success", job: "WO-2026-0042", utilization: 92 },
  { name: "Milling Center #2", status: "Running", tone: "success", job: "WO-2026-0041", utilization: 78 },
  { name: "Drill Press #3", status: "Idle", tone: "warning", job: "—", utilization: 35 },
  { name: "Hydraulic Press #1", status: "Maintenance", tone: "info", job: "—", utilization: 0 },
  { name: "Assembly Line A", status: "Down", tone: "danger", job: "—", utilization: 12 },
];

/* Key-metric cards. Reorderable among themselves via drag-and-drop. `customers`,
   `products` and `orders` are filled from live data per the date range (see
   `kpiValues` below); `today_production` and `growth` stay static placeholders —
   the backend has no per-day production log or period-over-period revenue feed. */
const KPIS = [
  { id: "today_production", label: "Today's production", value: "1,240", meta: "units built today", icon: ProductionIcon, tone: "warning" },
  { id: "customers", label: "Customers", icon: CustomersIcon, tone: "info" },
  { id: "products", label: "Products", icon: FinishedGoodsIcon, tone: "info" },
  { id: "orders", label: "Orders", icon: OrderIcon, tone: "success" },
  { id: "growth", label: "Growth", value: "+12.4%", meta: "revenue vs last month", icon: GrowthIcon, tone: "success" },
];
const KPI_BY_ID = Object.fromEntries(KPIS.map((k) => [k.id, k]));
const KPI_DEFAULT_ORDER = KPIS.map((k) => k.id);

/* Toggleable dashboard widgets, in menu order. Drives the Manage-widgets menu. */
const WIDGETS = [
  { id: "key_metrics", label: "Key metrics" },
  { id: "sales_trend", label: "Sales trend" },
  { id: "production_trend", label: "Production trend" },
  { id: "active_work_orders", label: "Active work orders" },
  { id: "machine_status", label: "Machine status" },
  { id: "top_products", label: "Top selling products" },
];
const DEFAULT_VISIBLE = Object.fromEntries(WIDGETS.map((w) => [w.id, true]));

/* Default order of the titled sections in the packing grid (live order is
   reorderable via drag-and-drop; the Key-metrics stat-grid sits above). */
const GRID_DEFAULT_ORDER = [
  "sales_trend",
  "production_trend",
  "active_work_orders",
  "machine_status",
  "top_products",
];

const VISIBLE_KEY = "erp:dashboard:widgets:v1";
const KPI_ORDER_KEY = "erp:dashboard:kpiOrder:v1";
const GRID_ORDER_KEY = "erp:dashboard:gridOrder:v1";

/** Read saved widget visibility, merged over defaults so new widgets show by default. */
function loadVisible() {
  try {
    const saved = JSON.parse(localStorage.getItem(VISIBLE_KEY) || "null");
    return saved ? { ...DEFAULT_VISIBLE, ...saved } : DEFAULT_VISIBLE;
  } catch {
    return DEFAULT_VISIBLE;
  }
}

/** Read a saved order, dropping unknown ids and appending any new ones. */
function loadOrder(key, defaultOrder) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (!Array.isArray(saved)) return defaultOrder;
    const known = saved.filter((id) => defaultOrder.includes(id));
    const missing = defaultOrder.filter((id) => !known.includes(id));
    return [...known, ...missing];
  } catch {
    return defaultOrder;
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore persistence failures (e.g. private mode) */
  }
}

/** Return a copy of `order` with the positions of ids `a` and `b` exchanged. */
function swap(order, a, b) {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);
  if (ia < 0 || ib < 0) return order;
  const next = order.slice();
  [next[ia], next[ib]] = [next[ib], next[ia]];
  return next;
}

/** A section/card title prefixed with a grip handle that signals it's draggable. */
function dragTitle(text) {
  return (
    <span className="card-drag-title">
      <DragHandleIcon className="drag-handle" />
      {text}
    </span>
  );
}

/** A single headline number with a module glyph. Forwards DnD props to the card. */
function Kpi({ label, value, meta, icon: Icon, tone = "neutral", className = "", ...rest }) {
  const iconClass =
    tone === "neutral" ? "dash-icon" : `dash-icon dash-icon--${tone}`;
  return (
    <div className={`stat${className ? ` ${className}` : ""}`} {...rest}>
      <div className="row-between">
        <span className="card-drag-title">
          <DragHandleIcon className="drag-handle" />
          <span className="stat__label">{label}</span>
        </span>
        <div className={iconClass}>
          <Icon />
        </div>
      </div>
      <div className="stat__value">
        {typeof value === "string" && value.startsWith("+") ? (
          <>
            <span className="text-success">+</span>
            {value.slice(1)}
          </>
        ) : (
          value
        )}
      </div>
      {meta ? <div className="stat__meta">{meta}</div> : null}
    </div>
  );
}

/** Compact "no data" note for a section whose range yielded nothing. */
function emptyNote(text) {
  return (
    <div className="state">
      <p className="state__text">{text}</p>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const salesOrders = useSelector(selectSalesOrders);
  const quotations = useSelector(selectQuotations);
  const workOrders = useSelector(selectProductionOrders);
  const finishedGoods = useSelector(selectFinishedGoods);

  // Each selector is read unconditionally (Rules of Hooks) before combining.
  const soLoading = useSelector(selectSalesOrdersLoading);
  const quoteLoading = useSelector(selectQuotationsLoading);
  const woLoading = useSelector(selectProductionOrdersLoading);
  const fgLoading = useSelector(selectFinishedGoodsLoading);
  const loading = soLoading || quoteLoading || woLoading || fgLoading;

  const soError = useSelector(selectSalesOrdersError);
  const quoteError = useSelector(selectQuotationsError);
  const woError = useSelector(selectProductionOrdersError);
  const fgError = useSelector(selectFinishedGoodsError);
  const error = soError || quoteError || woError || fgError;

  const [visible, setVisible] = useState(loadVisible);
  const [kpiOrder, setKpiOrder] = useState(() =>
    loadOrder(KPI_ORDER_KEY, KPI_DEFAULT_ORDER),
  );
  const [gridOrder, setGridOrder] = useState(() =>
    loadOrder(GRID_ORDER_KEY, GRID_DEFAULT_ORDER),
  );
  const [drag, setDrag] = useState(null); // { zone, id } of the card being dragged
  const [overId, setOverId] = useState(null); // current drop target
  // Top-of-dashboard date range (button + dropdown picker). Drives every
  // data-backed section below; the static placeholders ignore it.
  const [range, setRange] = useState(defaultRange);

  const refreshAll = () => {
    dispatch(fetchSalesOrders());
    dispatch(fetchQuotations());
    dispatch(fetchProductionOrders());
    dispatch(fetchFinishedGoods());
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => persist(VISIBLE_KEY, visible), [visible]);
  useEffect(() => persist(KPI_ORDER_KEY, kpiOrder), [kpiOrder]);
  useEffect(() => persist(GRID_ORDER_KEY, gridOrder), [gridOrder]);

  // Derived, range-driven data for the live sections. Recomputed when the date
  // range changes or fresh records arrive.
  const salesTrend = useMemo(
    () => salesTrendData(range, salesOrders, quotations),
    [range, salesOrders, quotations],
  );
  const productionTrend = useMemo(
    () => productionTrendData(range, workOrders),
    [range, workOrders],
  );
  // Split each trend into one single-series chart per series, each projected a
  // few periods ahead (dashed line + high/low band; the overlay falls back off
  // when there isn't enough history — see withForecast). The two charts share a
  // card via tabs. Recomputed when the underlying trend changes.
  const salesCharts = useMemo(
    () => trendCharts(salesTrend, SALES_SERIES, "sales"),
    [salesTrend],
  );
  const productionCharts = useMemo(
    () => trendCharts(productionTrend, PRODUCTION_SERIES, "production"),
    [productionTrend],
  );
  const activeWOs = useMemo(
    () => activeWorkOrders(range, workOrders),
    [range, workOrders],
  );
  const products = useMemo(
    () => topProducts(range, salesOrders),
    [range, salesOrders],
  );
  const kpis = useMemo(
    () => headlineKpis(range, salesOrders, finishedGoods),
    [range, salesOrders, finishedGoods],
  );
  // Live values for the data-backed KPI cards (others stay static — see KPIS).
  const kpiValues = {
    customers: { value: formatNumber(kpis.customers), meta: "with orders in range" },
    products: { value: formatNumber(kpis.products), meta: "active finished goods" },
    orders: { value: formatNumber(kpis.orders), meta: "in selected range" },
  };

  const show = (id) => visible[id];
  const toggleWidget = (id) =>
    setVisible((current) => ({ ...current, [id]: !current[id] }));
  const resetWidgets = () => {
    setVisible(DEFAULT_VISIBLE);
    setKpiOrder(KPI_DEFAULT_ORDER);
    setGridOrder(GRID_DEFAULT_ORDER);
  };
  const anyVisible = WIDGETS.some((widget) => visible[widget.id]);

  // Visible sections in current order; the last spans full width when odd (so the
  // trailing row is never half-empty).
  const visibleGrid = gridOrder.filter(show);
  const gridVisible = visibleGrid.length > 0;
  const lastFullId =
    visibleGrid.length % 2 === 1 ? visibleGrid[visibleGrid.length - 1] : null;
  const fullClass = (id) => (id === lastFullId ? "dash-cell--full" : "");

  // Validation: a chart section must never land in the full-width (last, odd-count)
  // slot — a stretched-wide chart looks wrong. Dropping SWAPS the dragged + target
  // cards, so block whichever direction would push a chart into that slot.
  const isChartSection = (id) => id === "sales_trend" || id === "production_trend";
  const dropAllowed = (zone, targetId) => {
    if (zone !== "grid" || lastFullId == null || !drag) return true;
    if (targetId === lastFullId && isChartSection(drag.id)) return false; // dragged → full slot
    if (drag.id === lastFullId && isChartSection(targetId)) return false; // target → full slot
    return true;
  };

  // Native HTML5 drag-and-drop. A card is only droppable on cards in the same
  // zone ("kpi" or "grid"); dropping swaps the two cards' positions.
  const dragClass = (zone, id) => {
    const dragging = drag && drag.zone === zone && drag.id === id;
    const target =
      overId === id && drag && drag.zone === zone && drag.id !== id;
    return `dash-drag${dragging ? " is-dragging" : ""}${target ? " is-drop-target" : ""}`;
  };
  const dragHandlers = (zone, id, order, setOrder) => ({
    draggable: true,
    onDragStart: (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", id);
      setDrag({ zone, id });
    },
    onDragOver: (event) => {
      if (drag && drag.zone === zone && dropAllowed(zone, id)) {
        event.preventDefault(); // mark as a valid drop target
        event.dataTransfer.dropEffect = "move";
        if (overId !== id) setOverId(id);
      }
    },
    onDrop: (event) => {
      event.preventDefault();
      if (drag && drag.zone === zone && drag.id !== id && dropAllowed(zone, id)) {
        setOrder((prev) => swap(prev, drag.id, id));
      }
      setDrag(null);
      setOverId(null);
    },

    onDragEnd: () => {
      setDrag(null);
      setOverId(null);
    },
  });

  const exportProducts = () => {
    downloadCsv(
      "top-selling-products.csv",
      toCsv(TOP_PRODUCTS_COLUMNS, products),
    );
  };

  /** Render a titled grid section by id, wired for drag-and-drop. */
  const renderSection = (id) => {
    const dnd = {
      className: [fullClass(id), dragClass("grid", id)].filter(Boolean).join(" "),
      ...dragHandlers("grid", id, gridOrder, setGridOrder),
    };
    switch (id) {
      // The tab bar doubles as the header (grip in its leading slot), so the
      // titled header is dropped when there's data — and kept only as the
      // empty-state fallback, where there are no tabs to host the grip/identity.
      case "sales_trend":
        return (
          <Card
            key={id}
            title={salesTrend.hasData ? undefined : dragTitle("Sales trend")}
            {...dnd}
          >
            {salesTrend.hasData
              ? trendTabs(salesCharts, <DragHandleIcon className="drag-handle" />)
              : emptyNote("No sales activity in the selected range.")}
          </Card>
        );
      case "production_trend":
        return (
          <Card
            key={id}
            title={productionTrend.hasData ? undefined : dragTitle("Production trend")}
            {...dnd}
          >
            {productionTrend.hasData
              ? trendTabs(productionCharts, <DragHandleIcon className="drag-handle" />)
              : emptyNote("No production activity in the selected range.")}
          </Card>
        );
      case "active_work_orders":
        return (
          <Card key={id} title={dragTitle("Active work orders")} bodyFlush {...dnd}>
            {activeWOs.length ? (
              <div className="table-wrap">
                <table className="table table--fixed">
                  <thead>
                    <tr>
                      <th>Work order no.</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeWOs.map((wo) => {
                      const status = getWoStatusMeta(wo.status);
                      return (
                        <tr key={wo.woNo}>
                          <td className="cell-mono">{wo.woNo}</td>
                          <td className="cell-strong">{wo.product}</td>
                          <td>{formatNumber(wo.qty)}</td>
                          <td>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              emptyNote("No active work orders in the selected range.")
            )}
          </Card>
        );
      case "machine_status":
        return (
          <Card key={id} title={dragTitle("Machine status")} bodyFlush {...dnd}>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Machine</th>
                    <th>Status</th>
                    <th>Current job</th>
                    <th className="num">Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {MACHINES.map((mc) => (
                    <tr key={mc.name}>
                      <td className="cell-strong">{mc.name}</td>
                      <td>
                        <Badge tone={mc.tone}>{mc.status}</Badge>
                      </td>
                      <td className="cell-mono">{mc.job}</td>
                      <td className="num">{mc.utilization}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );
      case "top_products":
        return (
          <Card
            key={id}
            title={dragTitle("Top selling products")}
            actions={
              <Button variant="secondary" size="sm" onClick={exportProducts} disabled={!products.length}>
                <DownloadIcon /> Export
              </Button>
            }
            bodyFlush
            {...dnd}
          >
            {products.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th className="num">Units sold</th>
                      <th className="num">Revenue</th>
                      <th className="num">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.sku === "—" ? p.name : p.sku}>
                        <td className="cell-strong">{p.name}</td>
                        <td className="cell-mono">{p.sku}</td>
                        <td className="num">{formatNumber(p.units)}</td>
                        <td className="num">{formatNumber(p.revenue)}</td>
                        <td className="num">{p.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              emptyNote("No sales in the selected range.")
            )}
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        actions={
          <>
            <ManageWidgets
              widgets={WIDGETS}
              visible={visible}
              onToggle={toggleWidget}
              onReset={resetWidgets}
            />
            <DateRangePicker value={range} onChange={setRange} />
          </>
        }
      />

      {loading ? (
        <LoadingState label="Loading dashboard…" />
      ) : error ? (
        <ErrorState text={error} onRetry={refreshAll} />
      ) : (
        <div className="stack">
          {/* Key metrics — drag a card onto another to swap their positions */}
          {show("key_metrics") ? (
            <div className="stat-grid dash-metrics">
              {kpiOrder.map((kid) => {
                const k = KPI_BY_ID[kid];
                if (!k) return null;
                const dyn = kpiValues[kid] || {};
                return (
                  <Kpi
                    key={k.id}
                    label={k.label}
                    value={dyn.value ?? k.value}
                    meta={dyn.meta ?? k.meta}
                    icon={k.icon}
                    tone={k.tone}
                    className={dragClass("kpi", k.id)}
                    {...dragHandlers("kpi", k.id, kpiOrder, setKpiOrder)}
                  />
                );
              })}
            </div>
          ) : null}

          {/* Sections — drag a card onto another to swap; last spans full width when odd */}
          {gridVisible ? (
            <div className="dash-cols">{visibleGrid.map((id) => renderSection(id))}</div>
          ) : null}

          {!anyVisible ? (
            <div className="state">
              <div className="state__title">No widgets shown</div>
              <div className="state__text">
                Use “Manage widgets” to add cards back to your dashboard.
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}

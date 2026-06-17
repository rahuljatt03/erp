import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../shared/components/PageHeader";
import Button from "../../shared/components/Button";
import Card from "../../shared/components/Card";
import Badge from "../../shared/components/Badge";
import { LoadingState, EmptyState } from "../../shared/components/states";
import {
  AddIcon,
  InquiryIcon,
  QuotationIcon,
  OrderIcon,
  ProductionIcon,
  ProcurementIcon,
  WarningIcon,
  SuccessIcon,
} from "../../shared/components/icons";
import { formatDate, formatNumber, todayIso } from "../../shared/utils/format";
import {
  fetchInquiries,
  selectInquiries,
  selectInquiriesLoading,
} from "../inquiry/inquirySlice";
import {
  fetchQuotations,
  selectQuotations,
  selectQuotationsLoading,
} from "../quotation/quotationSlice";
import {
  fetchSalesOrders,
  selectSalesOrders,
  selectSalesOrdersLoading,
} from "../sales/salesSlice";
import {
  fetchProductionOrders,
  selectProductionOrders,
  selectProductionOrdersLoading,
} from "../production/productionSlice";
import {
  fetchPurchaseOrders,
  selectPurchaseOrders,
  selectPurchaseOrdersLoading,
} from "../procurement/procurementSlice";
import {
  fetchFinishedGoods,
  fetchRawMaterials,
  selectFinishedGoods,
  selectFinishedGoodsLoading,
  selectRawMaterials,
  selectRawMaterialsLoading,
} from "../inventory/inventorySlice";
import { getStatusMeta } from "../inquiry/inquiry.constants";
import { summariseProducts } from "../inquiry/inquiry.helpers";
import {
  inquiryMetrics,
  quotationMetrics,
  salesMetrics,
  productionMetrics,
  procurementMetrics,
  inventoryMetrics,
} from "./dashboard.metrics";

/** A single headline number with a module glyph. */
function Kpi({ label, value, meta, icon: Icon, tone = "neutral" }) {
  const iconClass =
    tone === "neutral" ? "dash-icon" : `dash-icon dash-icon--${tone}`;
  return (
    <div className="stat">
      <div className="row-between">
        <div className="stat__label">{label}</div>
        <div className={iconClass}>
          <Icon />
        </div>
      </div>
      <div className="stat__value">{value}</div>
      {meta ? <div className="stat__meta">{meta}</div> : null}
    </div>
  );
}

/** A row inside a flush card — clickable (navigates) when `to` is set. */
function DashRow({ to, tone = "neutral", icon: Icon, label, sub, value }) {
  const navigate = useNavigate();
  const iconClass =
    tone === "neutral" ? "dash-icon" : `dash-icon dash-icon--${tone}`;
  return (
    <div
      className={`dash-row${to ? " is-clickable" : ""}`}
      onClick={to ? () => navigate(to) : undefined}
      role={to ? "button" : undefined}
      tabIndex={to ? 0 : undefined}
      onKeyDown={
        to ? (event) => event.key === "Enter" && navigate(to) : undefined
      }
    >
      <div className="dash-row__main">
        {Icon ? (
          <div className={iconClass}>
            <Icon />
          </div>
        ) : null}
        <div className="dash-row__text">
          <div className="dash-row__label">{label}</div>
          {sub ? <div className="dash-row__sub">{sub}</div> : null}
        </div>
      </div>
      {value != null ? <div className="dash-row__value">{value}</div> : null}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inquiries = useSelector(selectInquiries);
  const quotes = useSelector(selectQuotations);
  const salesOrders = useSelector(selectSalesOrders);
  const workOrders = useSelector(selectProductionOrders);
  const purchaseOrders = useSelector(selectPurchaseOrders);
  const finishedGoods = useSelector(selectFinishedGoods);
  const rawMaterials = useSelector(selectRawMaterials);

  const inqLoading = useSelector(selectInquiriesLoading);
  const quoteLoading = useSelector(selectQuotationsLoading);
  const soLoading = useSelector(selectSalesOrdersLoading);
  const woLoading = useSelector(selectProductionOrdersLoading);
  const poLoading = useSelector(selectPurchaseOrdersLoading);
  const fgLoading = useSelector(selectFinishedGoodsLoading);
  const rawLoading = useSelector(selectRawMaterialsLoading);

  useEffect(() => {
    dispatch(fetchInquiries());
    dispatch(fetchQuotations());
    dispatch(fetchSalesOrders());
    dispatch(fetchProductionOrders());
    dispatch(fetchPurchaseOrders());
    dispatch(fetchFinishedGoods());
    dispatch(fetchRawMaterials());
  }, [dispatch]);

  const loading =
    inqLoading ||
    quoteLoading ||
    soLoading ||
    woLoading ||
    poLoading ||
    fgLoading ||
    rawLoading;

  const m = useMemo(() => {
    const today = todayIso();
    return {
      inq: inquiryMetrics(inquiries),
      quote: quotationMetrics(quotes, today),
      sales: salesMetrics(salesOrders),
      prod: productionMetrics(workOrders),
      proc: procurementMetrics(purchaseOrders),
      inv: inventoryMetrics(finishedGoods, rawMaterials),
    };
  }, [
    inquiries,
    quotes,
    salesOrders,
    workOrders,
    purchaseOrders,
    finishedGoods,
    rawMaterials,
  ]);

  const recent = inquiries.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Manufacturing ERP — operations across every module"
      />

      {loading ? (
        <LoadingState label="Loading overview…" />
      ) : (
        <div className="stack">
          {/* Headline KPIs spanning the sales → make/buy → stock pipeline */}
          <div className="stat-grid">
            <Kpi
              label="Open inquiries"
              value={m.inq.open}
              meta={`of ${m.inq.total} total`}
              icon={InquiryIcon}
              tone="info"
            />
            <Kpi
              label="quotations"
              value={m.quote.active}
              meta={`${formatNumber(m.quote.activeValue)} quoted value`}
              icon={QuotationIcon}
              tone="info"
            />
            <Kpi
              label="Active work orders"
              value={m.prod.active}
              meta={`${formatNumber(m.prod.outstandingUnits)} units to build`}
              icon={ProductionIcon}
              tone="warning"
            />
            <Kpi
              label="POs awaiting receipt"
              value={m.proc.awaiting}
              meta={`${formatNumber(m.proc.openValue)} on order`}
              icon={ProcurementIcon}
              tone="info"
            />
            <Kpi
              label="Stock alerts"
              value={m.inv.outOfStockCount}
              meta={
                m.inv.outOfStockCount === 0
                  ? "all items in stock"
                  : "items at zero on-hand"
              }
              icon={m.inv.outOfStockCount === 0 ? SuccessIcon : WarningIcon}
              tone={m.inv.outOfStockCount === 0 ? "success" : "danger"}
            />
          </div>

          {/* Sales pipeline funnel */}
          <Card
            title="Sales pipeline"
            actions={
              <Button to="/inquiries" variant="secondary" size="sm">
                Inquiries
              </Button>
            }
            bodyFlush
          >
            <div className="dash-list">
              <DashRow
                to="/inquiries"
                icon={InquiryIcon}
                tone="info"
                label="Inquiries"
                sub={`${m.inq.open} still open`}
                value={m.inq.total}
              />
              <DashRow
                to="/quotations"
                icon={QuotationIcon}
                tone="info"
                label="Quotations"
                sub={`${formatNumber(m.quote.activeValue)} active value`}
                value={m.quote.total}
              />
              <DashRow
                to="/sales-orders"
                icon={OrderIcon}
                tone="success"
                label="Sales orders"
                sub={`${formatNumber(m.sales.openValue)} open · ${m.sales.fulfilled} fulfilled`}
                value={m.sales.total}
              />
            </div>
          </Card>

          {/* Recent inquiries — the entry point of the whole flow */}
          <Card
            title="Recent inquiries"
            actions={
              <Button to="/inquiries" variant="secondary" size="sm">
                View all
              </Button>
            }
            bodyFlush
          >
            {recent.length === 0 ? (
              <EmptyState
                icon={InquiryIcon}
                title="No inquiries yet"
                text="Create your first inquiry to get started."
                action={
                  <Button variant="primary" to="/inquiries/new">
                    <AddIcon /> New Inquiry
                  </Button>
                }
              />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Inquiry No.</th>
                      <th>Customer</th>
                      <th>Products</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((inquiry) => {
                      const status = getStatusMeta(inquiry.status);
                      return (
                        <tr
                          key={inquiry.id}
                          className="is-clickable"
                          onClick={() => navigate(`/inquiries/${inquiry.id}`)}
                        >
                          <td className="cell-mono">{inquiry.inquiryNo}</td>
                          <td className="cell-strong">
                            {inquiry.customerName}
                          </td>
                          <td>{summariseProducts(inquiry)}</td>
                          <td>{formatDate(inquiry.inquiryDate)}</td>
                          <td>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}

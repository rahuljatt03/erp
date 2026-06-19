import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../shared/components/PageHeader";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import StatusSelect from "../../../shared/components/StatusSelect";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../../../shared/components/states";
import { AddIcon, ProductionIcon } from "../../../shared/components/icons";
import { formatDate, formatNumber } from "../../../shared/utils/format";
import {
  fetchProductionOrders,
  updateProductionOrder,
  selectProductionOrders,
  selectProductionOrdersError,
  selectProductionOrdersLoading,
} from "../productionSlice";
import { WO_STATUSES } from "../production.constants";
import { useToast } from "../../../shared/feedback/FeedbackProvider";
import { confirm, statusNeedsConfirm } from "../../../shared/feedback/confirm";

export default function ProductionOrderListPage() {
  const dispatch = useDispatch();
  const orders = useSelector(selectProductionOrders);
  const loading = useSelector(selectProductionOrdersLoading);
  const error = useSelector(selectProductionOrdersError);
  const navigate = useNavigate();
  const toast = useToast();
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    dispatch(fetchProductionOrders());
  }, [dispatch]);

  const refresh = () => dispatch(fetchProductionOrders());

  // Inline status change from the list. The API's PUT is a full replace, so send
  // the whole work order back with only the status swapped, then refresh.
  async function updateStatus(id, status) {
    const order = orders.find((wo) => wo.id === id);
    if (!order) return;
    const label = WO_STATUSES.find((s) => s.value === status)?.label ?? status;
    if (statusNeedsConfirm(status)) {
      const ok = await confirm({
        message:
          status === 'completed'
            ? `Mark ${order.woNo} as “${label}”? This consumes the materials and adds the finished goods to inventory.`
            : `Mark ${order.woNo} as “${label}”?`,
        header: 'Change status?',
        acceptLabel: 'Change',
      });
      if (!ok) return;
    }
    setSavingId(id);
    try {
      await dispatch(updateProductionOrder({ id, draft: { ...order, status } })).unwrap();
      await dispatch(fetchProductionOrders());
      toast.success('Status updated', `${order.woNo} → ${label}.`);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeader
        actions={
          <Button variant="primary" to="/production/new">
            <AddIcon /> New Work Order
          </Button>
        }
      />

      <Card bodyFlush>
        {loading ? (
          <LoadingState label="Loading work orders…" />
        ) : error ? (
          <ErrorState text={error} onRetry={refresh} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ProductionIcon}
            title="No work orders yet"
            text="Create one directly, or generate work orders from an inquiry's requirement analysis."
            action={
              <Button variant="primary" to="/production/new">
                <AddIcon /> New Work Order
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>WO No.</th>
                  <th>Product</th>
                  <th className="num">To build</th>
                  <th className="num">Produced</th>
                  <th>Due date</th>
                  <th>Source</th>
                  <th style={{ paddingLeft: 40 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((wo) => {
                  return (
                    <tr
                      key={wo.id}
                      className="is-clickable"
                      onClick={() => navigate(`/production/${wo.id}`)}
                    >
                      <td className="cell-mono">{wo.woNo}</td>
                      <td className="cell-strong">
                        {wo.productName}
                        {wo.productCode ? (
                          <span className="muted"> · {wo.productCode}</span>
                        ) : null}
                      </td>
                      <td className="num">
                        {formatNumber(wo.quantity)} {wo.unit}
                      </td>
                      <td className="num">{formatNumber(wo.producedQty)}</td>
                      <td>{wo.dueDate ? formatDate(wo.dueDate) : "—"}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {wo.sourceSalesOrderNo ? (
                          <Link
                            to={`/sales-orders/${wo.sourceSalesOrderId}`}
                            className="cell-mono"
                          >
                            {wo.sourceSalesOrderNo}
                          </Link>
                        ) : wo.sourceInquiryNo ? (
                          <Link
                            to={`/inquiries/${wo.sourceInquiryId}/requirements`}
                            className="cell-mono"
                          >
                            {wo.sourceInquiryNo}
                          </Link>
                        ) : (
                          <span className="muted">Direct</span>
                        )}
                      </td>
                      <td style={{ paddingLeft: 40 }} onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          value={wo.status}
                          options={WO_STATUSES}
                          disabled={savingId === wo.id}
                          onChange={(next) => updateStatus(wo.id, next)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>WO No.</th>
                  <th>Product</th>
                  <th className="!text-right">To build</th>
                  <th className="!text-right">Produced</th>
                  <th>Due date</th>
                  <th className="!pl-10">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((wo) => {
                  return (
                    <tr
                      key={wo.id}
                      className="cursor-pointer hover:bg-indigo-50"
                      onClick={() => navigate(`/production/${wo.id}`)}
                    >
                      <td className="!font-mono !text-[13px] !text-indigo-700">{wo.woNo}</td>
                      <td className="!font-semibold !text-slate-900">
                        {wo.productName}
                        {wo.productCode ? (
                          <span className="text-slate-500"> · {wo.productCode}</span>
                        ) : null}
                      </td>
                      <td className="!text-right tabular-nums">
                        {formatNumber(wo.quantity)} {wo.unit}
                      </td>
                      <td className="!text-right tabular-nums">{formatNumber(wo.producedQty)}</td>
                      <td>{wo.dueDate ? formatDate(wo.dueDate) : "—"}</td>
                      <td className="!pl-10" onClick={(e) => e.stopPropagation()}>
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

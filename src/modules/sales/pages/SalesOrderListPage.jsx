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
import { AddIcon, OrderIcon } from "../../../shared/components/icons";
import { formatDate, formatNumber } from "../../../shared/utils/format";
import {
  fetchSalesOrders,
  updateSalesOrder,
  selectSalesOrders,
  selectSalesOrdersError,
  selectSalesOrdersLoading,
} from "../salesSlice";
import { SO_STATUSES } from "../sales.constants";
import { soValue } from "../sales.helpers";
import { useToast } from "../../../shared/feedback/FeedbackProvider";
import { confirm, statusNeedsConfirm } from "../../../shared/feedback/confirm";

export default function SalesOrderListPage() {
  const dispatch = useDispatch();
  const orders = useSelector(selectSalesOrders);
  const loading = useSelector(selectSalesOrdersLoading);
  const error = useSelector(selectSalesOrdersError);
  const navigate = useNavigate();
  const toast = useToast();
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    dispatch(fetchSalesOrders());
  }, [dispatch]);

  const refresh = () => dispatch(fetchSalesOrders());

  // Inline status change from the list. The API's PUT is a full replace, so send
  // the whole order back with only the status swapped — preserving its line items,
  // customer, and dates — then refresh the list.
  async function updateStatus(id, status) {
    const order = orders.find((so) => so.id === id);
    if (!order) return;
    const label = SO_STATUSES.find((s) => s.value === status)?.label ?? status;
    // Entering production releases the order: the backend creates a work order per
    // line (once). Confirm it, since it spins up production records.
    const releasingToProduction = order.status !== 'in_production' && status === 'in_production';
    if (releasingToProduction) {
      const ok = await confirm({
        message: `Release ${order.soNo} to production? A work order will be created for each product line.`,
        header: 'Release to production?',
        icon: 'pi pi-cog',
        acceptLabel: 'Release',
      });
      if (!ok) return;
    } else if (statusNeedsConfirm(status)) {
      const ok = await confirm({
        message: `Mark ${order.soNo} as “${label}”?`,
        header: 'Change status?',
        acceptLabel: 'Change',
      });
      if (!ok) return;
    }
    setSavingId(id);
    try {
      await dispatch(updateSalesOrder({ id, draft: { ...order, status } })).unwrap();
      await dispatch(fetchSalesOrders());
      toast.success('Status updated', `${order.soNo} → ${label}.`);
      if (releasingToProduction) {
        toast.info('Released to production', `Work orders for ${order.soNo} are on the Production page.`);
      }
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
          <Button variant="primary" to="/sales-orders/new">
            <AddIcon /> New Sales Order
          </Button>
        }
      />

      <Card bodyFlush>
        {loading ? (
          <LoadingState label="Loading sales orders…" />
        ) : error ? (
          <ErrorState text={error} onRetry={refresh} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={OrderIcon}
            title="No sales orders yet"
            text="Convert an accepted inquiry into a confirmed order, or create one directly."
            action={
              <Button variant="primary" to="/sales-orders/new">
                <AddIcon /> New Sales Order
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>SO No.</th>
                  <th>Customer</th>
                  <th>Order date</th>
                  <th className="num">Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((so) => {
                  return (
                    <tr
                      key={so.id}
                      className="is-clickable"
                      onClick={() => navigate(`/sales-orders/${so.id}`)}
                    >
                      <td className="cell-mono">{so.soNo}</td>
                      <td className="cell-strong">{so.customerName}</td>
                      <td>{formatDate(so.orderDate)}</td>
                      <td className="num">{formatNumber(soValue(so))}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          value={so.status}
                          options={SO_STATUSES}
                          disabled={savingId === so.id}
                          onChange={(next) => updateStatus(so.id, next)}
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

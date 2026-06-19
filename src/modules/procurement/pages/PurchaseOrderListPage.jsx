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
import { AddIcon, ProcurementIcon } from "../../../shared/components/icons";
import { formatDate, formatNumber } from "../../../shared/utils/format";
import {
  fetchPurchaseOrders,
  updatePurchaseOrder,
  selectPurchaseOrders,
  selectPurchaseOrdersError,
  selectPurchaseOrdersLoading,
} from "../procurementSlice";
import { PO_STATUSES } from "../procurement.constants";
import { poValue } from "../procurement.helpers";
import { useToast } from "../../../shared/feedback/FeedbackProvider";
import { confirm, statusNeedsConfirm } from "../../../shared/feedback/confirm";

export default function PurchaseOrderListPage() {
  const dispatch = useDispatch();
  const orders = useSelector(selectPurchaseOrders);
  const loading = useSelector(selectPurchaseOrdersLoading);
  const error = useSelector(selectPurchaseOrdersError);
  const navigate = useNavigate();
  const toast = useToast();
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    dispatch(fetchPurchaseOrders());
  }, [dispatch]);

  const refresh = () => dispatch(fetchPurchaseOrders());

  // Inline status change from the list. The API's PUT is a full replace, so send
  // the whole order back with only the status swapped — preserving its line items
  // (and their received quantities), supplier, and dates — then refresh the list.
  async function updateStatus(id, status) {
    const order = orders.find((po) => po.id === id);
    if (!order) return;
    const label = PO_STATUSES.find((s) => s.value === status)?.label ?? status;
    if (statusNeedsConfirm(status)) {
      const ok = await confirm({
        message:
          status === 'received'
            ? `Mark ${order.poNo} as “${label}”? This fills every line to its ordered quantity and posts the balance to inventory.`
            : `Mark ${order.poNo} as “${label}”?`,
        header: 'Change status?',
        acceptLabel: 'Change',
      });
      if (!ok) return;
    }
    setSavingId(id);
    try {
      await dispatch(updatePurchaseOrder({ id, draft: { ...order, status } })).unwrap();
      await dispatch(fetchPurchaseOrders());
      toast.success('Status updated', `${order.poNo} → ${label}.`);
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
          <Button variant="primary" to="/purchase-orders/new">
            <AddIcon /> New Purchase Order
          </Button>
        }
      />

      <Card bodyFlush>
        {loading ? (
          <LoadingState label="Loading purchase orders…" />
        ) : error ? (
          <ErrorState text={error} onRetry={refresh} />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ProcurementIcon}
            title="No purchase orders yet"
            text="Create one directly, or generate it from an inquiry's requirement analysis."
            action={
              <Button variant="primary" to="/purchase-orders/new">
                <AddIcon /> New Purchase Order
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table table-fixed">
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>PO No.</th>
                  <th>Supplier</th>
                  <th>Order date</th>
                  <th className="num">Lines</th>
                  <th className="num">Value</th>
                  <th style={{ paddingLeft: 40 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => {
                  return (
                    <tr
                      key={po.id}
                      className="is-clickable"
                      onClick={() => navigate(`/purchase-orders/${po.id}`)}
                    >
                      <td className="cell-mono">{po.poNo}</td>
                      <td className="cell-strong">{po.supplierName}</td>
                      <td>{formatDate(po.orderDate)}</td>
                      <td className="num">{po.items.length}</td>
                      <td className="num">{formatNumber(poValue(po))}</td>
                      <td style={{ paddingLeft: 40 }} onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          value={po.status}
                          options={PO_STATUSES}
                          disabled={savingId === po.id}
                          onChange={(next) => updateStatus(po.id, next)}
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

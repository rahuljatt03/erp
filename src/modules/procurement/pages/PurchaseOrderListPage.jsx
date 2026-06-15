import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../../shared/components/states';
import { AddIcon, ProcurementIcon } from '../../../shared/components/icons';
import { formatDate, formatNumber } from '../../../shared/utils/format';
import { usePurchaseOrders } from '../useProcurement';
import { getPoStatusMeta } from '../procurement.constants';
import { poValue } from '../procurement.helpers';

export default function PurchaseOrderListPage() {
  const { orders, loading, error, refresh } = usePurchaseOrders();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        subtitle="Raw-material procurement. Receiving an order adds the quantity to inventory."
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
            <table className="table">
              <thead>
                <tr>
                  <th>PO No.</th>
                  <th>Supplier</th>
                  <th>Order date</th>
                  <th className="num">Lines</th>
                  <th className="num">Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => {
                  const status = getPoStatusMeta(po.status);
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
    </>
  );
}

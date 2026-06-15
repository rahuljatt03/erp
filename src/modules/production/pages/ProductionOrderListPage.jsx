import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../../shared/components/states';
import { formatDate, formatNumber } from '../../../shared/utils/format';
import { useProductionOrders } from '../useProduction';
import { getWoStatusMeta } from '../production.constants';

export default function ProductionOrderListPage() {
  const { orders, loading, error, refresh } = useProductionOrders();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Production"
        subtitle="Work orders. Completing one consumes raw materials and adds finished goods to inventory."
        actions={
          <Button variant="primary" to="/production/new">
            + New Work Order
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
            icon="🏭"
            title="No work orders yet"
            text="Create one directly, or generate work orders from an inquiry's requirement analysis."
            action={
              <Button variant="primary" to="/production/new">
                + New Work Order
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
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((wo) => {
                  const status = getWoStatusMeta(wo.status);
                  return (
                    <tr
                      key={wo.id}
                      className="is-clickable"
                      onClick={() => navigate(`/production/${wo.id}`)}
                    >
                      <td className="cell-mono">{wo.woNo}</td>
                      <td className="cell-strong">
                        {wo.productName}
                        {wo.productCode ? <span className="muted"> · {wo.productCode}</span> : null}
                      </td>
                      <td className="num">
                        {formatNumber(wo.quantity)} {wo.unit}
                      </td>
                      <td className="num">{formatNumber(wo.producedQty)}</td>
                      <td>{wo.dueDate ? formatDate(wo.dueDate) : '—'}</td>
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

import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import StatusSelect from '../../../shared/components/StatusSelect';
import { LoadingState, EmptyState, ErrorState } from '../../../shared/components/states';
import { AddIcon, OrderIcon } from '../../../shared/components/icons';
import { formatDate, formatNumber } from '../../../shared/utils/format';
import { useSalesOrders } from '../useSales';
import { SO_STATUSES } from '../sales.constants';
import { soValue } from '../sales.helpers';

export default function SalesOrderListPage() {
  const { orders, loading, error, refresh, updateStatus, savingId } = useSalesOrders();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Sales Orders"
        subtitle="Confirmed customer orders. Convert an inquiry, or create one directly."
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
                  <th>Source</th>
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
                      <td>{so.sourceInquiryNo ? <span className="cell-mono">{so.sourceInquiryNo}</span> : <span className="muted">Direct</span>}</td>
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

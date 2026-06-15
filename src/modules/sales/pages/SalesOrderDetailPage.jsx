import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { formatDate, formatDateTime, formatNumber } from '../../../shared/utils/format';
import { useSalesOrder } from '../useSales';
import { salesService } from '../sales.service';
import { getSoStatusMeta } from '../sales.constants';
import { soValue } from '../sales.helpers';

function Detail({ label, children }) {
  return (
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{children}</div>
    </div>
  );
}

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { order, loading, error, refresh } = useSalesOrder(id);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete ${order.soNo}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await salesService.remove(order.id);
      navigate('/sales-orders');
    } catch {
      setDeleting(false);
      window.alert('Failed to delete sales order.');
    }
  }

  if (loading) return <LoadingState label="Loading sales order…" />;
  if (error || !order)
    return (
      <>
        <PageHeader
          title="Sales order"
          actions={
            <Button to="/sales-orders" variant="secondary">
              ← Back to list
            </Button>
          }
        />
        <Card>
          <ErrorState text={error ?? 'Sales order not found'} onRetry={refresh} />
        </Card>
      </>
    );

  const status = getSoStatusMeta(order.status);

  return (
    <>
      <PageHeader
        title={
          <span className="row">
            <span className="cell-mono" style={{ fontSize: 20 }}>
              {order.soNo}
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        }
        subtitle={`${order.customerName} · created ${formatDateTime(order.createdAt)}`}
        actions={
          <>
            <Button to="/sales-orders" variant="ghost">
              ← Back
            </Button>
            {order.sourceInquiryId ? (
              <Button to={`/inquiries/${order.sourceInquiryId}/requirements`} variant="primary">
                📊 Requirement analysis
              </Button>
            ) : null}
            <Button to={`/sales-orders/${order.id}/edit`} variant="secondary">
              ✎ Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : '🗑 Delete'}
            </Button>
          </>
        }
      />

      <div className="stack">
        <Card title="Order details">
          <div className="detail-grid">
            <Detail label="Customer">{order.customerName}</Detail>
            <Detail label="Contact">{order.customerContact || '—'}</Detail>
            <Detail label="Order date">{formatDate(order.orderDate)}</Detail>
            <Detail label="Expected delivery">
              {order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '—'}
            </Detail>
            <Detail label="Order value">{formatNumber(soValue(order))}</Detail>
            <Detail label="Source inquiry">
              {order.sourceInquiryId ? (
                <Link to={`/inquiries/${order.sourceInquiryId}`}>{order.sourceInquiryNo || 'Inquiry'}</Link>
              ) : (
                <span className="muted">Direct order</span>
              )}
            </Detail>
          </div>
          {order.notes ? (
            <>
              <div className="divider" style={{ margin: '18px 0' }} />
              <div className="detail-item__label">Notes</div>
              <p style={{ marginTop: 4 }}>{order.notes}</p>
            </>
          ) : null}
        </Card>

        <Card title="Order lines" bodyFlush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th className="num">Qty</th>
                  <th>Delivery date</th>
                  <th className="num">Unit price</th>
                  <th className="num">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="cell-strong">{item.productName}</td>
                    <td>{item.productCode || '—'}</td>
                    <td className="num">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td>{item.deliveryDate ? formatDate(item.deliveryDate) : '—'}</td>
                    <td className="num">{formatNumber(item.unitPrice)}</td>
                    <td className="num cell-strong">
                      {formatNumber((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="num cell-strong">
                    Order total
                  </td>
                  <td className="num cell-strong">{formatNumber(soValue(order))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

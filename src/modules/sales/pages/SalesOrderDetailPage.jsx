import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { formatDate, formatDateTime, formatNumber } from '../../../shared/utils/format';
import {
  fetchSalesOrder,
  removeSalesOrder,
  selectSalesOrder,
  selectSalesOrderError,
  selectSalesOrderLoading,
} from '../salesSlice';
import { getSoStatusMeta } from '../sales.constants';
import { soValue } from '../sales.helpers';
import {
  BackIcon,
  AnalysisIcon,
  EditIcon,
  DeleteIcon,
} from '../../../shared/components/icons';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirmDelete } from '../../../shared/feedback/confirm';

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
  const dispatch = useDispatch();
  const order = useSelector(selectSalesOrder);
  const loading = useSelector(selectSalesOrderLoading);
  const error = useSelector(selectSalesOrderError);
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchSalesOrder(id));
  }, [dispatch, id]);

  const refresh = () => dispatch(fetchSalesOrder(id));

  async function handleDelete() {
    const ok = await confirmDelete(
      `Delete ${order.soNo}? This cannot be undone.`,
      'Delete sales order?',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await dispatch(removeSalesOrder(order.id)).unwrap();
      toast.success('Sales order deleted', `${order.soNo} was removed.`);
      navigate('/sales-orders');
    } catch (err) {
      setDeleting(false);
      toast.error('Delete failed', err instanceof Error ? err.message : 'Could not delete sales order.');
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
              <BackIcon /> Back to list
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
              <BackIcon /> Back
            </Button>
            {order.sourceInquiryId ? (
              <Button to={`/inquiries/${order.sourceInquiryId}/requirements`} variant="primary">
                <AnalysisIcon /> Requirement analysis
              </Button>
            ) : null}
            <Button to={`/sales-orders/${order.id}/edit`} variant="secondary">
              <EditIcon /> Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : (<><DeleteIcon /> Delete</>)}
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

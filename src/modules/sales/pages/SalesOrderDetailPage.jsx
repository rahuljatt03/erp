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
    <div>
      <div className="mb-[3px] text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">
        {label}
      </div>
      <div className="text-[15px] font-medium text-slate-900">{children}</div>
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

      <div className="flex flex-col gap-4">
        <Card title="Order details">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-6 gap-y-[18px]">
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
                <span className="text-slate-500">Direct order</span>
              )}
            </Detail>
          </div>
          {order.notes ? (
            <>
              <div className="my-[18px] h-px bg-slate-200" />
              <div className="mb-[3px] text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">Notes</div>
              <p className="mt-1">{order.notes}</p>
            </>
          ) : null}
        </Card>

        <Card title="Order lines" bodyFlush>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th className="!text-right">Qty</th>
                  <th>Delivery date</th>
                  <th className="!text-right">Unit price</th>
                  <th className="!text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="!font-semibold !text-slate-900">{item.productName}</td>
                    <td>{item.productCode || '—'}</td>
                    <td className="!text-right tabular-nums">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td>{item.deliveryDate ? formatDate(item.deliveryDate) : '—'}</td>
                    <td className="!text-right tabular-nums">{formatNumber(item.unitPrice)}</td>
                    <td className="!text-right tabular-nums !font-semibold !text-slate-900">
                      {formatNumber((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="!text-right tabular-nums !font-semibold !text-slate-900">
                    Order total
                  </td>
                  <td className="!text-right tabular-nums !font-semibold !text-slate-900">{formatNumber(soValue(order))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

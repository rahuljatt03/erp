import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Input from '../../../shared/components/Input';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { formatDate, formatDateTime, formatNumber } from '../../../shared/utils/format';
import {
  fetchProductionOrder,
  produceProductionOrder,
  removeProductionOrder,
  selectProductionOrder,
  selectProductionOrderError,
  selectProductionOrderLoading,
} from '../productionSlice';
import { getWoStatusMeta } from '../production.constants';
import { woProgress } from '../production.helpers';
import {
  BackIcon,
  EditIcon,
  DeleteIcon,
  ProductionIcon,
  SuccessIcon,
} from '../../../shared/components/icons';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirm, confirmDelete } from '../../../shared/feedback/confirm';

function Detail({ label, children }) {
  return (
    <div>
      <div className="mb-[3px] text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">{label}</div>
      <div className="text-[15px] font-medium text-slate-900">{children}</div>
    </div>
  );
}

export default function ProductionOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const order = useSelector(selectProductionOrder);
  const loading = useSelector(selectProductionOrderLoading);
  const error = useSelector(selectProductionOrderError);

  const toast = useToast();
  const [qty, setQty] = useState('0');
  const [producing, setProducing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchProductionOrder(id));
  }, [dispatch, id]);

  const refresh = () => dispatch(fetchProductionOrder(id));

  useEffect(() => {
    if (!order) return;
    setQty(String(woProgress(order).outstanding));
  }, [order]);

  async function handleProduce() {
    const amount = Number(qty) || 0;
    if (amount <= 0) return;
    const ok = await confirm({
      message: `Report production of ${formatNumber(amount)} ${order.unit}? This consumes the listed materials and adds finished goods to inventory.`,
      header: 'Report production?',
      icon: 'pi pi-cog',
      acceptLabel: 'Report',
    });
    if (!ok) return;
    setProducing(true);
    try {
      await dispatch(produceProductionOrder({ id: order.id, qty: amount })).unwrap();
      await dispatch(fetchProductionOrder(order.id));
      toast.success('Production reported', 'Materials consumed and finished goods added to inventory.');
    } catch (err) {
      toast.error('Could not report production', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setProducing(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmDelete(
      `Delete ${order.woNo}? This cannot be undone.`,
      'Delete work order?',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await dispatch(removeProductionOrder(order.id)).unwrap();
      toast.success('Work order deleted', `${order.woNo} was removed.`);
      navigate('/production');
    } catch (err) {
      setDeleting(false);
      toast.error('Delete failed', err instanceof Error ? err.message : 'Could not delete work order.');
    }
  }

  if (loading) return <LoadingState label="Loading work order…" />;
  if (error || !order)
    return (
      <>
        <PageHeader
          actions={
            <Button to="/production" variant="secondary">
              <BackIcon /> Back to list
            </Button>
          }
        />
        <Card>
          <ErrorState text={error ?? 'Work order not found'} onRetry={refresh} />
        </Card>
      </>
    );

  const status = getWoStatusMeta(order.status);
  const progress = woProgress(order);
  const canProduce = order.status !== 'completed' && order.status !== 'cancelled' && progress.outstanding > 0;

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button to="/production" variant="ghost">
              <BackIcon /> Back
            </Button>
            <Button to={`/production/${order.id}/edit`} variant="secondary">
              <EditIcon /> Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : (<><DeleteIcon /> Delete</>)}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <Card title="Work order details">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-6 gap-y-[18px]">
            <Detail label="Product">
              {order.productName}
              {order.productCode ? <span className="text-slate-500"> · {order.productCode}</span> : null}
            </Detail>
            <Detail label="To build">
              {formatNumber(order.quantity)} {order.unit}
            </Detail>
            <Detail label="Produced">
              {formatNumber(order.producedQty)} ({progress.pct}%)
            </Detail>
            <Detail label="Outstanding">
              {formatNumber(progress.outstanding)} {order.unit}
            </Detail>
            <Detail label="Due date">{order.dueDate ? formatDate(order.dueDate) : '—'}</Detail>
            {order.sourceSalesOrderId ? (
              <Detail label="Source">
                <Link to={`/sales-orders/${order.sourceSalesOrderId}`}>
                  {order.sourceSalesOrderNo || 'Sales order'}
                </Link>
              </Detail>
            ) : order.sourceInquiryId ? (
              <Detail label="Source">
                <Link to={`/inquiries/${order.sourceInquiryId}/requirements`}>
                  {order.sourceInquiryNo || 'Requirement analysis'}
                </Link>
              </Detail>
            ) : null}
          </div>
          {order.notes ? (
            <>
              <div className="my-[18px] h-px bg-slate-200" />
              <div className="mb-[3px] text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">Notes</div>
              <p className="mt-1">{order.notes}</p>
            </>
          ) : null}
        </Card>

        <Card title="Materials consumed" bodyFlush>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="!text-right">Required (full run)</th>
                  <th className="!text-right">Consumed so far</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {order.materials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-slate-500">
                      No materials listed for this work order.
                    </td>
                  </tr>
                ) : (
                  order.materials.map((material) => (
                    <tr key={material.id}>
                      <td className="!font-semibold !text-slate-900">
                        {material.materialName}
                        {material.materialCode ? <span className="text-slate-500"> · {material.materialCode}</span> : null}
                      </td>
                      <td className="!text-right tabular-nums">{formatNumber(material.quantity)}</td>
                      <td className="!text-right tabular-nums">{formatNumber(material.consumedQty)}</td>
                      <td>{material.unit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {canProduce ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] text-slate-500">Report production of</span>
                <Input
                  className="w-[120px] text-right"
                  type="number"
                  min="0"
                  step="any"
                  value={qty}
                  onChange={(event) => setQty(event.target.value)}
                />
                <span className="text-[13px] text-slate-500">{order.unit}</span>
              </div>
              <Button variant="primary" onClick={handleProduce} disabled={producing}>
                {producing ? 'Producing…' : (<><ProductionIcon /> Report production</>)}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 border-t border-slate-200 px-5 py-3.5">
              <span className="text-green-600">
                {order.status === 'cancelled' ? 'Work order cancelled.' : (<><SuccessIcon size={16} /> Fully produced — finished goods are in inventory.</>)}
              </span>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

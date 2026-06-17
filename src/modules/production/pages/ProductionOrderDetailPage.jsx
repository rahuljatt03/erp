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
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{children}</div>
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
          title="Work order"
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
        title={
          <span className="row">
            <span className="cell-mono" style={{ fontSize: 20 }}>
              {order.woNo}
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        }
        subtitle={`${order.productName} · created ${formatDateTime(order.createdAt)}`}
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

      <div className="stack">
        <Card title="Work order details">
          <div className="detail-grid">
            <Detail label="Product">
              {order.productName}
              {order.productCode ? <span className="muted"> · {order.productCode}</span> : null}
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
              <div className="divider" style={{ margin: '18px 0' }} />
              <div className="detail-item__label">Notes</div>
              <p style={{ marginTop: 4 }}>{order.notes}</p>
            </>
          ) : null}
        </Card>

        <Card title="Materials consumed" bodyFlush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="num">Required (full run)</th>
                  <th className="num">Consumed so far</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                {order.materials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No materials listed for this work order.
                    </td>
                  </tr>
                ) : (
                  order.materials.map((material) => (
                    <tr key={material.id}>
                      <td className="cell-strong">
                        {material.materialName}
                        {material.materialCode ? <span className="muted"> · {material.materialCode}</span> : null}
                      </td>
                      <td className="num">{formatNumber(material.quantity)}</td>
                      <td className="num">{formatNumber(material.consumedQty)}</td>
                      <td>{material.unit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {canProduce ? (
            <div
              className="row-between"
              style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}
            >
              <div className="row" style={{ gap: 10 }}>
                <span className="text-sm muted">Report production of</span>
                <input
                  className="input"
                  style={{ width: 120, textAlign: 'right' }}
                  type="number"
                  min="0"
                  max={progress.outstanding}
                  step="any"
                  value={qty}
                  onChange={(event) => setQty(event.target.value)}
                />
                <span className="text-sm muted">
                  {order.unit} (max {formatNumber(progress.outstanding)})
                </span>
              </div>
              <Button variant="primary" onClick={handleProduce} disabled={producing}>
                {producing ? 'Producing…' : (<><ProductionIcon /> Report production</>)}
              </Button>
            </div>
          ) : (
            <div className="row" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <span className="text-success">
                {order.status === 'cancelled' ? 'Work order cancelled.' : (<><SuccessIcon size={16} /> Fully produced — finished goods are in inventory.</>)}
              </span>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

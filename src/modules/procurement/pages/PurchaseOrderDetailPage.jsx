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
  fetchPurchaseOrder,
  receivePurchaseOrder,
  removePurchaseOrder,
  selectPurchaseOrder,
  selectPurchaseOrderError,
  selectPurchaseOrderLoading,
} from '../procurementSlice';
import { getPoStatusMeta } from '../procurement.constants';
import { poValue, poItemOutstanding, poReceiptProgress } from '../procurement.helpers';
import {
  BackIcon,
  EditIcon,
  DeleteIcon,
  ReceiveIcon,
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

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const order = useSelector(selectPurchaseOrder);
  const loading = useSelector(selectPurchaseOrderLoading);
  const error = useSelector(selectPurchaseOrderError);

  const toast = useToast();
  const [receipts, setReceipts] = useState({});
  const [receiving, setReceiving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrder(id));
  }, [dispatch, id]);

  const refresh = () => dispatch(fetchPurchaseOrder(id));

  // Default each line's "receive now" box to its outstanding quantity.
  useEffect(() => {
    if (!order) return;
    const next = {};
    order.items.forEach((item) => {
      next[item.id] = String(poItemOutstanding(item));
    });
    setReceipts(next);
  }, [order]);

  async function handleReceive() {
    const payload = Object.entries(receipts)
      // Object keys are strings; item ids are numbers — coerce so the match in
      // receivePurchaseOrder (it.id === receipt.itemId) succeeds.
      .map(([itemId, qty]) => ({ itemId: Number(itemId), qty: Number(qty) || 0 }))
      .filter((r) => r.qty > 0);
    if (payload.length === 0) {
      toast.warn('Nothing to receive', 'Enter a quantity on at least one line.');
      return;
    }
    const totalQty = payload.reduce((sum, r) => sum + r.qty, 0);
    const ok = await confirm({
      message: `Receive ${formatNumber(totalQty)} unit(s) across ${payload.length} line(s)? This adds the quantities to raw-material inventory.`,
      header: 'Confirm receipt?',
      icon: 'pi pi-box',
      acceptLabel: 'Receive',
    });
    if (!ok) return;
    setReceiving(true);
    try {
      await dispatch(receivePurchaseOrder({ id: order.id, receipts: payload })).unwrap();
      await dispatch(fetchPurchaseOrder(order.id));
      toast.success('Stock received', 'Quantities added to raw-material inventory.');
    } catch (err) {
      toast.error('Receipt failed', err instanceof Error ? err.message : 'Could not record the receipt.');
    } finally {
      setReceiving(false);
    }
  }

  async function handleDelete() {
    const ok = await confirmDelete(
      `Delete ${order.poNo}? This cannot be undone.`,
      'Delete purchase order?',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await dispatch(removePurchaseOrder(order.id)).unwrap();
      toast.success('Purchase order deleted', `${order.poNo} was removed.`);
      navigate('/purchase-orders');
    } catch (err) {
      setDeleting(false);
      toast.error('Delete failed', err instanceof Error ? err.message : 'Could not delete purchase order.');
    }
  }

  if (loading) return <LoadingState label="Loading purchase order…" />;
  if (error || !order)
    return (
      <>
        <PageHeader
          actions={
            <Button to="/purchase-orders" variant="secondary">
              <BackIcon /> Back to list
            </Button>
          }
        />
        <Card>
          <ErrorState text={error ?? 'Purchase order not found'} onRetry={refresh} />
        </Card>
      </>
    );

  const status = getPoStatusMeta(order.status);
  const progress = poReceiptProgress(order);
  const canReceive = order.status !== 'received' && order.status !== 'cancelled';

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button to="/purchase-orders" variant="ghost">
              <BackIcon /> Back
            </Button>
            <Button to={`/purchase-orders/${order.id}/edit`} variant="secondary">
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
            <Detail label="Supplier">{order.supplierName}</Detail>
            <Detail label="Contact">{order.supplierContact || '—'}</Detail>
            <Detail label="Order date">{formatDate(order.orderDate)}</Detail>
            <Detail label="Expected">{order.expectedDate ? formatDate(order.expectedDate) : '—'}</Detail>
            <Detail label="Total value">{formatNumber(poValue(order))}</Detail>
            <Detail label="Receipt progress">
              {progress.received} / {progress.ordered} ({progress.pct}%)
            </Detail>
            {order.sourceInquiryId ? (
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

        <Card title="Lines & receiving" bodyFlush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="num">Ordered</th>
                  <th className="num">Received</th>
                  <th className="num">Outstanding</th>
                  <th className="num">Unit price</th>
                  <th className="num">Line total</th>
                  {canReceive ? <th className="num">Receive now</th> : null}
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const outstanding = poItemOutstanding(item);
                  return (
                    <tr key={item.id}>
                      <td className="cell-strong">
                        {item.materialName}
                        {item.materialCode ? <span className="muted"> · {item.materialCode}</span> : null}
                      </td>
                      <td className="num">
                        {formatNumber(item.quantity)} {item.unit}
                      </td>
                      <td className="num">{formatNumber(item.receivedQty)}</td>
                      <td className="num fw-700" style={{ color: outstanding ? 'var(--warning)' : 'var(--success)' }}>
                        {formatNumber(outstanding)}
                      </td>
                      <td className="num">{formatNumber(item.unitPrice)}</td>
                      <td className="num">
                        {formatNumber((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                      </td>
                      {canReceive ? (
                        <td className="num">
                          <input
                            className="input"
                            style={{ width: 100, textAlign: 'right' }}
                            type="number"
                            min="0"
                            max={outstanding}
                            step="any"
                            value={receipts[item.id] ?? '0'}
                            disabled={outstanding === 0}
                            onChange={(event) =>
                              setReceipts((prev) => ({ ...prev, [item.id]: event.target.value }))
                            }
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {canReceive ? (
            <div className="row-between" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <span className="muted text-sm">
                Confirming a receipt adds these quantities to raw-material inventory.
              </span>
              <Button variant="primary" onClick={handleReceive} disabled={receiving}>
                {receiving ? 'Receiving…' : (<><ReceiveIcon /> Confirm receipt</>)}
              </Button>
            </div>
          ) : (
            <div className="row" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <span className="text-success"><SuccessIcon size={16} /> Fully received — all quantities are in inventory.</span>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

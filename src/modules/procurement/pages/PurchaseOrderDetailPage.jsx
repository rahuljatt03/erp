import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { formatDate, formatDateTime, formatNumber } from '../../../shared/utils/format';
import { usePurchaseOrder } from '../useProcurement';
import { procurementService } from '../procurement.service';
import { getPoStatusMeta } from '../procurement.constants';
import { poValue, poItemOutstanding, poReceiptProgress } from '../procurement.helpers';

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
  const { order, loading, error, refresh } = usePurchaseOrder(id);

  const [receipts, setReceipts] = useState({});
  const [receiving, setReceiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [flash, setFlash] = useState(null);

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
      .map(([itemId, qty]) => ({ itemId, qty: Number(qty) || 0 }))
      .filter((r) => r.qty > 0);
    if (payload.length === 0) return;
    setReceiving(true);
    setFlash(null);
    try {
      await procurementService.receive(order.id, payload);
      await refresh();
      setFlash('Stock received and added to inventory.');
    } finally {
      setReceiving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${order.poNo}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await procurementService.remove(order.id);
      navigate('/purchase-orders');
    } catch {
      setDeleting(false);
      window.alert('Failed to delete purchase order.');
    }
  }

  if (loading) return <LoadingState label="Loading purchase order…" />;
  if (error || !order)
    return (
      <>
        <PageHeader
          title="Purchase order"
          actions={
            <Button to="/purchase-orders" variant="secondary">
              ← Back to list
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
        title={
          <span className="row">
            <span className="cell-mono" style={{ fontSize: 20 }}>
              {order.poNo}
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        }
        subtitle={`${order.supplierName} · created ${formatDateTime(order.createdAt)}`}
        actions={
          <>
            <Button to="/purchase-orders" variant="ghost">
              ← Back
            </Button>
            <Button to={`/purchase-orders/${order.id}/edit`} variant="secondary">
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

        {flash ? <div className="banner">✅ {flash}</div> : null}

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
                {receiving ? 'Receiving…' : '📥 Confirm receipt'}
              </Button>
            </div>
          ) : (
            <div className="row" style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
              <span className="text-success">✓ Fully received — all quantities are in inventory.</span>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

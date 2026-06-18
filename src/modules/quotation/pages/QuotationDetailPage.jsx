import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { formatDate, formatDateTime, formatNumber, todayIso } from '../../../shared/utils/format';
import {
  fetchQuotation,
  removeQuotation,
  setQuotationStatus,
  selectQuotation,
  selectQuotationError,
  selectQuotationLoading,
} from '../quotationSlice';
import { getQuoteStatusMeta } from '../quotation.constants';
import { quoteValue, isQuoteExpired } from '../quotation.helpers';
import {
  BackIcon,
  OrderIcon,
  EditIcon,
  DeleteIcon,
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

export default function QuotationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const quote = useSelector(selectQuotation);
  const loading = useSelector(selectQuotationLoading);
  const error = useSelector(selectQuotationError);
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    dispatch(fetchQuotation(id));
  }, [dispatch, id]);

  const refresh = () => dispatch(fetchQuotation(id));

  async function handleDelete() {
    const ok = await confirmDelete(
      `Delete ${quote.quoteNo}? This cannot be undone.`,
      'Delete quotation?',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await dispatch(removeQuotation(quote.id)).unwrap();
      toast.success('Quotation deleted', `${quote.quoteNo} was removed.`);
      navigate('/quotations');
    } catch (err) {
      setDeleting(false);
      toast.error('Delete failed', err instanceof Error ? err.message : 'Could not delete quotation.');
    }
  }

  async function handleConvert() {
    const ok = await confirm({
      message: `Convert ${quote.quoteNo} to a sales order? The quotation will be marked converted.`,
      header: 'Convert to order?',
      icon: 'pi pi-arrow-right',
      acceptLabel: 'Convert',
    });
    if (!ok) return;
    setConverting(true);
    // Mark the quotation as converted before handing off; the sales order's own
    // create step takes care of marking the source inquiry "converted".
    try {
      await dispatch(setQuotationStatus({ id: quote.id, status: 'converted' })).unwrap();
    } catch {
      // Non-fatal — proceed to the order form regardless.
    }
    toast.info('Sales order drafted', `From ${quote.quoteNo}. Review and save to confirm.`);
    navigate('/sales-orders/new', {
      state: {
        prefill: {
          sourceInquiryId: quote.sourceInquiryId ?? null,
          sourceInquiryNo: quote.sourceInquiryNo || '',
          customerName: quote.customerName,
          customerContact: quote.customerContact || '',
          items: quote.items.map((item) => ({
            productName: item.productName,
            productCode: item.productCode || '',
            quantity: item.quantity,
            unit: item.unit,
            deliveryDate: item.deliveryDate || '',
            unitPrice: item.unitPrice,
          })),
        },
      },
    });
  }

  if (loading) return <LoadingState label="Loading quotation…" />;
  if (error || !quote)
    return (
      <>
        <PageHeader
          title="Quotation"
          actions={
            <Button to="/quotations" variant="secondary">
              <BackIcon /> Back to list
            </Button>
          }
        />
        <Card>
          <ErrorState text={error ?? 'Quotation not found'} onRetry={refresh} />
        </Card>
      </>
    );

  const today = todayIso();
  const expired = isQuoteExpired(quote, today);
  const status = expired ? getQuoteStatusMeta('expired') : getQuoteStatusMeta(quote.status);
  const canConvert = quote.status !== 'converted';

  return (
    <>
      <PageHeader
        title={
          <span className="row">
            <span className="cell-mono" style={{ fontSize: 20 }}>
              {quote.quoteNo}
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        }
        subtitle={`${quote.customerName} · created ${formatDateTime(quote.createdAt)}`}
        actions={
          <>
            <Button to="/quotations" variant="ghost">
              <BackIcon /> Back
            </Button>
            {canConvert ? (
              <Button variant="primary" onClick={handleConvert} disabled={converting}>
                {converting ? 'Converting…' : (<><OrderIcon /> Convert to order</>)}
              </Button>
            ) : null}
            <Button to={`/quotations/${quote.id}/edit`} variant="secondary">
              <EditIcon /> Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : (<><DeleteIcon /> Delete</>)}
            </Button>
          </>
        }
      />

      <div className="stack">
        <Card title="Quotation details">
          <div className="detail-grid">
            <Detail label="Customer">{quote.customerName}</Detail>
            <Detail label="Contact">{quote.customerContact || '—'}</Detail>
            <Detail label="Quote date">{formatDate(quote.quoteDate)}</Detail>
            <Detail label="Valid until">
              {quote.validUntil ? formatDate(quote.validUntil) : '—'}
            </Detail>
            <Detail label="Quotation value">{formatNumber(quoteValue(quote))}</Detail>
          </div>
          {quote.notes ? (
            <>
              <div className="divider" style={{ margin: '18px 0' }} />
              <div className="detail-item__label">Notes</div>
              <p style={{ marginTop: 4 }}>{quote.notes}</p>
            </>
          ) : null}
        </Card>

        <Card title="Quotation lines" bodyFlush>
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
                {quote.items.map((item) => (
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
                    Quotation total
                  </td>
                  <td className="num cell-strong">{formatNumber(quoteValue(quote))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

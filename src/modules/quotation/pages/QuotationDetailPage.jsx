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
    <div>
      <div className="mb-[3px] text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">
        {label}
      </div>
      <div className="text-[15px] font-medium text-slate-900">{children}</div>
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

      <div className="flex flex-col gap-4">
        <Card title="Quotation details">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-6 gap-y-[18px]">
            <Detail label="Customer">{quote.customerName}</Detail>
            <Detail label="Contact">{quote.customerContact || '—'}</Detail>
            <Detail label="Quote date">{formatDate(quote.quoteDate)}</Detail>
            <Detail label="Quotation value">{formatNumber(quoteValue(quote))}</Detail>
          </div>
          {quote.notes ? (
            <>
              <div className="my-[18px] h-px bg-slate-200" />
              <div className="mb-[3px] text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">Notes</div>
              <p className="mt-1">{quote.notes}</p>
            </>
          ) : null}
        </Card>

        <Card title="Quotation lines" bodyFlush>
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
                {quote.items.map((item) => (
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
                    Quotation total
                  </td>
                  <td className="!text-right tabular-nums !font-semibold !text-slate-900">{formatNumber(quoteValue(quote))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

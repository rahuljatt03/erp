import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { formatDate, formatDateTime, formatNumber } from '../../../shared/utils/format';
import {
  fetchInquiry,
  removeInquiry,
  selectInquiry,
  selectInquiryError,
  selectInquiryLoading,
} from '../inquirySlice';
import { getStatusMeta } from '../inquiry.constants';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirmDelete } from '../../../shared/feedback/confirm';
import {
  BackIcon,
  AnalysisIcon,
  QuotationIcon,
  OrderIcon,
  EditIcon,
  DeleteIcon,
} from '../../../shared/components/icons';

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

export default function InquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inquiry = useSelector(selectInquiry);
  const loading = useSelector(selectInquiryLoading);
  const error = useSelector(selectInquiryError);
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchInquiry(id));
  }, [dispatch, id]);

  const refresh = () => dispatch(fetchInquiry(id));

  async function handleDelete() {
    const ok = await confirmDelete(
      `Delete inquiry ${inquiry.inquiryNo}? This cannot be undone.`,
      'Delete inquiry?',
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await dispatch(removeInquiry(inquiry.id)).unwrap();
      toast.success('Inquiry deleted', `${inquiry.inquiryNo} was removed.`);
      navigate('/inquiries');
    } catch (err) {
      setDeleting(false);
      toast.error('Delete failed', err instanceof Error ? err.message : 'Could not delete inquiry.');
    }
  }

  function handleConvert() {
    toast.info('Sales order drafted', 'Review the prefilled lines and save to confirm.');
    navigate('/sales-orders/new', {
      state: {
        prefill: {
          sourceInquiryId: inquiry.id,
          sourceInquiryNo: inquiry.inquiryNo,
          customerName: inquiry.customerName,
          customerContact: inquiry.customerContact || '',
          items: inquiry.items.map((item) => ({
            productName: item.productName,
            productCode: item.productCode || '',
            quantity: item.quantity,
            unit: item.unit,
            deliveryDate: item.targetDeliveryDate || '',
            unitPrice: 0,
          })),
        },
      },
    });
  }

  function handleQuote() {
    toast.info('Quotation drafted', 'Review the prefilled lines and save to confirm.');
    navigate('/quotations/new', {
      state: {
        prefill: {
          sourceInquiryId: inquiry.id,
          sourceInquiryNo: inquiry.inquiryNo,
          customerName: inquiry.customerName,
          customerContact: inquiry.customerContact || '',
          items: inquiry.items.map((item) => ({
            productName: item.productName,
            productCode: item.productCode || '',
            quantity: item.quantity,
            unit: item.unit,
            deliveryDate: item.targetDeliveryDate || '',
            unitPrice: 0,
          })),
        },
      },
    });
  }

  if (loading) {
    return <LoadingState label="Loading inquiry…" />;
  }

  if (error || !inquiry) {
    return (
      <>
        <PageHeader
          actions={
            <Button to="/inquiries" variant="secondary">
              <BackIcon /> Back to list
            </Button>
          }
        />
        <Card>
          <ErrorState text={error ?? 'Inquiry not found'} onRetry={refresh} />
        </Card>
      </>
    );
  }

  const status = getStatusMeta(inquiry.status);

  return (
    <>
      <PageHeader
        actions={
          <>
            <Button to="/inquiries" variant="ghost">
              <BackIcon /> Back
            </Button>
            <Button to={`/inquiries/${inquiry.id}/requirements`} variant="primary">
              <AnalysisIcon /> Requirement analysis
            </Button>
            <Button variant="secondary" onClick={handleQuote}>
              <QuotationIcon /> Create quotation
            </Button>
            <Button variant="secondary" onClick={handleConvert}>
              <OrderIcon /> Convert to order
            </Button>
            <Button to={`/inquiries/${inquiry.id}/edit`} variant="secondary">
              <EditIcon /> Edit
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : (<><DeleteIcon /> Delete</>)}
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <Card title="Customer & inquiry details">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-6 gap-y-[18px]">
            <Detail label="Customer">{inquiry.customerName}</Detail>
            <Detail label="Contact">{inquiry.customerContact || '—'}</Detail>
            <Detail label="Inquiry date">{formatDate(inquiry.inquiryDate)}</Detail>
            <Detail label="Last updated">{formatDateTime(inquiry.updatedAt)}</Detail>
          </div>
          {inquiry.notes ? (
            <>
              <div className="my-[18px] h-px bg-slate-200" />
              <div className="mb-[3px] text-xs font-semibold uppercase tracking-[0.4px] text-slate-500">
                Notes
              </div>
              <p className="mt-1">{inquiry.notes}</p>
            </>
          ) : null}
        </Card>

        <Card title={`Products & raw materials (${inquiry.items.length})`} bodyFlush>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th>Quantity</th>
                  <th>Delivery date</th>
                  <th>Raw materials needed</th>
                </tr>
              </thead>
              <tbody>
                {inquiry.items.map((item) => (
                  <tr key={item.id}>
                    <td className="!font-semibold !text-slate-900">
                      {item.productName}
                      {item.remarks ? (
                        <div className="mt-0.5 text-[13px] text-slate-500">{item.remarks}</div>
                      ) : null}
                    </td>
                    <td className="!font-mono !text-[13px] !text-indigo-700">{item.productCode || '—'}</td>
                    <td>
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td>{formatDate(item.targetDeliveryDate)}</td>
                    <td>
                      {item.rawMaterials.length === 0 ? (
                        <span className="text-slate-500">None specified</span>
                      ) : (
                        item.rawMaterials.map((material) => (
                          <span
                            className="mb-1.5 mr-1.5 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[13px] text-indigo-700"
                            key={material.id}
                          >
                            <strong>{material.materialName}</strong>
                            {formatNumber(material.quantity)} {material.unit}
                          </span>
                        ))
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

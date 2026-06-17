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
    <div className="detail-item">
      <div className="detail-item__label">{label}</div>
      <div className="detail-item__value">{children}</div>
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
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchInquiry(id));
  }, [dispatch, id]);

  const refresh = () => dispatch(fetchInquiry(id));

  async function handleDelete() {
    if (!window.confirm(`Delete inquiry ${inquiry.inquiryNo}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await dispatch(removeInquiry(inquiry.id)).unwrap();
      navigate('/inquiries');
    } catch {
      setDeleting(false);
      window.alert('Failed to delete inquiry.');
    }
  }

  function handleConvert() {
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
          title="Inquiry"
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
        title={
          <span className="row">
            <span className="cell-mono" style={{ fontSize: 20 }}>
              {inquiry.inquiryNo}
            </span>
            <Badge tone={status.tone}>{status.label}</Badge>
          </span>
        }
        subtitle={`Created by ${inquiry.createdBy} · ${formatDateTime(inquiry.createdAt)}`}
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

      <div className="stack">
        <Card title="Customer & inquiry details">
          <div className="detail-grid">
            <Detail label="Customer">{inquiry.customerName}</Detail>
            <Detail label="Contact">{inquiry.customerContact || '—'}</Detail>
            <Detail label="Inquiry date">{formatDate(inquiry.inquiryDate)}</Detail>
            <Detail label="Status">
              <Badge tone={status.tone}>{status.label}</Badge>
            </Detail>
            <Detail label="Last updated">{formatDateTime(inquiry.updatedAt)}</Detail>
          </div>
          {inquiry.notes ? (
            <>
              <div className="divider" style={{ margin: '18px 0' }} />
              <div className="detail-item__label">Notes</div>
              <p style={{ marginTop: 4 }}>{inquiry.notes}</p>
            </>
          ) : null}
        </Card>

        <Card
          title={`Products & raw materials (${inquiry.items.length})`}
          bodyFlush
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Code</th>
                  <th className="num">Quantity</th>
                  <th>Delivery date</th>
                  <th>Raw materials needed</th>
                </tr>
              </thead>
              <tbody>
                {inquiry.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="num">{index + 1}</td>
                    <td className="cell-strong">
                      {item.productName}
                      {item.remarks ? (
                        <div className="muted text-sm" style={{ marginTop: 2 }}>
                          {item.remarks}
                        </div>
                      ) : null}
                    </td>
                    <td>{item.productCode || '—'}</td>
                    <td className="num">
                      {formatNumber(item.quantity)} {item.unit}
                    </td>
                    <td>{formatDate(item.targetDeliveryDate)}</td>
                    <td>
                      {item.rawMaterials.length === 0 ? (
                        <span className="muted">None specified</span>
                      ) : (
                        <div>
                          {item.rawMaterials.map((material) => (
                            <span className="material-chip" key={material.id}>
                              <strong>{material.materialName}</strong>
                              {formatNumber(material.quantity)} {material.unit}
                            </span>
                          ))}
                        </div>
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

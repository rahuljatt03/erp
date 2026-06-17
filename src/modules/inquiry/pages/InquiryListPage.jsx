import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import { LoadingState, EmptyState, ErrorState } from '../../../shared/components/states';
import { AddIcon, InquiryIcon } from '../../../shared/components/icons';
import { formatDate } from '../../../shared/utils/format';
import {
  fetchInquiries,
  selectInquiries,
  selectInquiriesError,
  selectInquiriesLoading,
} from '../inquirySlice';
import { getStatusMeta } from '../inquiry.constants';
import { summariseProducts, countItems, earliestDelivery } from '../inquiry.helpers';

export default function InquiryListPage() {
  const dispatch = useDispatch();
  const inquiries = useSelector(selectInquiries);
  const loading = useSelector(selectInquiriesLoading);
  const error = useSelector(selectInquiriesError);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchInquiries());
  }, [dispatch]);

  return (
    <>
      <PageHeader
        title="Inquiries"
        subtitle="Customer order inquiries — products, quantities, delivery dates and required raw materials."
        actions={
          <Button variant="primary" to="/inquiries/new">
            <AddIcon /> New Inquiry
          </Button>
        }
      />

      <Card bodyFlush>
        {loading ? (
          <LoadingState label="Loading inquiries…" />
        ) : error ? (
          <ErrorState text={error} onRetry={() => dispatch(fetchInquiries())} />
        ) : inquiries.length === 0 ? (
          <EmptyState
            icon={InquiryIcon}
            title="No inquiries yet"
            text="Create your first inquiry to capture a customer's product requirements."
            action={
              <Button variant="primary" to="/inquiries/new">
                <AddIcon /> New Inquiry
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Inquiry No.</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Products</th>
                  <th className="num">Lines</th>
                  <th>Earliest delivery</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => {
                  const status = getStatusMeta(inquiry.status);
                  const earliest = earliestDelivery(inquiry);
                  return (
                    <tr
                      key={inquiry.id}
                      className="is-clickable"
                      onClick={() => navigate(`/inquiries/${inquiry.id}`)}
                    >
                      <td className="cell-mono">{inquiry.inquiryNo}</td>
                      <td className="cell-strong">{inquiry.customerName}</td>
                      <td>{formatDate(inquiry.inquiryDate)}</td>
                      <td>{summariseProducts(inquiry)}</td>
                      <td className="num">{countItems(inquiry)}</td>
                      <td>{earliest ? formatDate(earliest) : '—'}</td>
                      <td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

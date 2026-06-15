import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../shared/components/PageHeader';
import Button from '../../shared/components/Button';
import Card from '../../shared/components/Card';
import Badge from '../../shared/components/Badge';
import { LoadingState, EmptyState } from '../../shared/components/states';
import { formatDate } from '../../shared/utils/format';
import { useInquiries } from '../inquiry/useInquiries';
import { getStatusMeta } from '../inquiry/inquiry.constants';
import { summariseProducts, countMaterials } from '../inquiry/inquiry.helpers';

function computeStats(inquiries) {
  return {
    total: inquiries.length,
    underReview: inquiries.filter((inquiry) => inquiry.status === 'under_review').length,
    drafts: inquiries.filter((inquiry) => inquiry.status === 'draft').length,
    materials: inquiries.reduce((sum, inquiry) => sum + countMaterials(inquiry), 0),
  };
}

export default function DashboardPage() {
  const { inquiries, loading } = useInquiries();
  const navigate = useNavigate();
  const stats = useMemo(() => computeStats(inquiries), [inquiries]);
  const recent = inquiries.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Manufacturing ERP — operations overview"
        actions={
          <Button variant="primary" to="/inquiries/new">
            + New Inquiry
          </Button>
        }
      />

      <div className="banner" style={{ marginBottom: 20 }}>
        👋 Welcome! The <strong>&nbsp;Inquiry&nbsp;</strong> module is live. Quotations, Bill of
        Materials, Production and Inventory will plug into this same shell as we build them.
      </div>

      {loading ? (
        <LoadingState label="Loading overview…" />
      ) : (
        <div className="stack">
          <div className="stat-grid">
            <div className="stat">
              <div className="stat__label">Total inquiries</div>
              <div className="stat__value">{stats.total}</div>
              <div className="stat__meta">Across all statuses</div>
            </div>
            <div className="stat">
              <div className="stat__label">Under review</div>
              <div className="stat__value">{stats.underReview}</div>
              <div className="stat__meta">Awaiting assessment</div>
            </div>
            <div className="stat">
              <div className="stat__label">Drafts</div>
              <div className="stat__value">{stats.drafts}</div>
              <div className="stat__meta">Not yet submitted</div>
            </div>
            <div className="stat">
              <div className="stat__label">Raw materials listed</div>
              <div className="stat__value">{stats.materials}</div>
              <div className="stat__meta">Demand signals for procurement</div>
            </div>
          </div>

          <Card
            title="Recent inquiries"
            actions={
              <Button to="/inquiries" variant="secondary" size="sm">
                View all
              </Button>
            }
            bodyFlush
          >
            {recent.length === 0 ? (
              <EmptyState
                icon="📨"
                title="No inquiries yet"
                text="Create your first inquiry to get started."
                action={
                  <Button variant="primary" to="/inquiries/new">
                    + New Inquiry
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
                      <th>Products</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((inquiry) => {
                      const status = getStatusMeta(inquiry.status);
                      return (
                        <tr
                          key={inquiry.id}
                          className="is-clickable"
                          onClick={() => navigate(`/inquiries/${inquiry.id}`)}
                        >
                          <td className="cell-mono">{inquiry.inquiryNo}</td>
                          <td className="cell-strong">{inquiry.customerName}</td>
                          <td>{summariseProducts(inquiry)}</td>
                          <td>{formatDate(inquiry.inquiryDate)}</td>
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
        </div>
      )}
    </>
  );
}

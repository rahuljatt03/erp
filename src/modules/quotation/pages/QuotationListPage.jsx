import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import StatusSelect from '../../../shared/components/StatusSelect';
import { LoadingState, EmptyState, ErrorState } from '../../../shared/components/states';
import { AddIcon, QuotationIcon } from '../../../shared/components/icons';
import { formatDate, formatNumber } from '../../../shared/utils/format';
import { useQuotations } from '../useQuotations';
import { QUOTE_STATUSES } from '../quotation.constants';
import { quoteValue } from '../quotation.helpers';

export default function QuotationListPage() {
  const { quotes, loading, error, refresh, updateStatus, savingId } = useQuotations();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Quotations"
        subtitle="Priced offers to customers. Quote an inquiry, or create one directly."
        actions={
          <Button variant="primary" to="/quotations/new">
            <AddIcon /> New Quotation
          </Button>
        }
      />

      <Card bodyFlush>
        {loading ? (
          <LoadingState label="Loading quotations…" />
        ) : error ? (
          <ErrorState text={error} onRetry={refresh} />
        ) : quotes.length === 0 ? (
          <EmptyState
            icon={QuotationIcon}
            title="No quotations yet"
            text="Turn an inquiry into a priced offer, or create one directly."
            action={
              <Button variant="primary" to="/quotations/new">
                <AddIcon /> New Quotation
              </Button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Quote No.</th>
                  <th>Customer</th>
                  <th>Quote date</th>
                  <th>Valid until</th>
                  <th>Source</th>
                  <th className="num">Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => {
                  return (
                    <tr
                      key={quote.id}
                      className="is-clickable"
                      onClick={() => navigate(`/quotations/${quote.id}`)}
                    >
                      <td className="cell-mono">{quote.quoteNo}</td>
                      <td className="cell-strong">{quote.customerName}</td>
                      <td>{formatDate(quote.quoteDate)}</td>
                      <td>{quote.validUntil ? formatDate(quote.validUntil) : <span className="muted">—</span>}</td>
                      <td>
                        {quote.sourceInquiryNo ? (
                          <span className="cell-mono">{quote.sourceInquiryNo}</span>
                        ) : (
                          <span className="muted">Direct</span>
                        )}
                      </td>
                      <td className="num">{formatNumber(quoteValue(quote))}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          value={quote.status}
                          options={QUOTE_STATUSES}
                          disabled={savingId === quote.id}
                          onChange={(next) => updateStatus(quote.id, next)}
                        />
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PageHeader from "../../../shared/components/PageHeader";
import Button from "../../../shared/components/Button";
import Card from "../../../shared/components/Card";
import StatusSelect from "../../../shared/components/StatusSelect";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "../../../shared/components/states";
import { AddIcon, QuotationIcon } from "../../../shared/components/icons";
import {
  formatDate,
  formatNumber,
  todayIso,
} from "../../../shared/utils/format";
import {
  fetchQuotations,
  updateQuotation,
  selectQuotations,
  selectQuotationsError,
  selectQuotationsLoading,
} from "../quotationSlice";
import { QUOTE_STATUSES } from "../quotation.constants";
import { quoteValue, isQuoteExpired } from "../quotation.helpers";
import { useToast } from "../../../shared/feedback/FeedbackProvider";
import { confirm, statusNeedsConfirm } from "../../../shared/feedback/confirm";

export default function QuotationListPage() {
  const dispatch = useDispatch();
  const quotes = useSelector(selectQuotations);
  const loading = useSelector(selectQuotationsLoading);
  const error = useSelector(selectQuotationsError);
  const navigate = useNavigate();
  const today = todayIso();
  const toast = useToast();
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    dispatch(fetchQuotations());
  }, [dispatch]);

  const refresh = () => dispatch(fetchQuotations());

  // Inline status change from the list. The API's PUT is a full replace, so send
  // the whole quotation back with only the status swapped — preserving its line
  // items, customer, and dates — then refresh the list.
  async function updateStatus(id, status) {
    const quote = quotes.find((q) => q.id === id);
    if (!quote) return;
    const label = QUOTE_STATUSES.find((s) => s.value === status)?.label ?? status;
    if (statusNeedsConfirm(status)) {
      const ok = await confirm({
        message: `Mark ${quote.quoteNo} as “${label}”?`,
        header: 'Change status?',
        acceptLabel: 'Change',
      });
      if (!ok) return;
    }
    setSavingId(id);
    try {
      await dispatch(updateQuotation({ id, draft: { ...quote, status } })).unwrap();
      await dispatch(fetchQuotations());
      toast.success('Status updated', `${quote.quoteNo} → ${label}.`);
    } catch (err) {
      toast.error('Update failed', err instanceof Error ? err.message : 'Could not update status.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeader
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
                  <th className="num">Value</th>
                  <th style={{ paddingLeft: 40 }}>Status</th>
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
                      <td className="num">{formatNumber(quoteValue(quote))}</td>
                      <td style={{ paddingLeft: 40 }} onClick={(e) => e.stopPropagation()}>
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

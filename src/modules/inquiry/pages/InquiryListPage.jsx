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
import { AddIcon, InquiryIcon } from "../../../shared/components/icons";
import { formatDate } from "../../../shared/utils/format";
import {
  fetchInquiries,
  setInquiryStatus,
  selectInquiries,
  selectInquiriesError,
  selectInquiriesLoading,
} from "../inquirySlice";
import { INQUIRY_STATUSES } from "../inquiry.constants";
import {
  summariseProducts,
  countItems,
  earliestDelivery,
} from "../inquiry.helpers";
import { useToast } from "../../../shared/feedback/FeedbackProvider";
import { confirm, statusNeedsConfirm } from "../../../shared/feedback/confirm";

export default function InquiryListPage() {
  const dispatch = useDispatch();
  const inquiries = useSelector(selectInquiries);
  const loading = useSelector(selectInquiriesLoading);
  const error = useSelector(selectInquiriesError);
  const navigate = useNavigate();
  const toast = useToast();
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    dispatch(fetchInquiries());
  }, [dispatch]);

  // Inline status change from the list. Uses the dedicated PATCH status thunk
  // (no need to round-trip the whole inquiry), then refreshes the list.
  async function updateStatus(id, status) {
    const inquiry = inquiries.find((i) => i.id === id);
    if (!inquiry) return;
    const label =
      INQUIRY_STATUSES.find((s) => s.value === status)?.label ?? status;
    if (statusNeedsConfirm(status)) {
      const ok = await confirm({
        message: `Mark ${inquiry.inquiryNo} as “${label}”?`,
        header: "Change status?",
        acceptLabel: "Change",
      });
      if (!ok) return;
    }
    setSavingId(id);
    try {
      await dispatch(setInquiryStatus({ id, status })).unwrap();
      await dispatch(fetchInquiries());
      toast.success("Status updated", `${inquiry.inquiryNo} → ${label}.`);
    } catch (err) {
      toast.error(
        "Update failed",
        err instanceof Error ? err.message : "Could not update status.",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <PageHeader
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
                      <td>{earliest ? formatDate(earliest) : "—"}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          value={inquiry.status}
                          options={INQUIRY_STATUSES}
                          disabled={savingId === inquiry.id}
                          onChange={(next) => updateStatus(inquiry.id, next)}
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

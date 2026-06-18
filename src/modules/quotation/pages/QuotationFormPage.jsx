import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Field from '../../../shared/components/Field';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { createId } from '../../../shared/utils/id';
import { formatNumber } from '../../../shared/utils/format';
import { createQuotation, fetchQuotation, updateQuotation } from '../quotationSlice';
import { QUOTE_STATUSES, UNITS, blankQuoteDraft, blankQuoteItem } from '../quotation.constants';
import { quoteValue } from '../quotation.helpers';
import { AddIcon, RemoveIcon } from '../../../shared/components/icons';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirm } from '../../../shared/feedback/confirm';
import { scrollToFirstError } from '../../../shared/utils/scrollToError';

function validate(draft) {
  const errors = { fields: {}, items: {}, form: null };
  if (!draft.customerName.trim()) errors.fields.customerName = 'Customer is required';
  if (!draft.quoteDate) errors.fields.quoteDate = 'Quote date is required';
  if (draft.validUntil && draft.quoteDate && draft.validUntil < draft.quoteDate) {
    errors.fields.validUntil = 'Must be on or after the quote date';
  }
  const named = draft.items.filter((item) => item.productName.trim() !== '');
  if (named.length === 0) errors.form = 'Add at least one product line.';
  draft.items.forEach((item) => {
    if (item.productName.trim() === '') return;
    if (!(Number(item.quantity) > 0)) errors.items[item.id] = { quantity: 'Qty > 0' };
  });
  const hasErrors =
    Boolean(errors.form) || Object.keys(errors.fields).length > 0 || Object.keys(errors.items).length > 0;
  return { errors, hasErrors };
}

const EMPTY_ERRORS = { fields: {}, items: {}, form: null };

function initialDraft(prefill) {
  if (!prefill) return blankQuoteDraft();
  return {
    ...blankQuoteDraft(),
    customerName: prefill.customerName ?? '',
    customerContact: prefill.customerContact ?? '',
    sourceInquiryId: prefill.sourceInquiryId ?? null,
    sourceInquiryNo: prefill.sourceInquiryNo ?? '',
    notes: prefill.sourceInquiryNo ? `Quotation for inquiry ${prefill.sourceInquiryNo}.` : '',
    items:
      prefill.items && prefill.items.length > 0
        ? prefill.items.map((item) => ({ ...blankQuoteItem(), id: createId('qti'), ...item }))
        : [blankQuoteItem()],
  };
}

export default function QuotationFormPage() {
  const { id } = useParams();
  const mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const prefill = location.state?.prefill;
  const toast = useToast();
  const formRef = useRef(null);

  const [draft, setDraft] = useState(() => initialDraft(mode === 'create' ? prefill : null));
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== 'edit') return;
    let active = true;
    setLoading(true);
    dispatch(fetchQuotation(id))
      .unwrap()
      .then((found) => {
        if (!active) return;
        if (!found) setLoadError('Quotation not found');
        else
          setDraft({
            customerName: found.customerName,
            customerContact: found.customerContact ?? '',
            sourceInquiryId: found.sourceInquiryId ?? null,
            sourceInquiryNo: found.sourceInquiryNo ?? '',
            quoteDate: found.quoteDate,
            validUntil: found.validUntil ?? '',
            status: found.status,
            notes: found.notes ?? '',
            items: found.items.map((item) => ({ ...item })),
          });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, id, dispatch]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const setItem = (itemId, patch) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    }));
  const addItem = () => setDraft((prev) => ({ ...prev, items: [...prev.items, blankQuoteItem()] }));
  const removeItem = (itemId) =>
    setDraft((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== itemId) }));

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validate(draft);
    setErrors(result.errors);
    if (result.hasErrors) {
      toast.warn(
        'Please fix the highlighted fields',
        result.errors.form || 'Some required information is missing or invalid.',
      );
      scrollToFirstError(formRef.current);
      return;
    }
    const ok = await confirm({
      message: mode === 'edit' ? 'Save changes to this quotation?' : 'Create this quotation?',
      header: mode === 'edit' ? 'Save changes?' : 'Create quotation?',
      icon: 'pi pi-question-circle',
      acceptLabel: mode === 'edit' ? 'Save' : 'Create',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const saved =
        mode === 'edit'
          ? await dispatch(updateQuotation({ id, draft })).unwrap()
          : await dispatch(createQuotation(draft)).unwrap();
      toast.success(
        mode === 'edit' ? 'Quotation updated' : 'Quotation created',
        saved?.quoteNo ? `${saved.quoteNo} saved.` : undefined,
      );
      navigate(`/quotations/${saved.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setErrors({ ...EMPTY_ERRORS, form: message });
      toast.error('Save failed', message);
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading quotation…" />;
  if (loadError)
    return (
      <>
        <PageHeader title="Edit quotation" />
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );

  const cancelTo = mode === 'edit' ? `/quotations/${id}` : '/quotations';

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={mode === 'edit' ? 'Edit quotation' : 'New quotation'}
        subtitle="Offer the customer a price for the products they asked about."
        actions={
          <>
            <Button to={cancelTo} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create quotation'}
            </Button>
          </>
        }
      />

      {errors.form ? (
        <div
          className="banner banner--error"
          style={{ marginBottom: 18, background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: '#fecaca' }}
        >
          {errors.form}
        </div>
      ) : null}

      <div className="stack">
        <Card title="Customer & quotation details">
          <div className="form-grid">
            <Field label="Customer name" required error={errors.fields.customerName}>
              <input
                className={`input ${errors.fields.customerName ? 'has-error' : ''}`}
                value={draft.customerName}
                onChange={(event) => setField('customerName', event.target.value)}
              />
            </Field>
            <Field label="Customer contact" hint="Email or phone (optional)">
              <input
                className="input"
                value={draft.customerContact}
                onChange={(event) => setField('customerContact', event.target.value)}
              />
            </Field>
            <Field label="Quote date" required error={errors.fields.quoteDate}>
              <input
                className={`input ${errors.fields.quoteDate ? 'has-error' : ''}`}
                type="date"
                value={draft.quoteDate}
                onChange={(event) => setField('quoteDate', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <select className="select" value={draft.status} onChange={(event) => setField('status', event.target.value)}>
                {QUOTE_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          title="Quotation lines"
          actions={
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              <AddIcon /> Add line
            </Button>
          }
          bodyFlush
        >
          <div className="table-wrap">
            <table className="table table-fixed">
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '4%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th className="num">Qty</th>
                  <th>Unit</th>
                  <th>Delivery</th>
                  <th className="num">Unit price</th>
                  <th className="num">Line total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.items.map((item) => {
                  const itemErr = errors.items[item.id] ?? {};
                  return (
                    <tr key={item.id}>
                      <td>
                        <input
                          className="input"
                          placeholder="Product name"
                          value={item.productName}
                          onChange={(event) => setItem(item.id, { productName: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          placeholder="Code"
                          value={item.productCode}
                          onChange={(event) => setItem(item.id, { productCode: event.target.value })}
                        />
                      </td>
                      <td className="num">
                        <input
                          className={`input ${itemErr.quantity ? 'has-error' : ''}`}
                          style={{ textAlign: 'right' }}
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(event) => setItem(item.id, { quantity: event.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="select"
                          value={item.unit}
                          onChange={(event) => setItem(item.id, { unit: event.target.value })}
                        >
                          {UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="input"
                          type="date"
                          value={item.deliveryDate}
                          onChange={(event) => setItem(item.id, { deliveryDate: event.target.value })}
                        />
                      </td>
                      <td className="num">
                        <input
                          className="input"
                          style={{ textAlign: 'right' }}
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(event) => setItem(item.id, { unitPrice: event.target.value })}
                        />
                      </td>
                      <td className="num cell-strong">
                        {formatNumber((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                      </td>
                      <td className="num">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          title="Remove line"
                          onClick={() => removeItem(item.id)}
                          disabled={draft.items.length === 1}
                        >
                          <RemoveIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="num cell-strong">
                    Quotation total
                  </td>
                  <td className="num cell-strong">{formatNumber(quoteValue(draft))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <Card title="Notes">
          <Field>
            <textarea
              className="textarea"
              placeholder="Optional notes — lead time, terms, validity…"
              value={draft.notes}
              onChange={(event) => setField('notes', event.target.value)}
            />
          </Field>
        </Card>

        <div className="row" style={{ justifyContent: 'flex-end', paddingBottom: 8 }}>
          <Button to={cancelTo} variant="ghost">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create quotation'}
          </Button>
        </div>
      </div>
    </form>
  );
}

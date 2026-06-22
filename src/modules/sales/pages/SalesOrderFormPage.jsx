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
import { createSalesOrder, fetchSalesOrder, updateSalesOrder } from '../salesSlice';
import { SO_STATUSES, UNITS, blankSODraft, blankSOItem } from '../sales.constants';
import { soValue } from '../sales.helpers';
import { AddIcon, RemoveIcon, LinkIcon } from '../../../shared/components/icons';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirm } from '../../../shared/feedback/confirm';
import { scrollToFirstError } from '../../../shared/utils/scrollToError';
import PhoneField from '../../../shared/components/PhoneField';
import { phoneError } from '../../../shared/utils/phone';

function validate(draft) {
  const errors = { fields: {}, items: {}, form: null };
  if (!draft.customerName.trim()) errors.fields.customerName = 'Customer is required';
  if (!draft.orderDate) errors.fields.orderDate = 'Order date is required';
  const contactError = phoneError(draft.customerContact);
  if (contactError) errors.fields.customerContact = contactError;
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
  if (!prefill) return blankSODraft();
  return {
    ...blankSODraft(),
    customerName: prefill.customerName ?? '',
    customerContact: prefill.customerContact ?? '',
    sourceInquiryId: prefill.sourceInquiryId ?? null,
    sourceInquiryNo: prefill.sourceInquiryNo ?? '',
    notes: prefill.sourceInquiryNo ? `Converted from inquiry ${prefill.sourceInquiryNo}.` : '',
    items:
      prefill.items && prefill.items.length > 0
        ? prefill.items.map((item) => ({ ...blankSOItem(), id: createId('soi'), ...item }))
        : [blankSOItem()],
  };
}

export default function SalesOrderFormPage() {
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
    dispatch(fetchSalesOrder(id))
      .unwrap()
      .then((found) => {
        if (!active) return;
        if (!found) setLoadError('Sales order not found');
        else
          setDraft({
            customerName: found.customerName,
            customerContact: found.customerContact ?? '',
            sourceInquiryId: found.sourceInquiryId ?? null,
            sourceInquiryNo: found.sourceInquiryNo ?? '',
            orderDate: found.orderDate,
            expectedDeliveryDate: found.expectedDeliveryDate ?? '',
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
  const addItem = () => setDraft((prev) => ({ ...prev, items: [...prev.items, blankSOItem()] }));
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
      message: mode === 'edit' ? 'Save changes to this sales order?' : 'Create this sales order?',
      header: mode === 'edit' ? 'Save changes?' : 'Create order?',
      icon: 'pi pi-question-circle',
      acceptLabel: mode === 'edit' ? 'Save' : 'Create',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const saved =
        mode === 'edit'
          ? await dispatch(updateSalesOrder({ id, draft })).unwrap()
          : await dispatch(createSalesOrder(draft)).unwrap();
      toast.success(
        mode === 'edit' ? 'Sales order updated' : 'Sales order created',
        saved?.soNo ? `${saved.soNo} saved.` : undefined,
      );
      navigate(`/sales-orders/${saved.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setErrors({ ...EMPTY_ERRORS, form: message });
      toast.error('Save failed', message);
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading sales order…" />;
  if (loadError)
    return (
      <>
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );

  const cancelTo = mode === 'edit' ? `/sales-orders/${id}` : '/sales-orders';

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <PageHeader />

      {draft.sourceInquiryNo ? (
        <div className="banner" style={{ marginBottom: 18 }}>
          <LinkIcon size={16} /> Converting inquiry <strong>&nbsp;{draft.sourceInquiryNo}</strong>. Saving will mark that
          inquiry as <strong>&nbsp;Converted</strong>.
        </div>
      ) : null}

      {errors.form ? (
        <div
          className="banner banner--error"
          style={{ marginBottom: 18, background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: '#fecaca' }}
        >
          {errors.form}
        </div>
      ) : null}

      <div className="stack">
        <Card title="Customer & order details">
          <div className="form-grid">
            <Field label="Customer name" required error={errors.fields.customerName}>
              <input
                className={`input ${errors.fields.customerName ? 'has-error' : ''}`}
                value={draft.customerName}
                onChange={(event) => setField('customerName', event.target.value)}
              />
            </Field>
            <Field
              label="Customer contact"
              hint="Phone number (optional)"
              error={errors.fields.customerContact}
            >
              <PhoneField
                value={draft.customerContact}
                onChange={(value) => setField('customerContact', value)}
                error={Boolean(errors.fields.customerContact)}
              />
            </Field>
            <Field label="Order date" required error={errors.fields.orderDate}>
              <input
                className={`input ${errors.fields.orderDate ? 'has-error' : ''}`}
                type="date"
                value={draft.orderDate}
                onChange={(event) => setField('orderDate', event.target.value)}
              />
            </Field>
            <Field label="Expected delivery" hint="Optional">
              <input
                className="input"
                type="date"
                value={draft.expectedDeliveryDate}
                onChange={(event) => setField('expectedDeliveryDate', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <select className="select" value={draft.status} onChange={(event) => setField('status', event.target.value)}>
                {SO_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          title="Order lines"
          actions={
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              <AddIcon /> Add line
            </Button>
          }
          bodyFlush
        >
          <div className="table-wrap">
            <table className="table">
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
                          style={{ width: 100 }}
                          placeholder="Code"
                          value={item.productCode}
                          onChange={(event) => setItem(item.id, { productCode: event.target.value })}
                        />
                      </td>
                      <td className="num">
                        <input
                          className={`input ${itemErr.quantity ? 'has-error' : ''}`}
                          style={{ width: 80, textAlign: 'right' }}
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
                          style={{ width: 80 }}
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
                          style={{ width: 150 }}
                          type="date"
                          value={item.deliveryDate}
                          onChange={(event) => setItem(item.id, { deliveryDate: event.target.value })}
                        />
                      </td>
                      <td className="num">
                        <input
                          className="input"
                          style={{ width: 100, textAlign: 'right' }}
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
                    Order total
                  </td>
                  <td className="num cell-strong">{formatNumber(soValue(draft))}</td>
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
              placeholder="Optional notes…"
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
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create order'}
          </Button>
        </div>
      </div>
    </form>
  );
}

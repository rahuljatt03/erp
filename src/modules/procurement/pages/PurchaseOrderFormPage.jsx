import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Field from '../../../shared/components/Field';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { createId } from '../../../shared/utils/id';
import { createPurchaseOrder, fetchPurchaseOrder, updatePurchaseOrder } from '../procurementSlice';
import {
  PO_STATUSES,
  UNITS,
  blankPODraft,
  blankPOItem,
} from '../procurement.constants';
import { poValue } from '../procurement.helpers';
import { formatNumber } from '../../../shared/utils/format';
import { AddIcon, RemoveIcon, LinkIcon } from '../../../shared/components/icons';

function validate(draft) {
  const errors = { fields: {}, items: {}, form: null };
  if (!draft.supplierName.trim()) errors.fields.supplierName = 'Supplier is required';
  if (!draft.orderDate) errors.fields.orderDate = 'Order date is required';

  const withName = draft.items.filter((item) => item.materialName.trim() !== '');
  if (withName.length === 0) errors.form = 'Add at least one material line.';

  draft.items.forEach((item) => {
    if (item.materialName.trim() === '') return;
    const itemErrors = {};
    if (!(Number(item.quantity) > 0)) itemErrors.quantity = 'Qty > 0';
    if (Object.keys(itemErrors).length > 0) errors.items[item.id] = itemErrors;
  });

  const hasErrors =
    Boolean(errors.form) ||
    Object.keys(errors.fields).length > 0 ||
    Object.keys(errors.items).length > 0;
  return { errors, hasErrors };
}

const EMPTY_ERRORS = { fields: {}, items: {}, form: null };

/** Build an initial draft, honouring a prefill passed via router state. */
function initialDraft(prefill) {
  if (!prefill) return blankPODraft();
  return {
    ...blankPODraft(),
    sourceInquiryId: prefill.sourceInquiryId ?? null,
    sourceInquiryNo: prefill.sourceInquiryNo ?? '',
    notes: prefill.sourceInquiryNo
      ? `Generated from requirement analysis of ${prefill.sourceInquiryNo}.`
      : '',
    items:
      prefill.items && prefill.items.length > 0
        ? prefill.items.map((item) => ({ ...blankPOItem(), id: createId('poi'), ...item }))
        : [blankPOItem()],
  };
}

export default function PurchaseOrderFormPage() {
  const { id } = useParams();
  const mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const prefill = location.state?.prefill;

  const [draft, setDraft] = useState(() => initialDraft(mode === 'create' ? prefill : null));
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== 'edit') return;
    let active = true;
    setLoading(true);
    dispatch(fetchPurchaseOrder(id))
      .unwrap()
      .then((found) => {
        if (!active) return;
        if (!found) setLoadError('Purchase order not found');
        else
          setDraft({
            supplierName: found.supplierName,
            supplierContact: found.supplierContact ?? '',
            status: found.status,
            orderDate: found.orderDate,
            expectedDate: found.expectedDate ?? '',
            sourceInquiryId: found.sourceInquiryId ?? null,
            sourceInquiryNo: found.sourceInquiryNo ?? '',
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
  const addItem = () => setDraft((prev) => ({ ...prev, items: [...prev.items, blankPOItem()] }));
  const removeItem = (itemId) =>
    setDraft((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== itemId) }));

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validate(draft);
    setErrors(result.errors);
    if (result.hasErrors) return;

    setSaving(true);
    try {
      const saved =
        mode === 'edit'
          ? await dispatch(updatePurchaseOrder({ id, draft })).unwrap()
          : await dispatch(createPurchaseOrder(draft)).unwrap();
      navigate(`/purchase-orders/${saved.id}`);
    } catch (err) {
      setErrors({ ...EMPTY_ERRORS, form: err instanceof Error ? err.message : 'Failed to save' });
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading purchase order…" />;
  if (loadError)
    return (
      <>
        <PageHeader title="Edit purchase order" />
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );

  const cancelTo = mode === 'edit' ? `/purchase-orders/${id}` : '/purchase-orders';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={mode === 'edit' ? 'Edit purchase order' : 'New purchase order'}
        subtitle="Order raw materials from a supplier. Receiving adds stock to inventory."
        actions={
          <>
            <Button to={cancelTo} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create PO'}
            </Button>
          </>
        }
      />

      {draft.sourceInquiryNo ? (
        <div className="banner" style={{ marginBottom: 18 }}>
          <LinkIcon size={16} /> Prefilled from the requirement analysis of <strong>&nbsp;{draft.sourceInquiryNo}</strong>.
          Review quantities and set the supplier before saving.
        </div>
      ) : null}

      {errors.form ? (
        <div
          className="banner"
          style={{ marginBottom: 18, background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: '#fecaca' }}
        >
          {errors.form}
        </div>
      ) : null}

      <div className="stack">
        <Card title="Supplier & order details">
          <div className="form-grid">
            <Field label="Supplier name" required error={errors.fields.supplierName}>
              <input
                className={`input ${errors.fields.supplierName ? 'has-error' : ''}`}
                placeholder="e.g. Meridian Metals Supply"
                value={draft.supplierName}
                onChange={(event) => setField('supplierName', event.target.value)}
              />
            </Field>
            <Field label="Supplier contact" hint="Email or phone (optional)">
              <input
                className="input"
                value={draft.supplierContact}
                onChange={(event) => setField('supplierContact', event.target.value)}
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
                value={draft.expectedDate}
                onChange={(event) => setField('expectedDate', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <select
                className="select"
                value={draft.status}
                onChange={(event) => setField('status', event.target.value)}
              >
                {PO_STATUSES.filter((s) => s.value !== 'partially_received').map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          title="Materials"
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
                  <th>Material</th>
                  <th>Code</th>
                  <th className="num">Quantity</th>
                  <th>Unit</th>
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
                          placeholder="Material name"
                          value={item.materialName}
                          onChange={(event) => setItem(item.id, { materialName: event.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          style={{ width: 110 }}
                          placeholder="Code"
                          value={item.materialCode}
                          onChange={(event) => setItem(item.id, { materialCode: event.target.value })}
                        />
                      </td>
                      <td className="num">
                        <input
                          className={`input ${itemErr.quantity ? 'has-error' : ''}`}
                          style={{ width: 100, textAlign: 'right' }}
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
                          style={{ width: 90 }}
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
                      <td className="num">
                        <input
                          className="input"
                          style={{ width: 110, textAlign: 'right' }}
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
                  <td colSpan={5} className="num cell-strong">
                    Total
                  </td>
                  <td className="num cell-strong">{formatNumber(poValue(draft))}</td>
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
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create PO'}
          </Button>
        </div>
      </div>
    </form>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Field from '../../../shared/components/Field';
import Input from '../../../shared/components/Input';
import Select from '../../../shared/components/Select';
import Textarea from '../../../shared/components/Textarea';
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
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirm } from '../../../shared/feedback/confirm';
import { scrollToFirstError } from '../../../shared/utils/scrollToError';
import PhoneField from '../../../shared/components/PhoneField';
import { phoneError } from '../../../shared/utils/phone';

function validate(draft) {
  const errors = { fields: {}, items: {}, form: null };
  if (!draft.supplierName.trim()) errors.fields.supplierName = 'Supplier is required';
  if (!draft.orderDate) errors.fields.orderDate = 'Order date is required';
  const contactError = phoneError(draft.supplierContact);
  if (contactError) errors.fields.supplierContact = contactError;

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
    if (result.hasErrors) {
      toast.warn(
        'Please fix the highlighted fields',
        result.errors.form || 'Some required information is missing or invalid.',
      );
      scrollToFirstError(formRef.current);
      return;
    }

    const ok = await confirm({
      message: mode === 'edit' ? 'Save changes to this purchase order?' : 'Create this purchase order?',
      header: mode === 'edit' ? 'Save changes?' : 'Create PO?',
      icon: 'pi pi-question-circle',
      acceptLabel: mode === 'edit' ? 'Save' : 'Create',
    });
    if (!ok) return;

    setSaving(true);
    try {
      const saved =
        mode === 'edit'
          ? await dispatch(updatePurchaseOrder({ id, draft })).unwrap()
          : await dispatch(createPurchaseOrder(draft)).unwrap();
      toast.success(
        mode === 'edit' ? 'Purchase order updated' : 'Purchase order created',
        saved?.poNo ? `${saved.poNo} saved.` : undefined,
      );
      navigate(`/purchase-orders/${saved.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setErrors({ ...EMPTY_ERRORS, form: message });
      toast.error('Save failed', message);
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading purchase order…" />;
  if (loadError)
    return (
      <>
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );

  const cancelTo = mode === 'edit' ? `/purchase-orders/${id}` : '/purchase-orders';

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <PageHeader />

      {draft.sourceInquiryNo ? (
        <div className="mb-[18px] flex gap-2.5 rounded-field border border-blue-200 bg-blue-100 px-4 py-3 text-[13.5px] text-blue-800">
          <LinkIcon size={16} /> Prefilled from the requirement analysis of <strong>&nbsp;{draft.sourceInquiryNo}</strong>.
          Review quantities and set the supplier before saving.
        </div>
      ) : null}

      {errors.form ? (
        <div className="mb-[18px] flex gap-2.5 rounded-field border border-red-200 bg-red-100 px-4 py-3 text-[13.5px] text-red-600">
          {errors.form}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <Card title="Supplier & order details">
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field label="Supplier name" required error={errors.fields.supplierName}>
              <Input
                invalid={Boolean(errors.fields.supplierName)}
                placeholder="e.g. Meridian Metals Supply"
                value={draft.supplierName}
                onChange={(event) => setField('supplierName', event.target.value)}
              />
            </Field>
            <Field
              label="Supplier contact"
              hint="Phone number (optional)"
              error={errors.fields.supplierContact}
            >
              <PhoneField
                value={draft.supplierContact}
                onChange={(value) => setField('supplierContact', value)}
                error={Boolean(errors.fields.supplierContact)}
              />
            </Field>
            <Field label="Order date" required error={errors.fields.orderDate}>
              <Input
                invalid={Boolean(errors.fields.orderDate)}
                type="date"
                value={draft.orderDate}
                onChange={(event) => setField('orderDate', event.target.value)}
              />
            </Field>
            <Field label="Expected delivery" hint="Optional">
              <Input
                type="date"
                value={draft.expectedDate}
                onChange={(event) => setField('expectedDate', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(event) => setField('status', event.target.value)}
              >
                {PO_STATUSES.filter((s) => s.value !== 'partially_received').map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Code</th>
                  <th className="!text-right">Quantity</th>
                  <th>Unit</th>
                  <th className="!text-right">Unit price</th>
                  <th className="!text-right">Line total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.items.map((item) => {
                  const itemErr = errors.items[item.id] ?? {};
                  return (
                    <tr key={item.id}>
                      <td>
                        <Input
                          placeholder="Material name"
                          value={item.materialName}
                          onChange={(event) => setItem(item.id, { materialName: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          className="w-[110px]"
                          placeholder="Code"
                          value={item.materialCode}
                          onChange={(event) => setItem(item.id, { materialCode: event.target.value })}
                        />
                      </td>
                      <td className="!text-right tabular-nums">
                        <Input
                          invalid={Boolean(itemErr.quantity)}
                          className="w-[100px] text-right"
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(event) => setItem(item.id, { quantity: event.target.value })}
                        />
                      </td>
                      <td>
                        <Select
                          className="w-[90px]"
                          value={item.unit}
                          onChange={(event) => setItem(item.id, { unit: event.target.value })}
                        >
                          {UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="!text-right tabular-nums">
                        <Input
                          className="w-[110px] text-right"
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(event) => setItem(item.id, { unitPrice: event.target.value })}
                        />
                      </td>
                      <td className="!text-right tabular-nums !font-semibold !text-slate-900">
                        {formatNumber((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
                      </td>
                      <td className="!text-right tabular-nums">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          title="Remove line"
                          onClick={() => removeItem(item.id)}
                          disabled={draft.items.length === 1}
                        >
                          <RemoveIcon />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="!text-right tabular-nums !font-semibold !text-slate-900">
                    Total
                  </td>
                  <td className="!text-right tabular-nums !font-semibold !text-slate-900">{formatNumber(poValue(draft))}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        <Card title="Notes">
          <Field>
            <Textarea
              placeholder="Optional notes…"
              value={draft.notes}
              onChange={(event) => setField('notes', event.target.value)}
            />
          </Field>
        </Card>

        <div className="flex items-center justify-end gap-2.5 pb-2">
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

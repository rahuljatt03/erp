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
        <div className="mb-[18px] flex gap-2.5 rounded-field border border-blue-200 bg-blue-100 px-4 py-3 text-[13.5px] text-blue-800">
          <LinkIcon size={16} /> Converting inquiry <strong>&nbsp;{draft.sourceInquiryNo}</strong>. Saving will mark that
          inquiry as <strong>&nbsp;Converted</strong>.
        </div>
      ) : null}

      {errors.form ? (
        <div className="mb-[18px] flex gap-2.5 rounded-field border border-red-200 bg-red-100 px-4 py-3 text-[13.5px] text-red-600">
          {errors.form}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <Card title="Customer & order details">
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field label="Customer name" required error={errors.fields.customerName}>
              <Input
                invalid={Boolean(errors.fields.customerName)}
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
                value={draft.expectedDeliveryDate}
                onChange={(event) => setField('expectedDeliveryDate', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <Select value={draft.status} onChange={(event) => setField('status', event.target.value)}>
                {SO_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
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
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th className="!text-right">Qty</th>
                  <th>Unit</th>
                  <th>Delivery</th>
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
                          placeholder="Product name"
                          value={item.productName}
                          onChange={(event) => setItem(item.id, { productName: event.target.value })}
                        />
                      </td>
                      <td>
                        <Input
                          className="w-[100px]"
                          placeholder="Code"
                          value={item.productCode}
                          onChange={(event) => setItem(item.id, { productCode: event.target.value })}
                        />
                      </td>
                      <td className="!text-right tabular-nums">
                        <Input
                          invalid={Boolean(itemErr.quantity)}
                          className="w-20 text-right"
                          type="number"
                          min="0"
                          step="any"
                          value={item.quantity}
                          onChange={(event) => setItem(item.id, { quantity: event.target.value })}
                        />
                      </td>
                      <td>
                        <Select
                          className="w-20"
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
                      <td>
                        <Input
                          className="w-[150px]"
                          type="date"
                          value={item.deliveryDate}
                          onChange={(event) => setItem(item.id, { deliveryDate: event.target.value })}
                        />
                      </td>
                      <td className="!text-right tabular-nums">
                        <Input
                          className="w-[100px] text-right"
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
                  <td colSpan={6} className="!text-right tabular-nums !font-semibold !text-slate-900">
                    Order total
                  </td>
                  <td className="!text-right tabular-nums !font-semibold !text-slate-900">{formatNumber(soValue(draft))}</td>
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
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create order'}
          </Button>
        </div>
      </div>
    </form>
  );
}

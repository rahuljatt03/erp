import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Field from '../../../shared/components/Field';
import Input from '../../../shared/components/Input';
import Select from '../../../shared/components/Select';
import Textarea from '../../../shared/components/Textarea';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { createInquiry, fetchInquiry, updateInquiry } from '../inquirySlice';
import {
  INQUIRY_STATUSES,
  blankInquiryDraft,
  blankLineItem,
  blankRawMaterial,
} from '../inquiry.constants';
import LineItemEditor from '../components/LineItemEditor';
import { AddIcon } from '../../../shared/components/icons';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirm } from '../../../shared/feedback/confirm';
import { scrollToFirstError } from '../../../shared/utils/scrollToError';
import PhoneField from '../../../shared/components/PhoneField';
import { phoneError } from '../../../shared/utils/phone';

/** Validates a draft and returns `{ errors, hasErrors }`. */
function validate(draft) {
  const errors = { fields: {}, items: {}, form: null };

  if (!draft.customerName.trim()) errors.fields.customerName = 'Customer name is required';
  if (!draft.inquiryDate) errors.fields.inquiryDate = 'Inquiry date is required';

  const contactError = phoneError(draft.customerContact);
  if (contactError) errors.fields.customerContact = contactError;
  if (draft.items.length === 0) errors.form = 'Add at least one product line.';

  draft.items.forEach((item) => {
    const itemErrors = {};
    if (!item.productName.trim()) itemErrors.productName = 'Product name is required';
    if (!(Number(item.quantity) > 0)) itemErrors.quantity = 'Must be greater than 0';
    if (!item.targetDeliveryDate) itemErrors.targetDeliveryDate = 'Required';
    if (Object.keys(itemErrors).length > 0) errors.items[item.id] = itemErrors;
  });

  const hasErrors =
    Boolean(errors.form) ||
    Object.keys(errors.fields).length > 0 ||
    Object.keys(errors.items).length > 0;

  return { errors, hasErrors };
}

const EMPTY_ERRORS = { fields: {}, items: {}, form: null };

export default function InquiryFormPage() {
  const { id } = useParams();
  const mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const formRef = useRef(null);

  const [draft, setDraft] = useState(blankInquiryDraft);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  // In edit mode, hydrate the form from the stored inquiry.
  useEffect(() => {
    if (mode !== 'edit') return;
    let active = true;
    setLoading(true);
    dispatch(fetchInquiry(id))
      .unwrap()
      .then((found) => {
        if (!active) return;
        if (!found) {
          setLoadError('Inquiry not found');
        } else {
          setDraft({
            customerName: found.customerName,
            customerContact: found.customerContact ?? '',
            inquiryDate: found.inquiryDate,
            status: found.status,
            notes: found.notes ?? '',
            items: found.items.map((item) => ({
              ...item,
              productCode: item.productCode ?? '',
              remarks: item.remarks ?? '',
              rawMaterials:
                item.rawMaterials.length > 0 ? item.rawMaterials : [blankRawMaterial()],
            })),
          });
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, id, dispatch]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const setItem = (updated) =>
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === updated.id ? updated : item)),
    }));
  const addItem = () => setDraft((prev) => ({ ...prev, items: [...prev.items, blankLineItem()] }));
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
      message: mode === 'edit' ? 'Save changes to this inquiry?' : 'Create this inquiry?',
      header: mode === 'edit' ? 'Save changes?' : 'Create inquiry?',
      icon: 'pi pi-question-circle',
      acceptLabel: mode === 'edit' ? 'Save' : 'Create',
    });
    if (!ok) return;

    setSaving(true);
    try {
      const saved =
        mode === 'edit'
          ? await dispatch(updateInquiry({ id, draft })).unwrap()
          : await dispatch(createInquiry(draft)).unwrap();
      toast.success(
        mode === 'edit' ? 'Inquiry updated' : 'Inquiry created',
        saved?.inquiryNo ? `${saved.inquiryNo} saved.` : undefined,
      );
      navigate(`/inquiries/${saved.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save inquiry';
      setErrors({ ...EMPTY_ERRORS, form: message });
      toast.error('Save failed', message);
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState label="Loading inquiry…" />;
  }

  if (loadError) {
    return (
      <>
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );
  }

  const cancelTo = mode === 'edit' ? `/inquiries/${id}` : '/inquiries';

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <PageHeader />

      {errors.form ? (
        <div className="mb-[18px] flex gap-2.5 rounded-field border border-red-200 bg-red-100 px-4 py-3 text-[13.5px] text-red-600">
          {errors.form}
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <Card title="Customer & inquiry details">
          <div className="grid grid-cols-1 items-start gap-x-4 gap-y-5 sm:grid-cols-2">
            <Field label="Customer name" required error={errors.fields.customerName}>
              <Input
                invalid={Boolean(errors.fields.customerName)}
                placeholder="e.g. Apex Industrial Pumps"
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

            <Field label="Inquiry date" required error={errors.fields.inquiryDate}>
              <Input
                invalid={Boolean(errors.fields.inquiryDate)}
                type="date"
                value={draft.inquiryDate}
                onChange={(event) => setField('inquiryDate', event.target.value)}
              />
            </Field>

            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(event) => setField('status', event.target.value)}
              >
                {INQUIRY_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <div>
          <div className="mb-3 flex items-center justify-between gap-2.5">
            <h2 className="text-[17px] font-semibold text-slate-900">Products & raw materials</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addItem}>
              <AddIcon /> Add product
            </Button>
          </div>

          {draft.items.map((item, index) => (
            <LineItemEditor
              key={item.id}
              item={item}
              index={index}
              errors={errors.items[item.id] ?? {}}
              onChange={setItem}
              onRemove={() => removeItem(item.id)}
              canRemove={draft.items.length > 1}
            />
          ))}
        </div>

        <Card title="Notes">
          <Field hint="Anything else relevant to this inquiry — deadlines, special terms, etc.">
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
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create inquiry'}
          </Button>
        </div>
      </div>
    </form>
  );
}

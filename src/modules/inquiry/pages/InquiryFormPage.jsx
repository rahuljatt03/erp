import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Field from '../../../shared/components/Field';
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

/** Validates a draft and returns `{ errors, hasErrors }`. */
function validate(draft) {
  const errors = { fields: {}, items: {}, form: null };

  if (!draft.customerName.trim()) errors.fields.customerName = 'Customer name is required';
  if (!draft.inquiryDate) errors.fields.inquiryDate = 'Inquiry date is required';
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
    if (result.hasErrors) return;

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
        <PageHeader title="Edit inquiry" />
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );
  }

  const cancelTo = mode === 'edit' ? `/inquiries/${id}` : '/inquiries';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={mode === 'edit' ? 'Edit inquiry' : 'New inquiry'}
        subtitle="Capture what the customer wants to order and the raw materials each product needs."
        actions={
          <>
            <Button to={cancelTo} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create inquiry'}
            </Button>
          </>
        }
      />

      {errors.form ? (
        <div className="banner" style={{ marginBottom: 18, background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: '#fecaca' }}>
          {errors.form}
        </div>
      ) : null}

      <div className="stack">
        <Card title="Customer & inquiry details">
          <div className="form-grid">
            <Field label="Customer name" required error={errors.fields.customerName}>
              <input
                className={`input ${errors.fields.customerName ? 'has-error' : ''}`}
                placeholder="e.g. Apex Industrial Pumps"
                value={draft.customerName}
                onChange={(event) => setField('customerName', event.target.value)}
              />
            </Field>

            <Field label="Customer contact" hint="Email or phone (optional)">
              <input
                className="input"
                placeholder="e.g. procurement@apex.com"
                value={draft.customerContact}
                onChange={(event) => setField('customerContact', event.target.value)}
              />
            </Field>

            <Field label="Inquiry date" required error={errors.fields.inquiryDate}>
              <input
                className={`input ${errors.fields.inquiryDate ? 'has-error' : ''}`}
                type="date"
                value={draft.inquiryDate}
                onChange={(event) => setField('inquiryDate', event.target.value)}
              />
            </Field>

            <Field label="Status">
              <select
                className="select"
                value={draft.status}
                onChange={(event) => setField('status', event.target.value)}
              >
                {INQUIRY_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <div>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h2 style={{ fontSize: 17 }}>Products & raw materials</h2>
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
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create inquiry'}
          </Button>
        </div>
      </div>
    </form>
  );
}

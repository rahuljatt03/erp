import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Field from '../../../shared/components/Field';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { createProductionOrder, fetchProductionOrder, updateProductionOrder } from '../productionSlice';
import { WO_STATUSES, UNITS, blankWODraft, blankWOMaterial } from '../production.constants';
import { AddIcon, RemoveIcon } from '../../../shared/components/icons';
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirm } from '../../../shared/feedback/confirm';

function validate(draft) {
  const errors = { fields: {}, form: null };
  if (!draft.productName.trim()) errors.fields.productName = 'Product is required';
  if (!(Number(draft.quantity) > 0)) errors.fields.quantity = 'Quantity must be greater than 0';
  const hasErrors = Boolean(errors.form) || Object.keys(errors.fields).length > 0;
  return { errors, hasErrors };
}

const EMPTY_ERRORS = { fields: {}, form: null };

export default function ProductionOrderFormPage() {
  const { id } = useParams();
  const mode = id ? 'edit' : 'create';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const [draft, setDraft] = useState(blankWODraft);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== 'edit') return;
    let active = true;
    setLoading(true);
    dispatch(fetchProductionOrder(id))
      .unwrap()
      .then((found) => {
        if (!active) return;
        if (!found) setLoadError('Work order not found');
        else
          setDraft({
            productName: found.productName,
            productCode: found.productCode ?? '',
            finishedGoodId: found.finishedGoodId ?? null,
            quantity: found.quantity,
            unit: found.unit,
            status: found.status,
            dueDate: found.dueDate ?? '',
            sourceInquiryId: found.sourceInquiryId ?? null,
            sourceInquiryNo: found.sourceInquiryNo ?? '',
            notes: found.notes ?? '',
            materials: found.materials.length > 0 ? found.materials.map((m) => ({ ...m })) : [blankWOMaterial()],
          });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, id, dispatch]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const setMaterial = (materialId, patch) =>
    setDraft((prev) => ({
      ...prev,
      materials: prev.materials.map((m) => (m.id === materialId ? { ...m, ...patch } : m)),
    }));
  const addMaterial = () => setDraft((prev) => ({ ...prev, materials: [...prev.materials, blankWOMaterial()] }));
  const removeMaterial = (materialId) =>
    setDraft((prev) => ({ ...prev, materials: prev.materials.filter((m) => m.id !== materialId) }));

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validate(draft);
    setErrors(result.errors);
    if (result.hasErrors) return;
    const ok = await confirm({
      message: mode === 'edit' ? 'Save changes to this work order?' : 'Create this work order?',
      header: mode === 'edit' ? 'Save changes?' : 'Create work order?',
      icon: 'pi pi-question-circle',
      acceptLabel: mode === 'edit' ? 'Save' : 'Create',
    });
    if (!ok) return;
    setSaving(true);
    try {
      const saved =
        mode === 'edit'
          ? await dispatch(updateProductionOrder({ id, draft })).unwrap()
          : await dispatch(createProductionOrder(draft)).unwrap();
      toast.success(
        mode === 'edit' ? 'Work order updated' : 'Work order created',
        saved?.woNo ? `${saved.woNo} saved.` : undefined,
      );
      navigate(`/production/${saved.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      setErrors({ ...EMPTY_ERRORS, form: message });
      toast.error('Save failed', message);
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading work order…" />;
  if (loadError)
    return (
      <>
        <PageHeader title="Edit work order" />
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );

  const cancelTo = mode === 'edit' ? `/production/${id}` : '/production';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={mode === 'edit' ? 'Edit work order' : 'New work order'}
        subtitle="Plan a production run. Completing it consumes materials and produces finished goods."
        actions={
          <>
            <Button to={cancelTo} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create work order'}
            </Button>
          </>
        }
      />

      {errors.form ? (
        <div
          className="banner"
          style={{ marginBottom: 18, background: 'var(--danger-bg)', color: 'var(--danger)', borderColor: '#fecaca' }}
        >
          {errors.form}
        </div>
      ) : null}

      <div className="stack">
        <Card title="Product to build">
          <div className="form-grid">
            <Field label="Product name" required error={errors.fields.productName}>
              <input
                className={`input ${errors.fields.productName ? 'has-error' : ''}`}
                placeholder="e.g. Cast Iron Pump Housing"
                value={draft.productName}
                onChange={(event) => setField('productName', event.target.value)}
              />
            </Field>
            <Field label="Product code" hint="Optional">
              <input
                className="input"
                value={draft.productCode}
                onChange={(event) => setField('productCode', event.target.value)}
              />
            </Field>
            <Field label="Quantity to build" required error={errors.fields.quantity}>
              <input
                className={`input ${errors.fields.quantity ? 'has-error' : ''}`}
                type="number"
                min="0"
                step="any"
                value={draft.quantity}
                onChange={(event) => setField('quantity', event.target.value)}
              />
            </Field>
            <Field label="Unit">
              <select className="select" value={draft.unit} onChange={(event) => setField('unit', event.target.value)}>
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Due date" hint="Optional">
              <input
                className="input"
                type="date"
                value={draft.dueDate}
                onChange={(event) => setField('dueDate', event.target.value)}
              />
            </Field>
            <Field label="Status">
              <select className="select" value={draft.status} onChange={(event) => setField('status', event.target.value)}>
                {WO_STATUSES.filter((s) => s.value !== 'in_progress').map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          title="Materials to consume"
          actions={
            <Button type="button" variant="secondary" size="sm" onClick={addMaterial}>
              <AddIcon /> Add material
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
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.materials.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <input
                        className="input"
                        placeholder="Material name"
                        value={material.materialName}
                        onChange={(event) => setMaterial(material.id, { materialName: event.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        style={{ width: 110 }}
                        placeholder="Code"
                        value={material.materialCode}
                        onChange={(event) => setMaterial(material.id, { materialCode: event.target.value })}
                      />
                    </td>
                    <td className="num">
                      <input
                        className="input"
                        style={{ width: 100, textAlign: 'right' }}
                        type="number"
                        min="0"
                        step="any"
                        value={material.quantity}
                        onChange={(event) => setMaterial(material.id, { quantity: event.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 90 }}
                        value={material.unit}
                        onChange={(event) => setMaterial(material.id, { unit: event.target.value })}
                      >
                        {UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        title="Remove material"
                        onClick={() => removeMaterial(material.id)}
                        disabled={draft.materials.length === 1}
                      >
                        <RemoveIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
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
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create work order'}
          </Button>
        </div>
      </div>
    </form>
  );
}

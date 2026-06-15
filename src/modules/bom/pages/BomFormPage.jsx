import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import Field from '../../../shared/components/Field';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { bomService } from '../bom.service';
import { BOM_STATUSES, UNITS, blankBomDraft, blankComponent } from '../bom.constants';

function validate(draft) {
  const errors = { fields: {}, form: null };
  if (!draft.productName.trim()) errors.fields.productName = 'Product name is required';
  const named = draft.components.filter((component) => component.materialName.trim() !== '');
  if (named.length === 0) errors.form = 'Add at least one component.';
  const hasErrors = Boolean(errors.form) || Object.keys(errors.fields).length > 0;
  return { errors, hasErrors };
}

const EMPTY_ERRORS = { fields: {}, form: null };

export default function BomFormPage() {
  const { id } = useParams();
  const mode = id ? 'edit' : 'create';
  const navigate = useNavigate();

  const [draft, setDraft] = useState(blankBomDraft);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== 'edit') return;
    let active = true;
    setLoading(true);
    bomService
      .get(id)
      .then((found) => {
        if (!active) return;
        if (!found) setLoadError('Bill of materials not found');
        else
          setDraft({
            productName: found.productName,
            productCode: found.productCode ?? '',
            finishedGoodId: found.finishedGoodId ?? null,
            outputUnit: found.outputUnit ?? 'pcs',
            status: found.status,
            notes: found.notes ?? '',
            components: found.components.length > 0 ? found.components.map((c) => ({ ...c })) : [blankComponent()],
          });
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [mode, id]);

  const setField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  const setComponent = (componentId, patch) =>
    setDraft((prev) => ({
      ...prev,
      components: prev.components.map((c) => (c.id === componentId ? { ...c, ...patch } : c)),
    }));
  const addComponent = () => setDraft((prev) => ({ ...prev, components: [...prev.components, blankComponent()] }));
  const removeComponent = (componentId) =>
    setDraft((prev) => ({ ...prev, components: prev.components.filter((c) => c.id !== componentId) }));

  async function handleSubmit(event) {
    event.preventDefault();
    const result = validate(draft);
    setErrors(result.errors);
    if (result.hasErrors) return;
    setSaving(true);
    try {
      const saved = mode === 'edit' ? await bomService.update(id, draft) : await bomService.create(draft);
      navigate(`/bom/${saved.id}`);
    } catch (err) {
      setErrors({ ...EMPTY_ERRORS, form: err instanceof Error ? err.message : 'Failed to save' });
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label="Loading bill of materials…" />;
  if (loadError)
    return (
      <>
        <PageHeader title="Edit BOM" />
        <Card>
          <ErrorState text={loadError} />
        </Card>
      </>
    );

  const cancelTo = mode === 'edit' ? `/bom/${id}` : '/bom';

  return (
    <form onSubmit={handleSubmit} noValidate>
      <PageHeader
        title={mode === 'edit' ? 'Edit bill of materials' : 'New bill of materials'}
        subtitle="Define the materials needed to build one unit of a product."
        actions={
          <>
            <Button to={cancelTo} variant="ghost">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create BOM'}
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
        <Card title="Product">
          <div className="form-grid">
            <Field label="Product name" required error={errors.fields.productName}>
              <input
                className={`input ${errors.fields.productName ? 'has-error' : ''}`}
                placeholder="e.g. Cast Iron Pump Housing"
                value={draft.productName}
                onChange={(event) => setField('productName', event.target.value)}
              />
            </Field>
            <Field label="Product code" hint="Used to match inquiry lines">
              <input
                className="input"
                placeholder="e.g. PH-450"
                value={draft.productCode}
                onChange={(event) => setField('productCode', event.target.value)}
              />
            </Field>
            <Field label="Output unit" hint="The recipe yields 1 of this">
              <select
                className="select"
                value={draft.outputUnit}
                onChange={(event) => setField('outputUnit', event.target.value)}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select className="select" value={draft.status} onChange={(event) => setField('status', event.target.value)}>
                {BOM_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card
          title="Components (per unit)"
          actions={
            <Button type="button" variant="secondary" size="sm" onClick={addComponent}>
              + Add component
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
                  <th className="num">Qty per unit</th>
                  <th>Unit</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {draft.components.map((component) => (
                  <tr key={component.id}>
                    <td>
                      <input
                        className="input"
                        placeholder="Material name"
                        value={component.materialName}
                        onChange={(event) => setComponent(component.id, { materialName: event.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="input"
                        style={{ width: 110 }}
                        placeholder="Code"
                        value={component.materialCode}
                        onChange={(event) => setComponent(component.id, { materialCode: event.target.value })}
                      />
                    </td>
                    <td className="num">
                      <input
                        className="input"
                        style={{ width: 110, textAlign: 'right' }}
                        type="number"
                        min="0"
                        step="any"
                        value={component.quantityPerUnit}
                        onChange={(event) => setComponent(component.id, { quantityPerUnit: event.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 90 }}
                        value={component.unit}
                        onChange={(event) => setComponent(component.id, { unit: event.target.value })}
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
                        title="Remove component"
                        onClick={() => removeComponent(component.id)}
                        disabled={draft.components.length === 1}
                      >
                        ✕
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
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create BOM'}
          </Button>
        </div>
      </div>
    </form>
  );
}

import { useState } from 'react';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import StockTable from './StockTable';
import { AddIcon } from '../../../shared/components/icons';
import { UNITS } from '../../inquiry/inquiry.constants';

const blankDraft = (unit) => ({ code: '', name: '', unit, onHand: '' });

/**
 * One inventory tab: the editable stock table plus an inline "add item" form.
 * The add button lives in the card header and toggles the form; on submit it
 * calls `onAdd` with the new record (its code/SKU field keyed by `codeKey`),
 * and the caller refreshes the list.
 */
export default function StockSection({
  items,
  codeKey,
  codeLabel,
  itemLabel,
  defaultUnit = 'pcs',
  onSave,
  onAdd,
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(() => blankDraft(defaultUnit));
  const [saving, setSaving] = useState(false);

  const set = (field) => (event) => setDraft((current) => ({ ...current, [field]: event.target.value }));

  function reset() {
    setDraft(blankDraft(defaultUnit));
    setAdding(false);
  }

  async function submit(event) {
    event.preventDefault();
    if (!draft.name.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd({
        [codeKey]: draft.code.trim(),
        name: draft.name.trim(),
        unit: draft.unit,
        onHand: Number(draft.onHand) || 0,
      });
      reset();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card
      bodyFlush
      actions={
        adding ? null : (
          <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
            <AddIcon /> Add {itemLabel}
          </Button>
        )
      }
    >
      {adding ? (
        <form className="stock-add" onSubmit={submit}>
          <div className="field">
            <label className="field__label">{codeLabel}</label>
            <input
              className="input"
              value={draft.code}
              onChange={set('code')}
              placeholder={codeLabel === 'SKU' ? 'e.g. PH-450' : 'e.g. CI-FG260'}
            />
          </div>
          <div className="field">
            <label className="field__label">
              Name <span className="req">*</span>
            </label>
            <input className="input" value={draft.name} onChange={set('name')} autoFocus />
          </div>
          <div className="field">
            <label className="field__label">Unit</label>
            <select className="select" value={draft.unit} onChange={set('unit')}>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label">On hand</label>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={draft.onHand}
              onChange={set('onHand')}
              placeholder="0"
            />
          </div>
          <div className="stock-add__actions">
            <Button type="submit" variant="primary" size="sm" disabled={!draft.name.trim() || saving}>
              <AddIcon /> {saving ? 'Adding…' : 'Add'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <StockTable items={items} codeKey={codeKey} codeLabel={codeLabel} onSave={onSave} />
    </Card>
  );
}

import { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Field from '../../../shared/components/Field';
import Input from '../../../shared/components/Input';
import Select from '../../../shared/components/Select';
import StockTable from './StockTable';
import { AddIcon } from '../../../shared/components/icons';
import { UNITS } from '../../inquiry/inquiry.constants';

const blankDraft = (unit) => ({ code: '', name: '', unit, onHand: '' });

/**
 * One inventory tab: the editable stock table plus an "add item" popup.
 * The card-header button opens a modal <Dialog>; on submit it calls `onAdd`
 * with the new record (its code/SKU field keyed by `codeKey`) and the caller
 * refreshes the list. The dialog stays open if the add fails, for a retry.
 */
export default function StockSection({
  items,
  codeKey,
  codeLabel,
  itemLabel,
  title,
  defaultUnit = 'pcs',
  onSave,
  onAdd,
  onDelete,
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(() => blankDraft(defaultUnit));
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  // Unique per section so the finished-goods and raw-materials forms never
  // collide on the id the footer's submit button points at via `form=`.
  const formId = `stock-add-${codeKey}`;

  const set = (field) => (event) => {
    if (field === 'name') setNameError(''); // clear the dup-name warning as they edit
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  function open() {
    setDraft(blankDraft(defaultUnit));
    setNameError('');
    setAdding(true);
  }

  function close() {
    if (saving) return; // don't let Escape / the mask close the dialog mid-save
    setDraft(blankDraft(defaultUnit));
    setNameError('');
    setAdding(false);
  }

  async function submit(event) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name || saving) return;
    // Reject a duplicate name (case-insensitive) before hitting the API. The
    // backend enforces this too, but catching it here keeps the error inline.
    if (items.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) {
      setNameError(`A ${itemLabel} named "${name}" already exists.`);
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        [codeKey]: draft.code.trim(),
        name,
        unit: draft.unit,
        onHand: Number(draft.onHand) || 0,
      });
      setDraft(blankDraft(defaultUnit));
      setAdding(false);
    } catch {
      // onAdd surfaces its own error toast; keep the dialog open for a retry.
    } finally {
      setSaving(false);
    }
  }

  const footer = (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={close} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" form={formId} variant="primary" size="sm" disabled={!draft.name.trim() || saving}>
        <AddIcon /> {saving ? 'Adding…' : 'Add'}
      </Button>
    </>
  );

  return (
    <Card
      bodyFlush
      title={`${title ?? itemLabel} (${items.length})`}
      actions={
        <Button variant="primary" size="sm" onClick={open}>
          <AddIcon /> Add {itemLabel}
        </Button>
      }
    >
      <Dialog
        visible={adding}
        onHide={close}
        header={`Add ${itemLabel}`}
        footer={footer}
        className="stock-dialog"
        modal
        draggable={false}
      >
        <form id={formId} className="flex flex-col gap-[15px]" onSubmit={submit}>
          <Field label={codeLabel} htmlFor={`${formId}-code`}>
            <Input
              id={`${formId}-code`}
              value={draft.code}
              onChange={set('code')}
              placeholder={codeKey === 'sku' ? 'e.g. PH-450' : 'e.g. CI-FG260'}
            />
          </Field>
          <Field label="Name" required htmlFor={`${formId}-name`} error={nameError}>
            <Input
              id={`${formId}-name`}
              invalid={Boolean(nameError)}
              value={draft.name}
              onChange={set('name')}
              aria-invalid={nameError ? true : undefined}
              autoFocus
            />
          </Field>
          <div className="grid grid-cols-2 gap-3.5">
            <Field label="Unit" htmlFor={`${formId}-unit`}>
              <Select
                id={`${formId}-unit`}
                value={draft.unit}
                onChange={set('unit')}
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="On hand" htmlFor={`${formId}-onhand`}>
              <Input
                id={`${formId}-onhand`}
                type="number"
                min="0"
                step="any"
                value={draft.onHand}
                onChange={set('onHand')}
                placeholder="0"
              />
            </Field>
          </div>
        </form>
      </Dialog>

      <StockTable items={items} codeKey={codeKey} codeLabel={codeLabel} onSave={onSave} onDelete={onDelete} />
    </Card>
  );
}

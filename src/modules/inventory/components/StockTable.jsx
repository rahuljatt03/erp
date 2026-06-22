import { useEffect, useState } from 'react';
import { formatNumber } from '../../../shared/utils/format';
import { DeleteIcon } from '../../../shared/components/icons';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

/**
 * One editable stock row. Holds the in-progress value locally and commits on
 * blur / Enter, so typing stays smooth and we only hit the service on commit.
 */
function StockRow({ item, codeKey, onSave, onDelete }) {
  const [value, setValue] = useState(String(item.onHand));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setValue(String(item.onHand));
  }, [item.onHand]);

  async function handleDelete() {
    setDeleting(true);
    try {
      // The caller confirms first and surfaces its own toast; on success the
      // list refetches and this row unmounts.
      await onDelete(item);
    } finally {
      setDeleting(false);
    }
  }

  async function commit() {
    if (Number(value) === Number(item.onHand)) return;
    setSaving(true);
    try {
      await onSave(item.id, Number(value) || 0);
    } catch {
      // The caller surfaces an error toast; keep the edited value for retry.
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td className="!font-mono !text-[13px] !text-indigo-700">{item[codeKey]}</td>
      <td className="!font-semibold !text-slate-900">{item.name}</td>
      <td>{item.unit}</td>
      <td>
        <div className="flex items-center gap-2">
          <Input
            className="w-28"
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
          {saving ? <span className="text-[13px] text-slate-500">saving…</span> : null}
        </div>
      </td>
      <td className="!text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          title={`Delete ${item.name}`}
          aria-label={`Delete ${item.name}`}
          onClick={handleDelete}
          disabled={deleting}
        >
          <DeleteIcon size={15} />
        </Button>
      </td>
    </tr>
  );
}

/**
 * Editable stock table.
 * @param {object} props
 * @param {Array} props.items
 * @param {string} props.codeKey   field used for the first ("code") column
 * @param {string} props.codeLabel header for that column
 * @param {(id: string, onHand: number) => Promise<unknown>} props.onSave
 * @param {(item: object) => Promise<unknown>} props.onDelete  confirms + deletes the row
 */
export default function StockTable({ items, codeKey, codeLabel, onSave, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
        <thead>
          <tr>
            <th className="w-1/5">{codeLabel}</th>
            <th className="w-1/5">Name</th>
            <th className="w-1/5">Unit</th>
            <th className="w-1/5">On hand</th>
            <th className="w-1/5 !text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <StockRow key={item.id} item={item} codeKey={codeKey} onSave={onSave} onDelete={onDelete} />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="!text-[13px] !text-slate-500">
              {items.length} item{items.length === 1 ? '' : 's'}
            </td>
            <td className="!text-[13px] !text-slate-500">
              {formatNumber(items.reduce((sum, item) => sum + (Number(item.onHand) || 0), 0))} total
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

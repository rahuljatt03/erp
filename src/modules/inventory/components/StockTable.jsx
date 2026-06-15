import { useEffect, useState } from 'react';
import { formatNumber } from '../../../shared/utils/format';

/**
 * One editable stock row. Holds the in-progress value locally and commits on
 * blur / Enter, so typing stays smooth and we only hit the service on commit.
 */
function StockRow({ item, codeKey, onSave }) {
  const [value, setValue] = useState(String(item.onHand));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(String(item.onHand));
  }, [item.onHand]);

  async function commit() {
    if (Number(value) === Number(item.onHand)) return;
    setSaving(true);
    setSaved(false);
    try {
      await onSave(item.id, Number(value) || 0);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td className="cell-mono">{item[codeKey]}</td>
      <td className="cell-strong">{item.name}</td>
      <td>{item.unit}</td>
      <td className="num">
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          {saving ? <span className="muted text-sm">saving…</span> : null}
          {saved && !saving ? <span className="text-success text-sm">✓ saved</span> : null}
          <input
            className="input"
            style={{ width: 120, textAlign: 'right' }}
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setSaved(false);
            }}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
          />
        </div>
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
 */
export default function StockTable({ items, codeKey, codeLabel, onSave }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>{codeLabel}</th>
            <th>Name</th>
            <th>Unit</th>
            <th className="num">On hand</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <StockRow key={item.id} item={item} codeKey={codeKey} onSave={onSave} />
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} className="muted text-sm">
              {items.length} item{items.length === 1 ? '' : 's'}
            </td>
            <td className="num muted text-sm">
              {formatNumber(items.reduce((sum, item) => sum + (Number(item.onHand) || 0), 0))} total
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

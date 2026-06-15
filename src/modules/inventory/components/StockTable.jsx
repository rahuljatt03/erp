import { useEffect, useState } from 'react';
import { formatNumber } from '../../../shared/utils/format';
import { CheckIcon } from '../../../shared/components/icons';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';

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
    <TableRow>
      <TableCell className="font-mono text-xs">{item[codeKey]}</TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {saving ? <span className="text-muted-foreground text-sm">saving…</span> : null}
          {saved && !saving ? (
            <span className="text-green-600 text-sm"><CheckIcon size={13} /> saved</span>
          ) : null}
          <Input
            className="w-28 text-right"
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
      </TableCell>
    </TableRow>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{codeLabel}</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className="text-right">On hand</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <StockRow key={item.id} item={item} codeKey={codeKey} onSave={onSave} />
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-muted-foreground text-sm">
            {items.length} item{items.length === 1 ? '' : 's'}
          </TableCell>
          <TableCell className="text-right text-muted-foreground text-sm">
            {formatNumber(items.reduce((sum, item) => sum + (Number(item.onHand) || 0), 0))} total
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

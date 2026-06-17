import { useEffect, useState } from 'react';
import { formatNumber } from '../../../shared/utils/format';
import { CheckIcon, DeleteIcon } from '../../../shared/components/icons';
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
import { Button } from '@/components/ui/button';

/**
 * One editable stock row. Holds the in-progress value locally and commits on
 * blur / Enter, so typing stays smooth and we only hit the service on commit.
 */
function StockRow({ item, codeKey, onSave, onDelete }) {
  const [value, setValue] = useState(String(item.onHand));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
    try {
      await onSave(item.id, Number(value) || 0);
      setSaved(true);
    } catch {
      // The caller surfaces an error toast; keep the edited value for retry
      // and don't flash the "saved" tick.
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
      <TableCell className="w-12 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-8"
          title={`Delete ${item.name}`}
          aria-label={`Delete ${item.name}`}
          onClick={handleDelete}
          disabled={deleting}
        >
          <DeleteIcon size={15} />
        </Button>
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
 * @param {(item: object) => Promise<unknown>} props.onDelete  confirms + deletes the row
 */
export default function StockTable({ items, codeKey, codeLabel, onSave, onDelete }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{codeLabel}</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className="text-right">On hand</TableHead>
          <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <StockRow key={item.id} item={item} codeKey={codeKey} onSave={onSave} onDelete={onDelete} />
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
          <TableCell className="w-12" />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

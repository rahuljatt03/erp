import { useEffect, useState } from 'react';
import { formatNumber } from '../../../shared/utils/format';
import { DeleteIcon } from '../../../shared/components/icons';
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
    <TableRow>
      <TableCell className="px-6 font-mono text-xs">{item[codeKey]}</TableCell>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell>
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
          {saving ? <span className="text-muted-foreground text-sm">saving…</span> : null}
        </div>
      </TableCell>
      <TableCell className="px-6 text-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 size-8"
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
          <TableHead className="w-1/5 px-6">{codeLabel}</TableHead>
          <TableHead className="w-1/5">Name</TableHead>
          <TableHead className="w-1/5">Unit</TableHead>
          <TableHead className="w-1/5">On hand</TableHead>
          <TableHead className="w-1/5 px-6 text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <StockRow key={item.id} item={item} codeKey={codeKey} onSave={onSave} onDelete={onDelete} />
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="px-6 text-muted-foreground text-sm">
            {items.length} item{items.length === 1 ? '' : 's'}
          </TableCell>
          <TableCell className="text-muted-foreground text-sm">
            {formatNumber(items.reduce((sum, item) => sum + (Number(item.onHand) || 0), 0))} total
          </TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}

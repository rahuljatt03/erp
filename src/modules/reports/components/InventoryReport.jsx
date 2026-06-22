import { useMemo } from 'react';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { DownloadIcon } from '../../../shared/components/icons';
import { formatNumber } from '../../../shared/utils/format';
import { inventoryReport } from '../reports.metrics';
import { toCsv, downloadCsv } from '../reports.csv';
import ReportSummary from './ReportSummary';
import ReportTable from './ReportTable';

const StockStatus = ({ status }) =>
  status === 'out' ? <Badge tone="danger">Out of stock</Badge> : <Badge tone="success">In stock</Badge>;

/** A finished-goods / raw-materials stock card with its own CSV export. */
function StockCard({ title, codeLabel, rows, filename }) {
  const exportCsv = () => {
    const csv = toCsv(
      [
        { label: codeLabel, value: (row) => row.code },
        { label: 'Name', value: (row) => row.name },
        { label: 'Unit', value: (row) => row.unit },
        { label: 'On hand', value: (row) => row.onHand },
        { label: 'Status', value: (row) => (row.status === 'out' ? 'Out of stock' : 'In stock') },
      ],
      rows,
    );
    downloadCsv(filename, csv);
  };

  return (
    <Card
      title={title}
      actions={
        <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!rows.length}>
          <DownloadIcon /> Export CSV
        </Button>
      }
      bodyFlush
    >
      <ReportTable
        columns={[
          { key: 'code', label: codeLabel, render: (row) => <span className="!font-mono !text-[13px] !text-indigo-700">{row.code}</span> },
          { key: 'name', label: 'Name', render: (row) => <span className="!font-semibold !text-slate-900">{row.name}</span> },
          { key: 'unit', label: 'Unit' },
          { key: 'onHand', label: 'On hand', align: 'num', render: (row) => formatNumber(row.onHand) },
          { key: 'status', label: 'Status', render: (row) => <StockStatus status={row.status} /> },
        ]}
        rows={rows}
        emptyText="No stock items."
      />
    </Card>
  );
}

export default function InventoryReport({ finishedGoods, rawMaterials }) {
  const report = useMemo(
    () => inventoryReport({ finishedGoods, rawMaterials }),
    [finishedGoods, rawMaterials],
  );
  const s = report.summary;

  return (
    <div className="flex flex-col gap-4">
      <ReportSummary
        items={[
          { label: 'Finished SKUs', value: formatNumber(s.fgSkus), meta: `${formatNumber(s.fgUnits)} units on hand` },
          { label: 'Raw material SKUs', value: formatNumber(s.rawSkus), meta: `${formatNumber(s.rawUnits)} units on hand` },
          {
            label: 'Out of stock',
            value: formatNumber(s.outOfStock),
            tone: s.outOfStock > 0 ? 'danger' : 'success',
            meta: s.outOfStock > 0 ? 'items at zero on-hand' : 'all items in stock',
          },
        ]}
      />

      <p className="text-[13px] text-slate-500">
        Inventory is a live snapshot of current stock — the date range above doesn’t apply here.
      </p>

      <StockCard
        title="Finished goods"
        codeLabel="SKU"
        rows={report.finishedGoods}
        filename="inventory-report_finished-goods.csv"
      />
      <StockCard
        title="Raw materials"
        codeLabel="Code"
        rows={report.rawMaterials}
        filename="inventory-report_raw-materials.csv"
      />
    </div>
  );
}

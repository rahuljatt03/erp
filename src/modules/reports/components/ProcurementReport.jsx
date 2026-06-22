import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { DownloadIcon } from '../../../shared/components/icons';
import { formatDate, formatNumber } from '../../../shared/utils/format';
import { getPoStatusMeta } from '../../procurement/procurement.constants';
import { procurementReport } from '../reports.metrics';
import { toCsv, downloadCsv } from '../reports.csv';
import ReportSummary from './ReportSummary';
import ReportTable from './ReportTable';

export default function ProcurementReport({ purchaseOrders, range }) {
  const navigate = useNavigate();
  const report = useMemo(() => procurementReport({ purchaseOrders }, range), [purchaseOrders, range]);
  const s = report.summary;

  const exportCsv = () => {
    const csv = toCsv(
      [
        { label: 'PO No.', value: (row) => row.poNo },
        { label: 'Order date', value: (row) => row.date },
        { label: 'Supplier', value: (row) => row.supplier },
        { label: 'Status', value: (row) => getPoStatusMeta(row.status).label },
        { label: 'Value', value: (row) => row.value },
        { label: 'Receipt %', value: (row) => row.receiptPct },
      ],
      report.rows,
    );
    downloadCsv(`procurement-report_${range.from || 'all'}_${range.to || 'all'}.csv`, csv);
  };

  return (
    <div className="flex flex-col gap-4">
      <ReportSummary
        items={[
          { label: 'Purchase orders', value: formatNumber(s.orderCount) },
          { label: 'Purchase value', value: formatNumber(s.totalValue) },
          {
            label: 'Lines received',
            value: `${s.receiptPct}%`,
            meta: `${formatNumber(s.linesReceived)} of ${formatNumber(s.lines)} lines`,
          },
          {
            label: 'Outstanding value',
            value: formatNumber(s.outstandingValue),
            tone: s.outstandingValue > 0 ? 'warning' : undefined,
            meta: 'not yet received',
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Spend by status" bodyFlush>
          <ReportTable
            columns={[
              { key: 'label', label: 'Status', render: (row) => <Badge tone={row.tone}>{row.label}</Badge> },
              { key: 'count', label: 'POs', align: 'num', render: (row) => formatNumber(row.count) },
              { key: 'value', label: 'Value', align: 'num', render: (row) => formatNumber(row.value) },
            ]}
            rows={report.byStatus}
            getRowKey={(row) => row.key}
          />
        </Card>

        <Card title="Top suppliers" bodyFlush>
          <ReportTable
            columns={[
              { key: 'label', label: 'Supplier', render: (row) => <span className="!font-semibold !text-slate-900">{row.label}</span> },
              { key: 'count', label: 'POs', align: 'num', render: (row) => formatNumber(row.count) },
              { key: 'value', label: 'Value', align: 'num', render: (row) => formatNumber(row.value) },
            ]}
            rows={report.topSuppliers}
            getRowKey={(row) => row.key}
          />
        </Card>
      </div>

      <Card
        title="Purchase orders"
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!report.rows.length}>
            <DownloadIcon /> Export CSV
          </Button>
        }
        bodyFlush
      >
        <ReportTable
          columns={[
            { key: 'poNo', label: 'PO No.', render: (row) => <span className="!font-mono !text-[13px] !text-indigo-700">{row.poNo}</span> },
            { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
            { key: 'supplier', label: 'Supplier', render: (row) => <span className="!font-semibold !text-slate-900">{row.supplier}</span> },
            {
              key: 'status',
              label: 'Status',
              render: (row) => {
                const meta = getPoStatusMeta(row.status);
                return <Badge tone={meta.tone}>{meta.label}</Badge>;
              },
            },
            { key: 'value', label: 'Value', align: 'num', render: (row) => formatNumber(row.value) },
            { key: 'receiptPct', label: 'Received', align: 'num', render: (row) => `${row.receiptPct}%` },
          ]}
          rows={report.rows}
          onRowClick={(row) => navigate(`/purchase-orders/${row.id}`)}
          emptyText="No purchase orders in this date range."
        />
      </Card>
    </div>
  );
}

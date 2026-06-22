import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { DownloadIcon } from '../../../shared/components/icons';
import { formatDate, formatNumber } from '../../../shared/utils/format';
import { getWoStatusMeta } from '../../production/production.constants';
import { productionReport } from '../reports.metrics';
import { toCsv, downloadCsv } from '../reports.csv';
import ReportSummary from './ReportSummary';
import ReportTable from './ReportTable';

export default function ProductionReport({ workOrders, range }) {
  const navigate = useNavigate();
  const report = useMemo(() => productionReport({ workOrders }, range), [workOrders, range]);
  const s = report.summary;

  const exportCsv = () => {
    const csv = toCsv(
      [
        { label: 'WO No.', value: (row) => row.woNo },
        { label: 'Created', value: (row) => row.date },
        { label: 'Product', value: (row) => row.product },
        { label: 'Status', value: (row) => getWoStatusMeta(row.status).label },
        { label: 'Ordered', value: (row) => row.ordered },
        { label: 'Produced', value: (row) => row.produced },
        { label: 'Completion %', value: (row) => row.completion },
      ],
      report.rows,
    );
    downloadCsv(`production-report_${range.from || 'all'}_${range.to || 'all'}.csv`, csv);
  };

  return (
    <div className="flex flex-col gap-4">
      <ReportSummary
        items={[
          { label: 'Work orders', value: formatNumber(s.orderCount) },
          { label: 'Units ordered', value: formatNumber(s.ordered) },
          {
            label: 'Units produced',
            value: formatNumber(s.produced),
            meta: `${s.completion}% of ordered`,
          },
          { label: 'Active', value: formatNumber(s.active), meta: 'planned / in progress' },
          { label: 'Completed', value: formatNumber(s.completed), tone: s.completed > 0 ? 'success' : undefined },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Output by status" bodyFlush>
          <ReportTable
            columns={[
              { key: 'label', label: 'Status', render: (row) => <Badge tone={row.tone}>{row.label}</Badge> },
              { key: 'count', label: 'WOs', align: 'num', render: (row) => formatNumber(row.count) },
              { key: 'ordered', label: 'Ordered', align: 'num', render: (row) => formatNumber(row.ordered) },
              { key: 'produced', label: 'Produced', align: 'num', render: (row) => formatNumber(row.produced) },
            ]}
            rows={report.byStatus}
            getRowKey={(row) => row.key}
          />
        </Card>

        <Card title="Output by product" bodyFlush>
          <ReportTable
            columns={[
              { key: 'label', label: 'Product', render: (row) => <span className="!font-semibold !text-slate-900">{row.label}</span> },
              { key: 'ordered', label: 'Ordered', align: 'num', render: (row) => formatNumber(row.ordered) },
              { key: 'produced', label: 'Produced', align: 'num', render: (row) => formatNumber(row.produced) },
              { key: 'completion', label: 'Done', align: 'num', render: (row) => `${row.completion}%` },
            ]}
            rows={report.byProduct}
            getRowKey={(row) => row.key}
          />
        </Card>
      </div>

      <Card
        title="Work orders"
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!report.rows.length}>
            <DownloadIcon /> Export CSV
          </Button>
        }
        bodyFlush
      >
        <ReportTable
          columns={[
            { key: 'woNo', label: 'WO No.', render: (row) => <span className="!font-mono !text-[13px] !text-indigo-700">{row.woNo}</span> },
            { key: 'date', label: 'Created', render: (row) => formatDate(row.date) },
            { key: 'product', label: 'Product', render: (row) => <span className="!font-semibold !text-slate-900">{row.product}</span> },
            {
              key: 'status',
              label: 'Status',
              render: (row) => {
                const meta = getWoStatusMeta(row.status);
                return <Badge tone={meta.tone}>{meta.label}</Badge>;
              },
            },
            { key: 'ordered', label: 'Ordered', align: 'num', render: (row) => formatNumber(row.ordered) },
            { key: 'produced', label: 'Produced', align: 'num', render: (row) => formatNumber(row.produced) },
            { key: 'completion', label: 'Done', align: 'num', render: (row) => `${row.completion}%` },
          ]}
          rows={report.rows}
          onRowClick={(row) => navigate(`/production/${row.id}`)}
          emptyText="No work orders in this date range."
        />
      </Card>
    </div>
  );
}

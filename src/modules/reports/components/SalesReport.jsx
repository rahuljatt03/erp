import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import { DownloadIcon } from '../../../shared/components/icons';
import { formatDate, formatNumber } from '../../../shared/utils/format';
import { getSoStatusMeta } from '../../sales/sales.constants';
import { salesReport } from '../reports.metrics';
import { toCsv, downloadCsv } from '../reports.csv';
import ReportSummary from './ReportSummary';
import ReportTable from './ReportTable';

export default function SalesReport({ inquiries, quotes, orders, range }) {
  const navigate = useNavigate();
  const report = useMemo(
    () => salesReport({ inquiries, quotes, orders }, range),
    [inquiries, quotes, orders, range],
  );
  const s = report.summary;

  const exportCsv = () => {
    const csv = toCsv(
      [
        { label: 'SO No.', value: (row) => row.soNo },
        { label: 'Order date', value: (row) => row.date },
        { label: 'Customer', value: (row) => row.customer },
        { label: 'Status', value: (row) => getSoStatusMeta(row.status).label },
        { label: 'Units', value: (row) => row.units },
        { label: 'Value', value: (row) => row.value },
      ],
      report.rows,
    );
    downloadCsv(`sales-report_${range.from || 'all'}_${range.to || 'all'}.csv`, csv);
  };

  return (
    <div className="stack">
      <ReportSummary
        items={[
          { label: 'Sales orders', value: formatNumber(s.orderCount) },
          { label: 'Order value', value: formatNumber(s.orderValue) },
          { label: 'Units sold', value: formatNumber(s.unitsSold) },
          { label: 'Avg order value', value: formatNumber(Math.round(s.avgOrderValue)) },
          {
            label: 'Quotations',
            value: formatNumber(s.quoteCount),
            meta: `${formatNumber(s.quoteValue)} quoted`,
          },
        ]}
      />

      <div className="report-cols">
        <Card title="Orders by status" bodyFlush>
          <ReportTable
            columns={[
              { key: 'label', label: 'Status', render: (row) => <Badge tone={row.tone}>{row.label}</Badge> },
              { key: 'count', label: 'Orders', align: 'num', render: (row) => formatNumber(row.count) },
              { key: 'value', label: 'Value', align: 'num', render: (row) => formatNumber(row.value) },
            ]}
            rows={report.ordersByStatus}
            getRowKey={(row) => row.key}
          />
        </Card>

        <Card title="Top customers" bodyFlush>
          <ReportTable
            columns={[
              { key: 'label', label: 'Customer', render: (row) => <span className="cell-strong">{row.label}</span> },
              { key: 'count', label: 'Orders', align: 'num', render: (row) => formatNumber(row.count) },
              { key: 'value', label: 'Value', align: 'num', render: (row) => formatNumber(row.value) },
            ]}
            rows={report.topCustomers}
            getRowKey={(row) => row.key}
          />
        </Card>
      </div>

      <Card
        title="Sales orders"
        actions={
          <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!report.rows.length}>
            <DownloadIcon /> Export CSV
          </Button>
        }
        bodyFlush
      >
        <ReportTable
          columns={[
            { key: 'soNo', label: 'SO No.', render: (row) => <span className="cell-mono">{row.soNo}</span> },
            { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
            { key: 'customer', label: 'Customer', render: (row) => <span className="cell-strong">{row.customer}</span> },
            {
              key: 'status',
              label: 'Status',
              render: (row) => {
                const meta = getSoStatusMeta(row.status);
                return <Badge tone={meta.tone}>{meta.label}</Badge>;
              },
            },
            { key: 'units', label: 'Units', align: 'num', render: (row) => formatNumber(row.units) },
            { key: 'value', label: 'Value', align: 'num', render: (row) => formatNumber(row.value) },
          ]}
          rows={report.rows}
          onRowClick={(row) => navigate(`/sales-orders/${row.id}`)}
          emptyText="No sales orders in this date range."
        />
      </Card>
    </div>
  );
}

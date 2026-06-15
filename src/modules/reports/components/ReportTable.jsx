/**
 * Generic, declarative report table. Each column declares how to render its cell
 * so report components stay terse; rows can be made clickable for drill-down.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: string, align?: 'num', render?: (row: any) => React.ReactNode }>} props.columns
 * @param {any[]} props.rows
 * @param {(row: any) => string} [props.getRowKey] - defaults to `row.id`
 * @param {(row: any) => void} [props.onRowClick]
 * @param {string} [props.emptyText]
 */
export default function ReportTable({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyText = 'No data for this range.',
}) {
  if (!rows.length) {
    return (
      <div className="state">
        <p className="state__text" style={{ marginBottom: 0 }}>
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.align === 'num' ? 'num' : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey ? getRowKey(row) : row.id}
              className={onRowClick ? 'is-clickable' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'num' ? 'num' : undefined}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

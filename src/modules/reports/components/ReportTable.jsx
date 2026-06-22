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
      <div className="px-6 py-[52px] text-center text-slate-500">
        <p className="text-sm">
          {emptyText}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm [&_td]:border-b [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-[13px] [&_td]:align-middle [&_td]:text-slate-700 [&_th]:whitespace-nowrap [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-[11px] [&_th]:text-left [&_th]:text-[11.5px] [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-[0.5px] [&_th]:text-slate-500 [&_tbody_tr:last-child_td]:border-b-0">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.align === 'num' ? '!text-right' : undefined}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey ? getRowKey(row) : row.id}
              className={onRowClick ? 'cursor-pointer hover:bg-indigo-50' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.align === 'num' ? '!text-right tabular-nums' : undefined}>
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

/**
 * Compact KPI grid for a report header. Reuses the dashboard's `.stat` cards.
 * @param {object} props
 * @param {Array<{ label: string, value: React.ReactNode, meta?: React.ReactNode, tone?: 'success'|'danger'|'warning' }>} props.items
 */
export default function ReportSummary({ items }) {
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <div className="stat__label">{item.label}</div>
          <div className={`stat__value${item.tone ? ` text-${item.tone}` : ''}`}>{item.value}</div>
          {item.meta ? <div className="stat__meta">{item.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}

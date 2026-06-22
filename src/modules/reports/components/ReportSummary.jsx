/**
 * Compact KPI grid for a report header. Reuses the dashboard's `.stat` cards.
 * @param {object} props
 * @param {Array<{ label: string, value: React.ReactNode, meta?: React.ReactNode, tone?: 'success'|'danger'|'warning' }>} props.items
 */
const TONE_TEXT = {
  success: 'text-green-600',
  danger: 'text-red-600',
  warning: 'text-amber-600',
};

export default function ReportSummary({ items }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      {items.map((item) => (
        <div className="rounded-card border border-slate-200 bg-white p-5 shadow-card" key={item.label}>
          <div className="text-[13px] font-medium text-slate-500">{item.label}</div>
          <div className={`mt-1.5 text-[28px] font-bold tabular-nums ${item.tone ? TONE_TEXT[item.tone] : 'text-slate-900'}`}>{item.value}</div>
          {item.meta ? <div className="mt-1 text-xs text-slate-500">{item.meta}</div> : null}
        </div>
      ))}
    </div>
  );
}

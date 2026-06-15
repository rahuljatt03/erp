/**
 * Date-range controls shared by the dated report tabs (Sales / Production /
 * Procurement). Offers explicit from/to inputs plus quick presets. Dates are
 * built from local calendar fields (not `toISOString`) to avoid a timezone
 * off-by-one on the first-of-period boundaries.
 */
import Button from '../../../shared/components/Button';

const pad = (n) => String(n).padStart(2, '0');
const isoLocal = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** The range the Reports page opens on: year-to-date. */
export function defaultRange() {
  const now = new Date();
  return { from: `${now.getFullYear()}-01-01`, to: isoLocal(now) };
}

const PRESETS = [
  { key: 'month', label: 'This month' },
  { key: 'quarter', label: 'This quarter' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'all', label: 'All time' },
];

function computePreset(key) {
  const now = new Date();
  const today = isoLocal(now);
  const year = now.getFullYear();
  if (key === 'month') return { from: isoLocal(new Date(year, now.getMonth(), 1)), to: today };
  if (key === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
    return { from: isoLocal(new Date(year, quarterStartMonth, 1)), to: today };
  }
  if (key === 'ytd') return { from: `${year}-01-01`, to: today };
  return { from: '', to: '' }; // all time
}

export default function ReportFilters({ range, onChange }) {
  return (
    <div className="report-filters">
      <div className="report-filters__dates">
        <label className="report-filters__field">
          <span>From</span>
          <input
            type="date"
            className="input"
            value={range.from}
            max={range.to || undefined}
            onChange={(event) => onChange({ ...range, from: event.target.value })}
          />
        </label>
        <label className="report-filters__field">
          <span>To</span>
          <input
            type="date"
            className="input"
            value={range.to}
            min={range.from || undefined}
            onChange={(event) => onChange({ ...range, to: event.target.value })}
          />
        </label>
      </div>
      <div className="report-filters__presets">
        {PRESETS.map((preset) => (
          <Button
            key={preset.key}
            variant="secondary"
            size="sm"
            onClick={() => onChange(computePreset(preset.key))}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

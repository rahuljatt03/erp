import { useEffect, useMemo, useRef, useState } from "react";
import Button from "../../shared/components/Button";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../shared/components/icons";

/* ---- Local date helpers ------------------------------------------------- */
/* Build ISO `yyyy-mm-dd` strings from local calendar fields (never
   `toISOString`) so a range never shifts a day across the UTC boundary.
   ISO strings compare chronologically with plain `<`/`>=`. */
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const firstOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* Quick presets, each computing a {from, to} range relative to `today`.
   Order matches the menu (mirrors a typical analytics date picker). */
const PRESETS = [
  { key: "all", label: "All time", range: () => ({ from: "", to: "" }) },
  { key: "today", label: "Today", range: (t) => ({ from: iso(t), to: iso(t) }) },
  {
    key: "yesterday",
    label: "Yesterday",
    range: (t) => { const y = addDays(t, -1); return { from: iso(y), to: iso(y) }; },
  },
  {
    key: "week",
    label: "This week (Sun – Today)",
    range: (t) => ({ from: iso(addDays(t, -t.getDay())), to: iso(t) }),
  },
  { key: "last7", label: "Last 7 days", range: (t) => ({ from: iso(addDays(t, -6)), to: iso(t) }) },
  { key: "last28", label: "Last 28 days", range: (t) => ({ from: iso(addDays(t, -27)), to: iso(t) }) },
  { key: "last30", label: "Last 30 days", range: (t) => ({ from: iso(addDays(t, -29)), to: iso(t) }) },
  {
    key: "month",
    label: "This month",
    range: (t) => ({ from: iso(firstOfMonth(t)), to: iso(t) }),
  },
  {
    key: "lastmonth",
    label: "Last month",
    range: (t) => ({
      from: iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)),
      to: iso(new Date(t.getFullYear(), t.getMonth(), 0)), // day 0 = last day of prev month
    }),
  },
  { key: "last90", label: "Last 90 days", range: (t) => ({ from: iso(addDays(t, -89)), to: iso(t) }) },
];

/** The range the dashboard opens on: all time (no date restriction). */
export function defaultRange() {
  return PRESETS.find((p) => p.key === "all").range(new Date());
}

/** Human label for the trigger button, e.g. `Jun 1 – Jun 18, 2026`. */
function formatLabel({ from, to } = {}) {
  if (!from && !to) return "All time";
  if (!from || !to) return "Select dates";
  const f = parse(from);
  const t = parse(to);
  const md = { month: "short", day: "numeric" };
  const end = t.toLocaleDateString("en-US", { ...md, year: "numeric" });
  if (from === to) return end;
  const sameYear = f.getFullYear() === t.getFullYear();
  const start = f.toLocaleDateString("en-US", sameYear ? md : { ...md, year: "numeric" });
  return `${start} – ${end}`;
}

/** Friendly single-date label for the read-only start/end fields, e.g. `May 12, 2026`. */
function formatField(s) {
  if (!s) return "";
  return parse(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** First-of-month for the range's `to` (or `from`, or today) — what the calendar opens on. */
function viewMonthFor(range) {
  const base = range?.to ? parse(range.to) : range?.from ? parse(range.from) : new Date();
  return firstOfMonth(base);
}

/** Flat list of calendar cells for `monthStart`: leading/trailing blanks (null) pad to full weeks. */
function buildCells(monthStart) {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const lead = new Date(year, month, 1).getDay(); // 0 = Sunday
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= days; d += 1) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Date-range picker — a button showing the selected range that opens a dropdown
 * with quick presets (left) and a calendar + start/end inputs (right), plus
 * Cancel / Apply. Controlled: the parent owns the applied `value` ({from, to});
 * edits stay in a local draft until Apply. Self-contained: owns its open state
 * and closes on outside-click or Escape (mirrors ManageWidgets).
 */
export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [view, setView] = useState(() => viewMonthFor(value));
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Which preset (if any) the current draft matches — drives the highlight.
  const activeKey = useMemo(() => {
    const now = new Date();
    const match = PRESETS.find((p) => {
      const r = p.range(now);
      return r.from === draft.from && r.to === draft.to;
    });
    return match ? match.key : "custom";
  }, [draft]);

  const cells = useMemo(() => buildCells(view), [view]);
  const todayIso = iso(new Date());
  // Valid to apply when the range is complete (both ends) or "all time" (neither);
  // only a half-filled range (one end) blocks Apply.
  const canApply = Boolean(draft.from) === Boolean(draft.to);

  const openPanel = () => {
    setDraft(value); // start from the applied range each time it opens
    setView(viewMonthFor(value));
    setOpen(true);
  };
  const applyPreset = (preset) => {
    const r = preset.range(new Date());
    setDraft(r);
    setView(viewMonthFor(r));
  };
  // Calendar click: first click starts a new range, second completes it
  // (auto-ordering the two endpoints).
  const pickDay = (dayIso) =>
    setDraft((cur) => {
      if (!cur.from || (cur.from && cur.to)) return { from: dayIso, to: "" };
      return dayIso < cur.from
        ? { from: dayIso, to: cur.from }
        : { from: cur.from, to: dayIso };
    });
  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <div className="date-picker" ref={ref}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalendarIcon /> {formatLabel(value)} <ChevronDownIcon />
      </Button>

      {open ? (
        <div className="date-picker__panel" role="dialog" aria-label="Select date range">
          <div className="date-picker__presets">
            <button
              type="button"
              className={`date-picker__preset${activeKey === "custom" ? " is-active" : ""}`}
            >
              Custom
            </button>
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={`date-picker__preset${activeKey === preset.key ? " is-active" : ""}`}
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="date-picker__cal">
            <div className="date-picker__dates">
              <label className="date-picker__field">
                <span>Start date</span>
                <input
                  type="text"
                  className="input"
                  readOnly
                  placeholder="Any date"
                  value={formatField(draft.from)}
                />
              </label>
              <span className="date-picker__dash">–</span>
              <label className="date-picker__field">
                <span>End date</span>
                <input
                  type="text"
                  className="input"
                  readOnly
                  placeholder="Any date"
                  value={formatField(draft.to)}
                />
              </label>
            </div>

            <div className="date-picker__cal-head">
              <button
                type="button"
                className="date-picker__nav"
                aria-label="Previous month"
                onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
              >
                <ChevronLeftIcon />
              </button>
              <span className="date-picker__month">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </span>
              <button
                type="button"
                className="date-picker__nav"
                aria-label="Next month"
                onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
              >
                <ChevronRightIcon />
              </button>
            </div>

            <div className="date-picker__grid">
              {WEEKDAYS.map((d, i) => (
                <span key={i} className="date-picker__dow">{d}</span>
              ))}
            </div>
            <div className="date-picker__grid">
              {cells.map((cell, i) => {
                if (!cell) return <span key={i} className="date-picker__day is-empty" />;
                const ds = iso(cell);
                const endpoint = ds === draft.from || ds === draft.to;
                const inRange = draft.from && draft.to && ds >= draft.from && ds <= draft.to;
                const cls = ["date-picker__day"];
                if (inRange) cls.push("in-range");
                if (endpoint) cls.push("is-endpoint");
                if (ds === todayIso) cls.push("is-today");
                return (
                  <button
                    key={i}
                    type="button"
                    className={cls.join(" ")}
                    onClick={() => pickDay(ds)}
                  >
                    {cell.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="date-picker__footer">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={apply} disabled={!canApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

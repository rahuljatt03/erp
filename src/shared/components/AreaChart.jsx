import { useState } from "react";

/**
 * Lightweight, dependency-free area chart (SVG). Overlays one gradient-filled
 * area + line per series over a shared category axis, with a horizontal grid,
 * an HTML legend, and a hover tooltip that reports each series' value at the
 * hovered category. Themed via CSS variables so it matches the design system
 * (pass series colors as `var(--…)` tokens). Hand it ready-shaped data.
 *
 *   <AreaChart
 *     id="sales"
 *     data={[{ label: "Jan", a: 320, b: 180 }, …]}
 *     series={[{ key: "a", label: "Orders", color: "var(--success)" }, …]}
 *   />
 *
 * A unique `id` is required — it namespaces the SVG gradient ids so multiple
 * charts on one page don't collide.
 *
 * Forecast overlay: a series may be a projection rather than measured data —
 * mark it `{ forecast: true, band: { hi, lo } }` (usually a matching color).
 * Such a series draws a DASHED line plus a shaded high/low band (between its
 * `band.hi` / `band.lo` keys) instead of a fill-to-baseline area, and is kept
 * out of the legend (a single "Forecast" hint shows instead). Series values may
 * be `null`/absent on some rows — those points are skipped (a gap), so the
 * measured line can stop where the forecast picks up. Pass `forecastFrom` (the
 * category index where the forecast begins) to draw a seam and to suppress the
 * forecast tooltip on the shared bridge point.
 */

/** Round an axis max up to a clean value divisible into `ticks` even steps. */
function niceScale(max, ticks = 4) {
  if (!isFinite(max) || max <= 0) return { max: ticks, step: 1, ticks };
  const rawStep = max / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  const step = niceNorm * mag;
  return { max: step * ticks, step, ticks };
}

const fmtTick = (n) => {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return `${n}`;
};

/** Coerce to a finite number, or null when missing — lets a series have gaps. */
const num = (v) => {
  if (v == null) return null;
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function AreaChart({
  id,
  data = [],
  series = [],
  height = 260,
  formatValue = (v) => v.toLocaleString(),
  tooltipTitle = (point) => point.label,
  forecastFrom = null,
}) {
  const [hover, setHover] = useState(null);

  const W = 560;
  const H = height;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = data.length;

  // Largest value across every series — including forecast band edges, so the
  // high/low cone is never clipped by the y-scale.
  const valuesOf = (d, s) => {
    const out = [num(d[s.key])];
    if (s.band) out.push(num(d[s.band.hi]), num(d[s.band.lo]));
    return out.filter((v) => v != null);
  };
  const rawMax = Math.max(
    1,
    ...data.flatMap((d) => series.flatMap((s) => valuesOf(d, s))),
  );
  const scale = niceScale(rawMax);

  const x = (i) => padL + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const y = (v) => padT + plotH * (1 - v / scale.max);
  const baseline = y(0);

  const ticks = Array.from({ length: scale.ticks + 1 }, (_, t) => scale.step * t);

  // [x, y] points for a key, skipping rows where it's missing (so lines gap).
  const pointsOf = (key) =>
    data
      .map((d, i) => [i, num(d[key])])
      .filter(([, v]) => v != null)
      .map(([i, v]) => [x(i), y(v)]);

  const linePath = (pts) =>
    pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  // Future rows are those past the forecast seam — used to gate the forecast
  // hover/tooltip so the shared bridge point doesn't show a zero-width range.
  const isFuture = (i) => forecastFrom != null && i > forecastFrom;

  const legendSeries = series.filter((s) => !s.forecast);
  const hasForecast = series.some((s) => s.forecast || s.band);

  // Tooltip horizontal anchor (% of width, so it tracks the scaled SVG), nudged
  // to stay inside the plot near the edges.
  const tipLeftPct = hover != null ? (x(hover) / W) * 100 : 0;
  const tipTransform =
    tipLeftPct > 75
      ? "translateX(-100%)"
      : tipLeftPct < 25
        ? "translateX(0)"
        : "translateX(-50%)";

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex flex-wrap gap-[18px] px-0.5">
        {legendSeries.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-[7px] text-[13px] font-medium text-slate-500">
            <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        {hasForecast ? (
          <span className="inline-flex items-center gap-[7px] text-[13px] font-medium text-slate-500">
            <span className="size-2.5 shrink-0 rounded-[3px] [background:repeating-linear-gradient(90deg,var(--text-muted)_0,var(--text-muted)_3px,transparent_3px,transparent_6px)]" />
            Forecast (min–avg–max)
          </span>
        ) : null}
      </div>

      <div className="relative" onMouseLeave={() => setHover(null)}>
        <svg
          className="block h-auto w-full overflow-visible"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={series.map((s) => s.label).join(", ")}
        >
          <defs>
            {series
              .filter((s) => !s.band)
              .map((s) => (
                <linearGradient
                  key={s.key}
                  id={`${id}-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
                </linearGradient>
              ))}
          </defs>

          {/* Horizontal grid + y-axis labels */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={padL}
                y1={y(t)}
                x2={W - padR}
                y2={y(t)}
                className="[stroke:var(--border)] [stroke-width:1]"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={padL - 8}
                y={y(t)}
                className="text-[11px] font-medium [fill:var(--text-muted)]"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {fmtTick(t)}
              </text>
            </g>
          ))}

          {/* Seam marking where measured data ends and the forecast begins */}
          {forecastFrom != null ? (
            <line
              x1={x(forecastFrom)}
              y1={padT}
              x2={x(forecastFrom)}
              y2={baseline}
              className="opacity-50 [stroke-dasharray:2_3] [stroke-width:1] [stroke:var(--text-muted)]"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}

          {/* One area + line per series; forecast series draw a band + dashed line */}
          {series.map((s) => {
            if (s.band) {
              const hiPts = pointsOf(s.band.hi);
              const loPts = pointsOf(s.band.lo);
              const avgPts = pointsOf(s.key);
              const band =
                hiPts.length && loPts.length
                  ? `${linePath(hiPts)} ${loPts
                      .slice()
                      .reverse()
                      .map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`)
                      .join(" ")} Z`
                  : null;
              return (
                <g key={s.key}>
                  {band ? <path d={band} className="[fill-opacity:0.12] [stroke:none]" fill={s.color} /> : null}
                  {avgPts.length ? (
                    <path
                      d={linePath(avgPts)}
                      className="fill-none [stroke-dasharray:5_4] [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
                      stroke={s.color}
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null}
                  {avgPts.map((p, i) => (
                    <circle
                      key={i}
                      cx={p[0]}
                      cy={p[1]}
                      r="3"
                      className="[fill:var(--surface)] [stroke-width:2]"
                      stroke={s.color}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                </g>
              );
            }

            const pts = pointsOf(s.key);
            if (pts.length === 0) return null;
            const area =
              `M${pts[0][0].toFixed(1)},${baseline.toFixed(1)} ` +
              pts.map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") +
              ` L${pts[pts.length - 1][0].toFixed(1)},${baseline.toFixed(1)} Z`;
            return (
              <g key={s.key}>
                <path d={area} fill={`url(#${id}-${s.key})`} />
                <path
                  d={linePath(pts)}
                  className="fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]"
                  stroke={s.color}
                  vectorEffect="non-scaling-stroke"
                />
                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p[0]}
                    cy={p[1]}
                    r="3"
                    className="[fill:var(--surface)] [stroke-width:2]"
                    stroke={s.color}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
            );
          })}

          {/* X-axis category labels. The first/last are anchored inward
              (start/end) so a wide edge label (e.g. "29 Jun - 5 Jul") grows
              into the plot instead of spilling out of the card. */}
          {data.map((d, i) => (
            <text
              key={d.label}
              x={x(i)}
              y={H - 8}
              className="text-[11px] font-medium [fill:var(--text-muted)]"
              textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            >
              {d.label}
            </text>
          ))}

          {/* Hover highlight: guide line + enlarged points at the hovered category */}
          {hover != null ? (
            <g pointerEvents="none">
              <line
                x1={x(hover)}
                y1={padT}
                x2={x(hover)}
                y2={baseline}
                className="opacity-[0.55] [stroke-dasharray:3_3] [stroke-width:1] [stroke:var(--text-muted)]"
                vectorEffect="non-scaling-stroke"
              />
              {series.map((s) => {
                if (s.band && !isFuture(hover)) return null;
                const v = num(data[hover][s.key]);
                if (v == null) return null;
                return (
                  <circle
                    key={s.key}
                    cx={x(hover)}
                    cy={y(v)}
                    r="4.5"
                    fill={s.color}
                    stroke="var(--surface)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          ) : null}

          {/* Transparent per-category hit zones (topmost) that drive the hover */}
          {data.map((d, i) => {
            const left = i === 0 ? padL : (x(i - 1) + x(i)) / 2;
            const right = i === n - 1 ? padL + plotW : (x(i) + x(i + 1)) / 2;
            return (
              <rect
                key={d.label}
                className="[fill:transparent]"
                x={left}
                y={padT}
                width={Math.max(0, right - left)}
                height={plotH}
                onMouseEnter={() => setHover(i)}
              />
            );
          })}
        </svg>

        {hover != null ? (
          <div
            className="pointer-events-none absolute top-1 z-[5] min-w-[132px] rounded-field border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-pop"
            style={{ left: `${tipLeftPct}%`, transform: tipTransform }}
          >
            <div className="mb-1.5 font-semibold text-slate-900">
              {tooltipTitle(data[hover])}
            </div>
            {series.map((s) => {
              if (s.band && !isFuture(hover)) return null;
              const v = num(data[hover][s.key]);
              if (v == null) return null;
              const lo = s.band ? num(data[hover][s.band.lo]) : null;
              const hi = s.band ? num(data[hover][s.band.hi]) : null;
              return (
                <div key={s.key} className="mt-1 flex items-center justify-between gap-4">
                  <span className="inline-flex items-center gap-[7px] text-slate-500">
                    <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatValue(v)}
                    {lo != null && hi != null ? (
                      <span className="font-medium text-slate-500">
                        {" "}
                        ({formatValue(lo)}–{formatValue(hi)})
                      </span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

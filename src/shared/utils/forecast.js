/**
 * Time-series forecasting engine (pure math, zero dependencies).
 *
 * Given a series of equally-spaced historical numbers it projects the next
 * `horizon` periods as THREE trajectories:
 *   • average — the expected path: a least-squares trend line extrapolated forward
 *   • highest — optimistic edge: average + margin
 *   • minimum — pessimistic edge: average − margin (floored at `clampMin`)
 *
 * The margin is a prediction interval derived from how much the history scatters
 * around its own trend (residual standard error); it WIDENS with distance, so
 * the high/low cone fans out the further ahead we look. This is a straight-line
 * model — no seasonality — which suits short monthly series. Works on any
 * numeric series: sales orders, quotations, units produced, …
 *
 *   forecastSeries([320, 380, 350, 470, 520, 610], { horizon: 3 })
 *   // → { average: [641, 698, 754], highest: [718, 784, 851], minimum: [563, 611, 658], … }
 */

/** Round to `decimals` places (default whole numbers), guarding against NaN. */
function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
}

/**
 * Least-squares straight-line fit over the points (i, values[i]), i = 0…n-1.
 * Returns the line plus the pieces a prediction interval needs (`meanX`, `sxx`).
 * @param {number[]} values
 */
export function linearFit(values) {
  const n = values.length;
  const meanX = (n - 1) / 2; // mean of the indices 0…n-1
  const meanY = n ? values.reduce((sum, v) => sum + v, 0) / n : 0;

  let sxx = 0; // Σ(x − x̄)²
  let sxy = 0; // Σ(x − x̄)(y − ȳ)
  for (let i = 0; i < n; i += 1) {
    const dx = i - meanX;
    sxx += dx * dx;
    sxy += dx * (values[i] - meanY);
  }

  const slope = sxx > 0 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;
  return { slope, intercept, meanX, sxx, n };
}

/**
 * Residual standard error of the fit — the typical gap between the actual points
 * and the trend line. Returns 0 when there aren't enough points to estimate it
 * (n < 3) or the fit is exact; that simply yields a zero-width band.
 * @param {number[]} values
 * @param {ReturnType<typeof linearFit>} fit
 */
function residualStdError(values, fit) {
  const { slope, intercept, n } = fit;
  if (n < 3) return 0;
  let ssr = 0;
  for (let i = 0; i < n; i += 1) {
    const error = values[i] - (intercept + slope * i);
    ssr += error * error;
  }
  return Math.sqrt(ssr / (n - 2));
}

/**
 * Project the next `horizon` periods of a series as average / highest / minimum.
 *
 * @param {number[]} series Equally-spaced history, oldest → newest.
 * @param {object}   [options]
 * @param {number}   [options.horizon=3]   How many future periods to predict.
 * @param {number}   [options.k=1.5]       Band width: ~1 tight, ~2 ≈ 95% interval.
 * @param {number|null} [options.clampMin=0] Floor applied to every prediction
 *   (null disables it — e.g. for metrics that can legitimately go negative).
 * @param {number}   [options.decimals=0]  Rounding for the returned numbers.
 * @returns {{
 *   average: number[], highest: number[], minimum: number[],
 *   trend: { slope: number, intercept: number }, stdError: number,
 *   summary: { average: number, highest: number, minimum: number },
 * }}
 */
export function forecastSeries(series, options = {}) {
  const { horizon = 3, k = 1.5, clampMin = 0, decimals = 0 } = options;

  const values = (series ?? []).map((v) => Number(v) || 0);
  if (values.length === 0 || horizon <= 0) {
    return {
      average: [],
      highest: [],
      minimum: [],
      trend: { slope: 0, intercept: 0 },
      stdError: 0,
      summary: { average: 0, highest: 0, minimum: 0 },
    };
  }

  const fit = linearFit(values);
  const stdError = residualStdError(values, fit);
  const floor = (v) => (clampMin == null ? v : Math.max(clampMin, v));

  const average = [];
  const highest = [];
  const minimum = [];

  for (let h = 1; h <= horizon; h += 1) {
    const x = values.length - 1 + h; // next indices: n, n+1, …
    const mean = fit.intercept + fit.slope * x;

    // Prediction-interval half-width: scales with the residual scatter and grows
    // as x moves away from the data's centre, so the high/low cone fans out.
    const leverage = fit.sxx > 0 ? (x - fit.meanX) ** 2 / fit.sxx : 0;
    const margin = k * stdError * Math.sqrt(1 + 1 / fit.n + leverage);

    average.push(round(floor(mean), decimals));
    highest.push(round(floor(mean + margin), decimals));
    minimum.push(round(floor(mean - margin), decimals));
  }

  // Headline = the furthest projected period ("where we land in `horizon`").
  const last = horizon - 1;
  return {
    average,
    highest,
    minimum,
    trend: { slope: fit.slope, intercept: fit.intercept },
    stdError,
    summary: { average: average[last], highest: highest[last], minimum: minimum[last] },
  };
}

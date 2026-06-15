/** Status pill. `tone` maps to the semantic colors in the design system. */
const TONES = ['neutral', 'info', 'warning', 'success', 'danger'];

export default function Badge({ tone = 'neutral', children }) {
  const safeTone = TONES.includes(tone) ? tone : 'neutral';
  return <span className={`badge badge--${safeTone}`}>{children}</span>;
}

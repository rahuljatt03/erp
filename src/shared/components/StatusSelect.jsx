/**
 * Inline status changer for list tables.
 *
 * Renders a tone-coloured native <select> styled to read like the status pill,
 * so a status can be reassigned without opening the record. It stops its own
 * click/change events from bubbling, so interacting with it never triggers the
 * surrounding clickable row's navigation.
 *
 * `options` is a module's `*_STATUSES` array ([{ value, label, tone }]); the
 * pill colour follows the currently-selected option's tone.
 */
export default function StatusSelect({ value, options, onChange, disabled = false }) {
  const current = options.find((opt) => opt.value === value);
  const tone = current?.tone ?? 'neutral';
  const known = current != null;

  return (
    <select
      className={`status-select status-select--${tone}`}
      value={value ?? ''}
      disabled={disabled}
      aria-label="Change status"
      title="Change status"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        const next = e.target.value;
        if (next !== value) onChange(next);
      }}
    >
      {/* Keep an unknown stored value visible rather than silently snapping to the first option. */}
      {!known && value != null && value !== '' ? <option value={value}>{value}</option> : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

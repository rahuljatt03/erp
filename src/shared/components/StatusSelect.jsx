/**
 * Inline status changer for list tables.
 *
 * A custom dropdown (not a native <select>) so the open menu can be fully
 * styled to match the app: a tone-coloured pill trigger that opens a panel of
 * tone-dot options with a check on the current one. Closes on outside click or
 * Escape. Stops its own click events from bubbling so interacting with it never
 * triggers the surrounding clickable row's navigation.
 *
 * `options` is a module's `*_STATUSES` array ([{ value, label, tone }]); the
 * pill and option dots follow each option's tone.
 *
 * Keeps the original API (value / options / onChange / disabled) so existing
 * call sites work unchanged.
 */
import { useEffect, useRef, useState } from 'react';

export default function StatusSelect({ value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const current = options.find((opt) => opt.value === value);
  const tone = current?.tone ?? 'neutral';
  const label = current?.label ?? value ?? '—';

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const stop = (e) => e.stopPropagation();

  const choose = (e, next) => {
    e.stopPropagation();
    setOpen(false);
    if (next !== value) onChange(next);
  };

  return (
    <div className="status-dropdown" ref={rootRef} onClick={stop} onMouseDown={stop}>
      <button
        type="button"
        className={`status-pill status-pill--${tone}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change status"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
      >
        <span className={`status-dot status-dot--${tone}`} />
        <span className="status-pill__label">{label}</span>
        <svg
          className="status-pill__chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <ul className="status-menu" role="listbox">
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`status-menu__item ${selected ? 'is-selected' : ''}`}
                  onClick={(e) => choose(e, opt.value)}
                >
                  <span className="status-menu__label">{opt.label}</span>
                  {selected ? (
                    <svg
                      className="status-menu__check"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

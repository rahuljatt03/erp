/**
 * Inline status changer for list tables.
 *
 * A custom dropdown (not a native <select>) so the open menu can be fully
 * styled to match the app: a tone-coloured pill trigger that opens a panel of
 * tone-dot options with a check on the current one. Closes on outside click or
 * Escape. Stops its own click events from bubbling so interacting with it never
 * triggers the surrounding clickable row's navigation.
 *
 * The open menu is rendered in a portal to <body> with fixed positioning taken
 * from the trigger's bounding rect. List tables live inside an
 * `overflow-x-auto` wrapper, and CSS forces the cross axis (`overflow-y`) to
 * `auto` too — which would clip a normally-positioned absolute menu. The portal
 * lets the menu escape every clipping/scroll ancestor. It flips above the
 * trigger when there isn't room below, follows the trigger on scroll/resize,
 * and caps its height to the available viewport space.
 *
 * `options` is a module's `*_STATUSES` array ([{ value, label, tone }]); the
 * pill and option dots follow each option's tone.
 *
 * Keeps the original API (value / options / onChange / disabled) so existing
 * call sites work unchanged.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Soft tone pill (tinted bg + tone text), matched to the design system.
const PILL_TONE = {
  neutral: 'bg-slate-200 text-slate-600',
  info: 'bg-blue-100 text-blue-600',
  warning: 'bg-amber-100 text-amber-600',
  success: 'bg-green-100 text-green-600',
  danger: 'bg-red-100 text-red-600',
};
// Solid tone dot.
const DOT_TONE = {
  neutral: 'bg-slate-600',
  info: 'bg-blue-600',
  warning: 'bg-amber-600',
  success: 'bg-green-600',
  danger: 'bg-red-600',
};

const GAP = 6; // px between trigger and menu
const MARGIN = 8; // px the menu keeps from the viewport edges
const MIN_WIDTH = 180;

export default function StatusSelect({ value, options, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null); // { top, left, minWidth, maxHeight }
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const current = options.find((opt) => opt.value === value);
  const tone = current?.tone ?? 'neutral';
  const label = current?.label ?? value ?? '—';

  // Compute fixed-position coordinates from the trigger's viewport rect.
  // Flips above when the menu wouldn't fit below, and caps height to the room
  // available on the chosen side.
  const computePosition = () => {
    const btn = triggerRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight ?? 0;
    const spaceBelow = window.innerHeight - r.bottom - GAP - MARGIN;
    const spaceAbove = r.top - GAP - MARGIN;
    const placeUp = menuH > spaceBelow && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, placeUp ? spaceAbove : spaceBelow);
    const height = Math.min(menuH, maxHeight) || 0;
    const top = placeUp ? r.top - GAP - height : r.bottom + GAP;

    const menuW = Math.max(MIN_WIDTH, r.width);
    const left = Math.max(MARGIN, Math.min(r.left, window.innerWidth - menuW - MARGIN));

    setPos({ top, left, minWidth: r.width, maxHeight });
  };

  // Position before paint, then keep it pinned to the trigger while open.
  useLayoutEffect(() => {
    if (!open) return undefined;
    computePosition();
    const onReflow = () => computePosition();
    window.addEventListener('scroll', onReflow, true); // capture: catch nested scroll containers
    window.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click or Escape. The menu lives in a portal outside the
  // trigger's DOM subtree, so check it explicitly too.
  useEffect(() => {
    if (!open) return undefined;
    const onDocPointer = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocPointer);
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
    <div className="relative inline-block" onClick={stop} onMouseDown={stop}>
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex max-w-full cursor-pointer items-center gap-[7px] rounded-full border border-transparent py-1 pl-2.5 pr-[9px] text-xs font-semibold leading-[1.4] transition-[filter,box-shadow] hover:brightness-[.96] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-indigo-100 disabled:cursor-progress disabled:opacity-60 ${PILL_TONE[tone] ?? PILL_TONE.neutral}`}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change status"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
      >
        <span className={`size-2 shrink-0 rounded-full ${DOT_TONE[tone] ?? DOT_TONE.neutral}`} />
        <span>{label}</span>
        <svg
          className="shrink-0 opacity-70"
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

      {open
        ? createPortal(
            <ul
              ref={menuRef}
              className="fixed z-50 m-0 min-w-[180px] list-none overflow-y-auto rounded-[8px] border border-slate-200 bg-white p-1.5 shadow-pop"
              role="listbox"
              style={{
                top: pos?.top ?? -9999,
                left: pos?.left ?? -9999,
                minWidth: pos?.minWidth,
                maxHeight: pos?.maxHeight,
                visibility: pos ? 'visible' : 'hidden',
              }}
              onClick={stop}
              onMouseDown={stop}
            >
              {options.map((opt) => {
                const selected = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-center gap-[9px] rounded-field px-2.5 py-[7px] text-left text-[13px] text-slate-900 transition-colors hover:bg-indigo-50 ${selected ? 'font-semibold' : 'font-medium'}`}
                      onClick={(e) => choose(e, opt.value)}
                    >
                      <span className="flex-1">{opt.label}</span>
                      {selected ? (
                        <svg
                          className="shrink-0 text-indigo-700"
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
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

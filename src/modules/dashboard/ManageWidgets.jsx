import { useEffect, useRef, useState } from "react";
import Button from "../../shared/components/Button";
import { ManageWidgetsIcon } from "../../shared/components/icons";

/**
 * "Manage widgets" control — a button that opens a small popover listing every
 * dashboard widget with a checkbox to show/hide it. Self-contained: owns its
 * open/close state and closes on outside-click or Escape. Visibility itself is
 * lifted to the dashboard (passed in via `visible` + `onToggle`) so the page can
 * render sections conditionally and persist the choice.
 */
export default function ManageWidgets({ widgets, visible, onToggle, onReset }) {
  const [open, setOpen] = useState(false);
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

  const shown = widgets.filter((widget) => visible[widget.id]).length;

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <ManageWidgetsIcon /> Manage widgets
      </Button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-[264px] rounded-card border border-slate-200 bg-white p-1.5 shadow-pop"
          role="menu"
        >
          <div className="flex items-center justify-between px-2.5 pb-1.5 pt-2 text-[11.5px] font-semibold uppercase tracking-[0.5px] text-slate-500">
            <span>Show widgets</span>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-xs font-semibold text-indigo-600 hover:underline"
              onClick={onReset}
            >
              Reset
            </button>
          </div>
          <ul className="m-0 list-none p-0">
            {widgets.map((widget) => (
              <li key={widget.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-field px-2.5 py-[9px] text-sm text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer accent-indigo-600"
                    checked={!!visible[widget.id]}
                    onChange={() => onToggle(widget.id)}
                  />
                  <span>{widget.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-slate-200 px-2.5 pb-1.5 pt-2 text-xs text-slate-500">
            {shown} of {widgets.length} shown
          </div>
        </div>
      ) : null}
    </div>
  );
}

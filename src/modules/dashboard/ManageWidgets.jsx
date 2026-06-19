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
    <div className="widget-menu" ref={ref}>
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
        <div className="widget-menu__panel" role="menu">
          <div className="widget-menu__header">
            <span>Show widgets</span>
            <button
              type="button"
              className="widget-menu__reset"
              onClick={onReset}
            >
              Reset
            </button>
          </div>
          <ul className="widget-menu__list">
            {widgets.map((widget) => (
              <li key={widget.id}>
                <label className="widget-menu__item">
                  <input
                    type="checkbox"
                    checked={!!visible[widget.id]}
                    onChange={() => onToggle(widget.id)}
                  />
                  <span>{widget.label}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="widget-menu__footer">
            {shown} of {widgets.length} shown
          </div>
        </div>
      ) : null}
    </div>
  );
}

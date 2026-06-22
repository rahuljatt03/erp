import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '../navigation';
import { company } from '../../shared/session';

export default function Sidebar({ onToggle, collapsed }) {
  // On desktop (>=900px) the collapsed sidebar is an icon rail that hides all
  // text; on mobile the same `collapsed` flag slides the full drawer off-canvas
  // (labels stay). So text-hiding is gated to the `nav:` (desktop) breakpoint.
  const railHide = collapsed ? 'nav:hidden' : '';
  const itemBase = `relative my-0.5 flex w-full items-center gap-[11px] rounded-field px-3 py-[9px] text-left text-sm font-medium no-underline transition-colors hover:no-underline ${
    collapsed ? 'nav:justify-center nav:px-0 nav:text-[0px]' : ''
  }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen w-64 flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-white text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.2)] transition-transform duration-200 nav:sticky nav:z-auto nav:w-auto nav:shadow-none ${
        collapsed ? '-translate-x-full nav:translate-x-0' : 'translate-x-0'
      }`}
    >
      <div
        className={`flex items-center gap-2.5 border-b border-slate-200 px-3.5 py-4 ${
          collapsed ? 'nav:justify-center nav:px-0 nav:py-2.5' : ''
        }`}
      >
        <div
          className={`grid size-9 shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-indigo-500 to-indigo-700 text-[17px] font-bold text-white ${railHide}`}
        >
          {company.initials}
        </div>
        <div className={`min-w-0 flex-1 ${railHide}`}>
          <strong
            title={company.name}
            className="block text-[15px] font-semibold leading-tight tracking-[0.2px] text-slate-900 [overflow-wrap:anywhere]"
          >
            {company.name}
          </strong>
          <span className="block text-xs text-slate-500 [overflow-wrap:anywhere]">
            {company.tagline}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 cursor-pointer flex-col justify-center gap-1 rounded-field border border-slate-200 bg-transparent px-[7px] hover:bg-slate-100"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <span className="block h-0.5 rounded-sm bg-slate-700" />
          <span className="block h-0.5 rounded-sm bg-slate-700" />
          <span className="block h-0.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      {NAV_SECTIONS.map((section) => (
        <nav className={`px-3 pb-1 pt-4 ${collapsed ? 'nav:px-2 nav:py-0' : ''}`} key={section.label}>
          <div
            className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.7px] text-slate-500 ${railHide}`}
          >
            {section.label}
          </div>
          {section.items.map((item) =>
            item.soon ? (
              <span
                className={`${itemBase} cursor-not-allowed text-slate-500 opacity-70`}
                key={item.label}
                title="Coming soon"
              >
                <span className="w-5 shrink-0 text-center [&>svg]:size-[18px]">
                  {item.icon ? <item.icon /> : null}
                </span>
                {item.label}
                <span
                  className={`ml-auto rounded-[4px] border border-slate-200 px-[5px] py-px text-[9.5px] font-semibold uppercase tracking-[0.5px] text-slate-500 ${railHide}`}
                >
                  Soon
                </span>
              </span>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${itemBase} cursor-pointer ${
                    isActive
                      ? `bg-slate-100 text-slate-900 before:absolute before:-left-3 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-[3px] before:bg-slate-800 before:content-[''] ${
                          collapsed ? 'nav:before:hidden' : ''
                        }`
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <span className="w-5 shrink-0 text-center [&>svg]:size-[18px]">
                  {item.icon ? <item.icon /> : null}
                </span>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      ))}
    </aside>
  );
}

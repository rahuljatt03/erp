import { useLocation } from 'react-router-dom';
import { findActiveNav } from '../../app/navigation';

/**
 * Page header: the page title (left) + an optional row of action buttons (right).
 *
 * The title defaults to the active navigation label — the same value the topbar
 * used to show — so every page displays where you are without passing a prop.
 * Pass `title` to override it (e.g. an explicit page name).
 *
 * Sticky just below the topbar; breaks out of the page's horizontal padding so
 * the band spans edge to edge. On narrow screens the actions wrap below the title.
 */
export default function PageHeader({ title, actions }) {
  const { pathname } = useLocation();
  const resolved = title ?? findActiveNav(pathname)?.label ?? null;

  if (!resolved && !actions) return null;

  return (
    <div className="sticky top-[60px] z-[5] -mx-7 mb-2 flex flex-wrap items-center justify-between gap-4 bg-slate-100 px-7 py-2.5">
      {resolved ? (
        <h1 className="text-[22px] font-bold leading-tight text-slate-900">{resolved}</h1>
      ) : (
        <span />
      )}
      {actions ? <div className="flex flex-wrap justify-end gap-2.5">{actions}</div> : null}
    </div>
  );
}

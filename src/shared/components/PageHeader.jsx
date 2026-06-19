import { useLocation } from 'react-router-dom';
import { findActiveNav } from '../../app/navigation';

/**
 * Page header: the page title (left) + an optional row of action buttons (right).
 *
 * The title defaults to the active navigation label — the same value the topbar
 * used to show — so every page displays where you are without passing a prop.
 * Pass `title` to override it (e.g. an explicit page name).
 */
export default function PageHeader({ title, actions }) {
  const { pathname } = useLocation();
  const resolved = title ?? findActiveNav(pathname)?.label ?? null;

  if (!resolved && !actions) return null;

  return (
    <div className="page-header">
      {resolved ? <h1 className="page-header__title">{resolved}</h1> : <span />}
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}

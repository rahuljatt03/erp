import { useLocation } from 'react-router-dom';
import { findActiveNav } from '../navigation';
import { currentUser } from '../../shared/session';

export default function Topbar() {
  const { pathname } = useLocation();
  const active = findActiveNav(pathname);

  return (
    <header className="topbar">
      <div className="topbar__crumbs">
        Manufacturing ERP
        {active ? (
          <>
            {' '}
            / <strong>{active.label}</strong>
          </>
        ) : null}
      </div>

      <div className="topbar__user">
        <div style={{ textAlign: 'right', lineHeight: 1.25 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{currentUser.name}</div>
          <div className="muted text-sm">{currentUser.role}</div>
        </div>
        <div className="topbar__avatar">{currentUser.initials}</div>
      </div>
    </header>
  );
}

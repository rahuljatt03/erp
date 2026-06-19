import { currentUser } from '../../shared/session';

export default function Topbar({ onToggleSidebar, sidebarCollapsed }) {
  return (
    <header className="topbar">
      <div className="topbar__crumbs">
        {/* Visible only on mobile (CSS); opens/closes the off-canvas drawer. */}
        <button
          type="button"
          className="topbar__toggle"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <span />
          <span />
          <span />
        </button>
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

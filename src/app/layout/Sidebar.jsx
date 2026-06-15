import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '../navigation';
import { company } from '../../shared/session';

export default function Sidebar({ onToggle, collapsed }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">{company.initials}</div>
        <div className="sidebar__brand-text">
          <strong title={company.name}>{company.name}</strong>
          <span>{company.tagline}</span>
        </div>
        <button
          type="button"
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {NAV_SECTIONS.map((section) => (
        <nav className="sidebar__section" key={section.label}>
          <div className="sidebar__section-label">{section.label}</div>
          {section.items.map((item) =>
            item.soon ? (
              <span className="nav-item is-disabled" key={item.label} title="Coming soon">
                <span className="nav-item__icon">{item.icon}</span>
                {item.label}
                <span className="nav-item__soon">Soon</span>
              </span>
            ) : (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              >
                <span className="nav-item__icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      ))}

      <div className="sidebar__footer">v0.1 · Inquiry module</div>
    </aside>
  );
}

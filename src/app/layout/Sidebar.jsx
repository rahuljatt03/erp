import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '../navigation';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">M</div>
        <div className="sidebar__brand-text">
          <strong>Manufacturing ERP</strong>
          <span>Operations Suite</span>
        </div>
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

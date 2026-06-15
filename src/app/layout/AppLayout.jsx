import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/** The ERP shell: collapsible sidebar + topbar, with routed pages in <Outlet>. */
export default function AppLayout() {
  // Open by default on desktop; collapsed (off-canvas) by default on mobile.
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 900,
  );

  const toggle = () => setCollapsed((c) => !c);

  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <Sidebar onToggle={toggle} collapsed={collapsed} />
      {/* Click-catcher so the overlay sidebar closes when you tap the page (mobile). */}
      <div
        className="app-shell__scrim"
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />
      <div className="main">
        {/* Topbar only carries the "open" button, shown while the sidebar is collapsed. */}
        <Topbar onToggleSidebar={toggle} sidebarCollapsed={collapsed} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

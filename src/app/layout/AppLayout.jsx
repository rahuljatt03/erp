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
    <div
      className={`grid min-h-screen grid-cols-[0px_1fr] transition-[grid-template-columns] duration-200 ease-in-out ${
        collapsed ? 'nav:grid-cols-[64px_1fr]' : 'nav:grid-cols-[256px_1fr]'
      }`}
    >
      <Sidebar onToggle={toggle} collapsed={collapsed} />
      {/* Tap-to-close backdrop for the mobile drawer; only while open, mobile only. */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/40 nav:hidden"
          onClick={() => setCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <div className="flex min-w-0 flex-col">
        {/* Topbar carries the mobile "open" button while the sidebar is collapsed. */}
        <Topbar onToggleSidebar={toggle} sidebarCollapsed={collapsed} />
        <main className="w-full flex-1 px-7 pb-7 pt-3.5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

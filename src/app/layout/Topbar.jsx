import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogoutIcon, ChevronDownIcon } from '../../shared/components/icons';
import { logout, selectAuthUser } from '../../modules/auth/authSlice';
import { confirm } from '../../shared/feedback/confirm';

/** Up-to-two-letter avatar initials from a display name (falls back to email). */
function initialsFor(user) {
  const source = user?.displayName || user?.email || 'User';
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Topbar({ onToggleSidebar, sidebarCollapsed }) {
  const user = useSelector(selectAuthUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const name = user?.displayName || user?.email || 'User';
  const role = user?.role || '';
  // Only worth a second line in the menu when it adds info the name doesn't.
  const email = user?.email && user.email !== name ? user.email : '';

  // Self-contained popover: close on outside-click or Escape (mirrors ManageWidgets).
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    const ok = await confirm({
      message: 'Sign out of the workspace?',
      header: 'Sign out?',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Sign out',
    });
    if (!ok) return;
    dispatch(logout());
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between bg-white px-7">
      <div className="flex items-center gap-2.5 text-[13px] text-slate-500">
        {/* Visible only on mobile; opens/closes the off-canvas drawer. */}
        <button
          type="button"
          className="inline-flex h-[34px] w-[34px] shrink-0 cursor-pointer flex-col justify-center gap-1 rounded-field border border-slate-200 bg-white px-2 hover:bg-slate-100 nav:hidden"
          onClick={onToggleSidebar}
          aria-label={sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          <span className="block h-0.5 rounded-sm bg-slate-700" />
          <span className="block h-0.5 rounded-sm bg-slate-700" />
          <span className="block h-0.5 rounded-sm bg-slate-700" />
        </button>
      </div>

      <div className="relative" ref={menuRef}>
        {/* The profile cluster is the dropdown trigger; Sign out lives inside the menu. */}
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-field px-1.5 py-1 text-[13px] hover:bg-slate-100"
          onClick={() => setMenuOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Open profile menu"
        >
          <div className="text-right leading-tight">
            <div className="font-semibold text-slate-900">{name}</div>
            {role ? <div className="text-[13px] text-slate-500">{role}</div> : null}
          </div>
          <div className="grid size-8 place-items-center rounded-full bg-indigo-100 text-[13px] font-semibold text-indigo-700">
            {initialsFor(user)}
          </div>
          <ChevronDownIcon
            size={16}
            className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {menuOpen ? (
          <div
            className="absolute right-0 top-[calc(100%+8px)] z-30 w-[220px] rounded-card border border-slate-200 bg-white p-1.5 shadow-pop"
            role="menu"
          >
            <div className="px-2.5 pb-1.5 pt-1 leading-tight">
              <div className="truncate text-sm font-semibold text-slate-900">{name}</div>
              {email ? <div className="truncate text-xs text-slate-500">{email}</div> : null}
            </div>
            <div className="my-1 border-t border-slate-200" />
            <button
              type="button"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-field px-2.5 py-[9px] text-sm text-slate-700 hover:bg-slate-50"
              onClick={handleLogout}
            >
              <LogoutIcon size={16} /> Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

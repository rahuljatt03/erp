/**
 * Central navigation registry — the single source of truth for the sidebar.
 *
 * Adding a new module to the ERP is a one-line change here: drop in an item and
 * flip `soon` off once its routes exist. Items marked `soon` render disabled so
 * the product roadmap is visible without dead links.
 */
export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: '🏠', end: true }],
  },
  {
    label: 'Sales',
    items: [
      { to: '/inquiries', label: 'Inquiry', icon: '📨' },
      { to: '/quotations', label: 'Quotations', icon: '🧾', soon: true },
      { to: '/sales-orders', label: 'Sales Orders', icon: '📦' },
    ],
  },
  {
    label: 'Manufacturing',
    items: [
      { to: '/bom', label: 'Bill of Materials', icon: '🧩' },
      { to: '/production', label: 'Production', icon: '🏭' },
    ],
  },
  {
    label: 'Supply Chain',
    items: [
      { to: '/inventory', label: 'Inventory', icon: '📊' },
      { to: '/purchase-orders', label: 'Procurement', icon: '🛒' },
    ],
  },
];

/** Flat list of live (non-`soon`) nav items. */
const LIVE_ITEMS = NAV_SECTIONS.flatMap((section) => section.items).filter((item) => !item.soon);

/**
 * Finds the nav item that best matches the current pathname, so the topbar can
 * show where you are. Picks the longest matching route prefix.
 * @param {string} pathname
 */
export function findActiveNav(pathname) {
  let best = null;
  for (const item of LIVE_ITEMS) {
    const matches =
      item.to === '/' ? pathname === '/' : pathname === item.to || pathname.startsWith(`${item.to}/`);
    if (matches && (!best || item.to.length > best.to.length)) {
      best = item;
    }
  }
  return best;
}

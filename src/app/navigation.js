/**
 * Central navigation registry — the single source of truth for the sidebar.
 *
 * Adding a new module to the ERP is a one-line change here: drop in an item and
 * flip `soon` off once its routes exist. Items marked `soon` render disabled so
 * the product roadmap is visible without dead links.
 *
 * `icon` is a lucide-react component (from the shared icon registry), rendered
 * by Sidebar as `<item.icon />`.
 */
import {
  DashboardIcon,
  InquiryIcon,
  QuotationIcon,
  OrderIcon,
  ProductionIcon,
  InventoryIcon,
  ProcurementIcon,
  ReportsIcon,
} from '../shared/components/icons';

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: DashboardIcon, end: true }],
  },
  {
    label: 'Sales',
    items: [
      { to: '/inquiries', label: 'Inquiry', icon: InquiryIcon },
      { to: '/quotations', label: 'Quotations', icon: QuotationIcon },
      { to: '/sales-orders', label: 'Sales Orders', icon: OrderIcon },
    ],
  },
  {
    label: 'Manufacturing',
    items: [{ to: '/production', label: 'Production', icon: ProductionIcon }],
  },
  {
    label: 'Supply Chain',
    items: [
      { to: '/inventory', label: 'Inventory', icon: InventoryIcon },
      { to: '/purchase-orders', label: 'Procurement', icon: ProcurementIcon },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/reports', label: 'Reports', icon: ReportsIcon }],
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

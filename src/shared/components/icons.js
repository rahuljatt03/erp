/**
 * Central icon registry — the single source of truth that maps each ERP concept
 * to a lucide-react icon. Import from here (never directly from `lucide-react`)
 * so the same concept always renders the same glyph across the whole app, and
 * swapping an icon is a one-line change.
 *
 * Sizing/alignment is handled by CSS (`.btn svg`, `.state__icon svg`,
 * `svg.lucide`) so call sites stay clean — only pass `size` for one-off inline
 * glyphs that need a smaller size than the contextual default.
 */
export {
  // ---- Modules (sidebar + list/empty states) ----
  LayoutDashboard as DashboardIcon,
  Inbox as InquiryIcon,
  FileText as QuotationIcon,
  Package as OrderIcon,
  Factory as ProductionIcon,
  Warehouse as InventoryIcon,
  ShoppingCart as ProcurementIcon,
  FileBarChart as ReportsIcon,

  // ---- Domain concepts ----
  Boxes as FinishedGoodsIcon,
  Layers as RawMaterialIcon,
  BarChart3 as AnalysisIcon,
  Users as CustomersIcon,
  TrendingUp as GrowthIcon,

  // ---- Actions ----
  ArrowLeft as BackIcon,
  Pencil as EditIcon,
  Trash2 as DeleteIcon,
  Plus as AddIcon,
  X as RemoveIcon,
  PackageCheck as ReceiveIcon,
  Link2 as LinkIcon,
  Download as DownloadIcon,
  SlidersHorizontal as ManageWidgetsIcon,
  GripVertical as DragHandleIcon,
  Calendar as CalendarIcon,
  ChevronDown as ChevronDownIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,

  // ---- Feedback / status ----
  CircleCheck as SuccessIcon,
  Check as CheckIcon,
  TriangleAlert as WarningIcon,
  Compass as NotFoundIcon,
  ClipboardList as EmptyIcon,
  Hand as WelcomeIcon,
} from 'lucide-react';

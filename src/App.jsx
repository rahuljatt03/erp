import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './app/layout/AppLayout';
import DashboardPage from './modules/dashboard/DashboardPage';
import InquiryListPage from './modules/inquiry/pages/InquiryListPage';
import InquiryFormPage from './modules/inquiry/pages/InquiryFormPage';
import InquiryDetailPage from './modules/inquiry/pages/InquiryDetailPage';
import RequirementAnalysisPage from './modules/planning/pages/RequirementAnalysisPage';
import InventoryPage from './modules/inventory/pages/InventoryPage';
import PurchaseOrderListPage from './modules/procurement/pages/PurchaseOrderListPage';
import PurchaseOrderFormPage from './modules/procurement/pages/PurchaseOrderFormPage';
import PurchaseOrderDetailPage from './modules/procurement/pages/PurchaseOrderDetailPage';
import ProductionOrderListPage from './modules/production/pages/ProductionOrderListPage';
import ProductionOrderFormPage from './modules/production/pages/ProductionOrderFormPage';
import ProductionOrderDetailPage from './modules/production/pages/ProductionOrderDetailPage';
import BomListPage from './modules/bom/pages/BomListPage';
import BomFormPage from './modules/bom/pages/BomFormPage';
import BomDetailPage from './modules/bom/pages/BomDetailPage';
import SalesOrderListPage from './modules/sales/pages/SalesOrderListPage';
import SalesOrderFormPage from './modules/sales/pages/SalesOrderFormPage';
import SalesOrderDetailPage from './modules/sales/pages/SalesOrderDetailPage';
import NotFoundPage from './shared/components/NotFoundPage';

/**
 * Application routes. Each module owns a path prefix; adding a module means
 * adding its <Route>s here and a nav entry in app/navigation.js.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />

          {/* Inquiry module */}
          <Route path="inquiries" element={<InquiryListPage />} />
          <Route path="inquiries/new" element={<InquiryFormPage />} />
          <Route path="inquiries/:id" element={<InquiryDetailPage />} />
          <Route path="inquiries/:id/edit" element={<InquiryFormPage />} />
          <Route path="inquiries/:id/requirements" element={<RequirementAnalysisPage />} />

          {/* Sales orders module */}
          <Route path="sales-orders" element={<SalesOrderListPage />} />
          <Route path="sales-orders/new" element={<SalesOrderFormPage />} />
          <Route path="sales-orders/:id" element={<SalesOrderDetailPage />} />
          <Route path="sales-orders/:id/edit" element={<SalesOrderFormPage />} />

          {/* Inventory & planning module */}
          <Route path="inventory" element={<InventoryPage />} />

          {/* Procurement module */}
          <Route path="purchase-orders" element={<PurchaseOrderListPage />} />
          <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
          <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />
          <Route path="purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />

          {/* Production module */}
          <Route path="production" element={<ProductionOrderListPage />} />
          <Route path="production/new" element={<ProductionOrderFormPage />} />
          <Route path="production/:id" element={<ProductionOrderDetailPage />} />
          <Route path="production/:id/edit" element={<ProductionOrderFormPage />} />

          {/* Bill of Materials module */}
          <Route path="bom" element={<BomListPage />} />
          <Route path="bom/new" element={<BomFormPage />} />
          <Route path="bom/:id" element={<BomDetailPage />} />
          <Route path="bom/:id/edit" element={<BomFormPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

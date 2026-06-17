import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/components/Card';
import Tabs from '../../../shared/components/Tabs';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import {
  fetchInquiries,
  selectInquiries,
  selectInquiriesError,
  selectInquiriesLoading,
} from '../../inquiry/inquirySlice';
import {
  fetchQuotations,
  selectQuotations,
  selectQuotationsError,
  selectQuotationsLoading,
} from '../../quotation/quotationSlice';
import {
  fetchSalesOrders,
  selectSalesOrders,
  selectSalesOrdersError,
  selectSalesOrdersLoading,
} from '../../sales/salesSlice';
import {
  fetchProductionOrders,
  selectProductionOrders,
  selectProductionOrdersError,
  selectProductionOrdersLoading,
} from '../../production/productionSlice';
import {
  fetchPurchaseOrders,
  selectPurchaseOrders,
  selectPurchaseOrdersError,
  selectPurchaseOrdersLoading,
} from '../../procurement/procurementSlice';
import {
  fetchFinishedGoods,
  fetchRawMaterials,
  selectFinishedGoods,
  selectFinishedGoodsError,
  selectFinishedGoodsLoading,
  selectRawMaterials,
  selectRawMaterialsError,
  selectRawMaterialsLoading,
} from '../../inventory/inventorySlice';
import ReportFilters, { defaultRange } from '../components/ReportFilters';
import SalesReport from '../components/SalesReport';
import ProductionReport from '../components/ProductionReport';
import ProcurementReport from '../components/ProcurementReport';
import InventoryReport from '../components/InventoryReport';

/**
 * Reports — a cross-module analytics layer. It reuses every module's own list
 * hooks (so the numbers always match their pages) and aggregates them through
 * the pure builders in `reports.metrics.js`. A shared date range drives the
 * dated tabs; Inventory is a live snapshot and ignores it.
 */
export default function ReportsPage() {
  const dispatch = useDispatch();
  const inquiries = useSelector(selectInquiries);
  const quotes = useSelector(selectQuotations);
  const salesOrders = useSelector(selectSalesOrders);
  const workOrders = useSelector(selectProductionOrders);
  const purchaseOrders = useSelector(selectPurchaseOrders);
  const finishedGoods = useSelector(selectFinishedGoods);
  const rawMaterials = useSelector(selectRawMaterials);

  const [range, setRange] = useState(defaultRange);

  const inqLoading = useSelector(selectInquiriesLoading);
  const quoteLoading = useSelector(selectQuotationsLoading);
  const soLoading = useSelector(selectSalesOrdersLoading);
  const woLoading = useSelector(selectProductionOrdersLoading);
  const poLoading = useSelector(selectPurchaseOrdersLoading);
  const fgLoading = useSelector(selectFinishedGoodsLoading);
  const rawLoading = useSelector(selectRawMaterialsLoading);

  const inqError = useSelector(selectInquiriesError);
  const quoteError = useSelector(selectQuotationsError);
  const soError = useSelector(selectSalesOrdersError);
  const woError = useSelector(selectProductionOrdersError);
  const poError = useSelector(selectPurchaseOrdersError);
  const fgError = useSelector(selectFinishedGoodsError);
  const rawError = useSelector(selectRawMaterialsError);

  const loading =
    inqLoading || quoteLoading || soLoading || woLoading || poLoading || fgLoading || rawLoading;
  const error = inqError || quoteError || soError || woError || poError || fgError || rawError;

  const refreshAll = () => {
    dispatch(fetchInquiries());
    dispatch(fetchQuotations());
    dispatch(fetchSalesOrders());
    dispatch(fetchProductionOrders());
    dispatch(fetchPurchaseOrders());
    dispatch(fetchFinishedGoods());
    dispatch(fetchRawMaterials());
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const tabs = [
    {
      key: 'sales',
      label: 'Sales',
      content: <SalesReport inquiries={inquiries} quotes={quotes} orders={salesOrders} range={range} />,
    },
    {
      key: 'production',
      label: 'Production',
      content: <ProductionReport workOrders={workOrders} range={range} />,
    },
    {
      key: 'procurement',
      label: 'Procurement',
      content: <ProcurementReport purchaseOrders={purchaseOrders} range={range} />,
    },
    {
      key: 'inventory',
      label: 'Inventory',
      content: <InventoryReport finishedGoods={finishedGoods} rawMaterials={rawMaterials} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Analytics across sales, production, procurement and inventory"
      />

      {loading ? (
        <LoadingState label="Loading reports…" />
      ) : error ? (
        <ErrorState text={error} onRetry={refreshAll} />
      ) : (
        <div className="stack">
          <Card>
            <ReportFilters range={range} onChange={setRange} />
          </Card>
          <Tabs tabs={tabs} />
        </div>
      )}
    </>
  );
}

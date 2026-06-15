import { useState } from 'react';
import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/components/Card';
import Tabs from '../../../shared/components/Tabs';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { useInquiries } from '../../inquiry/useInquiries';
import { useQuotations } from '../../quotation/useQuotations';
import { useSalesOrders } from '../../sales/useSales';
import { useProductionOrders } from '../../production/useProduction';
import { usePurchaseOrders } from '../../procurement/useProcurement';
import { useFinishedGoods, useRawMaterials } from '../../inventory/useInventory';
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
  const { inquiries, loading: inqLoading, error: inqError, refresh: refreshInq } = useInquiries();
  const { quotes, loading: quoteLoading, error: quoteError, refresh: refreshQuotes } = useQuotations();
  const { orders: salesOrders, loading: soLoading, error: soError, refresh: refreshSales } = useSalesOrders();
  const { orders: workOrders, loading: woLoading, error: woError, refresh: refreshProd } = useProductionOrders();
  const { orders: purchaseOrders, loading: poLoading, error: poError, refresh: refreshProc } = usePurchaseOrders();
  const { items: finishedGoods, loading: fgLoading, error: fgError, refresh: refreshFg } = useFinishedGoods();
  const { items: rawMaterials, loading: rawLoading, error: rawError, refresh: refreshRaw } = useRawMaterials();

  const [range, setRange] = useState(defaultRange);

  const loading =
    inqLoading || quoteLoading || soLoading || woLoading || poLoading || fgLoading || rawLoading;
  const error = inqError || quoteError || soError || woError || poError || fgError || rawError;

  const refreshAll = () => {
    refreshInq();
    refreshQuotes();
    refreshSales();
    refreshProd();
    refreshProc();
    refreshFg();
    refreshRaw();
  };

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

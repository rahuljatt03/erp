import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/components/Card';
import Tabs from '../../../shared/components/Tabs';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { useFinishedGoods, useRawMaterials } from '../useInventory';
import { finishedGoodsService, rawMaterialsService } from '../inventory.service';
import StockTable from '../components/StockTable';

export default function InventoryPage() {
  const finished = useFinishedGoods();
  const raw = useRawMaterials();

  const loading = finished.loading || raw.loading;
  const error = finished.error || raw.error;

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle="Current on-hand stock. Edit a quantity to update it — requirement analysis uses these numbers."
      />

      {loading ? (
        <LoadingState label="Loading stock…" />
      ) : error ? (
        <Card>
          <ErrorState
            text={error}
            onRetry={() => {
              finished.refresh();
              raw.refresh();
            }}
          />
        </Card>
      ) : (
        <div className="stack">
          <div className="banner">
            ✏️ On-hand quantities are editable — changes save automatically and feed straight into the
            requirement analysis on each inquiry.
          </div>

          <Tabs
            tabs={[
              {
                key: 'finished',
                label: '🏭 Finished goods',
                badge: finished.items.length,
                content: (
                  <Card bodyFlush>
                    <StockTable
                      items={finished.items}
                      codeKey="sku"
                      codeLabel="SKU"
                      onSave={(id, onHand) => finishedGoodsService.setOnHand(id, onHand)}
                    />
                  </Card>
                ),
              },
              {
                key: 'raw',
                label: '🧱 Raw materials',
                badge: raw.items.length,
                content: (
                  <Card bodyFlush>
                    <StockTable
                      items={raw.items}
                      codeKey="code"
                      codeLabel="Code"
                      onSave={(id, onHand) => rawMaterialsService.setOnHand(id, onHand)}
                    />
                  </Card>
                ),
              },
            ]}
          />
        </div>
      )}
    </>
  );
}

import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/components/Card';
import Tabs from '../../../shared/components/Tabs';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import { useFinishedGoods, useRawMaterials } from '../useInventory';
import { finishedGoodsService, rawMaterialsService } from '../inventory.service';
import StockSection from '../components/StockSection';
import { FinishedGoodsIcon, RawMaterialIcon } from '../../../shared/components/icons';

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
          <Tabs
            tabs={[
              {
                key: 'finished',
                label: (<><FinishedGoodsIcon size={15} /> Finished goods</>),
                badge: finished.items.length,
                content: (
                  <StockSection
                    items={finished.items}
                    codeKey="sku"
                    codeLabel="SKU"
                    itemLabel="finished good"
                    defaultUnit="pcs"
                    onSave={(id, onHand) => finishedGoodsService.setOnHand(id, onHand)}
                    onAdd={async (draft) => {
                      await finishedGoodsService.create(draft);
                      await finished.refresh();
                    }}
                  />
                ),
              },
              {
                key: 'raw',
                label: (<><RawMaterialIcon size={15} /> Raw materials</>),
                badge: raw.items.length,
                content: (
                  <StockSection
                    items={raw.items}
                    codeKey="code"
                    codeLabel="Code"
                    itemLabel="raw material"
                    defaultUnit="kg"
                    onSave={(id, onHand) => rawMaterialsService.setOnHand(id, onHand)}
                    onAdd={async (draft) => {
                      await rawMaterialsService.create(draft);
                      await raw.refresh();
                    }}
                  />
                ),
              },
            ]}
          />
        </div>
      )}
    </>
  );
}

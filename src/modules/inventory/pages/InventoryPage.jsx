import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/components/Card';
import Tabs from '../../../shared/components/Tabs';
import { LoadingState, ErrorState } from '../../../shared/components/states';
import {
  fetchFinishedGoods,
  fetchRawMaterials,
  createFinishedGood,
  createRawMaterial,
  setFinishedGoodOnHand,
  setRawMaterialOnHand,
  selectFinishedGoods,
  selectFinishedGoodsLoading,
  selectFinishedGoodsError,
  selectRawMaterials,
  selectRawMaterialsLoading,
  selectRawMaterialsError,
} from '../inventorySlice';
import StockSection from '../components/StockSection';
import { FinishedGoodsIcon, RawMaterialIcon } from '../../../shared/components/icons';

export default function InventoryPage() {
  const dispatch = useDispatch();
  const finishedItems = useSelector(selectFinishedGoods);
  const rawItems = useSelector(selectRawMaterials);
  const fgLoading = useSelector(selectFinishedGoodsLoading);
  const rawLoading = useSelector(selectRawMaterialsLoading);
  const fgError = useSelector(selectFinishedGoodsError);
  const rawError = useSelector(selectRawMaterialsError);
  const loading = fgLoading || rawLoading;
  const error = fgError || rawError;

  useEffect(() => {
    dispatch(fetchFinishedGoods());
    dispatch(fetchRawMaterials());
  }, [dispatch]);

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
              dispatch(fetchFinishedGoods());
              dispatch(fetchRawMaterials());
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
                badge: finishedItems.length,
                content: (
                  <StockSection
                    items={finishedItems}
                    codeKey="sku"
                    codeLabel="SKU"
                    itemLabel="finished good"
                    defaultUnit="pcs"
                    onSave={(id, onHand) => dispatch(setFinishedGoodOnHand({ id, onHand })).unwrap()}
                    onAdd={async (draft) => {
                      await dispatch(createFinishedGood(draft)).unwrap();
                      await dispatch(fetchFinishedGoods());
                    }}
                  />
                ),
              },
              {
                key: 'raw',
                label: (<><RawMaterialIcon size={15} /> Raw materials</>),
                badge: rawItems.length,
                content: (
                  <StockSection
                    items={rawItems}
                    codeKey="code"
                    codeLabel="Code"
                    itemLabel="raw material"
                    defaultUnit="kg"
                    onSave={(id, onHand) => dispatch(setRawMaterialOnHand({ id, onHand })).unwrap()}
                    onAdd={async (draft) => {
                      await dispatch(createRawMaterial(draft)).unwrap();
                      await dispatch(fetchRawMaterials());
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

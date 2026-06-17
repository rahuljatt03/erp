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
  removeFinishedGood,
  removeRawMaterial,
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
import { useToast } from '../../../shared/feedback/FeedbackProvider';
import { confirmDelete } from '../../../shared/feedback/confirm';

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
  const toast = useToast();

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
                    onSave={async (id, onHand) => {
                      try {
                        await dispatch(setFinishedGoodOnHand({ id, onHand })).unwrap();
                        toast.success('Stock updated', `On-hand set to ${onHand}.`);
                      } catch (err) {
                        toast.error('Update failed', err instanceof Error ? err.message : 'Could not update stock.');
                        throw err;
                      }
                    }}
                    onAdd={async (draft) => {
                      try {
                        await dispatch(createFinishedGood(draft)).unwrap();
                        await dispatch(fetchFinishedGoods());
                        toast.success('Finished good added', draft.name);
                      } catch (err) {
                        toast.error('Could not add item', err instanceof Error ? err.message : 'Please try again.');
                        throw err;
                      }
                    }}
                    onDelete={async (item) => {
                      if (!(await confirmDelete(`Delete "${item.name}"? This cannot be undone.`, 'Delete finished good?'))) return;
                      try {
                        await dispatch(removeFinishedGood(item.id)).unwrap();
                        await dispatch(fetchFinishedGoods());
                        toast.success('Finished good deleted', item.name);
                      } catch (err) {
                        toast.error('Could not delete item', err instanceof Error ? err.message : 'Please try again.');
                      }
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
                    onSave={async (id, onHand) => {
                      try {
                        await dispatch(setRawMaterialOnHand({ id, onHand })).unwrap();
                        toast.success('Stock updated', `On-hand set to ${onHand}.`);
                      } catch (err) {
                        toast.error('Update failed', err instanceof Error ? err.message : 'Could not update stock.');
                        throw err;
                      }
                    }}
                    onAdd={async (draft) => {
                      try {
                        await dispatch(createRawMaterial(draft)).unwrap();
                        await dispatch(fetchRawMaterials());
                        toast.success('Raw material added', draft.name);
                      } catch (err) {
                        toast.error('Could not add item', err instanceof Error ? err.message : 'Please try again.');
                        throw err;
                      }
                    }}
                    onDelete={async (item) => {
                      if (!(await confirmDelete(`Delete "${item.name}"? This cannot be undone.`, 'Delete raw material?'))) return;
                      try {
                        await dispatch(removeRawMaterial(item.id)).unwrap();
                        await dispatch(fetchRawMaterials());
                        toast.success('Raw material deleted', item.name);
                      } catch (err) {
                        toast.error('Could not delete item', err instanceof Error ? err.message : 'Please try again.');
                      }
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

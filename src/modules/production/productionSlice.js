import { createResourceSlice } from '../../store/createResourceSlice';
import { productionService } from './production.service';

/**
 * Work-order Redux slice. `produce` is the module-specific thunk — it advances
 * the work order and orchestrates the matching inventory movements (consume raw
 * materials, add finished goods), all handled inside the service.
 */
const slice = createResourceSlice({
  name: 'production',
  service: productionService,
  extraThunks: {
    produce: (service, { id, qty }) => service.produce(id, qty),
  },
});

export const {
  fetchAll: fetchProductionOrders,
  fetchOne: fetchProductionOrder,
  createOne: createProductionOrder,
  updateOne: updateProductionOrder,
  removeOne: removeProductionOrder,
  produce: produceProductionOrder,
} = slice.thunks;

export const {
  selectAll: selectProductionOrders,
  selectListLoading: selectProductionOrdersLoading,
  selectListError: selectProductionOrdersError,
  selectCurrent: selectProductionOrder,
  selectCurrentLoading: selectProductionOrderLoading,
  selectCurrentError: selectProductionOrderError,
} = slice.selectors;

export default slice.reducer;

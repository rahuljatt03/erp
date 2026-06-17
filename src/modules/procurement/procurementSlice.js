import { createResourceSlice } from '../../store/createResourceSlice';
import { procurementService } from './procurement.service';

/**
 * Purchase-order Redux slice. `receive` is the module-specific thunk — it pushes
 * received quantities into raw-material inventory (handled inside the service)
 * and advances the PO on the backend.
 */
const slice = createResourceSlice({
  name: 'procurement',
  service: procurementService,
  extraThunks: {
    receive: (service, { id, receipts }) => service.receive(id, receipts),
  },
});

export const {
  fetchAll: fetchPurchaseOrders,
  fetchOne: fetchPurchaseOrder,
  createOne: createPurchaseOrder,
  updateOne: updatePurchaseOrder,
  removeOne: removePurchaseOrder,
  receive: receivePurchaseOrder,
} = slice.thunks;

export const {
  selectAll: selectPurchaseOrders,
  selectListLoading: selectPurchaseOrdersLoading,
  selectListError: selectPurchaseOrdersError,
  selectCurrent: selectPurchaseOrder,
  selectCurrentLoading: selectPurchaseOrderLoading,
  selectCurrentError: selectPurchaseOrderError,
} = slice.selectors;

export default slice.reducer;

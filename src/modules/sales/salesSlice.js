import { createResourceSlice } from '../../store/createResourceSlice';
import { salesService } from './sales.service';

/**
 * Sales-order Redux slice. Creating an order from an inquiry marks that inquiry
 * "converted" — that cross-module side effect is handled inside the service.
 */
const slice = createResourceSlice({ name: 'sales', service: salesService });

export const {
  fetchAll: fetchSalesOrders,
  fetchOne: fetchSalesOrder,
  createOne: createSalesOrder,
  updateOne: updateSalesOrder,
  removeOne: removeSalesOrder,
} = slice.thunks;

export const {
  selectAll: selectSalesOrders,
  selectListLoading: selectSalesOrdersLoading,
  selectListError: selectSalesOrdersError,
  selectCurrent: selectSalesOrder,
  selectCurrentLoading: selectSalesOrderLoading,
  selectCurrentError: selectSalesOrderError,
} = slice.selectors;

export default slice.reducer;
